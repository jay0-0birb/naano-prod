"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, Filter, Users as UsersIcon } from "lucide-react";
import CreatorCard from "@/components/marketplace/creator-card";

export interface CreatorMarketplaceCreator {
  id: string;
  bio: string | null;
  linkedin_url: string | null;
  followers_count: number;
  theme: string | null;
  country: string | null;
  is_pro?: boolean;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  };
}

interface CreatorMarketplaceClientProps {
  creators: CreatorMarketplaceCreator[];
  invitedCreatorIds: string[];
  saasCompanyId: string | null;
}

export default function CreatorMarketplaceClient({
  creators,
  invitedCreatorIds,
  saasCompanyId,
}: CreatorMarketplaceClientProps) {
  const tDashboard = useTranslations("dashboard");
  const tOnboarding = useTranslations("onboarding");
  const tLeadFeed = useTranslations("leadFeed");

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [countryFilter, setCountryFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [minFollowers, setMinFollowers] = useState<number>(0);

  const hasActiveFilters =
    !!countryFilter || !!industryFilter || minFollowers > 0;

  const uniqueCountries = useMemo(
    () =>
      Array.from(
        new Set(
          creators
            .map((creator) => creator.country)
            .filter((country): country is string => !!country && country.trim() !== ""),
        ),
      ).sort(),
    [creators],
  );

  const uniqueIndustries = useMemo(
    () =>
      Array.from(
        new Set(
          creators
            .map((creator) => creator.theme)
            .filter((theme): theme is string => !!theme && theme.trim() !== ""),
        ),
      ).sort(),
    [creators],
  );

  const maxFollowersAvailable = useMemo(
    () =>
      creators.reduce(
        (max, creator) =>
          creator.followers_count > max ? creator.followers_count : max,
        0,
      ),
    [creators],
  );

  const filteredCreators = useMemo(() => {
    let list = [...creators];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((creator) => {
        const name = creator.profiles.full_name?.toLowerCase() || "";
        const bio = creator.bio?.toLowerCase() || "";
        const theme = creator.theme?.toLowerCase() || "";
        return (
          name.includes(query) || bio.includes(query) || theme.includes(query)
        );
      });
    }

    if (countryFilter) {
      const countryLower = countryFilter.toLowerCase();
      list = list.filter(
        (creator) =>
          creator.country?.toLowerCase() === countryLower,
      );
    }

    if (industryFilter) {
      const industryLower = industryFilter.toLowerCase();
      list = list.filter(
        (creator) =>
          creator.theme?.toLowerCase() === industryLower,
      );
    }

    if (minFollowers > 0) {
      list = list.filter(
        (creator) => creator.followers_count >= minFollowers,
      );
    }

    return list;
  }, [creators, searchQuery, countryFilter, industryFilter, minFollowers]);

  const handleResetFilters = () => {
    setCountryFilter("");
    setIndustryFilter("");
    setMinFollowers(0);
  };

  return (
    <div>
      {/* Search & Filters */}
      <div className="relative mb-8">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#94A3B8]" />
            <input
              type="text"
              placeholder={tDashboard("searchCreator")}
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
            <span className="text-sm">{tDashboard("filters")}</span>
          </button>
        </div>

        {showFilters && (
          <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-20 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#111827]">
                {tDashboard("filters")}
              </h3>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-[#64748B] hover:text-[#111827]"
                >
                  {tDashboard("clearFilters")}
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Country */}
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">
                  {tOnboarding("country")}
                </label>
                <select
                  value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10"
                >
                  <option value="">{tDashboard("allCountries")}</option>
                  {uniqueCountries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">
                  {tDashboard("industry")}
                </label>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/10"
                >
                  <option value="">{tDashboard("allIndustries")}</option>
                  {uniqueIndustries.map((industry) => (
                    <option key={industry} value={industry}>
                      {industry}
                    </option>
                  ))}
                </select>
              </div>

              {/* Followers (slider) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-[#475569]">
                    {tDashboard("followers")}
                  </label>
                  <span className="text-xs text-[#64748B]">
                    {minFollowers.toLocaleString()}+
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={maxFollowersAvailable || 10000}
                  step={
                    maxFollowersAvailable > 0
                      ? Math.max(100, Math.round(maxFollowersAvailable / 20))
                      : 100
                  }
                  value={minFollowers}
                  onChange={(e) =>
                    setMinFollowers(Number(e.target.value) || 0)
                  }
                  className="w-full accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-[#94A3B8] mt-1">
                  <span>0</span>
                  <span>
                    {(maxFollowersAvailable || 10000).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Creators Grid */}
      {filteredCreators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCreators.map((creator) => (
            <CreatorCard
              key={creator.id}
              creator={creator}
              hasInvited={invitedCreatorIds.includes(creator.id)}
              saasCompanyId={saasCompanyId}
            />
          ))}
        </div>
      ) : creators.length > 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="w-8 h-8 text-[#94A3B8]" />
          </div>
          <h3 className="text-lg font-semibold text-[#111827] mb-2">
            {tLeadFeed("noResults")}
          </h3>
          <p className="text-[#64748B] text-sm max-w-md mx-auto">
            {tLeadFeed("noDataExport")}
          </p>
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <UsersIcon className="w-8 h-8 text-[#94A3B8]" />
          </div>
          <h3 className="text-lg font-semibold text-[#111827] mb-2">
            {tDashboard("noCreators")}
          </h3>
          <p className="text-[#64748B] text-sm max-w-md mx-auto">
            {tDashboard("noCreatorsDesc")}
          </p>
        </div>
      )}
    </div>
  );
}

