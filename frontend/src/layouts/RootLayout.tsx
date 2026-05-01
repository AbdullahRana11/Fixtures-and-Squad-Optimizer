import React from 'react';


interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full bg-void selection:bg-zinc-700 selection:text-white">
      {/* Global Texture Overlay for subtle organic feel */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10 bg-[url('/global_bg.png')] bg-cover bg-center mix-blend-luminosity" />
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-overlay bg-[url('/noise.svg')]" />

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default RootLayout;
