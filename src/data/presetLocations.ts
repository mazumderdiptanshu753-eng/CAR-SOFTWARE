export interface PresetLocation {
  id: string;
  nameBn: string;
  nameEn: string;
  lat: number;
  lng: number;
  descriptionBn: string;
  descriptionEn: string;
  keywords: string[];
}

export const PRESET_LOCATIONS: PresetLocation[] = [
  {
    id: 'dhanmondi-lake',
    nameBn: 'Dhanmondi Lake',
    nameEn: 'Dhanmondi Lake',
    lat: 23.7461,
    lng: 90.3758,
    descriptionBn: 'Dhanmondi Lake Park & Walkway',
    descriptionEn: 'Dhanmondi Lake Park & Walkway',
    keywords: ['dhanmondi', 'lake', 'park']
  },
  {
    id: 'du-curzon',
    nameBn: 'Curzon Hall, DU',
    nameEn: 'Curzon Hall, DU',
    lat: 23.7265,
    lng: 90.4011,
    descriptionBn: 'Historic Curzon Hall Campus',
    descriptionEn: 'Historic Curzon Hall Campus',
    keywords: ['curzon', 'du', 'university']
  },
  {
    id: 'parliament',
    nameBn: 'National Parliament Bhaban',
    nameEn: 'National Parliament Bhaban',
    lat: 23.7625,
    lng: 90.3787,
    descriptionBn: 'Manik Mia Ave & Parliament Plaza',
    descriptionEn: 'Manik Mia Ave & Parliament Plaza',
    keywords: ['parliament', 'manik mia']
  },
  {
    id: 'gulshan-2',
    nameBn: 'Gulshan 2 Circle',
    nameEn: 'Gulshan 2 Circle',
    lat: 23.7946,
    lng: 90.4143,
    descriptionBn: 'Gulshan 2 Circle & Diplomatic Zone',
    descriptionEn: 'Gulshan 2 Circle & Diplomatic Zone',
    keywords: ['gulshan', 'gulshan 2']
  },
  {
    id: 'ramna-park',
    nameBn: 'Ramna Park',
    nameEn: 'Ramna Park',
    lat: 23.7388,
    lng: 90.3995,
    descriptionBn: 'Green Outdoor Park & Lake Road',
    descriptionEn: 'Green Outdoor Park & Lake Road',
    keywords: ['ramna', 'park']
  },
  {
    id: 'bashundhara-city',
    nameBn: 'Panthapath (Bashundhara City)',
    nameEn: 'Panthapath (Bashundhara City)',
    lat: 23.7508,
    lng: 90.3905,
    descriptionBn: 'Panthapath Robotics Trial Zone',
    descriptionEn: 'Panthapath Robotics Trial Zone',
    keywords: ['panthapath', 'bashundhara']
  },
  {
    id: 'airport-road',
    nameBn: 'Airport Road, Uttara',
    nameEn: 'Airport Road, Uttara',
    lat: 23.8512,
    lng: 90.4079,
    descriptionBn: 'Expressway Outdoor Corridor',
    descriptionEn: 'Expressway Outdoor Corridor',
    keywords: ['airport', 'uttara']
  },
  {
    id: 'robotics-field',
    nameBn: 'UGV Outdoor Test Track',
    nameEn: 'UGV Outdoor Test Track',
    lat: 23.7550,
    lng: 90.3800,
    descriptionBn: 'Search & Rescue Open Ground',
    descriptionEn: 'Search & Rescue Open Ground',
    keywords: ['test', 'track', 'field']
  }
];
