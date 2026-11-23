import React from 'react';
import { 
  Compass, 
  ArrowRight, 
  CheckCircle2, 
  Info 
} from 'lucide-react';

export default function AcademicModuleView({
  module,
  selectedCity,
  onNavigateToDashboard,
  environmentalData
}) {
  if (!module) return null;

  const Icon = module.icon;
  const hasTelemetry = !!environmentalData;

  return (
    <div className="space-y-6">
      {/* Module Academic Specification Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-start space-x-3.5">
            <div className="w-11 h-11 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center flex-shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-emerald-800 text-white">
                  {module.code}
                </span>
                <span className="text-xs uppercase font-semibold text-emerald-900 tracking-wider">
                  Module {module.number}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-1">
                {module.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onNavigateToDashboard}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded text-xs font-semibold bg-emerald-800 hover:bg-emerald-900 text-white transition-colors cursor-pointer shadow-xs"
            >
              <span>Access Integrated Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Academic Purpose Description */}
        <div className="pt-4 space-y-4 text-xs text-slate-600">
          <div>
            <h3 className="text-xs uppercase font-bold tracking-wider text-slate-700 mb-1">
              Academic Module Scope & Research Focus
            </h3>
            <p className="text-sm text-slate-800 leading-relaxed font-normal">
              {module.description}
            </p>
          </div>

          {/* Research Objectives */}
          {module.academicObjectives && module.academicObjectives.length > 0 && (
            <div className="space-y-2 pt-2">
              <h4 className="text-xs uppercase font-bold tracking-wider text-slate-700">
                Core Methodological Objectives
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {module.academicObjectives.map((obj, idx) => (
                  <li 
                    key={idx} 
                    className="p-3 rounded bg-slate-50 border border-slate-200 text-slate-700 flex flex-col justify-between"
                  >
                    <span className="font-mono text-[10px] text-emerald-800 font-bold mb-1">
                      Objective {idx + 1}
                    </span>
                    <span className="text-xs leading-normal">
                      {obj}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Persistent Active Spatial & Environmental Context */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Active Municipal Domain Context (Persistent Across Modules)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
            State Persistence: Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] uppercase font-semibold text-slate-500">Selected Municipality</span>
            <p className="text-base font-bold text-slate-900">{selectedCity?.name || 'None'}</p>
            <p className="text-[11px] text-slate-600 font-medium">
              {[selectedCity?.state, selectedCity?.country].filter(Boolean).join(', ')}
            </p>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] uppercase font-semibold text-slate-500">Spatial Coordinates</span>
            <p className="text-base font-bold text-slate-900 font-mono">
              {typeof selectedCity?.latitude === 'number' ? selectedCity.latitude.toFixed(4) : selectedCity?.latitude}° N
            </p>
            <p className="text-[11px] text-slate-600 font-mono">
              {typeof selectedCity?.longitude === 'number' ? selectedCity.longitude.toFixed(4) : selectedCity?.longitude}° E
            </p>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] uppercase font-semibold text-slate-500">Timezone Domain</span>
            <p className="text-base font-bold text-slate-900 font-mono">
              {selectedCity?.timezone || 'UTC'}
            </p>
            <p className="text-[11px] text-slate-600">
              Country Code: {selectedCity?.country_code || 'N/A'}
            </p>
          </div>

          <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] uppercase font-semibold text-slate-500">Telemetry Ingestion Status</span>
            <div className="flex items-center space-x-1.5 pt-0.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span className="font-semibold text-slate-900">
                {hasTelemetry ? 'Observations Loaded' : 'Awaiting Ingestion'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-mono">
              {environmentalData?.aqi_scale || 'US EPA / CPCB NAQI'}
            </p>
          </div>
        </div>
      </div>

      {/* Phase 1 Academic Architecture Specification Notice */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 text-slate-900 font-semibold text-xs pb-2 border-b border-slate-200">
          <Info className="w-4 h-4 text-emerald-800" />
          <span>Academic System Architecture Status: Phase 1 Application Shell</span>
        </div>
        <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
          <p>
            In accordance with Phase 1 transformation specifications, the academic navigation shell, 
            fixed sidebar module hierarchy (Modules 01–09), breadcrumb routing, and formal top header have been fully established.
          </p>
          <p>
            The comprehensive environmental observation, scoring, and predictive analytical system remains fully operational 
            and accessible within <strong className="text-slate-900 font-semibold">Module 01 (Dashboard)</strong>. 
            All active municipal parameters, environmental telemetry streams, and analytical states persist across module navigation transitions.
          </p>
          <p className="text-[11px] text-slate-500 font-mono">
            System Note: Dedicated partitioned interface views for this module ({module.code}) will be activated in subsequent transformation phases.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={onNavigateToDashboard}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors cursor-pointer"
          >
            <span>Return to Module 01: Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
