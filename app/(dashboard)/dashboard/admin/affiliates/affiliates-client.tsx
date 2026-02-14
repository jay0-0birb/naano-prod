"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createAffiliateCode } from "./actions";
import type { AffiliateReportRow } from "@/lib/affiliate-report";
import { Loader2, Download, Plus } from "lucide-react";

type CodeRow = {
  code: string;
  referrer_name: string;
  created_at: string;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatCents(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(cents / 100);
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [createCode, setCreateCode] = useState("");
  const [createName, setCreateName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [filterInput, setFilterInput] = useState(codeFilter);
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
        <h1 className="text-2xl font-bold text-[#0F172A]">Affiliates (apporteurs)</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Codes apporteurs et rapport de commission (6 mois par entité, paiement manuel).
        </p>
      </div>

      {/* Section 1: Codes */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Codes apporteurs</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[#64748B]">
                <th className="pb-2 pr-4">Code</th>
                <th className="pb-2 pr-4">Nom de l&apos;apporteur</th>
                <th className="pb-2">Créé le</th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-[#64748B]">
                    Aucun code. Créez-en un ci-dessous.
                  </td>
                </tr>
              ) : (
                codes.map((r) => (
                  <tr key={r.code} className="border-b border-gray-100">
                    <td className="py-2 pr-4 font-medium">{r.code}</td>
                    <td className="py-2 pr-4">{r.referrer_name}</td>
                    <td className="py-2 text-[#64748B]">
                      {r.created_at
                        ? new Date(r.created_at).toLocaleDateString("fr-FR")
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
            <span className="text-xs text-[#64748B]">Code (stocké en majuscules)</span>
            <input
              type="text"
              value={createCode}
              onChange={(e) => setCreateCode(e.target.value)}
              placeholder="COMMUNAUTE_X"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-40"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-[#64748B]">Nom de l&apos;apporteur</span>
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
            Créer
          </button>
          {createError && (
            <p className="text-sm text-red-600 w-full">{createError}</p>
          )}
        </form>
      </section>

      {/* Section 2: Report */}
      <section className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#111827] mb-4">Rapport de commission</h2>
        <p className="text-sm text-[#64748B] mb-4">
          Paiements calculés mensuellement ; seules les transactions dans la fenêtre de 6 mois
          après attribution sont prises en compte.
        </p>

        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#64748B]">Mois :</span>
            <select
              value={`${currentYear}-${currentMonth}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-").map(Number);
                setMonth(y, m);
              }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
            >
              {Array.from({ length: 24 }, (_, i) => {
                const d = new Date();
                d.setMonth(d.getMonth() - (23 - i));
                const y = d.getFullYear();
                const m = d.getMonth() + 1;
                return (
                  <option key={`${y}-${m}`} value={`${y}-${m}`}>
                    {MONTHS[m - 1]} {y}
                  </option>
                );
              })}
            </select>
          </div>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              setFilter(filterInput);
            }}
          >
            <span className="text-sm text-[#64748B]">Filtrer par code :</span>
            <input
              type="text"
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              placeholder="Optionnel"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-40"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
            >
              Appliquer
            </button>
          </form>
          <button
            type="button"
            onClick={exportCsv}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-[#64748B]">
                <th className="pb-2 pr-4">Code</th>
                <th className="pb-2 pr-4">Nom</th>
                <th className="pb-2 pr-4"># Créateurs</th>
                <th className="pb-2 pr-4"># Entreprises</th>
                <th className="pb-2 pr-4">Gains créateurs (6 mois)</th>
                <th className="pb-2 pr-4">Credits entreprises (6 mois)</th>
                <th className="pb-2">Commission 10 %</th>
              </tr>
            </thead>
            <tbody>
              {report.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-[#64748B]">
                    Aucune donnée pour ce mois / ce filtre.
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
