// ─── Shared render state (accessible by app.js) ──────────────
let detailId = null;
let searchQuery = '';
let activeFilter = 'all';
let activeSort = 'name';
let activeView = 'cards';

// ─── Helpers ──────────────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function initials(name) {
  return (name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?';
}

function daysSince(dateStr) {
  if (!dateStr) return Infinity;
  return Math.floor((Date.now() - new Date(dateStr + 'T00:00:00').getTime()) / 86400000);
}

function daysUntil(dateStr) {
  if (!dateStr) return Infinity;
  return Math.floor((new Date(dateStr + 'T00:00:00').getTime() - Date.now()) / 86400000);
}

function friendlyDate(dateStr) {
  if (!dateStr) return 'never';
  const d = daysSince(dateStr);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7) return `${d}d ago`;
  if (d < 30) return `${Math.floor(d/7)}w ago`;
  if (d < 365) return `${Math.floor(d/30)}mo ago`;
  return `${Math.floor(d/365)}y ago`;
}

function friendlyDue(dateStr) {
  if (!dateStr) return '';
  const d = daysUntil(dateStr);
  if (d < 0) return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'due today';
  if (d === 1) return 'due tomorrow';
  if (d < 7) return `due in ${d}d`;
  return `due ${dateStr}`;
}

function recencyColor(dateStr) {
  const d = daysSince(dateStr);
  if (d < 14) return '#2a9d8f';
  if (d < 60) return '#f4a261';
  return '#bbbbbb';
}

function esc(str) {
  return (str || '').replace(/[&<>"']/g,
    c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function highlight(text, query) {
  if (!query || !text) return esc(text || '');
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return esc(text).replace(new RegExp(`(${safe})`, 'gi'), '<mark>$1</mark>');
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2000);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function primaryExpertise(c) {
  return (c.expertise || '').split(',')[0].trim() || 'Other';
}

function getMeetingStatus(key) {
  return MEETING_STATUS[key] || { label: key, color: '#888' };
}

function getConvStatus(key) {
  return CONV_STATUS[key] || { label: key, color: '#888' };
}

function statusPill(label, color, padding) {
  return `<span class="status-pill" style="color:${color};border:1.5px solid ${color};font-family:var(--mono);font-size:8px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;padding:${padding || '1px 5px'};white-space:nowrap">${label}</span>`;
}

function formatMeetingDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch(_) { return dateStr; }
}

function meetingMonthYear(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
  } catch(_) { return ''; }
}

function meetingDay(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.getDate();
  } catch(_) { return ''; }
}

