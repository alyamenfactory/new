import { Router, type IRouter } from "express";
import { db, transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  CreateTransactionBody,
  DeleteTransactionParams,
  ListTransactionsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function formatTransaction(r: typeof transactionsTable.$inferSelect) {
  return {
    ...r,
    amount: parseFloat(r.amount ?? "0"),
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/transactions/balance", async (_req, res): Promise<void> => {
  const rows = await db.select().from(transactionsTable);
  const totalIncome = rows
    .filter((r) => r.type === "income")
    .reduce((s, r) => s + parseFloat(r.amount ?? "0"), 0);
  const totalExpenses = rows
    .filter((r) => r.type === "expense")
    .reduce((s, r) => s + parseFloat(r.amount ?? "0"), 0);

  const monthlyMap: Record<string, { income: number; expenses: number }> = {};
  for (const r of rows) {
    const month = r.date.slice(0, 7);
    if (!monthlyMap[month]) monthlyMap[month] = { income: 0, expenses: 0 };
    if (r.type === "income") monthlyMap[month].income += parseFloat(r.amount ?? "0");
    else monthlyMap[month].expenses += parseFloat(r.amount ?? "0");
  }
  const monthlyBreakdown = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, ...v }));

  res.json({ totalIncome, totalExpenses, netBalance: totalIncome - totalExpenses, monthlyBreakdown });
});

router.get("/transactions", async (req, res): Promise<void> => {
  const query = ListTransactionsQueryParams.safeParse(req.query);
  let rows = await db.select().from(transactionsTable).orderBy(desc(transactionsTable.createdAt));
  if (query.success && query.data.type) {
    rows = rows.filter((r) => r.type === query.data.type);
  }
  if (query.success && query.data.search) {
    const s = query.data.search.toLowerCase();
    rows = rows.filter(
      (r) => r.description.toLowerCase().includes(s) || r.category.toLowerCase().includes(s),
    );
  }
  res.json(rows.map(formatTransaction));
});

router.post("/transactions", async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(transactionsTable)
    .values({ ...parsed.data, amount: String(parsed.data.amount) })
    .returning();
  res.status(201).json(formatTransaction(row));
});

router.delete("/transactions/:id", async (req, res): Promise<void> => {
  const params = DeleteTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db.delete(transactionsTable).where(eq(transactionsTable.id, params.data.id)).returning();
  if (!row) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  res.json({ message: "Deleted" });
});

export default router;
