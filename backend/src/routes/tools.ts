import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/auth.js";
import { CustomerSearchTool } from "../tools/customer-search.js";
import { SalesAnalyzerTool } from "../tools/sales-analyzer.js";
import { EmailGeneratorTool } from "../tools/email-generator.js";
import { EmailSenderTool } from "../tools/email-sender.js";

export const toolsRouter = Router();

const tools = [
  new CustomerSearchTool(),
  new SalesAnalyzerTool(),
  new EmailGeneratorTool(),
  new EmailSenderTool(),
];

// GET /api/v1/tools - Registry metadata and permissions matrix
toolsRouter.get("/", authenticate, (req: Request, res: Response) => {
  const metadata = tools.map((t) => ({
    name: t.name,
    description: t.description,
    riskLevel: t.riskLevel,
    requiredRole: t.requiredRole,
    mutation: t.riskLevel === "HIGH" || t.riskLevel === "CRITICAL",
  }));

  res.json({ tools: metadata });
});

