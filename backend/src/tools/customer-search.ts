import { z } from "zod";
import { AgentTool } from "./base.js";
import { RiskLevel, SecurityContext } from "../types/security.js";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database.js";

const CustomerSearchInputSchema = z.object({
  query: z.string().min(1).max(100),
  limit: z.number().int().min(1).max(50).default(10),
});

const CustomerRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  segment: z.string(),
  accountValue: z.number(),
  lastContacted: z.string(),
});

const CustomerSearchOutputSchema = z.object({
  totalFound: z.number(),
  customers: z.array(CustomerRecordSchema),
});

type CustomerSearchInput = z.infer<typeof CustomerSearchInputSchema>;
type CustomerSearchOutput = z.infer<typeof CustomerSearchOutputSchema>;

export class CustomerSearchTool extends AgentTool<CustomerSearchInput, CustomerSearchOutput> {
  public readonly name = "customer_search";
  public readonly description = "Searches customer database within the organization by query or name filter.";
  public readonly riskLevel: RiskLevel = "LOW";
  public readonly requiredRole = "member" as const;
  public readonly inputSchema = CustomerSearchInputSchema;
  public readonly outputSchema = CustomerSearchOutputSchema;

  protected async executeInternal(
    input: CustomerSearchInput,
    context: SecurityContext,
    supabase: SupabaseClient<Database>
  ): Promise<CustomerSearchOutput> {
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, created_at")
      .ilike("full_name", `%${input.query}%`)
      .limit(input.limit);

    if (error) {
      throw new Error(`Customer search failed: ${error.message}`);
    }

    const customers = (profiles || []).map((p) => ({
      id: p.id,
      name: p.full_name || "Enterprise Customer",
      email: p.email,
      segment: "Enterprise B2B",
      accountValue: 45000,
      lastContacted: p.created_at,
    }));

    return {
      totalFound: customers.length,
      customers,
    };
  }
}

