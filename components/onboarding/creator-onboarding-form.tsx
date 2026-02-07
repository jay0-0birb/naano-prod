"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { completeCreatorOnboarding } from "@/app/(dashboard)/actions";
import {
  Loader2,
  AlertCircle,
  Linkedin,
  Users,
  FileText,
  Calendar,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";

const CALENDLY_EXPERT_URL =
  process.env.NEXT_PUBLIC_CALENDLY_EXPERT_CALL_URL ||
  "https://calendly.com/naano-expert/10min";
const MICROENTREPRISE_PDF_URL =
  process.env.NEXT_PUBLIC_MICROENTREPRISE_PDF_URL ||
  "/creer-micro-entreprise-15min.pdf";

const COMPANY_COUNTRIES = [
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "BE", name: "Belgium" },
  { code: "NL", name: "Netherlands" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "PT", name: "Portugal" },
  { code: "SE", name: "Sweden" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "IE", name: "Ireland" },
  { code: "PL", name: "Poland" },
  { code: "CZ", name: "Czech Republic" },
  { code: "OTHER", name: "Other" },
] as const;

const EU_COUNTRY_CODES = [
  "FR",
  "DE",
  "ES",
  "IT",
  "BE",
  "NL",
  "PT",
  "IE",
  "AT",
  "SE",
  "DK",
  "FI",
  "PL",
  "CZ",
  "GB",
] as const;

