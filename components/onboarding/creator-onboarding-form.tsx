"use client";

import { useState } from "react";
import { completeCreatorOnboarding } from "@/app/(dashboard)/actions";
import { Loader2, AlertCircle, Linkedin, Users, FileText, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

const THEMES = [
  { value: "tech", label: "Tech" },
  { value: "business", label: "Business" },
  { value: "lifestyle", label: "Lifestyle" },
];

const CALENDLY_EXPERT_URL =
  process.env.NEXT_PUBLIC_CALENDLY_EXPERT_CALL_URL ||
  "https://calendly.com/naano-expert/10min";
const MICROENTREPRISE_PDF_URL =
  process.env.NEXT_PUBLIC_MICROENTREPRISE_PDF_URL ||
  "/docs/creer-micro-entreprise-15min.pdf";

export default function CreatorOnboardingForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalStatus, setLegalStatus] = useState<"particulier" | "professionnel">("particulier");
  const [theme, setTheme] = useState<string>("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append("legalStatus", legalStatus);
    formData.append("theme", theme);

    const result = await completeCreatorOnboarding(formData);

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Step 2: Profil & Identification */}
      <div className="space-y-5">
        <h3 className="text-sm font-semibold text-[#0F172A]">
          Informations personnelles *
        </h3>
        <p className="text-xs text-[#64748B]">
          Ces données serviront à la génération automatique des contrats.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">
              Prénom *
            </label>
            <input
              name="firstName"
              required
              placeholder="Jean"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">
              Nom *
            </label>
            <input
              name="lastName"
              required
              placeholder="Dupont"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Date de naissance *
          </label>
          <input
            name="dateOfBirth"
            type="date"
            required
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Adresse postale complète *
          </label>
          <input
            name="streetAddress"
            required
            placeholder="123 rue de la Paix"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all mb-3"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              name="postalCode"
              required
              placeholder="CP"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
            <input
              name="city"
              required
              placeholder="Ville"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
            <input
              name="country"
              required
              placeholder="Pays"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-[#0F172A] pt-4">
          Informations sociales
        </h3>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            LinkedIn *
          </label>
          <div className="relative">
            <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
            <input
              name="linkedinUrl"
              type="url"
              required
              placeholder="https://linkedin.com/in/your-profile"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Thématique
          </label>
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTheme(t.value)}
                className={`px-4 py-2 rounded-full text-sm transition-all border ${
                  theme === t.value
                    ? "bg-[#0F172A] text-white border-[#0F172A]"
                    : "bg-gray-50 border-gray-200 text-[#64748B] hover:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="theme" value={theme} />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Présentation (optionnel)
          </label>
          <textarea
            name="bio"
            rows={3}
            placeholder="Quelques lignes sur votre parcours et expertise..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            Derniers posts LinkedIn (optionnel)
          </label>
          <input
            name="recentPostsLinkedin"
            type="url"
            placeholder="https://linkedin.com/posts/..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
          />
        </div>

        {/* Choix du Statut */}
        <h3 className="text-sm font-semibold text-[#0F172A] pt-4">
          Choix du statut
        </h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="legalStatus"
              value="particulier"
              checked={legalStatus === "particulier"}
              onChange={() => setLegalStatus("particulier")}
              className="mt-1"
            />
            <div>
              <span className="font-medium text-[#111827]">
                Particulier (Occasionnel)
              </span>
              <p className="text-xs text-[#64748B] mt-0.5">
                Je débute sans SIRET. Retraits limités à 500 € cumulés.
              </p>
            </div>
          </label>
          <label className="flex items-start gap-3 p-4 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
            <input
              type="radio"
              name="legalStatus"
              value="professionnel"
              checked={legalStatus === "professionnel"}
              onChange={() => setLegalStatus("professionnel")}
              className="mt-1"
            />
            <div>
              <span className="font-medium text-[#111827]">
                Professionnel (Freelance / AE)
              </span>
              <p className="text-xs text-[#64748B] mt-0.5">
                J&apos;ai déjà un SIRET. Retraits illimités.
              </p>
            </div>
          </label>
        </div>

        {legalStatus === "professionnel" && (
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">
              Numéro SIRET *
            </label>
            <input
              name="siretNumber"
              required
              placeholder="123 456 789 00012"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
          </div>
        )}

        {/* Step 3: Bridge for Particulier */}
        {legalStatus === "particulier" && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-sm font-medium text-blue-900 mb-2">
              💡 Le saviez-vous ?
            </p>
            <p className="text-sm text-blue-800 mb-4">
              Créer votre micro-entreprise prend exactement{" "}
              <strong>15 minutes</strong> et vous permet de générer des revenus
              illimités sur Naano.
            </p>
            <div className="space-y-2">
              <a
                href={MICROENTREPRISE_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
              >
                <FileText className="w-4 h-4" />
                Télécharger le guide (PDF)
              </a>
              <a
                href={CALENDLY_EXPERT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
              >
                <Calendar className="w-4 h-4" />
                Besoin d&apos;aide ? Réserver un call de 10 min avec un expert
                Naano
              </a>
            </div>
          </div>
        )}

        {/* Step 4: Mandate signature */}
        <h3 className="text-sm font-semibold text-[#0F172A] pt-4">
          Signature du mandat
        </h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="mandateAccepted"
              required
              className="mt-1 rounded border-gray-300"
            />
            <span className="text-sm text-[#475569]">
              J&apos;accepte le Mandat d&apos;Apport d&apos;Affaires Digital.
            </span>
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              name="accuracyCertified"
              required
              className="mt-1 rounded border-gray-300"
            />
            <span className="text-sm text-[#475569]">
              Je certifie sur l&apos;honneur l&apos;exactitude des informations
              fournies.
            </span>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Enregistrement...
          </>
        ) : (
          <>
            <Users className="w-5 h-5" />
            Créer mon profil créateur
          </>
        )}
      </button>
    </form>
  );
}
