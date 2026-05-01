import React, { useState } from "react";
import { Home, UserCircle2, Menu, X } from "lucide-react";
import { navItems } from "../data/mockData";
import logo from "../assets/pics/PSL-logo.png";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function TopNav({ activeView, onChange }: { activeView: string, onChange: (view: string) => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b border-lime-300/25 bg-[#182413]/78 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between px-3 py-3 md:px-8 relative">
        
        <motion.button 
          onClick={() => navigate('/')} 
          whileHover={{ scale: 1.05, boxShadow: "0px 0px 25px rgba(52, 211, 153, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          className="relative group mr-4 lg:mr-16 flex h-12 w-12 md:h-16 md:w-16 shrink-0 items-center justify-center rounded-[18px] md:rounded-[24px] border border-emerald-500/30 bg-gradient-to-br from-black/80 to-emerald-950/60 backdrop-blur-xl transition-all duration-500 overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute inset-0 bg-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -inset-[150%] animate-[spin_4s_linear_infinite] bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <Home className="relative z-10 h-5 w-5 md:h-7 md:w-7 text-emerald-100 group-hover:text-white transition-colors duration-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
        </motion.button>

        <div className="mr-auto flex items-center gap-2 md:gap-4 truncate">
          <img src={logo} alt="PSL Logo" className="h-8 w-auto md:h-12 object-contain drop-shadow-lg shrink-0" />
          <p className="bg-gradient-to-r from-emerald-300 via-emerald-200 to-lime-200 bg-clip-text text-xs md:text-sm font-extrabold uppercase tracking-[0.1em] md:tracking-[0.2em] text-transparent drop-shadow-sm lg:text-lg truncate">
            PSL Fantasy League
          </p>
        </div>

        <nav className="hidden flex-1 items-center justify-evenly py-1 px-4 md:flex max-w-[800px]">
          {navItems.map((item) => {
            const active = activeView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onChange(item.key)}
                className={`ui-hover-btn relative rounded-lg px-3 py-2 text-sm font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                  active ? "text-lime-300 text-shadow-glow" : "text-zinc-400 hover:bg-white/5 hover:text-emerald-200"
                }`}
              >
                {item.label}
                {active && <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded bg-gradient-to-r from-emerald-400 to-lime-300 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />}
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 ml-4">
          <button 
            className="ui-hover-btn md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/5 bg-black/30 backdrop-blur-md transition-all duration-300 hover:border-emerald-400/40"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5 text-zinc-300" /> : <Menu className="h-5 w-5 text-zinc-300" />}
          </button>
          
          <button className="ui-hover-btn flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-full border border-white/5 bg-black/30 backdrop-blur-md transition-all duration-300 hover:border-emerald-400/40 hover:bg-emerald-950/40">
            <UserCircle2 className="h-5 w-5 md:h-6 md:w-6 text-zinc-300 transition-colors group-hover:text-emerald-300" />
          </button>
        </div>

      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-lime-300/20 bg-[#0d140e]/95 backdrop-blur-xl absolute w-full left-0 top-[100%] shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-50">
          <div className="flex flex-col p-4 space-y-2">
            {navItems.map((item) => {
              const active = activeView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => { 
                    onChange(item.key); 
                    setMobileMenuOpen(false); 
                  }}
                  className={`w-full rounded-lg px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
                    active 
                      ? "bg-emerald-900/40 text-lime-300 border-l-2 border-lime-400 shadow-[inset_0_0_15px_rgba(52,211,153,0.1)]" 
                      : "text-zinc-400 hover:bg-white/5 hover:text-emerald-200 border-l-2 border-transparent"
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
