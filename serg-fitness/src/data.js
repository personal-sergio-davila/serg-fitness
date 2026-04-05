const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
export const TARGETS = { cal: 2300, protein: 190, carbs: 200, fat: 65 }

export const MEALS = {
  breakfast: [
    {
      id: 'b1', name: 'High-protein egg & bean bowl', lane: 'Mexican',
      cal: 400, protein: 38, carbs: 32, fat: 14,
      ingredients: [
        { item: 'Whole eggs', qty: '2' },
        { item: 'Egg whites', qty: '3' },
        { item: 'Refried black beans (no lard)', qty: '4 tbsp' },
        { item: 'Pico de gallo', qty: '3 tbsp' },
        { item: 'Avocado', qty: '1/4' },
        { item: 'Olive oil spray', qty: '1 spray' },
      ],
      micros: 'High in choline (eggs), folate (beans), potassium (avocado). B12 from eggs supports energy metabolism.'
    },
    {
      id: 'b2', name: 'Red pepper egg skillet', lane: 'Mediterranean',
      cal: 350, protein: 34, carbs: 18, fat: 16,
      ingredients: [
        { item: 'Whole eggs', qty: '2' },
        { item: 'Egg whites', qty: '3' },
        { item: 'Roasted red pepper base', qty: '1/2 cup' },
        { item: 'Turkey or chicken sausage', qty: '2 oz' },
        { item: 'Cumin, smoked paprika, garlic', qty: 'to taste' },
      ],
      micros: 'Vitamin C from peppers enhances iron absorption from eggs. Capsaicin mildly boosts metabolism.'
    },
  ],
  shake: [
    {
      id: 's1', name: 'Performance protein shake', lane: 'Daily',
      cal: 400, protein: 48, carbs: 35, fat: 8,
      ingredients: [
        { item: 'Impact Protein powder', qty: '2 scoops' },
        { item: 'Frozen banana (1/2)', qty: '1/2' },
        { item: 'Unsweetened almond milk', qty: '16 oz' },
        { item: 'Chia seeds', qty: '1 tsp' },
        { item: 'Ice', qty: 'handful' },
      ],
      micros: 'Chia seeds add omega-3 ALA, fiber, and calcium. Banana provides potassium for muscle contractions.'
    },
  ],
  dinner: [
    {
      id: 'd1', name: 'Tinga chicken bowl', lane: 'Mexican',
      cal: 555, protein: 52, carbs: 55, fat: 14,
      ingredients: [
        { item: 'Tinga chicken (shredded)', qty: '5 oz' },
        { item: 'White rice (cooked)', qty: '150g' },
        { item: 'Black beans', qty: '1/4 cup' },
        { item: 'Pickled red onion', qty: '2 tbsp' },
        { item: 'Shredded romaine', qty: '1 cup' },
        { item: 'Cotija cheese', qty: '1 tbsp' },
        { item: 'Lime + cilantro', qty: 'to taste' },
        { item: 'Chipotle in adobo', qty: '1-2 peppers' },
      ],
      micros: 'Black beans provide resistant starch that feeds gut bacteria and blunts blood sugar spikes.'
    },
    {
      id: 'd2', name: 'Shawarma chicken hummus bowl', lane: 'Mediterranean',
      cal: 545, protein: 55, carbs: 48, fat: 14,
      ingredients: [
        { item: 'Shawarma chicken breast', qty: '5 oz' },
        { item: 'Quinoa or rice', qty: '1/3 cup dry' },
        { item: 'Hummus (plain)', qty: '2 tbsp' },
        { item: 'Cucumber', qty: '1/2 cup' },
        { item: 'Cherry tomatoes', qty: '1/2 cup' },
        { item: 'Arugula', qty: '1 cup' },
        { item: 'Lemon juice + za\'atar', qty: 'to taste' },
        { item: 'Pickled red onion', qty: '1 tbsp' },
      ],
      micros: 'Za\'atar contains thymol and carvacrol. Arugula is rich in vitamin K and glucosinolates.'
    },
    {
      id: 'd3', name: 'Korean-style beef bowl', lane: 'Korean',
      cal: 560, protein: 50, carbs: 52, fat: 16,
      ingredients: [
        { item: '96% lean ground beef or sirloin', qty: '5 oz' },
        { item: 'Soy sauce (low sodium)', qty: '1.5 tbsp' },
        { item: 'Garlic + ginger', qty: '1 tsp each' },
        { item: 'Sesame oil', qty: '1 tsp' },
        { item: 'Asian pear or Fuji apple', qty: '2 tbsp grated' },
        { item: 'White rice', qty: '1/3 cup dry' },
        { item: 'Shredded cabbage + scallion', qty: '1 cup' },
        { item: 'Cucumber ribbons', qty: '1/2 cup' },
        { item: 'Sesame seeds', qty: '1 tsp' },
        { item: 'Gochujang (optional)', qty: '1 tsp' },
      ],
      micros: 'Ginger reduces DOMS (muscle soreness). Sesame seeds provide zinc — critical for testosterone production.'
    },
    {
      id: 'd4', name: 'Hibachi chicken bowl', lane: 'Japanese',
      cal: 510, protein: 54, carbs: 46, fat: 12,
      ingredients: [
        { item: 'Chicken thigh (trimmed, cubed)', qty: '5 oz' },
        { item: 'Low sodium soy sauce', qty: '1 tbsp' },
        { item: 'Garlic butter', qty: '1/2 tsp' },
        { item: 'Zucchini', qty: '1 cup' },
        { item: 'Mushrooms', qty: '1/2 cup' },
        { item: 'Yellow onion', qty: '1/4' },
        { item: 'White rice', qty: '1/3 cup dry' },
      ],
      micros: 'Mushrooms are the only non-animal source of vitamin D. Zucchini provides B6 essential for protein metabolism.'
    },
    {
      id: 'd5', name: 'Pollo a la plancha bowl', lane: 'Spanish',
      cal: 530, protein: 53, carbs: 50, fat: 12,
      ingredients: [
        { item: 'Chicken breast', qty: '5 oz' },
        { item: 'Smoked paprika, lemon, garlic', qty: 'to taste' },
        { item: 'Quinoa + rice blend', qty: '1/3 cup dry' },
        { item: 'Roasted bell peppers + onion', qty: '1/2 cup' },
        { item: 'Corn (unsalted)', qty: '1/4 cup' },
        { item: 'Arugula', qty: '1 cup' },
        { item: 'Lemon dressing', qty: '1 tbsp' },
        { item: 'Manchego shaved', qty: '1 tsp' },
      ],
      micros: 'Smoked paprika is rich in vitamin A. Quinoa is a complete protein with all 9 essential amino acids.'
    },
    {
      id: 'd6', name: 'Mongolian chicken bowl', lane: 'Chinese',
      cal: 500, protein: 52, carbs: 50, fat: 10,
      ingredients: [
        { item: 'Chicken breast (sliced thin)', qty: '5 oz' },
        { item: 'Low sodium soy sauce', qty: '2 tbsp' },
        { item: 'Brown sugar', qty: '1 tsp' },
        { item: 'Garlic + ginger', qty: '1 tsp each' },
        { item: 'Cornstarch', qty: '1 tsp' },
        { item: 'Broccoli', qty: '1 cup' },
        { item: 'Bell pepper', qty: '1/2 cup' },
        { item: 'White rice', qty: '1/3 cup dry' },
        { item: 'Scallions + sesame seeds', qty: 'to top' },
      ],
      micros: 'Broccoli contains sulforaphane — one of the most studied anti-inflammatory compounds. High in vitamin C for collagen synthesis.'
    },
  ],
  snack: [
    {
      id: 'sn1', name: 'Prime Bites protein brownie', lane: 'Snack',
      cal: 210, protein: 19, carbs: 22, fat: 7,
      ingredients: [{ item: 'Prime Bites protein brownie', qty: '1 bar' }],
      micros: 'Time post-workout or mid-afternoon only. Avoid after 8pm — insulin sensitivity drops.'
    },
  ],
}

