"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Container from "@/components/layout/Container";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already logged in and is admin
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (!authError && user) {
          // User is logged in, check if admin
          const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
          
          if (!adminError && isAdmin) {
            // Already logged in as admin, redirect to admin dashboard
            router.push(next);
            return;
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router, next]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Check if user is admin
      const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");

      if (adminError) {
        throw new Error("Failed to verify admin status");
      }

      if (!isAdmin) {
        // Sign them out immediately
        await supabase.auth.signOut();
        throw new Error("Unauthorized: Admin access required");
      }

      // Redirect on success
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Login</h1>
        <p className="text-lg text-gray-600 mb-8">Checking authentication...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Login</h1>
      <p className="text-lg text-gray-600 mb-8">
        Sign in with your admin credentials
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handlePasswordLogin} className="space-y-4">
        <div>
          <Input
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
          />
        </div>
        <div>
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Customer?{" "}
          <a href="/login" className="text-[#E4005A] hover:underline">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Container className="py-8">
      <Suspense
        fallback={
          <div className="max-w-md mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Admin Login
            </h1>
            <p className="text-lg text-gray-600 mb-8">Loading...</p>
          </div>
        }
      >
        <AdminLoginForm />
      </Suspense>
    </Container>
  );
}
