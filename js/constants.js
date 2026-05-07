// ─── Constants ────────────────────────────────────────────────
const STORAGE_KEY = 'nw_contacts_v1';
const COLOR_MEANINGS_KEY = 'nw_color_meanings';

const COLORS = [
  { bg: '#e63946' },
  { bg: '#f4a261' },
  { bg: '#2a9d8f' },
  { bg: '#457b9d' },
  { bg: '#6d597a' },
  { bg: '#e9c46a' },
  { bg: '#264653' },
  { bg: '#c77dff' },
  { bg: '#023e8a' },
  { bg: '#606c38' },
];

const STAGE_LABELS = {
  new:     { label: 'New',        color: '#457b9d' },
  warm:    { label: 'Warming up', color: '#f4a261' },
  active:  { label: 'Active',     color: '#2a9d8f' },
  dormant: { label: 'Gone quiet', color: '#888888' },
  close:   { label: 'Close ally', color: '#6d597a' },
};

const ACTION_LABELS = {
  message:   'Msg',
  reply:     'Rpl',
  'follow-up': 'Fup',
  intro:     'Int',
  call:      'Call',
  meet:      'Meet',
  share:     'Shr',
  other:     'Oth',
};

const ACTION_FULL = {
  message:   'Send message',
  reply:     'Reply',
  'follow-up': 'Follow up',
  intro:     'Make intro',
  call:      'Schedule call',
  meet:      'Meet in person',
  share:     'Share resource',
  other:     'Action',
};

const CONV_STATUS = {
  'follow-up': { label: 'Follow up',       color: '#d4820a' },
  'waiting':   { label: 'Waiting',          color: '#457b9d' },
  'arranging': { label: 'Arranging meetup', color: '#2a9d8f' },
  'active':    { label: 'Active',           color: '#2a9d8f' },
};

const CONV_PLATFORM_LABELS = {
  email: 'Email', linkedin: 'LinkedIn', x: 'X', whatsapp: 'WhatsApp',
  phone: 'Phone', slack: 'Slack', other: '',
};

const MEETING_STATUS = {
  potential: { label: 'Potential', color: '#d4820a' },
  confirmed: { label: 'Confirmed', color: '#2a6049' },
};

const NETWORK_TYPE_LABELS = {
  professional: { label: 'Pro',      color: '#457b9d' },
  personal:     { label: 'Personal', color: '#6d597a' },
  both:         { label: 'Both',     color: '#2a9d8f' },
};

