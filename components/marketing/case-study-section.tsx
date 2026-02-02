"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { Zap, BarChart3, Target, Linkedin } from "lucide-react";
import { useTranslations } from "next-intl";

// Add your LinkedIn post URLs here (from any profile)
// Format: https://www.linkedin.com/posts/username_activity-1234567890-xxxx
// or: https://www.linkedin.com/feed/update/urn:li:activity:1234567890
// Replace with real post URLs from your creators or company
const FEATURED_LINKEDIN_POSTS: string[] = [
  "https://www.linkedin.com/posts/alexis-jarre_i-just-built-an-agent-that-doesend-to-end-activity-7393969519771271168-kz5T",
  "https://www.linkedin.com/posts/alexis-jarre_heres-how-to-create-luxury-car-ads-using-activity-7419363160811290625-JldW",
  "https://www.linkedin.com/posts/alexis-jarre_heres-how-to-create-a-cinematic-video-activity-7407391687729180672-Sxok",
  "https://www.linkedin.com/posts/alexis-jarre_heres-how-to-animate-your-photos-into-activity-7402323009086304256-TAIh",
];

function extractLinkedInPostId(url: string): string {
  try {
    if (url.includes("activity-")) {
      const match = url.match(/activity-(\d+)/);
      if (match) return `urn:li:activity:${match[1]}`;
    }
    if (url.includes("urn:li:activity:")) {
      const match = url.match(/urn:li:activity:(\d+)/);
      if (match) return `urn:li:activity:${match[1]}`;
    }
    if (url.includes("urn:li:share:")) {
      const match = url.match(/urn:li:share:(\d+)/);
      if (match) return `urn:li:share:${match[1]}`;
    }
    if (url.includes("ugcPost")) {
      const match = url.match(/ugcPost:(\d+)/);
      if (match) return `urn:li:ugcPost:${match[1]}`;
    }
    return "";
  } catch {
    return "";
  }
}

export const CaseStudySection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const t = useTranslations("caseStudy");

  const features = [
    {
      icon: Zap,
      title: t("viralHooks"),
      description: t("viralHooksDesc"),
    },
    {
      icon: BarChart3,
      title: t("authenticStorytelling"),
      description: t("authenticStorytellingDesc"),
    },
    {
      icon: Target,
      title: t("massiveReach"),
      description: t("massiveReachDesc"),
    },
  ];

  const validPosts = FEATURED_LINKEDIN_POSTS.filter((url) =>
    extractLinkedInPostId(url)
  );
  const currentPostUrl = validPosts[currentPostIndex % validPosts.length];
  const embedId = currentPostUrl
    ? extractLinkedInPostId(currentPostUrl)
    : null;

  return (
    <section
      className="py-16 md:py-24 bg-white relative overflow-hidden"
      ref={ref}
    >
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15, 23, 42, 0.025) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-12 sm:gap-16">
          {/* LEFT SIDE - Content & Methodology */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="flex-1 max-w-full lg:max-w-[500px] w-full"
          >
            {/* Badge */}
            <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-blue-100 w-fit">
              {t("badge")}
            </span>
            {/* Heading */}
            <h2
              className="text-[28px] sm:text-[36px] md:text-[44px] font-bold text-[#0F172A] tracking-[-0.03em] leading-[1.1] mb-4 sm:mb-5"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              {t("title")}
              <br />
              <span className="text-[#3B82F6]">
                {t("subtitle")}
              </span>
            </h2>

            {/* Subheadline */}
            <p
              className="text-lg text-[#64748B] leading-relaxed font-normal mb-10"
              style={{ fontFamily: "Satoshi, sans-serif" }}
            >
              {t("description")}{" "}
              <span className="font-semibold text-[#64748B]">
                {t("descriptionBold")}
              </span>
            </p>

            {/* Feature List */}
            <div className="flex flex-col gap-5">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="flex gap-4 items-start"
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-[10px] bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 text-[#3B82F6]" />
                  </div>

                  {/* Text */}
                  <div className="pt-1">
                    <h3 className="text-[15px] font-semibold text-[#0F172A] mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[#64748B] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* RIGHT SIDE - Browser window mockup with LinkedIn embed */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 flex flex-col items-center justify-center pt-8 sm:pt-12 lg:pt-16 pb-8 sm:pb-12 lg:pb-0 w-full"
          >
            <div className="relative flex flex-col items-center w-full">
              {/* Browser window */}
              <div className="w-full max-w-[480px] sm:max-w-[560px] rounded-lg overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)] border border-gray-200/80 bg-white">
                {/* Browser chrome */}
                <div className="bg-[#f1f3f4] px-3 py-2 border-b border-gray-200/60 flex items-center gap-2">
                  {/* Traffic light dots */}
                  <div className="flex gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  {/* Address bar */}
                  <div className="flex-1 flex items-center gap-2 px-3 py-1.5 bg-white rounded-md border border-gray-200/80 text-[11px] text-gray-500">
                    <Linkedin className="w-3 h-3 text-[#0A66C2] shrink-0" />
                    <span>linkedin.com/feed</span>
                  </div>
                </div>

                {/* Content area */}
                <div className="bg-white min-h-[360px] sm:min-h-[400px] overflow-hidden">
                  {embedId ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentPostIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="w-full overflow-hidden"
                      >
                        <iframe
                          src={`https://www.linkedin.com/embed/feed/update/${embedId}`}
                          className="w-full border-0"
                          style={{ height: "400px", minHeight: "360px" }}
                          allowFullScreen
                          title={`LinkedIn Post ${currentPostIndex + 1}`}
                        />
                      </motion.div>
                    </AnimatePresence>
                  ) : (
                    <div className="w-full min-h-[360px] flex items-center justify-center p-6">
                      <p className="text-gray-400 text-sm text-center">
                        Add valid LinkedIn post URLs to FEATURED_LINKEDIN_POSTS
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dots indicator */}
            {validPosts.length > 1 && (
              <div className="flex gap-2 mt-4">
                {validPosts.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentPostIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentPostIndex
                        ? "bg-[#0A66C2] w-6"
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    aria-label={`Go to post ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
