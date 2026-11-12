export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus = 'pending' | 'processing' | 'fulfilled' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type AgentRunStatus =
  | 'queued'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';
export type AgentStepStatus = 'pending' | 'running' | 'completed' | 'failed';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'executed';
export type DraftStatus = 'draft' | 'approved' | 'rejected';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          phone?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          sku: string;
          name: string;
          brand: string;
          category: string;
          price_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          brand: string;
          category: string;
          price_cents: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          name?: string;
          brand?: string;
          category?: string;
          price_cents?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      inventory: {
        Row: {
          id: string;
          product_id: string;
          stock_quantity: number;
          reorder_level: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          stock_quantity?: number;
          reorder_level?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          stock_quantity?: number;
          reorder_level?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          status: OrderStatus;
          total_cents: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          customer_id: string;
          status?: OrderStatus;
          total_cents: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_number?: string;
          customer_id?: string;
          status?: OrderStatus;
          total_cents?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          }
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price_cents: number;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price_cents: number;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price_cents?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey';
            columns: ['order_id'];
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'order_items_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          }
        ];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          status: PaymentStatus;
          amount_cents: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status?: PaymentStatus;
          amount_cents: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          status?: PaymentStatus;
          amount_cents?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'payments_order_id_fkey';
            columns: ['order_id'];
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          }
        ];
      };
      agent_runs: {
        Row: {
          id: string;
          user_id: string;
          task: string;
          status: AgentRunStatus;
          result: Json | null;
          error_message: string | null;
          thread_id: string;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task: string;
          status?: AgentRunStatus;
          result?: Json | null;
          error_message?: string | null;
          thread_id: string;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task?: string;
          status?: AgentRunStatus;
          result?: Json | null;
          error_message?: string | null;
          thread_id?: string;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'agent_runs_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      agent_steps: {
        Row: {
          id: string;
          run_id: string;
          sequence_no: number;
          step_name: string;
          tool_name: string | null;
          input: Json | null;
          output: Json | null;
          status: AgentStepStatus;
          error_message: string | null;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          run_id: string;
          sequence_no: number;
          step_name: string;
          tool_name?: string | null;
          input?: Json | null;
          output?: Json | null;
          status?: AgentStepStatus;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          run_id?: string;
          sequence_no?: number;
          step_name?: string;
          tool_name?: string | null;
          input?: Json | null;
          output?: Json | null;
          status?: AgentStepStatus;
          error_message?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'agent_steps_run_id_fkey';
            columns: ['run_id'];
            referencedRelation: 'agent_runs';
            referencedColumns: ['id'];
          }
        ];
      };
      action_approvals: {
        Row: {
          id: string;
          run_id: string;
          action_type: string;
          payload: Json;
          status: ApprovalStatus;
          requested_by: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          executed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          action_type: string;
          payload: Json;
          status?: ApprovalStatus;
          requested_by: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          executed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          action_type?: string;
          payload?: Json;
          status?: ApprovalStatus;
          requested_by?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          executed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'action_approvals_run_id_fkey';
            columns: ['run_id'];
            referencedRelation: 'agent_runs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'action_approvals_requested_by_fkey';
            columns: ['requested_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'action_approvals_reviewed_by_fkey';
            columns: ['reviewed_by'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      message_drafts: {
        Row: {
          id: string;
          run_id: string;
          customer_id: string;
          order_id: string | null;
          content: string;
          status: DraftStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          customer_id: string;
          order_id?: string | null;
          content: string;
          status?: DraftStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          run_id?: string;
          customer_id?: string;
          order_id?: string | null;
          content?: string;
          status?: DraftStatus;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'message_drafts_run_id_fkey';
            columns: ['run_id'];
            referencedRelation: 'agent_runs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_drafts_customer_id_fkey';
            columns: ['customer_id'];
            referencedRelation: 'customers';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'message_drafts_order_id_fkey';
            columns: ['order_id'];
            referencedRelation: 'orders';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      agent_run_status: AgentRunStatus;
      agent_step_status: AgentStepStatus;
      approval_status: ApprovalStatus;
      draft_status: DraftStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

// Convenience helper aliases
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Customer = Tables<'customers'>;
export type Product = Tables<'products'>;
export type InventoryItem = Tables<'inventory'>;
export type Order = Tables<'orders'>;
export type OrderItem = Tables<'order_items'>;
export type Payment = Tables<'payments'>;
export type Profile = Tables<'profiles'>;
export type AgentRun = Tables<'agent_runs'>;
export type AgentStep = Tables<'agent_steps'>;
export type ActionApproval = Tables<'action_approvals'>;
export type MessageDraft = Tables<'message_drafts'>;
