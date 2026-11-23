import React from 'react';
import { ChevronRight, Home, MapPin } from 'lucide-react';

export default function AcademicBreadcrumb({ activeModule, selectedCity }) {
  if (!activeModule) return null;

  return (
    <div className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
        {/* Breadcrumb Hierarchy */}
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-slate-500">
          <span className="flex items-center space-x-1 text-slate-600 hover:text-slate-900">
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>ECOVISION</span>
          </span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-slate-600 font-medium">Modules</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <div className="flex items-center space-x-1.5">
            <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[11px] bg-emerald-100 text-emerald-900 border border-emerald-300">
              {activeModule.code}
            </span>
            <span className="font-semibold text-slate-900">
              Module {activeModule.number}: {activeModule.title}
            </span>
          </div>
        </nav>

        {/* Academic Meta Context: Category & Active Target */}
        <div className="flex items-center space-x-3 text-[11px] text-slate-500 font-mono">
          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-sans border border-slate-200 font-medium">
            Category: {activeModule.category}
          </span>
          {selectedCity && (
            <span className="hidden md:inline-flex items-center space-x-1 text-emerald-800 font-sans font-medium">
              <MapPin className="w-3 h-3 text-emerald-700" />
              <span>{selectedCity.name}, {selectedCity.country_code || selectedCity.country}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
