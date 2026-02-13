"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Users } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";

// Mock Data for Creator Cards
const creators = [
  {
    name: "Sophie Martin",
    handle: "@sophie.m",
    role: "Tech & AI",
    avatar: "https://randomuser.me/api/portraits/women/1.jpg",
    tags: ["Tech", "AI", "Innovation"],
    audience: "2k+",
  },
  {
    name: "Thomas Bernard",
    handle: "@thomas_dev",
    role: "DevTools",
    avatar: "https://randomuser.me/api/portraits/men/1.jpg",
    tags: ["DevTools", "Coding", "Backend"],
    audience: "40k+",
  },
  {
    name: "Laura Sanchez",
    handle: "@laura_design",
    role: "Design",
    avatar: "https://randomuser.me/api/portraits/women/2.jpg",
    tags: ["Design", "UX/UI", "Creative"],
    audience: "29k+",
  },
  {
    name: "Claire Dubois",
    handle: "@claire_dubois",
    role: "Marketing",
    avatar: "https://randomuser.me/api/portraits/women/3.jpg",
    tags: ["Marketing", "Digital", "B2B"],
    audience: "35k+",
  },
  {
    name: "Kevin Jackson",
    handle: "@kevin_nocode",
    role: "NoCode",
    avatar: "https://randomuser.me/api/portraits/men/2.jpg",
    tags: ["NoCode", "Automation", "Tools"],
    audience: "19k+",
  },
  {
    name: "Emma Leroy",
    handle: "@emma_leroy",
    role: "SaaS",
    avatar: "https://randomuser.me/api/portraits/women/4.jpg",
    tags: ["SaaS", "Automation", "NoCode"],
    audience: "41k+",
  },
  {
    name: "Chloé Petit",
    handle: "@chloe.petit",
    role: "B2B",
    avatar: "https://randomuser.me/api/portraits/women/5.jpg",
    tags: ["B2B", "Sales", "Tech"],
    audience: "26k+",
  },
  {
    name: "David Moreau",
    handle: "@david_moreau",
    role: "Fintech",
    avatar: "https://randomuser.me/api/portraits/men/3.jpg",
    tags: ["Fintech", "Finance", "B2B"],
    audience: "33k+",
  },
  {
    name: "Sarah Kim",
    handle: "@sarah.kim",
    role: "DevTools",
    avatar: "https://randomuser.me/api/portraits/women/6.jpg",
    tags: ["DevTools", "Coding", "Web"],
    audience: "7k+",
  },
  {
    name: "Lucas Mercier",
    handle: "@lucas_growth",
    role: "Growth",
    avatar: "https://randomuser.me/api/portraits/men/4.jpg",
    tags: ["Marketing", "Growth", "Social"],
    audience: "38k+",
  },
  {
    name: "Amina Benali",
    handle: "@amina_benali",
    role: "Finance",
    avatar: "https://randomuser.me/api/portraits/women/7.jpg",
    tags: ["Finance", "Fintech", "Growth"],
    audience: "18k+",
  },
  {
    name: "Hugo Garcia",
    handle: "@hugo_garcia",
    role: "Design",
    avatar: "https://randomuser.me/api/portraits/men/5.jpg",
    tags: ["Design", "UX/UI", "Creative"],
    audience: "16k+",
  },
  {
    name: "Julie Lambert",
    handle: "@julie_lambert",
    role: "Growth",
    avatar: "https://randomuser.me/api/portraits/women/8.jpg",
    tags: ["Growth", "Marketing", "SEO"],
    audience: "11k+",
  },
  {
    name: "Alexandre Durand",
    handle: "@alex_durand",
    role: "AI & Data",
    avatar: "https://randomuser.me/api/portraits/men/6.jpg",
    tags: ["AI", "Tech", "Data"],
    audience: "25k+",
  },
  {
    name: "Maxime Roux",
    handle: "@maxime_roux",
    role: "SaaS",
    avatar: "https://randomuser.me/api/portraits/men/7.jpg",
    tags: ["SaaS", "Product", "Management"],
    audience: "21k+",
  },
];

