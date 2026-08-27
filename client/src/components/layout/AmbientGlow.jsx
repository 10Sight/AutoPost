import React from "react";

const AmbientGlow = () => (
  <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
    <div className="absolute -top-40 left-[8%] h-[30rem] w-[30rem] rounded-full bg-[var(--primary)]/20 blur-[120px] will-change-transform dark:bg-[var(--primary)]/12" />
    <div className="absolute top-1/4 -right-24 h-[26rem] w-[26rem] rounded-full bg-[var(--accent)]/20 blur-[120px] will-change-transform animate-float dark:bg-[var(--accent)]/12" />
    <div className="absolute bottom-[-10%] left-1/3 h-[24rem] w-[24rem] rounded-full bg-[var(--primary)]/10 blur-[130px] will-change-transform animate-float-delayed" />
  </div>
);

export default AmbientGlow;
