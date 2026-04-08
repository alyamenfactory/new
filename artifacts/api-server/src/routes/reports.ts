import { Router, type IRouter } from "express";
import {
  db,
  salesOrdersTable,
  salesOrderItemsTable,
  purchaseOrdersTable,
  productsTable,
  employeesTable,
  attendanceTable,
  payrollTable,
} from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { GetSalesReportQueryParams, GetHrReportQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reports/sales", async (req, res): Promise<void> => {
  const query = GetSalesReportQueryParams.safeParse(req.query);
  const period = (query.success && query.data.period) ? query.data.period : "month";

  const orders = await db.select().from(salesOrdersTable).orderBy(desc(salesOrdersTable.createdAt));
  const totalRevenue = orders.reduce((s, o) => s + parseFloat(o.totalAmount ?? "0"), 0);
  const averageOrderValue = orders.length ? totalRevenue / orders.length : 0;

  const salesByStatus = [
    { status: "pending", count: orders.filter((o) => o.status === "pending").length },
    { status: "confirmed", count: orders.filter((o) => o.status === "confirmed").length },
    { status: "delivered", count: orders.filter((o) => o.status === "delivered").length },
    { status: "cancelled", count: orders.filter((o) => o.status === "cancelled").length },
  ];

  const allItems = await db.select().from(salesOrderItemsTable);
  const productMap: Record<number, { name: string; totalSold: number; revenue: number }> = {};
  for (const item of allItems) {
    if (!productMap[item.productId]) {
      productMap[item.productId] = { name: item.productName, totalSold: 0, revenue: 0 };
    }
    productMap[item.productId].totalSold += parseFloat(item.quantity ?? "0");
    productMap[item.productId].revenue += parseFloat(item.total ?? "0");
  }
  const topProducts = Object.entries(productMap)
    .map(([id, v]) => ({ productId: parseInt(id), productName: v.name, totalSold: v.totalSold, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  res.json({ period, totalRevenue, totalOrders: orders.length, averageOrderValue, topProducts, salesByStatus });
});

router.get("/reports/inventory", async (_req, res): Promise<void> => {
  const products = await db.select().from(productsTable);
  const totalStockValue = products.reduce(
    (s, p) => s + parseFloat(p.stockQuantity ?? "0") * parseFloat(p.costPrice ?? "0"),
    0,
  );
  const lowStockItems = products.filter(
    (p) => parseFloat(p.stockQuantity ?? "0") <= parseFloat(p.minStockLevel ?? "0") && parseFloat(p.stockQuantity ?? "0") > 0,
  ).length;
  const outOfStockItems = products.filter((p) => parseFloat(p.stockQuantity ?? "0") === 0).length;

  const categoryMap: Record<string, { count: number; value: number }> = {};
  for (const p of products) {
    const cat = p.category ?? "Uncategorized";
    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, value: 0 };
    categoryMap[cat].count++;
    categoryMap[cat].value += parseFloat(p.stockQuantity ?? "0") * parseFloat(p.costPrice ?? "0");
  }
  const categoryBreakdown = Object.entries(categoryMap).map(([category, v]) => ({
    category,
    productCount: v.count,
    totalValue: v.value,
  }));

  res.json({
    totalProducts: products.length,
    totalStockValue,
    lowStockItems,
    outOfStockItems,
    categoryBreakdown,
  });
});

router.get("/reports/hr", async (req, res): Promise<void> => {
  const query = GetHrReportQueryParams.safeParse(req.query);
  const month = (query.success && query.data.month) ? query.data.month : new Date().toISOString().slice(0, 7);

  const employees = await db.select().from(employeesTable);
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((e) => e.status === "active").length;

  const payroll = await db.select().from(payrollTable);
  const monthPayroll = payroll.filter((p) => p.month === month);
  const totalPayroll = monthPayroll.reduce((s, p) => s + parseFloat(p.netSalary ?? "0"), 0);

  const attendance = await db.select().from(attendanceTable);
  const monthAttendance = attendance.filter((a) => a.date.startsWith(month));
  const attendanceSummary = {
    present: monthAttendance.filter((a) => a.status === "present").length,
    absent: monthAttendance.filter((a) => a.status === "absent").length,
    late: monthAttendance.filter((a) => a.status === "late").length,
    halfDay: monthAttendance.filter((a) => a.status === "half_day").length,
  };

  const deptMap: Record<string, number> = {};
  for (const e of employees) {
    const dept = e.department ?? "Unassigned";
    deptMap[dept] = (deptMap[dept] ?? 0) + 1;
  }
  const departmentBreakdown = Object.entries(deptMap).map(([department, count]) => ({ department, count }));

  res.json({
    month,
    totalEmployees,
    activeEmployees,
    totalPayroll,
    attendanceSummary,
    departmentBreakdown,
  });
});

export default router;
