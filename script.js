// ---------- Estado ----------
let currentTemplate = 'clasica';
let expCount = 0;
let eduCount = 0;
let fotoDataUrl = null;
let fotoPosX = 50;
let fotoPosY = 50;

const el = (id) => document.getElementById(id);

// ---------- Agregar bloques dinámicos de experiencia / educación ----------
function addExperienceBlock(data){
  data = data || {};
  expCount++;
  const id = `exp-${expCount}`;
  const wrapper = document.createElement('div');
  wrapper.className = 'entry-block';
  wrapper.dataset.entryId = id;
  wrapper.innerHTML = `
    <button type="button" class="remove-entry" data-remove="${id}">Quitar</button>
    <label>Cargo
      <input type="text" data-field="rol" placeholder="Ej: Auxiliar Administrativo" value="${data.rol ? escapeAttr(data.rol) : ''}">
    </label>
    <label>Empresa
      <input type="text" data-field="empresa" placeholder="Nombre de la empresa" value="${data.empresa ? escapeAttr(data.empresa) : ''}">
    </label>
    <label>Periodo
      <input type="text" data-field="fechas" placeholder="Ene 2024 – Jun 2025" value="${data.fechas ? escapeAttr(data.fechas) : ''}">
    </label>
    <label>Logros o funciones (una idea por línea)
      <textarea rows="2" data-field="descripcion" placeholder="Ej: Atendí y gestioné solicitudes de más de 50 clientes diarios, mejorando los tiempos de respuesta.">${data.descripcion ? escapeHtml(data.descripcion) : ''}</textarea>
    </label>
  `;
  el('exp-list').appendChild(wrapper);
  attachListeners(wrapper);
  renderPreview();
}

function addEducationBlock(data){
  data = data || {};
  eduCount++;
  const id = `edu-${eduCount}`;
  const wrapper = document.createElement('div');
  wrapper.className = 'entry-block';
  wrapper.dataset.entryId = id;
  wrapper.innerHTML = `
    <button type="button" class="remove-entry" data-remove="${id}">Quitar</button>
    <label>Título
      <input type="text" data-field="titulo" placeholder="Ej: Bachiller académico / Técnico en tu área" value="${data.titulo ? escapeAttr(data.titulo) : ''}">
    </label>
    <label>Institución
      <input type="text" data-field="institucion" placeholder="Nombre de la institución" value="${data.institucion ? escapeAttr(data.institucion) : ''}">
    </label>
    <label>Año
      <input type="text" data-field="fechas" placeholder="2026" value="${data.fechas ? escapeAttr(data.fechas) : ''}">
    </label>
  `;
  el('edu-list').appendChild(wrapper);
  attachListeners(wrapper);
  renderPreview();
}

function escapeAttr(str){
  return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;');
}
function escapeHtml(str){
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function attachListeners(scope){
  scope.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', renderPreview);
  });
  const removeBtn = scope.querySelector('.remove-entry');
  if(removeBtn){
    removeBtn.addEventListener('click', () => {
      scope.remove();
      renderPreview();
    });
  }
}

// ---------- Foto ----------
function setupPhotoUpload(){
  const input = el('f-foto');
  const miniPreview = el('photo-preview-mini');
  const removeBtn = el('remove-foto');
  const toggle = el('f-mostrar-foto');
  const posBox = el('photo-position');
  const posX = el('f-foto-x');
  const posY = el('f-foto-y');

  input.addEventListener('change', () => {
    const file = input.files[0];
    if(!file) return;

    if(file.size > 4 * 1024 * 1024){
      alert('La imagen es muy pesada. Usa una foto de menos de 4MB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      fotoDataUrl = e.target.result;
      fotoPosX = 50;
      fotoPosY = 50;
      posX.value = 50;
      posY.value = 50;
      miniPreview.innerHTML = `<img src="${fotoDataUrl}" alt="Foto de perfil">`;
      removeBtn.hidden = false;
      toggle.disabled = false;
      toggle.checked = true;
      posBox.hidden = false;
      renderPreview();
    };
    reader.readAsDataURL(file);
  });

  removeBtn.addEventListener('click', () => {
    fotoDataUrl = null;
    input.value = '';
    miniPreview.innerHTML = 'Sin foto';
    removeBtn.hidden = true;
    toggle.checked = true;
    toggle.disabled = true;
    posBox.hidden = true;
    renderPreview();
  });

  toggle.addEventListener('change', renderPreview);

  posX.addEventListener('input', () => { fotoPosX = Number(posX.value); renderPreview(); });
  posY.addEventListener('input', () => { fotoPosY = Number(posY.value); renderPreview(); });
}

// ---------- Persistencia (localStorage) ----------
const STORAGE_KEY = 'hojalista_cv_data';

function saveState(d){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...d,
      mostrarFoto: el('f-mostrar-foto').checked,
      template: currentTemplate
    }));
  }catch(err){
    console.warn('No se pudo guardar automáticamente:', err);
  }
}

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }catch(err){
    return null;
  }
}

