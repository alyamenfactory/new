import { Router, type IRouter } from "express";
import { db, payrollTable, employeesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreatePayrollBody,
  ListPayrollQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatPayroll(r: typeof payrollTable.$inferSelect) {
  return {
    ...r,
    basicSalary: parseFloat(r.basicSalary ?? "0"),
    bonus: parseFloat(r.bonus ?? "0"),
    deductions: parseFloat(r.deductions ?? "0"),
    netSalary: parseFloat(r.netSalary ?? "0"),
    paidAt: r.paidAt ? r.paidAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/payroll", async (req, res): Promise<void> => {
  const query = ListPayrollQueryParams.safeParse(req.query);
  let rows = await db.select().from(payrollTable).orderBy(payrollTable.month);
  if (query.success && query.data.month) {
    rows = rows.filter((r) => r.month === query.data.month);
  }
  res.json(rows.map(formatPayroll));
});

router.post("/payroll", async (req, res): Promise<void> => {
  const parsed = CreatePayrollBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, parsed.data.employeeId));
  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  const basicSalary = parseFloat(employee.salary ?? "0");
  const netSalary = basicSalary + parsed.data.bonus - parsed.data.deductions;
  const [row] = await db
    .insert(payrollTable)
    .values({
      employeeId: parsed.data.employeeId,
      employeeName: employee.name,
      month: parsed.data.month,
      basicSalary: String(basicSalary),
      bonus: String(parsed.data.bonus),
      deductions: String(parsed.data.deductions),
      netSalary: String(netSalary),
      status: "pending",
    })
    .returning();
  res.status(201).json(formatPayroll(row));
});

export default router;
