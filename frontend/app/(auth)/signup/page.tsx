"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Building } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [orgName, setOrgName] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();

    // 1. Sign up user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (authError || !authData.user) {
      setErrorMsg(authError?.message || "Signup failed");
      setLoading(false);
      return;
    }

    // 2. Create Organization
    const orgResult = await (supabase
      .from("organizations")
      .insert({ name: orgName } as never)
      .select("id")
      .single() as unknown as Promise<{ data: { id: string } | null; error: { message: string } | null }>);

    const orgData = orgResult.data;
    const orgError = orgResult.error;

    if (orgError || !orgData) {
      setErrorMsg(`Failed to provision organization: ${orgError?.message ?? "Unknown error"}`);
      setLoading(false);
      return;
    }

    // 3. Attach User as Owner
    const memResult = await (supabase.from("organization_members").insert({
      org_id: orgData.id,
      user_id: authData.user.id,
      role: "owner",
    } as never) as unknown as Promise<{ error: { message: string } | null }>);

    const memError = memResult.error;

    if (memError) {
      setErrorMsg(`Failed to assign tenancy membership: ${memError.message}`);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-950">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/90 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Building className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-zinc-100">
            Provision Organization Tenant
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Deploy an isolated Zero-Trust environment with strict RLS multi-tenancy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Organization Name</label>
              <Input
                placeholder="Enterprise Name / Subsidiary"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Full Name</label>
              <Input
                placeholder="First Last"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Work Email</label>
              <Input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Master Password</label>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
              />
            </div>

            {errorMsg && (
              <p className="rounded-lg bg-rose-950/40 p-2 text-xs text-rose-300 border border-rose-900">
                {errorMsg}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !orgName || !fullName || !email || !password}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold mt-2"
            >
              {loading ? "Provisioning..." : "Initialize Tenant Space"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-zinc-800/60 pt-4">
          <p className="text-xs text-zinc-500">
            Already registered?{" "}
            <Link href="/login" className="text-emerald-400 hover:underline">
              Sign In
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
