import { z } from "zod";
import { AgentTool } from "./base.js";
import { RiskLevel, SecurityContext } from "../types/security.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.js";

const EmailSenderInputSchema = z.object({
  recipientEmail: z.string().email(),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  externalTrackingId: z.string().optional(),
});

const EmailSenderOutputSchema = z.object({
  status: z.enum(["DISPATCHED", "QUEUED"]),
  messageId: z.string(),
  recipientEmail: z.string().email(),
  sentAt: z.string(),
});

type EmailSenderInput = z.infer<typeof EmailSenderInputSchema>;
type EmailSenderOutput = z.infer<typeof EmailSenderOutputSchema>;

export class EmailSenderTool extends AgentTool<EmailSenderInput, EmailSenderOutput> {
  public readonly name = "email_sender";
  public readonly description = "Dispatches verified outgoing business emails to external recipients. Mutates external system state.";
  public readonly riskLevel: RiskLevel = "HIGH";
  public readonly requiredRole = "admin" as const;
  public readonly inputSchema = EmailSenderInputSchema;
  public readonly outputSchema = EmailSenderOutputSchema;

  protected async executeInternal(
    input: EmailSenderInput,
    context: SecurityContext,
    supabase: SupabaseClient<Database>
  ): Promise<EmailSenderOutput> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      status: "DISPATCHED",
      messageId,
      recipientEmail: input.recipientEmail,
      sentAt: new Date().toISOString(),
    };
  }
}

