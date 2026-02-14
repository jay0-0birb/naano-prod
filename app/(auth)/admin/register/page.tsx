import Link from "next/link";
import AdminSignupForm from "./admin-signup-form";

export default function AdminRegisterPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 font-[var(--font-jakarta)]">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold tracking-tight text-[#0F172A]">
              Naano
            </span>
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-[#111827] text-center mb-2">
          Compte admin
        </h1>
        <p className="text-[#64748B] text-center text-sm mb-8">
          Inscription réservée aux emails autorisés. Aucun choix créateur / entreprise.
        </p>

        <AdminSignupForm />

        <div className="mt-6 text-center">
          <p className="text-[#64748B] text-xs">
            Déjà un compte ?{" "}
            <Link
              href="/login"
              className="text-[#3B82F6] hover:text-[#2563EB] transition-colors font-medium"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
