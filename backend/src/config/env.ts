import { z } from "zod";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const BackendEnvSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // Supabase
  SUPABASE_URL: z.string().url().describe("Supabase Project URL"),
  SUPABASE_ANON_KEY: z.string().min(1).describe("Supabase Anonymous API Key"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).describe("Supabase Service Role Key for Admin Tasks"),
  DATABASE_URL: z.string().min(1).describe("PostgreSQL Connection String"),

  // OpenAI
  OPENAI_API_KEY: z.string().min(1).describe("OpenAI API Key for Structured Outputs"),
  OPENAI_MODEL: z.string().default("gpt-4o-2024-08-06"),

  // Security & HITL
  APPROVAL_JWT_SECRET: z.string().min(32, "APPROVAL_JWT_SECRET must be at least 32 characters long"),
  APPROVAL_TOKEN_TTL_SECONDS: z.coerce.number().default(86400),
  FIREWALL_STRICT_MODE: z.preprocess(
    (val) => val === "true" || val === true || val === "1" || val === 1,
    z.boolean()
  ).default(true),
  FIREWALL_ENTROPY_THRESHOLD: z.coerce.number().default(5.5),

  // Upstash Redis (Optional for distributed rate-limiting & locks)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

export type BackendEnv = z.infer<typeof BackendEnvSchema>;

function validateEnv(): BackendEnv {
  const result = BackendEnvSchema.safeParse(process.env);
  if (!result.success) {
    const errorDetails = result.error.format();
    console.error("❌ CRITICAL: Invalid backend environment configuration:\n", JSON.stringify(errorDetails, null, 2));
    
    // Provide safe development fallback if in development, otherwise throw
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment configuration in production. Check logs for details.");
    }
  }

  // Fallback defaults for local dev / unconfigured environments
  return {
    PORT: Number(process.env.PORT) || 4000,
    NODE_ENV: (process.env.NODE_ENV as any) || "development",
    CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
    SUPABASE_URL: process.env.SUPABASE_URL || "https://your-project.supabase.co",
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "dummy-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy-service-role-key",
    DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || "dummy-openai-key",
    OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4o-2024-08-06",
    APPROVAL_JWT_SECRET: process.env.APPROVAL_JWT_SECRET || "default-zero-trust-secret-key-32-bytes-minimum!!",
    APPROVAL_TOKEN_TTL_SECONDS: Number(process.env.APPROVAL_TOKEN_TTL_SECONDS) || 86400,
    FIREWALL_STRICT_MODE: process.env.FIREWALL_STRICT_MODE !== "false",
    FIREWALL_ENTROPY_THRESHOLD: Number(process.env.FIREWALL_ENTROPY_THRESHOLD) || 5.5,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  };
}

export const env = validateEnv();

