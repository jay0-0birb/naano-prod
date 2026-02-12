"use client";

import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Heart,
  MessageCircle,
  Repeat2,
  CheckCircle,
  Linkedin,
  Users,
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";

// Step 1: Match Card
const MatchCard = ({ t }: { t: (key: string) => string }) => (
  <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 max-w-[260px] mx-auto relative shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] min-h-[280px]">
    {/* Verified Badge */}
    <div className="absolute top-4 right-4">
      <CheckCircle className="w-5 h-5 text-[#3B82F6]" />
    </div>

    {/* Profile Header */}
    <div className="flex items-center mb-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white shadow-sm overflow-hidden">
          <Image
            // Même avatar qu'utilisé pour Alex Rivera dans le Creator Showcase
            src="https://i.pravatar.cc/150?u=alex"
            alt="Alex Rivera"
            width={48}
            height={48}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute bottom-0 right-0 w-[18px] h-[18px] bg-[#0A66C2] rounded-full flex items-center justify-center border-2 border-white">
          <Linkedin className="w-2.5 h-2.5 text-white" />
        </div>
      </div>
      <div className="ml-3 flex-1">
        <p className="font-semibold text-[15px] text-[#0F172A] leading-[1.3]">
          Alex Rivera
        </p>
        <p className="text-xs text-[#64748B]">Tech Creator</p>
      </div>
    </div>

    {/* Stats */}
    <div className="flex gap-4 mb-4 pb-4 border-b border-[#F1F5F9]">
      <div className="flex items-center gap-1">
        <Users className="w-3.5 h-3.5 text-[#9CA3AF]" />
        <p className="text-xs text-[#0F172A] font-semibold">12.4k</p>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
        <p className="text-xs text-[#64748B]">8.2% eng.</p>
      </div>
    </div>

    {/* Tags */}
    <div className="flex gap-2 mb-4 flex-wrap">
      <span className="bg-[#F1F5F9] text-[#475569] text-[11px] font-medium px-2.5 py-1 rounded-full">
        React
      </span>
      <span className="bg-[#F1F5F9] text-[#475569] text-[11px] font-medium px-2.5 py-1 rounded-full">
        SaaS
      </span>
      <span className="bg-[#EFF6FF] text-[#3B82F6] text-[11px] font-medium px-2.5 py-1 rounded-full">
        B2B
      </span>
    </div>

    {/* CTA Button */}
    <button className="w-full bg-[#0F172A] text-white text-[13px] font-medium h-[38px] rounded-lg hover:bg-[#1E293B] transition-colors">
      {t("viewProfile")}
    </button>
  </div>
);

