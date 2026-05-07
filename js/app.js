// ─── App state ────────────────────────────────────────────────
let editingId = null;
let selectedColor = 0;
let sortDropdownOpen = false;
// Note: detailId, searchQuery, activeFilter, activeSort, activeView are declared in render.js

// ─── Render dispatcher ────────────────────────────────────────
function renderCurrentView() {
  if (activeView === 'cards') renderGrid();
  else if (activeView === 'overview') renderOverview();
  else if (activeView === 'map') renderMap();
  else if (activeView === 'calendar') renderCalendar();
}

// ─── View switching ───────────────────────────────────────────
function switchView(view) {
  activeView = view;
  document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.toggle('active', b.dataset.view === view));

  const isCards = view === 'cards';
  document.getElementById('headerSearch').style.display = isCards ? '' : 'none';
  document.getElementById('grid').style.display = isCards ? '' : 'none';
  document.getElementById('overviewContainer').style.display = view === 'overview' ? '' : 'none';
  document.getElementById('mapContainer').style.display = view === 'map' ? '' : 'none';
  document.getElementById('calendarContainer').style.display = view === 'calendar' ? '' : 'none';

  renderCurrentView();
}

// ─── Color row ────────────────────────────────────────────────
function buildColorRow() {
  const row = document.getElementById('colorRow');
  row.innerHTML = COLORS.map((c, i) => {
    const meaning = colorMeanings[i] ? `<span class="color-swatch-label">${esc(colorMeanings[i])}</span>` : '';
    return `<div class="color-swatch-wrap">
      <div class="color-swatch${i === selectedColor ? ' selected' : ''}" data-idx="${i}" style="background:${c.bg}" title="${esc(colorMeanings[i] || '')}"></div>
      ${meaning}
    </div>`;
  }).join('');
  row.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', () => { selectedColor = +sw.dataset.idx; buildColorRow(); });
  });
}

// ─── Edit modal ───────────────────────────────────────────────
function openEdit(id) {
  editingId = id || null;
  const c = id ? contacts.find(x => x.id === id) : null;

  document.getElementById('editModalTitle').textContent = c ? 'Edit Contact' : 'New Contact';
  document.getElementById('deleteBtn').style.display = c ? '' : 'none';

  selectedColor = c?.colorIdx ?? 0;
  buildColorRow();

  const fields = ['name','codeword','expertise','location','context','lastSpoken','stage',
    'painPoints','goals','funFacts','email','phone','linkedin','twitter','instagram',
    'website','notes','actionType','nextAction','actionDue','howUseful','howYouHelp',
    'convStatus','convPlatform','convTopic',
    'meetingStatus','meetingDate','meetingTime','meetingVenue',
    'networkType','inCommon'];
  fields.forEach(f => {
    const el = document.getElementById('f-' + f);
    if (el) el.value = c ? (c[f] || '') : '';
  });

  if (!c) document.getElementById('f-lastSpoken').value = todayStr();

  closeDetail();
  document.getElementById('editOverlay').classList.add('open');
  setTimeout(() => document.getElementById('f-name').focus(), 320);
}

function closeEdit() {
  document.getElementById('editOverlay').classList.remove('open');
  editingId = null;
}

// ─── Sort dropdown ────────────────────────────────────────────
function toggleSortDropdown() {
  sortDropdownOpen = !sortDropdownOpen;
  const dd = document.getElementById('sortDropdown');
  dd.classList.toggle('open', sortDropdownOpen);
}

function closeSortDropdown() {
  sortDropdownOpen = false;
  document.getElementById('sortDropdown').classList.remove('open');
}

