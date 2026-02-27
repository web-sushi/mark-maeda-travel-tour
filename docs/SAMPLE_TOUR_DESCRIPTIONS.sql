-- Sample Tour Description Format for Supabase
-- Copy this format when adding or updating tour descriptions

-- Example 1: Mount Fuji & Hakone Tour
UPDATE tours
SET description = 'Discover the beauty of Mount Fuji and the historic town of Hakone on this comprehensive day tour. Enjoy stunning views, hot springs, and traditional Japanese culture.

Tour Highlights:
✨ Visit iconic Mount Fuji 5th Station (weather permitting)
✨ Cruise across Lake Ashi with views of Mount Fuji
🏯 Explore Hakone Shrine with its famous torii gate
🚡 Ride the Hakone Ropeway for panoramic mountain views
♨️ Experience a traditional Japanese hot spring (onsen)

Duration:
Approximately 10-12 hours (hotel pick-up to drop-off)

Detailed Sample Itinerary:
08:00 AM - Hotel pick-up in Tokyo
09:30-10:30 AM - Mount Fuji 5th Station visit
11:00 AM - Traditional Japanese lunch
12:30-01:30 PM - Lake Ashi cruise
02:00-03:00 PM - Hakone Shrine visit
03:30 PM - Hakone Ropeway experience
05:00 PM - Depart for Tokyo
07:00 PM - Hotel drop-off

What''s Included:
✅ Hotel pick-up and drop-off in central Tokyo
✅ English-speaking professional guide
✅ Private air-conditioned vehicle
✅ Lake Ashi cruise ticket
✅ Hakone Ropeway ticket
✅ All tolls and parking fees
✅ Bottled water

What''s NOT Included:
❌ Lunch and dinner
❌ Personal expenses
❌ Travel insurance
❌ Gratuities (optional)

What to Bring:
🎒 Comfortable walking shoes
🎒 Weather-appropriate clothing
🎒 Camera for photos
🎒 Sun protection (hat, sunglasses, sunscreen)
🎒 Cash for personal purchases

Perfect For:
First-time visitors to Japan, Families with children, Photography enthusiasts, Nature lovers, Cultural explorers

Meeting Point:
Pick-up from your hotel in central Tokyo (Shibuya, Shinjuku, Ginza areas). Specific meeting point will be confirmed upon booking.

Age Restrictions:
This tour is suitable for all ages. Children under 3 years old are free of charge but must share seating with parents.

Important Notes:
❗️ Mount Fuji 5th Station access depends on weather conditions
❗️ The tour may be modified due to weather or traffic
❗️ Please inform us of any dietary restrictions in advance
❗️ Comfortable walking shoes are essential
❗️ The itinerary is subject to change based on seasonal conditions'
WHERE slug = 'mount-fuji-hakone-tour';


-- Example 2: Kyoto Cultural Tour (simplified format without emojis)
UPDATE tours
SET description = 'Experience the timeless beauty of Kyoto on this cultural exploration. Visit ancient temples, traditional gardens, and historic districts.

Tour Highlights:
- Visit Kinkaku-ji (Golden Pavilion)
- Explore Fushimi Inari Shrine with thousands of torii gates
- Walk through the historic Gion district
- Traditional Japanese tea ceremony experience
- Bamboo grove in Arashiyama

Duration:
Full day tour (8 hours)

Detailed Sample Itinerary:
09:00 AM - Hotel pick-up in Kyoto
09:30-10:30 AM - Kinkaku-ji (Golden Pavilion)
11:00 AM-12:00 PM - Fushimi Inari Shrine
12:30 PM - Traditional Kyoto lunch
02:00-03:00 PM - Gion district walking tour
03:30-04:30 PM - Tea ceremony experience
05:00 PM - Hotel drop-off

What''s Included:
- Private air-conditioned vehicle
- English-speaking guide
- All entrance fees
- Tea ceremony experience
- Bottled water

What''s NOT Included:
- Lunch (recommendations provided)
- Personal shopping
- Hotel accommodation
- Travel insurance

What to Bring:
- Comfortable walking shoes
- Camera
- Cash for purchases
- Weather-appropriate clothing

Perfect For:
Culture enthusiasts, History buffs, Photography lovers, Couples, Solo travelers

Meeting Point:
Pick-up from your hotel in Kyoto city center. Meeting time will be confirmed 24 hours before the tour.

Age Restrictions:
Suitable for all ages. Please note that some temples require climbing stairs.

Important Notes:
- Dress modestly when visiting temples (covered shoulders and knees)
- Some areas may be crowded during peak season
- The tea ceremony is conducted in a traditional setting with floor seating
- Tours may be modified due to weather or temple events'
WHERE slug = 'kyoto-cultural-tour';


-- Example 3: Tokyo Food Tour (minimal format)
UPDATE tours
SET description = 'Discover Tokyo''s incredible food scene on this culinary adventure through local neighborhoods.

Tour Highlights:
- Taste authentic ramen, sushi, and yakitori
- Visit local markets and food stalls
- Learn about Japanese food culture
- Try seasonal specialties
- Meet local chefs and vendors

Duration:
4 hours

Detailed Sample Itinerary:
06:00 PM - Meet at Shibuya Station
06:15 PM - First food stop: Ramen shop
06:45 PM - Visit local market
07:15 PM - Yakitori alley experience
07:45 PM - Sushi restaurant
08:30 PM - Dessert stop
09:00 PM - Tour ends at Shibuya

What''s Included:
- All food tastings (7-8 dishes)
- Local guide
- Market tour
- Cultural insights

What''s NOT Included:
- Additional food or drinks
- Transportation to/from meeting point
- Gratuities

What to Bring:
- Comfortable shoes for walking
- Appetite!
- Camera

Perfect For:
Food lovers, Couples, Small groups, Adventurous eaters

Meeting Point:
Shibuya Station Hachiko Exit. Look for guide holding "Tokyo Food Tour" sign.

Age Restrictions:
Ages 12 and up. Some restaurants serve alcohol.

Important Notes:
- Please inform us of any dietary restrictions or allergies
- Comfortable walking shoes required
- Some venues may be small and crowded
- Tour operates rain or shine'
WHERE slug = 'tokyo-food-tour';


-- Tips for formatting:
-- 1. Use consistent heading formats (capitalize first letter)
-- 2. Add emojis for visual appeal (optional)
-- 3. Each section should be on a new line
-- 4. Use bullets (-, •, ✅, ❌) for lists
-- 5. For itinerary, use "HH:MM AM/PM - Description" format
-- 6. Separate sections with blank lines (optional)
-- 7. Use single quotes in SQL and escape them with '' for apostrophes
