import { Router, type IRouter } from "express";
import { db, suppliersTable } from "@workspace/db";
import { eq, ilike } from "drizzle-orm";
import {
  CreateSupplierBody,
  UpdateSupplierBody,
  GetSupplierParams,
  UpdateSupplierParams,
  DeleteSupplierParams,
  ListSuppliersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/suppliers", async (req, res): Promise<void> => {
  const query = ListSuppliersQueryParams.safeParse(req.query);
  let rows;
  if (query.success && query.data.search) {
    rows = await db
      .select()
      .from(suppliersTable)
      .where(ilike(suppliersTable.name, `%${query.data.search}%`))
      .orderBy(suppliersTable.createdAt);
  } else {
    rows = await db.select().from(suppliersTable).orderBy(suppliersTable.createdAt);
  }
  res.json(
    rows.map((r) => ({
      ...r,
      balance: parseFloat(r.balance ?? "0"),
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

router.post("/suppliers", async (req, res): Promise<void> => {
  const parsed = CreateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(suppliersTable).values(parsed.data).returning();
  res.status(201).json({
    ...row,
    balance: parseFloat(row.balance ?? "0"),
    createdAt: row.createdAt.toISOString(),
  });
});

router.get("/suppliers/:id", async (req, res): Promise<void> => {
  const params = GetSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(suppliersTable).where(eq(suppliersTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }
  res.json({
    ...row,
    balance: parseFloat(row.balance ?? "0"),
    createdAt: row.createdAt.toISOString(),
  });
});

router.put("/suppliers/:id", async (req, res): Promise<void> => {
  const params = UpdateSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateSupplierBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(suppliersTable)
    .set(parsed.data)
    .where(eq(suppliersTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }
  res.json({
    ...row,
    balance: parseFloat(row.balance ?? "0"),
    createdAt: row.createdAt.toISOString(),
  });
});

router.delete("/suppliers/:id", async (req, res): Promise<void> => {
  const params = DeleteSupplierParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.delete(suppliersTable).where(eq(suppliersTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Supplier not found" });
    return;
  }
  res.json({ message: "Deleted" });
});

export default router;
