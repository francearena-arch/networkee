const STORAGE_KEY = 'networkee_mvp_v2';
const LEGACY_KEY = 'networkee_mvp_v1';

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}
function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const seedData = {
  contacts: [
    {
      id: crypto.randomUUID(),
      name: 'Angela Arena',
      role: 'Assistentin der Geschäftsleitung',
      company: '',
      tags: ['Interview', 'Organisation'],
      goal: 'Kontakt warm halten',
      priority: 'Medium',
      birthday: '',
      memory: 'Exploratives Interview für Networkee. Relevante Zielgruppe mit hohem Organisationsbezug.',
      createdAt: daysAgo(42)
    },
    {
      id: crypto.randomUUID(),
      name: 'Peter Streiff',
      role: 'Vertriebsprofi',
      company: '',
      tags: ['Sales', 'CRM', 'Interview'],
      goal: 'Geschäftschance entwickeln',
      priority: 'High',
      birthday: '',
      memory: 'Perspektive aus Sales/Key Account. Hoher Fit für Relationship-Management-Use-Cases.',
      createdAt: daysAgo(120)
    }
  ],
  notes: []
};
seedData.notes = [
  { id: crypto.randomUUID(), contactId: seedData.contacts[0].id, type: 'Meeting', text: 'Über Organisation, persönliche Kontaktpflege und Reminder gesprochen.', nextStep: 'In 30 Tagen Feedback zum MVP einholen.', followupDate: daysFromNow(7), createdAt: daysAgo(18) },
  { id: crypto.randomUUID(), contactId: seedData.contacts[1].id, type: 'Call', text: 'Sales-Perspektive: Beziehungen leben von Kontext und Timing.', nextStep: 'Use Case für Sales-Persona validieren.', followupDate: daysFromNow(-1), createdAt: daysAgo(91) }
];

let state = loadState();

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try { return normalizeState(JSON.parse(stored)); } catch { return seedData; }
  }
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy) {
    try {
      const migrated = normalizeState(JSON.parse(legacy));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    } catch { return seedData; }
  }
  return seedData;
}

function normalizeState(data) {
  return {
    contacts: (data.contacts || []).map(c => ({
      priority: 'Medium',
      birthday: '',
      createdAt: new Date().toISOString(),
      ...c
    })),
    notes: data.notes || []
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

function navTo(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === viewId));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === viewId));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', () => navTo(btn.dataset.nav)));
document.getElementById('addContactBtn').addEventListener('click', () => openContactDialog());
document.getElementById('cancelDialog').addEventListener('click', () => document.getElementById('contactDialog').close());
document.getElementById('closeProfile').addEventListener('click', () => document.getElementById('profileDialog').close());
document.getElementById('searchInput').addEventListener('input', renderContacts);

document.getElementById('voiceNoteBtn').addEventListener('click', () => {
  document.getElementById('noteType').value = 'Voice Note';
  document.getElementById('noteText').value = 'Voice Note Placeholder: Gespräch kurz zusammenfassen, später via KI automatisch transkribieren und verdichten.';
  document.getElementById('noteText').focus();
});

document.getElementById('resetDemoBtn').addEventListener('click', () => {
  if (!confirm('Demo-Daten wirklich zurücksetzen?')) return;
  state = structuredClone(seedData);
  saveState();
  navTo('today');
});

document.getElementById('clearDataBtn').addEventListener('click', () => {
  if (!confirm('Alle lokalen Networkee-Daten wirklich löschen?')) return;
  state = { contacts: [], notes: [] };
  saveState();
  navTo('today');
});

document.getElementById('contactForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const id = document.getElementById('contactId').value || crypto.randomUUID();
  const existing = state.contacts.find(c => c.id === id);
  const contact = {
    id,
    name: document.getElementById('contactName').value.trim(),
    role: document.getElementById('contactRole').value.trim(),
    company: document.getElementById('contactCompany').value.trim(),
    tags: document.getElementById('contactTags').value.split(',').map(t => t.trim()).filter(Boolean),
    priority: document.getElementById('contactPriority').value,
    birthday: document.getElementById('contactBirthday').value,
    goal: document.getElementById('relationshipGoal').value,
    memory: document.getElementById('contactMemory').value.trim(),
    createdAt: existing?.createdAt || new Date().toISOString()
  };
  const index = state.contacts.findIndex(c => c.id === id);
  if (index >= 0) state.contacts[index] = contact;
  else state.contacts.unshift(contact);
  document.getElementById('contactDialog').close();
  saveState();
});