function clearState(){
  localStorage.removeItem(STORAGE_KEY);
}

function restoreFromState(saved){
  el('f-nombre').value = saved.nombre === 'Tu nombre completo' ? '' : (saved.nombre || '');
  el('f-cargo').value = saved.cargo === 'Cargo al que aspiras' ? '' : (saved.cargo || '');
  el('f-correo').value = saved.correo || '';
  el('f-telefono').value = saved.telefono || '';
  el('f-ciudad').value = saved.ciudad || '';
  el('f-linkedin').value = saved.linkedin || '';
  el('f-resumen').value = saved.resumen || '';
  el('f-habilidades').value = (saved.habilidades || []).join(', ');
  el('f-idiomas').value = (saved.idiomas || []).join(', ');

  (saved.experiencias && saved.experiencias.length ? saved.experiencias : [{}]).forEach(exp => addExperienceBlock(exp));
  (saved.educaciones && saved.educaciones.length ? saved.educaciones : [{}]).forEach(edu => addEducationBlock(edu));

  if(saved.foto){
    fotoDataUrl = saved.foto;
    el('photo-preview-mini').innerHTML = `<img src="${fotoDataUrl}" alt="Foto de perfil">`;
    el('remove-foto').hidden = false;
    el('f-mostrar-foto').disabled = false;
    el('f-mostrar-foto').checked = saved.mostrarFoto !== false;

    el('photo-position').hidden = false;
    if(saved.fotoPos){
      const [px, py] = saved.fotoPos.replace(/%/g, '').split(' ').map(Number);
      fotoPosX = isNaN(px) ? 50 : px;
      fotoPosY = isNaN(py) ? 50 : py;
      el('f-foto-x').value = fotoPosX;
      el('f-foto-y').value = fotoPosY;
    }
  }

  if(saved.template){
    currentTemplate = saved.template;
    document.querySelectorAll('.tmpl-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.template === currentTemplate);
    });
  }
}

function resetAll(){
  if(!confirm('¿Seguro que quieres empezar de cero? Se borrará toda la información que has ingresado.')) return;
  clearState();
  location.reload();
}

// ---------- Recolectar datos del formulario ----------
function collectData(){
  const experiencias = [...document.querySelectorAll('#exp-list .entry-block')].map(block => ({
    rol: block.querySelector('[data-field="rol"]').value,
    empresa: block.querySelector('[data-field="empresa"]').value,
    fechas: block.querySelector('[data-field="fechas"]').value,
    descripcion: block.querySelector('[data-field="descripcion"]').value
  }));

  const educaciones = [...document.querySelectorAll('#edu-list .entry-block')].map(block => ({
    titulo: block.querySelector('[data-field="titulo"]').value,
    institucion: block.querySelector('[data-field="institucion"]').value,
    fechas: block.querySelector('[data-field="fechas"]').value
  }));

  const habilidades = el('f-habilidades').value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const idiomas = el('f-idiomas').value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return {
    nombre: el('f-nombre').value || 'Tu nombre completo',
    cargo: el('f-cargo').value,
    correo: el('f-correo').value,
    telefono: el('f-telefono').value,
    ciudad: el('f-ciudad').value,
    linkedin: el('f-linkedin').value,
    resumen: el('f-resumen').value,
    experiencias,
    educaciones,
    habilidades,
    idiomas,
    foto: (el('f-mostrar-foto').checked ? fotoDataUrl : null),
    fotoPos: `${fotoPosX}% ${fotoPosY}%`
  };
}

