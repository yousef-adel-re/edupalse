// src/components/Logo.jsx
import React from 'react';

export default function Logo({ size = "40", showText = true }) {
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
        <circle cx="50" cy="50" r="48" fill="url(#bg-grad)" />
        <path d="M 50 20 L 25 32 L 50 44 L 75 32 Z" fill="white" opacity="0.9" />
        <path d="M 15 60 L 32 60 L 42 40 L 55 80 L 68 50 L 78 60 L 85 60" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id="bg-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#1e3a8a" />
          </linearGradient>
        </defs>
      </svg>
      {showText && (
        <span className="font-extrabold text-2xl tracking-wide text-gray-900 dark:text-white">
          Edu<span className="text-blue-600 dark:text-blue-400">Pulse</span>
        </span>
      )}
    </div>
  );
}