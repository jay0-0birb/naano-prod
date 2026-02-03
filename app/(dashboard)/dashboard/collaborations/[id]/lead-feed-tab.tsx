"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { getCollaborationLeads } from "./actions-v2";
import {
  maskIPAddress,
  formatConfidence,
  getLeadTypeLabel,
} from "@/lib/utils";
import {
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  Download,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

interface Lead {
  id: string;
  occurredAt: string;
  session: {
    sessionId: string;
    ipAddress: string;
    country: string | null;
    city: string | null;
    deviceType: string | null;
    os: string | null;
    browser: string | null;
    referrer: string | null;
    timeOnSite: number | null;
    networkType: string | null;
  };
  company: {
    name: string;
    domain: string | null;
    industry: string | null;
    size: string | null;
    location: string | null;
    confidenceScore: number;
    effectiveConfidenceScore: number | null;
    confidenceReasons: string[];
    attributionState: "inferred" | "confirmed" | "mismatch" | "disputed";
    asnOrganization: string | null;
    isAmbiguous: boolean;
    createdAt: string;
    confirmedAt: string | null;
    aggregatedIntent: {
      avg_intent_score: number;
      max_intent_score: number;
      total_sessions: number;
      repeat_visits: number;
      last_high_intent_at: string | null;
      intent_trend: "increasing" | "stable" | "decreasing";
    } | null;
  } | null;
  intent: {
    score: number;
    isRepeatVisit: boolean;
    visitCount: number;
    viewedPricing: boolean;
    viewedSecurity: boolean;
    viewedIntegrations: boolean;
    signals: any;
    recencyWeight: number;
    daysSinceSession: number | null;
  } | null;
  creatorName: string;
}

interface LeadFeedTabProps {
  collaborationId: string;
}

export function LeadFeedTab({ collaborationId }: LeadFeedTabProps) {
  const t = useTranslations("leadFeed");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "date" | "confidence" | "intent" | "company_intent"
  >("company_intent");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterConfirmed, setFilterConfirmed] = useState(false);
  const [filterHighConfidence, setFilterHighConfidence] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {},
  );
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const tableCardRef = useRef<HTMLDivElement>(null);

  // Force scroll container width so overflow-x works (match global lead feed)
  useEffect(() => {
    const card = tableCardRef.current;
    const scrollEl = tableScrollRef.current;
    if (!card || !scrollEl) return;
    const setWidth = () => {
      scrollEl.style.width = `${card.offsetWidth}px`;
      scrollEl.style.maxWidth = `${card.offsetWidth}px`;
    };
    setWidth();
    const ro = new ResizeObserver(setWidth);
    ro.observe(card);
    return () => ro.disconnect();
  }, [loading, leads.length]);

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      setError(null);

      const result = await getCollaborationLeads(
        collaborationId,
        sortBy,
        filterConfirmed,
        filterHighConfidence,
      );

      if (result.error) {
        setError(result.error + (result.details ? `: ${result.details}` : ""));
        console.error("Lead fetch error:", result);
      } else if (result.success) {
        setLeads(result.leads || []);
      }

      setLoading(false);
    }

    fetchLeads();
  }, [collaborationId, sortBy, filterConfirmed, filterHighConfidence]);

  // Calculate effective confidence with decay
  const getEffectiveConfidence = (lead: Lead): number => {
    if (!lead.company) return 0;
    if (lead.company.attributionState === "confirmed") {
      return 1.0; // No decay for confirmed
    }

    const createdAt = new Date(lead.company.createdAt);
    const daysOld = Math.floor(
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Decay: -0.1% per day, max -30%, min 30%
    const decay = Math.min(daysOld * 0.001, 0.3);
    return Math.max(lead.company.confidenceScore - decay, 0.3);
  };

  // Filter and sort leads (match global lead feed behavior)
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = [...leads];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((lead) => {
        const companyName = lead.company?.name?.toLowerCase() || "";
        const domain = lead.company?.domain?.toLowerCase() || "";
        const creator = lead.creatorName.toLowerCase();
        const country = lead.session.country?.toLowerCase() || "";
        const city = lead.session.city?.toLowerCase() || "";
        const industry = lead.company?.industry?.toLowerCase() || "";
        return (
          companyName.includes(query) ||
          domain.includes(query) ||
          creator.includes(query) ||
          country.includes(query) ||
          city.includes(query) ||
          industry.includes(query)
        );
      });
    }

    Object.entries(columnFilters).forEach(([column, value]) => {
      if (!value) return;
      const filterValue = value.toLowerCase();
      filtered = filtered.filter((lead) => {
        switch (column) {
          case "company":
            return lead.company?.name?.toLowerCase().includes(filterValue);
          case "country":
            return lead.session.country?.toLowerCase().includes(filterValue);
          case "industry":
            return lead.company?.industry?.toLowerCase().includes(filterValue);
          case "creator":
            return lead.creatorName.toLowerCase().includes(filterValue);
          default:
            return true;
        }
      });
    });

    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;
      switch (sortBy) {
        case "date":
          aValue = new Date(a.occurredAt).getTime();
          bValue = new Date(b.occurredAt).getTime();
          break;
        case "confidence":
          aValue = getEffectiveConfidence(a);
          bValue = getEffectiveConfidence(b);
          break;
        case "intent":
          aValue = a.intent?.score ?? 0;
          bValue = b.intent?.score ?? 0;
          break;
        case "company_intent":
          aValue = a.company?.aggregatedIntent?.avg_intent_score ?? 0;
          bValue = b.company?.aggregatedIntent?.avg_intent_score ?? 0;
          break;
        default:
          return 0;
      }
      if (sortDirection === "asc") return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });

    return filtered;
  }, [leads, searchQuery, columnFilters, sortBy, sortDirection]);

  // Download CSV with all fields (English)
  const handleDownloadCSV = () => {
    if (leads.length === 0) {
      alert(t("noDataExport"));
      return;
    }

    // Define CSV headers (English)
    const headers = [
      // Basic info
      "Date",
      "Time",
      "Creator",
      // Layer 1: Session Intelligence
      "IP (masked)",
      "Country",
      "City",
      "Device type",
      "OS",
      "Browser",
      "Network type",
      "Lead type",
      "Time on site (s)",
      "Referrer",
      "Session ID",
      // Layer 2: Company Inference
      "Company name",
      "Company domain",
      "Industry",
      "Company size",
      "Company location",
      "Confidence score",
      "Effective confidence",
      "Attribution state",
      "Confidence reasons",
      "ASN Organization",
      "Ambiguous",
      "Enrichment date",
      "Confirmation date",
      // Layer 3: Intent Scoring
      "Session intent score",
      "Company intent score (avg)",
      "Company intent score (max)",
      "Intent trend",
      "Repeat visit",
      "Visit count",
      "Working hours",
      "Recency weight",
      "Days since session",
      "Viewed pricing",
      "Viewed security",
      "Viewed integrations",
      "Company total sessions",
      "Company repeat visits",
      "Last high intent",
    ];

    // Convert leads to CSV rows
    const rows = leads.map((lead) => {
      const date = new Date(lead.occurredAt);
      const effectiveConfidence = getEffectiveConfidence(lead);
      const companyIntent = lead.company?.aggregatedIntent;

      return [
        // Basic info
        date.toISOString().split("T")[0],
        date.toTimeString().slice(0, 8),
        lead.creatorName,
        // Layer 1
        maskIPAddress(lead.session.ipAddress),
        lead.session.country || "",
        lead.session.city || "",
        lead.session.deviceType || "",
        lead.session.os || "",
        lead.session.browser || "",
        lead.session.networkType || "",
        getLeadTypeLabel(lead.session.networkType),
        lead.session.timeOnSite?.toString() || "",
        lead.session.referrer || "",
        lead.session.sessionId || "",
        // Layer 2
        lead.company?.name || "",
        lead.company?.domain || "",
        lead.company?.industry || "",
        lead.company?.size || "",
        lead.company?.location || "",
        lead.company
          ? (lead.company.confidenceScore * 100).toFixed(1) + "%"
          : "",
        lead.company ? (effectiveConfidence * 100).toFixed(1) + "%" : "",
        lead.company?.attributionState || "",
        lead.company?.confidenceReasons.join("; ") || "",
        lead.company?.asnOrganization || "",
        lead.company?.isAmbiguous ? "Yes" : "No",
        lead.company?.createdAt
          ? new Date(lead.company.createdAt).toISOString()
          : "",
        lead.company?.confirmedAt
          ? new Date(lead.company.confirmedAt).toISOString()
          : "",
        // Layer 3
        lead.intent?.score.toString() || "",
        companyIntent
          ? Math.round(companyIntent.avg_intent_score).toString()
          : "",
        companyIntent ? companyIntent.max_intent_score.toString() : "",
        companyIntent?.intent_trend || "",
        lead.intent?.isRepeatVisit ? "Yes" : "No",
        lead.intent?.visitCount.toString() || "",
        lead.intent?.signals?.isWorkingHours ? "Yes" : "No",
        lead.intent?.recencyWeight
          ? (lead.intent.recencyWeight * 100).toFixed(0) + "%"
          : "",
        lead.intent?.daysSinceSession?.toString() || "",
        lead.intent?.viewedPricing ? "Yes" : "No",
        lead.intent?.viewedSecurity ? "Yes" : "No",
        lead.intent?.viewedIntegrations ? "Yes" : "No",
        companyIntent?.total_sessions.toString() || "",
        companyIntent?.repeat_visits.toString() || "",
        companyIntent?.last_high_intent_at
          ? new Date(companyIntent.last_high_intent_at).toISOString()
          : "",
      ];
    });

    // Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            // Escape commas and quotes in cell values
            const cellStr = String(cell || "");
            if (
              cellStr.includes(",") ||
              cellStr.includes('"') ||
              cellStr.includes("\n")
            ) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(","),
      ),
    ].join("\n");

    // Create blob and download
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    }); // BOM for Excel
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `leads-${collaborationId}-${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">{t("loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>{t("noLeads")}</p>
        <p className="text-sm mt-2">{t("noLeadsDesc")}</p>
      </div>
    );
  }

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  const SortIcon = ({ column }: { column: typeof sortBy }) => {
    if (sortBy !== column) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3 text-blue-600" />
    ) : (
      <ChevronDown className="w-3 h-3 text-blue-600" />
    );
  };

  return (
    <div className="space-y-4 w-full min-w-0 overflow-x-hidden">
      {/* Header (match global lead feed) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">{t("leadFeedTitle")}</h2>
            <p className="text-sm text-gray-600">{t("allLeadsDesc")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              {t("downloadCsv")}
            </button>
          </div>
        </div>

        {/* Search (match global) */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Table card with horizontal scroll (match global) */}
      <div
        ref={tableCardRef}
        className="bg-white border border-gray-200 rounded-lg w-full overflow-hidden"
        style={{ maxWidth: "min(100%, calc(100vw - 18rem))" }}
      >
        <div
          ref={tableScrollRef}
          className="overflow-x-auto overflow-y-visible"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <table
            className="text-sm table-auto"
            style={{ minWidth: "max-content" }}
          >
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                  <div className="flex items-center gap-2">
                    {t("date")}
                    <button
                      onClick={() => handleSort("date")}
                      className="hover:text-blue-600"
                    >
                      <SortIcon column="date" />
                    </button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    {t("company")}
                    <button
                      onClick={() => handleSort("company_intent")}
                      className="hover:text-blue-600"
                    >
                      <SortIcon column="company_intent" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder={t("filter")}
                    value={columnFilters.company || ""}
                    onChange={(e) =>
                      setColumnFilters({
                        ...columnFilters,
                        company: e.target.value,
                      })
                    }
                    className="mt-1 w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  {t("domain")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    {t("confidence")}
                    <button
                      onClick={() => handleSort("confidence")}
                      className="hover:text-blue-600"
                    >
                      <SortIcon column="confidence" />
                    </button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  {t("state")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    {t("intent")}
                    <button
                      onClick={() => handleSort("intent")}
                      className="hover:text-blue-600"
                    >
                      <SortIcon column="intent" />
                    </button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  <input
                    type="text"
                    placeholder={t("filter")}
                    value={columnFilters.country || ""}
                    onChange={(e) =>
                      setColumnFilters({
                        ...columnFilters,
                        country: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                  {t("country")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  {t("city")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  <input
                    type="text"
                    placeholder={t("filter")}
                    value={columnFilters.industry || ""}
                    onChange={(e) =>
                      setColumnFilters({
                        ...columnFilters,
                        industry: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                  {t("industry")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  {t("size")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  <input
                    type="text"
                    placeholder={t("filter")}
                    value={columnFilters.creator || ""}
                    onChange={(e) =>
                      setColumnFilters({
                        ...columnFilters,
                        creator: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                  {t("creator")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  {t("device")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  {t("os")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  {t("browser")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  {t("network")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  {t("timeSec")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  {t("source")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  {t("repeated")}
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  {t("visits")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedLeads.map((lead) => {
                const effectiveConfidence = getEffectiveConfidence(lead);
                const companyIntent = lead.company?.aggregatedIntent;

                return (
                  <tr
                    key={lead.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-900 sticky left-0 bg-white z-10 border-r border-gray-200">
                      {new Date(lead.occurredAt).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(lead.occurredAt).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {lead.company ? (
                          <>
                            {lead.company.attributionState === "confirmed" ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            ) : lead.company.isAmbiguous ? (
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            )}
                            <span className="font-medium text-gray-900">
                              {lead.company.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-400">{t("unknown")}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.company?.domain || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">
                        {formatConfidence(effectiveConfidence)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {lead.company?.attributionState === "confirmed" ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {t("confirmed")}
                        </span>
                      ) : lead.company?.isAmbiguous ? (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          {t("ambiguous")}
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          {t("probable")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-blue-600">
                        {companyIntent
                          ? Math.round(companyIntent.avg_intent_score)
                          : lead.intent?.score ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.session.country || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.session.city || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.company?.industry || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.company?.size || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.creatorName}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.session.deviceType || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.session.os || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.session.browser || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.session.networkType || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.session.timeOnSite ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.session.referrer
                        ? lead.session.referrer.includes("linkedin.com")
                          ? "LinkedIn"
                          : lead.session.referrer.includes("twitter.com")
                            ? "Twitter"
                            : lead.session.referrer
                        : "Direct"}
                    </td>
                    <td className="px-4 py-3">
                      {lead.intent?.isRepeatVisit ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          {t("yes")}
                        </span>
                      ) : (
                        <span className="text-gray-400">{t("no")}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.intent?.visitCount ?? "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredAndSortedLeads.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            {t("noResults")}
          </div>
        )}
      </div>

      {/* Results count (match global) */}
      <div className="text-sm text-gray-600">
        {t("showingCount", {
          filtered: filteredAndSortedLeads.length,
          total: leads.length,
        })}
      </div>
    </div>
  );
}
