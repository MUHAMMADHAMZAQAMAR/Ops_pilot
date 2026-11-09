"use client";

import * as React from "react";
import { Building, Users, Shield, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";

interface MemberItem {
  id: string;
  name: string;
  email: string;
  role: string;
  addedAt: string;
}

interface MembershipRow {
  org_id: string;
  role: string;
  organizations: { id: string; name: string } | null;
}

interface MemberRow {
  id: string;
  role: string;
  created_at: string;
  user_id: string;
  profiles: { full_name: string | null; email: string | null } | null;
}

const roleBadgeMap: Record<string, BadgeVariant> = {
  owner: "default",
  admin: "warning",
  member: "secondary",
};

export default function SettingsPage() {
  const [orgName, setOrgName] = React.useState<string>("Loading...");
  const [orgId, setOrgId] = React.useState<string>("Loading...");
  const [members, setMembers] = React.useState<MemberItem[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    async function loadOrgData() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user's membership and organization details
        const { data: membership } = await supabase
          .from("organization_members")
          .select("org_id, role, organizations(id, name)")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle() as { data: MembershipRow | null; error: unknown };

        if (membership) {
          const currentOrgId = membership.org_id;
          setOrgId(currentOrgId);
          const orgData = membership.organizations;
          if (orgData?.name) {
            setOrgName(orgData.name);
          }

          // Fetch all members of this organization
          const { data: memberRows } = await supabase
            .from("organization_members")
            .select("id, role, created_at, user_id, profiles(full_name, email)")
            .eq("org_id", currentOrgId) as { data: MemberRow[] | null; error: unknown };

          if (memberRows && memberRows.length > 0) {
            const mapped: MemberItem[] = memberRows.map((m: MemberRow) => ({
              id: m.id,
              name: m.profiles?.full_name || "Enterprise User",
              email: m.profiles?.email || user.email || "user@org.net",
              role: m.role,
              addedAt: new Date(m.created_at).toISOString().split("T")[0],
            }));
            setMembers(mapped);
          } else {
            setMembers([
              {
                id: membership.org_id,
                name: user.user_metadata?.full_name || "Tenant Owner",
                email: user.email || "",
                role: membership.role,
                addedAt: new Date().toISOString().split("T")[0],
              },
            ]);
          }
        }
      } catch (err) {
        console.error("Failed to load organization settings:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOrgData();
  }, []);

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <Building className="h-5 w-5 text-emerald-400" />
          Organization Tenant & RBAC Configuration
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Manage tenant boundaries, member authorizations, and cryptographic approval gate policies.
        </p>
      </div>

      {/* Organization Details */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200">Organization Identity</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="text-zinc-400">Organization Name</label>
            <Input
              value={orgName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgName(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-zinc-100"
            />
          </div>
          <div className="space-y-1">
            <label className="text-zinc-400">Tenancy UUID (RLS Boundary Identifier)</label>
            <Input
              readOnly
              value={orgId}
              className="bg-zinc-950 border-zinc-800 text-zinc-400 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Security Policies */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-400" />
          Zero-Trust Execution Policies
        </h2>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950">
            <div>
              <p className="font-semibold text-zinc-200">Prompt Injection Neutralization Firewall</p>
              <p className="text-zinc-400 text-[11px]">Strict regex filtering & Shannon entropy threshold inspection enabled</p>
            </div>
            <Badge variant="success">Active (Strict)</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950">
            <div>
              <p className="font-semibold text-zinc-200">Cryptographic HITL Gate for High-Risk Mutations</p>
              <p className="text-zinc-400 text-[11px]">Requires single-use HMAC-SHA256 signature by Admin or Owner</p>
            </div>
            <Badge variant="success">Enforced</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-950">
            <div>
              <p className="font-semibold text-zinc-200">Append-Only Audit Immutability Trigger</p>
              <p className="text-zinc-400 text-[11px]">Prohibits UPDATE and DELETE operations on PostgreSQL audit_logs table</p>
            </div>
            <Badge variant="success">Active (DB Trigger)</Badge>
          </div>
        </div>
      </div>

      {/* Organization Members Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            Tenant Members & Access Roles
          </h2>
          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs">
            <UserPlus className="h-3.5 w-3.5 mr-1" />
            Invite Member
          </Button>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-900/60">
              <TableRow className="border-zinc-800">
                <TableHead>User Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>RBAC Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Permissions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m: MemberItem) => (
                <TableRow key={m.id} className="border-zinc-800/80 hover:bg-zinc-900/40">
                  <TableCell className="font-medium text-zinc-200 text-xs">{m.name}</TableCell>
                  <TableCell className="font-mono text-xs text-zinc-400">{m.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeMap[m.role] || "secondary"}>
                      {m.role.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-zinc-500 font-mono">{m.addedAt}</TableCell>
                  <TableCell className="text-right text-xs text-zinc-400">
                    {m.role === "owner" ? "Full Tenant Authority" : m.role === "admin" ? "Can Sign HITL Mutations" : "Read / Safe Tools Only"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
