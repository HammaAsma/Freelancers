import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import DashboardController from "../controllers/dashboard.contoller.js";

const router = Router();

router.use(authenticate);

router.get("/", DashboardController.getDashboard);

export default router;