// ---------- Render de contactos comunes ----------
function contactLine(d, separator){
  return [d.ciudad, d.telefono, d.correo, d.linkedin].filter(Boolean).join(` ${separator} `);
}

// ---------- Plantillas ----------
function renderClasica(d){
  return `
    <div class="cv-header-row">
      <div>
        <h1 class="cv-h-nombre">${d.nombre}</h1>
        ${d.cargo ? `<p class="cv-h-cargo">${d.cargo}</p>` : ""}
        <p class="cv-contact">${contactLine(d, '·')}</p>
      </div>
      ${d.foto ? `<img class="cv-photo" src="${d.foto}" alt="Foto de ${d.nombre}" style="object-position: ${d.fotoPos}">` : ''}
    </div>
    ${d.resumen ? `<div class="cv-section"><h4>Perfil</h4><p>${d.resumen}</p></div>` : ''}
    ${d.experiencias.length ? `<div class="cv-section"><h4>Experiencia</h4>
      ${d.experiencias.map(e => `
        <div class="cv-item">
          <div class="cv-item-title">${e.rol || ''} — ${e.empresa || ''}</div>
          <div class="cv-item-meta">${e.fechas || ''}</div>
          <p>${(e.descripcion||'').replace(/\n/g,'<br>')}</p>
        </div>
      `).join('')}
    </div>` : ''}
    ${d.educaciones.length ? `<div class="cv-section"><h4>Educación</h4>
      ${d.educaciones.map(e => `
        <div class="cv-item">
          <div class="cv-item-title">${e.titulo || ''}</div>
          <div class="cv-item-meta">${e.institucion || ''} ${e.fechas ? '· '+e.fechas : ''}</div>
        </div>
      `).join('')}
    </div>` : ''}
    ${d.habilidades.length ? `<div class="cv-section"><h4>Habilidades</h4>
      <div class="cv-skills">${d.habilidades.map(h => `<span>${h}</span>`).join('')}</div>
    </div>` : ''}
    ${d.idiomas.length ? `<div class="cv-section"><h4>Idiomas</h4>
      <div class="cv-skills">${d.idiomas.map(i => `<span>${i}</span>`).join('')}</div>
    </div>` : ''}
  `;
}

function renderModerna(d){
  return `
    <div class="cv-sidebar">
      ${d.foto ? `<img class="cv-photo" src="${d.foto}" alt="Foto de ${d.nombre}" style="object-position: ${d.fotoPos}">` : ''}
      <h2 class="cv-h-nombre">${d.nombre}</h2>
      ${d.cargo ? `<p class="cv-h-cargo">${d.cargo}</p>` : ""}
      <div class="cv-contact">
        ${d.ciudad ? `<div>${d.ciudad}</div>` : ''}
        ${d.telefono ? `<div>${d.telefono}</div>` : ''}
        ${d.correo ? `<div>${d.correo}</div>` : ''}
        ${d.linkedin ? `<div>${d.linkedin}</div>` : ''}
      </div>
      ${d.habilidades.length ? `<h4>Habilidades</h4><div class="cv-skills">${d.habilidades.map(h => `<span>${h}</span>`).join('')}</div>` : ''}
      ${d.idiomas.length ? `<h4 style="margin-top:20px;">Idiomas</h4><div class="cv-skills">${d.idiomas.map(i => `<span>${i}</span>`).join('')}</div>` : ''}
      ${d.educaciones.length ? `<h4 style="margin-top:20px;">Educación</h4>
        ${d.educaciones.map(e => `<div style="font-size:.72rem;margin-bottom:8px;"><strong>${e.titulo||''}</strong><br>${e.institucion||''} ${e.fechas?'· '+e.fechas:''}</div>`).join('')}
      ` : ''}
    </div>
    <div class="cv-main">
      ${d.resumen ? `<div class="cv-section"><h4>Perfil</h4><p>${d.resumen}</p></div>` : ''}
      ${d.experiencias.length ? `<div class="cv-section"><h4>Experiencia</h4>
        ${d.experiencias.map(e => `
          <div class="cv-item">
            <div class="cv-item-title">${e.rol || ''} — ${e.empresa || ''}</div>
            <div class="cv-item-meta">${e.fechas || ''}</div>
            <p>${(e.descripcion||'').replace(/\n/g,'<br>')}</p>
          </div>
        `).join('')}
      </div>` : ''}
    </div>
  `;
}

