import Link from "next/link";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-[var(--font-jakarta)]">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold tracking-tight text-[#0F172A]">Naano</span>
          </Link>
        </div>
        
        <h1 className="text-2xl font-semibold text-[#111827] text-center mb-2">Welcome back</h1>
        <p className="text-[#64748B] text-center text-sm mb-8">Sign in to your account</p>

        <LoginForm />
        
        <div className="mt-6 text-center">
          <p className="text-[#64748B] text-xs">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#3B82F6] hover:text-[#2563EB] transition-colors font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
