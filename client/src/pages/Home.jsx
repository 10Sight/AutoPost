import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  CalendarClock,
  Image,
  TrendingUp,
  Users,
  ShieldCheck,
  Link2,
  PenSquare,
  BarChart3,
} from "lucide-react";
import HomeLayout from "../Layout/HomeLayout";
import { Button } from "../components/ui/button";
import SocialWatermark from "../components/layout/SocialWatermark";
import PlatformHub from "../components/layout/PlatformHub";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Studio",
    description: "Generate on-brand images and video clips with AI, ready to publish in one click.",
  },
  {
    icon: CalendarClock,
    title: "Smart Scheduling",
    description: "Queue posts across every platform and let AutoPost publish at the best time.",
  },
  {
    icon: Image,
    title: "Media Library & Editor",
    description: "Crop, trim, and organize your assets without ever leaving the app.",
  },
  {
    icon: TrendingUp,
    title: "Analytics & Insights",
    description: "Track performance per account and post, all from one dashboard.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite teammates, assign roles, and review content before it goes live.",
  },
  {
    icon: ShieldCheck,
    title: "Policy Rules & Audit Logs",
    description: "Keep every post brand-safe with approval rules and a full audit trail.",
  },
];

const STEPS = [
  {
    icon: Link2,
    title: "Connect your accounts",
    description: "Link your social platforms once, securely, and manage them from a single workspace.",
  },
  {
    icon: PenSquare,
    title: "Create and schedule",
    description: "Draft content solo or with AI assistance, then queue it across every channel.",
  },
  {
    icon: BarChart3,
    title: "Track and optimize",
    description: "Watch performance roll in and refine what works, post over post.",
  },
];

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

const Home = () => {
  return (
    <HomeLayout>
      <section className="relative overflow-hidden">
        <SocialWatermark variant="hero" />
        <div className="relative z-10 mx-auto max-w-5xl px-6 pt-20 pb-24 text-center sm:pt-28 sm:pb-32">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-1.5 text-xs font-medium text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400"
        >
          <Sparkles className="h-3.5 w-3.5 text-blue-600" />
          AI-powered social publishing
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white"
        >
          Post smarter,{" "}
          <span className="text-gradient-primary">not harder.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-500 sm:text-lg dark:text-slate-400"
        >
          AutoPost brings AI content creation, scheduling, and analytics into one workspace —
          so your team ships more, faster, across every platform.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg">
            <Link to="/auth/register">Get started free</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/auth/login">Sign in</Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16"
        >
          <PlatformHub />
        </motion.div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-24 scroll-mt-24">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Everything you need to run social, in one place
          </h2>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
            From first draft to published post, AutoPost keeps your workflow in sync.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              {...fadeUp}
              transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
              className="pro-card rounded-2xl p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                <feature.icon className="h-5.5 w-5.5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="mx-auto max-w-6xl px-6 pb-24 scroll-mt-24">
        <motion.div {...fadeUp} transition={{ duration: 0.5 }} className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            How it works
          </h2>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400">
            Three steps from idea to published post.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.title}
              {...fadeUp}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative rounded-2xl border border-slate-200 bg-white/60 p-6 dark:border-slate-800 dark:bg-slate-900/40"
            >
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="mt-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <step.icon className="h-5.5 w-5.5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-28">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-primary px-8 py-14 text-center shadow-xl shadow-blue-500/10 sm:px-16"
        >
          <SocialWatermark variant="cta" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to simplify your social workflow?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/80 sm:text-base">
              Create your free account in seconds and start publishing smarter.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary">
                <Link to="/auth/register">Get started free</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/auth/login">Sign in</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </section>
    </HomeLayout>
  );
};

export default Home;
