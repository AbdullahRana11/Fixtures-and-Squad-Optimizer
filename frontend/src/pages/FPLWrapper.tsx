import React, { useMemo, useState } from "react";
import TopNav from "../components/TopNav";
import FantasyDashboard from "./FantasyDashboard";
import Marketplace from "./Marketplace";
import FPLOptimizer from "./FPLOptimizer";
import Stats from "./Stats";

export default function FPLWrapper() {
  const [activeView, setActiveView] = useState("team"); // Default to Team (Optimizer)

  const view = useMemo(() => {
    switch (activeView) {
      case "fantasy":
        return <FantasyDashboard />;
      case "marketplace":
        return <Marketplace />;
      case "stats":
        return <Stats />;
      case "team":
      default:
        return <FPLOptimizer />;
    }
  }, [activeView]);

  return (
    <div className="min-h-screen">
      <TopNav activeView={activeView} onChange={setActiveView} />
      <main className="mx-auto w-full px-4 py-8 max-w-[2000px] md:px-12 xl:px-20">
        {view}
      </main>
    </div>
  );
}