export const ALL_MEALS = [...MEALS.breakfast, ...MEALS.shake, ...MEALS.dinner, ...MEALS.snack]

export const LANE_COLORS = prefersDark ? {
  Mexican:       { bg: '#2a1f0a', text: '#FAC775' },
  Mediterranean: { bg: '#0a1f14', text: '#5DCAA5' },
  Korean:        { bg: '#0a1428', text: '#85B7EB' },
  Japanese:      { bg: '#16102a', text: '#AFA9EC' },
  Spanish:       { bg: '#0a1f14', text: '#5DCAA5' },
  Chinese:       { bg: '#0a1428', text: '#85B7EB' },
  Daily:         { bg: '#1a1a1a', text: '#888780' },
  Snack:         { bg: '#1f0f0a', text: '#F0997B' },
} : {
  Mexican:       { bg: '#FAEEDA', text: '#854F0B' },
  Mediterranean: { bg: '#E1F5EE', text: '#085041' },
  Korean:        { bg: '#E6F1FB', text: '#0C447C' },
  Japanese:      { bg: '#EEEDFE', text: '#3C3489' },
  Spanish:       { bg: '#E1F5EE', text: '#085041' },
  Chinese:       { bg: '#E6F1FB', text: '#0C447C' },
  Daily:         { bg: '#F1EFE8', text: '#5F5E5A' },
  Snack:         { bg: '#FAECE7', text: '#712B13' },
}

