import React from 'react';

const McmvBadge = ({ customLogoUrl, className = "h-8" }: { customLogoUrl?: string; className?: string }) => {
  if (customLogoUrl) {
    return (
      <img 
        src={customLogoUrl} 
        alt="Selo Minha Casa Minha Vida" 
        className={`object-contain shrink-0 ${className}`} 
        style={{ width: "105px", height: "52px" }}
      />
    );
  }
  
  return (
    <div className={`inline-flex items-center gap-2 bg-white border border-zinc-200 shadow-sm px-3 py-1.5 rounded-lg shrink-0 select-none ${className}`}>
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,4 3,12 6,12 6,21 18,21 18,12 21,12" fill="#004797" />
        <polygon points="12,4 3,12 12,12" fill="#0D9F4F" />
        <polygon points="12,4 21,12 12,12" fill="#FFCC00" />
        <rect x="10.5" y="15" width="3" height="6" fill="#FFFFFF" />
      </svg>
      <div className="flex flex-col leading-[1.1] text-[8.5px] font-black tracking-tight uppercase select-none text-left font-sans">
        <span className="text-emerald-600 font-extrabold">Minha Casa</span>
        <span className="text-blue-700 font-extrabold">Minha Vida</span>
      </div>
    </div>
  );
};

export default McmvBadge;
