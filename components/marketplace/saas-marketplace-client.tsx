"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Filter, Building2 } from "lucide-react";
import SaasCard from "@/components/marketplace/saas-card";
import { SAAS_TIERS, SaasTier } from "@/lib/subscription-config";
import type { SaasCompanyWithProfile } from "@/types/database";

interface SaasMarketplaceClientProps {
  companies: SaasCompanyWithProfile[];
  activeCreatorsBySaas: Record<string, number>;
  appliedSaasIds: string[];
  creatorProfileId: string | null;
}

export default function SaasMarketplaceClient({
  companies,
  activeCreatorsBySaas,
  appliedSaasIds,
  creatorProfileId,
}: SaasMarketplaceClientProps) {
  const t = useTranslations("dashboard");

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [industryFilter, setIndustryFilter] = useState("");

  const hasActiveFilters = !!industryFilter;

  const uniqueIndustries = useMemo(
    () =>
      Array.from(
        new Set(
          companies
            .map((company) => company.industry)
            .filter(
              (industry): industry is string =>
                !!industry && industry.trim() !== "",
            ),
        ),
      ).sort(),
    [companies],
  );

  const filteredCompanies = useMemo(() => {
    let list = [...companies];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((company) => {
        const name = company.company_name.toLowerCase();
        const description = company.description?.toLowerCase() || "";
        const industry = company.industry?.toLowerCase() || "";

        return (
          name.includes(query) ||
          description.includes(query) ||
          industry.includes(query)
        );
      });
    }

    if (industryFilter) {
      const industryLower = industryFilter.toLowerCase();
      list = list.filter(
        (company) => company.industry?.toLowerCase() === industryLower,
      );
    }

    return list;
  }, [companies, searchQuery, industryFilter]);

  const handleResetFilters = () => {
    setIndustryFilter("");
  };

  const hasCompanies = companies.length > 0;

  return (
    <div>
      {/* Search & Filters */}
      <div className="relative mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder={t("searchCompany")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
              hasActiveFilters
                ? "bg-blue-50 text-[#111827] border-[#3B82F6]"
                : "bg-white border-gray-200 text-[#64748B] hover:text-[#111827] hover:border-gray-300"
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="text-sm">{t("filters")}</span>
          </button>
        </div>

        {showFilters && (
          <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#111827]">
                {t("filters")}
              </h3>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-[#64748B] hover:text-[#111827]"
                >
                  {t("clearFilters")}
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Industry only */}
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">
                  {t("industry")}
                </label>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10"
                >
                  <option value="">{t("allIndustries")}</option>
                  {uniqueIndustries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Companies Grid */}
      {filteredCompanies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
          {filteredCompanies.map((company) => {
            const tier = (company.subscription_tier || "starter") as SaasTier;
            const tierConfig = SAAS_TIERS[tier];
            const activeCreators = activeCreatorsBySaas[company.id] || 0;
            const maxCreators = tierConfig.maxCreators;
            const isFull =
              maxCreators !== Infinity && activeCreators >= maxCreators;

            return (
              <SaasCard
                key={company.id}
                company={company}
                hasApplied={appliedSaasIds.includes(company.id)}
                creatorProfileId={creatorProfileId}
                isFull={isFull}
              />
            );
          })}
        </div>
      ) : hasCompanies ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-[#94A3B8]" />
          </div>
          <h3 className="text-lg font-semibold text-[#111827] mb-2">
            {t("noCreators")}
          </h3>
          <p className="text-[#64748B] text-sm max-w-md mx-auto">
            {t("noCreatorsDesc")}
          </p>
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-[#94A3B8]" />
          </div>
          <h3 className="text-lg font-semibold text-[#111827] mb-2">
            {t("noCompanies")}
          </h3>
          <p className="text-[#64748B] text-sm max-w-md mx-auto">
            {t("noCompaniesDesc")}
          </p>
        </div>
      )}
    </div>
  );
}

