import React, { useState } from 'react';

interface PunjabLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const PunjabLogo: React.FC<PunjabLogoProps> = ({
  className = '',
  size = 'md',
  showText = false,
}) => {
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  // Official logo image URLs (direct from Wikimedia Commons official Coat of Arms of Punjab, Pakistan)
  const officialLogoUrl =
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Coat_of_arms_of_Punjab.svg/480px-Coat_of_arms_of_Punjab.svg.png';

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
            src={officialLogoUrl}
            alt="Government of the Punjab Official Emblem"
            className="w-full h-full object-contain p-0.5"
            onError={() => setImageFailed(true)}
            loading="eager"
          />
        ) : (
          /* High-Fidelity Vector SVG representation of the official Government of Punjab seal */
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full text-emerald-800"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Circular Ring with decorative teeth */}
            <circle cx="50" cy="50" r="48" fill="#065F46" />
            <circle cx="50" cy="50" r="44" fill="#ffffff" />
            <circle cx="50" cy="50" r="41" fill="#065F46" />

            {/* Inner Field */}
            <circle cx="50" cy="50" r="38" fill="#f0fdf4" stroke="#047857" strokeWidth="1" />

            {/* Five Rivers (Punjab - Land of Five Waters) */}
            <path
              d="M20 58 Q 35 52 50 58 T 80 58"
              fill="none"
              stroke="#047857"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M22 64 Q 35 58 50 64 T 78 64"
              fill="none"
              stroke="#047857"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M26 70 Q 38 64 50 70 T 74 70"
              fill="none"
              stroke="#047857"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Crescent and Star */}
            <path
              d="M 52 28 A 9 9 0 1 1 45 42 A 11 11 0 1 0 52 28 Z"
              fill="#065F46"
            />
            <polygon
              points="55,27 57,32 62,32 58,35 60,40 55,37 50,40 52,35 48,32 53,32"
              fill="#065F46"
              transform="scale(0.8) translate(14, 2)"
            />

            {/* Wheat stalks on rim */}
            <path
              d="M 16 50 C 16 32 30 18 45 16 C 35 22 24 35 24 50 Z"
              fill="#047857"
            />
            <path
              d="M 84 50 C 84 32 70 18 55 16 C 65 22 76 35 76 50 Z"
              fill="#047857"
            />

            {/* Official Scroll Banner at base: حکومت پنجاب */}
            <path
              d="M 22 78 Q 50 72 78 78 L 74 86 Q 50 80 26 86 Z"
              fill="#065F46"
            />
            <text
              x="50"
              y="84"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="6"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              حکومت پنجاب
            </text>
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 leading-tight">
            Government of the Punjab
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            Commercial Audit Department
          </span>
        </div>
      )}
    </div>
  );
};
