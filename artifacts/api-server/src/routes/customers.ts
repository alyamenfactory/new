import { Router, type IRouter } from "express";
import { db, customersTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";
import {
  CreateCustomerBody,
  UpdateCustomerBody,
  GetCustomerParams,
  UpdateCustomerParams,
  DeleteCustomerParams,
  ListCustomersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/customers", async (req, res): Promise<void> => {
  const query = ListCustomersQueryParams.safeParse(req.query);
  let rows;
  if (query.success && query.data.search) {
    rows = await db
      .select()
      .from(customersTable)
      .where(ilike(customersTable.name, `%${query.data.search}%`))
      .orderBy(customersTable.createdAt);
  } else {
    rows = await db.select().from(customersTable).orderBy(customersTable.createdAt);
  }
  res.json(
    rows.map((r) => ({
      ...r,
      balance: parseFloat(r.balance ?? "0"),
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/customers", async (req, res): Promise<void> => {
  const parsed = CreateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(customersTable).values(parsed.data).returning();
  res.status(201).json({
    ...row,
    balance: parseFloat(row.balance ?? "0"),
    createdAt: row.createdAt.toISOString(),
  });
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  const params = GetCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(customersTable).where(eq(customersTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json({
    ...row,
    balance: parseFloat(row.balance ?? "0"),
    createdAt: row.createdAt.toISOString(),
  });
});

router.put("/customers/:id", async (req, res): Promise<void> => {
  const params = UpdateCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCustomerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(customersTable)
    .set(parsed.data)
    .where(eq(customersTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json({
    ...row,
    balance: parseFloat(row.balance ?? "0"),
    createdAt: row.createdAt.toISOString(),
  });
});

router.delete("/customers/:id", async (req, res): Promise<void> => {
  const params = DeleteCustomerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.delete(customersTable).where(eq(customersTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Customer not found" });
    return;
  }
  res.json({ message: "Deleted" });
});

export default router;
