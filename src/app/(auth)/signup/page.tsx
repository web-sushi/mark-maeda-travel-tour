"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Container from "@/components/layout/Container";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      // Use window.location.origin for proper URL construction
      const origin = typeof window !== "undefined" 
        ? window.location.origin 
        : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
        },
      });

      if (signUpError) throw signUpError;

      setSuccess(true);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError(null);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
      });

      if (resendError) throw resendError;

      setResendSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend email");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">Create Account</h1>
      <p className="text-lg text-gray-600 mb-8">
        Sign up to manage your bookings
      </p>

      {success && (
        <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3 mb-4">
            <svg
              className="w-6 h-6 text-green-600 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-1">
                Account created successfully!
              </h3>
              <p className="text-green-800 mb-3">
                We've sent a verification email to <strong>{email}</strong>
              </p>
              <p className="text-sm text-green-700">
                Please check your inbox and click the verification link to activate your account.
              </p>
            </div>
          </div>

          {resendSuccess && (
            <div className="mb-3 p-3 bg-green-100 border border-green-300 rounded text-sm text-green-800">
              ✓ Verification email resent successfully!
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 mt-4">
            <Button
              onClick={handleResendEmail}
              disabled={resendLoading}
              variant="outline"
              className="flex-1"
            >
              {resendLoading ? "Sending..." : "Resend Verification Email"}
            </Button>
            <Button
              onClick={() => router.push("/login")}
              className="flex-1"
            >
              Go to Login
            </Button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="text-blue-800">
              <strong>Note:</strong> Check your spam folder if you don't see the email within a few minutes.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {!success && (
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating Account..." : "Sign Up"}
          </Button>
        </form>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <a href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-[#E4005A] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Container className="py-8">
      <Suspense
        fallback={
          <div className="max-w-md mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-lg text-gray-600 mb-8">Loading...</p>
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </Container>
  );
}
