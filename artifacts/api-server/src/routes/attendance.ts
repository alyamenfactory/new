import { Router, type IRouter } from "express";
import { db, attendanceTable, employeesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateAttendanceBody,
  ListAttendanceQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/attendance", async (req, res): Promise<void> => {
  const query = ListAttendanceQueryParams.safeParse(req.query);
  let rows = await db.select().from(attendanceTable).orderBy(attendanceTable.date);
  if (query.success && query.data.employeeId) {
    rows = rows.filter((r) => r.employeeId === query.data.employeeId);
  }
  if (query.success && query.data.month) {
    rows = rows.filter((r) => r.date.startsWith(query.data.month!));
  }
  res.json(rows);
});

router.post("/attendance", async (req, res): Promise<void> => {
  const parsed = CreateAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [employee] = await db.select().from(employeesTable).where(eq(employeesTable.id, parsed.data.employeeId));
  const [row] = await db
    .insert(attendanceTable)
    .values({
      ...parsed.data,
      employeeName: employee?.name ?? "Unknown",
    })
    .returning();
  res.status(201).json(row);
});

export default router;