// Step 2: Social Posts
const SocialPostsMockup = () => {
  const [counts, setCounts] = useState([
    { likes: 0, comments: 0, shares: 0 },
    { likes: 0, comments: 0 },
  ]);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const targets = [
            { likes: 124, comments: 18, shares: 32 },
            { likes: 89, comments: 12 },
          ];

          const duration = 2000;
          const steps = 60;

          targets.forEach((target, index) => {
            const incrementLikes = target.likes / steps;
            const incrementComments = target.comments / steps;
            const incrementShares = target.shares ? target.shares / steps : 0;

            let currentLikes = 0;
            let currentComments = 0;
            let currentShares = 0;

            const timer = setInterval(() => {
              currentLikes += incrementLikes;
              currentComments += incrementComments;
              if (incrementShares) currentShares += incrementShares;

              if (currentLikes >= target.likes) {
                setCounts((prev) => {
                  const newCounts = [...prev];
                  newCounts[index] = {
                    likes: target.likes,
                    comments: target.comments,
                    shares: target.shares || 0,
                  };
                  return newCounts;
                });
                clearInterval(timer);
              } else {
                setCounts((prev) => {
                  const newCounts = [...prev];
                  newCounts[index] = {
                    likes: Math.round(currentLikes),
                    comments: Math.round(currentComments),
                    shares: Math.round(currentShares),
                  };
                  return newCounts;
                });
              }
            }, duration / steps);
          });
        }
      },
      { threshold: 0.3 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [hasAnimated]);

  const posts = [
    {
      avatar: 32,
      handle: "@techcreator",
      text: "Just tried @YourBrand - game changer! 🚀",
    },
    {
      avatar: 45,
      handle: "@devinfluencer",
      text: "My workflow is 10x faster with this tool 💜",
    },
  ];

  return (
    <div
      className="flex flex-col gap-3 max-w-[260px] mx-auto min-h-[280px]"
      ref={ref}
    >
      {posts.map((post, i) => (
        <div
          key={i}
          className="bg-white rounded-xl border border-gray-100 p-3 w-full flex-1 shadow-[0_16px_48px_-12px_rgba(59,130,246,0.12),0_0_0_1px_rgba(59,130,246,0.04)] flex flex-col"
        >
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 rounded-full bg-gray-200 mr-2 overflow-hidden">
              <Image
                src={`https://i.pravatar.cc/150?img=${post.avatar}`}
                alt={post.handle}
                width={24}
                height={24}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="font-semibold text-xs text-[#111827]">
              {post.handle}
            </p>
          </div>
          <p className="text-xs text-[#111827] mb-2 flex-1">{post.text}</p>
          <div className="flex gap-4 text-xs text-[#6B7280] mt-auto">
            <div className="flex items-center">
              <Heart className="w-3 h-3 mr-1" />
              {counts[i]?.likes || 0}
            </div>
            <div className="flex items-center">
              <MessageCircle className="w-3 h-3 mr-1" />
              {counts[i]?.comments || 0}
            </div>
            {(counts[i]?.shares ?? 0) > 0 && (
              <div className="flex items-center">
                <Repeat2 className="w-3 h-3 mr-1" />
                {counts[i]?.shares ?? 0}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Step 3: Revenue Display
const RevenueDisplay = ({ t }: { t: (key: string) => string }) => {
  const [revenue, setRevenue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          const duration = 2000;
          const target = 12.4;
          const steps = 60;
          const increment = target / steps;
          let current = 0;

          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setRevenue(target);
              clearInterval(timer);
            } else {
              setRevenue(current);
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 },
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [hasAnimated]);

  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl border border-[#E5E7EB] p-5 max-w-[260px] mx-auto text-center shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08)] min-h-[280px] flex flex-col justify-center"
    >
      <p className="text-xs text-[#6B7280] mb-4">{t("campaignResults")}</p>
      <p className="text-3xl font-bold text-[#3B82F6] mb-4">
        ${revenue.toFixed(1)}k
      </p>
      <span className="bg-blue-50 text-[#3B82F6] text-xs px-2 py-0.5 rounded-full inline-block">
        {t("growth")}
      </span>
    </div>
  );
};

export const HowItWorksSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const t = useTranslations("howItWorks");

  const steps = [
    {
      title: t("step1Title"),
      description: t("step1Desc"),
      component: <MatchCard t={t} />,
    },
    {
      title: t("step2Title"),
      description: t("step2Desc"),
      component: <SocialPostsMockup />,
    },
    {
      title: t("step3Title"),
      description: t("step3Desc"),
      component: <RevenueDisplay t={t} />,
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-16 md:py-24 bg-white relative"
      ref={ref}
    >
      {/* Dot Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15, 23, 42, 0.025) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="flex flex-col text-center mb-16">
          <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-blue-100 w-fit mx-auto">
            {t("badge")}
          </span>
          <h2
            className="text-[32px] md:text-[44px] font-bold text-[#111827] tracking-[-0.03em] leading-[1.1] mb-3"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            {t("title")}
          </h2>
          <p
            className="text-lg text-[#6B7280] max-w-[600px] mx-auto"
            style={{ fontFamily: "Satoshi, sans-serif" }}
          >
            {t("subtitle")}
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-8 sm:gap-10 md:gap-8 lg:gap-12 relative">
          {steps.map((step, index) => (
            <div key={index} className="flex-1 relative w-full md:w-auto">
              <div className="flex flex-col gap-4 items-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={
                    isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }
                  }
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="w-full flex items-center justify-center"
                >
                  <div className="w-full max-w-[260px]">{step.component}</div>
                </motion.div>

                <div className="flex flex-col gap-2 text-center px-2 max-w-[280px]">
                  <h3 className="text-base sm:text-lg font-semibold text-[#111827]">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#6B7280] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {index < steps.length - 1 && (
                <ArrowRight className="absolute top-20 right-[-20px] sm:right-[-30px] text-gray-300 w-4 h-4 sm:w-5 sm:h-5 hidden md:block rotate-90 md:rotate-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
