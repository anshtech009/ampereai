import React from "react";
import { useCountUp } from "../hooks/useCountUp";

export default function CountUp({ end, decimals = 0, prefix = "", suffix = "", duration = 1200 }) {
  const value = useCountUp(end, duration, decimals);
  const formatted = value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return (
    <span>
      {prefix}{formatted}{suffix}
    </span>
  );
}