// x = (lon+180)/360*100, y = (90-lat)/180*100
const GEO_CITIES = {
  'london': [50.0, 21.4], 'manchester': [49.4, 20.8], 'edinburgh': [49.1, 19.9],
  'dublin': [48.3, 20.3], 'paris': [50.6, 22.8], 'berlin': [53.7, 20.8],
  'amsterdam': [51.4, 20.8], 'madrid': [49.0, 27.4], 'barcelona': [50.6, 26.8],
  'rome': [53.4, 26.8], 'milan': [52.5, 24.7], 'vienna': [54.6, 23.1],
  'zurich': [52.4, 23.5], 'stockholm': [55.0, 17.1], 'oslo': [53.0, 16.4],
  'copenhagen': [53.5, 19.0], 'helsinki': [56.9, 16.6], 'brussels': [51.7, 22.5],
  'lisbon': [47.5, 28.7], 'athens': [56.6, 28.9], 'istanbul': [58.0, 27.2],
  'moscow': [60.4, 19.0], 'kyiv': [58.5, 21.9], 'warsaw': [55.8, 21.1],
  'prague': [54.0, 22.2], 'budapest': [55.3, 23.2], 'bucharest': [57.8, 25.6],
  'dubai': [65.4, 35.9], 'abu dhabi': [64.8, 36.5], 'riyadh': [62.9, 36.2],
  'tel aviv': [59.7, 32.2], 'cairo': [58.7, 33.3], 'lagos': [51.0, 46.4],
  'nairobi': [60.2, 50.4], 'johannesburg': [57.8, 64.5], 'cape town': [55.1, 68.8],
  'accra': [50.2, 48.1], 'addis ababa': [60.7, 45.6],
  'mumbai': [70.2, 39.4], 'delhi': [71.5, 34.3], 'bangalore': [71.6, 42.8],
  'chennai': [72.3, 42.5], 'kolkata': [74.6, 37.6], 'karachi': [68.6, 36.3],
  'dhaka': [75.1, 37.2], 'islamabad': [68.3, 33.1],
  'new york': [29.4, 27.4], 'nyc': [29.4, 27.4], 'san francisco': [15.8, 29.0],
  'los angeles': [17.2, 31.1], 'la': [17.2, 31.1], 'chicago': [25.7, 26.9],
  'toronto': [27.9, 25.7], 'boston': [30.3, 26.4], 'miami': [27.8, 35.6],
  'seattle': [16.2, 23.4], 'vancouver': [15.8, 22.6], 'washington': [28.6, 28.4],
  'austin': [24.3, 33.5], 'denver': [22.2, 26.9], 'new orleans': [25.8, 33.9],
  'atlanta': [26.9, 31.4], 'houston': [24.2, 33.1], 'san diego': [16.7, 30.0],
  'portland': [16.4, 24.2], 'phoenix': [19.8, 30.3], 'dallas': [23.5, 31.5],
  'mexico city': [22.5, 39.2],
  'bogota': [29.1, 47.4], 'lima': [28.7, 56.7], 'buenos aires': [32.8, 68.5],
  'santiago': [30.5, 67.0], 'sao paulo': [37.1, 62.5], 'rio de janeiro': [37.8, 62.0],
  'singapore': [78.8, 49.3], 'kuala lumpur': [78.3, 47.6], 'bangkok': [77.9, 42.6],
  'jakarta': [79.7, 53.4], 'ho chi minh': [79.6, 44.0], 'manila': [83.6, 41.9],
  'taipei': [83.8, 36.1], 'hong kong': [81.7, 37.9], 'beijing': [82.3, 27.8],
  'shanghai': [83.8, 32.9], 'seoul': [85.3, 29.2], 'tokyo': [88.8, 30.2],
  'osaka': [87.6, 30.7], 'sydney': [92.0, 68.8], 'melbourne': [90.3, 70.4],
  'brisbane': [91.2, 62.5], 'perth': [82.2, 67.5], 'auckland': [98.6, 70.5],
};

// ─── Field Taxonomy ───────────────────────────────────────────
// Used by mind map and overview for hierarchical categorisation
const FIELD_TAXONOMY = [
  { id: 'technology', label: 'Technology',      color: '#457b9d',
    sub: ['Computer Science', 'AI', 'Software', 'Engineering', 'Data Science', 'Product', 'Cybersecurity', 'DevOps', 'Tech'] },
  { id: 'business',   label: 'Business',         color: '#e63946',
    sub: ['Marketing', 'Sales', 'Business Development', 'Strategy', 'Consulting', 'Operations', 'Entrepreneurship', 'Startup', 'Management', 'Brand'] },
  { id: 'finance',    label: 'Finance',           color: '#f4a261',
    sub: ['Finance', 'Investment', 'Banking', 'Fintech', 'Accounting', 'Venture Capital', 'Economics', 'ESG'] },
  { id: 'sciences',   label: 'Sciences',          color: '#2a9d8f',
    sub: ['Climate Sciences', 'Climate', 'Environmental', 'Life Sciences', 'Research', 'Physics', 'Biology', 'Chemistry'] },
  { id: 'creative',   label: 'Creative',          color: '#9b5de5',
    sub: ['Design', 'UX', 'Arts', 'Media', 'Content', 'Architecture', 'Photography', 'Film'] },
  { id: 'people',     label: 'People & Culture',  color: '#606c38',
    sub: ['HR', 'Human Resources', 'Recruiting', 'Healthcare', 'Education', 'Psychology', 'Learning'] },
  { id: 'impact',     label: 'Policy & Impact',   color: '#264653',
    sub: ['Policy', 'NGO', 'Nonprofit', 'Government', 'Sustainability', 'International Relations'] },
];