function renderEjecutiva(d){
  return `
    ${d.foto ? `<img class="cv-photo" src="${d.foto}" alt="Foto de ${d.nombre}" style="object-position: ${d.fotoPos}">` : ''}
    <h1 class="cv-h-nombre">${d.nombre}</h1>
    ${d.cargo ? `<p class="cv-h-cargo">${d.cargo}</p>` : ""}
    <p class="cv-contact">${contactLine(d, '·')}</p>
    <div class="gold-rule"></div>
    ${d.resumen ? `<div class="cv-section"><h4>Perfil</h4><p>${d.resumen}</p></div>` : ''}
    ${d.experiencias.length ? `<div class="cv-section"><h4>Experiencia</h4>
      ${d.experiencias.map(e => `
        <div class="cv-item">
          <div class="cv-item-title">${e.rol || ''} — ${e.empresa || ''}</div>
          <div class="cv-item-meta">${e.fechas || ''}</div>
          <p>${(e.descripcion||'').replace(/\n/g,'<br>')}</p>
        </div>
      `).join('')}
    </div>` : ''}
    ${d.educaciones.length ? `<div class="cv-section"><h4>Educación</h4>
      ${d.educaciones.map(e => `
        <div class="cv-item">
          <div class="cv-item-title">${e.titulo || ''}</div>
          <div class="cv-item-meta">${e.institucion || ''} ${e.fechas ? '· '+e.fechas : ''}</div>
        </div>
      `).join('')}
    </div>` : ''}
    ${d.habilidades.length ? `<div class="cv-section"><h4>Habilidades</h4>
      <div class="cv-skills">${d.habilidades.map(h => `<span>${h}</span>`).join('')}</div>
    </div>` : ''}
    ${d.idiomas.length ? `<div class="cv-section"><h4>Idiomas</h4>
      <div class="cv-skills">${d.idiomas.map(i => `<span>${i}</span>`).join('')}</div>
    </div>` : ''}
  `;
}

function renderMinimalista(d){
  return `
    <h1 class="cv-h-nombre">${d.nombre}</h1>
    ${d.cargo ? `<p class="cv-h-cargo">${d.cargo}</p>` : ""}
    <p class="cv-contact">${contactLine(d, '·')}</p>
    ${d.resumen ? `<div class="cv-section"><h4>Perfil</h4><p>${d.resumen}</p></div>` : ''}
    ${d.experiencias.length ? `<div class="cv-section"><h4>Experiencia</h4>
      ${d.experiencias.map(e => `
        <div class="cv-item">
          <div class="cv-item-title">${e.rol || ''} <span class="cv-item-sep">—</span> ${e.empresa || ''}</div>
          <div class="cv-item-meta">${e.fechas || ''}</div>
          <p>${(e.descripcion||'').replace(/\n/g,'<br>')}</p>
        </div>
      `).join('')}
    </div>` : ''}
    ${d.educaciones.length ? `<div class="cv-section"><h4>Educación</h4>
      ${d.educaciones.map(e => `
        <div class="cv-item">
          <div class="cv-item-title">${e.titulo || ''}</div>
          <div class="cv-item-meta">${e.institucion || ''} ${e.fechas ? '· '+e.fechas : ''}</div>
        </div>
      `).join('')}
    </div>` : ''}
    ${d.habilidades.length ? `<div class="cv-section"><h4>Habilidades</h4><p class="cv-plain-list">${d.habilidades.join(' · ')}</p></div>` : ''}
    ${d.idiomas.length ? `<div class="cv-section"><h4>Idiomas</h4><p class="cv-plain-list">${d.idiomas.join(' · ')}</p></div>` : ''}
  `;
}