// ─── Demo data ────────────────────────────────────────────────
function seedDemoData() {
  const demos = [
    {
      name: 'Maya Chen',
      codeword: 'Rocket Maya',
      expertise: 'Marketing, Growth, B2B SaaS',
      location: 'San Francisco, CA',
      context: 'Met at SaaStr Annual 2024. Sat at the same table during the GTM workshop.',
      lastSpoken: '2026-04-20',
      stage: 'active',
      networkType: 'professional',
      painPoints: 'Struggling to break into enterprise deals with a PLG motion.',
      goals: 'Wants to hit $3M ARR by EOY, exploring partnerships as a growth lever.',
      funFacts: 'Climbed Kilimanjaro last year\nObsessed with specialty coffee\nFormerly a jazz drummer',
      email: 'maya@example.com',
      linkedin: 'linkedin.com/in/mayachen',
      twitter: '@mayabuilds',
      colorIdx: 0,
      actionType: 'intro',
      nextAction: 'Intro her to Jordan — he needs GTM help and she loves community-led growth',
      actionDue: '2026-05-15',
      howUseful: 'Deep PLG expertise, knows every growth hacker in SaaS',
      howYouHelp: 'Can connect her with enterprise sales coaches in your network',
      convStatus: 'follow-up',
      convPlatform: 'linkedin',
      convTopic: 'Discussing potential co-marketing around her Series A announcement',
      meetingStatus: 'confirmed',
      meetingDate: '2026-05-20',
      meetingTime: '14:00',
      meetingVenue: 'Blue Bottle Coffee, SOMA',
    },
    {
      name: 'Jordan Okafor',
      codeword: 'DevRel Jordan',
      expertise: 'Engineering, Computer Science, APIs',
      location: 'London, UK',
      context: 'DMs on X after I wrote a thread about onboarding flows.',
      lastSpoken: '2026-03-05',
      stage: 'warm',
      networkType: 'professional',
      painPoints: 'Burning out on conference travel. Wants async community building.',
      goals: 'Building a newsletter to own his audience.',
      funFacts: 'Has a podcast with 12k listeners\nCooks Nigerian dishes every Sunday\nLearning Rust for fun',
      linkedin: 'linkedin.com/in/jordanokafor',
      twitter: '@jordandevrel',
      website: 'jordanokafor.com',
      colorIdx: 2,
      actionType: 'follow-up',
      nextAction: 'Follow up on newsletter idea — offered to share my audience for a collab issue',
      actionDue: '2026-05-10',
      howUseful: 'Huge developer audience, intro to API-first founders',
      howYouHelp: 'Can share distribution and intro to podcast sponsors',
      convStatus: 'waiting',
      convPlatform: 'x',
      convTopic: 'Newsletter collab — sent a draft outline, waiting for his feedback',
      meetingStatus: 'potential',
      meetingDate: '2026-06-10',
      meetingVenue: 'Zoom',
    },
    {
      name: 'Sara Lindqvist',
      codeword: 'VC Sara',
      expertise: 'Finance, Venture Capital, FinTech',
      location: 'Stockholm, Sweden',
      context: 'Introduced by Alex at the Nordic Founders dinner in Stockholm.',
      lastSpoken: '2025-11-10',
      stage: 'dormant',
      networkType: 'professional',
      painPoints: 'LP relationships harder to manage as fund size grows.',
      goals: 'Launching Fund III, focused on climate fintech.',
      funFacts: 'Trained as an opera singer before finance\nRuns half-marathons in a different country each year\nKeeps a bullet journal',
      email: 'sara@example.vc',
      linkedin: 'linkedin.com/in/saralindqvist',
      phone: '+46 70 000 0000',
      colorIdx: 3,
      actionType: 'message',
      nextAction: 'Reconnect — send a warm check-in with the climate fintech angle',
      actionDue: '2026-04-20',
      howUseful: 'Climate fintech deal flow, LP network, strategic advice on fundraising',
      howYouHelp: 'Can provide intro to deep tech founders seeking Series A',
    },
    {
      name: 'Priya Nair',
      codeword: 'Figma Priya',
      expertise: 'Design, Product Design, UX Research',
      location: 'Mumbai, India',
      context: 'Workshop facilitator at Config 2024. Incredibly generous with her knowledge.',
      lastSpoken: '2026-04-30',
      stage: 'active',
      networkType: 'professional',
      painPoints: 'Design system adoption across engineering teams.',
      goals: 'Writing a book on enterprise design systems.',
      funFacts: 'Has illustrated two children\'s books\nBig fan of Bauhaus\nMakes sourdough every weekend',
      email: 'priya@example.design',
      instagram: '@priyadesigns',
      linkedin: 'linkedin.com/in/priyanair',
      colorIdx: 7,
      actionType: 'share',
      nextAction: 'Share the design tokens article I bookmarked',
      howUseful: 'Design system expertise for product redesign, could lead a workshop',
      howYouHelp: 'Can co-author chapters on the engineering side of design systems',
      convStatus: 'active',
      convPlatform: 'whatsapp',
      convTopic: 'She is reviewing my design system draft',
    },
    {
      name: 'Amir Hassan',
      codeword: 'Climate Amir',
      expertise: 'Climate Sciences, Environmental Policy',
      location: 'Cairo, Egypt',
      context: 'Met at COP climate innovation day. Passionate about clean water access.',
      lastSpoken: '2026-02-14',
      stage: 'warm',
      networkType: 'professional',
      painPoints: 'Bridging academic research and actual policy change in MENA.',
      goals: 'Launch a climate tech accelerator focused on the African continent.',
      funFacts: 'Speaks 5 languages\nDeep sea diver\nPhotographs industrial ruins',
      email: 'amir@example.org',
      linkedin: 'linkedin.com/in/amirhassan',
      colorIdx: 6,
      howUseful: 'Gateway to African climate policy networks, COP connections',
      howYouHelp: 'Can connect with impact investors in your network',
      convStatus: 'follow-up',
      convPlatform: 'email',
      convTopic: 'Discussing collaboration on a white paper about clean tech in MENA',
    },
    {
      name: 'Lena Kovacs',
      codeword: 'HR Lena',
      expertise: 'HR, People Ops, Organisational Design',
      location: 'Vienna, Austria',
      context: 'Connected on LinkedIn after she wrote a viral post on async work cultures.',
      lastSpoken: '2026-01-20',
      stage: 'new',
      networkType: 'professional',
      painPoints: 'Getting leadership buy-in for remote-first policies.',
      goals: 'Build the definitive playbook for distributed team management.',
      funFacts: 'Former competitive chess player\nCooks elaborate Sunday brunches\nLearning classical guitar',
      email: 'lena@example.hr',
      linkedin: 'linkedin.com/in/lenakovacs',
      colorIdx: 4,
      howUseful: 'Expert in distributed team design, intro to progressive CEOs',
      howYouHelp: 'Can share startup org design case studies from your portfolio',
    },
    {
      name: 'Tom Watkins',
      codeword: 'Old Flatmate Tom',
      expertise: 'Healthcare, Biotech',
      location: 'Boston, MA',
      context: 'University flatmate from undergrad. Went into medicine, now building biotech.',
      lastSpoken: '2026-03-28',
      stage: 'close',
      networkType: 'personal',
      inCommon: 'Same undergrad cohort, love of 90s hip-hop, both have dogs',
      painPoints: 'FDA approval timelines crushing startup runway.',
      goals: 'Get first biotech product through Phase 2 trials.',
      funFacts: 'Ran a marathon every month for a year\nHas a rescue greyhound named Disco\nStill plays drums in a band',
      email: 'tom@example.bio',
      phone: '+1 617 000 0000',
      colorIdx: 1,
      howUseful: 'Deep biotech regulatory knowledge, intro to hospital network',
      howYouHelp: 'Can help with pitch deck narrative and investor storytelling',
      convStatus: 'active',
      convPlatform: 'whatsapp',
      convTopic: 'Planning a trip together to Portugal next summer',
      meetingStatus: 'potential',
      meetingDate: '2026-07-15',
      meetingVenue: 'Lisbon',
    },
    {
      name: 'Yuki Tanaka',
      codeword: 'Generative Yuki',
      expertise: 'Computer Science, AI, Machine Learning',
      location: 'Tokyo, Japan',
      context: 'Met at NeurIPS. She gave the best lightning talk on diffusion models.',
      lastSpoken: '2026-04-05',
      stage: 'warm',
      networkType: 'professional',
      painPoints: 'Publishing research vs moving fast in industry — caught between two worlds.',
      goals: 'Build the research lab she always wanted, adjacent to a product company.',
      funFacts: 'Competitive origami folder\nMaintains a koi pond\nBuilds mechanical keyboards from scratch',
      email: 'yuki@example.ai',
      linkedin: 'linkedin.com/in/yukitanaka',
      twitter: '@yukiai',
      colorIdx: 9,
      actionType: 'call',
      nextAction: 'Schedule a call to discuss potential advisory role',
      actionDue: '2026-05-25',
      howUseful: 'Leading ML research, intro to academic collaborators for AI safety',
      howYouHelp: 'Can advise on go-to-market for research spinouts',
      convStatus: 'arranging',
      convPlatform: 'email',
      convTopic: 'Arranging a call to discuss advisory board opportunity',
    },
    {
      name: 'Claire Dubois',
      codeword: 'Paris Claire',
      expertise: 'Marketing, Brand Strategy',
      location: 'Paris, France',
      context: 'Sat next to each other at a dinner party at a mutual friend\'s place in Paris.',
      lastSpoken: '2026-04-15',
      stage: 'warm',
      networkType: 'both',
      inCommon: 'Both love Parisian jazz bars, share a passion for brutalist architecture',
      painPoints: 'Brand strategy for tech companies that want cultural credibility.',
      goals: 'Launch her own boutique brand consultancy by end of year.',
      funFacts: 'Former professional cyclist\nSpeaks four languages\nKeeps a wine cellar',
      email: 'claire@example.fr',
      instagram: '@clairedubois',
      colorIdx: 5,
      howUseful: 'Deep brand and marketing expertise for European audiences',
      howYouHelp: 'Can connect her with tech founders who need brand work',
    },
    {
      name: 'David Nkosi',
      codeword: 'Joburg David',
      expertise: 'Finance, Impact Investing, ESG',
      location: 'Johannesburg, South Africa',
      context: 'Met at the Africa Investment Forum. He had the most grounded take on impact metrics.',
      lastSpoken: '2025-12-10',
      stage: 'dormant',
      networkType: 'professional',
      painPoints: 'ESG metrics are too Western-centric for African market contexts.',
      goals: 'Build an Africa-first impact fund that uses locally relevant metrics.',
      funFacts: 'Marathoner\nBuilds community radio stations as a hobby project\nLearning Mandarin',
      email: 'david@example.africa',
      linkedin: 'linkedin.com/in/davidnkosi',
      colorIdx: 8,
      actionType: 'message',
      nextAction: 'Reconnect with the ESG article that directly addresses his concerns',
      actionDue: '2026-05-20',
      howUseful: 'Gateway to African investment community, deep ESG expertise',
      howYouHelp: 'Can share Western LP network who have Africa mandates',
    },
  ];

  demos.forEach(d => {
    contacts.push({ id: uid(), addedAt: Date.now() - Math.random() * 1e8, ...d });
  });
  save();
}

