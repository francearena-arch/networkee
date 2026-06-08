const STORAGE_KEY = 'networkee_mvp_v4';
const LEGACY_KEYS = ['networkee_mvp_v3', 'networkee_mvp_v2', 'networkee_mvp_v1'];

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
  for (const key of LEGACY_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy) {
      try {
        const migrated = normalizeState(JSON.parse(legacy));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      } catch { /* continue */ }
    }
  }
  return structuredClone(seedData);
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
  closeMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openMenu() {
  const menu = document.getElementById('sideMenu');
  menu.classList.add('open');
  menu.setAttribute('aria-hidden', 'false');
  document.getElementById('menuBtn').setAttribute('aria-expanded', 'true');
}

function closeMenu() {
  const menu = document.getElementById('sideMenu');
  menu.classList.remove('open');
  menu.setAttribute('aria-hidden', 'true');
  document.getElementById('menuBtn').setAttribute('aria-expanded', 'false');
}

document.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', () => navTo(btn.dataset.nav)));
document.getElementById('addContactBtn').addEventListener('click', () => openContactDialog());
document.getElementById('menuBtn').addEventListener('click', openMenu);
document.getElementById('closeMenuBtn').addEventListener('click', closeMenu);
document.getElementById('sideMenu').addEventListener('click', (event) => { if (event.target.id === 'sideMenu') closeMenu(); });
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

document.getElementById('exportBtn').addEventListener('click', () => { closeMenu(); document.getElementById('exportDialog').showModal(); });
document.getElementById('closeExport').addEventListener('click', () => document.getElementById('exportDialog').close());
document.getElementById('exportJsonBtn').addEventListener('click', exportJSON);
document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);
document.getElementById('exportPdfBtn').addEventListener('click', exportPDF);

