const STORAGE_KEY = 'networkee_mvp_v1';

const seedData = {
  contacts: [
    {
      id: crypto.randomUUID(),
      name: 'Angela Arena',
      role: 'Assistentin der Geschäftsleitung',
      company: '',
      tags: ['Interview', 'Organisation'],
      goal: 'Kontakt warm halten',
      memory: 'Exploratives Interview für Networkee. Relevante Zielgruppe mit hohem Organisationsbezug.',
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      name: 'Peter Streiff',
      role: 'Vertriebsprofi',
      company: '',
      tags: ['Sales', 'CRM', 'Interview'],
      goal: 'Geschäftschance entwickeln',
      memory: 'Perspektive aus Sales/Key Account. Hoher Fit für Relationship-Management-Use-Cases.',
      createdAt: new Date().toISOString()
    }
  ],
  notes: []
};

let state = loadState();

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return seedData;
  try { return JSON.parse(stored); } catch { return seedData; }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
}

function navTo(viewId) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === viewId));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === viewId));
}

document.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', () => navTo(btn.dataset.nav)));

document.getElementById('addContactBtn').addEventListener('click', () => openContactDialog());
document.getElementById('cancelDialog').addEventListener('click', () => document.getElementById('contactDialog').close());
document.getElementById('searchInput').addEventListener('input', renderContacts);

document.getElementById('contactForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const id = document.getElementById('contactId').value || crypto.randomUUID();
  const contact = {
    id,
    name: document.getElementById('contactName').value.trim(),
    role: document.getElementById('contactRole').value.trim(),
    company: document.getElementById('contactCompany').value.trim(),
    tags: document.getElementById('contactTags').value.split(',').map(t => t.trim()).filter(Boolean),
    goal: document.getElementById('relationshipGoal').value,
    memory: document.getElementById('contactMemory').value.trim(),
    createdAt: new Date().toISOString()
  };
  const index = state.contacts.findIndex(c => c.id === id);
  if (index >= 0) state.contacts[index] = { ...state.contacts[index], ...contact };
  else state.contacts.push(contact);
  document.getElementById('contactDialog').close();
  saveState();
});

document.getElementById('noteForm').addEventListener('submit', (event) => {
  event.preventDefault();
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
  navTo('dashboard');
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

function openContactDialog(contact = null) {
  document.getElementById('dialogTitle').textContent = contact ? 'Kontakt bearbeiten' : 'Kontakt hinzufügen';
  document.getElementById('contactId').value = contact?.id || '';
  document.getElementById('contactName').value = contact?.name || '';
  document.getElementById('contactRole').value = contact?.role || '';
  document.getElementById('contactCompany').value = contact?.company || '';
  document.getElementById('contactTags').value = contact?.tags?.join(', ') || '';
  document.getElementById('relationshipGoal').value = contact?.goal || 'Kontakt warm halten';
  document.getElementById('contactMemory').value = contact?.memory || '';
  document.getElementById('contactDialog').showModal();
}

function deleteContact(id) {
  if (!confirm('Kontakt wirklich löschen? Zugehörige Interaktionen werden ebenfalls entfernt.')) return;
  state.contacts = state.contacts.filter(c => c.id !== id);
  state.notes = state.notes.filter(n => n.contactId !== id);
  saveState();
}

function contactName(id) {
  return state.contacts.find(c => c.id === id)?.name || 'Unbekannter Kontakt';
}

function renderDashboard() {
  const today = new Date().toISOString().slice(0,10);
  const due = state.notes.filter(n => n.followupDate && n.followupDate <= today);
  document.getElementById('contactCount').textContent = state.contacts.length;
  document.getElementById('noteCount').textContent = state.notes.length;
  document.getElementById('dueCount').textContent = due.length;

  const list = document.getElementById('followupList');
  const upcoming = state.notes
    .filter(n => n.followupDate)
    .sort((a,b) => a.followupDate.localeCompare(b.followupDate))
    .slice(0, 5);

  if (!upcoming.length) {
    list.className = 'list empty-state';
    list.textContent = 'Noch keine Follow-ups vorhanden.';
    return;
  }
  list.className = 'list';
  list.innerHTML = upcoming.map(n => `
    <article class="followup-item">
      <p class="followup-date">${formatDate(n.followupDate)}</p>
      <h3>${contactName(n.contactId)}</h3>
      <p class="meta">${escapeHTML(n.nextStep || 'Nächsten Kontaktpunkt planen')}</p>
    </article>
  `).join('');
}

function renderContacts() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const list = document.getElementById('contactList');
  const filtered = state.contacts.filter(c => [c.name, c.role, c.company, c.goal, c.memory, ...(c.tags || [])].join(' ').toLowerCase().includes(query));
  if (!filtered.length) {
    list.innerHTML = '<p class="empty-state">Keine Kontakte gefunden.</p>';
    return;
  }
  list.innerHTML = filtered.map(c => `
    <article class="contact-card">
      <header>
        <div>
          <h3>${escapeHTML(c.name)}</h3>
          <p class="meta">${escapeHTML([c.role, c.company].filter(Boolean).join(' · ') || c.goal)}</p>
        </div>
      </header>
      <div class="tags">${(c.tags || []).map(t => `<span class="tag">${escapeHTML(t)}</span>`).join('')}</div>
      <p class="memory">${escapeHTML(c.memory || 'Noch keine Merkhilfe hinterlegt.')}</p>
      <div class="card-actions">
        <button class="small-btn" onclick='editContact("${c.id}")'>Bearbeiten</button>
        <button class="small-btn" onclick='quickNote("${c.id}")'>Notiz</button>
        <button class="small-btn" onclick='deleteContact("${c.id}")'>Löschen</button>
      </div>
    </article>
  `).join('');
}

function editContact(id) { openContactDialog(state.contacts.find(c => c.id === id)); }
function quickNote(id) { navTo('capture'); document.getElementById('noteContact').value = id; document.getElementById('noteText').focus(); }
window.editContact = editContact;
window.quickNote = quickNote;
window.deleteContact = deleteContact;

function renderNoteContacts() {
  const select = document.getElementById('noteContact');
  select.innerHTML = state.contacts.length
    ? state.contacts.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('')
    : '<option value="" disabled>Bitte zuerst Kontakt erfassen</option>';
}

function renderInsights() {
  const list = document.getElementById('insightList');
  if (!state.contacts.length) {
    list.className = 'list empty-state';
    list.textContent = 'Noch keine Insights vorhanden.';
    return;
  }
  list.className = 'list';
  list.innerHTML = state.contacts.map(c => {
    const notes = state.notes.filter(n => n.contactId === c.id);
    const last = notes[0];
    return `
      <article class="insight-card">
        <h3>${escapeHTML(c.name)}</h3>
        <p class="meta">${notes.length} Interaktion(en) · Ziel: ${escapeHTML(c.goal)}</p>
        <p class="memory"><strong>Letzter Stand:</strong> ${escapeHTML(last?.text || c.memory || 'Noch keine Interaktion erfasst.')}</p>
        <p class="memory"><strong>Empfohlene Aktion:</strong> ${escapeHTML(last?.nextStep || 'Ersten konkreten nächsten Schritt definieren.')}</p>
      </article>
    `;
  }).join('');
}

function renderAll() {
  renderDashboard();
  renderContacts();
  renderNoteContacts();
  renderInsights();
}

function formatDate(date) {
  return new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(date));
}

function escapeHTML(str) {
  return String(str || '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

renderAll();
