/* =========================================================
   STATE
   ========================================================= */
function uid(){ return Math.random().toString(36).slice(2,10); }

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [];
for(let y = CURRENT_YEAR + 6; y >= 1980; y--) YEARS.push(y);

// Which repeatable sections use a Month/Year date-range picker
// instead of a free-text "period" field.
const PERIOD_SECTIONS = { education:true, experience:true, volunteer:true, projects:true, awards:false };

function formatPeriod(e){
  const startStr = [e.startMonth, e.startYear].filter(Boolean).join(' ');
  const endStr = e.current ? 'Present' : [e.endMonth, e.endYear].filter(Boolean).join(' ');
  if(!startStr && !endStr) return '';
  if(startStr && endStr) return `${startStr} - ${endStr}`;
  return startStr || endStr;
}

function emptyEntry(){
  return {
    id:uid(), left:'', right:'', subLeft:'', subRight:'', bulletsText:'',
    startMonth:'', startYear:'', endMonth:'', endYear:'', current:false
  };
}

// Backward compatibility: older exported JSON files stored bullets as an
// array of strings (data.sections.X.entries[].bullets). Convert those into
// the current single multi-line bulletsText field.
function migrateEntry(entry){
  if(entry.bulletsText === undefined){
    entry.bulletsText = Array.isArray(entry.bullets)
      ? entry.bullets.filter(b=>b && b.trim()).join('\n')
      : '';
  }
  delete entry.bullets;
  return entry;
}
function migrateData(d){
  Object.keys(d.sections||{}).forEach(key=>{
    d.sections[key].entries = d.sections[key].entries.map(migrateEntry);
  });
  if(!Array.isArray(d.sectionOrder) || !d.sectionOrder.length){
    d.sectionOrder = Object.keys(d.sections || {});
  }
  return d;
}

function defaultData(){
  return {
    photo: null,
    name: 'Nama Lengkap Anda',
    title: '',
    location: 'Kota, Negara',
    phone: '08xx-xxxx-xxxx',
    email: 'nama@email.com',
    linkedin: '',
    github: '',
    summary: 'Ringkasan singkat 1-2 kalimat tentang latar belakang dan keahlian utama Anda.',
    sections: {
      education:   { label:'EDUCATION',   entries:[emptyEntry()] },
      experience:  { label:'WORK EXPERIENCE', entries:[emptyEntry()] },
      volunteer:   { label:'ORGANIZATIONAL & VOLUNTEER EXPERIENCE', entries:[] },
      projects:    { label:'PROJECTS',    entries:[] },
      awards:      { label:'AWARDS',      entries:[] }
    },
    // Controls which order these sections appear in, both in the form and
    // in the CV preview. Reorderable via the ▲▼ buttons on each fieldset.
    sectionOrder: ['education','experience','volunteer','projects','awards'],
    certifications: [ { id:uid(), name:'', issuer:'', link:'', date:'' } ],
    skills: [ { id:uid(), category:'Web Development', items:'HTML, CSS, PHP, JavaScript' } ],
    languages: [ { id:uid(), name:'Indonesia', level:'Native proficiency' } ]
  };
}

let data = defaultData();

/* =========================================================
   HELPERS
   ========================================================= */
