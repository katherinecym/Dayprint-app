"use client";

import React, { useState, useEffect } from "react";

export type DayprintLogoVariant = "shard" | "stamp" | "typo" | "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

interface DayprintLogoProps {
  size?: number;
  className?: string;
  variant?: DayprintLogoVariant;
}

export const IP_VARIANTS_MAP: Record<string, { src: string; nameZh: string; nameEn: string }> = {
  A1: { src: "/logos/dayprint-ip-A1.jpg", nameZh: "印迹小章鱼 A1", nameEn: "Poco Octopus A1" },
  A2: { src: "/logos/dayprint-ip-A2.jpg", nameZh: "印迹小章鱼 A2", nameEn: "Poco Octopus A2" },
  B1: { src: "/logos/dayprint-ip-B1.jpg", nameZh: "时间猫头鹰 B1", nameEn: "Hoo Owl B1" },
  B2: { src: "/logos/dayprint-ip-B2.jpg", nameZh: "时间猫头鹰 B2", nameEn: "Hoo Owl B2" },
  C1: { src: "/logos/dayprint-ip-C1.jpg", nameZh: "手账小幽灵 C1", nameEn: "Sprout Ghost C1" },
  C2: { src: "/logos/dayprint-ip-C2.jpg", nameZh: "手账小幽灵 C2", nameEn: "Sprout Ghost C2" },
};

export function DayprintLogo({
  size = 32,
  className = "",
  variant,
}: DayprintLogoProps) {
  const [activeVariant, setActiveVariant] = useState<DayprintLogoVariant>(variant || "shard");

  useEffect(() => {
    if (variant) {
      setActiveVariant(variant);
      return;
    }
    try {
      const saved = localStorage.getItem("dayprint_active_logo") as DayprintLogoVariant;
      if (saved) {
        setActiveVariant(saved);
      }
    } catch {}
  }, [variant]);

  // If set to an IP candidate image
  if (activeVariant !== "shard" && activeVariant !== "stamp" && activeVariant !== "typo" && IP_VARIANTS_MAP[activeVariant]) {
    const item = IP_VARIANTS_MAP[activeVariant];
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative rounded-xl overflow-hidden border border-stone-200/80 shadow-xs shrink-0 select-none bg-stone-100 ${className}`}
        title={`${item.nameZh} · Dayprint IP`}
      >
        <img
          src={item.src}
          alt={item.nameZh}
          className="w-full h-full object-cover rounded-xl"
        />
      </div>
    );
  }

  // If explicitly set to Option 1 (Stamp)
  if (activeVariant === "stamp") {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative rounded-xl overflow-hidden shadow-xs shrink-0 select-none ${className}`}
      >
        <img
          src="/logos/option-1-constructivist-stamp.svg"
          alt="Dayprint Stamp Logo"
          className="w-full h-full block"
        />
      </div>
    );
  }

  // If explicitly set to Option 3 (Swiss Typo)
  if (activeVariant === "typo") {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative rounded-xl overflow-hidden shadow-xs shrink-0 select-none ${className}`}
      >
        <img
          src="/logos/option-3-swiss-typo.svg"
          alt="Dayprint Swiss Typo Logo"
          className="w-full h-full block"
        />
      </div>
    );
  }

  // Default: Option 2 (Mondrian Boogie Shard) — The Knowledge Crystal (Full-Bleed, Pure Vector)
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative shrink-0 select-none flex items-center justify-center ${className}`}
      title="Dayprint · Mondrian Boogie Shard"
    >
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className="w-full h-full block overflow-visible"
        fill="none"
      >
        {/* Mondrian / Boogie Woogie Geometric Crystal Shard (Pure Vector, Max Bleed) */}
        <g transform="translate(32, 29.5) scale(0.73)">
          {/* Top Face (Parchment Paper White) */}
          <path
            d="M0 -36 L34 -16 L0 4 L-34 -16 Z"
            fill="#FFFFFF"
            stroke="#202328"
            strokeWidth="3.6"
            strokeLinejoin="round"
          />

          {/* Left Face (Morandi Prussian Blue) */}
          <path
            d="M-34 -16 L0 4 L0 42 L-34 22 Z"
            fill="#4E7494"
            stroke="#202328"
            strokeWidth="3.6"
            strokeLinejoin="round"
          />

          {/* Right Face (Morandi Terracotta Ochre) */}
          <path
            d="M0 4 L34 -16 L34 22 L0 42 Z"
            fill="#D66D52"
            stroke="#202328"
            strokeWidth="3.6"
            strokeLinejoin="round"
          />

          {/* Accent Intersection Plane (Mineral Mustard Gold) */}
          <path
            d="M0 4 L18 -6 L18 14 L0 24 Z"
            fill="#E5A93C"
            stroke="#202328"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />

          {/* Inner Central Core / Connecting Node Spark */}
          <circle cx="0" cy="4" r="4.2" fill="#FFFFFF" stroke="#202328" strokeWidth="2.6" />
        </g>
      </svg>
    </div>
  );
}