// ─── Boot ─────────────────────────────────────────────────────
load();
if (contacts.length === 0) seedDemoData();

// View toggle (desktop)
document.querySelector('.view-toggle').addEventListener('click', e => {
  const btn = e.target.closest('.view-btn');
  if (btn) switchView(btn.dataset.view);
});

// Bottom nav (mobile)
document.getElementById('bottomNav').addEventListener('click', e => {
  const btn = e.target.closest('.nav-item');
  if (btn) switchView(btn.dataset.view);
});

// Save button
document.getElementById('saveBtn').addEventListener('click', () => {
  const name = document.getElementById('f-name').value.trim();
  if (!name) {
    const el = document.getElementById('f-name');
    el.focus();
    el.style.outline = '2px solid var(--red)';
    setTimeout(() => el.style.outline = '', 1500);
    toast('Name is required');
    return;
  }

  const fields = ['name','codeword','expertise','location','context','lastSpoken','stage',
    'painPoints','goals','funFacts','email','phone','linkedin','twitter','instagram',
    'website','notes','actionType','nextAction','actionDue','howUseful','howYouHelp',
    'convStatus','convPlatform','convTopic',
    'meetingStatus','meetingDate','meetingTime','meetingVenue',
    'networkType','inCommon'];
  const data = {};
  fields.forEach(f => {
    const el = document.getElementById('f-' + f);
    if (el) data[f] = el.value.trim();
  });
  data.colorIdx = selectedColor;

  if (editingId) {
    const idx = contacts.findIndex(c => c.id === editingId);
    contacts[idx] = { ...contacts[idx], ...data };
    toast('Contact updated');
  } else {
    contacts.push({ id: uid(), addedAt: Date.now(), ...data });
    toast('Contact added');
  }

  save();
  closeEdit();
  renderCurrentView();
});

