"use client";

import { useState, Suspense } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#166534] border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/super-admin";
  const redirectTo = rawRedirect.startsWith("/super-admin") ? rawRedirect : "/super-admin";
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: err } = await signInWithEmail(email, password);
    if (err) {
      setError(err);
      setLoading(false);
      return;
    }

    const adminRes = await fetch("/api/super-admin?action=check-admin");
    const adminData = await adminRes.json();
    if (adminData.isAdmin) {
      router.replace(redirectTo);
    } else {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      await supabase.auth.signOut();
      setError("Please use the correct login portal.");
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-sm text-[#111] placeholder:text-[#9CA3AF] focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/10 transition-all duration-200";

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo-name.png" alt="RevuGo" className="h-[124px] object-contain mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-[#111] tracking-[-0.02em]">
            Admin Portal
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            RevuGo Administration Dashboard
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 space-y-4 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold mb-1.5 block">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@reviewflow.in"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold mb-1.5 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className={`${inputClass} pr-10`}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-[#EF4444] text-xs bg-[#FEF2F2] px-3 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 text-[13px] font-bold bg-[#166534] hover:bg-[#15803D] text-white rounded-xl disabled:opacity-50 transition-all duration-300"
            >
              {loading ? "Verifying..." : "Sign In"}
            </button>
          </form>

          <p className="text-[10px] text-center text-[#9CA3AF]">
            Authorized personnel only. All actions are logged.
          </p>
        </div>
      </div>
    </div>
  );
}
