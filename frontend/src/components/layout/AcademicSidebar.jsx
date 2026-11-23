import React from 'react';
import { ACADEMIC_MODULES } from '../../config/modules';
import { Layers, MapPin, ChevronRight, X } from 'lucide-react';

export default function AcademicSidebar({ 
  activeModuleId, 
  onSelectModule, 
  isOpen, 
  onClose,
  selectedCity,
  backendConnected
}) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Fixed Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0a1c14] text-slate-200 border-r border-[#163828] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Academic Header / Institution Title */}
        <div className="p-5 border-b border-[#163828] bg-[#071710]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded bg-[#064e3b] border border-emerald-600/40 flex items-center justify-center text-emerald-300">
                <Layers className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base tracking-tight text-white font-mono">ECOVISION</span>
                  <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-600/30 text-emerald-300">
                    Academic
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400/80 font-medium">
                  Environmental Analysis System
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#163828]"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Section Title */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-emerald-400/70 border-b border-[#163828]/50">
          <span>Project Modules</span>
          <span className="font-mono text-[10px] text-emerald-500/60">09 Modules</span>
        </div>

        {/* Module Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {ACADEMIC_MODULES.map((module) => {
            const isActive = module.id === activeModuleId;
            const Icon = module.icon;

            return (
              <button
                key={module.id}
                onClick={() => {
                  onSelectModule(module.id);
                  if (onClose) onClose();
                }}
                className={`w-full text-left px-3 py-2.5 rounded flex items-center justify-between text-xs transition-colors group cursor-pointer ${
                  isActive
                    ? 'bg-[#064e3b] text-white font-medium border-l-4 border-emerald-400 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-[#122e20]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  {/* Module Number badge */}
                  <span
                    className={`font-mono text-[11px] px-1.5 py-0.5 rounded font-bold transition-colors ${
                      isActive
                        ? 'bg-emerald-400 text-slate-950 font-semibold'
                        : 'bg-[#153426] text-emerald-300/90 group-hover:bg-[#1b4332]'
                    }`}
                  >
                    {module.number}
                  </span>

                  {/* Module Title */}
                  <span className="truncate">
                    {module.shortTitle}
                  </span>
                </div>

                <div className="flex items-center ml-2 flex-shrink-0">
                  {isActive && (
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-300" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Active Context & Database Status Bar at bottom of sidebar */}
        <div className="p-4 border-t border-[#163828] bg-[#071710] space-y-2 text-xs">
          {/* Selected City Context */}
          <div className="p-2.5 rounded bg-[#0b2318] border border-[#163828] space-y-1">
            <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-emerald-400/80">
              <span className="flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>Active Target</span>
              </span>
              <span className="font-mono text-emerald-500/60">Persistent</span>
            </div>
            <p className="font-medium text-white truncate text-xs">
              {selectedCity?.name || 'No Target Selected'}
            </p>
            <p className="text-[10px] text-emerald-400/60 truncate font-mono">
              {[selectedCity?.state, selectedCity?.country].filter(Boolean).join(', ')}
            </p>
          </div>

          {/* Institutional / Architecture footnote */}
          <div className="flex items-center justify-between text-[10px] text-emerald-400/60 px-1 pt-1 font-mono">
            <span>Framework: Academic v1.0</span>
            <span className="flex items-center space-x-1">
              <span className={`w-1.5 h-1.5 rounded-full ${backendConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{backendConnected ? 'Core Online' : 'Connecting'}</span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
