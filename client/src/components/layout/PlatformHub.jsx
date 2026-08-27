import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { SOCIAL_ICONS } from "../../lib/socialIcons";

const PLATFORMS = SOCIAL_ICONS;

// Evenly spaced column centers (in %) for a 5-column grid: (i + 0.5) / 5 * 100.
const NODE_X = [10, 30, 50, 70, 90];
const BUS_Y = 60;

const PlatformHub = () => {
    return (
        <div
            role="img"
            aria-label="10Sight AutoPost automatically publishing to Facebook, Instagram, X, LinkedIn and YouTube"
            className="relative mx-auto w-full max-w-[480px]"
        >
            {/* Row of platform leaves - equal columns, equal distance */}
            <div className="relative z-10 grid grid-cols-5">
                {PLATFORMS.map((platform, index) => (
                    <motion.div
                        key={platform.key}
                        className="flex flex-col items-center gap-1.5"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.15 + index * 0.1, type: "spring", stiffness: 260, damping: 18 }}
                    >
                        <div className="group relative flex flex-col items-center">
                            <div
                                className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2.5 shadow-lg ring-1 ring-slate-100 transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-110 sm:h-14 sm:w-14 sm:p-3 dark:ring-slate-800"
                                style={{ boxShadow: `0 10px 22px -10px ${platform.color}66` }}
                            >
                                <img src={platform.icon} alt={platform.name} className="h-full w-full object-contain" />
                                <span
                                    className="absolute -right-1 -top-1 h-2.5 w-2.5 animate-pulse rounded-full border-2 border-[#f7f8ff] dark:border-slate-900"
                                    style={{ background: platform.color }}
                                />
                                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 scale-95 whitespace-nowrap rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:scale-100 group-hover:opacity-100 dark:bg-white dark:text-slate-900">
                                    {platform.status}
                                </span>
                            </div>
                            <span className="mt-1.5 text-[10px] font-semibold text-slate-500 sm:text-[11px] dark:text-slate-400">
                                {platform.name}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Trunk + branches connecting the row down to the root */}
            <svg className="block h-10 w-full sm:h-12" viewBox="0 0 100 100" preserveAspectRatio="none">
                {NODE_X.map((x, index) => (
                    <motion.path
                        key={PLATFORMS[index].key}
                        d={`M ${x} 0 L ${x} ${BUS_Y}`}
                        fill="none"
                        stroke={PLATFORMS[index].color}
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        transition={{ delay: 0.3 + index * 0.08, duration: 0.5 }}
                        style={{
                            strokeDasharray: "5 5",
                            animation: "dash-flow 1.6s linear infinite",
                            animationDelay: `${index * 0.15}s`,
                            filter: `drop-shadow(0 0 2px ${PLATFORMS[index].color}90)`,
                        }}
                    />
                ))}
                <motion.path
                    d={`M 10 ${BUS_Y} L 90 ${BUS_Y}`}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    style={{ strokeDasharray: "5 5", animation: "dash-flow 1.6s linear infinite", animationDelay: "0.6s" }}
                />
                <motion.path
                    d={`M 50 ${BUS_Y} L 50 100`}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                    style={{ strokeDasharray: "5 5", animation: "dash-flow 1.6s linear infinite", animationDelay: "0.75s" }}
                />
            </svg>

            {/* Root */}
            <motion.div
                className="relative z-10 flex justify-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.85, type: "spring", stiffness: 240, damping: 16 }}
            >
                <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative"
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] opacity-40 blur-lg" />
                    <div className="relative flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-4 py-2 text-white shadow-xl shadow-blue-600/30 ring-4 ring-[#f7f8ff] sm:px-5 sm:py-2.5 dark:ring-slate-900">
                        <Sparkles className="h-4 w-4 shrink-0" strokeWidth={2.4} />
                        <span className="whitespace-nowrap text-xs font-bold tracking-tight sm:text-sm">10Sight AutoPost</span>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default PlatformHub;
