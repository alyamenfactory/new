import { Router, type IRouter } from "express";
import { db, purchaseOrdersTable, purchaseOrderItemsTable, productsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreatePurchaseOrderBody,
  UpdatePurchaseOrderBody,
  GetPurchaseOrderParams,
  UpdatePurchaseOrderParams,
  DeletePurchaseOrderParams,
  ListPurchaseOrdersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatOrder(
  order: typeof purchaseOrdersTable.$inferSelect,
  items: (typeof purchaseOrderItemsTable.$inferSelect)[],
) {
  return {
    ...order,
    totalAmount: parseFloat(order.totalAmount ?? "0"),
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

router.get("/purchases", async (req, res): Promise<void> => {
  const query = ListPurchaseOrdersQueryParams.safeParse(req.query);
  let rows = await db.select().from(purchaseOrdersTable).orderBy(desc(purchaseOrdersTable.createdAt));
  if (query.success && query.data.status) {
    rows = rows.filter((r) => r.status === query.data.status);
  }
  if (query.success && query.data.search) {
    const s = query.data.search.toLowerCase();
    rows = rows.filter((r) => r.orderNumber.toLowerCase().includes(s) || (r.supplierName?.toLowerCase().includes(s)));
  }
  const result = [];
  for (const order of rows) {
    const items = await db
      .select()
      .from(purchaseOrderItemsTable)
      .where(eq(purchaseOrderItemsTable.orderId, order.id));
    result.push(formatOrder(order, items));
  }
  res.json(result);
});

router.post("/purchases", async (req, res): Promise<void> => {
  const parsed = CreatePurchaseOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { items, paidAmount, supplierId, supplierName, notes } = parsed.data;
  const totalAmount = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const orderNumber = `PO-${Date.now()}`;
  const [order] = await db
    .insert(purchaseOrdersTable)
    .values({
      orderNumber,
      supplierId: supplierId ?? null,
      supplierName: supplierName ?? null,
      status: "pending",
      totalAmount: String(totalAmount),
      paidAmount: String(paidAmount ?? 0),
      notes: notes ?? null,
    })
    .returning();

  const insertedItems = [];
  for (const item of items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    const [insertedItem] = await db
      .insert(purchaseOrderItemsTable)
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
  }
  res.status(201).json(formatOrder(order, insertedItems));
});

router.get("/purchases/:id", async (req, res): Promise<void> => {
  const params = GetPurchaseOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [order] = await db.select().from(purchaseOrdersTable).where(eq(purchaseOrdersTable.id, params.data.id));
  if (!order) {
    res.status(404).json({ error: "Purchase order not found" });
    return;
  }
  const items = await db
    .select()
    .from(purchaseOrderItemsTable)
    .where(eq(purchaseOrderItemsTable.orderId, order.id));
  res.json(formatOrder(order, items));
});

router.put("/purchases/:id", async (req, res): Promise<void> => {
  const params = UpdatePurchaseOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdatePurchaseOrderBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Record<string, string> = { status: parsed.data.status };
  if (parsed.data.paidAmount !== undefined) {
    updateData.paidAmount = String(parsed.data.paidAmount);
  }
  if (parsed.data.status === "received") {
    const items = await db
      .select()
      .from(purchaseOrderItemsTable)
      .where(eq(purchaseOrderItemsTable.orderId, params.data.id));
    for (const item of items) {
      const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
      if (product) {
        const newStock = parseFloat(product.stockQuantity ?? "0") + parseFloat(item.quantity ?? "0");
        await db
          .update(productsTable)
          .set({ stockQuantity: String(newStock) })
          .where(eq(productsTable.id, item.productId));
      }
    }
  }
  const [order] = await db
    .update(purchaseOrdersTable)
    .set(updateData)
    .where(eq(purchaseOrdersTable.id, params.data.id))
    .returning();
  if (!order) {
    res.status(404).json({ error: "Purchase order not found" });
    return;
  }
  const items = await db
    .select()
    .from(purchaseOrderItemsTable)
    .where(eq(purchaseOrderItemsTable.orderId, order.id));
  res.json(formatOrder(order, items));
});

router.delete("/purchases/:id", async (req, res): Promise<void> => {
  const params = DeletePurchaseOrderParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(purchaseOrderItemsTable).where(eq(purchaseOrderItemsTable.orderId, params.data.id));
  const [row] = await db.delete(purchaseOrdersTable).where(eq(purchaseOrdersTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Purchase order not found" });
    return;
  }
  res.json({ message: "Deleted" });
});

export default router;