export default function CreatorOnboardingForm() {
  const t = useTranslations("onboarding");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const THEMES = [
    "SaaS / Software",
    "Fintech",
    "E-commerce",
    "Marketing",
    "Human Resources",
    "Productivity",
    "Cybersecurity",
    "AI / Machine Learning",
    "EdTech",
    "HealthTech",
    "Other",
  ];
  const [error, setError] = useState<string | null>(null);
  const [legalStatus, setLegalStatus] = useState<
    "particulier" | "professionnel"
  >("particulier");
  const [theme, setTheme] = useState<string>("");
  const [companyCountry, setCompanyCountry] = useState<string>("");
  const [country, setCountry] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const postalCodeRef = useRef<HTMLInputElement | null>(null);
  const [companyTaxIdError, setCompanyTaxIdError] = useState<string | null>(
    null,
  );
  const [companyVatError, setCompanyVatError] = useState<string | null>(null);

  const isEuCompany =
    companyCountry !== "" &&
    EU_COUNTRY_CODES.includes(
      companyCountry as (typeof EU_COUNTRY_CODES)[number],
    );

  function getCompanyTaxIdLabel() {
    if (companyCountry === "FR") {
      return t("companyTaxIdFrance");
    }
    if (companyCountry === "US") {
      return t("companyTaxIdUs");
    }
    if (companyCountry === "GB") {
      return t("companyTaxIdUk");
    }
    return t("companyTaxIdOther");
  }

  function getCompanyTaxIdPlaceholder() {
    if (companyCountry === "FR") {
      return t("companyTaxIdPlaceholderFrance");
    }
    if (companyCountry === "US") {
      return t("companyTaxIdPlaceholderUs");
    }
    if (companyCountry === "GB") {
      return t("companyTaxIdPlaceholderUk");
    }
    return t("companyTaxIdPlaceholderOther");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setCompanyTaxIdError(null);
    setCompanyVatError(null);

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);

    formData.append("legalStatus", legalStatus);
    formData.append("theme", theme);

    // Additional validation for professional/company creators
    if (legalStatus === "professionnel") {
      const companyLegalName = (
        formData.get("companyLegalName") as string | null
      )?.trim();
      const registrationCountry = (
        formData.get("companyRegistrationCountry") as string | null
      )?.trim();
      const companyTaxId = (
        formData.get("companyTaxId") as string | null
      )?.trim();
      const companyVatNumber = (
        formData.get("companyVatNumber") as string | null
      )?.trim();
      const companyRegisteredAddress = (
        formData.get("companyRegisteredAddress") as string | null
      )?.trim();

      if (
        !companyLegalName ||
        !registrationCountry ||
        !companyTaxId ||
        !companyRegisteredAddress
      ) {
        setIsLoading(false);
        setError(t("companyFieldsRequiredError"));
        return;
      }

      // Country-specific validation for Tax / Commercial ID
      const normalizedTaxId = companyTaxId.replace(/\s+/g, "");

      if (registrationCountry === "FR" && !/^\d{14}$/.test(normalizedTaxId)) {
        setIsLoading(false);
        setCompanyTaxIdError(t("companyTaxIdErrorFrance"));
        return;
      }

      if (
        registrationCountry === "US" &&
        !/^(\d{2}-?\d{7})$/.test(companyTaxId)
      ) {
        setIsLoading(false);
        setCompanyTaxIdError(t("companyTaxIdErrorUs"));
        return;
      }

      if (
        registrationCountry === "GB" &&
        !/^[A-Za-z0-9]{7,8}$/.test(normalizedTaxId)
      ) {
        setIsLoading(false);
        setCompanyTaxIdError(t("companyTaxIdErrorUk"));
        return;
      }

      // VAT required for European companies and must start with 2-letter country code
      if (
        EU_COUNTRY_CODES.includes(
          registrationCountry as (typeof EU_COUNTRY_CODES)[number],
        )
      ) {
        if (!companyVatNumber) {
          setIsLoading(false);
          setCompanyVatError(t("companyVatRequired"));
          return;
        }

        if (!/^[A-Z]{2}[A-Za-z0-9]{2,}$/.test(companyVatNumber.toUpperCase())) {
          setIsLoading(false);
          setCompanyVatError(t("companyVatFormatError"));
          return;
        }
      }
    }

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
          {t("personalInfo")}
        </h3>
        <p className="text-xs text-[#64748B]">{t("contractData")}</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">
              {t("firstName")}
            </label>
            <input
              name="firstName"
              required
              placeholder={t("firstNamePlaceholder")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#475569] mb-2">
              {t("lastName")}
            </label>
            <input
              name="lastName"
              required
              placeholder={t("lastNamePlaceholder")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("dateOfBirth")}
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
            {t("fullAddress")}
          </label>
          <input
            name="streetAddress"
            required
            placeholder={t("addressPlaceholder")}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all mb-3"
          />
          <div className="grid grid-cols-3 gap-3">
            <input
              ref={postalCodeRef}
              name="postalCode"
              required
              placeholder={t("postalCode")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
            <input
              name="city"
              required
              value={city}
              onChange={(e) => {
                const value = e.target.value;
                // Default: just mirror user input
                setCity(value);

                // Simple heuristic for France: if user types "75012 Paris",
                // automatically extract "75012" as postal code and keep "Paris" as city.
                if (country === "FR" && postalCodeRef.current) {
                  const match = value.match(/^(\d{4,5})\s+(.+)$/);
                  if (match) {
                    postalCodeRef.current.value = match[1];
                    setCity(match[2]);
                  }
                }
              }}
              placeholder={t("city")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
            <div className="relative">
              <select
                name="country"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-10 text-[#111827] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all appearance-none"
              >
                <option value="">{t("selectCountry")}</option>
                {COMPANY_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            </div>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-[#0F172A] pt-4">
          {t("socialInfo")}
        </h3>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("linkedin")}
          </label>
          <div className="relative">
            <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
            <input
              name="linkedinUrl"
              type="url"
              required
              placeholder={t("linkedinPlaceholder")}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("followersCount")}
          </label>
          <input
            name="followersCount"
            type="number"
            required
            min={0}
            placeholder={t("followersCountPlaceholder")}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
          />
          <p className="mt-1 text-xs text-[#64748B]">
            {t("followersCountHint")}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("industry")}
          </label>
          <select
            name="theme"
            required
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
          >
            <option value="">{t("selectIndustry")}</option>
            {THEMES.map((themeOption) => (
              <option key={themeOption} value={themeOption}>
                {themeOption}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("bio")}
          </label>
          <textarea
            name="bio"
            rows={3}
            placeholder={t("bioPlaceholder")}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#475569] mb-2">
            {t("recentPosts")}
          </label>
          <input
            name="recentPostsLinkedin"
            type="url"
            placeholder={t("recentPostsPlaceholder")}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
          />
        </div>

        {/* Choix du Statut */}
        <h3 className="text-sm font-semibold text-[#0F172A] pt-4">
          {t("legalStatus")}
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
                {t("particulier")}
              </span>
              <p className="text-xs text-[#64748B] mt-0.5">
                {t("particulierDesc")}
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
                {t("professionnel")}
              </span>
              <p className="text-xs text-[#64748B] mt-0.5">
                {t("professionnelDesc")}
              </p>
            </div>
          </label>
        </div>

        {legalStatus === "professionnel" && (
          <div className="mt-4 space-y-4 border border-gray-200 rounded-xl p-4 bg-gray-50/60">
            <h4 className="text-sm font-semibold text-[#0F172A]">
              {t("companySectionTitle")}
            </h4>

            {/* Legal company name */}
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">
                {t("companyLegalName")}
              </label>
              <input
                name="companyLegalName"
                required
                placeholder={t("companyLegalNamePlaceholder")}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
              />
            </div>

            {/* Country of registration + Tax ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">
                  {t("companyRegistrationCountry")}
                </label>
                <select
                  name="companyRegistrationCountry"
                  required
                  value={companyCountry}
                  onChange={(e) => {
                    setCompanyCountry(e.target.value);
                    setCompanyTaxIdError(null);
                    setCompanyVatError(null);
                  }}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#111827] focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
                >
                  <option value="">{t("selectCountry")}</option>
                  {COMPANY_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">
                  {getCompanyTaxIdLabel()}
                </label>
                <input
                  name="companyTaxId"
                  required
                  placeholder={getCompanyTaxIdPlaceholder()}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
                />
                {companyTaxIdError && (
                  <p className="mt-1 text-xs text-red-600">
                    {companyTaxIdError}
                  </p>
                )}
              </div>
            </div>

            {/* VAT number for European companies */}
            {isEuCompany && (
              <div>
                <label className="block text-sm font-medium text-[#475569] mb-2">
                  {t("companyVatNumber")}
                </label>
                <input
                  name="companyVatNumber"
                  required
                  placeholder={t("companyVatPlaceholder")}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all"
                />
                <p className="mt-1 text-xs text-[#64748B]">
                  {t("companyVatNote")}
                </p>
                {companyVatError && (
                  <p className="mt-1 text-xs text-red-600">{companyVatError}</p>
                )}
              </div>
            )}

            {/* Registered office address */}
            <div>
              <label className="block text-sm font-medium text-[#475569] mb-2">
                {t("companyRegisteredAddress")}
              </label>
              <textarea
                name="companyRegisteredAddress"
                required
                rows={2}
                placeholder={t("companyRegisteredAddressPlaceholder")}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6]/10 transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Bridge for Particulier */}
        {legalStatus === "particulier" && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <p className="text-sm text-blue-900 mb-2 flex items-center justify-between gap-3">
              <span className="font-medium">💡 {t("microEntrepriseTip")}</span>
              <span className="text-xs font-semibold flex items-center gap-1 text-right">
                <span role="img" aria-label="France flag">
                  🇫🇷
                </span>
                {t("microEntrepriseFranceOnly")}
              </span>
            </p>
            <p className="text-sm text-blue-800 mb-4">
              {t("microEntrepriseDesc")}
            </p>
            <div className="space-y-2">
              <a
                href={MICROENTREPRISE_PDF_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
              >
                <FileText className="w-4 h-4" />
                {t("downloadGuide")}
              </a>
              <a
                href={CALENDLY_EXPERT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900"
              >
                <Calendar className="w-4 h-4" />
                {t("needHelp")}
              </a>
            </div>
          </div>
        )}

        {/* Step 4: Terms and certification */}
        <h3 className="text-sm font-semibold text-[#0F172A] pt-4">
          {t("mandateSignature")}
        </h3>
        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="mandateAccepted"
              required
              className="mt-1 rounded border-gray-300"
            />
            <span className="text-sm text-[#475569]">
              {t.rich("acceptTermsAndPrivacy", {
                terms: (chunks) => (
                  <a
                    href="/Terms.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3B82F6] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {chunks}
                  </a>
                ),
                privacy: (chunks) => (
                  <a
                    href="/PRIVACY.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#3B82F6] hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {chunks}
                  </a>
                ),
              })}
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="accuracyCertified"
              required
              className="mt-1 rounded border-gray-300"
            />
            <span className="text-sm text-[#475569]">
              {t("certifyAccuracy")}
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
            {t("saving")}
          </>
        ) : (
          <>
            <Users className="w-5 h-5" />
            {t("createCreatorProfile")}
          </>
        )}
      </button>
    </form>
  );
}
