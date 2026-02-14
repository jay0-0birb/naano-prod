"use client";

import { useState } from "react";
import { adminSignup } from "@/app/(auth)/actions";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

export default function AdminSignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = (formData.get("email") as string) ?? "";

    const result = await adminSignup(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      setSuccess(true);
      setSuccessEmail(email);
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center py-8 animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-[#111827] mb-2">
          Vérifiez votre email
        </h3>
        <p className="text-[#64748B] text-sm leading-relaxed max-w-xs mx-auto">
          Un lien de confirmation a été envoyé à {successEmail}. Cliquez dessus
          pour activer votre compte admin.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div>
        <label htmlFor="admin-email" className="block text-sm font-medium text-[#374151] mb-1">
          Email
        </label>
        <input
          id="admin-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[#111827] focus:ring-2 focus:ring-[#0F172A] focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="block text-sm font-medium text-[#374151] mb-1">
          Mot de passe
        </label>
        <input
          id="admin-password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[#111827] focus:ring-2 focus:ring-[#0F172A] focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="admin-fullName" className="block text-sm font-medium text-[#374151] mb-1">
          Nom (optionnel)
        </label>
        <input
          id="admin-fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[#111827] focus:ring-2 focus:ring-[#0F172A] focus:border-transparent"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0F172A] text-white rounded-lg font-medium hover:bg-[#1e293b] disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          "Créer mon compte admin"
        )}
      </button>
    </form>
  );
}
