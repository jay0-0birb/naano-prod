"use client";

import { useEffect, useState, useMemo } from "react";
import { getGlobalLeads } from "./actions";
import { maskIPAddress, formatConfidence, formatDaysAgo } from "@/lib/utils";
import {
  HelpCircle,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Search,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";
import Link from "next/link";

interface Lead {
  id: string;
  occurredAt: string;
  collaborationId: string | null;
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

export default function GlobalLeadFeedTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "date" | "confidence" | "intent" | "company_intent"
  >("company_intent");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [filterConfirmed, setFilterConfirmed] = useState(false);
  const [filterHighConfidence, setFilterHighConfidence] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      setError(null);

      const result = await getGlobalLeads(
        sortBy,
        filterConfirmed,
        filterHighConfidence
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
  }, [sortBy, filterConfirmed, filterHighConfidence]);

  // Calculate effective confidence with decay
  const getEffectiveConfidence = (lead: Lead): number => {
    if (!lead.company) return 0;
    if (lead.company.attributionState === "confirmed") {
      return 1.0; // No decay for confirmed
    }

    const createdAt = new Date(lead.company.createdAt);
    const daysOld = Math.floor(
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Decay: -0.1% per day, max -30%, min 30%
    const decay = Math.min(daysOld * 0.001, 0.30);
    return Math.max(lead.company.confidenceScore - decay, 0.30);
  };

  // Filter and sort leads - MUST be called before any early returns
  const filteredAndSortedLeads = useMemo(() => {
    let filtered = [...leads];

    // Apply search query
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

    // Apply column filters
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

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

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
          aValue = a.intent?.score || 0;
          bValue = b.intent?.score || 0;
          break;
        case "company_intent":
          aValue = a.company?.aggregatedIntent?.avg_intent_score || 0;
          bValue = b.company?.aggregatedIntent?.avg_intent_score || 0;
          break;
        default:
          return 0;
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [leads, searchQuery, columnFilters, sortBy, sortDirection]);

  // Download CSV with all fields
  const handleDownloadCSV = () => {
    if (leads.length === 0) {
      alert("Aucune donnée à exporter");
      return;
    }

    // Same headers as collaboration lead feed
    const headers = [
      "Date",
      "Heure",
      "Collaboration ID",
      "Créateur",
      "IP (masquée)",
      "Pays",
      "Ville",
      "Type d'appareil",
      "OS",
      "Navigateur",
      "Type de réseau",
      "Temps sur site (s)",
      "Référent",
      "Session ID",
      "Nom entreprise",
      "Domaine entreprise",
      "Industrie",
      "Taille entreprise",
      "Localisation entreprise",
      "Score de confiance",
      "Confiance effective",
      "État d'attribution",
      "Raisons de confiance",
      "ASN Organisation",
      "Ambigu",
      "Date d'enrichissement",
      "Date de confirmation",
      "Score intention session",
      "Score intention entreprise (moyen)",
      "Score intention entreprise (max)",
      "Tendance intention",
      "Visite répétée",
      "Nombre de visites",
      "Heures de travail",
      "Poids de récence",
      "Jours depuis session",
      "A vu tarifs",
      "A vu sécurité",
      "A vu intégrations",
      "Total sessions entreprise",
      "Visites répétées entreprise",
      "Dernière haute intention",
    ];

    const rows = leads.map((lead) => {
      const date = new Date(lead.occurredAt);
      const effectiveConfidence = getEffectiveConfidence(lead);
      const companyIntent = lead.company?.aggregatedIntent;

      return [
        date.toLocaleDateString("fr-FR"),
        date.toLocaleTimeString("fr-FR"),
        lead.collaborationId || "",
        lead.creatorName,
        maskIPAddress(lead.session.ipAddress),
        lead.session.country || "",
        lead.session.city || "",
        lead.session.deviceType || "",
        lead.session.os || "",
        lead.session.browser || "",
        lead.session.networkType || "",
        lead.session.timeOnSite?.toString() || "",
        lead.session.referrer || "",
        lead.session.sessionId || "",
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
        lead.company?.isAmbiguous ? "Oui" : "Non",
        lead.company?.createdAt
          ? new Date(lead.company.createdAt).toLocaleString("fr-FR")
          : "",
        lead.company?.confirmedAt
          ? new Date(lead.company.confirmedAt).toLocaleString("fr-FR")
          : "",
        lead.intent?.score.toString() || "",
        companyIntent
          ? Math.round(companyIntent.avg_intent_score).toString()
          : "",
        companyIntent ? companyIntent.max_intent_score.toString() : "",
        companyIntent?.intent_trend || "",
        lead.intent?.isRepeatVisit ? "Oui" : "Non",
        lead.intent?.visitCount.toString() || "",
        lead.intent?.signals?.isWorkingHours ? "Oui" : "Non",
        lead.intent?.recencyWeight
          ? (lead.intent.recencyWeight * 100).toFixed(0) + "%"
          : "",
        lead.intent?.daysSinceSession?.toString() || "",
        lead.intent?.viewedPricing ? "Oui" : "Non",
        lead.intent?.viewedSecurity ? "Oui" : "Non",
        lead.intent?.viewedIntegrations ? "Oui" : "Non",
        companyIntent?.total_sessions.toString() || "",
        companyIntent?.repeat_visits.toString() || "",
        companyIntent?.last_high_intent_at
          ? new Date(companyIntent.last_high_intent_at).toLocaleString("fr-FR")
          : "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
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
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `leads-globaux-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Chargement des leads...</div>
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

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
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

  if (leads.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Aucun lead enrichi pour le moment.</p>
        <p className="text-sm mt-2">
          Les leads apparaîtront ici une fois qu'ils auront été enrichis avec
          des données d'entreprise (confiance ≥30%).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Lead Feed Global</h2>
            <p className="text-sm text-gray-600">
              Tous vos leads enrichis à travers toutes vos collaborations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger CSV
            </button>
          </div>
        </div>

        {/* Global search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par entreprise, domaine, créateur, pays, ville, industrie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                  <div className="flex items-center gap-2">
                    Date
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
                    Entreprise
                    <button
                      onClick={() => handleSort("company_intent")}
                      className="hover:text-blue-600"
                    >
                      <SortIcon column="company_intent" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Filtrer..."
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
                  Domaine
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    Confiance
                    <button
                      onClick={() => handleSort("confidence")}
                      className="hover:text-blue-600"
                    >
                      <SortIcon column="confidence" />
                    </button>
                  </div>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  État
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  <div className="flex items-center gap-2">
                    Intention
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
                    placeholder="Filtrer..."
                    value={columnFilters.country || ""}
                    onChange={(e) =>
                      setColumnFilters({
                        ...columnFilters,
                        country: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                  Pays
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Ville
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  <input
                    type="text"
                    placeholder="Filtrer..."
                    value={columnFilters.industry || ""}
                    onChange={(e) =>
                      setColumnFilters({
                        ...columnFilters,
                        industry: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                  Industrie
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Taille
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  <input
                    type="text"
                    placeholder="Filtrer..."
                    value={columnFilters.creator || ""}
                    onChange={(e) =>
                      setColumnFilters({
                        ...columnFilters,
                        creator: e.target.value,
                      })
                    }
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                  Créateur
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Appareil
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  OS
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Navigateur
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Réseau
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Temps (s)
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Source
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Répété
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Visites
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
                          <span className="text-gray-400">Inconnu</span>
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
                          Confirmé
                        </span>
                      ) : lead.company?.isAmbiguous ? (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                          Ambigu
                        </span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Probable
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-blue-600">
                        {companyIntent
                          ? Math.round(companyIntent.avg_intent_score)
                          : lead.intent?.score || "-"}
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
                    <td className="px-4 py-3">
                      {lead.collaborationId ? (
                        <Link
                          href={`/dashboard/collaborations/${lead.collaborationId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {lead.creatorName}
                        </Link>
                      ) : (
                        <span className="text-gray-700">{lead.creatorName}</span>
                      )}
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
                      {lead.session.timeOnSite || "-"}
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
                          Oui
                        </span>
                      ) : (
                        <span className="text-gray-400">Non</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {lead.intent?.visitCount || "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredAndSortedLeads.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            Aucun résultat trouvé avec les filtres actuels.
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-600">
        Affichage de {filteredAndSortedLeads.length} sur {leads.length} leads
      </div>
    </div>
  );
}

