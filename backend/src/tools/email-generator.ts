import { z } from "zod";
import { AgentTool } from "./base.js";
import { RiskLevel, SecurityContext } from "../types/security.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.js";

const EmailGeneratorInputSchema = z.object({
  recipientName: z.string().min(1),
  recipientEmail: z.string().email(),
  topic: z.string().min(3),
  tone: z.enum(["professional", "urgent", "consultative", "executive"]).default("professional"),
  keyPoints: z.array(z.string()).min(1),
});

const EmailGeneratorOutputSchema = z.object({
  recipientEmail: z.string().email(),
  subject: z.string().min(1),
  bodyPlain: z.string().min(1),
  bodyHtml: z.string().min(1),
  generatedAt: z.string(),
});

type EmailGeneratorInput = z.infer<typeof EmailGeneratorInputSchema>;
type EmailGeneratorOutput = z.infer<typeof EmailGeneratorOutputSchema>;

export class EmailGeneratorTool extends AgentTool<EmailGeneratorInput, EmailGeneratorOutput> {
  public readonly name = "email_generator";
  public readonly description = "Drafts compliant, formatted executive business emails ready for review.";
  public readonly riskLevel: RiskLevel = "MEDIUM";
  public readonly requiredRole = "member" as const;
  public readonly inputSchema = EmailGeneratorInputSchema;
  public readonly outputSchema = EmailGeneratorOutputSchema;

  protected async executeInternal(
    input: EmailGeneratorInput,
    context: SecurityContext,
    supabase: SupabaseClient<Database>
  ): Promise<EmailGeneratorOutput> {
    const subject = `Strategic Update: ${input.topic}`;
    const pointsList = input.keyPoints.map((pt) => `• ${pt}`).join("\n");

    const bodyPlain = `Dear ${input.recipientName},\n\nRegarding our recent review of ${input.topic}:\n\n${pointsList}\n\nPlease let us know if you require any adjustments.\n\nSincerely,\nEnterprise Operations Team`;

    const bodyHtml = `<p>Dear ${input.recipientName},</p><p>Regarding our recent review of <strong>${input.topic}</strong>:</p><ul>${input.keyPoints.map((pt) => `<li>${pt}</li>`).join("")}</ul><p>Please let us know if you require any adjustments.</p><p>Sincerely,<br/><strong>Enterprise Operations Team</strong></p>`;

    return {
      recipientEmail: input.recipientEmail,
      subject,
      bodyPlain,
      bodyHtml,
      generatedAt: new Date().toISOString(),
    };
  }
}

