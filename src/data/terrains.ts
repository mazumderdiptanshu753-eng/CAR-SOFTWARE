import { TerrainPreset } from '../types';

export const TERRAIN_PRESETS: TerrainPreset[] = [
  {
    id: 'farmland',
    nameBn: 'Dense Forest & Canopy Trail',
    nameEn: 'Farmland & Rural Trail',
    descriptionBn: 'Dense tree trunks, heavy foliage shadows, and complete GPS satellite blackout.',
    descriptionEn: 'Agricultural field with dirt tracks, scattered small rocks and vegetation.',
    friction: 0.85,
    lighting: 'sunny',
    groundColor: '#453223',
    pathColor: '#6e543c',
    obstacles: [
      { id: 'obs-1', x: 28, y: 38, radius: 4.5, type: 'rock', label: 'Boulder', height: 0.6 },
      { id: 'obs-2', x: 45, y: 56, radius: 5.5, type: 'bush', label: 'Crop Bush', height: 0.9 },
      { id: 'obs-3', x: 62, y: 36, radius: 4.0, type: 'ditch', label: 'Irrigation Ditch', height: -0.5 },
      { id: 'obs-4', x: 75, y: 60, radius: 6.0, type: 'rock', label: 'Rock Pile', height: 0.8 },
      { id: 'obs-5', x: 50, y: 22, radius: 5.0, type: 'bush', label: 'Brush Mound', height: 0.7 }
    ]
  },
  {
    id: 'rocky_trail',
    nameBn: 'Rocky Rugged Mountain Trail',
    nameEn: 'Rocky Rugged Mountain Trail',
    descriptionBn: 'Harsh mountain terrain with sharp boulders, drop-offs, and rocky debris.',
    descriptionEn: 'Harsh mountain terrain with sharp boulders, drop-offs, and rocky debris.',
    friction: 0.75,
    lighting: 'glare',
    groundColor: '#383b42',
    pathColor: '#535863',
    obstacles: [
      { id: 'rock-1', x: 30, y: 48, radius: 6.0, type: 'rock', label: 'Granite Boulder', height: 1.2 },
      { id: 'ditch-1', x: 48, y: 35, radius: 5.5, type: 'ditch', label: 'Steep Chasm', height: -1.0 },
      { id: 'rock-2', x: 65, y: 55, radius: 5.0, type: 'rock', label: 'Rock Formation', height: 0.9 },
      { id: 'ditch-2', x: 72, y: 32, radius: 4.5, type: 'ditch', label: 'Crevasse', height: -0.8 },
      { id: 'rock-3', x: 82, y: 50, radius: 4.0, type: 'rock', label: 'Jagged Stone', height: 0.7 }
    ]
  },
  {
    id: 'rescue_rubble',
    nameBn: 'Search & Rescue Rubble Field',
    nameEn: 'Search & Rescue Rubble Field',
    descriptionBn: 'Disaster response zone with collapsed masonry, sinkholes, and debris.',
    descriptionEn: 'Disaster response zone with collapsed masonry, sinkholes, and debris.',
    friction: 0.70,
    lighting: 'dusk',
    groundColor: '#2b2927',
    pathColor: '#45403c',
    obstacles: [
      { id: 'rubble-1', x: 26, y: 42, radius: 5.5, type: 'rock', label: 'Concrete Rubble', height: 1.0 },
      { id: 'sinkhole-1', x: 42, y: 60, radius: 5.0, type: 'ditch', label: 'Sinkhole', height: -1.2 },
      { id: 'rubble-2', x: 58, y: 38, radius: 6.5, type: 'rock', label: 'Debris Mound', height: 1.4 },
      { id: 'sinkhole-2', x: 74, y: 52, radius: 4.8, type: 'ditch', label: 'Fissure Trench', height: -0.9 },
      { id: 'rubble-3', x: 80, y: 28, radius: 4.5, type: 'rock', label: 'Broken Slab', height: 0.8 }
    ]
  },
  {
    id: 'forest_canopy',
    nameBn: 'Dense Forest & Canopy Trail',
    nameEn: 'Dense Forest & Canopy Trail',
    descriptionBn: 'Dense tree trunks, heavy foliage shadows, and complete GPS satellite blackout.',
    descriptionEn: 'Dense tree trunks, heavy foliage shadows, and complete GPS satellite blackout.',
    friction: 0.80,
    lighting: 'shadow',
    groundColor: '#1e2d1d',
    pathColor: '#364934',
    obstacles: [
      { id: 'tree-1', x: 28, y: 35, radius: 5.0, type: 'tree', label: 'Tree Trunk', height: 2.5 },
      { id: 'bush-1', x: 44, y: 58, radius: 6.0, type: 'bush', label: 'Dense Thick Bush', height: 1.1 },
      { id: 'tree-2', x: 60, y: 30, radius: 5.5, type: 'tree', label: 'Old Timber', height: 2.8 },
      { id: 'mud-1', x: 68, y: 62, radius: 6.5, type: 'mud', label: 'Mud Bog', height: -0.2 },
      { id: 'tree-3', x: 84, y: 45, radius: 4.8, type: 'tree', label: 'Forest Trunk', height: 2.2 }
    ]
  }
];
