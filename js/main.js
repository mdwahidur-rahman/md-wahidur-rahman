const ADMIN_PASSWORD = 'wahid2024';
const STORAGE_KEYS = {
  theme: 'wahidPortfolio.theme',
  customPublications: 'wahidPortfolio.customPublications',
  customAwards: 'wahidPortfolio.customAwards',
  customExperience: 'wahidPortfolio.customExperience',
  editedStatic: 'wahidPortfolio.editedStatic'
};

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const deepClone = obj => JSON.parse(JSON.stringify(obj));

let state = {
  activeTab: 'journals',
  admin: false,
  editing: null,
  query: '',
  data: deepClone(PORTFOLIO_DATA)
};

function getStored(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function setStored(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function escapeHTML(value = '') { return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function showToast(message){ const t=$('#toast'); t.textContent=message; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2400); }

function loadState(){
  if(localStorage.getItem(STORAGE_KEYS.theme)==='dark') document.body.classList.add('dark');
  updateThemeIcon();
  const customPublications=getStored(STORAGE_KEYS.customPublications,{journals:[],conferences:[],chapters:[]});
  const customAwards=getStored(STORAGE_KEYS.customAwards,[]);
  const customExperience=getStored(STORAGE_KEYS.customExperience,[]);
  const editedStatic=getStored(STORAGE_KEYS.editedStatic,{publications:{},awards:{},experience:{}});

  Object.entries(editedStatic.publications||{}).forEach(([id,edited])=>{
    Object.keys(state.data.publications).forEach(tab=>{
      const i=state.data.publications[tab].findIndex(x=>x.id===id);
      if(i!==-1) state.data.publications[tab][i]={...state.data.publications[tab][i],...edited};
    });
  });
  Object.entries(editedStatic.awards||{}).forEach(([id,edited])=>{const i=state.data.awards.findIndex(x=>x.id===id); if(i!==-1) state.data.awards[i]={...state.data.awards[i],...edited};});
  Object.entries(editedStatic.experience||{}).forEach(([id,edited])=>{const i=state.data.experience.findIndex(x=>x.id===id); if(i!==-1) state.data.experience[i]={...state.data.experience[i],...edited};});

  Object.keys(state.data.publications).forEach(tab=>state.data.publications[tab]=[...state.data.publications[tab],...(customPublications[tab]||[])]);
  state.data.awards=[...state.data.awards,...customAwards];
  state.data.experience=[...state.data.experience,...customExperience];
}
function saveCustomCollections(){
  const custom={journals:[],conferences:[],chapters:[]};
  Object.keys(state.data.publications).forEach(tab=>custom[tab]=state.data.publications[tab].filter(x=>x.source==='custom'));
  setStored(STORAGE_KEYS.customPublications,custom);
  setStored(STORAGE_KEYS.customAwards,state.data.awards.filter(x=>x.source==='custom'));
  setStored(STORAGE_KEYS.customExperience,state.data.experience.filter(x=>x.source==='custom'));
}
function persistStaticEdit(collection,id,data){const e=getStored(STORAGE_KEYS.editedStatic,{publications:{},awards:{},experience:{}}); e[collection][id]={...(e[collection][id]||{}),...data}; setStored(STORAGE_KEYS.editedStatic,e);}

function renderEducation(){ $('#educationGrid').innerHTML=state.data.education.map(x=>`<article class="card edu-card fade-in"><span class="edu-year">${escapeHTML(x.year)}</span><h3>${escapeHTML(x.degree)}</h3><p>${escapeHTML(x.institution)}</p><p>${escapeHTML(x.details)}</p></article>`).join(''); }
function renderResearch(){ $('#researchGrid').innerHTML=state.data.researchInterests.map(x=>`<article class="card interest-card fade-in"><i class="${escapeHTML(x.icon)}"></i><h3>${escapeHTML(x.title)}</h3><p>${escapeHTML(x.details)}</p></article>`).join(''); }
function renderStats(){ const j=state.data.publications.journals.length,c=state.data.publications.conferences.length,b=state.data.publications.chapters.length; $('#statsGrid').innerHTML=[['Journal Articles',j],['Conference Papers',c],['Book Chapters',b]].map(([label,num])=>`<article class="card stat-card"><strong>${num}</strong><span>${label}</span></article>`).join(''); }
function renderSkills(){ $('#skillsGrid').innerHTML=state.data.skills.map(x=>`<article class="card skill-card fade-in"><h3>${escapeHTML(x.group)}</h3><div class="skill-tags">${x.items.map(i=>`<span>${escapeHTML(i)}</span>`).join('')}</div></article>`).join(''); }

function filteredPublications(){
  const q=state.query.toLowerCase().trim();
  const items=state.data.publications[state.activeTab]||[];
  if(!q) return items;
  return items.filter(p=>[p.authors,p.title,p.venue,p.year,p.doi].join(' ').toLowerCase().includes(q));
}
function renderPublications(){
  const items=filteredPublications();
  const grid=$('#publicationGrid');
  if(!items.length){grid.innerHTML='<article class="card publication-card fade-in visible"><p>No publications found.</p></article>';return;}
  grid.innerHTML=items.map((p,i)=>`<article class="card publication-card fade-in visible"><div class="pub-number">${i+1}</div><div class="pub-content"><p class="authors">${escapeHTML(p.authors)}</p><h3>${escapeHTML(p.title)}</h3><p class="venue">${escapeHTML(p.venue)} ${p.year?`• ${escapeHTML(p.year)}`:''}</p><div class="pub-actions">${p.doi&&p.doi!=='#'?`<a class="doi-link" href="${escapeHTML(p.doi)}" target="_blank" rel="noopener"><i class="fa-solid fa-arrow-up-right-from-square"></i> DOI</a>`:'<span class="tag">DOI not listed</span>'}<button class="btn btn-outline btn-small admin-only" onclick="openPublicationModal('${p.id}')"><i class="fa-solid fa-pen"></i> Edit</button><button class="btn btn-danger btn-small admin-only" onclick="deletePublication('${p.id}')"><i class="fa-solid fa-trash"></i> Delete</button></div></div></article>`).join('');
}
function renderAwards(){ $('#awardsTimeline').innerHTML=state.data.awards.map(x=>`<article class="card timeline-item fade-in visible"><div class="timeline-date">${escapeHTML(x.date)}</div><h3>${escapeHTML(x.title)}</h3><p>${escapeHTML(x.description)}</p><div class="admin-actions admin-only"><button class="btn btn-outline btn-small" onclick="openAwardModal('${x.id}')"><i class="fa-solid fa-pen"></i> Edit</button><button class="btn btn-danger btn-small" onclick="deleteAward('${x.id}')"><i class="fa-solid fa-trash"></i> Delete</button></div></article>`).join(''); }
function renderExperience(){ $('#experienceTimeline').innerHTML=state.data.experience.map(x=>`<article class="card timeline-item fade-in visible"><div class="timeline-date">${escapeHTML(x.date)}</div><h3>${escapeHTML(x.title)}</h3><p><strong>${escapeHTML(x.organization)}</strong></p><p>${escapeHTML(x.description)}</p><div class="admin-actions admin-only"><button class="btn btn-outline btn-small" onclick="openExperienceModal('${x.id}')"><i class="fa-solid fa-pen"></i> Edit</button><button class="btn btn-danger btn-small" onclick="deleteExperience('${x.id}')"><i class="fa-solid fa-trash"></i> Delete</button></div></article>`).join(''); }
function renderAll(){renderEducation();renderResearch();renderStats();renderPublications();renderAwards();renderExperience();renderSkills();revealVisibleElements();setupScrollAnimations();}

function openModal(title,html){$('#modalTitle').textContent=title;$('#modalBody').innerHTML=html;$('#modalBackdrop').classList.add('show');}
function closeModal(){ $('#modalBackdrop').classList.remove('show'); $('#modalBody').innerHTML=''; state.editing=null; }
function getPublicationById(id){ for(const tab of Object.keys(state.data.publications)){const item=state.data.publications[tab].find(x=>x.id===id); if(item) return item;} return null;}
function openPublicationModal(id=null){
  const editing=id?getPublicationById(id):null; state.editing=editing?{collection:'publications',id}:null;
  const item=editing||{authors:'',title:'',venue:'',year:'',doi:'',type:state.activeTab};
  openModal(editing?'Edit Publication':'Add Publication',`<form class="form-grid" id="publicationForm"><div class="form-group"><label>Category</label><select id="pubType" required><option value="journals" ${item.type==='journals'?'selected':''}>Journal Articles</option><option value="conferences" ${item.type==='conferences'?'selected':''}>Conference Proceedings</option><option value="chapters" ${item.type==='chapters'?'selected':''}>Book Chapters</option></select></div><div class="form-group"><label>Authors</label><textarea id="pubAuthors" required>${escapeHTML(item.authors)}</textarea></div><div class="form-group"><label>Title</label><textarea id="pubTitle" required>${escapeHTML(item.title)}</textarea></div><div class="form-group"><label>Venue / Journal</label><input id="pubVenue" value="${escapeHTML(item.venue)}" required></div><div class="form-group"><label>Year</label><input id="pubYear" value="${escapeHTML(item.year)}" required></div><div class="form-group"><label>DOI Link</label><input id="pubDoi" type="url" value="${escapeHTML(item.doi==='#'?'':item.doi)}"></div><div class="form-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div></form>`);
  $('#publicationForm').addEventListener('submit',savePublication);
}
function savePublication(e){
  e.preventDefault();
  const data={type:$('#pubType').value,authors:$('#pubAuthors').value.trim(),title:$('#pubTitle').value.trim(),venue:$('#pubVenue').value.trim(),year:$('#pubYear').value.trim(),doi:$('#pubDoi').value.trim()||'#'};
  if(!data.authors||!data.title||!data.venue||!data.year){showToast('Please complete all required fields.');return;}
  if(state.editing?.collection==='publications'){
    const existing=getPublicationById(state.editing.id); Object.keys(state.data.publications).forEach(tab=>state.data.publications[tab]=state.data.publications[tab].filter(x=>x.id!==state.editing.id));
    const updated={...existing,...data}; state.data.publications[data.type].push(updated); if(updated.source==='static') persistStaticEdit('publications',updated.id,data); showToast('Publication updated.');
  } else { state.data.publications[data.type].push({id:uid('pub'),source:'custom',...data}); showToast('Publication added.'); }
  state.activeTab=data.type; saveCustomCollections(); closeModal(); updateTabUI(); renderStats(); renderPublications();
}
function deletePublication(id){ if(!confirm('Delete this publication?')) return; Object.keys(state.data.publications).forEach(tab=>state.data.publications[tab]=state.data.publications[tab].filter(x=>x.id!==id)); saveCustomCollections(); renderStats(); renderPublications(); showToast('Publication deleted locally.'); }

function openAwardModal(id=null){ const item=id?state.data.awards.find(x=>x.id===id):{date:'',title:'',description:''}; state.editing=id?{collection:'awards',id}:null; openModal(id?'Edit Award':'Add Award',`<form class="form-grid" id="awardForm"><div class="form-group"><label>Date / Year</label><input id="awardDate" value="${escapeHTML(item.date)}" required></div><div class="form-group"><label>Award Title</label><input id="awardTitle" value="${escapeHTML(item.title)}" required></div><div class="form-group"><label>Description</label><textarea id="awardDescription" required>${escapeHTML(item.description)}</textarea></div><div class="form-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div></form>`); $('#awardForm').addEventListener('submit',saveAward); }
function saveAward(e){ e.preventDefault(); const data={date:$('#awardDate').value.trim(),title:$('#awardTitle').value.trim(),description:$('#awardDescription').value.trim()}; if(!data.date||!data.title||!data.description){showToast('Please complete all fields.');return;} if(state.editing?.collection==='awards'){const i=state.data.awards.findIndex(x=>x.id===state.editing.id); state.data.awards[i]={...state.data.awards[i],...data}; if(state.data.awards[i].source==='static') persistStaticEdit('awards',state.data.awards[i].id,data); showToast('Award updated.');} else {state.data.awards.push({id:uid('award'),source:'custom',...data}); showToast('Award added.');} saveCustomCollections(); closeModal(); renderAwards(); }
function deleteAward(id){ if(!confirm('Delete this award?')) return; state.data.awards=state.data.awards.filter(x=>x.id!==id); saveCustomCollections(); renderAwards(); showToast('Award deleted locally.'); }

function openExperienceModal(id=null){ const item=id?state.data.experience.find(x=>x.id===id):{date:'',title:'',organization:'',description:''}; state.editing=id?{collection:'experience',id}:null; openModal(id?'Edit Experience':'Add Experience',`<form class="form-grid" id="experienceForm"><div class="form-group"><label>Date / Duration</label><input id="expDate" value="${escapeHTML(item.date)}" required></div><div class="form-group"><label>Position</label><input id="expTitle" value="${escapeHTML(item.title)}" required></div><div class="form-group"><label>Organization</label><input id="expOrganization" value="${escapeHTML(item.organization)}" required></div><div class="form-group"><label>Description</label><textarea id="expDescription" required>${escapeHTML(item.description)}</textarea></div><div class="form-actions"><button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div></form>`); $('#experienceForm').addEventListener('submit',saveExperience); }
function saveExperience(e){ e.preventDefault(); const data={date:$('#expDate').value.trim(),title:$('#expTitle').value.trim(),organization:$('#expOrganization').value.trim(),description:$('#expDescription').value.trim()}; if(!data.date||!data.title||!data.organization||!data.description){showToast('Please complete all fields.');return;} if(state.editing?.collection==='experience'){const i=state.data.experience.findIndex(x=>x.id===state.editing.id); state.data.experience[i]={...state.data.experience[i],...data}; if(state.data.experience[i].source==='static') persistStaticEdit('experience',state.data.experience[i].id,data); showToast('Experience updated.');} else {state.data.experience.push({id:uid('exp'),source:'custom',...data}); showToast('Experience added.');} saveCustomCollections(); closeModal(); renderExperience(); }
function deleteExperience(id){ if(!confirm('Delete this experience entry?')) return; state.data.experience=state.data.experience.filter(x=>x.id!==id); saveCustomCollections(); renderExperience(); showToast('Experience deleted locally.'); }

function updateTabUI(){ $$('.tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.tab===state.activeTab)); }
function exportCustomPublications(){ const custom={journals:[],conferences:[],chapters:[]}; Object.keys(state.data.publications).forEach(tab=>custom[tab]=state.data.publications[tab].filter(x=>x.source==='custom')); const blob=new Blob([JSON.stringify(custom,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='wahid-custom-publications.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); showToast('Custom publications exported.'); }
function toggleAdminMode(){ if(state.admin){state.admin=false;document.body.classList.remove('admin-mode');showToast('Admin mode off.');return;} const pass=prompt('Enter admin password:'); if(pass===ADMIN_PASSWORD){state.admin=true;document.body.classList.add('admin-mode');showToast('Admin mode enabled.');} else if(pass!==null){showToast('Incorrect password.');} }
function updateThemeIcon(){ const icon=$('#themeToggle i'); icon.className=document.body.classList.contains('dark')?'fa-solid fa-sun':'fa-solid fa-moon'; }
function setupEvents(){
  $('#year').textContent=new Date().getFullYear();
  $('#themeToggle').addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem(STORAGE_KEYS.theme,document.body.classList.contains('dark')?'dark':'light');updateThemeIcon();});
  $('#mobileToggle').addEventListener('click',()=>$('#navLinks').classList.toggle('show'));
  $$('#navLinks a').forEach(a=>a.addEventListener('click',()=>$('#navLinks').classList.remove('show')));
  $('#adminToggle').addEventListener('click',toggleAdminMode);
  $$('.tab-btn').forEach(b=>b.addEventListener('click',()=>{state.activeTab=b.dataset.tab;updateTabUI();renderPublications();}));
  $('#publicationSearch').addEventListener('input',e=>{state.query=e.target.value;renderPublications();});
  $('#addPublicationBtn').addEventListener('click',()=>openPublicationModal());
  $('#exportCustomBtn').addEventListener('click',exportCustomPublications);
  $('#addAwardBtn').addEventListener('click',()=>openAwardModal());
  $('#addExperienceBtn').addEventListener('click',()=>openExperienceModal());
  $('#closeModal').addEventListener('click',closeModal);
  $('#modalBackdrop').addEventListener('click',e=>{if(e.target.id==='modalBackdrop') closeModal();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape') closeModal();});
  const sections=[...document.querySelectorAll('main section[id]')];
  const activeObs=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(!entry.isIntersecting)return;const id=entry.target.id;$$('.nav-links a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')===`#${id}`));});},{rootMargin:'-45% 0px -50% 0px'});
  sections.forEach(s=>activeObs.observe(s));
}
function setupScrollAnimations(){ const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');}),{threshold:.12}); $$('.fade-in').forEach(el=>obs.observe(el)); }
function revealVisibleElements(){ $$('.fade-in').forEach(el=>{if(el.getBoundingClientRect().top<window.innerHeight)el.classList.add('visible');}); }
function init(){ loadState(); setupEvents(); renderAll(); }
init();
