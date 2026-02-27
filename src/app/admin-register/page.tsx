"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Container from "@/components/layout/Container";

function AdminRegisterForm() {
  const searchParams = useSearchParams();
  const key = searchParams.get("key");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const setupKey = process.env.NEXT_PUBLIC_ADMIN_SETUP_KEY;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Check if setup key is valid
  if (!setupKey || key !== setupKey) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Not Authorized</h1>
        <p className="text-lg text-gray-600">
          Invalid or missing setup key. This page is only accessible with a valid setup key.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Validation
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin user");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h2 className="text-xl font-semibold mb-2">User Created Successfully</h2>
          <p className="mb-4">
            The admin user account has been created. However, you need to complete one more step:
          </p>
          <div className="bg-white p-4 rounded border border-green-300">
            <p className="font-semibold mb-2">Next Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Go to Supabase Dashboard → SQL Editor</li>
              <li>Run this SQL to add the user to the admin allowlist:</li>
            </ol>
            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
              {`INSERT INTO public.admin_users (user_id, email)
SELECT id, email
FROM auth.users
WHERE email = '${email}';`}
            </pre>
            <p className="mt-4 text-sm">
              After adding the user to <code className="bg-gray-200 px-1 rounded">admin_users</code>, you can sign in at{" "}
              <a href="/login" className="text-blue-600 hover:underline">
                /login
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Registration</h1>
      <p className="text-lg text-gray-600 mb-8">
        Create a new admin user account.
      </p>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            placeholder="At least 6 characters"
            minLength={6}
          />
        </div>
        <div>
          <Input
            label="Confirm Password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your password"
            minLength={6}
          />
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create Admin User"}
        </Button>
      </form>
    </div>
  );
}

export default function AdminRegisterPage() {
  return (
    <Container className="py-8">
      <Suspense
        fallback={
          <div className="max-w-md mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Registration</h1>
            <p className="text-lg text-gray-600 mb-8">Loading...</p>
          </div>
        }
      >
        <AdminRegisterForm />
      </Suspense>
    </Container>
  );
}
