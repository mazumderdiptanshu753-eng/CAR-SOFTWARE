import React from 'react';
import { TerrainPreset, TerrainType, Language, Theme } from '../types';
import { TERRAIN_PRESETS } from '../data/terrains';
import { translations } from '../data/translations';
import { Trees, Mountain, Tractor, Flame } from 'lucide-react';

interface TerrainScenarioBarProps {
  currentTerrain: TerrainPreset;
  onSelectTerrain: (preset: TerrainPreset) => void;
  language: Language;
  theme?: Theme;
}

export const TerrainScenarioBar: React.FC<TerrainScenarioBarProps> = ({
  currentTerrain,
  onSelectTerrain,
  language,
  theme = 'light'
}) => {
  const t = translations[language];
  const isLight = theme === 'light';

  const getIcon = (id: TerrainType) => {
    switch (id) {
      case 'farmland':
        return <Tractor className={`w-4 h-4 ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />;
      case 'rocky_trail':
        return <Mountain className={`w-4 h-4 ${isLight ? 'text-sky-600' : 'text-sky-400'}`} />;
      case 'rescue_rubble':
        return <Flame className={`w-4 h-4 ${isLight ? 'text-amber-600' : 'text-amber-400'}`} />;
      case 'forest_canopy':
        return <Trees className={`w-4 h-4 ${isLight ? 'text-emerald-700' : 'text-emerald-500'}`} />;
    }
  };

  return (
    <div className={`rounded-xl border p-3 shadow-xs flex flex-col gap-2 transition-colors ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 shadow-md'
    }`}>
      <div className="flex items-center justify-between text-xs">
        <span className={`font-semibold font-bengali ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
          {t.terrainSelector}
        </span>
        <span className={`text-2xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Preset Mission Fields
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TERRAIN_PRESETS.map(preset => {
          const isSelected = preset.id === currentTerrain.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectTerrain(preset)}
              className={`flex items-center gap-2.5 p-2 rounded-lg text-left transition-all border ${
                isSelected
                  ? isLight
                    ? 'bg-emerald-50 border-emerald-400 shadow-xs'
                    : 'bg-slate-800/90 border-emerald-500/70 shadow-sm'
                  : isLight
                    ? 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div className={`p-1.5 rounded-md border shrink-0 ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                {getIcon(preset.id)}
              </div>
              <div className="overflow-hidden">
                <div className={`text-xs font-semibold font-bengali truncate ${
                  isSelected
                    ? isLight ? 'text-emerald-900' : 'text-white'
                    : isLight ? 'text-slate-800' : 'text-slate-100'
                }`}>
                  {language === 'bn' ? preset.nameBn.split(' (')[0] : preset.nameEn}
                </div>
                <div className={`text-3xs font-mono truncate ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  Friction: {preset.friction}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