const CreatorCard = ({
  creator,
  t,
}: {
  creator: (typeof creators)[0];
  t: (key: string) => string;
}) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 w-[280px] sm:w-[300px] flex-shrink-0 relative transition-all duration-200 hover:border-blue-400 hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(59,130,246,0.15)]">
    {/* Verified Badge */}
    <div className="absolute top-5 right-5">
      <CheckCircle2 className="w-5 h-5 text-[#3B82F6] fill-[#EFF6FF]" />
    </div>

    {/* Header */}
    <div className="flex gap-3 mb-4">
      <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
        <Image
          src={creator.avatar}
          alt={creator.name}
          width={48}
          height={48}
          className="w-full h-full object-cover"
        />
      </div>
      <div>
        <p className="text-[15px] font-semibold text-gray-900 leading-tight">
          {creator.name}
        </p>
        <p className="text-xs text-gray-500 font-medium">{creator.handle}</p>
      </div>
    </div>

    {/* Tags */}
    <div className="flex gap-2 mb-4 flex-wrap">
      {creator.tags.map((tag) => (
        <span
          key={tag}
          className="px-2 py-0.5 bg-gray-50 text-gray-600 text-[10px] font-medium rounded-md border border-gray-100"
        >
          {tag}
        </span>
      ))}
    </div>

    {/* Platforms Grid */}
    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <p className="text-[11px] text-gray-500 font-medium">{t("audience")}</p>
        </div>
        <p className="text-[13px] font-semibold text-gray-900">
          {creator.audience}
        </p>
      </div>
    </div>
  </div>
);

export const CreatorShowcaseSection = () => {
  const t = useTranslations("creatorShowcase");
  return (
    <section id="creators" className="py-16 sm:py-20 md:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10 sm:mb-12 text-center">
        <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-blue-100 w-fit mx-auto">
          {t("badge")}
        </span>
        <h2 className="text-[28px] sm:text-[36px] md:text-[44px] font-bold text-gray-900 tracking-[-0.03em] leading-[1.1] mb-3 sm:mb-4">
          {t("title")}
        </h2>
        <p className="text-base sm:text-lg text-gray-500 max-w-[600px] mx-auto px-4">
          {t("subtitle")}
        </p>
      </div>

      {/* Marquee Container - Row 1 */}
      <div className="relative w-full mb-8">
        {/* Gradient Masks */}
        <div className="absolute left-0 top-0 bottom-0 w-[150px] bg-gradient-to-r from-white to-transparent z-[2] pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-[150px] bg-gradient-to-l from-white to-transparent z-[2] pointer-events-none" />

        <motion.div
          animate={{ x: [0, -1800] }}
          transition={{
            repeat: Infinity,
            duration: 40,
            ease: "linear",
          }}
          className="flex gap-6 pl-6 w-max"
        >
          {[...creators, ...creators, ...creators].map((creator, i) => (
            <CreatorCard key={i} creator={creator} t={t} />
          ))}
        </motion.div>
      </div>

      {/* Marquee Container - Row 2 (Reverse) */}
      <div className="relative w-full">
        <div className="absolute left-0 top-0 bottom-0 w-[150px] bg-gradient-to-r from-white to-transparent z-[2] pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-[150px] bg-gradient-to-l from-white to-transparent z-[2] pointer-events-none" />

        <motion.div
          animate={{ x: [-1800, 0] }}
          transition={{
            repeat: Infinity,
            duration: 45,
            ease: "linear",
          }}
          className="flex gap-6 pl-6 w-max"
        >
          {[
            ...[...creators].reverse(),
            ...[...creators].reverse(),
            ...[...creators].reverse(),
          ].map((creator, i) => (
            <CreatorCard key={i} creator={creator} t={t} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};
