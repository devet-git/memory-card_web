import React from "react";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function MemCardLogo({ size = 38, showText = true, className }: LogoProps) {
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        userSelect: "none",
        cursor: "pointer"
      }}
    >
      {/* Cartoon Flashcard with Lightbulb Mascot SVG */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Background sparkles */}
        <path d="M42 38L45 28L48 38L58 41L48 44L45 54L42 44L32 41L42 38Z" fill="#38bdf8" />
        <path d="M165 32L167 25L169 32L176 34L169 36L167 43L165 36L158 34L165 32Z" fill="#f59e0b" />
        <path d="M38 108L40 102L42 108L48 110L42 112L40 118L38 112L32 110L38 108Z" fill="#f43f5e" />
        <path d="M168 95L170 89L172 95L178 97L172 99L170 105L168 99L162 97L168 95Z" fill="#fb923c" />

        {/* Back Card 1 - Dark/Navy Blue (Far Left) */}
        <rect
          x="34"
          y="68"
          width="76"
          height="100"
          rx="12"
          transform="rotate(-28 34 68)"
          fill="#1e3a8a"
          stroke="#0f172a"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Back Card 2 - Sky Blue */}
        <rect
          x="50"
          y="52"
          width="76"
          height="100"
          rx="12"
          transform="rotate(-16 50 52)"
          fill="#0284c7"
          stroke="#0f172a"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Back Card 3 - Yellow (Center Left) */}
        <rect
          x="68"
          y="42"
          width="76"
          height="100"
          rx="12"
          transform="rotate(-4 68 42)"
          fill="#fbbf24"
          stroke="#0f172a"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Back Card 4 - Dark Blue Base */}
        <rect
          x="82"
          y="44"
          width="76"
          height="100"
          rx="12"
          transform="rotate(10 82 44)"
          fill="#2563eb"
          stroke="#0f172a"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Back Card 5 - Coral Pink (Far Right) */}
        <rect
          x="94"
          y="54"
          width="74"
          height="98"
          rx="12"
          transform="rotate(22 94 54)"
          fill="#f43f5e"
          stroke="#0f172a"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* MAIN CHARACTER CARD (Center Front) */}
        <g>
          {/* Main Card Body */}
          <rect
            x="58"
            y="38"
            width="84"
            height="116"
            rx="14"
            fill="#ffffff"
            stroke="#0f172a"
            strokeWidth="7"
            strokeLinejoin="round"
          />

          {/* Dog-ear fold on top right of the card */}
          <path
            d="M126 38L142 54H130C127.8 54 126 52.2 126 50V38Z"
            fill="#e2e8f0"
            stroke="#0f172a"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* LIGHTBULB CHARACTER WITH STAR ON HEAD */}
          {/* Bulb base */}
          <rect x="91" y="80" width="18" height="9" rx="3" fill="#0284c7" stroke="#0f172a" strokeWidth="4" />
          <line x1="93" y1="84" x2="107" y2="84" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

          {/* Lightbulb glass head */}
          <path
            d="M87 68C83.5 61.5 86 52 93 47C100 42 110 43 115 50C119 55.5 117 64 113 69C110 73 110 76 109 80H91C90 76 90 72 87 68Z"
            fill="#fbbf24"
            stroke="#0f172a"
            strokeWidth="5"
            strokeLinejoin="round"
          />

          {/* Star inside lightbulb */}
          <path
            d="M100 52L102.5 58L108.5 58.5L104 62.5L105.5 68.5L100 65L94.5 68.5L96 62.5L91.5 58.5L97.5 58L100 52Z"
            fill="#f59e0b"
            stroke="#0f172a"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />

          {/* Light rays around bulb */}
          <line x1="80" y1="52" x2="74" y2="48" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          <line x1="100" y1="36" x2="100" y2="30" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
          <line x1="120" y1="52" x2="126" y2="48" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />

          {/* Character Eyes */}
          <circle cx="86" cy="104" r="6" fill="#0f172a" />
          <circle cx="84" cy="102" r="2" fill="#ffffff" />

          <circle cx="114" cy="104" r="6" fill="#0f172a" />
          <circle cx="112" cy="102" r="2" fill="#ffffff" />

          {/* Cheerful Smile */}
          <path
            d="M92 112C92 117 96 122 100 122C104 122 108 117 108 112H92Z"
            fill="#f43f5e"
            stroke="#0f172a"
            strokeWidth="4"
            strokeLinejoin="round"
          />

          {/* Blue Shadow/Floor Glow inside card */}
          <path d="M66 142C80 148 120 148 134 142" stroke="#bae6fd" strokeWidth="5" strokeLinecap="round" />
        </g>
      </svg>

      {/* Styled Wordmark text "MemCard" */}
      {showText && (
        <span
          style={{
            fontFamily: "var(--font-heading, inherit)",
            fontWeight: 800,
            fontSize: `${Math.round(size * 0.6)}px`,
            letterSpacing: "-0.03em",
            display: "inline-flex",
            alignItems: "center"
          }}
        >
          <span style={{ color: "#0284c7" }}>Mem</span>
          <span style={{ color: "#ea580c" }}>Card</span>
        </span>
      )}
    </div>
  );
}