document.getElementById('noteForm').addEventListener('submit', (event) => {
  event.preventDefault();
  if (!document.getElementById('noteContact').value) return;
  state.notes.unshift({
    id: crypto.randomUUID(),
    contactId: document.getElementById('noteContact').value,
    type: document.getElementById('noteType').value,
    text: document.getElementById('noteText').value.trim(),
    nextStep: document.getElementById('nextStep').value.trim(),
    followupDate: document.getElementById('followupDate').value,
    createdAt: new Date().toISOString()
  });
  event.target.reset();
  saveState();
  navTo('today');
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `networkee-export-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

function getContactNotes(contactId) {
  return state.notes
    .filter(n => n.contactId === contactId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function lastInteraction(contact) {
  return getContactNotes(contact.id)[0] || null;
}

function daysSince(dateString) {
  if (!dateString) return Infinity;
  const start = new Date(dateString);
  const now = new Date();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

function scoreFor(contact) {
  const last = lastInteraction(contact);
  const days = last ? daysSince(last.createdAt) : daysSince(contact.createdAt);
  let score = 'D';
  if (days <= 30) score = 'A+';
  else if (days <= 60) score = 'A';
  else if (days <= 120) score = 'B';
  else if (days <= 180) score = 'C';
  const level = { 'A+': 'excellent', 'A': 'good', 'B': 'ok', 'C': 'weak', 'D': 'risk' }[score];
  return { score, level, days, source: last ? 'Letzte Interaktion' : 'Seit Erstellung' };
}

function relationshipInsight(contact) {
  const s = scoreFor(contact);
  if (s.score === 'A+') return `Stark gepflegt. Letzter Kontakt vor ${s.days} Tagen.`;
  if (s.score === 'A') return `Solide Beziehung. Plane den nächsten Kontaktpunkt in den kommenden Wochen.`;
  if (s.score === 'B') return `Kontakt kühlt ab. Ein kurzer Check-in wäre sinnvoll.`;
  if (s.score === 'C') return `Beziehung verliert Momentum. Aktiviere sie gezielt.`;
  return `Gefährdete Beziehung. Du hattest seit ${s.days === Infinity ? 'längerer Zeit' : s.days + ' Tagen'} keinen dokumentierten Kontakt.`;
}

function recommendedAction(contact) {
  const s = scoreFor(contact);
  if (s.score === 'A+' || s.score === 'A') return lastInteraction(contact)?.nextStep || 'Beziehung warm halten, aber nicht erzwingen.';
  if (contact.priority === 'High') return 'Diese Woche persönlich melden oder konkreten Termin vorschlagen.';
  if (s.score === 'B') return 'Kurze Nachricht senden und an letztes Thema anknüpfen.';
  return 'Entscheiden: aktivieren, archivieren oder Follow-up setzen.';
}

function isDue(note) {
  const today = new Date().toISOString().slice(0, 10);
  return note.followupDate && note.followupDate <= today;
}

function openContactDialog(contact = null) {
  document.getElementById('dialogTitle').textContent = contact ? 'Person bearbeiten' : 'Person hinzufügen';
  document.getElementById('contactId').value = contact?.id || '';
  document.getElementById('contactName').value = contact?.name || '';
  document.getElementById('contactRole').value = contact?.role || '';
  document.getElementById('contactCompany').value = contact?.company || '';
  document.getElementById('contactTags').value = contact?.tags?.join(', ') || '';
  document.getElementById('contactPriority').value = contact?.priority || 'Medium';
  document.getElementById('contactBirthday').value = contact?.birthday || '';
  document.getElementById('relationshipGoal').value = contact?.goal || 'Kontakt warm halten';
  document.getElementById('contactMemory').value = contact?.memory || '';
  document.getElementById('contactDialog').showModal();
}

function deleteContact(id) {
  if (!confirm('Person wirklich löschen? Zugehörige Interaktionen werden ebenfalls entfernt.')) return;
  state.contacts = state.contacts.filter(c => c.id !== id);
  state.notes = state.notes.filter(n => n.contactId !== id);
  saveState();
}

function contactName(id) { return state.contacts.find(c => c.id === id)?.name || 'Unbekannte Person'; }

function renderToday() {
  const dueNotes = state.notes.filter(isDue);
  const scored = state.contacts.map(c => ({ contact: c, ...scoreFor(c) }));
  const atRisk = scored.filter(x => ['C', 'D'].includes(x.score));
  const top = scored.filter(x => ['A+', 'A'].includes(x.score));
  document.getElementById('dueTodayCount').textContent = dueNotes.length;
  document.getElementById('atRiskCount').textContent = atRisk.length;
  document.getElementById('topContactCount').textContent = top.length;

  const todayList = document.getElementById('todayList');
  const tasks = [
    ...dueNotes.map(n => ({ type: 'Follow-up', title: contactName(n.contactId), body: n.nextStep || 'Nächsten Kontaktpunkt setzen', contactId: n.contactId, date: n.followupDate })),
    ...atRisk.slice(0, 3).map(x => ({ type: `Score ${x.score}`, title: x.contact.name, body: recommendedAction(x.contact), contactId: x.contact.id, date: '' }))
  ];
  if (!tasks.length) {
    todayList.className = 'list empty-state';
    todayList.textContent = 'Keine dringenden Beziehungspunkte für heute.';
  } else {
    todayList.className = 'list';
    todayList.innerHTML = tasks.map(t => `
      <article class="task-item" onclick='openProfile("${t.contactId}")'>
        <p class="pill">${escapeHTML(t.type)}</p>
        <h3>${escapeHTML(t.title)}</h3>
        <p class="meta">${escapeHTML(t.body)}</p>
        ${t.date ? `<p class="date-line">Fällig: ${formatDate(t.date)}</p>` : ''}
      </article>
    `).join('');
  }

  const signalList = document.getElementById('signalList');
  if (!state.contacts.length) {
    signalList.innerHTML = '<p class="empty-state">Erfasse zuerst Personen in deinem Netzwerk.</p>';
  } else {
    signalList.innerHTML = [
      { label: 'Beste Beziehung', value: top[0]?.contact.name || 'Noch keine', sub: top[0] ? `Score ${top[0].score}` : 'Interaktionen erfassen' },
      { label: 'Grösstes Risiko', value: atRisk[0]?.contact.name || 'Keine', sub: atRisk[0] ? `Score ${atRisk[0].score}` : 'Aktuell stabil' },
      { label: 'Offene Follow-ups', value: dueNotes.length, sub: 'Heute oder überfällig' }
    ].map(s => `<article class="signal-card"><p>${s.label}</p><h3>${escapeHTML(s.value)}</h3><span>${escapeHTML(s.sub)}</span></article>`).join('');
  }
}

function renderContacts() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const list = document.getElementById('contactList');
  const filtered = state.contacts
    .filter(c => [c.name, c.role, c.company, c.goal, c.memory, c.priority, ...(c.tags || [])].join(' ').toLowerCase().includes(query))
    .sort((a,b) => scoreFor(a).score.localeCompare(scoreFor(b).score));
  if (!filtered.length) {
    list.innerHTML = '<p class="empty-state">Keine Personen gefunden.</p>';
    return;
  }
  list.innerHTML = filtered.map(c => {
    const s = scoreFor(c);
    const notes = getContactNotes(c.id);
    return `
      <article class="contact-card" onclick='openProfile("${c.id}")'>
        <header>
          <div class="avatar">${initials(c.name)}</div>
          <div class="contact-main">
            <h3>${escapeHTML(c.name)}</h3>
            <p class="meta">${escapeHTML([c.role, c.company].filter(Boolean).join(' · ') || c.goal)}</p>
          </div>
          <div class="score ${s.level}">${s.score}</div>
        </header>
        <div class="tags">${(c.tags || []).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}<span class="tag priority">${escapeHTML(c.priority || 'Medium')}</span></div>
        <p class="memory">${escapeHTML(relationshipInsight(c))}</p>
        <p class="meta">${notes.length} Interaktion(en) · ${escapeHTML(s.source)}: ${s.days === Infinity ? 'keine' : 'vor ' + s.days + ' Tagen'}</p>
        <div class="card-actions" onclick="event.stopPropagation()">
          <button class="small-btn" onclick='quickNote("${c.id}")'>Capture</button>
          <button class="small-btn" onclick='editContact("${c.id}")'>Bearbeiten</button>
          <button class="small-btn danger-text" onclick='deleteContact("${c.id}")'>Löschen</button>
        </div>
      </article>
    `;
  }).join('');
}

function openProfile(id) {
  const c = state.contacts.find(x => x.id === id);
  if (!c) return;
  const s = scoreFor(c);
  const notes = getContactNotes(id);
  const profile = document.getElementById('profileContent');
  profile.innerHTML = `
    <div class="profile-head">
      <div class="avatar large">${initials(c.name)}</div>
      <div>
        <p class="eyebrow">Kontaktprofil</p>
        <h2>${escapeHTML(c.name)}</h2>
        <p class="meta">${escapeHTML([c.role, c.company].filter(Boolean).join(' · ') || c.goal)}</p>
      </div>
      <div class="score ${s.level}">${s.score}</div>
    </div>
    <div class="insight-box">
      <strong>Relationship Insight</strong>
      <p>${escapeHTML(relationshipInsight(c))}</p>
      <p><strong>Empfohlene Aktion:</strong> ${escapeHTML(recommendedAction(c))}</p>
    </div>
    <div class="profile-grid">
      <div><span>Ziel</span><strong>${escapeHTML(c.goal)}</strong></div>
      <div><span>Priorität</span><strong>${escapeHTML(c.priority || 'Medium')}</strong></div>
      <div><span>Geburtstag</span><strong>${c.birthday ? formatDate(c.birthday) : '—'}</strong></div>
      <div><span>Interaktionen</span><strong>${notes.length}</strong></div>
    </div>
    <h3>Wichtig zu merken</h3>
    <p class="memory">${escapeHTML(c.memory || 'Noch keine Merkhilfe hinterlegt.')}</p>
    <h3>Timeline</h3>
    <div class="timeline">
      ${notes.length ? notes.map(n => `
        <article class="timeline-item">
          <p class="timeline-date">${formatDate(n.createdAt)} · ${escapeHTML(n.type)}</p>
          <p>${escapeHTML(n.text)}</p>
          ${n.nextStep ? `<p class="meta"><strong>Nächster Schritt:</strong> ${escapeHTML(n.nextStep)}</p>` : ''}
          ${n.followupDate ? `<p class="date-line">Follow-up: ${formatDate(n.followupDate)}</p>` : ''}
        </article>`).join('') : '<p class="empty-state">Noch keine Timeline vorhanden.</p>'}
    </div>
    <div class="card-actions">
      <button class="small-btn" onclick='quickNote("${c.id}")'>Neue Interaktion</button>
      <button class="small-btn" onclick='editContact("${c.id}")'>Bearbeiten</button>
    </div>
  `;
  document.getElementById('profileDialog').showModal();
}

function editContact(id) { openContactDialog(state.contacts.find(c => c.id === id)); }
function quickNote(id) {
  document.getElementById('profileDialog').close();
  navTo('capture');
  document.getElementById('noteContact').value = id;
  document.getElementById('noteText').focus();
}
window.editContact = editContact;
window.quickNote = quickNote;
window.deleteContact = deleteContact;
window.openProfile = openProfile;

function renderNoteContacts() {
  const select = document.getElementById('noteContact');
  select.innerHTML = state.contacts.length
    ? state.contacts.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('')
    : '<option value="" disabled>Bitte zuerst Person erfassen</option>';
}

function renderInsights() {
  const list = document.getElementById('insightList');
  if (!state.contacts.length) {
    list.className = 'list empty-state';
    list.textContent = 'Noch keine Insights vorhanden.';
    return;
  }
  const sorted = state.contacts.map(c => ({ c, ...scoreFor(c) })).sort((a,b) => b.days - a.days);
  list.className = 'list';
  list.innerHTML = sorted.map(({ c, score, level, days }) => `
    <article class="insight-card" onclick='openProfile("${c.id}")'>
      <div class="insight-row">
        <div><h3>${escapeHTML(c.name)}</h3><p class="meta">${escapeHTML(c.goal)} · Priorität ${escapeHTML(c.priority || 'Medium')}</p></div>
        <div class="score ${level}">${score}</div>
      </div>
      <p class="memory"><strong>Insight:</strong> ${escapeHTML(relationshipInsight(c))}</p>
      <p class="memory"><strong>Empfohlene Aktion:</strong> ${escapeHTML(recommendedAction(c))}</p>
      <p class="meta">${days === Infinity ? 'Keine Interaktion dokumentiert' : 'Letzter dokumentierter Kontakt vor ' + days + ' Tagen'}</p>
    </article>
  `).join('');
}

function renderAll() { renderToday(); renderContacts(); renderNoteContacts(); renderInsights(); }
function formatDate(date) { return new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date)); }
function escapeHTML(str) { return String(str || '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char])); }
function initials(name) { return String(name || '?').split(' ').filter(Boolean).slice(0,2).map(p => p[0]).join('').toUpperCase(); }

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js?v=2.0').catch(() => {});
renderAll();
