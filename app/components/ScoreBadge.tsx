import React from "react";

interface ScoreBadgeProps {
  score: number;
}

const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score }) => {
  let badgeClass = "";
  let textClass = "";
  let label = "";

  if (score > 70) {
    badgeClass = "bg-badge-green";
    textClass = "text-green-600";
    label = "Strong";
  } else if (score > 49) {
    badgeClass = "bg-badge-yellow";
    textClass = "text-yellow-600";
    label = "Good start";
  } else {
    badgeClass = "bg-badge-red";
    textClass = "text-red-600";
    label = "Needs work";
  }

  return (
    <div className={`inline-block rounded px-3 py-1 ${badgeClass}`}>
      <p className={`font-semibold ${textClass}`}>{label}</p>
    </div>
  );
};

export default ScoreBadge