// Classify a free-text expertise string into taxonomy clusters + subclusters.
// Returns array of { cluster, sub } — one per matched field.
function classifyExpertise(expertiseStr) {
  const parts = (expertiseStr || '').split(',').map(s => s.trim()).filter(Boolean);
  const results = [];
  const seen = new Set();

  parts.forEach(part => {
    const partLow = part.toLowerCase();
    let matched = false;

    for (const cluster of FIELD_TAXONOMY) {
      for (const sub of cluster.sub) {
        const subLow = sub.toLowerCase();
        const words = subLow.split(' ').filter(w => w.length > 3);
        if (partLow.includes(subLow) || subLow.includes(partLow) ||
            words.some(w => partLow.includes(w))) {
          const key = cluster.id + '::' + sub;
          if (!seen.has(key)) { seen.add(key); results.push({ cluster, sub }); }
          matched = true;
          break;
        }
      }
      if (matched) break;
    }

    if (!matched && part) {
      const key = 'other::' + part;
      if (!seen.has(key)) {
        seen.add(key);
        results.push({ cluster: { id: 'other', label: 'Other', color: '#888888', sub: [] }, sub: part });
      }
    }
  });

  if (results.length === 0) {
    results.push({ cluster: { id: 'other', label: 'Other', color: '#888888', sub: [] }, sub: 'Other' });
  }
  return results;
}

function lookupCity(locationStr) {
  if (!locationStr) return null;
  const low = locationStr.toLowerCase();
  for (const [city, coords] of Object.entries(GEO_CITIES)) {
    if (low.includes(city)) return coords;
  }
  return null;
}

// Simplified continent outlines [SVG path string, fillClass]
// Coordinates in 0-1000 x 0-500 viewBox (equirectangular)
const CONTINENT_PATHS = [
  // North America
  'M 38,68 C 115,40 225,38 320,78 L 365,118 L 322,158 L 285,182 L 262,198 L 248,212 L 225,212 C 198,192 172,162 155,128 C 128,98 58,88 38,68 Z',
  // Greenland
  'M 322,18 L 440,14 L 450,44 L 420,90 L 375,102 L 332,82 Z',
  // South America
  'M 295,242 C 342,222 385,248 410,295 L 422,365 L 395,432 L 358,478 L 315,488 L 272,472 L 245,422 L 228,355 L 232,288 Z',
  // Europe
  'M 460,72 C 508,55 562,55 612,75 C 638,92 645,118 625,140 L 590,158 L 562,162 L 538,155 L 512,162 L 482,155 L 462,135 L 452,102 Z',
  // Africa
  'M 462,162 L 542,152 L 598,160 L 658,192 L 672,248 L 668,348 L 642,435 L 595,512 L 548,525 L 490,520 L 452,475 L 432,388 L 438,272 Z',
  // Asia (main + Russia)
  'M 598,58 C 718,40 825,44 952,96 L 968,148 L 942,202 L 905,248 L 872,282 L 855,318 L 875,338 L 842,362 L 808,368 L 768,348 L 728,308 L 695,278 L 658,252 L 638,218 L 618,168 L 628,112 L 608,84 Z',
  // Indian Subcontinent
  'M 658,252 L 698,268 L 742,302 L 755,358 L 742,412 L 705,432 L 665,422 L 648,378 L 635,322 L 642,272 Z',
  // SE Asia
  'M 742,302 L 792,308 L 835,338 L 838,382 L 808,408 L 778,398 L 755,368 L 748,335 Z',
  // Japan
  'M 878,122 L 908,128 L 912,168 L 892,182 L 872,162 L 864,132 Z',
  // Australia
  'M 818,298 L 935,278 L 972,318 L 972,398 L 938,442 L 875,452 L 812,422 L 795,368 Z',
  // New Zealand
  'M 972,348 L 984,335 L 995,358 L 988,380 L 975,378 Z',
  // UK/Ireland (small)
  'M 465,75 L 492,68 L 498,95 L 482,102 L 465,92 Z',
];

// Pre-computed SVG string — continent paths never change so this is built once at startup
const CONTINENT_PATHS_SVG = CONTINENT_PATHS.map(d => `<path d="${d}" class="geo-continent" />`).join('');
