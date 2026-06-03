import React from "react";

export default function GlassCard({ children, className = "", ...props }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl shadow-lg shadow-black/20 ${className}`}
      {...props}
    >
      {/* top sheen — light catching the glass edge */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      {children}
    </div>
  );
}