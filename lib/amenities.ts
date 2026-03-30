export interface AmenityCategory {
  category: string
  emoji:    string
  items:    string[]
}

export const STAY_AMENITIES: AmenityCategory[] = [
  {
    category: 'Popular',
    emoji: '⭐',
    items: ['Free WiFi', 'Breakfast included', 'Air conditioning', 'Swimming pool', 'Free parking', 'Beach access', 'Ocean view'],
  },
  {
    category: 'Bedroom',
    emoji: '🛏️',
    items: ['Fan', 'Mosquito net', 'Safe', 'Wardrobe', 'Linens & towels', 'Extra long bed', 'Blackout curtains'],
  },
  {
    category: 'Bathroom',
    emoji: '🚿',
    items: ['Private bathroom', 'Hot water', 'Outdoor shower', 'Bathtub', 'Hair dryer', 'Toiletries'],
  },
  {
    category: 'Kitchen',
    emoji: '🍳',
    items: ['Shared kitchen', 'Private kitchen', 'Kettle', 'Fridge', 'Microwave', 'BBQ'],
  },
  {
    category: 'Food & Drinks',
    emoji: '🍹',
    items: ['Restaurant on-site', 'Bar', 'Coffee & tea', 'Fruit basket', 'Room service', 'Minibar'],
  },
  {
    category: 'Outdoor',
    emoji: '🌴',
    items: ['Garden', 'Terrace', 'Balcony', 'Sunbeds', 'Hammock', 'BBQ area', 'Fire pit'],
  },
  {
    category: 'View',
    emoji: '🌅',
    items: ['Ocean view', 'Rice field view', 'Mountain view', 'Jungle view', 'Garden view', 'Sunrise view', 'Sunset view'],
  },
  {
    category: 'Activities',
    emoji: '🏄',
    items: ['Surfboard rental', 'Snorkeling gear', 'Bicycle rental', 'Scooter rental', 'Yoga classes', 'Cooking class', 'Dive equipment'],
  },
  {
    category: 'Services',
    emoji: '🛎️',
    items: ['Airport transfer', 'Laundry service', 'Daily cleaning', 'Tour desk', '24h check-in', 'Luggage storage', 'Money exchange'],
  },
  {
    category: 'Safety & General',
    emoji: '🔒',
    items: ['24h security', 'CCTV', 'Fire extinguisher', 'First aid kit', 'Smoke detector', 'Locker'],
  },
]

export const ACTIVITY_AMENITIES: AmenityCategory[] = [
  {
    category: "What's included",
    emoji: '✅',
    items: ['Equipment included', 'Guide included', 'Transportation included', 'Hotel pickup', 'Lunch included', 'Drinks included', 'Photos included', 'Certificate'],
  },
  {
    category: 'Equipment',
    emoji: '🤿',
    items: ['Snorkeling gear', 'Surfboard', 'Life jacket', 'Wetsuit', 'Fins', 'Mask & snorkel', 'Diving equipment', 'Bicycle'],
  },
  {
    category: 'Safety',
    emoji: '⛑️',
    items: ['Safety briefing', 'First aid kit', 'Insurance included', 'Certified guide', 'Small groups'],
  },
  {
    category: 'Accessibility',
    emoji: '♿',
    items: ['Suitable for beginners', 'Family friendly', 'Suitable for kids', 'Wheelchair accessible'],
  },
]

export const TRANSFER_AMENITIES: AmenityCategory[] = [
  {
    category: 'Vehicle',
    emoji: '🚗',
    items: ['Air conditioning', 'WiFi on board', 'USB charging', 'Water included', 'Child seat available', 'Wheelchair accessible'],
  },
  {
    category: 'Driver',
    emoji: '🧑‍✈️',
    items: ['English (basic)', 'English (medium)', 'English (fluent)', 'Local guide knowledge', 'Licensed & insured', 'Punctual & reliable'],
  },
  {
    category: 'Vehicle Type',
    emoji: '🚐',
    items: ['Sedan (1–3 pax)', 'SUV / 4×4 (1–4 pax)', 'MPV (1–6 pax)', 'Van / Minibus (1–12 pax)', 'Scooter taxi (1 pax)'],
  },
  {
    category: 'Service',
    emoji: '✅',
    items: ['Meet & greet', 'Flight tracking', 'Door-to-door', 'Hotel pickup', 'Fixed price (no meter)', 'Night service available'],
  },
]

/** Returns amenities grouped by category, skipping empty categories */
/** Amenities list for a given property type (used in both selector and public page) */
export function amenitiesForType(type: string): AmenityCategory[] {
  if (type === 'stay')     return STAY_AMENITIES
  if (type === 'transfer') return TRANSFER_AMENITIES
  if (type === 'trip')     return [...ACTIVITY_AMENITIES, ...TRANSFER_AMENITIES]
  return ACTIVITY_AMENITIES
}

export function groupAmenities(
  selected: string[],
  type: 'stay' | 'trip' | 'activity' | 'transfer'
): { category: string; emoji: string; items: string[] }[] {
  const all = amenitiesForType(type)
  const set = new Set(selected)

  return all
    .map(cat => ({
      category: cat.category,
      emoji:    cat.emoji,
      items:    cat.items.filter(i => set.has(i)),
    }))
    .filter(cat => cat.items.length > 0)
}