export const EXERCISES = {
  'Day 1 — Chest': [
    { name: 'Incline dumbbell press', sets: 4, reps: '10-12', home: true, gym: true, tip: '30-45° bench. Slow on the way down (3s). Start 25-30 lb.' },
    { name: 'Flat dumbbell press', sets: 3, reps: '10-12', home: true, gym: true, tip: 'After incline. Full range, don\'t bounce off chest.' },
    { name: 'Cable chest fly (low to high)', sets: 3, reps: '12-15', home: false, gym: true, alt: 'Dumbbell fly on bench', tip: 'Cables set low. Bring hands up and together like hugging a tree upward.' },
    { name: 'Dumbbell lateral raise', sets: 3, reps: '15', home: true, gym: true, tip: 'Lead with elbows. 10-15 lb. Never shrug.' },
    { name: 'Dumbbell curl + overhead tricep extension (superset)', sets: 3, reps: '12 each', home: true, gym: true, tip: 'Back to back, no rest between. 60s after both.' },
    { name: 'Plank hold', sets: 3, reps: '30-45s', home: true, gym: true, tip: 'Squeeze glutes AND core simultaneously. Don\'t let hips sag.' },
  ],
  'Day 2 — Lower + Glutes': [
    { name: 'Hip thrust', sets: 4, reps: '10-12', home: false, gym: true, alt: 'Dumbbell glute bridge (on floor)', tip: 'Drive through heels, squeeze hard at top for 1 full second.' },
    { name: 'Romanian deadlift', sets: 4, reps: '10-12', home: true, gym: true, tip: 'Hinge from hips. Feel stretch in hamstrings not lower back. Start 30-35 lb.' },
    { name: 'Goblet squat', sets: 3, reps: '12', home: true, gym: true, tip: 'Hold DB at chest. Sit between knees. Watch right knee — control depth.' },
    { name: 'Reverse lunge', sets: 3, reps: '10 each leg', home: true, gym: true, tip: 'Step back, not forward. Front knee over ankle. Drive through front heel.' },
    { name: 'Cable kickback', sets: 3, reps: '15 each side', home: false, gym: true, alt: 'Dumbbell donkey kick', tip: 'Hinge forward slightly. Drive leg back and up. Squeeze at top.' },
    { name: 'Standing calf raise', sets: 3, reps: '20', home: true, gym: true, tip: 'Full stretch at bottom, full squeeze at top. 2s each direction.' },
  ],
  'Day 4 — Shoulders + Arms': [
    { name: 'Seated dumbbell shoulder press', sets: 4, reps: '10-12', home: true, gym: true, tip: 'Press up and slightly in. Lower slow 3s. Start 25-30 lb.' },
    { name: 'Lateral raise + front raise (superset)', sets: 3, reps: '15+12', home: true, gym: true, tip: 'Lateral first, then immediately front raise. 10-15 lb. Form over ego.' },
    { name: 'Cable face pull', sets: 3, reps: '15', home: false, gym: true, alt: 'Band pull-apart x30', tip: 'Rope at eye height. Elbows high and wide. This undoes desk posture.' },
    { name: 'Incline dumbbell curl', sets: 3, reps: '10-12', home: true, gym: true, tip: 'Arms hang fully down. Stretch at bottom is the growth signal. 15-20 lb.' },
    { name: 'Hammer curl', sets: 3, reps: '12', home: true, gym: true, tip: 'Thumbs up grip. Elbows pinned. No swinging.' },
    { name: 'Tricep cable pushdown (rope)', sets: 3, reps: '12-15', home: false, gym: true, alt: 'Dumbbell tricep kickback', tip: 'Spread rope at bottom. Elbows pinned. Full extension = full contraction.' },
    { name: 'Overhead tricep extension', sets: 2, reps: '12', home: true, gym: true, tip: 'Both hands on one DB. Lower behind head slowly. Elbows stay in.' },
  ],
  'Day 5 — Back + Glutes': [
    { name: 'Cable lat pulldown (wide grip)', sets: 4, reps: '10-12', home: false, gym: true, alt: 'Dumbbell pullover on bench', tip: 'Lead with elbows. Pull to upper chest. Think elbows to back pockets.' },
    { name: 'Single arm dumbbell row', sets: 4, reps: '10-12 each', home: true, gym: true, tip: 'Pull to hip not shoulder. Full stretch at bottom. 35-40 lb.' },
    { name: 'Hip thrust (Smith machine)', sets: 4, reps: '10-12', home: false, gym: true, alt: 'Heavy dumbbell glute bridge', tip: 'Load heavier than Day 2. This is your progressive overload glute session.' },
    { name: 'Romanian deadlift (heavier)', sets: 3, reps: '8-10', home: true, gym: true, tip: '5 lb heavier than Day 2 if form held. Your heavy RDL day.' },
    { name: 'Cable seated row', sets: 3, reps: '12', home: false, gym: true, alt: 'Bent-over dumbbell row (both arms)', tip: 'Sit tall. Pull to lower chest. Squeeze shoulder blades at end.' },
    { name: 'Abductor machine or banded side walk', sets: 3, reps: '20', home: false, gym: true, alt: 'Banded side walk x15 each way', tip: 'Glute medius burn. Adds shape to the sides of glutes.' },
    { name: 'Hanging knee raise', sets: 3, reps: '12-15', home: false, gym: true, alt: 'Lying leg raise', tip: 'Pull knees to chest slowly. Tuck pelvis at top for ab not hip flexor.' },
  ],
  'Day 6 — Optional Arms': [
    { name: 'Alternating dumbbell curl', sets: 3, reps: '12', home: true, gym: true, tip: 'Supinate (turn palm up) as you curl. Full range.' },
    { name: 'Concentration curl', sets: 2, reps: '12 each', home: true, gym: true, tip: 'Elbow on inner thigh. Squeeze hard at top for peak contraction.' },
    { name: 'Overhead tricep extension', sets: 3, reps: '12', home: true, gym: true, tip: 'Slightly heavier than Day 4 — fresh session.' },
    { name: 'Dumbbell kickback', sets: 2, reps: '15', home: true, gym: true, tip: 'Upper arm parallel to floor. Extend fully. Light weight — finisher.' },
    { name: '21s (dumbbell)', sets: 2, reps: '21', home: true, gym: true, tip: '7 bottom half, 7 top half, 7 full range. Finish strong.' },
  ],
}
