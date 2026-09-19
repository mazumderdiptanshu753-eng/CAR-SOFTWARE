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
    nameBn: 'ধানমন্ডি লেক',
    nameEn: 'Dhanmondi Lake',
    lat: 23.7461,
    lng: 90.3758,
    descriptionBn: 'ধানমন্ডি লেক পার্ক ও ওয়াকওয়ে জোন',
    descriptionEn: 'Dhanmondi Lake Park & Walkway',
    keywords: ['ধানমন্ডি', 'লেক', 'dhanmondi', 'lake', 'park']
  },
  {
    id: 'du-curzon',
    nameBn: 'ঢাকা বিশ্ববিদ্যালয় (কার্জন হল)',
    nameEn: 'Curzon Hall, DU',
    lat: 23.7265,
    lng: 90.4011,
    descriptionBn: 'ঐতিহাসিক কার্জন হল ও সায়েন্স ক্যাম্পাস',
    descriptionEn: 'Historic Curzon Hall Campus',
    keywords: ['ঢাকা বিশ্ববিদ্যালয়', 'কার্জন', 'curzon', 'du', 'university']
  },
  {
    id: 'parliament',
    nameBn: 'জাতীয় সংসদ ভবন',
    nameEn: 'National Parliament Bhaban',
    lat: 23.7625,
    lng: 90.3787,
    descriptionBn: 'মানিক মিয়া এভিনিউ ও সংসদ চত্বর',
    descriptionEn: 'Manik Mia Ave & Parliament Plaza',
    keywords: ['সংসদ', 'জাতীয় সংসদ', 'parliament', 'manik mia']
  },
  {
    id: 'gulshan-2',
    nameBn: 'গুলশান ২ চত্বর',
    nameEn: 'Gulshan 2 Circle',
    lat: 23.7946,
    lng: 90.4143,
    descriptionBn: 'গুলশান সেন্ট্রাল মোড় ও ডিপ্লোম্যাটিক জোন',
    descriptionEn: 'Gulshan 2 Circle & Diplomatic Zone',
    keywords: ['গুলশান', 'গুলশান ২', 'gulshan', 'gulshan 2']
  },
  {
    id: 'ramna-park',
    nameBn: 'রমনা পার্ক',
    nameEn: 'Ramna Park',
    lat: 23.7388,
    lng: 90.3995,
    descriptionBn: 'সবুজ আউটডোর পার্ক ও লেক রোড',
    descriptionEn: 'Green Outdoor Park & Lake Road',
    keywords: ['রমনা', 'রমনা পার্ক', 'ramna', 'park']
  },
  {
    id: 'bashundhara-city',
    nameBn: 'পান্থপথ (বসুন্ধরা সিটি)',
    nameEn: 'Panthapath (Bashundhara City)',
    lat: 23.7508,
    lng: 90.3905,
    descriptionBn: 'পান্থপথ রোবটিক্স ট্রায়াল জোন',
    descriptionEn: 'Panthapath Robotics Trial Zone',
    keywords: ['পান্থপথ', 'বসুন্ধরা', 'panthapath', 'bashundhara']
  },
  {
    id: 'airport-road',
    nameBn: 'শাহজালাল বিমানবন্দর রোড',
    nameEn: 'Airport Road, Uttara',
    lat: 23.8512,
    lng: 90.4079,
    descriptionBn: 'উত্তরা এক্সপ্রেসওয়ে আউটডোর করিডোর',
    descriptionEn: 'Expressway Outdoor Corridor',
    keywords: ['বিমানবন্দর', 'এয়ারপোর্ট', 'airport', 'uttara']
  },
  {
    id: 'robotics-field',
    nameBn: 'ইউজিভি আউটডোর টেস্ট ট্র্যাক',
    nameEn: 'UGV Outdoor Test Track',
    lat: 23.7550,
    lng: 90.3800,
    descriptionBn: 'সার্চ অ্যান্ড রেসকিউ ওপেন গ্রাউন্ড',
    descriptionEn: 'Search & Rescue Open Ground',
    keywords: ['টেস্ট', 'ট্র্যাক', 'test', 'track', 'field']
  }
];
