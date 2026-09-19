import { TerrainPreset } from '../types';

export const TERRAIN_PRESETS: TerrainPreset[] = [
  {
    id: 'farmland',
    nameBn: 'কৃষি জমি ও মেঠো পথ (Farmland & Crops)',
    nameEn: 'Farmland & Rural Trail',
    descriptionBn: 'মাটির ফসলি জমি, আইল এবং মাঝে মাঝে ছোট পাথর ও ঘাসের ঝোপ।',
    descriptionEn: 'Agricultural field with dirt tracks, scattered small rocks and vegetation.',
    friction: 0.85,
    lighting: 'sunny',
    groundColor: '#453223',
    pathColor: '#6e543c',
    obstacles: [
      { id: 'obs-1', x: 28, y: 38, radius: 4.5, type: 'rock', label: 'পাথর (Boulder)', height: 0.6 },
      { id: 'obs-2', x: 45, y: 56, radius: 5.5, type: 'bush', label: 'ঝোপঝাড় (Crop Bush)', height: 0.9 },
      { id: 'obs-3', x: 62, y: 36, radius: 4.0, type: 'ditch', label: 'সেচ নালা/খাদ (Irrigation Ditch)', height: -0.5 },
      { id: 'obs-4', x: 75, y: 60, radius: 6.0, type: 'rock', label: 'বড় পাথর (Rock Pile)', height: 0.8 },
      { id: 'obs-5', x: 50, y: 22, radius: 5.0, type: 'bush', label: 'ঘাসের ঢিবি (Brush Mound)', height: 0.7 }
    ]
  },
  {
    id: 'rocky_trail',
    nameBn: 'রুক্ষ পাথুরে অঞ্চল (Rocky Rugged Trail)',
    nameEn: 'Rocky Rugged Mountain Trail',
    descriptionBn: 'উঁচু-নিচু পাথর, বিপজ্জনক খাদ এবং খানাখন্দে ভরা রুক্ষ পথ।',
    descriptionEn: 'Harsh mountain terrain with sharp boulders, drop-offs, and rocky debris.',
    friction: 0.75,
    lighting: 'glare',
    groundColor: '#383b42',
    pathColor: '#535863',
    obstacles: [
      { id: 'rock-1', x: 30, y: 48, radius: 6.0, type: 'rock', label: 'বিশাল শিলাখণ্ড (Granite Boulder)', height: 1.2 },
      { id: 'ditch-1', x: 48, y: 35, radius: 5.5, type: 'ditch', label: 'গভীর খাদ (Steep Chasm)', height: -1.0 },
      { id: 'rock-2', x: 65, y: 55, radius: 5.0, type: 'rock', label: 'পাথুরে স্তূপ (Rock Formation)', height: 0.9 },
      { id: 'ditch-2', x: 72, y: 32, radius: 4.5, type: 'ditch', label: 'পাথর ভাঙা খাদ (Crevasse)', height: -0.8 },
      { id: 'rock-3', x: 82, y: 50, radius: 4.0, type: 'rock', label: 'পাথর (Jagged Stone)', height: 0.7 }
    ]
  },
  {
    id: 'rescue_rubble',
    nameBn: 'সার্চ-অ্যান্ড-রেসকিউ ধ্বংসস্তূপ (Search & Rescue Zone)',
    nameEn: 'Search & Rescue Rubble Field',
    descriptionBn: 'দুর্যোগকবলিত এলাকা যেখানে ধ্বংসাবশেষ ও গর্ত স্বাভাবিক চলাচলে বাধা সৃষ্টি করে।',
    descriptionEn: 'Disaster response zone with collapsed masonry, sinkholes, and debris.',
    friction: 0.70,
    lighting: 'dusk',
    groundColor: '#2b2927',
    pathColor: '#45403c',
    obstacles: [
      { id: 'rubble-1', x: 26, y: 42, radius: 5.5, type: 'rock', label: 'কংক্রিট ধ্বংসাবশেষ (Concrete Rubble)', height: 1.0 },
      { id: 'sinkhole-1', x: 42, y: 60, radius: 5.0, type: 'ditch', label: 'ধসে পড়া গর্ত (Sinkhole)', height: -1.2 },
      { id: 'rubble-2', x: 58, y: 38, radius: 6.5, type: 'rock', label: 'ধ্বংসস্তূপ (Debris Mound)', height: 1.4 },
      { id: 'sinkhole-2', x: 74, y: 52, radius: 4.8, type: 'ditch', label: 'ফাটল/খাদ (Fissure Trench)', height: -0.9 },
      { id: 'rubble-3', x: 80, y: 28, radius: 4.5, type: 'rock', label: 'ভাঙা স্ল্যাব (Broken Slab)', height: 0.8 }
    ]
  },
  {
    id: 'forest_canopy',
    nameBn: 'ঘন জঙ্গল ও ছায়াবৃত বনাঞ্চল (Forest Canopy & Woods)',
    nameEn: 'Dense Forest & Canopy Trail',
    descriptionBn: 'গাছের গুঁড়ি, ঘন লতাগুল্ম এবং তীব্র ছায়ার কারণে যেখানে জিপিএস সিগন্যাল শূন্য।',
    descriptionEn: 'Dense tree trunks, heavy foliage shadows, and complete GPS satellite blackout.',
    friction: 0.80,
    lighting: 'shadow',
    groundColor: '#1e2d1d',
    pathColor: '#364934',
    obstacles: [
      { id: 'tree-1', x: 28, y: 35, radius: 5.0, type: 'tree', label: 'শালগাছের গুঁড়ি (Tree Trunk)', height: 2.5 },
      { id: 'bush-1', x: 44, y: 58, radius: 6.0, type: 'bush', label: 'ঘন বনঝোপ (Dense Thick Bush)', height: 1.1 },
      { id: 'tree-2', x: 60, y: 30, radius: 5.5, type: 'tree', label: 'পুরোনো বটগাছ (Old Timber)', height: 2.8 },
      { id: 'mud-1', x: 68, y: 62, radius: 6.5, type: 'mud', label: 'কাদাময় নিচু জমি (Mud Bog)', height: -0.2 },
      { id: 'tree-3', x: 84, y: 45, radius: 4.8, type: 'tree', label: 'গাছের গুঁড়ি (Forest Trunk)', height: 2.2 }
    ]
  }
];
