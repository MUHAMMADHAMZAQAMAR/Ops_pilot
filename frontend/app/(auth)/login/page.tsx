"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-zinc-950">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/90 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Shield className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight text-zinc-100">
            ZeroTrust<span className="text-emerald-400">.AI</span> Platform
          </CardTitle>
          <CardDescription className="text-xs text-zinc-400">
            Enterprise Zero-Trust Authentication Gateway & RLS Boundary
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-300">Corporate Email</label>
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
              <label className="text-xs font-medium text-zinc-300">Password</label>
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
              disabled={loading || !email || !password}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
            >
              {loading ? "Authenticating..." : "Sign In to Tenant"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-zinc-800/60 pt-4">
          <p className="text-xs text-zinc-500">
            Need an enterprise tenant account?{" "}
            <Link href="/signup" className="text-emerald-400 hover:underline">
              Create Organization
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
