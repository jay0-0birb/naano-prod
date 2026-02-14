"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { createAffiliateCode } from "./actions";
import type { AffiliateReportRow } from "@/lib/affiliate-report";
import { Loader2, Download, Plus, Copy, Check } from "lucide-react";

type CodeRow = {
  code: string;
  referrer_name: string;
  created_at: string;
};

const MONTH_NAMES_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTH_NAMES_FR = [
  "Janv", "Févr", "Mars", "Avr", "Mai", "Juin",
  "Juil", "Août", "Sept", "Oct", "Nov", "Déc",
];

/** Months from Jan 2026 up to and including current month */
function getMonthOptions(locale: string): { year: number; month: number; label: string }[] {
  const options: { year: number; month: number; label: string }[] = [];
  const names = locale.startsWith("fr") ? MONTH_NAMES_FR : MONTH_NAMES_EN;
  const end = new Date();
  let d = new Date(2026, 0, 1); // Jan 2026
  while (d <= end) {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    options.push({ year: y, month: m, label: `${names[m - 1]} ${y}` });
    d.setMonth(d.getMonth() + 1);
  }
  return options.reverse(); // most recent first
}

export default function AffiliatesAdminClient({
  codes,
  report,
  currentYear,
  currentMonth,
  codeFilter,
}: {
  codes: CodeRow[];
  report: AffiliateReportRow[];
  currentYear: number;
  currentMonth: number;
  codeFilter: string;
}) {
  const t = useTranslations("affiliates");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createCode, setCreateCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [filterInput, setFilterInput] = useState(codeFilter);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const monthOptions = useMemo(() => getMonthOptions(locale), [locale]);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://naano.xyz";
  const getReferrerUrl = (code: string) =>
    `${baseUrl.replace(/\/$/, "")}/?aff=${encodeURIComponent(code)}`;
  const copyReferrerLink = (code: string) => {
    const url = getReferrerUrl(code);
    if (url) {
      void navigator.clipboard.writeText(url);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      setCopiedCode(code);
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedCode(null);
        copyTimeoutRef.current = null;
      }, 2000);
    }
  };
  const formatCents = (cents: number) =>
    new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-US", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(cents / 100);

  useEffect(() => {
    setFilterInput(codeFilter);
  }, [codeFilter]);

  const setMonth = (year: number, month: number) => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("year", String(year));
    p.set("month", String(month));
    router.push(`/dashboard/admin/affiliates?${p.toString()}`);
  };

  const setFilter = (code: string) => {
    const p = new URLSearchParams(searchParams.toString());
    if (code.trim()) p.set("code", code.trim());
    else p.delete("code");
    router.push(`/dashboard/admin/affiliates?${p.toString()}`);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    const result = await createAffiliateCode(createCode, createName);
    setCreateLoading(false);
    if (result.success) {
      setCreateCode("");
      setCreateName("");
      router.refresh();
    } else {
      setCreateError(result.error);
    }
  };

  const exportCsv = () => {
    const headers = [
      "Code",
      "Referrer name",
      "# Creators",
      "# Companies",
      "Creator earnings (€)",
      "Company credits (€)",
      "Commission (€)",
    ];
    const rows = report.map((r) => [
      r.code,
      r.referrerName,
      r.creatorCount,
      r.companyCount,
      (r.creatorEarningsCents / 100).toFixed(2),
      (r.companyCreditsCents / 100).toFixed(2),
      (r.commissionCents / 100).toFixed(2),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `affiliate-report-${currentYear}-${String(currentMonth).padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">{t("title")}</h1>
        <p className="text-sm text-[#64748B] mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Section 1: Codes */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">{t("codesTitle")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[#64748B]">
                <th className="pb-2 pr-4">{t("code")}</th>
                <th className="pb-2 pr-4">{t("referrerName")}</th>
                <th className="pb-2 pr-4">{t("referrerLink")}</th>
                <th className="pb-2">{t("createdAt")}</th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-[#64748B]">
                    {t("noCodes")}
                  </td>
                </tr>
              ) : (
                codes.map((r) => (
                  <tr key={r.code} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">{r.code}</td>
                    <td className="py-2 pr-4">{r.referrer_name}</td>
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[#1D4ED8] font-mono text-xs truncate max-w-[200px]" title={getReferrerUrl(r.code)}>
                          {getReferrerUrl(r.code)}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyReferrerLink(r.code)}
                          className={`shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded border text-xs transition-all duration-200 ${
                            copiedCode === r.code
                              ? "border-green-300 bg-green-50 text-green-700"
                              : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                          }`}
                          title={t("copyLink")}
                        >
                          {copiedCode === r.code ? (
                            <>
                              <Check className="w-3 h-3 animate-in zoom-in-50 duration-200" />
                              <span className="animate-in fade-in duration-200">{t("copied")}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              {t("copyLink")}
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 text-[#64748B]">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <form onSubmit={handleCreate} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[#64748B]">{t("codeStoredUppercase")}</span>
            <input
              type="text"
              value={createCode}
              onChange={(e) => setCreateCode(e.target.value)}
              placeholder="COMMUNAUTE_X"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-40"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[#64748B]">{t("referrerName")}</span>
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Jean Dupont"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48"
            />
          </label>
          <button
            type="submit"
            disabled={createLoading}
            className="flex items-center gap-2 px-4 py-2 bg-[#0F172A] text-white rounded-lg text-sm font-medium hover:bg-[#1e293b] disabled:opacity-50"
          >
            {createLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {t("create")}
          </button>
          {createError && (
            <p className="text-sm text-red-600 w-full">{createError}</p>
          )}
        </form>
      </section>

      {/* Section 2: Report */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">{t("reportTitle")}</h2>
        <p className="text-sm text-[#64748B] mb-4">
          {t("reportNote")}
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#64748B]">{t("month")} :</span>
            <select
              value={`${currentYear}-${currentMonth}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-").map(Number);
                setMonth(y, m);
              }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {monthOptions.map((opt) => (
                <option key={`${opt.year}-${opt.month}`} value={`${opt.year}-${opt.month}`}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setFilter(filterInput);
            }}
          >
            <span className="text-sm text-[#64748B]">{t("filterByCode")} :</span>
            <input
              type="text"
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              placeholder={t("optional")}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-40"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
            >
              {t("apply")}
            </button>
          </form>
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            {t("exportCsv")}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[#64748B]">
                <th className="pb-2 pr-4">{t("code")}</th>
                <th className="pb-2 pr-4">{t("name")}</th>
                <th className="pb-2 pr-4">{t("creatorsCount")}</th>
                <th className="pb-2 pr-4">{t("companiesCount")}</th>
                <th className="pb-2 pr-4">{t("creatorEarnings")}</th>
                <th className="pb-2 pr-4">{t("companyCredits")}</th>
                <th className="pb-2">{t("commission")}</th>
              </tr>
            </thead>
            <tbody>
              {report.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-[#64748B]">
                    {t("noData")}
                  </td>
                </tr>
              ) : (
                report.map((r) => (
                  <tr key={r.code} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">{r.code}</td>
                    <td className="py-2 pr-4">{r.referrerName}</td>
                    <td className="py-2 pr-4">{r.creatorCount}</td>
                    <td className="py-2 pr-4">{r.companyCount}</td>
                    <td className="py-2 pr-4">{formatCents(r.creatorEarningsCents)}</td>
                    <td className="py-2 pr-4">{formatCents(r.companyCreditsCents)}</td>
                    <td className="py-2 font-medium">{formatCents(r.commissionCents)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
