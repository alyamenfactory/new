import { Router, type IRouter } from "express";
import { db, productsTable } from "@workspace/db";
import { eq, ilike, lte, sql } from "drizzle-orm";
import {
  CreateProductBody,
  UpdateProductBody,
  GetProductParams,
  UpdateProductParams,
  DeleteProductParams,
  ListProductsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatProduct(r: typeof productsTable.$inferSelect) {
  return {
    ...r,
    unitPrice: parseFloat(r.unitPrice ?? "0"),
    costPrice: parseFloat(r.costPrice ?? "0"),
    stockQuantity: parseFloat(r.stockQuantity ?? "0"),
    minStockLevel: parseFloat(r.minStockLevel ?? "0"),
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/products/low-stock", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(productsTable)
    .where(
      sql`CAST(${productsTable.stockQuantity} AS numeric) <= CAST(${productsTable.minStockLevel} AS numeric)`,
    )
    .orderBy(productsTable.name);
  res.json(rows.map(formatProduct));
});

router.get("/products", async (req, res): Promise<void> => {
  const query = ListProductsQueryParams.safeParse(req.query);
  let rows;
  if (query.success && query.data.search) {
    rows = await db
      .select()
      .from(productsTable)
      .where(ilike(productsTable.name, `%${query.data.search}%`))
      .orderBy(productsTable.name);
  } else if (query.success && query.data.category) {
    rows = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.category, query.data.category))
      .orderBy(productsTable.name);
  } else {
    rows = await db.select().from(productsTable).orderBy(productsTable.name);
  }
  res.json(rows.map(formatProduct));
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(productsTable)
    .values({
      ...parsed.data,
      unitPrice: String(parsed.data.unitPrice),
      costPrice: String(parsed.data.costPrice),
      stockQuantity: String(parsed.data.stockQuantity),
      minStockLevel: String(parsed.data.minStockLevel),
    })
    .returning();
  res.status(201).json(formatProduct(row));
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const params = GetProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.select().from(productsTable).where(eq(productsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(formatProduct(row));
});

router.put("/products/:id", async (req, res): Promise<void> => {
  const params = UpdateProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(productsTable)
    .set({
      ...parsed.data,
      unitPrice: parsed.data.unitPrice !== undefined ? String(parsed.data.unitPrice) : undefined,
      costPrice: parsed.data.costPrice !== undefined ? String(parsed.data.costPrice) : undefined,
      stockQuantity: parsed.data.stockQuantity !== undefined ? String(parsed.data.stockQuantity) : undefined,
      minStockLevel: parsed.data.minStockLevel !== undefined ? String(parsed.data.minStockLevel) : undefined,
    })
    .where(eq(productsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(formatProduct(row));
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const params = DeleteProductParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.delete(productsTable).where(eq(productsTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ message: "Deleted" });
});

export default router;