function meetingItem(c) {
  const ms = getMeetingStatus(c.meetingStatus);
  const col = COLORS[c.colorIdx ?? 0];
  const icon = c.meetingStatus === 'confirmed' ? '✦' : '◎';
  const dayOfWeek = c.meetingDate
    ? new Date(c.meetingDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()
    : '';
  return `
    <div class="cal-ticket" data-id="${c.id}">
      <div class="cal-ticket-stripe" style="background:${col.bg}"></div>
      <div class="cal-ticket-date">
        <div class="cal-ticket-dow">${dayOfWeek}</div>
        <div class="cal-ticket-day">${meetingDay(c.meetingDate)}</div>
        <div class="cal-ticket-mon">${meetingMonthYear(c.meetingDate)}</div>
      </div>
      <div class="cal-ticket-divider"></div>
      <div class="cal-ticket-body">
        <div class="cal-ticket-name">${esc(c.name)}</div>
        <div class="cal-ticket-meta">
          <span class="cal-ticket-status ${c.meetingStatus}">${icon} ${ms.label}</span>
          ${c.meetingTime ? `<span class="cal-ticket-time">${esc(c.meetingTime)}</span>` : ''}
        </div>
        ${c.meetingVenue ? `<div class="cal-ticket-venue">📍 ${esc(c.meetingVenue)}</div>` : ''}
      </div>
    </div>`;
}

// ─── Filter + Sort ────────────────────────────────────────────
function getFiltered() {
  let list = [...contacts];
  const q = searchQuery.toLowerCase().trim();

  if (q) {
    list = list.filter(c =>
      [c.name, c.codeword, c.expertise, c.location, c.context, c.funFacts,
       c.notes, c.email, c.stage, c.nextAction, c.howUseful,
       c.convTopic, c.meetingVenue, c.inCommon, c.howYouHelp]
        .some(f => (f || '').toLowerCase().includes(q))
    );
  }

  switch (activeFilter) {
    case 'action':       list = list.filter(c => (c.nextAction || c.actionType)); break;
    case 'recent':       list = list.filter(c => daysSince(c.lastSpoken) <= 14); break;
    case 'no-contact':   list = list.filter(c => daysSince(c.lastSpoken) > 60);  break;
    case 'professional': list = list.filter(c => c.networkType === 'professional'); break;
    case 'personal':     list = list.filter(c => c.networkType === 'personal'); break;
    case 'both':         list = list.filter(c => c.networkType === 'both'); break;
  }

  switch (activeSort) {
    case 'name':      list.sort((a,b) => (a.name||'').localeCompare(b.name||'')); break;
    case 'name-desc': list.sort((a,b) => (b.name||'').localeCompare(a.name||'')); break;
    case 'recent':    list.sort((a,b) => daysSince(a.lastSpoken) - daysSince(b.lastSpoken)); break;
    case 'added':     list.sort((a,b) => (b.addedAt||0) - (a.addedAt||0)); break;
    case 'action':
      list.sort((a,b) => {
        const da = a.actionDue ? new Date(a.actionDue).getTime() : Infinity;
        const db = b.actionDue ? new Date(b.actionDue).getTime() : Infinity;
        return da - db;
      });
      break;
  }

  return list;
}

// ─── Render grid ──────────────────────────────────────────────
function renderGrid() {
  const list = getFiltered();
  const grid = document.getElementById('grid');
  const q = searchQuery.toLowerCase().trim();

  document.getElementById('countBadge').textContent =
    contacts.length === 1 ? '1 contact' : `${contacts.length} contacts`;

  if (contacts.length === 0) {
    grid.innerHTML = `
      <div class="empty">
        <div class="empty-title">Your network starts here.</div>
        <div class="empty-sub">Hit the + button to add your first person.</div>
      </div>`;
    return;
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="no-results">
        <div class="no-results-title">Nothing found.</div>
        <div class="no-results-sub">Try different words or clear the filter.</div>
      </div>`;
    return;
  }

  grid.innerHTML = list.map((c, i) => {
    const col = COLORS[c.colorIdx ?? 0];
    const stage = STAGE_LABELS[c.stage] || null;
    const funFacts = (c.funFacts || '').split('\n').filter(f => f.trim());
    const rColor = recencyColor(c.lastSpoken);
    const ntLabel = c.networkType ? NETWORK_TYPE_LABELS[c.networkType] : null;

    const hasAction = c.nextAction || c.actionType;
    const isOverdue = c.actionDue && daysUntil(c.actionDue) < 0;
    const dueLabel = friendlyDue(c.actionDue);

    let actionBadge = '';
    if (hasAction) {
      const pill = c.actionType ? ACTION_LABELS[c.actionType] || 'Act' : 'Act';
      const pillColor = isOverdue ? 'var(--red)' : 'var(--amber)';
      actionBadge = `
        <div class="card-action-badge${isOverdue ? ' urgent' : ''} open-detail" data-id="${c.id}">
          <span class="action-type-pill" style="color:${pillColor}">${pill}</span>
          <span class="action-text">${highlight(c.nextAction || (ACTION_FULL[c.actionType] || 'Action pending'), q)}</span>
          ${dueLabel ? `<span class="action-due${isOverdue ? ' overdue' : ''}">${dueLabel}</span>` : ''}
        </div>`;
    }

    let convBadge = '';
    if (c.convStatus) {
      const cs = getConvStatus(c.convStatus);
      const platform = c.convPlatform ? CONV_PLATFORM_LABELS[c.convPlatform] || c.convPlatform : '';
      convBadge = `
        <div class="card-conv-badge ${c.convStatus} open-detail" data-id="${c.id}">
          <span class="conv-status-pill" style="color:${cs.color}">${cs.label}</span>
          ${platform ? `<span class="conv-platform-tag">${esc(platform)}</span>` : ''}
          ${c.convTopic ? `<span class="conv-topic-text">${highlight(c.convTopic, q)}</span>` : ''}
        </div>`;
    }

    let meetingBadge = '';
    if (c.meetingStatus && c.meetingDate) {
      const ms = getMeetingStatus(c.meetingStatus);
      const dateStr = formatMeetingDate(c.meetingDate);
      const timeStr = c.meetingTime ? ` · ${c.meetingTime}` : '';
      const venueStr = c.meetingVenue ? ` · ${c.meetingVenue}` : '';
      meetingBadge = `
        <div class="card-meeting-badge ${c.meetingStatus} open-detail" data-id="${c.id}">
          <span class="meeting-status-pill" style="color:${ms.color}">${ms.label}</span>
          <span class="meeting-info-text">${esc(dateStr + timeStr + venueStr)}</span>
        </div>`;
    }

    return `
      <div class="card" data-id="${c.id}" style="animation-delay:${Math.min(i*0.025,0.25)}s">
        <div class="card-stripe" style="background:${col.bg}"></div>
        <div class="card-body">
          <div class="card-top">
            <div class="card-name editable" data-field="name" data-id="${c.id}">${highlight(c.name, q)}</div>
            <div style="display:flex;align-items:center;gap:5px">
              ${ntLabel ? `<span class="network-type-pill" style="color:${ntLabel.color};border-color:${ntLabel.color}">${ntLabel.label}</span>` : ''}
              <button class="card-edit-btn" data-id="${c.id}">Edit</button>
            </div>
          </div>

          <div class="${c.codeword ? 'card-codeword editable' : 'card-codeword-empty editable'}"
            data-field="codeword" data-id="${c.id}"
            ${c.codeword ? `style="color:${col.bg}"` : ''}>
            ${c.codeword ? highlight(c.codeword, q) : '+ codeword'}
          </div>

          <div class="${c.expertise ? 'card-expertise editable' : 'card-expertise-empty editable'}"
            data-field="expertise" data-id="${c.id}">
            ${c.expertise ? highlight(c.expertise, q) : '+ expertise / role'}
          </div>

          <div class="card-location editable${c.location ? '' : ' card-location-empty'}" data-field="location" data-id="${c.id}">
            ${c.location ? `📍 ${highlight(c.location, q)}` : '📍 + add location'}
          </div>

          ${c.context ? `<div class="card-context open-detail" data-id="${c.id}">${highlight(c.context, q)}</div>` : ''}
          ${funFacts.length ? `<div class="card-fact open-detail" data-id="${c.id}">${esc(funFacts[0])}</div>` : ''}

          ${actionBadge}
          ${convBadge}
          ${meetingBadge}

          <hr class="card-divider" />

          <div class="card-footer">
            <div class="card-date-wrap" data-date-id="${c.id}">
              <div class="recency-dot" style="background:${rColor}"></div>
              <span class="date-label">${friendlyDate(c.lastSpoken)}</span>
              <input type="date" class="card-date-input" data-id="${c.id}" value="${c.lastSpoken || ''}" />
            </div>
            <button class="today-btn" data-id="${c.id}">Today</button>
            ${stage ? `<span class="stage-tag" style="color:${stage.color}">${stage.label}</span>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  attachCardEvents(grid);
}

// ─── Card events ──────────────────────────────────────────────
function attachCardEvents(grid) {
  grid.querySelectorAll('.card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.editable, .card-edit-btn, .card-date-wrap, .today-btn, .open-detail')) return;
      openDetail(card.dataset.id);
    });
  });

  grid.querySelectorAll('.open-detail').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); openDetail(el.dataset.id); });
  });

  grid.querySelectorAll('.card-edit-btn').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); openEdit(btn.dataset.id); });
  });

  grid.querySelectorAll('.editable').forEach(el => {
    el.addEventListener('click', e => { e.stopPropagation(); startInlineEdit(el); });
  });

  grid.querySelectorAll('[data-date-id]').forEach(wrap => {
    wrap.addEventListener('click', e => {
      e.stopPropagation();
      const input = wrap.querySelector('.card-date-input');
      const label = wrap.querySelector('.date-label');
      label.style.display = 'none';
      input.style.display = '';
      try { input.showPicker(); } catch(_) { input.focus(); }
    });
  });

  grid.querySelectorAll('.card-date-input').forEach(input => {
    input.addEventListener('change', e => {
      e.stopPropagation();
      const c = contacts.find(x => x.id === input.dataset.id);
      if (c) { c.lastSpoken = input.value; save(); renderGrid(); toast('Saved'); }
    });
    input.addEventListener('blur', e => { e.stopPropagation(); renderGrid(); });
  });

  grid.querySelectorAll('.today-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const c = contacts.find(x => x.id === btn.dataset.id);
      if (c) { c.lastSpoken = todayStr(); save(); renderGrid(); toast('Marked today'); }
    });
  });
}

// ─── Inline edit ──────────────────────────────────────────────
function startInlineEdit(el) {
  if (el.dataset.editing) return;
  el.dataset.editing = '1';

  const id = el.dataset.id;
  const field = el.dataset.field;
  const c = contacts.find(x => x.id === id);
  if (!c) { delete el.dataset.editing; return; }

  const originalVal = c[field] || '';
  const originalHTML = el.innerHTML;

  const isName = field === 'name';
  const isMono = field === 'codeword';

  const input = document.createElement('input');
  input.type = 'text';
  input.value = originalVal;
  input.className = 'inline-input' + (isName ? ' inline-name' : isMono ? ' inline-mono' : ' inline-small');
  if (field === 'name') input.maxLength = 80;
  if (field === 'codeword') input.maxLength = 40;
  if (field === 'expertise') input.maxLength = 100;

  el.innerHTML = '';
  el.appendChild(input);
  input.focus();
  input.select();

  let committed = false;

  function commit() {
    if (committed) return;
    committed = true;
    const val = input.value.trim();
    if (field === 'name' && !val) {
      el.innerHTML = originalHTML;
      delete el.dataset.editing;
      return;
    }
    if (val !== originalVal) { c[field] = val; save(); toast('Saved'); }
    delete el.dataset.editing;
    renderGrid();
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
    if (e.key === 'Escape') { committed = true; el.innerHTML = originalHTML; delete el.dataset.editing; }
  });
}

// ─── Overview ─────────────────────────────────────────────────
function renderOverview() {
  const el = document.getElementById('overviewContainer');

  const total = contacts.length;
  const recent = contacts.filter(c => daysSince(c.lastSpoken) <= 14).length;
  const overdue = contacts.filter(c => daysSince(c.lastSpoken) > 60).length;
  const withAction = contacts.filter(c => c.nextAction || c.actionType).length;

  // People by field
  const fieldMap = {};
  contacts.forEach(c => {
    const fields = (c.expertise || '').split(',').map(s => s.trim()).filter(Boolean);
    if (fields.length === 0) {
      if (!fieldMap['Other']) fieldMap['Other'] = [];
      fieldMap['Other'].push(c);
    } else {
      fields.forEach(f => {
        if (!fieldMap[f]) fieldMap[f] = [];
        fieldMap[f].push(c);
      });
    }
  });
  const sortedFields = Object.entries(fieldMap).sort((a, b) => b[1].length - a[1].length);

  // Upcoming meetings
  const todayIso = todayStr();
  const upcomingMeetings = contacts
    .filter(c => c.meetingDate && c.meetingStatus && c.meetingDate >= todayIso)
    .sort((a, b) => (a.meetingDate > b.meetingDate ? 1 : -1))
    .slice(0, 5);

  // Pending actions sorted by due date
  const actions = contacts
    .filter(c => c.nextAction || c.actionType)
    .sort((a, b) => {
      const da = a.actionDue ? new Date(a.actionDue).getTime() : Infinity;
      const db = b.actionDue ? new Date(b.actionDue).getTime() : Infinity;
      return da - db;
    });

  el.innerHTML = `
    <div class="overview">

      ${sortedFields.length ? `
      <div class="ov-section">
        <div class="ov-title">People by Field</div>
        <div class="field-clusters">
          ${sortedFields.map(([field, people]) => `
            <div class="field-cluster">
              <div class="field-cluster-heading">${esc(field)} <span class="field-cluster-count">${people.length}</span></div>
              <div class="field-cluster-names">
                ${people.map(c => {
                  const col = COLORS[c.colorIdx ?? 0];
                  return `<span class="field-cluster-name" data-id="${c.id}" style="border-color:${col.bg};color:${col.bg}">${esc(c.name)}</span>`;
                }).join('')}
              </div>
            </div>`).join('')}
        </div>
      </div>` : ''}

      <div class="ov-section">
        <div class="ov-title">Network at a Glance</div>
        <div class="stat-row">
          <div class="stat-block">
            <div class="stat-num">${total}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat-block">
            <div class="stat-num" style="color:#2a9d8f">${recent}</div>
            <div class="stat-label">Spoke recently</div>
          </div>
          <div class="stat-block">
            <div class="stat-num" style="color:#888">${overdue}</div>
            <div class="stat-label">Overdue (60d+)</div>
          </div>
          <div class="stat-block">
            <div class="stat-num" style="color:#d4820a">${withAction}</div>
            <div class="stat-label">Actions pending</div>
          </div>
        </div>
      </div>

      <div class="ov-section">
        <div class="ov-title">Pending Actions</div>
        ${actions.length ? `
          <div class="action-list">
            ${actions.map(c => {
              const col = COLORS[c.colorIdx ?? 0];
              const isOv = c.actionDue && daysUntil(c.actionDue) < 0;
              const dueStr = friendlyDue(c.actionDue);
              const typeLabel = ACTION_FULL[c.actionType] || (c.actionType ? c.actionType : 'Action');
              return `
                <div class="action-item" data-id="${c.id}">
                  <div class="action-item-stripe" style="background:${col.bg}"></div>
                  <div class="action-item-body">
                    <div class="action-item-who">${esc(c.name)}</div>
                    <div class="action-item-what">
                      ${c.actionType ? `<span class="action-type-pill" style="color:${isOv ? 'var(--red)' : 'var(--amber)'};margin-right:6px">${ACTION_LABELS[c.actionType] || c.actionType}</span>` : ''}
                      ${esc(c.nextAction || typeLabel)}
                    </div>
                    <div class="action-item-meta">
                      ${dueStr ? `<span class="action-item-due${isOv ? ' overdue' : ''}">${dueStr}</span>` : ''}
                      ${c.expertise ? `<span style="font-family:var(--mono);font-size:9px;color:var(--ink3)">${esc(c.expertise.split(',')[0])}</span>` : ''}
                    </div>
                    ${c.howUseful ? `<div class="action-item-useful">${esc(c.howUseful)}</div>` : ''}
                  </div>
                </div>`;
            }).join('')}
          </div>` : '<div class="ov-empty">No pending actions. Add one by editing a contact.</div>'}
      </div>

      ${upcomingMeetings.length ? `
        <div class="ov-section">
          <div class="ov-title">Upcoming Meetings</div>
          <div class="cal-upcoming-list">
            ${upcomingMeetings.map(meetingItem).join('')}
          </div>
        </div>` : ''}

    </div>`;

  // Click listeners for overview items
  el.querySelectorAll('[data-id]').forEach(item => {
    item.addEventListener('click', () => openDetail(item.dataset.id));
  });
}

// ─── Geographic World Map ──────────────────────────────────────
let mapVB = { x: 0, y: 0, w: 1000, h: 500 };
let mapMode = 'geo'; // 'geo' | 'mindmap'
let mapDragging = false;
let mapDragStart = null;

function zoomVB(factor, clientX, clientY, svgEl) {
  const rect = svgEl.getBoundingClientRect();
  const pctX = (clientX - rect.left) / rect.width;
  const pctY = (clientY - rect.top) / rect.height;
  const cx = mapVB.x + pctX * mapVB.w;
  const cy = mapVB.y + pctY * mapVB.h;
  mapVB = {
    x: cx - pctX * mapVB.w * factor,
    y: cy - pctY * mapVB.h * factor,
    w: mapVB.w * factor,
    h: mapVB.h * factor
  };
  svgEl.setAttribute('viewBox', `${mapVB.x} ${mapVB.y} ${mapVB.w} ${mapVB.h}`);
}

function resetMapVB(svgEl) {
  mapVB = { x: 0, y: 0, w: 1000, h: 500 };
  svgEl.setAttribute('viewBox', '0 0 1000 500');
}

function attachMapInteraction(svgEl) {
  // Scroll to zoom
  svgEl.addEventListener('wheel', e => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    zoomVB(factor, e.clientX, e.clientY, svgEl);
  }, { passive: false });

  // Drag to pan
  svgEl.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    mapDragging = true;
    mapDragStart = { x: e.clientX, y: e.clientY, vb: { ...mapVB } };
    svgEl.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', e => {
    if (!mapDragging || !mapDragStart) return;
    const rect = svgEl.getBoundingClientRect();
    const scaleX = mapVB.w / rect.width;
    const scaleY = mapVB.h / rect.height;
    const dx = (e.clientX - mapDragStart.x) * scaleX;
    const dy = (e.clientY - mapDragStart.y) * scaleY;
    mapVB = {
      x: mapDragStart.vb.x - dx,
      y: mapDragStart.vb.y - dy,
      w: mapDragStart.vb.w,
      h: mapDragStart.vb.h
    };
    svgEl.setAttribute('viewBox', `${mapVB.x} ${mapVB.y} ${mapVB.w} ${mapVB.h}`);
  });

  window.addEventListener('mouseup', () => {
    mapDragging = false;
    mapDragStart = null;
    svgEl.style.cursor = 'grab';
  });

  // Touch pinch/pan
  let lastTouches = null;
  svgEl.addEventListener('touchstart', e => {
    lastTouches = e.touches;
  }, { passive: true });

  svgEl.addEventListener('touchmove', e => {
    e.preventDefault();
    if (e.touches.length === 1 && lastTouches && lastTouches.length === 1) {
      const rect = svgEl.getBoundingClientRect();
      const scaleX = mapVB.w / rect.width;
      const scaleY = mapVB.h / rect.height;
      const dx = (e.touches[0].clientX - lastTouches[0].clientX) * scaleX;
      const dy = (e.touches[0].clientY - lastTouches[0].clientY) * scaleY;
      mapVB = { ...mapVB, x: mapVB.x - dx, y: mapVB.y - dy };
      svgEl.setAttribute('viewBox', `${mapVB.x} ${mapVB.y} ${mapVB.w} ${mapVB.h}`);
    } else if (e.touches.length === 2 && lastTouches && lastTouches.length === 2) {
      const d0 = Math.hypot(lastTouches[0].clientX - lastTouches[1].clientX, lastTouches[0].clientY - lastTouches[1].clientY);
      const d1 = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (d0 > 0) {
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        zoomVB(d0 / d1, midX, midY, svgEl);
      }
    }
    lastTouches = e.touches;
  }, { passive: false });
}

function renderGeoMap(container) {
  const VW = 1000, VH = 500;
  const toSVG = (px, py) => [px * VW / 100, py * VH / 100];

  const pinGroups = {};
  const unmapped = [];

  contacts.forEach(c => {
    const coords = lookupCity(c.location);
    if (coords) {
      const key = coords.join(',');
      if (!pinGroups[key]) pinGroups[key] = { coords, list: [] };
      pinGroups[key].list.push(c);
    } else {
      unmapped.push(c);
    }
  });

  let pinsSVG = '';
  Object.values(pinGroups).forEach(({ coords, list }) => {
    const [px, py] = toSVG(coords[0], coords[1]);
    const n = list.length;
    const hasAction = list.some(c => c.nextAction || c.actionType);
    const hasMeeting = list.some(c => c.meetingStatus && c.meetingDate);
    const col = COLORS[list[0].colorIdx ?? 0];
    const r = n === 1 ? 9 : Math.min(14, 9 + n);
    const names = list.map(c => c.name).join(', ');
    const cityName = list[0].location || '';

    pinsSVG += `
      <g class="geo-pin-group" data-ids="${list.map(c => c.id).join(',')}" data-city="${esc(cityName)}">
        <title>${esc(names)}${cityName ? '\n' + esc(cityName) : ''}</title>
        <circle cx="${px}" cy="${py}" r="${r + 3}" class="geo-pin-bg" />
        <circle cx="${px}" cy="${py}" r="${r}" fill="${col.bg}" class="geo-pin-dot" stroke="none" />
        <text x="${px}" y="${py}" text-anchor="middle" dominant-baseline="middle"
          font-size="${n > 1 ? 9 : 8}" font-weight="900" fill="white"
          font-family="Georgia,serif" pointer-events="none">
          ${n > 1 ? n : initials(list[0].name)}
        </text>
        ${hasAction ? `<circle cx="${px + r + 1}" cy="${py - r - 1}" r="4" class="geo-pin-action" />` : ''}
        ${hasMeeting ? `<circle cx="${px + r + 1}" cy="${py + r + 1}" r="4" class="geo-pin-meeting-dot" />` : ''}
      </g>`;
  });

  let unmappedSVG = '';
  if (unmapped.length > 0) {
    unmappedSVG = `
      <rect x="${VW - 190}" y="${VH - unmapped.length * 14 - 26}" width="188" height="${unmapped.length * 14 + 20}"
        fill="rgba(240,235,224,0.92)" stroke="#c8c3b8" stroke-width="1" />
      <text x="${VW - 96}" y="${VH - unmapped.length * 14 - 12}" text-anchor="middle"
        font-size="8" fill="var(--ink3)" font-family="'Courier New',monospace"
        font-weight="700" letter-spacing="0.5">NO LOCATION SET</text>
      ${unmapped.map((c, i) => `
        <text x="${VW - 182}" y="${VH - unmapped.length * 14 + i * 14 + 2}"
          font-size="9" fill="var(--ink2)" font-family="Georgia,serif">${esc(c.name)}</text>
      `).join('')}`;
  }

  container.innerHTML = `
    <svg class="map-svg" viewBox="${mapVB.x} ${mapVB.y} ${mapVB.w} ${mapVB.h}"
         preserveAspectRatio="xMidYMid meet"
         style="display:block;width:100%;height:100%;background:#e8e4db;cursor:grab">
      ${CONTINENT_PATHS_SVG}
      ${pinsSVG}
      ${unmappedSVG}
    </svg>
    <div class="geo-map-legend">
      <span><span style="width:10px;height:10px;border-radius:50%;background:#d4820a;display:inline-block"></span> Action pending</span>
      <span><span style="width:10px;height:10px;border-radius:50%;background:#2a6049;display:inline-block"></span> Meeting</span>
      <span style="color:var(--ink3)">Click pin to view</span>
    </div>
    <div class="map-zoom-controls">
      <button class="map-zoom-btn" id="mapZoomIn">+</button>
      <button class="map-zoom-btn" id="mapZoomReset">⊙</button>
      <button class="map-zoom-btn" id="mapZoomOut">−</button>
    </div>`;

  const svgEl = container.querySelector('.map-svg');
  attachMapInteraction(svgEl);

  document.getElementById('mapZoomIn').addEventListener('click', () => {
    const rect = svgEl.getBoundingClientRect();
    zoomVB(0.7, rect.left + rect.width/2, rect.top + rect.height/2, svgEl);
  });
  document.getElementById('mapZoomOut').addEventListener('click', () => {
    const rect = svgEl.getBoundingClientRect();
    zoomVB(1.4, rect.left + rect.width/2, rect.top + rect.height/2, svgEl);
  });
  document.getElementById('mapZoomReset').addEventListener('click', () => resetMapVB(svgEl));

  container.querySelectorAll('.geo-pin-group').forEach(pin => {
    pin.addEventListener('click', () => {
      const ids = pin.dataset.ids.split(',').filter(Boolean);
      openDetail(ids[0]);
    });

    pin.addEventListener('mouseenter', e => {
      const ids = pin.dataset.ids.split(',').filter(Boolean);
      const list = ids.map(id => contacts.find(c => c.id === id)).filter(Boolean);
      const tt = document.getElementById('mapTooltip');
      tt.innerHTML = list.map(c =>
        `<strong>${esc(c.name)}</strong>` +
        (c.expertise ? `<span style="color:#aaa"> · ${esc(c.expertise.split(',')[0])}</span>` : '')
      ).join('<br>') + (pin.dataset.city ? `<br><span style="color:#aaa">${esc(pin.dataset.city)}</span>` : '');
      tt.style.display = 'block';
    });

    pin.addEventListener('mousemove', e => {
      const tt = document.getElementById('mapTooltip');
      tt.style.left = (e.clientX + 14) + 'px';
      tt.style.top = (e.clientY - 10) + 'px';
    });

    pin.addEventListener('mouseleave', () => {
      document.getElementById('mapTooltip').style.display = 'none';
    });
  });
}

function renderMindMap(container) {
  const VW = 1000, VH = 600;
  const cx = VW / 2, cy = VH / 2;

  // Group contacts by expertise fields
  const fieldMap = {};
  contacts.forEach(c => {
    const fields = (c.expertise || '').split(',').map(s => s.trim()).filter(Boolean);
    if (fields.length === 0) fields.push('Other');
    fields.forEach(f => {
      if (!fieldMap[f]) fieldMap[f] = [];
      if (!fieldMap[f].find(x => x.id === c.id)) fieldMap[f].push(c);
    });
  });

  const fields = Object.keys(fieldMap);
  const numFields = fields.length;

  if (numFields === 0) {
    container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--ink3);font-family:var(--mono);font-size:12px;text-transform:uppercase;letter-spacing:1px">No contacts to map yet</div>`;
    return;
  }

  const radius = Math.min(VW, VH) * 0.34;
  const clusterColors = ['#e63946','#f4a261','#2a9d8f','#457b9d','#6d597a','#e9c46a','#264653','#c77dff','#023e8a','#606c38','#a8dadc','#f1faee'];

  let hullsSVG = '';
  let connectionsSVG = '';
  let nodesSVG = '';
  let labelsSVG = '';

  const clusterCenters = {};
  fields.forEach((field, fi) => {
    const angle = (fi / numFields) * Math.PI * 2 - Math.PI / 2;
    const ccx = cx + radius * Math.cos(angle);
    const ccy = cy + radius * Math.sin(angle);
    clusterCenters[field] = { x: ccx, y: ccy, color: clusterColors[fi % clusterColors.length] };
  });

  // Draw hulls (ellipses behind each cluster)
  fields.forEach((field, fi) => {
    const { x: ccx, y: ccy, color } = clusterCenters[field];
    const people = fieldMap[field];
    const hr = Math.max(40, 20 + people.length * 10);
    hullsSVG += `<ellipse cx="${ccx}" cy="${ccy}" rx="${hr}" ry="${hr * 0.7}" fill="${color}22" stroke="${color}44" stroke-width="1.5" />`;
  });

  // Draw connection lines for multi-field contacts
  contacts.forEach(c => {
    const cFields = (c.expertise || '').split(',').map(s => s.trim()).filter(Boolean);
    if (cFields.length > 1) {
      for (let i = 0; i < cFields.length - 1; i++) {
        const f1 = clusterCenters[cFields[i]];
        const f2 = clusterCenters[cFields[i+1]];
        if (f1 && f2) {
          connectionsSVG += `<line x1="${f1.x}" y1="${f1.y}" x2="${f2.x}" y2="${f2.y}" stroke="#ccc" stroke-width="1" stroke-dasharray="4,3" opacity="0.5" />`;
        }
      }
    }
  });

  // Draw contact nodes in each cluster
  const placed = {};
  fields.forEach((field, fi) => {
    const { x: ccx, y: ccy, color } = clusterCenters[field];
    const people = fieldMap[field];
    const nodeRadius = 16;
    const spread = Math.max(30, nodeRadius * 1.4);

    people.forEach((c, pi) => {
      const pAngle = (pi / people.length) * Math.PI * 2;
      const pDist = people.length === 1 ? 0 : Math.min(30, 12 + people.length * 6);
      const nx = ccx + pDist * Math.cos(pAngle);
      const ny = ccy + pDist * Math.sin(pAngle);
      const col = COLORS[c.colorIdx ?? 0];
      const key = c.id + '_' + field;
      placed[key] = { nx, ny };

      nodesSVG += `
        <g class="mindmap-node" data-id="${c.id}" style="cursor:pointer">
          <circle cx="${nx}" cy="${ny}" r="${nodeRadius}" fill="${col.bg}" stroke="white" stroke-width="2" />
          <text x="${nx}" y="${ny}" text-anchor="middle" dominant-baseline="middle"
            font-size="7" font-weight="900" fill="white" font-family="Georgia,serif" pointer-events="none">
            ${initials(c.name)}
          </text>
        </g>`;
    });

    // Field label
    const angle = (fi / numFields) * Math.PI * 2 - Math.PI / 2;
    const lx = cx + (radius + 50) * Math.cos(angle);
    const ly = cy + (radius + 50) * Math.sin(angle);
    labelsSVG += `
      <text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle"
        font-size="9" font-weight="700" fill="${color}" font-family="'Courier New',monospace"
        text-transform="uppercase" pointer-events="none">
        ${esc(field)}
      </text>`;
  });

  container.innerHTML = `
    <svg class="map-svg" viewBox="${mapVB.x} ${mapVB.y} ${mapVB.w} ${mapVB.h > 500 ? mapVB.h : 600}"
         preserveAspectRatio="xMidYMid meet"
         style="display:block;width:100%;height:100%;background:#f8f6f0;cursor:grab">
      ${hullsSVG}
      ${connectionsSVG}
      ${nodesSVG}
      ${labelsSVG}
    </svg>
    <div class="map-zoom-controls">
      <button class="map-zoom-btn" id="mapZoomIn">+</button>
      <button class="map-zoom-btn" id="mapZoomReset">⊙</button>
      <button class="map-zoom-btn" id="mapZoomOut">−</button>
    </div>`;

  const svgEl = container.querySelector('.map-svg');
  attachMapInteraction(svgEl);

  document.getElementById('mapZoomIn').addEventListener('click', () => {
    const rect = svgEl.getBoundingClientRect();
    zoomVB(0.7, rect.left + rect.width/2, rect.top + rect.height/2, svgEl);
  });
  document.getElementById('mapZoomOut').addEventListener('click', () => {
    const rect = svgEl.getBoundingClientRect();
    zoomVB(1.4, rect.left + rect.width/2, rect.top + rect.height/2, svgEl);
  });
  document.getElementById('mapZoomReset').addEventListener('click', () => {
    mapVB = { x: 0, y: 0, w: 1000, h: 600 };
    svgEl.setAttribute('viewBox', '0 0 1000 600');
  });

  container.querySelectorAll('.mindmap-node').forEach(node => {
    node.addEventListener('click', () => openDetail(node.dataset.id));
    node.addEventListener('mouseenter', e => {
      const c = contacts.find(x => x.id === node.dataset.id);
      if (!c) return;
      const tt = document.getElementById('mapTooltip');
      tt.innerHTML = `<strong>${esc(c.name)}</strong>${c.expertise ? `<span style="color:#aaa"> · ${esc(c.expertise.split(',')[0])}</span>` : ''}`;
      tt.style.display = 'block';
    });
    node.addEventListener('mousemove', e => {
      const tt = document.getElementById('mapTooltip');
      tt.style.left = (e.clientX + 14) + 'px';
      tt.style.top = (e.clientY - 10) + 'px';
    });
    node.addEventListener('mouseleave', () => {
      document.getElementById('mapTooltip').style.display = 'none';
    });
  });
}

function renderMap() {
  const container = document.getElementById('mapContainer');
  container.style.position = 'relative';

  if (contacts.length === 0) {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--ink3);font-family:var(--mono);font-size:12px;text-transform:uppercase;letter-spacing:1px">
        No contacts to map yet
      </div>`;
    return;
  }

  // Mode toggle bar
  const toggleHTML = `
    <div class="map-mode-toggle">
      <button class="map-mode-btn${mapMode === 'geo' ? ' active' : ''}" data-mode="geo">Geo</button>
      <button class="map-mode-btn${mapMode === 'mindmap' ? ' active' : ''}" data-mode="mindmap">Mind Map</button>
    </div>`;

  if (mapMode === 'geo') {
    renderGeoMap(container);
  } else {
    renderMindMap(container);
  }

  // Prepend toggle
  container.insertAdjacentHTML('afterbegin', toggleHTML);

  container.querySelectorAll('.map-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      mapMode = btn.dataset.mode;
      mapVB = { x: 0, y: 0, w: 1000, h: 500 };
      renderMap();
    });
  });
}

// ─── Calendar ──────────────────────────────────────────────────
let calendarDate = new Date();

function renderCalendar() {
  const el = document.getElementById('calendarContainer');

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const monthName = calendarDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const withMeetings = contacts.filter(c => c.meetingDate && c.meetingStatus);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const todayIso = todayStr();

  const eventsByDate = {};
  withMeetings.forEach(c => {
    if (!eventsByDate[c.meetingDate]) eventsByDate[c.meetingDate] = [];
    eventsByDate[c.meetingDate].push(c);
  });

  const dayHeaders = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    .map((d, i) => `<div class="cal-day-header${i >= 5 ? ' weekend' : ''}">${d}</div>`).join('');

  let cells = '';
  for (let i = 0; i < startOffset; i++) {
    const colIdx = i % 7;
    cells += `<div class="cal-cell empty${colIdx >= 5 ? ' weekend' : ''}"></div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayEvents = eventsByDate[dateKey] || [];
    const colIdx = (startOffset + d - 1) % 7;
    const isWeekend = colIdx >= 5;
    const isToday = dateKey === todayIso;
    cells += `<div class="cal-cell${isToday ? ' today' : ''}${isWeekend ? ' weekend' : ''}">
      <div class="cal-day-num">${d}</div>
      ${dayEvents.map(c => {
        const col = COLORS[c.colorIdx ?? 0];
        return `<div class="cal-event ${c.meetingStatus}" data-id="${c.id}" style="border-left-color:${col.bg};color:${col.bg}">${esc(c.name.split(' ')[0])}</div>`;
      }).join('')}
    </div>`;
  }

  const upcomingAll = [...withMeetings]
    .sort((a, b) => (a.meetingDate > b.meetingDate ? 1 : a.meetingDate < b.meetingDate ? -1 : 0));
  const futureUpcoming = upcomingAll.filter(c => c.meetingDate >= todayIso);
  const pastMeetings = upcomingAll.filter(c => c.meetingDate < todayIso).slice(-3).reverse();

  const emptyQuips = [
    'Your calendar is suspiciously zen. ✦',
    'No plans yet — the world awaits.',
    'Wide open. The perfect canvas.',
    'Zero meetings. Maximum potential.',
  ];
  const emptyMsg = emptyQuips[month % emptyQuips.length];

  el.innerHTML = `
    <div class="calendar-wrap">
      <div class="cal-nav">
        <button class="cal-nav-btn" id="calPrev">← Prev</button>
        <div class="cal-month-title">${monthName}</div>
        <button class="cal-nav-btn" id="calNext">Next →</button>
      </div>

      <div class="cal-legend">
        <span class="cal-legend-item confirmed">✦ Confirmed</span>
        <span class="cal-legend-item potential">◎ Potential</span>
      </div>

      <div class="cal-grid">
        ${dayHeaders}
        ${cells}
      </div>

      ${futureUpcoming.length ? `
        <div class="cal-section-title">✦ Up Next</div>
        <div class="cal-ticket-list">
          ${futureUpcoming.map(meetingItem).join('')}
        </div>` : `<div class="cal-empty-state">${emptyMsg}<br><span>Edit a contact to schedule a meeting.</span></div>`}

      ${pastMeetings.length ? `
        <div class="cal-section-title">◎ Recent Past</div>
        <div class="cal-ticket-list cal-past">
          ${pastMeetings.map(meetingItem).join('')}
        </div>` : ''}
    </div>`;

  document.getElementById('calPrev').addEventListener('click', () => {
    calendarDate = new Date(year, month - 1, 1);
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    calendarDate = new Date(year, month + 1, 1);
    renderCalendar();
  });

  el.querySelectorAll('.cal-event[data-id], .cal-upcoming-item[data-id]').forEach(item => {
    item.addEventListener('click', e => { e.stopPropagation(); openDetail(item.dataset.id); });
  });
}

// ─── Detail modal ─────────────────────────────────────────────
function openDetail(id) {
  detailId = id;
  const c = contacts.find(x => x.id === id);
  if (!c) return;

  const col = COLORS[c.colorIdx ?? 0];
  const stage = STAGE_LABELS[c.stage] || null;
  const funFacts = (c.funFacts || '').split('\n').filter(f => f.trim());
  const expertiseTags = (c.expertise || '').split(',').map(s => s.trim()).filter(Boolean);
  const ntLabel = c.networkType ? NETWORK_TYPE_LABELS[c.networkType] : null;

  const contactItems = [
    { label: 'Email',     val: c.email,     href: c.email ? `mailto:${c.email}` : null },
    { label: 'Phone',     val: c.phone,     href: c.phone ? `tel:${c.phone}`    : null },
    { label: 'LinkedIn',  val: c.linkedin  },
    { label: 'X/Twitter', val: c.twitter   },
    { label: 'Instagram', val: c.instagram },
    { label: 'Website',   val: c.website   },
  ].filter(x => x.val);

  const hasAction = c.nextAction || c.actionType;
  const isOv = c.actionDue && daysUntil(c.actionDue) < 0;

  const showInCommon = (c.networkType === 'personal' || c.networkType === 'both') && c.inCommon;

  document.getElementById('detailBody').innerHTML = `
    <div class="detail-hero" style="border-left:6px solid ${col.bg}">
      <div class="detail-avatar" style="background:${col.bg}22;color:${col.bg}">${initials(c.name)}</div>
      <div>
        <div class="detail-name">${esc(c.name)}</div>
        ${c.codeword ? `<div class="detail-codeword" style="color:${col.bg}">${esc(c.codeword)}</div>` : ''}
        ${c.expertise ? `<div style="font-size:13px;color:var(--ink2);margin-top:2px">${esc(c.expertise)}</div>` : ''}
        ${c.location ? `<div style="font-family:var(--mono);font-size:10px;color:var(--ink3);margin-top:4px">${esc(c.location)}</div>` : ''}
        <div style="display:flex;align-items:center;gap:6px;margin-top:6px;flex-wrap:wrap">
          ${stage ? `<span class="stage-tag" style="color:${stage.color}">${stage.label}</span>` : ''}
          ${ntLabel ? `<span class="network-type-pill" style="color:${ntLabel.color};border-color:${ntLabel.color}">${ntLabel.label}</span>` : ''}
        </div>
      </div>
    </div>

    ${hasAction ? `
    <div class="detail-action-block${isOv ? ' urgent' : ''}">
      <div class="detail-section-title" style="margin-bottom:6px">Next Action</div>
      <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px">
        ${c.actionType ? `<span class="action-type-pill" style="color:${isOv ? 'var(--red)' : 'var(--amber)'}">${ACTION_FULL[c.actionType] || c.actionType}</span>` : ''}
        ${c.actionDue ? `<span class="action-due${isOv ? ' overdue' : ''}">${friendlyDue(c.actionDue)} (${c.actionDue})</span>` : ''}
      </div>
      ${c.nextAction ? `<div class="detail-text">${esc(c.nextAction)}</div>` : ''}
      ${c.howUseful ? `
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--faint)">
          <div class="detail-section-title" style="margin-bottom:4px">How they can help you</div>
          <div class="detail-text">${esc(c.howUseful)}</div>
        </div>` : ''}
      ${c.howYouHelp ? `
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--faint)">
          <div class="detail-section-title" style="margin-bottom:4px">How you can help them</div>
          <div class="detail-text">${esc(c.howYouHelp)}</div>
        </div>` : ''}
    </div>` : (c.howUseful || c.howYouHelp ? `
    <div class="detail-section">
      ${c.howUseful ? `<div class="detail-section-title">How They Can Help You</div><div class="detail-text" style="margin-bottom:8px">${esc(c.howUseful)}</div>` : ''}
      ${c.howYouHelp ? `<div class="detail-section-title">How You Can Help Them</div><div class="detail-text">${esc(c.howYouHelp)}</div>` : ''}
    </div>` : '')}

    ${showInCommon ? `
    <div class="detail-section">
      <div class="detail-section-title">In Common</div>
      <div class="detail-text">${esc(c.inCommon)}</div>
    </div>` : ''}

    ${(() => {
      if (!c.convStatus) return '';
      const cs = getConvStatus(c.convStatus);
      const platform = c.convPlatform ? CONV_PLATFORM_LABELS[c.convPlatform] || c.convPlatform : '';
      return `
        <div class="detail-conv-block ${c.convStatus}">
          <div class="detail-section-title" style="margin-bottom:6px">Conversation</div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            ${statusPill(cs.label, cs.color, '2px 6px')}
            ${platform ? `<span style="font-family:var(--mono);font-size:9px;color:var(--ink3);background:var(--faint);padding:2px 6px">${esc(platform)}</span>` : ''}
          </div>
          ${c.convTopic ? `<div class="detail-text">${esc(c.convTopic)}</div>` : ''}
        </div>`;
    })()}

    ${(() => {
      if (!c.meetingStatus || !c.meetingDate) return '';
      const ms = getMeetingStatus(c.meetingStatus);
      return `
        <div class="detail-meeting-block ${c.meetingStatus}">
          <div class="detail-section-title" style="margin-bottom:6px">Meeting</div>
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            ${statusPill(ms.label, ms.color, '2px 6px')}
            <span style="font-family:var(--mono);font-size:11px;color:var(--ink2)">${esc(formatMeetingDate(c.meetingDate))}${c.meetingTime ? ' · ' + esc(c.meetingTime) : ''}</span>
          </div>
          ${c.meetingVenue ? `<div class="detail-text" style="font-style:italic">${esc(c.meetingVenue)}</div>` : ''}
        </div>`;
    })()}

    ${c.context ? `
    <div class="detail-section">
      <div class="detail-section-title">How You Met</div>
      <div class="detail-text">${esc(c.context)}</div>
    </div>` : ''}

    <div class="detail-section">
      <div class="detail-section-title">Last Spoken</div>
      <div class="detail-text" style="display:flex;align-items:center;gap:8px">
        <div style="width:8px;height:8px;border-radius:50%;background:${recencyColor(c.lastSpoken)};flex-shrink:0"></div>
        ${friendlyDate(c.lastSpoken)}
        ${c.lastSpoken ? `<span style="color:var(--ink3);font-size:12px;font-family:var(--mono)">${c.lastSpoken}</span>` : ''}
      </div>
    </div>

    ${c.painPoints ? `
    <div class="detail-section">
      <div class="detail-section-title">Pain Points</div>
      <div class="detail-text">${esc(c.painPoints)}</div>
    </div>` : ''}

    ${c.goals ? `
    <div class="detail-section">
      <div class="detail-section-title">Goals and Ambitions</div>
      <div class="detail-text">${esc(c.goals)}</div>
    </div>` : ''}

    ${expertiseTags.length ? `
    <div class="detail-section">
      <div class="detail-section-title">Expertise</div>
      <div class="detail-chips">
        ${expertiseTags.map(t => `<span class="detail-chip" style="color:${col.bg}">${esc(t)}</span>`).join('')}
      </div>
    </div>` : ''}

    ${funFacts.length ? `
    <div class="detail-section">
      <div class="detail-section-title">Fun Facts and Conversation Anchors</div>
      <ul class="fun-facts-list">
        ${funFacts.map(f => `<li>${esc(f)}</li>`).join('')}
      </ul>
    </div>` : ''}

    ${contactItems.length ? `
    <div class="detail-section">
      <div class="detail-section-title">Contact and Socials</div>
      <div class="contact-list">
        ${contactItems.map(item => `
          <div class="contact-item">
            <span class="contact-label-tag">${item.label}</span>
            <span class="contact-val">
              ${item.href ? `<a href="${esc(item.href)}">${esc(item.val)}</a>` : esc(item.val)}
            </span>
          </div>`).join('')}
      </div>
    </div>` : ''}

    ${c.notes ? `
    <div class="detail-section">
      <div class="detail-section-title">Notes</div>
      <div class="detail-text">${esc(c.notes)}</div>
    </div>` : ''}
  `;

  document.getElementById('detailOverlay').classList.add('open');
}

function closeDetail() {
  document.getElementById('detailOverlay').classList.remove('open');
  detailId = null;
}

// ─── Color guide modal ────────────────────────────────────────
function openColorGuide() {
  const el = document.getElementById('colorGuideOverlay');
  const body = document.getElementById('colorGuideBody');

  body.innerHTML = COLORS.map((c, i) => `
    <div class="color-guide-row">
      <div class="color-guide-swatch" style="background:${c.bg}"></div>
      <input class="form-input color-guide-input" type="text" placeholder="Meaning for this color..."
        value="${esc(colorMeanings[i] || '')}" data-idx="${i}" maxlength="50" />
    </div>`).join('');

  el.classList.add('open');

  body.querySelectorAll('.color-guide-input').forEach(input => {
    input.addEventListener('input', () => {
      colorMeanings[+input.dataset.idx] = input.value.trim();
    });
  });
}

function closeColorGuide() {
  saveColorMeanings();
  document.getElementById('colorGuideOverlay').classList.remove('open');
}