function renderCompacta(d){
  return `
    <div class="cv-col-left">
      ${d.foto ? `<img class="cv-photo" src="${d.foto}" alt="Foto de ${d.nombre}" style="object-position: ${d.fotoPos}">` : ''}
      <h1 class="cv-h-nombre">${d.nombre}</h1>
      ${d.cargo ? `<p class="cv-h-cargo">${d.cargo}</p>` : ""}
      <div class="cv-contact">
        ${d.ciudad ? `<div>${d.ciudad}</div>` : ''}
        ${d.telefono ? `<div>${d.telefono}</div>` : ''}
        ${d.correo ? `<div>${d.correo}</div>` : ''}
        ${d.linkedin ? `<div>${d.linkedin}</div>` : ''}
      </div>
      ${d.educaciones.length ? `<h4>Educación</h4>
        ${d.educaciones.map(e => `<div class="cv-item"><div class="cv-item-title">${e.titulo||''}</div><div class="cv-item-meta">${e.institucion||''} ${e.fechas?'· '+e.fechas:''}</div></div>`).join('')}
      ` : ''}
      ${d.habilidades.length ? `<h4>Habilidades</h4><div class="cv-skills">${d.habilidades.map(h => `<span>${h}</span>`).join('')}</div>` : ''}
      ${d.idiomas.length ? `<h4>Idiomas</h4><div class="cv-skills">${d.idiomas.map(i => `<span>${i}</span>`).join('')}</div>` : ''}
    </div>
    <div class="cv-col-right">
      ${d.resumen ? `<div class="cv-section"><h4>Perfil</h4><p>${d.resumen}</p></div>` : ''}
      ${d.experiencias.length ? `<div class="cv-section"><h4>Experiencia</h4>
        ${d.experiencias.map(e => `
          <div class="cv-item">
            <div class="cv-item-title">${e.rol || ''} — ${e.empresa || ''}</div>
            <div class="cv-item-meta">${e.fechas || ''}</div>
            <p>${(e.descripcion||'').replace(/\n/g,'<br>')}</p>
          </div>
        `).join('')}
      </div>` : ''}
    </div>
  `;
}

function renderCreativa(d){
  return `
    <div class="cv-band">
      ${d.foto ? `<img class="cv-photo" src="${d.foto}" alt="Foto de ${d.nombre}" style="object-position: ${d.fotoPos}">` : ''}
      <div>
        <h1 class="cv-h-nombre">${d.nombre}</h1>
        ${d.cargo ? `<p class="cv-h-cargo">${d.cargo}</p>` : ""}
      </div>
    </div>
    <div class="cv-body">
      <div class="cv-col-left">
        <p class="cv-contact">${contactLine(d, '<br>')}</p>
        ${d.habilidades.length ? `<h4>Habilidades</h4><div class="cv-skills">${d.habilidades.map(h => `<span>${h}</span>`).join('')}</div>` : ''}
        ${d.idiomas.length ? `<h4>Idiomas</h4><div class="cv-skills">${d.idiomas.map(i => `<span>${i}</span>`).join('')}</div>` : ''}
        ${d.educaciones.length ? `<h4>Educación</h4>
          ${d.educaciones.map(e => `<div class="cv-item"><div class="cv-item-title">${e.titulo||''}</div><div class="cv-item-meta">${e.institucion||''} ${e.fechas?'· '+e.fechas:''}</div></div>`).join('')}
        ` : ''}
      </div>
      <div class="cv-col-right">
        ${d.resumen ? `<div class="cv-section"><h4>Perfil</h4><p>${d.resumen}</p></div>` : ''}
        ${d.experiencias.length ? `<div class="cv-section"><h4>Experiencia</h4>
          ${d.experiencias.map(e => `
            <div class="cv-item">
              <div class="cv-item-title">${e.rol || ''} — ${e.empresa || ''}</div>
              <div class="cv-item-meta">${e.fechas || ''}</div>
              <p>${(e.descripcion||'').replace(/\n/g,'<br>')}</p>
            </div>
          `).join('')}
        </div>` : ''}
      </div>
    </div>
  `;
}

// ---------- Render principal ----------
function renderPreview(){
  const d = collectData();
  const sheet = el('cv-preview');
  sheet.className = `cv-sheet template-${currentTemplate}`;

  if(currentTemplate === 'clasica') sheet.innerHTML = renderClasica(d);
  else if(currentTemplate === 'moderna') sheet.innerHTML = renderModerna(d);
  else if(currentTemplate === 'ejecutiva') sheet.innerHTML = renderEjecutiva(d);
  else if(currentTemplate === 'minimalista') sheet.innerHTML = renderMinimalista(d);
  else if(currentTemplate === 'compacta') sheet.innerHTML = renderCompacta(d);
  else sheet.innerHTML = renderCreativa(d);

  saveState(d);
}