function downloadBlob(filename, content, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportJSON() {
  downloadBlob(`networkee-export-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(state, null, 2), 'application/json');
}

function csvEscape(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

function exportCSV() {
  const contactRows = [['id','name','role','company','tags','priority','goal','birthday','memory','relationship_score','last_contact_days','created_at']];
  state.contacts.forEach(c => {
    const s = scoreFor(c);
    contactRows.push([c.id,c.name,c.role,c.company,(c.tags || []).join('|'),c.priority,c.goal,c.birthday,c.memory,s.score,s.days === Infinity ? '' : s.days,c.createdAt]);
  });
  const noteRows = [['id','contact_id','contact_name','type','text','next_step','followup_date','created_at']];
  state.notes.forEach(n => noteRows.push([n.id,n.contactId,contactName(n.contactId),n.type,n.text,n.nextStep,n.followupDate,n.createdAt]));
  const contactsCsv = contactRows.map(r => r.map(csvEscape).join(',')).join('\n');
  const notesCsv = noteRows.map(r => r.map(csvEscape).join(',')).join('\n');
  const date = new Date().toISOString().slice(0,10);
  downloadBlob(`networkee-contacts-${date}.csv`, contactsCsv, 'text/csv;charset=utf-8');
  setTimeout(() => downloadBlob(`networkee-interactions-${date}.csv`, notesCsv, 'text/csv;charset=utf-8'), 300);
}

function pdfEscape(text) {
  return String(text ?? '').replace(/[\\()]/g, m => '\\' + m).replace(/[\r\n]+/g, ' ');
}


function createSimplePDF(lines) {
  const objects = [];
  const add = obj => { objects.push(obj); return objects.length; };
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const titleFont = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');
  let content = 'BT\n';
  let y = 800;
  lines.forEach(line => {
    if (y < 60) return;
    const size = line.title ? 18 : 11;
    const f = line.title ? 'F2' : 'F1';
    content += `/${f} ${size} Tf 50 ${y} Td (${pdfEscape(line.text).slice(0,95)}) Tj\n`;
    y -= line.title ? 28 : 17;
  });
  content += 'ET';
  const stream = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  const pages = add('<< /Type /Pages /Kids [5 0 R] /Count 1 >>');
  const page = add(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R /F2 ${titleFont} 0 R >> >> /Contents ${stream} 0 R >>`);
  objects[pages-1] = `<< /Type /Pages /Kids [${page} 0 R] /Count 1 >>`;
  const catalog = add(`<< /Type /Catalog /Pages ${pages} 0 R >>`);
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((obj, i) => { offsets.push(pdf.length); pdf += `${i+1} 0 obj\n${obj}\nendobj\n`; });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(o => pdf += String(o).padStart(10,'0') + ' 00000 n \n');
  pdf += `trailer << /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

function exportPDF() {
  const scored = state.contacts.map(c => ({ c, ...scoreFor(c) })).sort((a,b) => b.days - a.days);
  const due = state.notes.filter(isDue);
  const lines = [
    { title: true, text: 'Networkee Relationship Report' },
    { text: `Export: ${new Date().toLocaleDateString('de-CH')}` },
    { text: `Kontakte: ${state.contacts.length} | Interaktionen: ${state.notes.length} | Offene Follow-ups: ${due.length}` },
    { title: true, text: 'Relationship Signals' },
    ...relationshipSignalCards(scored, due).map(s => ({ text: `${s.label}: ${s.value} | ${s.sub} | Aktion: ${s.action}` })),
    { title: true, text: 'Kontakte' },
    ...scored.flatMap(({ c, score, days }) => ([
      { text: `${c.name} (${score}) - ${c.goal || 'kein Ziel'} - letzter Kontakt: ${days === Infinity ? 'keiner' : days + ' Tage'}` },
      { text: `Merken: ${c.memory || '-'}` }
    ]))
  ];
  downloadBlob(`networkee-report-${new Date().toISOString().slice(0,10)}.pdf`, createSimplePDF(lines), 'application/pdf');
}

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


function birthdayWithinDays(contact, daysAhead = 30) {
  if (!contact.birthday) return null;
  const now = new Date();
  const [year, month, day] = contact.birthday.split('-').map(Number);
  const next = new Date(now.getFullYear(), month - 1, day);
  if (next < new Date(now.toDateString())) next.setFullYear(now.getFullYear() + 1);
  const diff = Math.ceil((next - now) / (1000 * 60 * 60 * 24));
  return diff <= daysAhead ? diff : null;
}

function strongestSignal(scored, dueNotes) {
  const atRiskHigh = scored.filter(x => ['C', 'D', 'B'].includes(x.score) && x.contact.priority === 'High').sort((a,b) => b.days - a.days)[0];
  if (dueNotes.length) return { headline: `Heute solltest du ${contactName(dueNotes[0].contactId)} kontaktieren.`, copy: `${dueNotes.length} Follow-up${dueNotes.length > 1 ? 's' : ''} wartet. Networkee empfiehlt: nachfassen, bevor Momentum verloren geht.` };
  if (atRiskHigh) return { headline: `${atRiskHigh.contact.name} braucht Aufmerksamkeit.`, copy: `Priorität High · ${atRiskHigh.days} Tage kein dokumentierter Kontakt · jetzt persönlichen Check-in setzen.` };
  const birthday = state.contacts.map(c => ({ c, diff: birthdayWithinDays(c, 30) })).filter(x => x.diff !== null).sort((a,b) => a.diff - b.diff)[0];
  if (birthday) return { headline: `Baldiger Anlass: ${birthday.c.name}`, copy: birthday.diff === 0 ? 'Heute Geburtstag. Persönliche Nachricht senden.' : `Geburtstag in ${birthday.diff} Tagen. Merke dir einen persönlichen Kontaktpunkt.` };
  return { headline: 'Heute ist dein Netzwerk stabil.', copy: 'Erfasse neue Gespräche, damit Networkee feinere Beziehungssignale erkennt.' };
}

function memoryPreview(contact) {
  if (contact.memory) return contact.memory.split('.').filter(Boolean)[0].trim() + '.';
  if (contact.goal) return `Beziehungsziel: ${contact.goal}.`;
  return 'Noch keine persönliche Merkhilfe hinterlegt.';
}

function opportunitySignal(scored) {
  const highDue = scored.filter(x => x.contact.priority === 'High' && x.days >= 30).sort((a,b) => b.days - a.days)[0];
  if (highDue) return { contact: highDue.contact, days: highDue.days, action: recommendedAction(highDue.contact) };
  const next = state.contacts.map(c => ({ contact: c, note: lastInteraction(c) })).filter(x => x.note?.nextStep).sort((a,b) => new Date(b.note.createdAt) - new Date(a.note.createdAt))[0];
  return next ? { contact: next.contact, days: scoreFor(next.contact).days, action: next.note.nextStep } : null;
}

function relationshipSignalCards(scored, dueNotes) {
  const attention = scored.filter(x => ['B', 'C', 'D'].includes(x.score)).sort((a,b) => {
    const prio = { High: 3, Medium: 2, Low: 1 };
    return (prio[b.contact.priority] - prio[a.contact.priority]) || (b.days - a.days);
  })[0];
  const opportunity = opportunitySignal(scored);
  const birthday = state.contacts.map(c => ({ c, diff: birthdayWithinDays(c, 45) })).filter(x => x.diff !== null).sort((a,b) => a.diff - b.diff)[0];
  return [
    {
      cls: attention ? 'attention' : 'calm',
      icon: attention ? '⚠️' : '✅',
      label: 'Aufmerksamkeit nötig',
      value: attention ? attention.contact.name : 'Alles stabil',
      sub: attention ? `${attention.days} Tage ruhig · Score ${attention.score}` : 'Keine Beziehung kühlt kritisch ab',
      action: attention ? recommendedAction(attention.contact) : 'Neue Gespräche erfassen'
    },
    {
      cls: opportunity ? 'opportunity' : 'calm',
      icon: '🎯',
      label: 'Opportunity',
      value: opportunity ? opportunity.contact.name : 'Keine offene Chance',
      sub: opportunity ? `Priorität ${opportunity.contact.priority || 'Medium'} · ${opportunity.contact.goal}` : 'Aktuell kein Handlungsfenster',
      action: opportunity ? opportunity.action : 'Kontaktziel setzen'
    },
    {
      cls: birthday ? 'moment' : 'calm',
      icon: birthday ? '🎂' : '✨',
      label: 'Persönlicher Moment',
      value: birthday ? birthday.c.name : 'Keiner',
      sub: birthday ? (birthday.diff === 0 ? 'Heute Geburtstag' : `Geburtstag in ${birthday.diff} Tagen`) : 'Keine Anlässe in 45 Tagen',
      action: birthday ? 'Persönliche Nachricht vorbereiten' : 'Geburtstage ergänzen'
    },
    {
      cls: dueNotes.length ? 'attention' : 'calm',
      icon: dueNotes.length ? '⏱️' : '🧘',
      label: 'Offene Follow-ups',
      value: String(dueNotes.length),
      sub: dueNotes.length ? 'Heute oder überfällig' : 'Nichts offen',
      action: dueNotes.length ? 'Heute erledigen' : 'Keine Aktion nötig'
    }
  ];
}


function renderToday() {
  const dueNotes = state.notes.filter(isDue);
  const scored = state.contacts.map(c => ({ contact: c, ...scoreFor(c) }));
  const atRisk = scored.filter(x => ['C', 'D'].includes(x.score));
  const top = scored.filter(x => ['A+', 'A'].includes(x.score));
  document.getElementById('dueTodayCount').textContent = dueNotes.length;
  document.getElementById('atRiskCount').textContent = atRisk.length;
  document.getElementById('topContactCount').textContent = top.length;
  const assistant = strongestSignal(scored, dueNotes);
  document.getElementById('assistantHeadline').textContent = assistant.headline;
  document.getElementById('assistantCopy').textContent = assistant.copy;

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
    signalList.innerHTML = relationshipSignalCards(scored, dueNotes)
      .map(s => `<article class="signal-card ${s.cls}"><div class="signal-top"><span class="signal-icon">${s.icon}</span><p>${s.label}</p></div><h3>${escapeHTML(s.value)}</h3><span>${escapeHTML(s.sub)}</span><strong>${escapeHTML(s.action)}</strong></article>`).join('');
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
        <p class="human-line">${escapeHTML(memoryPreview(c))}</p>
        <p class="memory">${escapeHTML(relationshipInsight(c))}</p>
        <p class="meta">${s.days === Infinity ? 'Noch keine Timeline' : 'Letzter Kontakt vor ' + s.days + ' Tagen'} · ${notes.length} Moment(e)</p>
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
    <div class="memory-card"><p>${escapeHTML(c.memory || 'Noch keine persönliche Merkhilfe hinterlegt. Erfasse Interessen, gemeinsame Themen oder private Details, damit aus dem Kontakt eine echte Beziehungserinnerung wird.')}</p></div>
    <h3>Relationship Timeline</h3>
    <div class="timeline">
      ${notes.length ? notes.map(n => `
        <article class="timeline-item">
          <p class="timeline-date">${formatDate(n.createdAt)} · ${escapeHTML(n.type)}</p>
          <p>${escapeHTML(n.text)}</p>
          ${n.nextStep ? `<p class="meta"><strong>Nächster Schritt:</strong> ${escapeHTML(n.nextStep)}</p>` : ''}
          ${n.followupDate ? `<p class="date-line">Follow-up: ${formatDate(n.followupDate)}</p>` : ''}
        </article>`).join('') : '<div class="timeline-empty">Noch keine gemeinsamen Momente dokumentiert.</div>'}
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

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js?v=4.0').catch(() => {});
renderAll();
