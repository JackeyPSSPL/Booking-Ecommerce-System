import { PrismaClient, PropertyStatus, PropertyCategory, ImageTag } from '@prisma/client';

// Plan uses HERITAGE/RESORT which aren't in our enum → mapped to OTHER/HOTEL
const PROPERTIES = [
  // ── Rajesh Patel · Ahmedabad ──────────────────────────────────────────────
  {
    name: 'Grand Palace Hotel',
    category: PropertyCategory.HOTEL,
    description: 'A luxurious 5-star experience in the heart of Ahmedabad, offering world-class amenities and unparalleled service.',
    city: 'Ahmedabad', address: 'SG Highway, Bodakdev, Ahmedabad, Gujarat 380054',
    lat: 23.0503, lng: 72.5311, starRating: 5,
    amenities: ['pool', 'spa', 'gym', 'restaurant', 'bar', 'wifi', 'parking', 'ac', 'concierge'],
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    ownerKey: 'rajesh@grandpalace.com',
  },
  {
    name: 'Heritage Haveli',
    category: PropertyCategory.OTHER,
    description: 'Step back in time at our beautifully restored 200-year-old haveli. Experience authentic Gujarati culture with modern comforts.',
    city: 'Ahmedabad', address: 'Old City, Pol Area, Ahmedabad, Gujarat 380001',
    lat: 23.0225, lng: 72.5714, starRating: 4,
    amenities: ['heritage_tour', 'courtyard', 'restaurant', 'wifi', 'ac', 'cultural_shows'],
    image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
    ownerKey: 'rajesh@grandpalace.com',
  },
  {
    name: 'The Business Suite',
    category: PropertyCategory.HOTEL,
    description: 'Purpose-built for the modern business traveller. High-speed WiFi, conference rooms, and proximity to GIFT City.',
    city: 'Ahmedabad', address: 'GIFT City, Gandhinagar, Gujarat 382355',
    lat: 23.1672, lng: 72.6830, starRating: 4,
    amenities: ['conference_room', 'business_center', 'gym', 'wifi', 'parking', 'ac', 'restaurant'],
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
    ownerKey: 'rajesh@grandpalace.com',
  },
  {
    name: 'Budget Inn Express',
    category: PropertyCategory.HOSTEL,
    description: 'Clean, safe, and affordable stays for backpackers and budget travellers exploring Ahmedabad.',
    city: 'Ahmedabad', address: 'Near Kalupur Railway Station, Ahmedabad, Gujarat 380002',
    lat: 23.0258, lng: 72.6075, starRating: 2,
    amenities: ['wifi', 'ac', 'common_kitchen', 'locker'],
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
    ownerKey: 'rajesh@grandpalace.com',
  },
  // ── Priya Sharma · Manali ─────────────────────────────────────────────────
  {
    name: 'Mountain View Resort',
    category: PropertyCategory.OTHER,
    description: 'A premium Himalayan retreat with breathtaking views of the Rohtang Pass. Includes bonfire evenings and guided treks.',
    city: 'Manali', address: 'Old Manali Road, Manali, Himachal Pradesh 175131',
    lat: 32.2396, lng: 77.1887, starRating: 5,
    amenities: ['spa', 'bonfire', 'trekking', 'restaurant', 'wifi', 'heater', 'mountain_view'],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    ownerKey: 'priya@mountainview.com',
  },
  {
    name: 'Snow Peak Cottages',
    category: PropertyCategory.OTHER,
    description: 'Cozy wooden cottages surrounded by apple orchards and snow-capped peaks. Perfect for couples and families.',
    city: 'Manali', address: 'Naggar Road, Kullu, Himachal Pradesh 175101',
    lat: 31.8979, lng: 77.1075, starRating: 4,
    amenities: ['bonfire', 'heater', 'mountain_view', 'trekking', 'wifi', 'restaurant'],
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800',
    ownerKey: 'priya@mountainview.com',
  },
  {
    name: 'Valley Camp',
    category: PropertyCategory.HOSTEL,
    description: "Adventure seekers' base camp. Dormitory tents and private rooms for budget mountain travellers.",
    city: 'Manali', address: 'Solang Valley, Manali, Himachal Pradesh 175131',
    lat: 32.3196, lng: 77.1503, starRating: 2,
    amenities: ['bonfire', 'trekking', 'wifi', 'common_area', 'heater'],
    image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800',
    ownerKey: 'priya@mountainview.com',
  },
  {
    name: 'Pine Wood Lodge',
    category: PropertyCategory.HOTEL,
    description: 'A mid-range hotel with comfortable rooms, in-house restaurant, and easy access to Manali Mall Road.',
    city: 'Manali', address: 'Mall Road, Manali, Himachal Pradesh 175131',
    lat: 32.2394, lng: 77.1912, starRating: 3,
    amenities: ['restaurant', 'wifi', 'heater', 'parking', 'mountain_view'],
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    ownerKey: 'priya@mountainview.com',
  },
  // ── Arjun Mehta · Goa ────────────────────────────────────────────────────
  {
    name: 'Coastal Breeze Resort',
    category: PropertyCategory.OTHER,
    description: "Goa's premier beachfront resort. Infinity pool, water sports, award-winning seafood restaurant.",
    city: 'Goa', address: 'Calangute Beach Road, North Goa, Goa 403516',
    lat: 15.5440, lng: 73.7528, starRating: 5,
    amenities: ['pool', 'spa', 'beach_access', 'water_sports', 'restaurant', 'bar', 'wifi', 'ac'],
    image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
    ownerKey: 'arjun@coastalresort.com',
  },
  {
    name: 'Beachfront Villa',
    category: PropertyCategory.VILLA,
    description: 'Private luxury villa steps from the beach. Exclusive private pool, fully equipped kitchen, and personal butler.',
    city: 'Goa', address: 'Vagator, North Goa, Goa 403509',
    lat: 15.6010, lng: 73.7390, starRating: 4,
    amenities: ['private_pool', 'beach_access', 'kitchen', 'wifi', 'ac', 'bbq'],
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    ownerKey: 'arjun@coastalresort.com',
  },
  {
    name: 'Sunset Shack',
    category: PropertyCategory.HOSTEL,
    description: 'Chill backpacker hostel in South Goa. Yoga sessions, beach walks, and a vibrant common area.',
    city: 'Goa', address: 'Palolem Beach, South Goa, Goa 403702',
    lat: 15.0100, lng: 74.0230, starRating: 2,
    amenities: ['beach_access', 'common_kitchen', 'wifi', 'locker', 'ac'],
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
    ownerKey: 'arjun@coastalresort.com',
  },
  {
    name: 'The Goa Boutique',
    category: PropertyCategory.HOTEL,
    description: 'Stylish boutique hotel with a rooftop bar and curated local art. Walking distance from Anjuna Flea Market.',
    city: 'Goa', address: 'Anjuna, North Goa, Goa 403509',
    lat: 15.5748, lng: 73.7401, starRating: 4,
    amenities: ['pool', 'restaurant', 'bar', 'wifi', 'ac', 'rooftop'],
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
    ownerKey: 'arjun@coastalresort.com',
  },
];

export async function seedProperties(
  prisma:  PrismaClient,
  userIds: Record<string, string>,
): Promise<string[]> {
  console.log('🌱 Seeding properties...');
  const propertyIds: string[] = [];

  for (const p of PROPERTIES) {
    const existing = await prisma.property.findFirst({
      where: { name: p.name, ownerId: userIds[p.ownerKey] },
    });

    const property = existing ?? await prisma.property.create({
      data: {
        ownerId:    userIds[p.ownerKey],
        name:       p.name,
        category:   p.category,
        description: p.description,
        city:       p.city,
        address:    p.address,
        lat:        p.lat,
        lng:        p.lng,
        starRating: p.starRating,
        status:     PropertyStatus.ACTIVE,
        amenities:  p.amenities,
      },
    });

    // Create cover image
    const imageExists = await prisma.propertyImage.findFirst({ where: { propertyId: property.id } });
    if (!imageExists) {
      await prisma.propertyImage.create({
        data: { propertyId: property.id, url: p.image, tag: ImageTag.EXTERIOR, sortOrder: 0 },
      });
    }

    propertyIds.push(property.id);
    console.log(`  ✅ [${p.category}] ${p.name} — ${p.city}`);
  }

  return propertyIds;
}
