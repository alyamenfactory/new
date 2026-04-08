import { Router, type IRouter } from "express";
import { db, employeesTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";
import {
  CreateEmployeeBody,
  UpdateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  DeleteEmployeeParams,
  ListEmployeesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatEmployee(r: typeof employeesTable.$inferSelect) {
  return {
    ...r,
    salary: parseFloat(r.salary ?? "0"),
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/employees", async (req, res): Promise<void> => {
  const query = ListEmployeesQueryParams.safeParse(req.query);
  let rows;
  if (query.success && query.data.search) {
    rows = await db
      .select()
      .from(employeesTable)
      .where(ilike(employeesTable.name, `%${query.data.search}%`))
      .orderBy(employeesTable.name);
  } else if (query.success && query.data.department) {
    rows = await db
      .select()
      .from(employeesTable)
      .where(eq(employeesTable.department, query.data.department))
      .orderBy(employeesTable.name);
  } else {
    rows = await db.select().from(employeesTable).orderBy(employeesTable.name);
  }
  res.json(rows.map(formatEmployee));
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(employeesTable)
    .values({ ...parsed.data, salary: String(parsed.data.salary) })
    .returning();
  res.status(201).json(formatEmployee(row));
});

router.get("/employees/:id", async (req, res): Promise<void> => {
  const params = GetEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(employeesTable).where(eq(employeesTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json(formatEmployee(row));
});

router.put("/employees/:id", async (req, res): Promise<void> => {
  const params = UpdateEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(employeesTable)
    .set({
      ...parsed.data,
      salary: parsed.data.salary !== undefined ? String(parsed.data.salary) : undefined,
    })
    .where(eq(employeesTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json(formatEmployee(row));
});

router.delete("/employees/:id", async (req, res): Promise<void> => {
  const params = DeleteEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.delete(employeesTable).where(eq(employeesTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }
  res.json({ message: "Deleted" });
});

export default router;
