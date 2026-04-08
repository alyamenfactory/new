import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import customersRouter from "./customers";
import suppliersRouter from "./suppliers";
import productsRouter from "./products";
import salesRouter from "./sales";
import purchasesRouter from "./purchases";
import employeesRouter from "./employees";
import attendanceRouter from "./attendance";
import payrollRouter from "./payroll";
import transactionsRouter from "./transactions";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(customersRouter);
router.use(suppliersRouter);
router.use(productsRouter);
router.use(salesRouter);
router.use(purchasesRouter);
router.use(employeesRouter);
router.use(attendanceRouter);
router.use(payrollRouter);
router.use(transactionsRouter);
router.use(dashboardRouter);
router.use(reportsRouter);

export default router;