function esc(str){
  return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
// Escapes text for safe HTML output, then converts markdown-style **bold**
// into real <strong> tags for the preview/print output.
function fmt(str){
  return esc(str).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
function toggleBold(el){
  const start = el.selectionStart;
  const end = el.selectionEnd;
  const value = el.value;
  if(start === end){
    // no selection: insert an empty ** ** pair and place the cursor inside
    el.value = value.slice(0,start) + '****' + value.slice(start);
    el.selectionStart = el.selectionEnd = start + 2;
  } else {
    const selected = value.slice(start,end);
    const alreadyBold = selected.length >= 4 && selected.startsWith('**') && selected.endsWith('**');
    if(alreadyBold){
      const unwrapped = selected.slice(2,-2);
      el.value = value.slice(0,start) + unwrapped + value.slice(end);
      el.selectionStart = start;
      el.selectionEnd = start + unwrapped.length;
    } else {
      el.value = value.slice(0,start) + '**' + selected + '**' + value.slice(end);
      el.selectionStart = start;
      el.selectionEnd = end + 4;
    }
  }
  // let the element's own 'input' listener pick up the change and update state
  el.dispatchEvent(new Event('input', {bubbles:true}));
}
// Global Ctrl/Cmd+B handler: bolds the current selection in any text field
// inside the form panel using markdown-style **bold** syntax.
document.addEventListener('keydown', (e)=>{
  const isBoldShortcut = (e.key === 'b' || e.key === 'B') && (e.ctrlKey || e.metaKey);
  if(!isBoldShortcut) return;
  const el = document.activeElement;
  if(!el) return;
  const isTextField = el.tagName === 'TEXTAREA' ||
    (el.tagName === 'INPUT' && ['text','email','tel'].includes(el.type));
  if(!isTextField || !formRoot.contains(el)) return;
  e.preventDefault();
  toggleBold(el);
});
function autoLink(text){
  // turns bare urls typed by user into <a> only in preview
  return esc(text);
}

/* =========================================================
   FORM RENDERING
   ========================================================= */
const formRoot = document.getElementById('formRoot');

function renderForm(){
  formRoot.innerHTML = `
    ${photoFieldset()}
    ${basicsFieldset()}
    ${data.sectionOrder.map((key,idx) => repeatableFieldset(key, idx, data.sectionOrder.length)).join('')}
    ${certificationsFieldset()}
    ${skillsFieldset()}
    ${languagesFieldset()}
  `;
  attachFormEvents();
}

function photoFieldset(){
  const preview = data.photo ? `
    <div class="photo-preview-wrap">
      <img src="${data.photo}" alt="Preview foto" class="photo-preview">
      <div class="photo-preview-actions">
        <label class="btn btn-ghost btn-small" style="cursor:pointer;">
          Ganti foto
          <input type="file" id="photoInput" accept="image/*" style="display:none;">
        </label>
        <button class="btn btn-ghost btn-small" type="button" id="removePhoto">Hapus foto</button>
      </div>
    </div>` : `
    <label class="btn" style="cursor:pointer; display:inline-block;">
      Upload foto
      <input type="file" id="photoInput" accept="image/*" style="display:none;">
    </label>
    <div class="empty-hint">Belum ada foto. Disarankan foto formal rasio potret (3:4).</div>`;
  return `
  <fieldset>
    <legend>Foto Profil (opsional)</legend>
    ${preview}
  </fieldset>`;
}

function basicsFieldset(){
  return `
  <fieldset>
    <legend>Header</legend>
    <label>Nama lengkap</label>
    <input type="text" data-path="name" value="${esc(data.name)}">
    <div class="row2">
      <div>
        <label>Lokasi</label>
        <input type="text" data-path="location" value="${esc(data.location)}">
      </div>
      <div>
        <label>Telepon</label>
        <input type="text" data-path="phone" value="${esc(data.phone)}">
      </div>
    </div>
    <div class="row2">
      <div>
        <label>Email</label>
        <input type="email" data-path="email" value="${esc(data.email)}">
      </div>
      <div>
        <label>LinkedIn (URL)</label>
        <input type="text" data-path="linkedin" value="${esc(data.linkedin)}" placeholder="linkedin.com/in/...">
      </div>
    </div>
    <label>GitHub / Portfolio (URL)</label>
    <input type="text" data-path="github" value="${esc(data.github)}" placeholder="github.com/username">
    <label>Ringkasan singkat (opsional)</label>
    <textarea data-path="summary" rows="2">${esc(data.summary)}</textarea>
  </fieldset>`;
}

const SECTION_FIELD_LABELS = {
  education:  { left:'Nama sekolah / universitas', right:'Periode', subLeft:'Gelar & jurusan', subRight:'GPA (cukup angkanya, mis. 3.71)' },
  experience: { left:'Jabatan', right:'Periode', subLeft:'Nama perusahaan', subRight:'Lokasi' },
  volunteer:  { left:'Peran', right:'Periode', subLeft:'Organisasi', subRight:'Lokasi' },
  projects:   { left:'Nama proyek', right:'Periode', subLeft:'Link proyek (opsional)', subRight:'Lokasi (opsional)' },
  awards:     { left:'Nama penghargaan', right:'Tanggal', subLeft:'Pemberi penghargaan', subRight:'' }
};

function repeatableFieldset(key, orderIdx, orderTotal){
  const sec = data.sections[key];
  const fLabels = SECTION_FIELD_LABELS[key];
  const entries = sec.entries.map((e,i) => entryCard(key, e, i, fLabels)).join('');
  const isFirst = orderIdx === 0;
  const isLast = orderIdx === orderTotal - 1;
  return `
  <fieldset data-section="${key}">
    <legend>
      <input type="text" class="section-title-input" data-section-label="${key}" value="${esc(sec.label)}"
        style="background:none;border:none;color:inherit;font:inherit;padding:0;width:auto;flex:1;">
      <span class="legend-actions">
        <button class="move-btn" type="button" data-move-section="${key}" data-direction="up" ${isFirst?'disabled':''} title="Pindah section ke atas">▲</button>
        <button class="move-btn" type="button" data-move-section="${key}" data-direction="down" ${isLast?'disabled':''} title="Pindah section ke bawah">▼</button>
        <button class="add-btn" data-add-entry="${key}" type="button">+ Add</button>
      </span>
    </legend>
    ${entries || `<div class="empty-hint">Belum ada entri. Klik "+ Add" untuk menambahkan.</div>`}
  </fieldset>`;
}

function entryCard(sectionKey, e, idx, fLabels){
  const isPeriod = PERIOD_SECTIONS[sectionKey];

  const monthOptions = (selected) => `<option value="">Bulan</option>` +
    MONTHS.map(m => `<option value="${m}" ${selected===m?'selected':''}>${m}</option>`).join('');
  const yearOptions = (selected) => `<option value="">Tahun</option>` +
    YEARS.map(y => `<option value="${y}" ${String(selected)===String(y)?'selected':''}>${y}</option>`).join('');

  const titleDateBlock = isPeriod ? `
    <label>${fLabels.left}</label>
    <input type="text" data-field-section="${sectionKey}" data-entry-id="${e.id}" data-field="left" value="${esc(e.left)}">

    <label>Mulai</label>
    <div class="period-row">
      <select data-period-section="${sectionKey}" data-entry-id="${e.id}" data-period-field="startMonth">${monthOptions(e.startMonth)}</select>
      <select data-period-section="${sectionKey}" data-entry-id="${e.id}" data-period-field="startYear">${yearOptions(e.startYear)}</select>
    </div>

    <label>Selesai</label>
    <div class="period-row">
      <select data-period-section="${sectionKey}" data-entry-id="${e.id}" data-period-field="endMonth" ${e.current?'disabled':''}>${monthOptions(e.endMonth)}</select>
      <select data-period-section="${sectionKey}" data-entry-id="${e.id}" data-period-field="endYear" ${e.current?'disabled':''}>${yearOptions(e.endYear)}</select>
    </div>
    <label class="checkbox-label">
      <input type="checkbox" data-period-section="${sectionKey}" data-entry-id="${e.id}" data-period-field="current" ${e.current?'checked':''}>
      Masih berlangsung sampai sekarang (Present)
    </label>
  ` : `
    <div class="row2">
      <div>
        <label>${fLabels.left}</label>
        <input type="text" data-field-section="${sectionKey}" data-entry-id="${e.id}" data-field="left" value="${esc(e.left)}">
      </div>
      <div>
        <label>${fLabels.right}</label>
        <input type="text" data-field-section="${sectionKey}" data-entry-id="${e.id}" data-field="right" value="${esc(e.right)}">
      </div>
    </div>
  `;

  return `
  <div class="entry-card" data-entry-id="${e.id}">
    <div class="entry-head">
      <span class="tag">Entri ${idx+1}</span>
      <button class="icon-btn" type="button" data-remove-entry="${sectionKey}" data-entry-id="${e.id}" title="Hapus entri">✕ Remove</button>
    </div>
    ${titleDateBlock}
    <div class="row2">
      <div>
        <label>${fLabels.subLeft}</label>
        <input type="text" data-field-section="${sectionKey}" data-entry-id="${e.id}" data-field="subLeft" value="${esc(e.subLeft)}">
      </div>
      <div>
        <label>${fLabels.subRight}</label>
        <input type="text" data-field-section="${sectionKey}" data-entry-id="${e.id}" data-field="subRight" value="${esc(e.subRight)}" ${sectionKey==='education' ? 'placeholder="3.71"' : ''}>
      </div>
    </div>
    <div class="bullets">
      <label style="margin-top:12px;">Poin-poin (bullets) — satu poin per baris, tekan Enter untuk poin baru</label>
      <textarea rows="4" data-bullettext-section="${sectionKey}" data-entry-id="${e.id}" placeholder="Ketik satu poin, lalu Enter untuk poin berikutnya...">${esc(e.bulletsText)}</textarea>
    </div>
  </div>`;
}

function certificationsFieldset(){
  const rows = data.certifications.map((c,i) => `
    <div class="entry-card" data-cert-id="${c.id}">
      <div class="entry-head">
        <span class="tag">Sertifikat ${i+1}</span>
        <button class="icon-btn" type="button" data-remove-cert="${c.id}">✕ Remove</button>
      </div>
      <label>Nama sertifikat</label>
      <input type="text" data-cert-id="${c.id}" data-cert-field="name" value="${esc(c.name)}">
      <div class="row2">
        <div>
          <label>Penerbit</label>
          <input type="text" data-cert-id="${c.id}" data-cert-field="issuer" value="${esc(c.issuer)}">
        </div>
        <div>
          <label>Tanggal</label>
          <input type="text" data-cert-id="${c.id}" data-cert-field="date" value="${esc(c.date)}">
        </div>
      </div>
      <label>Link (opsional)</label>
      <input type="text" data-cert-id="${c.id}" data-cert-field="link" value="${esc(c.link)}" placeholder="https://...">
    </div>
  `).join('');
  return `
  <fieldset>
    <legend>Certifications <button class="add-btn" type="button" id="addCert">+ Add</button></legend>
    ${rows || `<div class="empty-hint">Belum ada sertifikat.</div>`}
  </fieldset>`;
}

function skillsFieldset(){
  const rows = data.skills.map((s,i) => `
    <div class="entry-card" data-skill-id="${s.id}">
      <div class="entry-head">
        <span class="tag">Kategori ${i+1}</span>
        <button class="icon-btn" type="button" data-remove-skill="${s.id}">✕ Remove</button>
      </div>
      <div class="row2">
        <div>
          <label>Kategori</label>
          <input type="text" data-skill-id="${s.id}" data-skill-field="category" value="${esc(s.category)}" placeholder="mis. Web Development">
        </div>
        <div>
          <label>Skill (pisahkan dengan koma)</label>
          <input type="text" data-skill-id="${s.id}" data-skill-field="items" value="${esc(s.items)}" placeholder="HTML, CSS, JavaScript">
        </div>
      </div>
    </div>
  `).join('');
  return `
  <fieldset>
    <legend>Skills <button class="add-btn" type="button" id="addSkill">+ Add</button></legend>
    ${rows || `<div class="empty-hint">Belum ada kategori skill.</div>`}
  </fieldset>`;
}

function languagesFieldset(){
  const rows = data.languages.map((l,i) => `
    <div class="row3" data-lang-id="${l.id}" style="align-items:end; margin-bottom:8px;">
      <div>
        <label>Bahasa</label>
        <input type="text" data-lang-id="${l.id}" data-lang-field="name" value="${esc(l.name)}">
      </div>
      <div>
        <label>Tingkat kemahiran</label>
        <input type="text" data-lang-id="${l.id}" data-lang-field="level" value="${esc(l.level)}">
      </div>
      <button class="icon-btn" type="button" data-remove-lang="${l.id}" style="height:38px;">✕</button>
    </div>
  `).join('');
  return `
  <fieldset>
    <legend>Languages <button class="add-btn" type="button" id="addLang">+ Add</button></legend>
    ${rows || `<div class="empty-hint">Belum ada bahasa.</div>`}
  </fieldset>`;
}

/* =========================================================
   EVENTS — FORM → STATE
   ========================================================= */
function handlePhotoUpload(e){
  const file = e.target.files[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){ alert('File harus berupa gambar (JPG/PNG).'); return; }
  const reader = new FileReader();
  reader.onload = (ev)=>{
    const img = new Image();
    img.onload = ()=>{
      // resize supaya file tidak terlalu besar
      const maxDim = 700;
      let w = img.width, h = img.height;
      if(w > maxDim || h > maxDim){
        if(w > h){ h = Math.round(h * maxDim / w); w = maxDim; }
        else { w = Math.round(w * maxDim / h); h = maxDim; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      data.photo = canvas.toDataURL('image/jpeg', 0.87);
      renderForm();
      renderPreview();
    };
    img.onerror = ()=> alert('Gagal memuat gambar. Coba file lain.');
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function attachFormEvents(){
  // photo
  const photoInput = document.getElementById('photoInput');
  if(photoInput) photoInput.addEventListener('change', handlePhotoUpload);
  const removePhotoBtn = document.getElementById('removePhoto');
  if(removePhotoBtn) removePhotoBtn.addEventListener('click', ()=>{
    data.photo = null;
    renderForm(); renderPreview();
  });

  // basics
  formRoot.querySelectorAll('[data-path]').forEach(el=>{
    el.addEventListener('input', ()=>{
      data[el.dataset.path] = el.value;
      renderPreview();
    });
  });

  // section title rename
  formRoot.querySelectorAll('[data-section-label]').forEach(el=>{
    el.addEventListener('input', ()=>{
      data.sections[el.dataset.sectionLabel].label = el.value;
      renderPreview();
    });
  });

  // reorder sections (move up/down)
  formRoot.querySelectorAll('[data-move-section]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const key = el.dataset.moveSection;
      const dir = el.dataset.direction;
      const idx = data.sectionOrder.indexOf(key);
      const swapWith = dir === 'up' ? idx - 1 : idx + 1;
      if(idx === -1 || swapWith < 0 || swapWith >= data.sectionOrder.length) return;
      const order = data.sectionOrder;
      [order[idx], order[swapWith]] = [order[swapWith], order[idx]];
      renderForm();
      renderPreview();
    });
  });

  // add entry
  formRoot.querySelectorAll('[data-add-entry]').forEach(el=>{
    el.addEventListener('click', ()=>{
      data.sections[el.dataset.addEntry].entries.push(emptyEntry());
      renderForm(); renderPreview();
    });
  });

  // remove entry
  formRoot.querySelectorAll('[data-remove-entry]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const key = el.dataset.removeEntry, id = el.dataset.entryId;
      data.sections[key].entries = data.sections[key].entries.filter(e=>e.id!==id);
      renderForm(); renderPreview();
    });
  });

  // entry fields
  formRoot.querySelectorAll('[data-field-section]').forEach(el=>{
    el.addEventListener('input', ()=>{
      const key = el.dataset.fieldSection, id = el.dataset.entryId, field = el.dataset.field;
      const entry = data.sections[key].entries.find(e=>e.id===id);
      if(entry) entry[field] = el.value;
      renderPreview();
    });
  });

  // period (month/year) pickers
  formRoot.querySelectorAll('[data-period-field]').forEach(el=>{
    el.addEventListener('change', ()=>{
      const key = el.dataset.periodSection, id = el.dataset.entryId, field = el.dataset.periodField;
      const entry = data.sections[key].entries.find(en=>en.id===id);
      if(!entry) return;
      if(field === 'current'){
        entry.current = el.checked;
      } else {
        entry[field] = el.value;
      }
      entry.right = formatPeriod(entry);
      // toggle end-date selects without a full form re-render (keeps scroll position)
      const card = el.closest('.entry-card');
      if(card){
        const endMonthEl = card.querySelector('[data-period-field="endMonth"]');
        const endYearEl = card.querySelector('[data-period-field="endYear"]');
        if(endMonthEl) endMonthEl.disabled = entry.current;
        if(endYearEl) endYearEl.disabled = entry.current;
      }
      renderPreview();
    });
  });

  // bullets — single free-typed textarea per entry, one point per line
  formRoot.querySelectorAll('[data-bullettext-section]').forEach(el=>{
    el.addEventListener('input', ()=>{
      const key = el.dataset.bullettextSection, id = el.dataset.entryId;
      const entry = data.sections[key].entries.find(e=>e.id===id);
      if(entry) entry.bulletsText = el.value;
      renderPreview();
    });
  });

  // certifications
  const addCert = document.getElementById('addCert');
  if(addCert) addCert.addEventListener('click', ()=>{
    data.certifications.push({id:uid(), name:'', issuer:'', link:'', date:''});
    renderForm(); renderPreview();
  });
  formRoot.querySelectorAll('[data-remove-cert]').forEach(el=>{
    el.addEventListener('click', ()=>{
      data.certifications = data.certifications.filter(c=>c.id!==el.dataset.removeCert);
      renderForm(); renderPreview();
    });
  });
  formRoot.querySelectorAll('[data-cert-field]').forEach(el=>{
    el.addEventListener('input', ()=>{
      const c = data.certifications.find(c=>c.id===el.dataset.certId);
      if(c) c[el.dataset.certField] = el.value;
      renderPreview();
    });
  });

  // skills
  const addSkill = document.getElementById('addSkill');
  if(addSkill) addSkill.addEventListener('click', ()=>{
    data.skills.push({id:uid(), category:'', items:''});
    renderForm(); renderPreview();
  });
  formRoot.querySelectorAll('[data-remove-skill]').forEach(el=>{
    el.addEventListener('click', ()=>{
      data.skills = data.skills.filter(s=>s.id!==el.dataset.removeSkill);
      renderForm(); renderPreview();
    });
  });
  formRoot.querySelectorAll('[data-skill-field]').forEach(el=>{
    el.addEventListener('input', ()=>{
      const s = data.skills.find(s=>s.id===el.dataset.skillId);
      if(s) s[el.dataset.skillField] = el.value;
      renderPreview();
    });
  });

  // languages
  const addLang = document.getElementById('addLang');
  if(addLang) addLang.addEventListener('click', ()=>{
    data.languages.push({id:uid(), name:'', level:''});
    renderForm(); renderPreview();
  });
  formRoot.querySelectorAll('[data-remove-lang]').forEach(el=>{
    el.addEventListener('click', ()=>{
      data.languages = data.languages.filter(l=>l.id!==el.dataset.removeLang);
      renderForm(); renderPreview();
    });
  });
  formRoot.querySelectorAll('[data-lang-field]').forEach(el=>{
    el.addEventListener('input', ()=>{
      const l = data.languages.find(l=>l.id===el.dataset.langId);
      if(l) l[el.dataset.langField] = el.value;
      renderPreview();
    });
  });
}