document.getElementById('cancelBtn').addEventListener('click', closeEdit);
document.getElementById('editClose').addEventListener('click', closeEdit);
document.getElementById('editOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('editOverlay')) closeEdit();
});

// Delete
document.getElementById('deleteBtn').addEventListener('click', () => {
  const c = contacts.find(x => x.id === editingId);
  document.getElementById('confirmText').textContent = `"${c?.name}" will be permanently removed.`;
  document.getElementById('confirmOverlay').classList.add('open');
});

document.getElementById('confirmCancel').addEventListener('click', () => {
  document.getElementById('confirmOverlay').classList.remove('open');
});

document.getElementById('confirmOk').addEventListener('click', () => {
  contacts = contacts.filter(c => c.id !== editingId);
  save();
  document.getElementById('confirmOverlay').classList.remove('open');
  closeEdit();
  renderCurrentView();
  toast('Deleted');
});

// Detail modal
document.getElementById('detailClose').addEventListener('click', closeDetail);
document.getElementById('detailOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('detailOverlay')) closeDetail();
});
document.getElementById('detailEditBtn').addEventListener('click', () => {
  const id = detailId; closeDetail(); openEdit(id);
});

// FAB
document.getElementById('fabBtn').addEventListener('click', () => openEdit(null));

// Search
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  searchClear.classList.toggle('visible', searchQuery.length > 0);
  renderGrid();
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  searchClear.classList.remove('visible');
  renderGrid();
  searchInput.focus();
});

