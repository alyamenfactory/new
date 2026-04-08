import { Router, type IRouter } from "express";
import { db, salesOrdersTable, salesOrderItemsTable, productsTable, customersTable } from "@workspace/db";
import { eq, desc, ilike, sum, count } from "drizzle-orm";
import {
  CreateSalesOrderBody,
  UpdateSalesOrderBody,
  GetSalesOrderParams,
  UpdateSalesOrderParams,
  DeleteSalesOrderParams,
  ListSalesOrdersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatOrder(
  order: typeof salesOrdersTable.$inferSelect,
  items: (typeof salesOrderItemsTable.$inferSelect)[],
) {
  return {
    ...order,
    totalAmount: parseFloat(order.totalAmount ?? "0"),
    discount: parseFloat(order.discount ?? "0"),
    paidAmount: parseFloat(order.paidAmount ?? "0"),
    createdAt: order.createdAt.toISOString(),
    items: items.map((i) => ({
      ...i,
      quantity: parseFloat(i.quantity ?? "0"),
      unitPrice: parseFloat(i.unitPrice ?? "0"),
      total: parseFloat(i.total ?? "0"),
    })),
  };
}

router.get("/sales/summary", async (_req, res): Promise<void> => {
  const orders = await db.select().from(salesOrdersTable);
  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.totalAmount ?? "0"), 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const delivered = orders.filter((o) => o.status === "delivered").length;

  const customerTotals: Record<number, { name: string; amount: number; count: number }> = {};
  for (const o of orders) {
    if (o.customerId) {
      if (!customerTotals[o.customerId]) {
        customerTotals[o.customerId] = { name: o.customerName ?? "", amount: 0, count: 0 };
      }
      customerTotals[o.customerId].amount += parseFloat(o.totalAmount ?? "0");
      customerTotals[o.customerId].count++;
    }
  }
  const topCustomers = Object.entries(customerTotals)
    .map(([id, v]) => ({ customerId: parseInt(id), customerName: v.name, totalAmount: v.amount, orderCount: v.count }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  res.json({
    totalOrders: orders.length,
    totalRevenue,
    pendingOrders: pending,
    deliveredOrders: delivered,
    topCustomers,
  });
});

router.get("/sales", async (req, res): Promise<void> => {
  const query = ListSalesOrdersQueryParams.safeParse(req.query);
  let rows = await db.select().from(salesOrdersTable).orderBy(desc(salesOrdersTable.createdAt));
  if (query.success && query.data.status) {
    rows = rows.filter((r) => r.status === query.data.status);
  }
  if (query.success && query.data.search) {
    const s = query.data.search.toLowerCase();
    rows = rows.filter((r) => r.orderNumber.toLowerCase().includes(s) || (r.customerName?.toLowerCase().includes(s)));
  }
  const result = [];
  for (const order of rows) {
    const items = await db.select().from(salesOrderItemsTable).where(eq(salesOrderItemsTable.orderId, order.id));
    result.push(formatOrder(order, items));
  }
  res.json(result);
});

router.post("/sales", async (req, res): Promise<void> => {
  const parsed = CreateSalesOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { items, discount, paidAmount, customerId, customerName, notes } = parsed.data;
  const totalAmount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0) - (discount ?? 0);
  const orderNumber = `SO-${Date.now()}`;
  const [order] = await db
    .insert(salesOrdersTable)
    .values({
      orderNumber,
      customerId: customerId ?? null,
      customerName: customerName ?? null,
      status: "pending",
      totalAmount: String(totalAmount),
      discount: String(discount ?? 0),
      paidAmount: String(paidAmount ?? 0),
      notes: notes ?? null,
    })
    .returning();

  const insertedItems = [];
  for (const item of items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    const [insertedItem] = await db
      .insert(salesOrderItemsTable)
      .values({
        orderId: order.id,
        productId: item.productId,
        productName: product?.name ?? "Unknown",
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        total: String(item.quantity * item.unitPrice),
      })
      .returning();
    insertedItems.push(insertedItem);
    if (product) {
      const newStock = parseFloat(product.stockQuantity ?? "0") - item.quantity;
      await db
        .update(productsTable)
        .set({ stockQuantity: String(Math.max(0, newStock)) })
        .where(eq(productsTable.id, item.productId));
    }
  }
  res.status(201).json(formatOrder(order, insertedItems));
});

router.get("/sales/:id", async (req, res): Promise<void> => {
  const params = GetSalesOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [order] = await db.select().from(salesOrdersTable).where(eq(salesOrdersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Sales order not found" });
    return;
  }
  const items = await db.select().from(salesOrderItemsTable).where(eq(salesOrderItemsTable.orderId, order.id));
  res.json(formatOrder(order, items));
});

router.put("/sales/:id", async (req, res): Promise<void> => {
  const params = UpdateSalesOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSalesOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, string> = { status: parsed.data.status };
  if (parsed.data.paidAmount !== undefined) {
    updateData.paidAmount = String(parsed.data.paidAmount);
  }
  const [order] = await db
    .update(salesOrdersTable)
    .set(updateData)
    .where(eq(salesOrdersTable.id, params.data.id))
    .returning();
  if (!order) {
    res.status(404).json({ error: "Sales order not found" });
    return;
  }
  const items = await db.select().from(salesOrderItemsTable).where(eq(salesOrderItemsTable.orderId, order.id));
  res.json(formatOrder(order, items));
});

router.delete("/sales/:id", async (req, res): Promise<void> => {
  const params = DeleteSalesOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(salesOrderItemsTable).where(eq(salesOrderItemsTable.orderId, params.data.id));
  const [row] = await db.delete(salesOrdersTable).where(eq(salesOrdersTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Sales order not found" });
    return;
  }
  res.json({ message: "Deleted" });
});

export default router;
