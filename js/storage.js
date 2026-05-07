// ─── Storage ──────────────────────────────────────────────────
let contacts = [];
let colorMeanings = JSON.parse(localStorage.getItem(COLOR_MEANINGS_KEY) || '["","","","","","","","","",""]');

function load() {
  try { contacts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch (e) { contacts = []; }
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

function saveColorMeanings() {
  localStorage.setItem(COLOR_MEANINGS_KEY, JSON.stringify(colorMeanings));
}
