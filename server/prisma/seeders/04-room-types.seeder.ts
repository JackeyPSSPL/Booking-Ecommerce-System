import { PrismaClient, CancellationPolicy, MealPlan, RatePlanType } from '@prisma/client';

// Plan's MODERATE → FLEXIBLE, STRICT → NON_REFUNDABLE (our enum only has those two)
type RoomTemplate = {
  name: string;
  description: string;
  maxOccupancy: number;
  basePrice: number;
  cancellationPolicy: CancellationPolicy;
  mealPlan?: MealPlan;
};

const ROOM_TYPE_MAP: Record<string, RoomTemplate[]> = {
  'Grand Palace Hotel': [
    { name: 'Presidential Suite',  description: 'Opulent 120 sqm suite with private butler, jacuzzi, and panoramic city views.', maxOccupancy: 3, basePrice: 18000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Deluxe Double',       description: 'Spacious 45 sqm room with king bed, marble bathroom, and city or pool view.',    maxOccupancy: 2, basePrice: 8500,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Twin',       description: '35 sqm room with two single beds, ideal for colleagues or friends.',             maxOccupancy: 2, basePrice: 5500,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Heritage Haveli': [
    { name: 'Royal Suite',         description: 'The grandest room in the haveli — antique furniture, hand-painted walls, private courtyard.', maxOccupancy: 2, basePrice: 12000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Heritage Double',     description: 'A double room with original jharokha windows and Gujarati block-print textiles.',              maxOccupancy: 2, basePrice: 6500,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Heritage Single',     description: 'Compact room with traditional Gujarati design, perfect for solo travellers.',                  maxOccupancy: 1, basePrice: 4000,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'The Business Suite': [
    { name: 'Executive Suite',     description: 'Dedicated work area, dual monitors, ergonomic chair, and lounge space.',  maxOccupancy: 2, basePrice: 9500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Superior Double',     description: 'Modern room with dedicated high-speed ethernet, work desk, blackout curtains.', maxOccupancy: 2, basePrice: 5500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Room',       description: 'Clean, functional room ideal for short business stays.',                  maxOccupancy: 1, basePrice: 3500, cancellationPolicy: CancellationPolicy.NON_REFUNDABLE },
  ],
  'Budget Inn Express': [
    { name: 'Private Room',        description: 'Cozy private room with double bed and locker — privacy at hostel prices.', maxOccupancy: 2, basePrice: 1800, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (6-bed)',  description: '6-bed mixed dormitory with individual reading lights and lockers.',        maxOccupancy: 6, basePrice: 800,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (10-bed)', description: 'Budget 10-bed dorm for solo backpackers.',                                maxOccupancy: 10, basePrice: 500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Mountain View Resort': [
    { name: 'Villa Suite',         description: 'Stand-alone villa with private deck, outdoor jacuzzi, and panoramic Himalayan views.', maxOccupancy: 4, basePrice: 22000, cancellationPolicy: CancellationPolicy.FLEXIBLE, mealPlan: MealPlan.BREAKFAST },
    { name: 'Premium Cottage',     description: 'Wooden cottage with stone fireplace, king bed, and private balcony.',                maxOccupancy: 2, basePrice: 12000, cancellationPolicy: CancellationPolicy.FLEXIBLE, mealPlan: MealPlan.BREAKFAST },
    { name: 'Garden Room',         description: 'Warm room with garden access and mountain glimpses — great value.',                  maxOccupancy: 2, basePrice: 7500,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Snow Peak Cottages': [
    { name: 'Cottage Deluxe',      description: 'Apple orchard-facing cottage with wooden interior and bonfire pit.', maxOccupancy: 3, basePrice: 11000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mountain View Room',  description: 'En-suite room with floor-to-ceiling windows framing snow-capped peaks.', maxOccupancy: 2, basePrice: 7000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Cottage',    description: 'Compact cottage, great for solo travellers on a budget.',            maxOccupancy: 2, basePrice: 4500,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Valley Camp': [
    { name: 'Private Tent Room',       description: 'Glamping private tent with real mattress, sleeping bag, and small heater.',  maxOccupancy: 2, basePrice: 1800, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Shared Dorm Tent (6-bed)',description: '6-person dorm tent with individual sleeping bags and lockers.',               maxOccupancy: 6, basePrice: 800,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Budget Dorm (10-bed)',    description: 'Most affordable Himalayan dorm — for adventurers on a tight budget.',        maxOccupancy: 10, basePrice: 500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Pine Wood Lodge': [
    { name: 'Deluxe Room',         description: 'Pine-panelled room with attached bathroom, comfortable queen bed, and heater.', maxOccupancy: 2, basePrice: 4500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Double',     description: 'Clean standard room with double bed and hot water — great value in Manali.',    maxOccupancy: 2, basePrice: 3000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Budget Single',       description: 'Compact single room for solo travellers — functional and affordable.',          maxOccupancy: 1, basePrice: 2000, cancellationPolicy: CancellationPolicy.NON_REFUNDABLE },
  ],
  'Coastal Breeze Resort': [
    { name: 'Beachfront Suite',    description: 'Direct beach access, private plunge pool, and outdoor shower.', maxOccupancy: 3, basePrice: 22000, cancellationPolicy: CancellationPolicy.FLEXIBLE, mealPlan: MealPlan.BREAKFAST },
    { name: 'Pool View Cottage',   description: 'Stylish cottage with private terrace, steps from the infinity pool.', maxOccupancy: 2, basePrice: 12000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Garden Room',         description: 'Lush garden-facing room with tropical décor — great value at a premium resort.', maxOccupancy: 2, basePrice: 7500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Beachfront Villa': [
    { name: 'Full Villa (Exclusive)', description: 'Entire 4-bedroom villa, exclusively yours. Private pool, BBQ, chef on request.', maxOccupancy: 8, basePrice: 35000, cancellationPolicy: CancellationPolicy.NON_REFUNDABLE },
    { name: 'Garden Wing',            description: '2-bedroom wing of the villa with garden and pool access.', maxOccupancy: 4, basePrice: 18000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Pool Cabana Room',        description: 'Standalone cabana right by the pool — intimate, breezy, beachside.', maxOccupancy: 2, basePrice: 10000, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'Sunset Shack': [
    { name: 'Private Room',        description: 'A breezy private room with direct beach view. Best value private in South Goa.', maxOccupancy: 2, basePrice: 1800, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (6-bed)',  description: '6-bed mixed dorm with tropical vibe, individual curtains, and lockers.',         maxOccupancy: 6, basePrice: 800,  cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Mixed Dorm (10-bed)', description: 'The budget option — open dorm with fan, lockers, and free Goa sunrise access.', maxOccupancy: 10, basePrice: 500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
  'The Goa Boutique': [
    { name: 'Rooftop Suite',       description: 'Private rooftop suite with direct access to the bar and 360° Anjuna views.', maxOccupancy: 2, basePrice: 9500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Boutique Double',     description: 'Art-curated room with local artist installations, pool view, and king bed.',  maxOccupancy: 2, basePrice: 5500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
    { name: 'Standard Room',       description: 'Clean boutique standard room — minimal, artsy, and comfortable.',            maxOccupancy: 2, basePrice: 3500, cancellationPolicy: CancellationPolicy.FLEXIBLE },
  ],
};

export type RoomTypeMeta = { roomTypeId: string; propertyId: string; ratePlanId: string };

export async function seedRoomTypes(
  prisma:     PrismaClient,
  properties: Array<{ id: string; name: string }>,
): Promise<RoomTypeMeta[]> {
  console.log('🌱 Seeding room types & rate plans...');
  const metas: RoomTypeMeta[] = [];

  for (const property of properties) {
    const templates = ROOM_TYPE_MAP[property.name];
    if (!templates) continue;

    for (const rt of templates) {
      // Check if room type already exists
      const existing = await prisma.roomType.findFirst({
        where: { propertyId: property.id, name: rt.name },
        include: { ratePlans: { where: { planType: RatePlanType.STANDARD } } },
      });

      let roomTypeId: string;
      let ratePlanId: string;

      if (existing) {
        roomTypeId = existing.id;
        ratePlanId = existing.ratePlans[0]?.id ?? '';
      } else {
        const roomType = await prisma.roomType.create({
          data: {
            propertyId:         property.id,
            name:               rt.name,
            description:        rt.description,
            maxOccupancy:       rt.maxOccupancy,
            basePrice:          rt.basePrice,
            cancellationPolicy: rt.cancellationPolicy,
            mealPlan:           rt.mealPlan ?? MealPlan.NONE,
            bedConfig:          {},
          },
        });
        const ratePlan = await prisma.ratePlan.create({
          data: { roomTypeId: roomType.id, planType: RatePlanType.STANDARD, discountPercent: 0, minNights: 1 },
        });
        roomTypeId = roomType.id;
        ratePlanId = ratePlan.id;
      }

      metas.push({ roomTypeId, propertyId: property.id, ratePlanId });
    }
    console.log(`  ✅ ${property.name} → ${templates.length} room types`);
  }

  return metas;
}
