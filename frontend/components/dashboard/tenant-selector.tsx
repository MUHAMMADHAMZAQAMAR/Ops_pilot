"use client";

import * as React from "react";
import { Building2, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TenantSelectorProps {
  initialOrgName?: string;
  initialRole?: string;
}

interface MembershipRow {
  role: string;
  org_id: string;
  organizations: { name: string } | null;
}

export function TenantSelector({ initialOrgName, initialRole }: TenantSelectorProps) {
  const [orgName, setOrgName] = React.useState<string>(initialOrgName || "Loading Tenant...");
  const [role, setRole] = React.useState<string>(initialRole || "member");

  React.useEffect(() => {
    async function fetchOrgInfo() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setOrgName("Default Organization");
          return;
        }

        const { data: member } = await supabase
          .from("organization_members")
          .select("role, org_id, organizations(name)")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle() as { data: MembershipRow | null; error: unknown };

        if (member) {
          setRole(member.role);
          const orgData = member.organizations;
          if (orgData?.name) {
            setOrgName(orgData.name);
          } else {
            setOrgName(`Org ${member.org_id.slice(0, 8)}`);
          }
        } else {
          setOrgName("Organization Workspace");
        }
      } catch {
        setOrgName("Enterprise Tenant");
      }
    }

    if (!initialOrgName) {
      fetchOrgInfo();
    }
  }, [initialOrgName]);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs text-zinc-300">
      <Building2 className="h-4 w-4 text-emerald-400" />
      <span className="font-semibold text-zinc-100">{orgName}</span>
      <span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-800/40 uppercase">
        {role}
      </span>
      <ChevronDown className="h-3 w-3 text-zinc-500" />
    </div>
  );
}
