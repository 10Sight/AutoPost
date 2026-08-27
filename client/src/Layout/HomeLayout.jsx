import React from "react";
import ErrorBoundary from "../components/ErrorBoundary";
import AmbientGlow from "../components/layout/AmbientGlow";
import HomeNavbar from "../components/layout/HomeNavbar";
import HomeFooter from "../components/layout/HomeFooter";

const HomeLayout = ({ children }) => {
  return (
    <ErrorBoundary>
      <div className="relative flex min-h-screen flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
        <AmbientGlow />
        <HomeNavbar />
        <main className="flex-1">{children}</main>
        <HomeFooter />
      </div>
    </ErrorBoundary>
  );
};

export default HomeLayout;
