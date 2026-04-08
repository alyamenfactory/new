import { Router, type IRouter } from "express";
import {
  db,
  salesOrdersTable,
  purchaseOrdersTable,
  customersTable,
  productsTable,
  employeesTable,
  transactionsTable,
} from "@workspace/db";
import { desc, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const [customers] = await db.select({ count: sql<number>`count(*)` }).from(customersTable);
  const [products] = await db.select({ count: sql<number>`count(*)` }).from(productsTable);
  const [employees] = await db.select({ count: sql<number>`count(*)` }).from(employeesTable);
  const salesOrders = await db.select().from(salesOrdersTable);
  const purchaseOrders = await db.select().from(purchaseOrdersTable);
  const transactions = await db.select().from(transactionsTable);

  const totalSales = salesOrders.reduce((s, o) => s + parseFloat(o.totalAmount ?? "0"), 0);
  const totalPurchases = purchaseOrders.reduce((s, o) => s + parseFloat(o.totalAmount ?? "0"), 0);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyRevenue = transactions
    .filter((t) => t.type === "income" && t.date.startsWith(currentMonth))
    .reduce((s, t) => s + parseFloat(t.amount ?? "0"), 0);
  const monthlyExpenses = transactions
    .filter((t) => t.type === "expense" && t.date.startsWith(currentMonth))
    .reduce((s, t) => s + parseFloat(t.amount ?? "0"), 0);

  const allProducts = await db.select().from(productsTable);
  const lowStockCount = allProducts.filter(
    (p) => parseFloat(p.stockQuantity ?? "0") <= parseFloat(p.minStockLevel ?? "0"),
  ).length;

  res.json({
    totalSales,
    totalPurchases,
    totalCustomers: Number(customers.count),
    totalProducts: Number(products.count),
    totalEmployees: Number(employees.count),
    lowStockCount,
    monthlyRevenue,
    monthlyExpenses,
    pendingSalesOrders: salesOrders.filter((o) => o.status === "pending").length,
    pendingPurchaseOrders: purchaseOrders.filter((o) => o.status === "pending").length,
  });
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const sales = await db.select().from(salesOrdersTable).orderBy(desc(salesOrdersTable.createdAt)).limit(5);
  const purchases = await db
    .select()
    .from(purchaseOrdersTable)
    .orderBy(desc(purchaseOrdersTable.createdAt))
    .limit(5);

  const activities = [
    ...sales.map((o) => ({
      id: o.id,
      type: "sale",
      description: `Sales order ${o.orderNumber} - ${o.customerName ?? "Walk-in"}`,
      amount: parseFloat(o.totalAmount ?? "0"),
      createdAt: o.createdAt.toISOString(),
    })),
    ...purchases.map((o) => ({
      id: o.id + 10000,
      type: "purchase",
      description: `Purchase order ${o.orderNumber} - ${o.supplierName ?? "Supplier"}`,
      amount: parseFloat(o.totalAmount ?? "0"),
      createdAt: o.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);

  res.json(activities);
});

router.get("/dashboard/monthly-sales", async (_req, res): Promise<void> => {
  const sales = await db.select().from(salesOrdersTable);
  const purchases = await db.select().from(purchaseOrdersTable);

  const monthlyMap: Record<string, { sales: number; purchases: number }> = {};
  for (const o of sales) {
    const month = o.createdAt.toISOString().slice(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { sales: 0, purchases: 0 };
    monthlyMap[month].sales += parseFloat(o.totalAmount ?? "0");
  }
  for (const o of purchases) {
    const month = o.createdAt.toISOString().slice(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { sales: 0, purchases: 0 };
    monthlyMap[month].purchases += parseFloat(o.totalAmount ?? "0");
  }

  const result = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, v]) => ({ month, ...v }));

  res.json(result);
});

export default router;
