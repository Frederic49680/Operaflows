import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 group">
      <div className="relative">
        <div className="h-12 w-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 transform group-hover:scale-105">
          {/* Icône SVG inline */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-sm"
          >
            <defs>
              <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: "#ffffff", stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: "#e0f2fe", stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="36" height="36" rx="8" fill="url(#logoGradient)" />
            <path
              d="M20 10 C14 10, 10 14, 10 20 C10 26, 14 30, 20 30 C26 30, 30 26, 30 20 C30 14, 26 10, 20 10 Z"
              fill="#0EA5E9"
              opacity="0.9"
            />
            <path
              d="M15 20 L20 15 L25 20 L20 25 Z"
              fill="white"
              opacity="0.4"
            />
            <circle cx="20" cy="20" r="4" fill="white" opacity="0.6" />
            <circle cx="12" cy="16" r="1.5" fill="white" opacity="0.9" />
            <circle cx="28" cy="16" r="1.5" fill="white" opacity="0.9" />
            <circle cx="12" cy="24" r="1.5" fill="white" opacity="0.9" />
            <circle cx="28" cy="24" r="1.5" fill="white" opacity="0.9" />
          </svg>
        </div>
        {/* Effet de brillance au survol */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent group-hover:from-primary-dark group-hover:to-primary transition-all duration-300">
          OperaFlow
        </span>
        <span className="text-[10px] text-gray-500 font-medium -mt-1">
          Planification & Pilotage
        </span>
      </div>
    </Link>
  );
}

