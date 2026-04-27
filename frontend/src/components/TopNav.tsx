import { useState } from "react";
import { Home, Menu, X, Shield, Activity } from "lucide-react";
import { navItems } from "../data/mockData";
import logo from "../assets/pics/PSL-logo.png";
import { useNavigate } from "react-router-dom";

export default function TopNav({ activeView, onChange }: { activeView: string, onChange: (view: string) => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#030408]/80 backdrop-blur-3xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-3 py-4 md:px-8 relative">
        
        {/* Tactical Home Shortcut */}
        <button 
          onClick={() => navigate('/')} 
          className="ui-hover-btn mr-4 lg:mr-10 flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 group"
        >
          <Home className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-emerald-400" />
        </button>

        {/* Brand & HUD Status */}
        <div className="mr-auto flex items-center gap-4 truncate">
          <img 
            src={logo} 
            alt="PSL Logo" 
            className="h-10 w-auto md:h-14 object-contain filter grayscale invert brightness-200 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] shrink-0" 
          />
          <div className="hidden sm:flex flex-col">
            <p className="text-white text-sm md:text-xl font-black uppercase italic tracking-tighter leading-none">
              PSL <span className="text-emerald-500">FANTASY</span>
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[8px] font-mono font-black text-white/20 uppercase tracking-[0.4em]">Global Data Grid Active</p>
            </div>
          </div>
        </div>

        {/* Central Tactical Nav */}
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex max-w-[600px]">
          {navItems.map((item) => {
            const active = activeView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onChange(item.key)}
                className={`ui-hover-btn relative rounded-full px-5 py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                  active ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20" : "text-zinc-500 hover:text-white hover:bg-white/5"
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Utility HUD */}
        <div className="flex shrink-0 items-center gap-3 ml-4">
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 rounded-xl bg-white/5 border border-white/5 mr-2">
            <Activity className="w-4 h-4 text-emerald-500/50" />
            <div className="flex flex-col">
              <span className="text-[8px] font-mono text-zinc-500 leading-none">SYSTEM LOAD</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold leading-none mt-0.5">1.2ms</span>
            </div>
          </div>

          <button 
            className="ui-hover-btn md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/40"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-zinc-300" /> : <Menu className="h-5 w-5 text-zinc-300" />}
          </button>
          
          <button className="ui-hover-btn flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 backdrop-blur-md transition-all duration-300 hover:border-emerald-500/40 hover:bg-emerald-500/10 group">
            <Shield className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-emerald-400" />
          </button>
        </div>

      </div>

      {/* Mobile Tactical Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-[#030408]/95 backdrop-blur-3xl absolute w-full left-0 top-[100%] shadow-2xl z-50">
          <div className="flex flex-col p-4 space-y-1">
            {navItems.map((item) => {
              const active = activeView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => { 
                    onChange(item.key); 
                    setMobileMenuOpen(false); 
                  }}
                  className={`w-full rounded-xl px-4 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${
                    active 
                      ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500" 
                      : "text-zinc-500 hover:bg-white/5 hover:text-white border-l-2 border-transparent"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
