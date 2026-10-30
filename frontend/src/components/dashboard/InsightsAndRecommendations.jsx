import React from 'react';
import { Lightbulb, CheckSquare, ShieldCheck, AlertCircle, ArrowUpRight, ArrowDownRight, Compass } from 'lucide-react';

export default function InsightsAndRecommendations({ insights = [], recommendations = [] }) {
  if ((!insights || insights.length === 0) && (!recommendations || recommendations.length === 0)) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Column 1: Measured Environmental Insights */}
      <div className="eco-card rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-950/70">
            <div className="flex items-center space-x-2">
              <Lightbulb className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Measured Environmental Insights
              </h3>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/40 text-emerald-300">
              Rule-Based Analytics
            </span>
          </div>

          <p className="text-xs text-emerald-400/60 leading-relaxed">
            Objective environmental assessments derived directly from measured sensor streams and historical variance:
          </p>

          <div className="space-y-2.5">
            {insights.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-[#081811]/70 border border-emerald-950/80 hover:border-emerald-600/30 transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wide">
                    {item.category}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400/50">
                    Verified
                  </span>
                </div>
                <div className="text-xs font-bold text-white">
                  {item.headline}
                </div>
                <div className="text-[11px] text-emerald-400/70 leading-relaxed">
                  {item.evidence}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-emerald-950/70 text-[11px] text-emerald-400/50 flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Insights strictly derived from Open-Meteo & SQLite observations. Zero AI fabrication.</span>
        </div>
      </div>

      {/* Column 2: Targeted Action Recommendations */}
      <div className="eco-card rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-950/70">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Targeted Action Recommendations
              </h3>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/40 text-emerald-300">
              Advisory Guidance
            </span>
          </div>

          <p className="text-xs text-emerald-400/60 leading-relaxed">
            Practical municipal and citizen actions aligned to currently measured environmental stressors:
          </p>

          <div className="space-y-2.5">
            {recommendations.length > 0 ? (
              recommendations.map((rec, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#081811]/70 border border-emerald-950/80 hover:border-emerald-600/30 transition-colors space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-200">
                      {rec.domain}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700/40 text-emerald-300">
                      {rec.level}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 leading-relaxed font-normal">
                    {rec.recommendation}
                  </p>
                  <div className="pt-1 text-[10px] text-emerald-400/60 flex items-center space-x-1">
                    <Compass className="w-3 h-3 text-emerald-500" />
                    <span>Trigger: <strong className="text-emerald-300 font-normal">{rec.measured_trigger}</strong></span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 rounded-xl bg-[#081811]/50 border border-emerald-950 text-xs text-emerald-400/60 text-center">
                All parameters currently within normal baselines. General public outdoor guidelines apply.
              </div>
            )}
          </div>
        </div>

        <div className="pt-3 border-t border-emerald-950/70 text-[11px] text-emerald-400/50 flex items-center space-x-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-emerald-400/80" />
          <span>General advisory recommendations. Consult local municipal civil authorities for official emergency mandates.</span>
        </div>
      </div>
    </div>
  );
}

