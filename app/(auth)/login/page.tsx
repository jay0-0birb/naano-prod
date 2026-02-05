import Link from "next/link";
import { getTranslations } from "next-intl/server";
import LoginForm from "@/components/auth/login-form";

type PageProps = { searchParams?: Promise<{ message?: string }> };

export default async function LoginPage({ searchParams }: PageProps) {
  const t = await getTranslations("auth");
  const params = await searchParams;
  const showVerifyMessage = params?.message === "verify_email";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-[var(--font-jakarta)]">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold tracking-tight text-[#0F172A]">Naano</span>
          </Link>
        </div>
        
        <h1 className="text-2xl font-semibold text-[#111827] text-center mb-2">{t("welcomeBack")}</h1>
        <p className="text-[#64748B] text-center text-sm mb-8">{t("signInToAccount")}</p>

        {showVerifyMessage && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            {t("verifyEmailFirst")}
          </div>
        )}

        <LoginForm />
        
        <div className="mt-6 text-center">
          <p className="text-[#64748B] text-xs">
            {t("noAccount")}{" "}
            <Link href="/register" className="text-[#3B82F6] hover:text-[#2563EB] transition-colors font-medium">
              {t("signUp")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
