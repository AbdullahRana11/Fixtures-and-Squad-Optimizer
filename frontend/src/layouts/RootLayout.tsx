import React from 'react';

interface RootLayoutProps {
  children: React.ReactNode;
}

const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#090A0F] overflow-hidden">
      {/* Background Ambient Orbs */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#00F260] opacity-15 blur-[120px] mix-blend-screen animate-pulse z-0 pointer-events-none"
      />
      <div 
        className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#B026FF] opacity-15 blur-[150px] mix-blend-screen z-0 pointer-events-none"
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default RootLayout;
