import React from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import SocialWatermark from "./SocialWatermark";
import { SOCIAL_ICONS } from "../../lib/socialIcons";

const FOOTER_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
];

const HomeFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-slate-200/60 bg-white/60 backdrop-blur-md dark:border-slate-800/60 dark:bg-slate-950/60">
      <SocialWatermark variant="footer" />
      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-10 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-lg shadow-blue-500/20">
              <Sparkles className="h-4 w-4 text-white" />
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              AutoPost
            </span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Plan, schedule, and publish content across all your platforms in one place.
          </p>
        </div>

        <div className="flex gap-16">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Product</h3>
            <ul className="mt-3 space-y-2.5">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Account</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link
                  to="/auth/login"
                  className="text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Sign in
                </Link>
              </li>
              <li>
                <Link
                  to="/auth/register"
                  className="text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Create account
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-slate-200/60 px-6 py-6 dark:border-slate-800/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            &copy; {year} 10Sight Technologies. All rights reserved.
          </p>
          <div className="flex items-center gap-3" aria-hidden="true">
            {SOCIAL_ICONS.map((platform) => (
              <span key={platform.key} title={platform.name} className="group grid h-7 w-7 place-items-center rounded-full transition-transform duration-200 hover:scale-110">
                <img
                  src={platform.icon}
                  alt=""
                  className="h-4 w-4 object-contain opacity-50 grayscale transition-all duration-200 group-hover:opacity-100 group-hover:grayscale-0"
                />
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default HomeFooter;
