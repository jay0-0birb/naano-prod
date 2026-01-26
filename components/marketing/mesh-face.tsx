"use client";

interface WireframeFaceProps {
  className?: string;
}

export function WireframeFace({ className = "" }: WireframeFaceProps) {
  console.log("[WireframeFace] component rendered");
  return (
    <div
      className={`w-full h-full ${className}`}
      style={{
        minHeight: "400px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255, 0, 0, 0.1)",
        outline: "5px solid red",
      }}
    >
      <img
        src="/docs/logo.svg"
        alt="Logo"
        onLoad={() => {
          console.log("[WireframeFace] SVG loaded");
        }}
        onError={(e) => {
          console.error("[WireframeFace] SVG failed to load", e);
        }}
        style={{
          width: "60%",
          height: "auto",
          display: "block",
          transform: "rotate(-90deg)",
          transformOrigin: "center center",
          border: "4px solid red",
        }}
      />
    </div>
  );
}
