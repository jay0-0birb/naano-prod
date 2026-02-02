"use client";

import { useTranslations } from "next-intl";
import EngagementHeatmap from "@/components/academy/engagement-heatmap";
import CollapsibleSection from "@/components/academy/collapsible-section";

export default function AcademyPageClient() {
  const t = useTranslations("academy");

  return (
    <div className="max-w-4xl mx-auto pb-16 academy-page">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[#111827] mb-2">
          {t("title")}
        </h1>
        <p className="text-[#64748B] text-sm">
          {t("subtitle")}
        </p>
      </div>

      {/* LinkedIn Section */}
      <CollapsibleSection title={t("linkedIn")} defaultOpen={true}>
        {/* Welcome */}
        <div className="space-y-3 mb-6">
          <h2 className="text-2xl font-semibold text-[#111827] flex items-center gap-2">
            👋 Welcome
          </h2>
          <p className="text-[#4B5563] text-sm">
            This is exactly the strategy we use to generate massive reach...
          </p>
          <p className="text-[#4B5563] text-sm">
            <strong>Your Mission:</strong> Share these insights with your
            audience through your content, but keep the <em>actual recipe</em>{" "}
            for yourself. 🤫
          </p>
        </div>

        {/* Sub-toggles */}
        <div className="space-y-4">
          <CollapsibleSection title="The 2026 Algorithm Blueprint">
            <p className="text-slate-300 text-sm mb-6">
              We analyzed the latest data on how LinkedIn works right now. Here
              is what you need to focus on to hack the system.
            </p>

            {/* 1. Mobile-First Reality */}
            <div className="space-y-3 mb-6">
              <h4 className="text-base font-semibold text-[#111827]">
                1. The "Mobile-First" Reality
              </h4>
              <p className="text-[#4B5563] text-sm font-semibold">
                If your post doesn't look good on a phone, it doesn't exist.
              </p>
              <ul className="space-y-1.5 text-[#4B5563] text-sm ml-6 list-disc">
                <li>
                  <strong>72% of users are on mobile.</strong> Only 28% use a
                  desktop.
                </li>
                <li>
                  <strong>Speed is Key:</strong> Attention spans are shorter.
                  Users view ~12 posts per session on mobile. You have split
                  seconds to stop them.
                </li>
                <li>
                  <strong>The Lesson:</strong> Write short paragraphs, and make
                  your "Hook" impossible to ignore.
                </li>
              </ul>
            </div>

            {/* 2. Viral Scoreboard */}
            <div className="space-y-3 mb-6">
              <h4 className="text-base font-semibold text-[#111827]">
                2. The Viral Scoreboard (How to Score Points) 💯
              </h4>
              <p className="text-[#4B5563] text-sm">
                Not all interactions are created equal. The algorithm assigns a
                "weight" to every action. Knowing this explains exactly why our
                "Comment to get resource" strategy works.
              </p>

              <div className="overflow-x-auto my-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-3 py-2.5 text-left text-sm font-semibold text-white">
                        Action
                      </th>
                      <th className="px-3 py-2.5 text-left text-sm font-semibold text-white">
                        Weight
                      </th>
                      <th className="px-3 py-2.5 text-left text-sm font-semibold text-white">
                        Why it matters
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-white/5">
                      <td className="px-3 py-2.5 text-sm text-slate-300">
                        Comment
                      </td>
                      <td className="px-3 py-2.5 text-sm text-white font-semibold">
                        12 pts
                      </td>
                      <td className="px-3 py-2.5 text-sm text-slate-300">
                        The King. This is why we ask for comments!
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-3 py-2.5 text-sm text-slate-300">
                        Save
                      </td>
                      <td className="px-3 py-2.5 text-sm text-white font-semibold">
                        10 pts
                      </td>
                      <td className="px-3 py-2.5 text-sm text-slate-300">
                        High signal that your content is valuable.
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-3 py-2.5 text-sm text-slate-300">
                        Instant Repost
                      </td>
                      <td className="px-3 py-2.5 text-sm text-white font-semibold">
                        8 pts
                      </td>
                      <td className="px-3 py-2.5 text-sm text-slate-300">
                        Great for reach.
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-3 py-2.5 text-sm text-slate-300">
                        Repost w/ thoughts
                      </td>
                      <td className="px-3 py-2.5 text-sm text-white font-semibold">
                        4 pts
                      </td>
                      <td className="px-3 py-2.5 text-sm text-slate-300">
                        Good, but less viral than instant sharing.
                      </td>
                    </tr>
                    <tr className="border-b border-white/5">
                      <td className="px-3 py-2.5 text-sm text-slate-300">
                        "See More" Click
                      </td>
                      <td className="px-3 py-2.5 text-sm text-white font-semibold">
                        2 pts
                      </td>
                      <td className="px-3 py-2.5 text-sm text-slate-300">
                        Proves your Hook worked.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2.5 text-sm text-slate-300">
                        Like
                      </td>
                      <td className="px-3 py-2.5 text-sm text-white font-semibold">
                        1 pt
                      </td>
                      <td className="px-3 py-2.5 text-sm text-slate-300">
                        The weakest metric. Don't chase likes, chase
                        conversation.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 border-l-2 border-[#3B82F6] rounded-xl p-4 space-y-2 my-4">
                <p className="text-[#111827] font-semibold text-sm">
                  💡 The Strategy:
                </p>
                <p className="text-[#4B5563] text-sm">
                  When you offer real value in exchange for a concrete
                  interaction (like a comment), LinkedIn rewards you with
                  massive reach.
                </p>
                <p className="text-[#111827] font-semibold text-sm mt-3">
                  This is why the classic tactic works so well:
                </p>
                <p className="text-[#111827] text-sm font-mono bg-gray-100 rounded px-2 py-1 inline-block">
                  "Comment 'WEB' and I'll send you the free resource."
                </p>
                <p className="text-[#4B5563] text-sm mt-2">
                  This trick blends high engagement (comments) + lead capture
                  (DMs/Connections) in one smooth movement.
                </p>
                <p className="text-rose-600 font-semibold text-sm mt-3">
                  Pro Tip:
                </p>
                <p className="text-[#4B5563] text-sm">
                  Repost your own post 6 to 8 hours after publishing. Data shows
                  this boosts visibility by an average of 30%.
                </p>
              </div>
            </div>

            {/* 3. Winner Schedule */}
            <div className="space-y-3 mb-6">
              <h4 className="text-base font-semibold text-white">
                3. The "Winner" Schedule
              </h4>
              <EngagementHeatmap type="linkedin" />
            </div>

            {/* 4. Conversion Funnel */}
            <div className="space-y-3 mb-6">
              <h4 className="text-base font-semibold text-white">
                4. The Conversion Funnel (Where the money is at) 💰
              </h4>
              <p className="text-slate-300 text-sm">
                Your post is just the hook. Your profile is the landing page.
              </p>
              <div className="bg-white/5 rounded p-4 space-y-2 my-3">
                <p className="text-white font-semibold text-sm">
                  User Journey Steps:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 text-sm ml-2">
                  <li>Scrolled Feed</li>
                  <li>Saw your Post (Hook + Value)</li>
                  <li>
                    Visited your Profile ➡️ <strong>Crucial Step</strong>
                  </li>
                  <li>Clicked the Link / Sent a DM</li>
                </ol>
                <p className="text-white font-semibold text-sm mt-3">
                  Your Profile Checklist:
                </p>
                <p className="text-slate-300 text-sm mb-2">
                  To maximize commissions, your profile must be optimized as a
                  "Key Step" in this journey:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-sm ml-2">
                  <li>✔ Clear Value Proposition: Who do you help?</li>
                  <li>✔ Reassurance: Why should they trust you?</li>
                  <li>
                    ✔ Call to Action (CTA): A clear link to the SaaS offer or
                    your portfolio.
                  </li>
                </ul>
              </div>
            </div>

            {/* 5. Optimal Content Mix */}
            <div className="space-y-3 mb-6">
              <h4 className="text-base font-semibold text-white">
                5. The Optimal Content Mix 🍰
              </h4>
              <p className="text-slate-300 text-sm">
                The most visible creators don't just sell; they add value. To
                keep your audience engaged and ready to buy, aim for this mix:
              </p>
              <ul className="space-y-1.5 text-slate-300 text-sm ml-6 list-disc">
                <li>
                  <strong>55% Expertise:</strong> "How-to" guides and Industry
                  Insights (This is where you showcase the SaaS tool!).
                </li>
                <li>
                  <strong>30% News & Offers:</strong> Celebrate wins and share
                  specific deals.
                </li>
                <li>
                  <strong>15% Personal Branding:</strong> Your story and
                  personality.
                </li>
              </ul>
            </div>

            {/* 6. Be accurate */}
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-white">
                6. Be accurate
              </h4>
              <p className="text-slate-300 text-sm">
                Posting once or twice a week every week is perfect.
              </p>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="4 Elements of a Viral Post">
            {/* TL;DR */}
            <div className="space-y-3 mb-6">
              <p className="text-slate-300 text-sm">
                <strong>TL;DR:</strong> A great post is{" "}
                <strong>Useful, Visual, Timely,</strong> and{" "}
                <strong>Solves a Problem.</strong>
              </p>
              <p className="text-slate-300 text-sm">
                This is what the algorithm loves, and this is what generates
                commissions for you.
              </p>
            </div>

            {/* 1. A Free but High-Value Lead Magnet */}
            <div className="space-y-3 mb-6">
              <h4 className="text-base font-semibold text-white flex items-center gap-2">
                1. A Free but High-Value Lead Magnet 🎁
              </h4>
              <p className="text-slate-300 text-sm">
                The offer must feel like something people would normally pay
                for. It needs to trigger the "Wait, I actually need this" i
                ction.
              </p>
              <div className="space-y-2 mt-3">
                <p className="text-white font-semibold text-sm">It must be:</p>
                <ul className="space-y-1.5 text-slate-300 text-sm ml-6 list-disc">
                  <li>
                    <strong>Real value</strong> (A template, a ready-to-use
                    landing page, an optimized prompt, a mini-course).
                  </li>
                  <li>
                    Something that motivates the comment (your Call to Action).
                  </li>
                </ul>
              </div>
              <div className="space-y-2 mt-3">
                <p className="text-white font-semibold text-sm">
                  Examples (using SaaS tools):
                </p>
                <ul className="space-y-1.5 text-slate-300 text-sm ml-6 list-disc">
                  <li>"Landing page template to sell your service."</li>
                  <li>"AI-generated portfolio page ready to use."</li>
                  <li>
                    "The exact prompt to generate a pro website in 10 seconds."
                  </li>
                </ul>
              </div>
            </div>

            {/* 2. Visually Impactful */}
            <div className="space-y-3 mb-6">
              <h4 className="text-base font-semibold text-white flex items-center gap-2">
                2. Visually Impactful 👁️
              </h4>
              <p className="text-slate-300 text-sm">
                The visual is what stops the scroll. If they don't stop, they
                don't read.
              </p>
              <p className="text-slate-300 text-sm">
                Your post needs to make people brake and ask: "What is that?"
              </p>
              <div className="space-y-2 mt-3">
                <p className="text-white font-semibold text-sm">
                  Best Formats:
                </p>
                <ul className="space-y-1.5 text-slate-300 text-sm ml-6 list-disc">
                  <li>Screenshots of the result created with the SaaS.</li>
                  <li>Before / After comparison.</li>
                  <li>
                    Mini-video showing the generation process (speed it up!).
                  </li>
                  <li>Carousel explaining 3 key points.</li>
                </ul>
              </div>
            </div>

            {/* 3. Leverage a Trend */}
            <div className="space-y-3 mb-6">
              <h4 className="text-base font-semibold text-white flex items-center gap-2">
                3. Leverage a Trend 📈
              </h4>
              <p className="text-slate-300 text-sm">
                Posts perform 10x better when they surf a wave of existing
                conversation. If people are already talking about it, your post
                will take off.
              </p>
              <div className="space-y-2 mt-3">
                <p className="text-white font-semibold text-sm">
                  Headline Examples:
                </p>
                <ul className="space-y-1.5 text-slate-300 text-sm ml-6 list-disc">
                  <li>
                    "How I built a page with AI in 8 seconds using [SaaS Name]."
                  </li>
                  <li>
                    "My first landing page made entirely with a prompt (No
                    Code)."
                  </li>
                  <li>
                    "I tested the tool everyone is using to build websites with
                    AI..."
                  </li>
                </ul>
              </div>
            </div>

            {/* 4. Solve a Real Pain Point */}
            <div className="space-y-3 mb-6">
              <h4 className="text-base font-semibold text-white flex items-center gap-2">
                4. Solve a Real Pain Point 💊
              </h4>
              <p className="text-slate-300 text-sm">
                The best content eliminates immediate pain for your audience.
              </p>
              <div className="space-y-2 mt-3">
                <p className="text-white font-semibold text-sm">
                  Target these feelings:
                </p>
                <ul className="space-y-1.5 text-slate-300 text-sm ml-6 list-disc">
                  <li>You don't know how to code/build a site.</li>
                  <li>You don't want to pay a developer $2k.</li>
                  <li>You need to launch your business TODAY.</li>
                  <li>
                    You want a pro landing page to sell without wasting time.
                  </li>
                </ul>
              </div>
              <div className="bg-white/5 border-l-2 border-white/20 rounded p-4 space-y-2 mt-4">
                <p className="text-white font-semibold text-sm">The Goal:</p>
                <p className="text-slate-300 text-sm">
                  Your Lead Magnet makes them think: "Finally, someone gave me a
                  solution for FREE."
                </p>
              </div>
              <div className="bg-white/5 border-l-2 border-white/20 rounded p-4 space-y-2 mt-3">
                <p className="text-white font-semibold text-sm">
                  The Equation:
                </p>
                <p className="text-slate-300 text-sm">
                  Clearer Solution = Stronger Virality.
                </p>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="The Result">
            <div className="space-y-3">
              <p className="text-slate-300 text-sm">
                When your post hits these 4 points, LinkedIn rewards it.
              </p>
              <p className="text-slate-300 text-sm">
                People comment, save, ask for the resource, DM you, and visit
                your profile.
              </p>
              <p className="text-white font-semibold text-sm mt-4">And you?</p>
              <ul className="space-y-2 text-slate-300 text-sm ml-6 list-none">
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>You grow your following.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>You build authority.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>You increase your opportunities.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>You earn money with our program.</span>
                </li>
              </ul>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Anatomy of a Great Post">
            <div className="space-y-4">
              <p className="text-red-400 font-semibold text-sm">
                A perfect LinkedIn post is composed of 10% Hook and 90% Visuals.
              </p>

              {/* The Hook (Text) */}
              <div className="space-y-3">
                <h4 className="text-base font-semibold text-white">
                  The Hook (Text)
                </h4>
                <p className="text-slate-300 text-sm">
                  Keep it punchy. State the achievement clearly.
                </p>
                <div className="bg-white/5 border-l-2 border-white/20 rounded p-4 mt-3">
                  <p className="text-slate-300 text-sm">
                    I just built an agent that does end-to-end AI marketing
                    campaign creation. ✨
                  </p>
                </div>
              </div>

              {/* The Visual (Media) */}
              <div className="space-y-3">
                <h4 className="text-base font-semibold text-white">
                  The Visual (Media)
                </h4>
                <ul className="space-y-1.5 text-slate-300 text-sm ml-6 list-disc">
                  <li>
                    Video: A fast-paced screen recording showing the tool doing
                    the work.
                  </li>
                  <li>
                    Caption: "Comment 'AI' and I'll send you the workflow."
                  </li>
                </ul>
              </div>
            </div>
          </CollapsibleSection>
        </div>
      </CollapsibleSection>

      {/* Instagram Section */}
      <CollapsibleSection title={t("instagram")} defaultOpen={true}>
        {/* Welcome */}
        <div className="space-y-3 mb-6">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            👋 Welcome
          </h2>
          <p className="text-slate-300 text-sm">
            This is exactly the strategy we use to generate massive reach...
          </p>
          <p className="text-slate-300 text-sm">
            <strong>Your Mission:</strong> Share these insights with your
            audience through your content, but keep the <em>actual recipe</em>{" "}
            for yourself. 🤫
          </p>
          <p className="text-slate-300 text-sm">
            We analyzed the latest data on how Instagram works right now. Here
            is what you need to focus on to hack the system.
          </p>
        </div>

        {/* Sub-toggles */}
        <div className="space-y-4">
          <CollapsibleSection title="An Analysis of the Instagram Algorithm and Marketing Strategies for 2026">
            <div className="space-y-4">
              <CollapsibleSection title="Executive Summary" level={1}>
                <p className="text-slate-300 text-sm">
                  The Instagram landscape in 2026 is defined by a significant
                  algorithmic shift aimed at enhancing content discovery and
                  rewarding originality, closely mirroring TikTok's model. The
                  platform is now structured to give smaller creators
                  unprecedented reach by immediately testing content on
                  non-followers. This change is complemented by a move towards
                  valuing <strong>views</strong> and <strong>watch time</strong>{" "}
                  as the primary performance metrics across all content formats,
                  potentially supplanting likes. Content now enjoys a longer
                  lifespan of up to 90 days, and Carousels are being promoted
                  with the same vigor as Reels.
                </p>
              </CollapsibleSection>

              <CollapsibleSection
                title="The 2025 Instagram Algorithm Overhaul"
                level={1}
              >
                <p className="text-slate-300 text-sm mb-4">
                  Instagram's core business model is to maximize user time on
                  the platform to increase ad revenue, which for its parent
                  company Meta totaled $134.9 billion in 2023. The 2026
                  algorithm is finely tuned to achieve this by serving users
                  highly engaging and relevant content.
                </p>
                <CollapsibleSection
                  title="Key Algorithmic Changes for 2026"
                  level={2}
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h5 className="text-sm font-semibold text-white">
                        New Content Distribution Model
                      </h5>
                      <p className="text-slate-300 text-sm">
                        Content is now shown to both followers and non-followers
                        simultaneously from the moment it's posted, increasing
                        reach for smaller creators.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-semibold text-white">
                        The Primacy of Views and Watch Time
                      </h5>
                      <p className="text-slate-300 text-sm">
                        Views and high watch time are becoming the primary
                        performance metrics across all content types (Reels,
                        Carousels, single photos), indicating genuine
                        engagement.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-semibold text-white">
                        Extended Content Lifespan
                      </h5>
                      <p className="text-slate-300 text-sm">
                        A post's effective lifespan has increased to up to 90
                        days, a significant change from the previous 48-72 hour
                        window.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-semibold text-white">
                        Reduced Importance of Posting Times
                      </h5>
                      <p className="text-slate-300 text-sm">
                        The algorithm's sophistication makes specific "peak
                        times" less critical, as content published at any time
                        will be shown when the audience is active. It suggests
                        posting two hours before a target audience's peak time
                        as a strategy.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-semibold text-white">
                        The Resurgence of Carousels
                      </h5>
                      <p className="text-slate-300 text-sm">
                        Instagram is promoting Carousels with similar priority
                        to Reels to compete with TikTok, making them a key part
                        of a diversified content strategy.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h5 className="text-sm font-semibold text-white">
                        Emphasis on Original Content
                      </h5>
                      <p className="text-slate-300 text-sm">
                        The platform will favor original content, and reposting
                        will diminish the reach of the reposted version compared
                        to the original.
                      </p>
                    </div>
                  </div>
                </CollapsibleSection>
              </CollapsibleSection>

              <CollapsibleSection
                title="How the Algorithm Ranks Content"
                level={1}
              >
                <div className="space-y-6">
                  <p className="text-slate-300 text-sm">
                    The decision to show content is based on a hierarchy of
                    primary and secondary factors
                  </p>

                  {/* Table 1: Content Ranking by Action */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-white">
                      Content Ranking by Action
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="px-3 py-2.5 text-left text-sm font-semibold text-white">
                              Action
                            </th>
                            <th className="px-3 py-2.5 text-left text-sm font-semibold text-white">
                              Weight
                            </th>
                            <th className="px-3 py-2.5 text-left text-sm font-semibold text-white">
                              Why it matters
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/5">
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              Share (DM / Story)
                            </td>
                            <td className="px-3 py-2.5 text-sm text-white font-semibold">
                              12 pts
                            </td>
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              The New King. If a user sends it to a friend, you
                              gain a new set of eyes for free. This is the true
                              engine of virality.
                            </td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              Save
                            </td>
                            <td className="px-3 py-2.5 text-sm text-white font-semibold">
                              10 pts
                            </td>
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              The Utility Signal. Critical for SaaS and
                              educational content. It means: "I'll need this
                              later." The algorithm understands your content has
                              high value.
                            </td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              Retention (Watch Time)
                            </td>
                            <td className="px-3 py-2.5 text-sm text-white font-semibold">
                              8 pts
                            </td>
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              Did the user watch the Reel until the end? Did
                              they loop it? This is a prerequisite for
                              distribution.
                            </td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              Comment
                            </td>
                            <td className="px-3 py-2.5 text-sm text-white font-semibold">
                              4 pts
                            </td>
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              Good for social proof, but less powerful for viral
                              distribution than sharing.
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              Like
                            </td>
                            <td className="px-3 py-2.5 text-sm text-white font-semibold">
                              1 pt
                            </td>
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              The vanity metric. Don't chase likes - chase
                              shares.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Table 2: Content Ranking Factors */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-white">
                      Content Ranking Factors
                    </h5>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="px-3 py-2.5 text-left text-sm font-semibold text-white">
                              Factor Type
                            </th>
                            <th className="px-3 py-2.5 text-left text-sm font-semibold text-white">
                              Factor Name
                            </th>
                            <th className="px-3 py-2.5 text-left text-sm font-semibold text-white">
                              Description
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-white/5">
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              Primary
                            </td>
                            <td className="px-3 py-2.5 text-sm text-white font-semibold">
                              Relationship
                            </td>
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              The algorithm prioritizes content from creators a
                              user frequently interacts with through comments,
                              DMs, and likes. Responding to community engagement
                              strengthens this signal.
                            </td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              Primary
                            </td>
                            <td className="px-3 py-2.5 text-sm text-white font-semibold">
                              Interest
                            </td>
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              The algorithm shows users more of what they have
                              historically engaged with. Creating content that
                              aligns with proven interests within a niche is
                              crucial.
                            </td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              Primary
                            </td>
                            <td className="px-3 py-2.5 text-sm text-white font-semibold">
                              Relevance
                            </td>
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              Content related to trending topics or current
                              events (e.g., elections, holidays) is considered
                              more pertinent and receives an algorithmic boost.
                            </td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              Secondary
                            </td>
                            <td className="px-3 py-2.5 text-sm text-white font-semibold">
                              Frequency of Use
                            </td>
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              Infrequent users are shown more content from
                              friends and family, while daily users, having
                              exhausted that content, see more suggested posts
                              from accounts they don't follow.
                            </td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              Secondary
                            </td>
                            <td className="px-3 py-2.5 text-sm text-white font-semibold">
                              Follow Count
                            </td>
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              A user following thousands of accounts is less
                              likely to see any single creator's post compared
                              to a user who follows only a few hundred accounts.
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              Secondary
                            </td>
                            <td className="px-3 py-2.5 text-sm text-white font-semibold">
                              Session Duration
                            </td>
                            <td className="px-3 py-2.5 text-sm text-slate-300">
                              The longer a user's session, the more likely they
                              are to be shown suggested content as they scroll
                              deeper into their feed.
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Core Mechanics */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-white">
                      Core Mechanics
                    </h5>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <p className="text-white font-semibold text-sm">
                          The "Sample Law"
                        </p>
                        <p className="text-slate-300 text-sm">
                          When a new piece of content is posted, the algorithm
                          shows it to a sample of approximately 15% of the
                          creator's audience. If that sample engages positively
                          (high watch time, likes, comments), it is shown to
                          another 15%, and this process repeats, eventually
                          "breaking out" to non-followers if performance is
                          strong.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-white font-semibold text-sm">
                          The "Trust Score"
                        </p>
                        <p className="text-slate-300 text-sm">
                          Every account has an invisible rating between 0 and
                          100. This score is negatively impacted by spammy
                          activities like follow/unfollow, excessive hashtag
                          usage, and low-quality content. It is positively
                          influenced by consistent activity, high-quality
                          content, and genuine engagement from your audience.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Strategic Frameworks for Growth"
                level={1}
              >
                <div className="space-y-6">
                  <p className="text-slate-300 text-sm">
                    Success on the new Instagram requires more than just
                    understanding the algorithm; it demands a clear, executable
                    strategy. Two dominant frameworks have emerged: a
                    conversion-focused funnel and a rapid-growth content
                    replication model.
                  </p>

                  {/* The "Viral" Method */}
                  <CollapsibleSection title='The "Viral" Method' level={2}>
                    <div className="space-y-4">
                      <p className="text-slate-300 text-sm">
                        This method is designed for new or "faceless" accounts
                        to achieve rapid growth by leveraging proven content
                        formulas.
                      </p>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <h5 className="text-sm font-semibold text-white">
                            1. Account Setup & Warming
                          </h5>
                          <p className="text-slate-300 text-sm">
                            For the first 2-3 days, "warm up" the account by
                            interacting with high-performing content within the
                            target niche to prime the Explore Page algorithm.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h5 className="text-sm font-semibold text-white">
                            2. Competitor Research
                          </h5>
                          <p className="text-slate-300 text-sm">
                            Identify 4-5 top competitors and analyze their
                            content to find "outliers"—videos with exceptionally
                            high view counts compared to their average. Save
                            these videos for deconstruction.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h5 className="text-sm font-semibold text-white">
                            3. Content Creation by Replication
                          </h5>
                          <p className="text-slate-300 text-sm">
                            The core of the strategy is to recreate these
                            outlier videos. Download the competitor's viral Reel
                            and meticulously replicate its structure: match the
                            clip pacing, subject matter, and overall editing
                            style. The visual content itself should be original
                            (e.g., sourced from Pinterest or stock sites), but
                            the "recipe" is copied. This removes guesswork and
                            ensures the final product is edited in a way that is
                            proven to perform.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <h5 className="text-sm font-semibold text-white">
                            4. Achieving Uniqueness
                          </h5>
                          <p className="text-slate-300 text-sm">
                            To build a distinct brand identity, make one small,
                            testable change at a time to the replicated content.
                            This could be a unique filter (e.g., black and white
                            if competitors use color), a different font, a
                            unique outro clip, or a subtle video overlay.
                          </p>
                        </div>
                      </div>

                      {/* Trial Reels */}
                      <CollapsibleSection
                        title='Trial Reels: The Growth "Cheat Code"'
                        level={3}
                      >
                        <div className="space-y-4">
                          <p className="text-slate-300 text-sm">
                            Introduced in December 2024, Trial Reels are videos
                            shown exclusively to non-followers. Instagram's
                            stated purpose was to create a low-pressure
                            environment for creators to experiment. However,
                            marketers quickly identified them as a form of "free
                            advertising" to reach new people.
                          </p>

                          <div className="space-y-3">
                            <h5 className="text-sm font-semibold text-white">
                              2025 Limitations
                            </h5>
                            <p className="text-slate-300 text-sm">
                              In 2025, Instagram introduced two key limitations
                              to curb the "spamming" of Trial Reels:
                            </p>

                            <div className="space-y-2">
                              <p className="text-white font-semibold text-sm">
                                1. Daily Posting Caps:
                              </p>
                              <p className="text-slate-300 text-sm">
                                Most accounts now have a daily limit on Trial
                                Reel posts. This limit varies per account, with
                                some limited to as few as five per day.
                                Exceeding this unknown limit results in a{" "}
                                <strong>30-day block</strong> from posting Trial
                                Reels, issued without warning. The recommended
                                safe limit is{" "}
                                <strong>
                                  four to five Trial Reels per day.
                                </strong>
                              </p>
                            </div>

                            <div className="space-y-2">
                              <p className="text-white font-semibold text-sm">
                                2. Duplicate Content Penalty:
                              </p>
                              <p className="text-slate-300 text-sm">
                                The algorithm now detects and suppresses views
                                on exact duplicate Trial Reels. Posting the same
                                video as a Trial Reel twice will result in the
                                second version receiving minimal to no views.
                                However, this penalty does not apply when a
                                standard feed Reel is reposted as a Trial Reel.
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h5 className="text-sm font-semibold text-white">
                              A High-Volume Trial Reels Strategy
                            </h5>
                            <p className="text-slate-300 text-sm">
                              Even with limitations, the primary strategy is to
                              post just below the daily cap (4-5 per day). This
                              requires a system for generating sufficient
                              content.
                            </p>

                            <ul className="space-y-2 text-slate-300 text-sm ml-6 list-disc">
                              <li>
                                <strong>Repost Past Feed Reels:</strong> Repost
                                all previously published feed Reels as Trial
                                Reels. A video that underperformed on the main
                                feed can often go viral as a Trial Reel.
                              </li>
                              <li>
                                <strong>Duplicate New Drafts:</strong> Before
                                publishing a new Reel to the main feed,
                                duplicate the draft in Instagram and post the
                                copy as a Trial Reel first.
                              </li>
                              <li>
                                <strong>Create Slight Modifications:</strong>{" "}
                                Duplicate a single video draft multiple times
                                and make minor changes to each to bypass the
                                duplicate filter. The algorithm primarily looks
                                at the first 6-7 seconds of video, so modify the
                                hook, on-screen text, or pacing in that window.
                              </li>
                              <li>
                                <strong>Repurpose Instagram Stories:</strong>{" "}
                                Combine relevant Instagram Stories from the
                                archive into a cohesive Trial Reel.
                              </li>
                              <li>
                                <strong>Experiment Freely:</strong> Use Trial
                                Reels for testing new, unpolished, or
                                experimental ideas like unscripted "FaceTime
                                content."
                              </li>
                              <li>
                                <strong>Create "Meta" Trial Reels:</strong>{" "}
                                Dedicate one daily Trial Reel to explicitly
                                mention it's a Trial Reel, using on-screen text
                                like, "This is a Trial Reel, which means you
                                don't follow me yet. If you're interested in
                                [topic], hit the follow button."
                              </li>
                            </ul>
                          </div>
                        </div>
                      </CollapsibleSection>
                    </div>
                  </CollapsibleSection>

                  {/* The "Confirm, Connect, Convert" Funnel */}
                  <CollapsibleSection
                    title='The "Confirm, Connect, Convert" Funnel'
                    level={2}
                  >
                    <div className="space-y-4">
                      <p className="text-slate-300 text-sm">
                        This three-part process treats an Instagram account as a
                        "mini website" designed to guide visitors methodically
                        toward a conversion.
                      </p>

                      <CollapsibleSection title="1. Confirm" level={3}>
                        <div className="space-y-3">
                          <p className="text-slate-300 text-sm">
                            The first goal is to instantly confirm to visitors
                            that they are in the right place. This is achieved
                            through a fully optimized bio that is "crystal clear
                            on what you do and who you do it for."
                          </p>
                          <ul className="space-y-1.5 text-slate-300 text-sm ml-6 list-disc">
                            <li>
                              <strong>Profile Picture:</strong> A high-quality
                              image.
                            </li>
                            <li>
                              <strong>Name & Title:</strong> Clear and easy to
                              understand.
                            </li>
                            <li>
                              <strong>Bio Description:</strong> Explicitly
                              states the account's purpose and value.
                            </li>
                            <li>
                              <strong>Links:</strong> The most important link
                              should be at the top if using a multi-link tool.
                            </li>
                          </ul>
                        </div>
                      </CollapsibleSection>

                      <CollapsibleSection title="2. Connect" level={3}>
                        <div className="space-y-3">
                          <p className="text-slate-300 text-sm">
                            This stage focuses on building a relationship with
                            the audience through strategic content and direct
                            engagement.
                          </p>

                          <div className="space-y-2">
                            <p className="text-white font-semibold text-sm">
                              Strategic Posting:
                            </p>
                            <p className="text-slate-300 text-sm">
                              Post when the target audience is most active.
                            </p>
                            <EngagementHeatmap type="instagram" />
                          </div>

                          <div className="space-y-2 mt-4">
                            <p className="text-white font-semibold text-sm">
                              Conversational Engagement:
                            </p>
                            <p className="text-slate-300 text-sm">
                              Directly interacting with users is paramount. As
                              stated in one source, "conversations are the new
                              leads." Responding to every comment manually is
                              ideal, though automation can be used for
                              high-volume inboxes.
                            </p>
                          </div>

                          <div className="space-y-2 mt-4">
                            <p className="text-white font-semibold text-sm">
                              Instagram Strategy:
                            </p>
                            <p className="text-slate-300 text-sm">
                              Instagram is a much faster, more ephemeral feed.
                            </p>

                            <div className="space-y-3 mt-3">
                              <p className="text-white font-semibold text-sm">
                                Ideal Frequency for a SaaS Ambassador:
                              </p>

                              <div className="space-y-2">
                                <p className="text-white font-semibold text-sm">
                                  1. Feed (Reels): 3 to 4 times per week
                                </p>
                                <ul className="space-y-1.5 text-slate-300 text-sm ml-6 list-disc">
                                  <li>
                                    <strong>Why?</strong> You need multiple
                                    "touchpoints." Each Reel is a lottery ticket
                                    for virality.
                                  </li>
                                  <li>
                                    <strong>Note:</strong> 3 excellent Reels are
                                    better than 7 mediocre ones. Hook quality
                                    beats quantity.
                                  </li>
                                </ul>
                              </div>

                              <div className="space-y-2">
                                <p className="text-white font-semibold text-sm">
                                  2. Stories: Daily
                                </p>
                                <ul className="space-y-1.5 text-slate-300 text-sm ml-6 list-disc">
                                  <li>
                                    This is where selling happens (trust). Reels
                                    bring discovery (cold audience), Stories
                                    convert followers (warm audience).
                                  </li>
                                  <li>
                                    It's the only place you can add direct links
                                    (Link Sticker) before reaching 10k
                                    followers.
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CollapsibleSection>

                      <CollapsibleSection title="3. Convert" level={3}>
                        <div className="space-y-3">
                          <p className="text-slate-300 text-sm">
                            After confirming a visitor's interest and connecting
                            with them, the final step is to move them toward a
                            sale or lead capture, primarily through DM
                            automation.
                          </p>
                        </div>
                      </CollapsibleSection>
                    </div>
                  </CollapsibleSection>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                title="Account Health and Optimization"
                level={1}
              >
                <div className="space-y-4">
                  <ul className="space-y-3 text-slate-300 text-sm ml-6 list-disc">
                    <li>
                      <strong>Check Account Status:</strong> Navigate to
                      Settings &gt; Account Status to check for flagged content
                      and modify/delete it.
                    </li>
                    <li>
                      <strong>Enable Profile Suggestions:</strong> Desktop users
                      should check "Show account suggestions on profiles" in
                      settings to be recommended to similar profiles.
                    </li>
                    <li>
                      <strong>Clean Follower Lists:</strong> Periodically remove
                      inactive or bot followers for smaller accounts to improve
                      engagement.
                    </li>
                    <li>
                      <strong>Use Saved Replies and FAQs:</strong> Use
                      Instagram's "Saved Replies" and set up "Frequently Asked
                      Questions" for DMs to improve customer service.
                    </li>
                  </ul>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="The Anatomy of a Viral Reel" level={1}>
                <div className="space-y-6">
                  <p className="text-slate-300 text-sm">
                    On LinkedIn, a post is <em>read</em>. On Instagram, a Reel
                    is <em>felt</em>.
                  </p>
                  <p className="text-slate-300 text-sm">
                    If a Reel is meant to generate cash (commissions), it
                    doesn't just need to look good. It must follow a precise
                    equation:
                  </p>
                  <p className="text-white font-semibold text-base">
                    The Viral Equation = (Pain + Magic + Trend) × Utility
                  </p>
                  <p className="text-slate-300 text-sm">
                    Here's how to translate the 4 Naano pillars into Reel
                    language:
                  </p>

                  {/* 1. The Pain Point */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-white">
                      1. The Pain Point (The 0–3 Second Hook)
                    </h5>
                    <p className="text-slate-300 text-sm">
                      On LinkedIn, you explain the problem with text. On
                      Instagram, you <em>show it or hit it hard</em>.
                    </p>
                    <p className="text-slate-300 text-sm">
                      Your goal is to trigger an{" "}
                      <em>instant feeling of frustration</em>.
                    </p>
                    <div className="space-y-2 mt-3">
                      <p className="text-white font-semibold text-sm">
                        • Mistake to avoid:
                      </p>
                      <p className="text-slate-300 text-sm ml-4">
                        Starting with "Hi, today I'm going to show you..." (The
                        viewer has already scrolled.)
                      </p>
                    </div>
                    <div className="space-y-2 mt-3">
                      <p className="text-white font-semibold text-sm">
                        • The Naano method:
                      </p>
                      <ul className="space-y-1.5 text-slate-300 text-sm ml-6 list-disc">
                        <li>
                          <strong>Text Overlay (on the video):</strong> A punchy
                          sentence appearing on the very first frame.
                        </li>
                        <li>
                          <strong>Examples:</strong>
                          <ul className="space-y-1 ml-4 mt-1 list-none">
                            <li>
                              ■ "Are you still paying €2,000 for a website?"
                            </li>
                            <li>
                              ■ "Stop building Excel spreadsheets by hand."
                            </li>
                          </ul>
                        </li>
                        <li>
                          <strong>Visual:</strong> Show the "before" situation
                          (chaos, slowness) or someone stressed in front of
                          their screen.
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* 2. The Impactful Visual */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-white">
                      2. The Impactful Visual (The "Magic Demo")
                    </h5>
                    <p className="text-slate-300 text-sm">
                      This is where SaaS shines.
                    </p>
                    <p className="text-slate-300 text-sm">
                      The visual is what stops the scroll.
                    </p>
                    <p className="text-slate-300 text-sm">
                      On Instagram, nobody wants static screenshots.
                    </p>
                    <p className="text-slate-300 text-sm">
                      People want to see the tool in action.
                    </p>
                    <div className="space-y-2 mt-3">
                      <p className="text-white font-semibold text-sm">
                        The winning format: The Speed-Run
                      </p>
                      <ul className="space-y-1.5 text-slate-300 text-sm ml-6 list-disc">
                        <li>Record your screen while using the tool</li>
                        <li>Speed up the video (x2 or x4)</li>
                        <li>
                          Show the full flow: Prompt → Final result in 5 seconds
                        </li>
                        <li>Desired effect: "This feels like magic."</li>
                      </ul>
                      <p className="text-slate-300 text-sm mt-2 italic">
                        The viewer should think: "Wait... what? It's really that
                        simple?"
                      </p>
                    </div>
                  </div>

                  {/* 3. Riding the Trend */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-white">
                      3. Riding the Trend (Audio & Editing)
                    </h5>
                    <p className="text-slate-300 text-sm">
                      Great content with the wrong audio will die at 200 views.
                    </p>
                    <p className="text-slate-300 text-sm">
                      Posts perform 10x better when they ride an existing wave.
                    </p>
                    <div className="space-y-2 mt-3">
                      <p className="text-white font-semibold text-sm">
                        • Audio:
                      </p>
                      <p className="text-slate-300 text-sm ml-4">
                        Use trending music (upward arrow on Instagram) or viral
                        Business/Tech sounds (ASMR, synthwave, dynamic
                        voiceovers).
                      </p>
                    </div>
                    <div className="space-y-2 mt-3">
                      <p className="text-white font-semibold text-sm">
                        • Editing format:
                      </p>
                      <ul className="space-y-1.5 text-slate-300 text-sm ml-6 list-disc">
                        <li>Copy structures that already work.</li>
                        <li>If everyone is doing "POV" videos, do:</li>
                        <li className="ml-4">"POV: I use this SaaS to..."</li>
                      </ul>
                    </div>
                  </div>

                  {/* 4. Utility */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-white">
                      4. Utility (The Caption as a Lead Magnet)
                    </h5>
                    <p className="text-slate-300 text-sm">
                      This is the pillar that makes money. The Reel grabs
                      attention — the free offer triggers action.
                    </p>
                    <div className="space-y-2 mt-3">
                      <p className="text-white font-semibold text-sm">
                        • The principle:
                      </p>
                      <p className="text-slate-300 text-sm ml-4">
                        Don't sell the tool directly. Offer something that
                        requires the tool.
                      </p>
                    </div>
                    <div className="space-y-2 mt-3">
                      <p className="text-white font-semibold text-sm">
                        • Concrete examples:
                      </p>
                      <ul className="space-y-1.5 text-slate-300 text-sm ml-6 list-disc">
                        <li>
                          "I built a full template to automate this. Comment
                          'TEMPLATE' and I'll send it."
                        </li>
                        <li>
                          "The 5 prompts I used in this video? Link in bio."
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-2 mt-3">
                      <p className="text-white font-semibold text-sm">
                        • Why it works:
                      </p>
                      <p className="text-slate-300 text-sm ml-4">
                        It turns a passive viewer into an engaged prospect.
                      </p>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title='TEMPLATE "plug & play"' level={1}>
                <div className="space-y-4">
                  <ul className="space-y-3 text-slate-300 text-sm ml-6 list-disc">
                    <li>
                      <strong>0:00-0:03 (Hook):</strong> Visual of you on
                      camera. Text: "How I save 5 hours a week on prospecting
                      (without an assistant)."
                    </li>
                    <li>
                      <strong>0:03-0:10 (Magic Demo):</strong> Accelerated
                      screen recording of the SaaS automatically finding and
                      qualifying 50 leads. Dynamic music.
                    </li>
                    <li>
                      <strong>0:10-0:12 (Result):</strong> Zoom on the final
                      output (the ready-to-use lead list).
                    </li>
                    <li>
                      <strong>0:12-0:15 (CTA):</strong> You facing the camera,
                      pointing downward. Text: "The tool + my free outreach
                      script 👇 in the description."
                    </li>
                  </ul>
                </div>
              </CollapsibleSection>
            </div>
          </CollapsibleSection>
        </div>
      </CollapsibleSection>

      {/* Footer */}
      <div className="text-center pt-8 mt-12 border-t border-white/5">
        <p className="text-slate-400 text-sm">
          💡 {t("readyToLaunch")}
        </p>
      </div>
    </div>
  );
}
