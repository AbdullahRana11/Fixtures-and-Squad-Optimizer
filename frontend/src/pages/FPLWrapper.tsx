import React, { useState, Component, ErrorInfo, ReactNode } from "react";
import TopNav from "../components/TopNav";
import FantasyDashboard from "./FantasyDashboard";
import Marketplace from "./Marketplace";
import FPLOptimizer from "./FPLOptimizer";
import Stats from "./Stats";
import { AlertTriangle } from "lucide-react";

class GlobalErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error("FPL Wrapper Crash:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-[#000000] p-8">
          <div className="max-w-xl w-full p-12 rounded-[40px] border border-red-500/30 bg-red-950/10 backdrop-blur-3xl text-center shadow-4xl">
             <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6 animate-pulse" />
             <h1 className="text-3xl font-black text-white italic uppercase mb-4">SYSTEM BREACH: COMPONENT CRASH</h1>
             <p className="text-zinc-500 font-mono mb-8 opacity-70">
               A runtime exception occurred in the squad management module.<br/>
               <span className="text-red-400 mt-2 block">{this.state.error?.message}</span>
             </p>
             <button 
               onClick={() => window.location.reload()} 
               className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-glow transition-all active:scale-95"
             >
               REBOOT CORE SYSTEM
             </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function FPLWrapper() {
  const [activeView, setActiveView] = useState("team");

  return (
    <GlobalErrorBoundary>
      <div className="min-h-screen relative overflow-hidden">
        <TopNav activeView={activeView} onChange={setActiveView} />
        <main className="mx-auto w-full px-4 py-8 max-w-[2000px] md:px-12 xl:px-20 relative z-10">
          {activeView === "fantasy" && <FantasyDashboard />}
          {activeView === "marketplace" && <Marketplace />}
          {activeView === "stats" && <Stats />}
          {activeView === "team" && <FPLOptimizer />}
        </main>
      </div>
    </GlobalErrorBoundary>
  );
}
