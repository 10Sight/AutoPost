import React, { useEffect, useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTheme } from "next-themes";
import { Switch as SwitchPrimitive } from "radix-ui";
import { cn } from "../../lib/utils";

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const RAY_INNER = 8;
const RAY_OUTER = 10.5;
const CENTER = 12;

const TRACK_W = 52;
const TRACK_H = 28;
const KNOB = 22;
const PAD = 3;
const TRAVEL = TRACK_W - KNOB - PAD * 2;

const rayPoints = (angleDeg) => {
  const rad = (angleDeg * Math.PI) / 180;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);
  return {
    x1: CENTER + RAY_INNER * sin,
    y1: CENTER - RAY_INNER * cos,
    x2: CENTER + RAY_OUTER * sin,
    y2: CENTER - RAY_OUTER * cos,
  };
};

const STARS = [
  { cx: 5.5, cy: 6, r: 0.6 },
  { cx: 7, cy: 17, r: 0.45 },
];

const SunMoonIcon = ({ isDark, size, reduceMotion, maskId }) => {
  const spring = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 180, damping: 22 };
  const fade = (delay = 0) =>
    reduceMotion ? { duration: 0 } : { duration: 0.25, delay };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0"
    >
      <mask id={maskId}>
        <rect x="0" y="0" width="24" height="24" fill="white" />
        <motion.circle
          r={7}
          fill="black"
          initial={{ cx: isDark ? 17 : 30, cy: isDark ? 7 : 30 }}
          animate={{ cx: isDark ? 17 : 30, cy: isDark ? 7 : 30 }}
          transition={spring}
        />
      </mask>

      {STARS.map((star, i) => (
        <motion.circle
          key={i}
          cx={star.cx}
          cy={star.cy}
          r={star.r}
          fill="currentColor"
          className="text-slate-300"
          animate={{ opacity: isDark ? 1 : 0 }}
          transition={fade(isDark ? 0.15 + i * 0.05 : 0)}
        />
      ))}

      {RAY_ANGLES.map((angle, i) => {
        const { x1, y1, x2, y2 } = rayPoints(angle);
        return (
          <motion.line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="currentColor"
            className="text-amber-500"
            strokeWidth={1.6}
            strokeLinecap="round"
            style={{ transformOrigin: `${x1}px ${y1}px` }}
            animate={{
              opacity: isDark ? 0 : 1,
              scale: isDark ? 0.3 : 1,
            }}
            transition={fade(isDark ? i * 0.02 : 0.15 + i * 0.02)}
          />
        );
      })}

      <motion.circle
        cx={CENTER}
        cy={CENTER}
        r={6}
        mask={`url(#${maskId})`}
        animate={{ fill: isDark ? "#e2e8f0" : "#fbbf24" }}
        transition={reduceMotion ? { duration: 0 } : { duration: 0.35 }}
      />
    </svg>
  );
};

export const ThemeToggle = ({ className, showLabel = false, iconSize = 26 }) => {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const rawId = useId().replace(/:/g, "");
  const maskId = `theme-toggle-eclipse-${rawId}`;

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  const track = (
    <SwitchPrimitive.Root
      checked={isDark}
      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      disabled={!mounted}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-300 outline-none",
        "focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
        "data-[state=unchecked]:border-amber-200 data-[state=unchecked]:bg-gradient-to-r data-[state=unchecked]:from-sky-100 data-[state=unchecked]:to-amber-100",
        "data-[state=checked]:border-slate-700 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-slate-900 data-[state=checked]:to-indigo-950",
        !showLabel && className
      )}
      style={{ width: TRACK_W, height: TRACK_H }}
    >
      <SwitchPrimitive.Thumb
        className="pointer-events-none flex items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform duration-300 ease-out will-change-transform"
        style={{
          width: KNOB,
          height: KNOB,
          transform: `translateX(${isDark ? PAD + TRAVEL : PAD}px)`,
        }}
      >
        <SunMoonIcon isDark={isDark} size={iconSize} reduceMotion={reduceMotion} maskId={maskId} />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );

  if (!showLabel) return track;

  return (
    <div className={cn("inline-flex items-center gap-3", className)}>
      <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 select-none">
        Dark mode
      </span>
      {track}
    </div>
  );
};

export default ThemeToggle;