// ---------- Cambio de plantilla ----------
function setupTemplateSwitch(){
  document.querySelectorAll('.tmpl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tmpl-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTemplate = btn.dataset.template;
      renderPreview();
    });
  });
}

// ---------- Descargar PDF ----------
async function downloadPDF(){
  const btn = el('download-btn');
  const originalText = btn.textContent;
  btn.textContent = 'Generando PDF…';
  btn.disabled = true;

  const sheet = el('cv-preview');

  // Quitamos temporalmente la altura fija y el recorte, para que se vea
  // y se capture TODO el contenido real, sin importar cuánto ocupe.
  sheet.classList.add('exporting');

  try{
    const canvas = await html2canvas(sheet, { scale: 3, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if(imgHeight <= pageHeight){
      // Cabe en una sola página
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    }else{
      // No cabe: la repartimos en varias páginas A4
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while(heightLeft > 0){
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    const nombre = (el('f-nombre').value || 'hoja-de-vida').trim().replace(/\s+/g, '-').toLowerCase();
    pdf.save(`cv-${nombre}.pdf`);
  }catch(err){
    console.error('Error generando el PDF:', err);
    alert('Hubo un problema generando el PDF. Intenta de nuevo.');
  }finally{
    sheet.classList.remove('exporting');
    btn.textContent = originalText;
    btn.disabled = false;
  }
}

// ---------- Modales de Sugerencias / Contacto ----------
function setupModals(){
  const openers = [
    { btnId: 'open-sugerencias', modalId: 'modal-sugerencias' },
    { btnId: 'open-contacto', modalId: 'modal-contacto' }
  ];

  openers.forEach(({ btnId, modalId }) => {
    const btn = el(btnId);
    const modal = el(modalId);
    if(!btn || !modal) return;
    btn.addEventListener('click', () => { modal.hidden = false; });
  });

  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if(e.target === modal) modal.hidden = true;
    });
    modal.querySelector('[data-close-modal]').addEventListener('click', () => {
      modal.hidden = true;
    });
  });

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      document.querySelectorAll('.modal-overlay').forEach(m => m.hidden = true);
    }
  });

  ['form-sugerencias', 'form-contacto'].forEach(formId => {
    const form = el(formId);
    if(!form) return;
    form.addEventListener('submit', (e) => handleModalSubmit(e, form));
  });
}

async function handleModalSubmit(e, form){
  e.preventDefault();
  const status = form.querySelector('[data-status]');
  const submitBtn = form.querySelector('.modal-submit');
  const originalText = submitBtn.textContent;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando…';
  status.hidden = true;

  try{
    const response = await fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    });

    if(response.ok){
      status.textContent = '¡Gracias! Tu mensaje fue enviado.';
      status.className = 'modal-status ok';
      status.hidden = false;
      form.reset();
      setTimeout(() => { form.closest('.modal-overlay').hidden = true; status.hidden = true; }, 1800);
    }else{
      throw new Error('Respuesta no válida');
    }
  }catch(err){
    status.textContent = 'No se pudo enviar. Intenta de nuevo en un momento.';
    status.className = 'modal-status error';
    status.hidden = false;
  }finally{
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

// ---------- Inicialización ----------
document.addEventListener('DOMContentLoaded', () => {
  const saved = loadState();

  document.querySelectorAll('#cv-form input, #cv-form textarea').forEach(input => {
    input.addEventListener('input', renderPreview);
  });

  if(saved){
    restoreFromState(saved);
  }else{
    // Un bloque inicial de ejemplo en experiencia y educación para no arrancar vacío
    addExperienceBlock();
    addEducationBlock();
  }

  document.querySelector('[data-add="exp"]').addEventListener('click', addExperienceBlock);
  document.querySelector('[data-add="edu"]').addEventListener('click', addEducationBlock);

  el('download-btn').addEventListener('click', downloadPDF);
  el('reset-btn').addEventListener('click', resetAll);

  setupPhotoUpload();
  setupTemplateSwitch();
  setupModals();
  renderPreview();
});
