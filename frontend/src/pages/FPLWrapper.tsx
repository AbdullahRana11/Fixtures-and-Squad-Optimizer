import { useState, Component, ErrorInfo, ReactNode } from "react";
import TopNav from "../components/TopNav";
import FantasyDashboard from "./FantasyDashboard";
import Marketplace from "./Marketplace";
import FPLOptimizer from "./FPLOptimizer";
import Stats from "./Stats";
import { AlertCircle } from "lucide-react";

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
        <div className="flex h-screen w-full items-center justify-center bg-void p-8 font-open">
          <div className="max-w-xl w-full p-12 rounded-xl border border-zinc-800 bg-zinc-900/50 text-center shadow-lg">
             <AlertCircle className="w-16 h-16 text-rose-600 mx-auto mb-6" />
             <h1 className="text-2xl font-merriweather font-bold text-white mb-4">Application Error</h1>
             <p className="text-zinc-400 mb-8">
               An unexpected error occurred while loading this module.<br/>
               <span className="text-rose-400 mt-2 block font-mono text-sm">{this.state.error?.message}</span>
             </p>
             <button 
               onClick={() => window.location.reload()} 
               className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold rounded-lg transition-colors duration-200"
             >
               Reload Application
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
      <div className="min-h-screen relative overflow-hidden bg-void">
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
