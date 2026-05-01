import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface TelemetryItem {
  label: string;
  value: string | number;
  color?: 'default' | 'aqua' | 'purple' | 'mint';
}

interface TelemetrySidebarProps {
  title?: string;
  data: TelemetryItem[];
}

const TelemetrySidebar: React.FC<TelemetrySidebarProps> = ({ 
  title = "Algorithm Telemetry", 
  data 
}) => {
  const colors = {
    default: "text-white",
    aqua: "text-neon-aqua",
    purple: "text-cyber-purple",
    mint: "text-mint-valid",
  };

  return (
    <motion.aside 
      className="w-72 bg-white/5 backdrop-blur-xl border-l border-white/5 flex flex-col p-6 h-full shadow-2xl"
      initial={{ x: 288 }}
      animate={{ x: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
    >
      <div className="flex items-center gap-2 mb-8">
        <Activity className="w-4 h-4 text-cyber-purple" />
        <span className="font-space text-xs uppercase tracking-[0.2em] text-cyber-purple font-bold">
          {title}
        </span>
      </div>

      <div className="space-y-8">
        {data.map((item, index) => (
          <div key={index} className="space-y-2">
            <div className="font-space text-[10px] uppercase tracking-widest text-white/30">
              {item.label}
            </div>
            <div className={`font-space text-lg font-medium ${colors[item.color || 'default']}`}>
              {item.value}
            </div>
            <div className="h-[1px] w-full bg-white/5" />
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-4">
        <div className="p-4 rounded-lg bg-white/5 border border-white/5">
          <div className="font-space text-[9px] uppercase tracking-widest text-white/20 mb-2">
            Engine Status
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-mint-valid animate-pulse" />
            <span className="font-space text-[10px] text-white/60 tracking-wider">SYSTEM_READY</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default TelemetrySidebar;
