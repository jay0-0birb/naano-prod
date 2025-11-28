"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Hexagon,
  Zap,
  TrendingUp,
  ShieldCheck,
  ArrowDown,
  UsersRound,
  BarChart2,
  CreditCard,
  ShieldAlert,
  Rocket,
  PieChart,
  ArrowRight,
  Check,
  Box,
  Layers,
  Globe,
  Twitter,
  Linkedin,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [activePricing, setActivePricing] = useState<"saas" | "creator">(
    "saas"
  );

  // Observer for fade-in animations
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px 0px -50px 0px",
      threshold: 0.15,
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <div className="text-slate-300 antialiased min-h-screen flex flex-col relative selection:bg-blue-500/30 selection:text-blue-200">
      {/* Background Global & Hero Glow */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[#020408]">
        {/* Primary Blue Glow */}
        <div className="absolute top-[-10%] left-0 right-0 h-[800px] bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(59,130,246,0.25),rgba(2,4,8,0))] z-0"></div>
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-[radial-gradient(circle_800px_at_50%_-200px,#1d4ed8,transparent)] opacity-40 z-0"></div>

        {/* Grid System */}
        <div className="absolute inset-0 w-full h-full grid grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-0 max-w-[1800px] mx-auto border-x border-white/[0.03]">
          <div className="border-r border-white/[0.03] h-full hidden lg:block"></div>
          <div className="border-r border-white/[0.03] h-full hidden lg:block"></div>
          {/* Left Side faint columns */}
          <div className="border-r border-white/[0.03] h-full relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/[0.03] to-transparent"></div>
          </div>
          <div className="border-r border-white/[0.03] h-full relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-800/[0.08] to-transparent"></div>
          </div>
          {/* Center Strong "Beams" */}
          <div className="border-r border-white/[0.04] h-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-600/[0.12] via-blue-900/[0.05] to-transparent"></div>
          </div>
          <div className="border-r border-white/[0.04] h-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-600/[0.12] via-blue-900/[0.05] to-transparent"></div>
          </div>
          {/* Right Side faint columns */}
          <div className="border-r border-white/[0.03] h-full relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-800/[0.08] to-transparent"></div>
          </div>
          <div className="border-r border-white/[0.03] h-full relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/[0.03] to-transparent"></div>
          </div>
          <div className="border-r border-white/[0.03] h-full hidden lg:block"></div>
          <div className="border-r border-white/[0.03] h-full hidden lg:block"></div>
          <div className="border-r border-white/[0.03] h-full hidden xl:block"></div>
          <div className="hidden xl:block"></div>
        </div>
      </div>

      {/* 1. Header (Navigation) - Redesigned as Floating Island */}
      <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-6 pointer-events-none">
        <header className="pointer-events-auto bg-[#020408]/70 backdrop-blur-xl border border-white/10 rounded-full px-7 h-14 flex items-center gap-10 shadow-2xl shadow-black/50 transition-all hover:border-white/20">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="relative flex items-center justify-center">
              <Hexagon className="w-5 h-5 text-white fill-white/10 stroke-[1.5] group-hover:text-blue-200 group-hover:fill-blue-200/10 transition-colors" />
            </div>
            <span className="text-sm font-normal tracking-tight text-white group-hover:text-blue-200 transition-colors sans-serif-title">
              Konex
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-8 text-sm font-normal text-slate-300 sans-serif-title">
            {[
              { label: "Fonctionnalités", href: "#features" },
              { label: "Comment ça marche?", href: "#workflow" },
              { label: "Tarifs", href: "#pricing" },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="relative hover:text-white transition-colors duration-200 py-1 group whitespace-nowrap"
                onClick={(e) => {
                  e.preventDefault();
                  document
                    .querySelector(item.href)
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {item.label}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px bg-blue-400 transition-all duration-300 group-hover:w-full opacity-0 group-hover:opacity-100"></span>
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4 pl-4 border-l border-white/10">
            <Link
              href="/login"
              className="hidden sm:block group text-sm font-normal tracking-tight text-white hover:text-blue-200 transition-colors sans-serif-title"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="group relative inline-flex h-9 items-center justify-center overflow-hidden rounded-full bg-white text-slate-950 px-5 font-medium transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.6),0_0_60px_rgba(59,130,246,0.3)] hover:bg-gradient-to-r hover:from-white hover:to-blue-50"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400/0 via-blue-400/30 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-shimmer"></span>
              <span className="relative text-[11px] uppercase tracking-wide font-semibold">
                S'inscrire
              </span>
            </Link>
          </div>
        </header>
      </div>

      {/* Main Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-32 pb-24 px-6 text-center w-full max-w-7xl mx-auto">
        <div className="mb-12 animate-fade-in-up opacity-0 [animation-delay:200ms]">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all hover:bg-white/[0.05] hover:border-white/15">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20">
              <Zap className="w-3 h-3 text-blue-400 fill-blue-400" />
            </div>
            <span className="text-xs font-medium tracking-wide text-slate-200">
              L'influence B2B Réinventée
            </span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mb-10 px-4">
          <h1 className="text-6xl sm:text-7xl md:text-8xl font-normal tracking-tight text-white leading-[1.1] opacity-0 animate-fade-in-up [animation-delay:400ms] drop-shadow-xl font-serif">
            Passez à l'échelle <br className="hidden md:block" />
            avec les{" "}
            <span className="italic font-light text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-blue-400">
              nano-influenceurs
            </span>
          </h1>
        </div>

        <p className="max-w-2xl mx-auto text-lg md:text-xl font-light text-slate-300 mb-12 leading-relaxed opacity-0 animate-fade-in-up [animation-delay:600ms]">
          Ne visez plus les célébrités inaccessibles. Connectez votre marque aux
          créateurs de niche qui possèdent la confiance réelle de votre
          audience.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto opacity-0 animate-fade-in-up [animation-delay:800ms]">
          <a
            href="#"
            className="w-full sm:w-auto inline-flex items-center justify-center h-11 px-8 bg-white text-slate-950 rounded-md text-sm font-medium hover:bg-blue-50 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            Trouver des créateurs
          </a>
          <a
            href="#"
            className="w-full sm:w-auto inline-flex items-center justify-center h-11 px-8 bg-transparent border border-white/10 text-white rounded-md text-sm font-medium hover:bg-white/5 hover:border-white/20 transition-all duration-200 backdrop-blur-sm"
          >
            Voir la démo
          </a>
        </div>
      </main>

      {/* Nano Influence Section */}
      <section className="relative z-10 py-24 border-t border-white/[0.03] bg-[#020408]/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="reveal">
              <h2 className="text-3xl md:text-5xl font-normal tracking-tight text-white mb-6 leading-tight font-serif">
                Pourquoi la Nano-Influence <br />
                est le{" "}
                <span className="font-serif italic text-blue-300">
                  nouveau standard
                </span>
              </h2>
              <p className="text-slate-400 font-light text-lg mb-10 leading-relaxed">
                Le marketing d'influence traditionnel est saturé. Les
                nano-influenceurs (1k-10k abonnés) offrent une proximité et une
                confiance que les gros comptes ont perdue.
              </p>

              <div className="space-y-8">
                <div className="flex items-start gap-5 group">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/5 flex items-center justify-center shrink-0 border border-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-white text-lg font-medium mb-1 font-serif">
                      Engagement Supérieur
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Jusqu'à 8.5% de taux d'engagement contre 1.2% pour les
                      macro-influenceurs. Une communauté active qui écoute
                      vraiment.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-5 group">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/5 flex items-center justify-center shrink-0 border border-emerald-500/10 group-hover:border-emerald-500/30 transition-colors">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white text-lg font-medium mb-1 font-serif">
                      Confiance Absolue
                    </h4>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Leurs recommandations sont perçues comme celles d'un ami,
                      pas d'un panneau publicitaire. La conversion suit
                      naturellement.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="relative reveal"
              style={{ transitionDelay: "200ms" }}
            >
              {/* Comparison Card */}
              <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="grid grid-cols-2 gap-8 mb-10 border-b border-white/5 pb-8">
                  <div className="text-center border-r border-white/5 pr-8">
                    <div className="text-sm text-slate-500 mb-3">
                      Influenceur Macro
                    </div>
                    <div className="text-3xl lg:text-4xl font-serif text-slate-500/50 line-through decoration-slate-600/50">
                      1.7%
                    </div>
                    <div className="text-xs text-slate-600 mt-2">
                      Taux d'engagement
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-blue-300 font-medium mb-3">
                      Konex Nano
                    </div>
                    <div className="text-5xl lg:text-6xl font-serif text-white drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                      8.2%
                    </div>
                    <div className="text-xs text-blue-400/60 mt-2">
                      Taux d'engagement
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white/[0.03] rounded-lg p-4 flex items-center justify-between border border-white/[0.05]">
                    <span className="text-sm text-slate-300">
                      Coût par conversion
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-red-400/70 line-through decoration-red-400/30">
                        145€
                      </span>
                      <div className="flex items-center gap-1 text-emerald-400">
                        <span className="text-base font-semibold">32€</span>
                        <ArrowDown className="w-3 h-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION: Features (Avantages) */}
      <section
        id="features"
        className="relative z-10 py-32 border-t border-white/[0.03]"
      >
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 items-start">
            <div className="w-full lg:w-1/3 sticky top-32 self-start">
              <div className="reveal">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-8">
                  Tout inclus
                </div>
                <h2 className="text-3xl md:text-5xl font-normal text-white mb-6 leading-tight tracking-tight font-serif">
                  Tout ce dont vous avez besoin pour{" "}
                  <span className="font-serif italic text-blue-300">
                    réussir
                  </span>
                </h2>
                <p className="text-slate-400 text-lg font-light leading-relaxed mb-8">
                  Konex est la plateforme complète qui vous accompagne de A à Z
                  : du matching créateurs à la mesure de performance en temps
                  réel.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center text-sm font-medium text-white hover:text-blue-300 transition-colors group"
                >
                  Explorer toutes les fonctionnalités
                  <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
            </div>

            <div className="w-full lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature Cards ... */}
              <div className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 reveal cursor-default backdrop-blur-md shadow-lg hover:shadow-blue-900/10 glass-card">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <UsersRound className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3 font-serif">
                  Base de créateurs experts
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Accédez à 1,500+ nano-créateurs B2B validés manuellement qui
                  postulent pour rejoindre vos campagnes.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-blue-500" /> Matching
                    intelligent par niche
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-blue-500" /> Réponse
                    moyenne &lt; 48h
                  </li>
                </ul>
              </div>

              <div
                className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 reveal cursor-default backdrop-blur-md shadow-lg hover:shadow-indigo-900/10 glass-card"
                style={{ transitionDelay: "100ms" }}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-600/5 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BarChart2 className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3 font-serif">
                  Tracking temps réel
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Liens d'affiliation uniques et dashboard complet pour suivre
                  clics, leads et ROI à la minute près.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-indigo-500" />{" "}
                    Attribution multi-touch
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-indigo-500" />{" "}
                    Intégration HubSpot native
                  </li>
                </ul>
              </div>

              <div className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 reveal cursor-default backdrop-blur-md shadow-lg hover:shadow-emerald-900/10 glass-card">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3 font-serif">
                  Paiements automatisés
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Commissions calculées et versées via Stripe. Facturation
                  unique pour tous vos créateurs.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Zéro
                    gestion administrative
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />{" "}
                    Conformité fiscale 100%
                  </li>
                </ul>
              </div>

              <div
                className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 reveal cursor-default backdrop-blur-md shadow-lg hover:shadow-amber-900/10 glass-card"
                style={{ transitionDelay: "100ms" }}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <ShieldAlert className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3 font-serif">
                  Zéro Spam & Fake
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Validation manuelle stricte : audience réelle, pas de bots,
                  historique de contenu B2B vérifié.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-amber-500" /> 0% fake
                    followers
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-amber-500" /> Churn
                    créateur &lt; 10%
                  </li>
                </ul>
              </div>

              <div className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 reveal cursor-default backdrop-blur-md glass-card">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/5 border border-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Rocket className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3 font-serif">
                  Launch en 10 min
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Définissez votre offre, publiez votre programme. Les premiers
                  posts sont en ligne sous 7 jours.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-purple-500" /> Setup
                    No-code rapide
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-purple-500" /> Leads dès
                    J+7
                  </li>
                </ul>
              </div>

              <div
                className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/10 hover:bg-white/[0.04] hover:border-white/20 transition-all duration-300 reveal cursor-default backdrop-blur-md glass-card"
                style={{ transitionDelay: "100ms" }}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-rose-500/20 to-rose-600/5 border border-rose-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <PieChart className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-xl font-medium text-white mb-3 font-serif">
                  Performance-based
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed mb-6">
                  Pas de frais fixes. Payez uniquement quand les créateurs
                  génèrent des conversions réelles.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-rose-500" /> CAC réduit
                    de 40%
                  </li>
                  <li className="flex items-center gap-2 text-xs text-slate-500 group-hover:text-slate-300 transition-colors">
                    <Check className="w-3.5 h-3.5 text-rose-500" /> ROI moyen 7x
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section: Workflow */}
      <section
        id="workflow"
        className="relative z-10 py-32 border-t border-white/[0.03] bg-[#020408]/20"
      >
        <div className="max-w-7xl mx-auto px-6">
          {/* ... Workflow Content kept same ... */}
          <div className="flex items-center gap-3 mb-20 reveal">
            <div className="h-px flex-1 bg-white/10"></div>
            <span className="text-[#4AA3FF] uppercase tracking-[0.05em] text-[10px] font-bold bg-[#4AA3FF]/5 border border-[#4AA3FF]/10 px-3 py-1.5 rounded-full">
              Workflow
            </span>
            <div className="h-px flex-1 bg-white/10"></div>
          </div>

          <div className="relative">
            <div className="absolute top-32 left-0 w-full h-px hidden md:block opacity-20">
              <svg
                className="w-full h-20 overflow-visible"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,10 Q300,50 600,10 T1200,10"
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="2"
                  strokeDasharray="10,10"
                />
                <defs>
                  <linearGradient
                    id="lineGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 group/workflow">
              {/* Step 1 */}
              <div className="flex flex-col reveal group cursor-default transition-opacity duration-500 md:group-hover/workflow:opacity-40 md:hover:!opacity-100">
                <div className="w-full h-72 glass-card rounded-2xl mb-8 relative overflow-hidden flex flex-col items-center justify-center group-hover:border-white/30 transition-all duration-500 shadow-xl">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent opacity-40"></div>
                  <div className="relative z-10 text-center">
                    <div className="w-28 h-28 mx-auto rounded-full p-1 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 relative shadow-2xl mb-6">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                        alt="Creator Profile"
                        className="w-full h-full object-cover rounded-full opacity-90 group-hover:opacity-100 transition-opacity duration-500"
                      />
                      <div className="absolute bottom-0 right-0 transform translate-x-2 translate-y-2 bg-[#020408] rounded-full p-1 border border-white/10">
                        <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.6)] animate-pulse">
                          <Check className="w-4 h-4 text-white stroke-[3]" />
                        </div>
                      </div>
                    </div>
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                      <span className="text-[10px] font-medium text-slate-300 uppercase tracking-wide">
                        Identité Vérifiée
                      </span>
                    </div>
                  </div>
                </div>
                <div className="px-2">
                  <span className="text-xs font-mono text-slate-500 mb-3 block">
                    01
                  </span>
                  <h4 className="text-lg font-medium text-white tracking-tight sans-serif-title mb-2 font-serif">
                    Vérification Profil
                  </h4>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">
                    Nous validons l'audience réelle et la qualité des
                    interactions avant tout accès.
                  </p>
                </div>
              </div>
              {/* Step 2 */}
              <div
                className="flex flex-col reveal group cursor-default transition-opacity duration-500 md:group-hover/workflow:opacity-40 md:hover:!opacity-100"
                style={{ transitionDelay: "150ms" }}
              >
                <div className="w-full h-72 glass-card rounded-2xl mb-8 relative overflow-hidden flex flex-col items-center justify-center group-hover:border-white/30 transition-all duration-500 shadow-xl">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent opacity-40"></div>
                  <div className="relative z-10 flex flex-col gap-3">
                    <div className="flex items-center gap-3 bg-[#0A0C10]/80 border border-white/10 p-3 rounded-lg backdrop-blur-sm w-56">
                      <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center">
                        <Box className="w-4 h-4 text-slate-400" />
                      </div>
                      <span className="text-xs text-slate-300">
                        Votre Marque
                      </span>
                    </div>
                    <div className="h-6 w-px bg-gradient-to-b from-white/10 via-purple-500 to-purple-500 mx-auto"></div>
                    <div className="flex items-center gap-3 bg-[#0A0C10]/80 border border-purple-500/30 p-3 rounded-lg backdrop-blur-sm shadow-[0_0_15px_rgba(168,85,247,0.15)] w-56 transform group-hover:scale-105 transition-transform duration-300">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-purple-400">
                          LF
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-white">
                          Créateur Tech
                        </span>
                        <span className="text-[10px] text-purple-400">
                          Audience : Développeurs
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-2">
                  <span className="text-xs font-mono text-slate-500 mb-3 block">
                    02
                  </span>
                  <h4 className="text-lg font-medium text-white tracking-tight sans-serif-title mb-2 font-serif">
                    Matching de Niche
                  </h4>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">
                    Trouvez le nano-influenceur qui parle déjà exactement à vos
                    futurs clients.
                  </p>
                </div>
              </div>
              {/* Step 3 */}
              <div
                className="flex flex-col reveal group cursor-default transition-opacity duration-500 md:group-hover/workflow:opacity-40 md:hover:!opacity-100"
                style={{ transitionDelay: "300ms" }}
              >
                <div className="w-full h-72 glass-card rounded-2xl mb-8 relative overflow-hidden flex flex-col items-center justify-end group-hover:border-white/30 transition-all duration-500 px-6 pb-6 shadow-xl">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent opacity-40"></div>
                  <div className="w-full relative z-10">
                    <div className="flex justify-between items-end mb-2 px-1">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                          Conversions
                        </span>
                        <span className="text-2xl font-semibold text-white">
                          +142%
                        </span>
                      </div>
                      <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400 font-medium">
                        Live
                      </div>
                    </div>
                    <div className="w-full h-32 relative">
                      <svg
                        viewBox="0 0 200 100"
                        className="w-full h-full overflow-visible"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient
                            id="gradient"
                            x1="0%"
                            y1="0%"
                            x2="0%"
                            y2="100%"
                          >
                            <stop
                              offset="0%"
                              style={{
                                stopColor: "rgb(16, 185, 129)",
                                stopOpacity: 0.2,
                              }}
                            ></stop>
                            <stop
                              offset="100%"
                              style={{
                                stopColor: "rgb(16, 185, 129)",
                                stopOpacity: 0,
                              }}
                            ></stop>
                          </linearGradient>
                        </defs>
                        <path
                          d="M0,100 L0,80 C20,80 40,85 60,60 C80,35 100,50 120,40 C140,30 160,10 200,5 L200,100 Z"
                          fill="url(#gradient)"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                        ></path>
                        <path
                          d="M0,80 C20,80 40,85 60,60 C80,35 100,50 120,40 C140,30 160,10 200,5"
                          fill="none"
                          stroke="#34d399"
                          strokeWidth="2"
                          className="chart-path drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="px-2">
                  <span className="text-xs font-mono text-slate-500 mb-3 block">
                    03
                  </span>
                  <h4 className="text-lg font-medium text-white tracking-tight sans-serif-title mb-2 font-serif">
                    Croissance Organique
                  </h4>
                  <p className="text-sm text-slate-400 font-light leading-relaxed">
                    Suivez l'impact réel et les conversions en temps réel sur
                    votre dashboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof - Marquee */}
      <section className="relative z-10 py-24 border-t border-white/[0.03] overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <h2 className="text-3xl md:text-5xl font-normal tracking-tight text-white text-center font-serif">
            Approuvé par l'industrie
          </h2>
        </div>
        <div className="relative flex w-full overflow-hidden py-4">
          <div className="flex animate-marquee whitespace-nowrap gap-20">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex gap-20 items-center opacity-50">
                <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                  <Layers className="w-8 h-8 stroke-[1.5]" />
                  <span className="text-2xl font-medium tracking-tight sans-serif-title">
                    Struxture
                  </span>
                </div>
                <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                  <Zap className="w-8 h-8 stroke-[1.5]" />
                  <span className="text-2xl font-medium tracking-tight sans-serif-title">
                    BoltShift
                  </span>
                </div>
                <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                  <Box className="w-8 h-8 stroke-[1.5]" />
                  <span className="text-2xl font-medium tracking-tight sans-serif-title">
                    Cube
                  </span>
                </div>
                <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                  <Globe className="w-8 h-8 stroke-[1.5]" />
                  <span className="text-2xl font-medium tracking-tight sans-serif-title">
                    GlobalNet
                  </span>
                </div>
                <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                  <Layers className="w-8 h-8 stroke-[1.5]" />
                  <span className="text-2xl font-medium tracking-tight sans-serif-title">
                    Struxture
                  </span>
                </div>
                <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                  <Zap className="w-8 h-8 stroke-[1.5]" />
                  <span className="text-2xl font-medium tracking-tight sans-serif-title">
                    BoltShift
                  </span>
                </div>
                <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                  <Box className="w-8 h-8 stroke-[1.5]" />
                  <span className="text-2xl font-medium tracking-tight sans-serif-title">
                    Cube
                  </span>
                </div>
                <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all">
                  <Globe className="w-8 h-8 stroke-[1.5]" />
                  <span className="text-2xl font-medium tracking-tight sans-serif-title">
                    GlobalNet
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-[#020408] to-transparent z-20"></div>
          <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-[#020408] to-transparent z-20"></div>
        </div>

        {/* Testimonials */}
        <div className="max-w-7xl mx-auto px-6 mt-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-8 reveal border border-white/5 bg-[#0A0C10]/50">
              <p className="text-slate-300 font-light mb-6 text-sm leading-relaxed">
                "Konex nous a permis d'identifier des ambassadeurs
                ultra-pertinents que nous n'aurions jamais trouvés seuls. Le ROI
                est indiscutable."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
                  alt="Thomas"
                  className="w-9 h-9 rounded-full object-cover border border-white/10"
                />
                <div>
                  <div className="text-sm font-medium text-white">
                    Thomas R.
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    CMO @ DevTool
                  </div>
                </div>
              </div>
            </div>
            <div
              className="glass-card rounded-2xl p-8 reveal border border-white/5 bg-[#0A0C10]/50"
              style={{ transitionDelay: "100ms" }}
            >
              <p className="text-slate-300 font-light mb-6 text-sm leading-relaxed">
                "Je peux enfin monétiser mon audience tech sans vendre mon âme.
                Les briefs sont clairs et les produits sont top."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80"
                  alt="Sarah"
                  className="w-9 h-9 rounded-full object-cover border border-white/10"
                />
                <div>
                  <div className="text-sm font-medium text-white">Sarah M.</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Nano-Influenceuse
                  </div>
                </div>
              </div>
            </div>
            <div
              className="glass-card rounded-2xl p-8 reveal border border-white/5 bg-[#0A0C10]/50"
              style={{ transitionDelay: "200ms" }}
            >
              <p className="text-slate-300 font-light mb-6 text-sm leading-relaxed">
                "L'interface de tracking est la meilleure du marché. Tout est
                centralisé, du brief au paiement. Un gain de temps énorme."
              </p>
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80"
                  alt="David"
                  className="w-9 h-9 rounded-full object-cover border border-white/10"
                />
                <div>
                  <div className="text-sm font-medium text-white">David K.</div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Growth Lead
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Pricing - Improved cards with Glow & Toggle */}
      <section
        id="pricing"
        className="relative z-10 py-32 border-t border-white/[0.03]"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl md:text-5xl font-normal tracking-tight text-white mb-4 font-serif">
              Tarification simple
            </h2>
            <p className="text-slate-400 mb-10">
              Choisissez votre profil pour voir les offres adaptées.
            </p>

            {/* Modern Toggle Switch */}
            <div className="inline-flex bg-white/5 p-1.5 rounded-full border border-white/10 mb-8 backdrop-blur-sm relative cursor-pointer z-20">
              <div
                className={cn(
                  "absolute top-1.5 bottom-1.5 w-[calc(50%-0.375rem)] bg-white rounded-full transition-all duration-300 ease-out shadow-lg z-0",
                  activePricing === "saas"
                    ? "left-1.5"
                    : "left-[calc(50%+0.375rem)]"
                )}
              ></div>
              <button
                onClick={() => setActivePricing("saas")}
                className={cn(
                  "relative z-10 px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300 min-w-[160px]",
                  activePricing === "saas"
                    ? "text-slate-900"
                    : "text-slate-400 hover:text-white"
                )}
              >
                SaaS & Marques
              </button>
              <button
                onClick={() => setActivePricing("creator")}
                className={cn(
                  "relative z-10 px-8 py-2.5 rounded-full text-sm font-medium transition-all duration-300 min-w-[160px]",
                  activePricing === "creator"
                    ? "text-slate-900"
                    : "text-slate-400 hover:text-white"
                )}
              >
                Créateurs
              </button>
            </div>
          </div>

          {/* SaaS Pricing */}
          <div className="relative min-h-[500px]">
            <div
              className={cn(
                "grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto transition-all duration-500 ease-in-out absolute top-0 left-0 w-full",
                activePricing === "saas"
                  ? "opacity-100 translate-y-0 z-10"
                  : "opacity-0 translate-y-4 pointer-events-none z-0"
              )}
            >
              <div className="glass-card rounded-3xl p-10 border border-white/10 flex flex-col">
                <h3 className="text-xl font-medium text-white mb-2 font-serif">
                  Starter
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-semibold text-white font-serif">
                    0€
                  </span>
                  <span className="text-slate-500">/mois</span>
                </div>
                <ul className="space-y-4 mb-8 text-sm text-slate-400 flex-1">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>{" "}
                    Accès marketplace
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>{" "}
                    20% commission
                  </li>
                </ul>
                <a
                  href="#"
                  className="block w-full py-4 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-center text-sm font-medium text-white transition-colors"
                >
                  Commencer
                </a>
              </div>

              {/* Highlighted Scale Card with Glow */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-b from-blue-500 to-blue-600 rounded-[25px] opacity-30 blur-xl group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative glass-card rounded-3xl p-10 border border-blue-500/30 bg-[#0A0C10] flex flex-col h-full">
                  <div className="absolute top-0 right-0 p-4">
                    <div className="bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-lg shadow-blue-500/20">
                      Populaire
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2 font-serif">
                    Scale
                  </h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-5xl font-semibold text-white font-serif">
                      89€
                    </span>
                    <span className="text-slate-500">/mois</span>
                  </div>
                  <ul className="space-y-4 mb-8 text-sm text-slate-400 flex-1">
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-blue-400" />
                      </div>{" "}
                      Tout illimité
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-blue-400" />
                      </div>{" "}
                      15% commission
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-blue-400" />
                      </div>{" "}
                      Support prioritaire
                    </li>
                  </ul>
                  <a
                    href="#"
                    className="block w-full py-4 px-4 bg-blue-600 hover:bg-blue-500 rounded-xl text-center text-sm font-medium text-white transition-colors shadow-lg shadow-blue-600/20"
                  >
                    Passer Pro
                  </a>
                </div>
              </div>
            </div>

            {/* Creator Pricing */}
            <div
              className={cn(
                "max-w-sm mx-auto transition-all duration-500 ease-in-out absolute top-0 left-0 right-0",
                activePricing === "creator"
                  ? "opacity-100 translate-y-0 z-10"
                  : "opacity-0 translate-y-4 pointer-events-none z-0"
              )}
            >
              <div className="glass-card rounded-3xl p-10 border border-purple-500/30 bg-purple-500/[0.02] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <h3 className="text-xl font-medium text-white mb-2 font-serif">
                  Créateur
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-semibold text-white font-serif">
                    Gratuit
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-8 leading-relaxed">
                  Nous prenons 20% sur les revenus générés. Vous ne payez rien
                  d'avance.
                </p>
                <a
                  href="#"
                  className="block w-full py-4 px-4 bg-purple-600 hover:bg-purple-500 rounded-xl text-center text-sm font-medium text-white transition-colors shadow-lg shadow-purple-600/20"
                >
                  Créer mon profil
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Double Audience - Unchanged */}
      <section className="relative z-10 py-32 border-t border-white/[0.03]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 reveal">
            <h2 className="text-3xl md:text-5xl font-normal tracking-tight text-white mb-6 font-serif">
              Deux audiences, un écosystème
            </h2>
            <p className="text-lg text-slate-400 font-light max-w-xl mx-auto">
              La puissance du réseau, simplifiée pour chacun.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* ... Cards kept same ... */}
            {/* Card SaaS */}
            <div className="group relative rounded-3xl p-[1px] bg-gradient-to-b from-white/10 to-white/0 hover:from-blue-500/50 hover:to-blue-600/10 transition-colors duration-500 reveal h-full">
              <div className="absolute inset-0 bg-blue-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="relative bg-[#050609] rounded-[23px] h-full p-10 md:p-14 overflow-hidden flex flex-col justify-between">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage:
                      "radial-gradient(#3b82f6 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                ></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/30 border border-blue-500/20 text-blue-300 text-xs font-medium mb-8">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Pour les Entreprises
                  </div>
                  <h3 className="text-4xl md:text-5xl font-normal text-white mb-6 tracking-tight font-serif">
                    Marques & SaaS
                  </h3>
                  <p className="text-slate-400 font-light text-lg mb-12 max-w-sm leading-relaxed">
                    Transformez des milliers de micro-interactions en un canal
                    d'acquisition prévisible. Accédez à une force de vente
                    décentralisée.
                  </p>
                </div>
                <div className="relative z-10 mt-auto">
                  <a
                    href="#"
                    className="flex items-center justify-between w-full bg-white hover:bg-slate-200 text-slate-950 p-2 pl-6 rounded-full transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                  >
                    <span className="font-semibold text-sm">
                      Rejoindre 200+ SaaS
                    </span>
                    <div className="flex items-center gap-3 pr-2">
                      <div className="flex -space-x-3 overflow-hidden isolate">
                        <img
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                          src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80"
                          alt=""
                        />
                        <img
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                          src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80"
                          alt=""
                        />
                        <img
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover bg-slate-100"
                          src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80"
                          alt=""
                        />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Card Creator */}
            <div
              className="group relative rounded-3xl p-[1px] bg-gradient-to-b from-white/10 to-white/0 hover:from-purple-500/50 hover:to-purple-600/10 transition-colors duration-500 reveal h-full"
              style={{ transitionDelay: "150ms" }}
            >
              <div className="absolute inset-0 bg-purple-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              <div className="relative bg-[#050609] rounded-[23px] h-full p-10 md:p-14 overflow-hidden flex flex-col justify-between">
                <div
                  className="absolute inset-0 opacity-[0.03] bg-repeat"
                  style={{
                    backgroundImage:
                      "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz4KPC9zdmc+')",
                  }}
                ></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/30 border border-purple-500/20 text-purple-300 text-xs font-medium mb-8">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                    </span>
                    Pour les Talents
                  </div>
                  <h3 className="text-4xl md:text-5xl font-normal text-white mb-6 tracking-tight font-serif">
                    Créateurs
                  </h3>
                  <p className="text-slate-400 font-light text-lg mb-12 max-w-sm leading-relaxed">
                    Monétisez votre expertise tech sans compromettre votre
                    intégrité. Collaborez avec les outils que vous utilisez déjà
                    au quotidien.
                  </p>
                </div>
                <div className="relative z-10 mt-auto">
                  <a
                    href="#"
                    className="flex items-center justify-between w-full bg-[#1A1D24] border border-white/10 hover:border-purple-500/50 hover:bg-[#20232b] text-white p-2 pl-6 rounded-full transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                  >
                    <span className="font-semibold text-sm">
                      Rejoindre 1,500+ Créateurs
                    </span>
                    <div className="flex items-center gap-3 pr-2">
                      <div className="flex -space-x-3 overflow-hidden isolate">
                        <img
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-[#1A1D24] object-cover"
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80"
                          alt=""
                        />
                        <img
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-[#1A1D24] object-cover"
                          src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80"
                          alt=""
                        />
                        <img
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-[#1A1D24] object-cover"
                          src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=facearea&facepad=2&w=100&h=100&q=80"
                          alt=""
                        />
                      </div>
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer - Giant Typography & Restructured */}
      <footer className="relative z-10 border-t border-white/[0.05] bg-[#020408] pt-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Hexagon className="w-6 h-6 text-white fill-white/10 stroke-[1.5]" />
                <span className="text-xl font-normal tracking-tight text-white sans-serif-title">
                  Konex
                </span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-8">
                La première marketplace B2B dédiée aux nano-influenceurs.
                Connectez, collaborez et grandissez avec confiance.
              </p>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Twitter className="w-4 h-4" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div>
              <h5 className="text-xs font-bold text-white mb-6 uppercase tracking-widest">
                Plateforme
              </h5>
              <ul className="space-y-4 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pour les Marques
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Pour les Créateurs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Tarifs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Connexion
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold text-white mb-6 uppercase tracking-widest">
                Légal
              </h5>
              <ul className="space-y-4 text-sm text-slate-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Mentions Légales
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Confidentialité
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    CGU / CGV
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Cookies
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600 font-mono border-t border-white/[0.05] py-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-500/80">
                Tous systèmes opérationnels
              </span>
            </div>
            <div>© 2024 Konex Inc. Paris, France.</div>
          </div>
        </div>

        {/* Giant Typography Watermark - Increased opacity */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[35%] pointer-events-none select-none z-0 w-full text-center overflow-hidden">
          <span className="text-[12rem] md:text-[24rem] font-bold text-white/[0.04] leading-none tracking-tighter font-serif whitespace-nowrap">
            KONEX
          </span>
        </div>
      </footer>
    </div>
  );
}
