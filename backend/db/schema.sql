-- ====================================================================
-- ZERO-TRUST ENTERPRISE AI SAAS DATABASE DDL SCHEMA & RLS POLICIES
-- PostgreSQL 15+ / Supabase
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. CUSTOM TYPES & ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level_type AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status_type AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE agent_run_status_type AS ENUM ('PENDING', 'RUNNING', 'WAITING_APPROVAL', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE task_status_type AS ENUM ('PENDING', 'RUNNING', 'WAITING_APPROVAL', 'COMPLETED', 'FAILED', 'SKIPPED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. TABLES DEFINITION

-- 3.1 ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.2 PROFILES (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.3 ORGANIZATION MEMBERS (Multi-tenant RBAC mapping)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(org_id, user_id)
);

-- 3.4 BUSINESS REQUESTS
CREATE TABLE IF NOT EXISTS public.business_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    raw_prompt TEXT NOT NULL,
    sanitized_prompt TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'GENERAL',
    priority TEXT NOT NULL DEFAULT 'NORMAL',
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.5 AGENT RUNS
CREATE TABLE IF NOT EXISTS public.agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES public.business_requests(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    status agent_run_status_type NOT NULL DEFAULT 'PENDING',
    current_step_id TEXT,
    execution_graph_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.6 TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    risk_level risk_level_type NOT NULL DEFAULT 'LOW',
    status task_status_type NOT NULL DEFAULT 'PENDING',
    dependency_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.7 TOOL EXECUTIONS (Sandboxed idempotent tool runs)
CREATE TABLE IF NOT EXISTS public.tool_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    input_payload JSONB NOT NULL,
    output_payload JSONB,
    execution_time_ms INTEGER,
    status TEXT NOT NULL DEFAULT 'PENDING',
    idempotency_key TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.8 APPROVALS (Cryptographic HITL Gateway)
CREATE TABLE IF NOT EXISTS public.approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.agent_runs(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    token_hash TEXT NOT NULL,
    status approval_status_type NOT NULL DEFAULT 'PENDING',
    decision_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

-- 3.9 AUDIT LOGS (Append-Only Tamper-Evident SHA-256 Chained Log)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    previous_hash TEXT,
    current_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3.10 LANGGRAPH CHECKPOINTS (Persistent Workflow Checkpointing)
CREATE TABLE IF NOT EXISTS public.checkpoints (
    thread_id TEXT NOT NULL,
    checkpoint_ns TEXT NOT NULL DEFAULT '',
    checkpoint_id TEXT NOT NULL,
    parent_checkpoint_id TEXT,
    type TEXT,
    checkpoint JSONB NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

CREATE TABLE IF NOT EXISTS public.checkpoint_blobs (
    thread_id TEXT NOT NULL,
    checkpoint_ns TEXT NOT NULL DEFAULT '',
    channel TEXT NOT NULL,
    version TEXT NOT NULL,
    type TEXT NOT NULL,
    blob BYTEA,
    PRIMARY KEY (thread_id, checkpoint_ns, channel, version)
);

CREATE TABLE IF NOT EXISTS public.checkpoint_writes (
    thread_id TEXT NOT NULL,
    checkpoint_ns TEXT NOT NULL DEFAULT '',
    checkpoint_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    idx INTEGER NOT NULL,
    channel TEXT NOT NULL,
    type TEXT,
    blob BYTEA,
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx)
);

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(org_id);
CREATE INDEX IF NOT EXISTS idx_requests_org ON public.business_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_requests_user ON public.business_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_org ON public.agent_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_req ON public.agent_runs(request_id);
CREATE INDEX IF NOT EXISTS idx_tasks_run ON public.tasks(run_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON public.tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_tool_exec_task ON public.tool_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_approvals_run ON public.approvals(run_id);
CREATE INDEX IF NOT EXISTS idx_approvals_org ON public.approvals(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_created ON public.audit_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_hash ON public.audit_logs(current_hash);

-- 5. IMMUTABILITY TRIGGER FOR AUDIT LOGS (TAMPER EVIDENT)
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are strictly append-only. UPDATE or DELETE operations are prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- 6. UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_agent_runs_updated_at
BEFORE UPDATE ON public.agent_runs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. PROFILE CREATION TRIGGER ON AUTH.USERS SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. TENANCY HELPER FUNCTIONS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE org_id = target_org_id
          AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_org_role(target_org_id UUID)
RETURNS user_role AS $$
DECLARE
    found_role user_role;
BEGIN
    SELECT role INTO found_role
    FROM public.organization_members
    WHERE org_id = target_org_id
      AND user_id = auth.uid();
    RETURN found_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. ROW-LEVEL SECURITY (RLS) POLICIES

-- Enable RLS across all application tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoint_blobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoint_writes ENABLE ROW LEVEL SECURITY;

-- 9.1 PROFILES POLICIES
CREATE POLICY "Users can view all member profiles in their org" ON public.profiles
    FOR SELECT USING (
        id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.organization_members m1
            JOIN public.organization_members m2 ON m1.org_id = m2.org_id
            WHERE m1.user_id = auth.uid() AND m2.user_id = public.profiles.id
        )
    );

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- 9.2 ORGANIZATIONS POLICIES
CREATE POLICY "Org members can view their organization" ON public.organizations
    FOR SELECT USING (public.is_org_member(id));

CREATE POLICY "Org owners can update organization details" ON public.organizations
    FOR UPDATE USING (public.get_user_org_role(id) = 'owner');

CREATE POLICY "Authenticated users can create an organization" ON public.organizations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 9.3 ORGANIZATION MEMBERS POLICIES
CREATE POLICY "Members can view members in their org" ON public.organization_members
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Admins and owners can invite/insert members" ON public.organization_members
    FOR INSERT WITH CHECK (public.get_user_org_role(org_id) IN ('owner', 'admin') OR auth.uid() = user_id);

CREATE POLICY "Owners can update member roles" ON public.organization_members
    FOR UPDATE USING (public.get_user_org_role(org_id) = 'owner');

CREATE POLICY "Owners and admins can remove members" ON public.organization_members
    FOR DELETE USING (public.get_user_org_role(org_id) IN ('owner', 'admin'));

-- 9.4 BUSINESS REQUESTS POLICIES
CREATE POLICY "Users can view business requests of their org" ON public.business_requests
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Users can create business requests for their org" ON public.business_requests
    FOR INSERT WITH CHECK (public.is_org_member(org_id) AND auth.uid() = user_id);

CREATE POLICY "Users can update their business requests or admins" ON public.business_requests
    FOR UPDATE USING (public.is_org_member(org_id) AND (auth.uid() = user_id OR public.get_user_org_role(org_id) IN ('owner', 'admin')));

-- 9.5 AGENT RUNS POLICIES
CREATE POLICY "Members can view agent runs in their org" ON public.agent_runs
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Members can insert agent runs in their org" ON public.agent_runs
    FOR INSERT WITH CHECK (public.is_org_member(org_id));

CREATE POLICY "Members can update agent runs in their org" ON public.agent_runs
    FOR UPDATE USING (public.is_org_member(org_id));

-- 9.6 TASKS POLICIES
CREATE POLICY "Members can view tasks in their org" ON public.tasks
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Members can manage tasks in their org" ON public.tasks
    FOR ALL USING (public.is_org_member(org_id));

-- 9.7 TOOL EXECUTIONS POLICIES
CREATE POLICY "Members can view tool executions in their org" ON public.tool_executions
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Service role and members can insert tool executions" ON public.tool_executions
    FOR INSERT WITH CHECK (public.is_org_member(org_id));

-- 9.8 APPROVALS POLICIES
CREATE POLICY "Members can view approvals in their org" ON public.approvals
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Admins and Owners can resolve approvals" ON public.approvals
    FOR UPDATE USING (
        public.is_org_member(org_id) AND
        public.get_user_org_role(org_id) IN ('owner', 'admin')
    );

CREATE POLICY "System and members can create pending approvals" ON public.approvals
    FOR INSERT WITH CHECK (public.is_org_member(org_id));

-- 9.9 AUDIT LOGS POLICIES
CREATE POLICY "Members can view audit logs for their org" ON public.audit_logs
    FOR SELECT USING (public.is_org_member(org_id));

CREATE POLICY "Authenticated users and workers can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (public.is_org_member(org_id));

-- 9.10 CHECKPOINTS POLICIES
CREATE POLICY "Authenticated users can access workflow checkpoints" ON public.checkpoints
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access workflow checkpoint blobs" ON public.checkpoint_blobs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can access workflow checkpoint writes" ON public.checkpoint_writes
    FOR ALL USING (auth.role() = 'authenticated');

