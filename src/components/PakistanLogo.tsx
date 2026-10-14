import React, { useState } from 'react';

interface PunjabLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const PakistanLogo: React.FC<PakistanLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  // Official logo image URL requested by user
  const logoUrl = 'https://i.ibb.co/BJ7vRPG/download-1.png';
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  const sizeClasses = {
    sm: 'w-7 h-7 min-w-[28px]',
    md: 'w-9 h-9 min-w-[36px]',
    lg: 'w-12 h-12 min-w-[48px]',
    xl: 'w-16 h-16 min-w-[64px]',
  };

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        className={`${sizeClasses[size]} relative rounded-full flex items-center justify-center shrink-0 overflow-hidden bg-white shadow-xs border border-emerald-700/30`}
      >
        {!imageFailed ? (
          <img
            src={logoUrl}
            alt="Government of Pakistan Official Emblem"
            className="w-full h-full object-contain p-0.5"
            onError={() => setImageFailed(true)}
            loading="eager"
          />
        ) : (
          /* Simplified representation if image fails */
          <div className="w-full h-full bg-emerald-800 flex items-center justify-center text-white text-[8px] font-bold">PAK</div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 leading-tight">
            Government of Pakistan
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Commercial Audit Department
          </span>
        </div>
      )}
    </div>
  );
};
