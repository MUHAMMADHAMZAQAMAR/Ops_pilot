export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AgentRunStatus = "PENDING" | "RUNNING" | "WAITING_APPROVAL" | "COMPLETED" | "FAILED" | "CANCELLED";
export type TaskStatus = "PENDING" | "RUNNING" | "WAITING_APPROVAL" | "COMPLETED" | "FAILED" | "SKIPPED";

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      organization_members: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
      business_requests: {
        Row: {
          id: string;
          org_id: string;
          user_id: string;
          raw_prompt: string;
          sanitized_prompt: string;
          category: string;
          priority: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id: string;
          raw_prompt: string;
          sanitized_prompt: string;
          category?: string;
          priority?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string;
          raw_prompt?: string;
          sanitized_prompt?: string;
          category?: string;
          priority?: string;
          status?: string;
          created_at?: string;
        };
      };
      agent_runs: {
        Row: {
          id: string;
          request_id: string;
          org_id: string;
          status: AgentRunStatus;
          current_step_id: string | null;
          execution_graph_json: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          org_id: string;
          status?: AgentRunStatus;
          current_step_id?: string | null;
          execution_graph_json?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          org_id?: string;
          status?: AgentRunStatus;
          current_step_id?: string | null;
          execution_graph_json?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          run_id: string;
          org_id: string;
          title: string;
          description: string | null;
          risk_level: RiskLevel;
          status: TaskStatus;
          dependency_ids: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          org_id: string;
          title: string;
          description?: string | null;
          risk_level?: RiskLevel;
          status?: TaskStatus;
          dependency_ids?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          org_id?: string;
          title?: string;
          description?: string | null;
          risk_level?: RiskLevel;
          status?: TaskStatus;
          dependency_ids?: Json;
          created_at?: string;
        };
      };
      tool_executions: {
        Row: {
          id: string;
          task_id: string;
          org_id: string;
          tool_name: string;
          input_payload: Json;
          output_payload: Json | null;
          execution_time_ms: number | null;
          status: string;
          idempotency_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          org_id: string;
          tool_name: string;
          input_payload: Json;
          output_payload?: Json | null;
          execution_time_ms?: number | null;
          status?: string;
          idempotency_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          org_id?: string;
          tool_name?: string;
          input_payload?: Json;
          output_payload?: Json | null;
          execution_time_ms?: number | null;
          status?: string;
          idempotency_key?: string;
          created_at?: string;
        };
      };
      approvals: {
        Row: {
          id: string;
          run_id: string;
          task_id: string;
          org_id: string;
          approver_id: string | null;
          token_hash: string;
          status: ApprovalStatus;
          decision_notes: string | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          run_id: string;
          task_id: string;
          org_id: string;
          approver_id?: string | null;
          token_hash: string;
          status?: ApprovalStatus;
          decision_notes?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          run_id?: string;
          task_id?: string;
          org_id?: string;
          approver_id?: string | null;
          token_hash?: string;
          status?: ApprovalStatus;
          decision_notes?: string | null;
          created_at?: string;
          resolved_at?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          org_id: string;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string;
          metadata_json: Json;
          previous_hash: string | null;
          current_hash: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id: string;
          metadata_json?: Json;
          previous_hash?: string | null;
          current_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          user_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string;
          metadata_json?: Json;
          previous_hash?: string | null;
          current_hash?: string;
          created_at?: string;
        };
      };
    };
  };
}

