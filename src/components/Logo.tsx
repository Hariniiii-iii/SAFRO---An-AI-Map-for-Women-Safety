import React from "react";

export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Map Pin Shadow */}
      <ellipse cx="50" cy="92" rx="25" ry="4" fill="#000" fillOpacity="0.1" />
      
      {/* Pin Body - Dark Left */}
      <path 
        d="M50 95C50 95 15 65 15 35C15 15.67 30.67 0 50 0V95Z" 
        fill="#CD5E77" 
      />
      {/* Pin Body - Light Right */}
      <path 
        d="M50 95C50 95 85 65 85 35C85 15.67 69.33 0 50 0V95Z" 
        fill="#E8A3B2" 
      />
      
      {/* White Circle */}
      <circle cx="50" cy="35" r="18" fill="white" />
      
      {/* Heart - Dark Left */}
      <path 
        d="M50 45L48.1 43.1C42.2 38.0 38 34.6 38 30.5C38 27.2 40.5 24.6 43.8 24.6C45.7 24.6 47.5 25.5 48.7 26.9L50 28.3V45Z" 
        fill="#CD5E77" 
      />
      {/* Heart - Light Right */}
      <path 
        d="M50 45L51.9 43.1C57.8 38.0 62 34.6 62 30.5C62 27.2 59.5 24.6 56.2 24.6C54.3 24.6 52.5 25.5 51.3 26.9L50 28.3V45Z" 
        fill="#E8A3B2" 
      />
    </svg>
  );
}