// Filters
document.getElementById('filtersWrap').addEventListener('click', e => {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  activeFilter = chip.dataset.filter;
  renderGrid();
});

// Sort dropdown
document.getElementById('sortDropdownBtn').addEventListener('click', e => {
  e.stopPropagation();
  toggleSortDropdown();
});

document.getElementById('sortDropdown').addEventListener('click', e => {
  const opt = e.target.closest('.sort-option');
  if (!opt) return;
  activeSort = opt.dataset.sort;
  document.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
  opt.classList.add('active');
  document.getElementById('sortDropdownBtn').querySelector('.sort-dropdown-label').textContent = opt.textContent.trim();
  closeSortDropdown();
  renderGrid();
});

document.addEventListener('click', e => {
  if (!e.target.closest('#sortDropdownBtn') && !e.target.closest('#sortDropdown')) {
    closeSortDropdown();
  }
});

// Color guide
document.getElementById('colorGuideBtn').addEventListener('click', openColorGuide);
document.getElementById('colorGuideClose').addEventListener('click', closeColorGuide);
document.getElementById('colorGuideOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('colorGuideOverlay')) closeColorGuide();
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (document.getElementById('confirmOverlay').classList.contains('open')) {
      document.getElementById('confirmOverlay').classList.remove('open');
    } else if (document.getElementById('colorGuideOverlay').classList.contains('open')) {
      closeColorGuide();
    } else if (document.getElementById('editOverlay').classList.contains('open')) {
      closeEdit();
    } else if (document.getElementById('detailOverlay').classList.contains('open')) {
      closeDetail();
    }
  }
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); searchInput.focus(); searchInput.select(); }
  if ((e.metaKey || e.ctrlKey) && e.key === 'n') { e.preventDefault(); openEdit(null); }
});

// Map resize
let mapResizeTimer;
window.addEventListener('resize', () => {
  if (activeView === 'map') {
    clearTimeout(mapResizeTimer);
    mapResizeTimer = setTimeout(renderMap, 150);
  }
});

renderCurrentView();
