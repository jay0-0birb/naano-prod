"use client";

import { useEffect, useState } from "react";
import { getCollaborationLeads } from "./actions-v2";
import { maskIPAddress, formatConfidence, formatDaysAgo } from "@/lib/utils";
import {
  HelpCircle,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
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
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "date" | "confidence" | "intent" | "company_intent"
  >("company_intent");
  const [filterConfirmed, setFilterConfirmed] = useState(false);
  const [filterHighConfidence, setFilterHighConfidence] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

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

  // Calculate effective confidence with decay (Issue 1.1)
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

  // Download CSV with all fields
  const handleDownloadCSV = () => {
    if (leads.length === 0) {
      alert("Aucune donnée à exporter");
      return;
    }

    // Define CSV headers with all useful fields
    const headers = [
      // Basic info
      "Date",
      "Heure",
      "Créateur",
      // Layer 1: Session Intelligence
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
      // Layer 2: Company Inference
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
      // Layer 3: Intent Scoring
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

    // Convert leads to CSV rows
    const rows = leads.map((lead) => {
      const date = new Date(lead.occurredAt);
      const effectiveConfidence = getEffectiveConfidence(lead);
      const companyIntent = lead.company?.aggregatedIntent;

      return [
        // Basic info
        date.toLocaleDateString("fr-FR"),
        date.toLocaleTimeString("fr-FR"),
        lead.creatorName,
        // Layer 1
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
        lead.company?.isAmbiguous ? "Oui" : "Non",
        lead.company?.createdAt
          ? new Date(lead.company.createdAt).toLocaleString("fr-FR")
          : "",
        lead.company?.confirmedAt
          ? new Date(lead.company.confirmedAt).toLocaleString("fr-FR")
          : "",
        // Layer 3
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

  if (leads.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Aucun lead enrichi pour le moment.</p>
        <p className="text-sm mt-2">
          Les leads apparaîtront ici une fois qu'ils auront été enrichis avec
          des données d'entreprise (confiance ≥30%).
        </p>
        <p className="text-xs mt-1 text-gray-400">
          Seuls les clics avec identification d'entreprise sont affichés ici.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">Lead Feed</h2>
            <p className="text-sm text-gray-600">
              Visiteurs enrichis avec intelligence d'entreprise et scoring
              d'intention.
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-gray-500">
                <span
                  className="inline-flex items-center"
                  title="Les données sont probabilistes avant signup, confirmées après."
                >
                  <HelpCircle className="w-3 h-3" />
                </span>
                <span>
                  Les données sont probabilistes avant signup, confirmées après.
                </span>
              </span>
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
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filtres
            </button>
          </div>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trier par
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="company_intent">
                    Intention entreprise (recommandé)
                  </option>
                  <option value="intent">Intention session</option>
                  <option value="confidence">Confiance</option>
                  <option value="date">Date</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filterConfirmed}
                    onChange={(e) => setFilterConfirmed(e.target.checked)}
                    className="rounded"
                  />
                  Afficher uniquement les confirmés
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={filterHighConfidence}
                    onChange={(e) => setFilterHighConfidence(e.target.checked)}
                    className="rounded"
                  />
                  Confiance élevée uniquement (≥70%)
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leads list */}
      <div className="space-y-4">
        {leads.map((lead) => {
          const effectiveConfidence = getEffectiveConfidence(lead);
          const companyIntent = lead.company?.aggregatedIntent;
          const daysOld = lead.company
            ? Math.floor(
                (Date.now() - new Date(lead.company.createdAt).getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            : null;

          return (
            <div
              key={lead.id}
              className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow"
            >
              {/* Header: Company Name with prominent uncertainty indicators (Issue 5.1) */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  {lead.company ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {lead.company.attributionState === "confirmed" ? (
                          <>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {lead.company.name}
                            </h3>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Confirmé
                            </span>
                          </>
                        ) : lead.company.attributionState === "mismatch" ? (
                          <>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {lead.company.name}
                            </h3>
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Incompatible
                            </span>
                          </>
                        ) : lead.company.isAmbiguous ? (
                          <>
                            <h3 className="text-lg font-semibold text-gray-700">
                              <span className="text-gray-500">Possible: </span>
                              {lead.company.name}
                            </h3>
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Ambigu
                            </span>
                          </>
                        ) : (
                          <>
                            <h3 className="text-lg font-semibold text-gray-700">
                              <span className="text-gray-500">Probable: </span>
                              {lead.company.name}
                            </h3>
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Probable ({formatConfidence(effectiveConfidence)})
                            </span>
                          </>
                        )}
                      </div>
                      {lead.company.domain && (
                        <p className="text-sm text-gray-600 mt-1">
                          {lead.company.domain}
                        </p>
                      )}
                      {daysOld !== null && daysOld > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Identifié il y a {formatDaysAgo(daysOld)} • Confiance
                          effective: {formatConfidence(effectiveConfidence)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <h3 className="text-lg font-semibold text-gray-500">
                      Entreprise inconnue
                    </h3>
                  )}
                </div>

                {/* Intent scores - Company-level prominently displayed (Issue 3.2) */}
                <div className="text-right">
                  {companyIntent ? (
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(companyIntent.avg_intent_score)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Intention entreprise
                        <span
                          className="inline-flex items-center ml-1"
                          title="Score d'intention agrégé au niveau entreprise (plus fiable que session individuelle)"
                        >
                          <HelpCircle className="w-3 h-3" />
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {companyIntent.total_sessions} session
                        {companyIntent.total_sessions > 1 ? "s" : ""}
                      </div>
                    </div>
                  ) : lead.intent ? (
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {lead.intent.score}
                      </div>
                      <div className="text-xs text-gray-500">
                        Intention session
                        <span
                          className="inline-flex items-center ml-1"
                          title="Score d'intention basé sur l'engagement, la qualité du référent, et les signaux comportementaux. Plus élevé = plus susceptible de convertir."
                        >
                          <HelpCircle className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Layer 2: Company Details */}
              {lead.company && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {lead.company.industry && (
                      <div>
                        <span className="text-gray-500">Industrie:</span>{" "}
                        <span className="font-medium">
                          {lead.company.industry}
                        </span>
                      </div>
                    )}
                    {lead.company.size && (
                      <div>
                        <span className="text-gray-500">Taille:</span>{" "}
                        <span className="font-medium">{lead.company.size}</span>
                      </div>
                    )}
                    {lead.company.location && (
                      <div>
                        <span className="text-gray-500">Localisation:</span>{" "}
                        <span className="font-medium">
                          {lead.company.location}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Confiance:</span>{" "}
                      <span className="font-medium">
                        {formatConfidence(effectiveConfidence)}
                        {effectiveConfidence < lead.company.confidenceScore && (
                          <span className="text-xs text-orange-600 ml-1">
                            (décroissance:{" "}
                            {formatConfidence(lead.company.confidenceScore)} →{" "}
                            {formatConfidence(effectiveConfidence)})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  {lead.company.confidenceReasons.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">
                        Raisons de la confiance:
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {lead.company.confidenceReasons.map((reason, idx) => (
                          <span
                            key={idx}
                            className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                          >
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Layer 1: Session Intelligence with masked IP (Issue 6.1) */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Intelligence de session
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Pays:</span>{" "}
                    <span className="font-medium">
                      {lead.session.country || "Inconnu"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ville:</span>{" "}
                    <span className="font-medium">
                      {lead.session.city || "Inconnu"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">IP:</span>{" "}
                    <span className="font-medium">
                      {maskIPAddress(lead.session.ipAddress)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Appareil:</span>{" "}
                    <span className="font-medium">
                      {lead.session.deviceType || "Inconnu"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">OS:</span>{" "}
                    <span className="font-medium">
                      {lead.session.os || "Inconnu"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Navigateur:</span>{" "}
                    <span className="font-medium">
                      {lead.session.browser || "Inconnu"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Réseau:</span>{" "}
                    <span className="font-medium">
                      {lead.session.networkType || "Inconnu"}
                    </span>
                  </div>
                  {lead.session.timeOnSite && (
                    <div>
                      <span className="text-gray-500">Temps sur site:</span>{" "}
                      <span className="font-medium">
                        {lead.session.timeOnSite}s
                      </span>
                    </div>
                  )}
                  {lead.session.referrer && (
                    <div>
                      <span className="text-gray-500">Source:</span>{" "}
                      <span className="font-medium">
                        {lead.session.referrer.includes("linkedin.com")
                          ? "LinkedIn"
                          : lead.session.referrer}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Layer 3: Intent Details */}
              {lead.intent && (
                <div className="mb-4 p-4 bg-green-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Signaux d'intention (session)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lead.intent.isRepeatVisit && (
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                        Visite répétée ({lead.intent.visitCount}x)
                      </span>
                    )}
                    {lead.intent.viewedPricing && (
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                        Page tarifs
                      </span>
                    )}
                    {lead.intent.viewedSecurity && (
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                        Page sécurité
                      </span>
                    )}
                    {lead.intent.viewedIntegrations && (
                      <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                        Page intégrations
                      </span>
                    )}
                    {lead.intent.recencyWeight < 1.0 && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                        Poids recence:{" "}
                        {Math.round(lead.intent.recencyWeight * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Company-level intent trend (Issue 3.2) */}
              {companyIntent && (
                <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Intention entreprise (agrégée)
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Score moyen:</span>{" "}
                      <span className="font-medium">
                        {Math.round(companyIntent.avg_intent_score)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Score max:</span>{" "}
                      <span className="font-medium">
                        {companyIntent.max_intent_score}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tendance:</span>{" "}
                      <span
                        className={`font-medium ${
                          companyIntent.intent_trend === "increasing"
                            ? "text-green-600"
                            : companyIntent.intent_trend === "decreasing"
                              ? "text-red-600"
                              : "text-gray-600"
                        }`}
                      >
                        {companyIntent.intent_trend === "increasing"
                          ? "↑ Croissante"
                          : companyIntent.intent_trend === "decreasing"
                            ? "↓ Décroissante"
                            : "→ Stable"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Visites répétées:</span>{" "}
                      <span className="font-medium">
                        {companyIntent.repeat_visits}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer: Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-200">
                <div>
                  <span>Créateur:</span>{" "}
                  <span className="font-medium">{lead.creatorName}</span>
                </div>
                <div>
                  {new Date(lead.occurredAt).toLocaleString("fr-FR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
