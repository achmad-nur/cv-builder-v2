/* =========================================================
   STATE
   ========================================================= */
function uid(){ return Math.random().toString(36).slice(2,10); }

function emptyEntry(){
  return { id:uid(), left:'', right:'', subLeft:'', subRight:'', bullets:[''] };
}

function defaultData(){
  return {
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
    ${basicsFieldset()}
    ${repeatableFieldset('education')}
    ${repeatableFieldset('experience')}
    ${repeatableFieldset('volunteer')}
    ${repeatableFieldset('projects')}
    ${repeatableFieldset('awards')}
    ${certificationsFieldset()}
    ${skillsFieldset()}
    ${languagesFieldset()}
  `;
  attachFormEvents();
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
  education:  { left:'Nama sekolah / universitas', right:'Periode (mis. Aug 2020 - Dec 2024)', subLeft:'Gelar & jurusan', subRight:'GPA / lokasi' },
  experience: { left:'Jabatan', right:'Periode', subLeft:'Nama perusahaan', subRight:'Lokasi' },
  volunteer:  { left:'Peran', right:'Periode', subLeft:'Organisasi', subRight:'Lokasi' },
  projects:   { left:'Nama proyek', right:'Periode', subLeft:'Link proyek (opsional)', subRight:'Lokasi (opsional)' },
  awards:     { left:'Nama penghargaan', right:'Tanggal', subLeft:'Pemberi penghargaan', subRight:'' }
};

function repeatableFieldset(key){
  const sec = data.sections[key];
  const fLabels = SECTION_FIELD_LABELS[key];
  const entries = sec.entries.map((e,i) => entryCard(key, e, i, fLabels)).join('');
  return `
  <fieldset data-section="${key}">
    <legend>
      <input type="text" class="section-title-input" data-section-label="${key}" value="${esc(sec.label)}"
        style="background:none;border:none;color:inherit;font:inherit;padding:0;width:auto;flex:1;">
      <button class="add-btn" data-add-entry="${key}" type="button">+ Add</button>
    </legend>
    ${entries || `<div class="empty-hint">Belum ada entri. Klik "+ Add" untuk menambahkan.</div>`}
  </fieldset>`;
}

function entryCard(sectionKey, e, idx, fLabels){
  const bullets = e.bullets.map((b,bi) => `
    <div class="bullet-row">
      <textarea rows="1" data-bullet-section="${sectionKey}" data-entry="${e.id}" data-bullet-index="${bi}" placeholder="Poin pencapaian / tanggung jawab...">${esc(b)}</textarea>
      <button class="icon-btn" type="button" data-remove-bullet="${sectionKey}" data-entry-id="${e.id}" data-bullet-index="${bi}" title="Hapus poin">✕</button>
    </div>
  `).join('');

  return `
  <div class="entry-card" data-entry-id="${e.id}">
    <div class="entry-head">
      <span class="tag">Entri ${idx+1}</span>
      <button class="icon-btn" type="button" data-remove-entry="${sectionKey}" data-entry-id="${e.id}" title="Hapus entri">✕ Remove</button>
    </div>
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
    <div class="row2">
      <div>
        <label>${fLabels.subLeft}</label>
        <input type="text" data-field-section="${sectionKey}" data-entry-id="${e.id}" data-field="subLeft" value="${esc(e.subLeft)}">
      </div>
      <div>
        <label>${fLabels.subRight}</label>
        <input type="text" data-field-section="${sectionKey}" data-entry-id="${e.id}" data-field="subRight" value="${esc(e.subRight)}">
      </div>
    </div>
    <div class="bullets">
      <label style="margin-top:12px;">Poin-poin (bullets)</label>
      ${bullets}
      <button class="bullet-add" type="button" data-add-bullet="${sectionKey}" data-entry-id="${e.id}">+ Tambah poin</button>
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
function attachFormEvents(){
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

  // add bullet
  formRoot.querySelectorAll('[data-add-bullet]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const key = el.dataset.addBullet, id = el.dataset.entryId;
      const entry = data.sections[key].entries.find(e=>e.id===id);
      if(entry) entry.bullets.push('');
      renderForm(); renderPreview();
    });
  });

  // remove bullet
  formRoot.querySelectorAll('[data-remove-bullet]').forEach(el=>{
    el.addEventListener('click', ()=>{
      const key = el.dataset.removeBullet, id = el.dataset.entryId, bi = parseInt(el.dataset.bulletIndex,10);
      const entry = data.sections[key].entries.find(e=>e.id===id);
      if(entry){ entry.bullets.splice(bi,1); if(entry.bullets.length===0) entry.bullets.push(''); }
      renderForm(); renderPreview();
    });
  });

  // bullet text input
  formRoot.querySelectorAll('[data-bullet-section]').forEach(el=>{
    el.addEventListener('input', ()=>{
      const key = el.dataset.bulletSection, id = el.dataset.entry, bi = parseInt(el.dataset.bulletIndex,10);
      const entry = data.sections[key].entries.find(e=>e.id===id);
      if(entry) entry.bullets[bi] = el.value;
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

  const summaryLine = data.summary ? `<div class="r-summary">${esc(data.summary)}</div>` : '';

  const sectionOrder = ['education','experience','volunteer','projects','awards'];
  const sectionsHtml = sectionOrder.map(key=>{
    const sec = data.sections[key];
    const validEntries = sec.entries.filter(e => e.left || e.subLeft || e.bullets.some(b=>b));
    if(validEntries.length===0) return '';
    const entriesHtml = validEntries.map(e=>{
      const bulletsHtml = e.bullets.filter(b=>b.trim()).map(b=>`<li>${esc(b)}</li>`).join('');
      return `
        <div class="r-entry">
          <div class="r-line"><span class="left">${esc(e.left)}</span><span class="right">${esc(e.right)}</span></div>
          ${(e.subLeft || e.subRight) ? `<div class="r-subline"><span>${esc(e.subLeft)}</span><span>${esc(e.subRight)}</span></div>` : ''}
          ${bulletsHtml ? `<ul class="r-bullets">${bulletsHtml}</ul>` : ''}
        </div>`;
    }).join('');
    return `
      <div class="r-section">
        <div class="r-section-title">${esc(sec.label)}</div>
        ${entriesHtml}
      </div>`;
  }).join('');

  const certsValid = data.certifications.filter(c=>c.name);
  const certsHtml = certsValid.length ? `
    <div class="r-section">
      <div class="r-section-title">CERTIFICATIONS</div>
      ${certsValid.map(c=>`
        <div class="r-cert-row">
          <span>${c.link ? linkPill(c.link, c.name) : esc(c.name)}${c.issuer ? ' — ' + esc(c.issuer) : ''}</span>
          <span>${esc(c.date)}</span>
        </div>`).join('')}
    </div>` : '';

  const skillsValid = data.skills.filter(s=>s.category || s.items);
  const skillsHtml = skillsValid.length ? `
    <div class="r-section">
      <div class="r-section-title">SKILLS</div>
      ${skillsValid.map(s=>`<div class="r-skill-row"><span class="cat">${esc(s.category)}:</span> ${esc(s.items)}</div>`).join('')}
    </div>` : '';

  const langsValid = data.languages.filter(l=>l.name);
  const langsHtml = langsValid.length ? `
    <div class="r-section">
      <div class="r-section-title">LANGUAGES</div>
      <div class="r-lang">${langsValid.map(l=> esc(l.name) + (l.level ? ` (${esc(l.level)})` : '')).join(' • ')}</div>
    </div>` : '';

  page.innerHTML = `
    <div class="r-name">${esc(data.name || 'Nama Lengkap Anda')}</div>
    ${contactLine ? `<div class="r-contact">${contactLine}</div>` : ''}
    ${linksLine}
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
      data = parsed;
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