/* =========================================================
   PREVIEW RENDERING
   ========================================================= */
const page = document.getElementById('page');

function linkPill(url, label){
  if(!url) return '';
  const href = /^https?:\/\//i.test(url) ? url : 'https://' + url;
  return `<a href="${esc(href)}" target="_blank" rel="noopener">${esc(label||url)}</a>`;
}

function renderPreview(){
  const contactParts = [];
  if(data.location) contactParts.push(esc(data.location));
  if(data.email) contactParts.push(`<a href="mailto:${esc(data.email)}">${esc(data.email)}</a>`);
  if(data.phone) contactParts.push(esc(data.phone));
  const contactLine = contactParts.join('<span class="sep">•</span>');

  const linkParts = [];
  if(data.linkedin) linkParts.push(linkPill(data.linkedin, data.linkedin.replace(/^https?:\/\//,'')));
  if(data.github) linkParts.push(linkPill(data.github, data.github.replace(/^https?:\/\//,'')));
  const linksLine = linkParts.length ? `<div class="r-links">${linkParts.join('<span class="sep">•</span>')}</div>` : '';

  const summaryLine = data.summary ? `<div class="r-summary">${fmt(data.summary)}</div>` : '';

  const photoHtml = data.photo ? `
    <div class="r-photo">
      <img src="${data.photo}" alt="Foto profil">
    </div>` : '';

  const sectionsHtml = data.sectionOrder.map(key=>{
    const sec = data.sections[key];
    const validEntries = sec.entries.filter(e => e.left || e.subLeft || (e.bulletsText && e.bulletsText.trim()));
    if(validEntries.length===0) return '';
    const entriesHtml = validEntries.map(e=>{
      const bulletsHtml = (e.bulletsText||'')
        .split('\n')
        .map(l=>l.trim())
        .filter(l=>l)
        .map(l=>`<li>${fmt(l)}</li>`)
        .join('');
      const subRightDisplay = (key === 'education' && e.subRight) ? `GPA: ${e.subRight}` : e.subRight;
      return `
        <div class="r-entry">
          <div class="r-line"><span class="left">${fmt(e.left)}</span><span class="right">${fmt(e.right)}</span></div>
          ${(e.subLeft || subRightDisplay) ? `<div class="r-subline"><span class="subline-left">${fmt(e.subLeft)}</span><span class="subline-right">${fmt(subRightDisplay)}</span></div>` : ''}
          ${bulletsHtml ? `<ul class="r-bullets">${bulletsHtml}</ul>` : ''}
        </div>`;
    }).join('');
    return `
      <div class="r-section">
        <div class="r-section-title">${esc(sec.label)}</div>
        <div class="r-entries">${entriesHtml}</div>
      </div>`;
  }).join('');

  const certsValid = data.certifications.filter(c=>c.name);
  const certsHtml = certsValid.length ? `
    <div class="r-section">
      <div class="r-section-title">CERTIFICATIONS</div>
      <div class="r-entries">
        ${certsValid.map(c=>`
          <div class="r-cert-row">
            <span>${c.link ? linkPill(c.link, c.name) : fmt(c.name)}${c.issuer ? ' — ' + fmt(c.issuer) : ''}</span>
            <span>${esc(c.date)}</span>
          </div>`).join('')}
      </div>
    </div>` : '';

  const skillsValid = data.skills.filter(s=>s.category || s.items);
  const skillsHtml = skillsValid.length ? `
    <div class="r-section">
      <div class="r-section-title">SKILLS</div>
      <div class="r-entries">
        ${skillsValid.map(s=>`<div class="r-skill-row"><span class="cat">${fmt(s.category)}:</span> ${fmt(s.items)}</div>`).join('')}
      </div>
    </div>` : '';

  const langsValid = data.languages.filter(l=>l.name);
  const langsHtml = langsValid.length ? `
    <div class="r-section">
      <div class="r-section-title">LANGUAGES</div>
      <div class="r-entries">
        <div class="r-lang">${langsValid.map(l=> esc(l.name) + (l.level ? ` (${esc(l.level)})` : '')).join(' • ')}</div>
      </div>
    </div>` : '';

  const headerTextHtml = `
    <div class="r-name">${esc(data.name || 'Nama Lengkap Anda')}</div>
    ${contactLine ? `<div class="r-contact">${contactLine}</div>` : ''}
    ${linksLine}
  `;

  page.innerHTML = `
    <div class="r-header ${data.photo ? 'has-photo' : ''}">
      <div class="r-header-text">${headerTextHtml}</div>
      ${photoHtml}
    </div>
    ${summaryLine}
    ${sectionsHtml}
    ${certsHtml}
    ${skillsHtml}
    ${langsHtml}
  `;
}

/* =========================================================
   TOOLBAR ACTIONS
   ========================================================= */
document.getElementById('btnPrint').addEventListener('click', ()=> window.print());

document.getElementById('btnExport').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (data.name ? data.name.replace(/\s+/g,'_') : 'cv') + '_data.json';
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('fileImport').addEventListener('change', (e)=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const parsed = JSON.parse(reader.result);
      data = migrateData(parsed);
      renderForm(); renderPreview();
    }catch(err){
      alert('File JSON tidak valid.');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
});

document.getElementById('btnReset').addEventListener('click', ()=>{
  if(confirm('Reset semua data ke kondisi kosong? Aksi ini tidak bisa dibatalkan.')){
    data = defaultData();
    renderForm(); renderPreview();
  }
});

/* =========================================================
   INIT
   ========================================================= */
renderForm();
renderPreview();