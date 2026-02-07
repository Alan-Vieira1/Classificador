document.addEventListener('DOMContentLoaded', ()=>{
  console.log('Egg Classifier script loaded');
  const resetBtn = document.getElementById('resetBtn');
  const saveProjectBtn = document.getElementById('saveProjectBtn');
  const viewHistoryBtn = document.getElementById('viewHistoryBtn');
  const projectNumberInput = document.getElementById('projectNumber');
  const historyModal = document.getElementById('historyModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const historyList = document.getElementById('historyList');
  const resultPanel = document.getElementById('result');

  const labels = ['Ovo de codorna','Ovo de galinha','Laranja','Coco'];
  const palette = ['#ff6b6b','#7cc8ff','#ffd166','#7bd389'];
  
  // Track results for each group
  const groupResults = [null, null, null, null]; // stores {avg, category, color} for each group

  function hexToRgba(hex, a){
    const n = hex.replace('#','');
    const r = parseInt(n.substring(0,2),16);
    const g = parseInt(n.substring(2,4),16);
    const b = parseInt(n.substring(4,6),16);
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  // Local Storage Functions
  function saveProject(){
    const projectNumber = projectNumberInput.value.trim();
    if(!projectNumber){
      alert('Por favor, insira um número de projeto antes de salvar.');
      return;
    }

    // Check if at least one group has been classified
    const hasResults = groupResults.some(r => r !== null);
    if(!hasResults){
      alert('Por favor, classifique pelo menos um grupo antes de salvar.');
      return;
    }

    const projectData = {
      projectNumber: projectNumber,
      date: new Date().toISOString(),
      dateFormatted: new Date().toLocaleString('pt-BR'),
      ranges: {
        cat0: { min: parseFloat(document.getElementById('cat0_min').value), max: parseFloat(document.getElementById('cat0_max').value) },
        cat1: { min: parseFloat(document.getElementById('cat1_min').value), max: parseFloat(document.getElementById('cat1_max').value) },
        cat2: { min: parseFloat(document.getElementById('cat2_min').value), max: parseFloat(document.getElementById('cat2_max').value) },
        cat3: { min: parseFloat(document.getElementById('cat3_min').value), max: parseFloat(document.getElementById('cat3_max').value) }
      },
      measurements: [
        { name: 'Testemunha 1', values: [...valuesSets[0]], result: groupResults[0] },
        { name: 'Testemunha 2', values: [...valuesSets[1]], result: groupResults[1] },
        { name: 'Teste 1', values: [...valuesSets[2]], result: groupResults[2] },
        { name: 'Teste 2', values: [...valuesSets[3]], result: groupResults[3] }
      ],
      testemunhaAverage: groupResults[0] && groupResults[1] ? (groupResults[0].avg + groupResults[1].avg) / 2 : null,
      testeAverage: groupResults[2] && groupResults[3] ? (groupResults[2].avg + groupResults[3].avg) / 2 : null
    };

    // Get existing projects from localStorage
    let projects = JSON.parse(localStorage.getItem('eggClassifierProjects') || '[]');
    
    // Add new project
    projects.push(projectData);
    
    // Save back to localStorage
    localStorage.setItem('eggClassifierProjects', JSON.stringify(projects));
    
    alert(`Projeto "${projectNumber}" salvo com sucesso!\nData: ${projectData.dateFormatted}`);
  }

  function loadProjects(){
    const projects = JSON.parse(localStorage.getItem('eggClassifierProjects') || '[]');
    return projects.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first
  }

  function displayHistory(){
    const projects = loadProjects();
    
    if(projects.length === 0){
      historyList.innerHTML = '<p class="empty-state">Nenhum projeto salvo ainda.</p>';
      historyModal.classList.add('show');
      return;
    }

    let html = '<div class="history-items">';
    
    projects.forEach((project, index) => {
      const testemunhaAvg = project.testemunhaAverage;
      const testeAvg = project.testeAverage;
      
      html += `
        <div class="history-item">
          <div class="history-header">
            <h3>${project.projectNumber}</h3>
            <div class="history-actions">
              <button class="btn-icon load-btn" data-index="${index}" title="Carregar">📂</button>
              <button class="btn-icon export-btn" data-index="${index}" title="Exportar">💾</button>
              <button class="btn-icon delete-btn" data-index="${index}" title="Deletar">🗑️</button>
            </div>
          </div>
          <div class="history-date">${project.dateFormatted}</div>
          <div class="history-details">
            <div class="history-section">
              <strong>Testemunha:</strong>
              <ul>
                ${project.measurements[0].result ? `<li>T1: ${project.measurements[0].result.avg.toFixed(3)} kg - ${project.measurements[0].result.category}</li>` : '<li>T1: Não classificado</li>'}
                ${project.measurements[1].result ? `<li>T2: ${project.measurements[1].result.avg.toFixed(3)} kg - ${project.measurements[1].result.category}</li>` : '<li>T2: Não classificado</li>'}
                ${testemunhaAvg ? `<li class="avg-highlight">Média: ${testemunhaAvg.toFixed(3)} kg</li>` : ''}
              </ul>
            </div>
            <div class="history-section">
              <strong>Teste:</strong>
              <ul>
                ${project.measurements[2].result ? `<li>T1: ${project.measurements[2].result.avg.toFixed(3)} kg - ${project.measurements[2].result.category}</li>` : '<li>T1: Não classificado</li>'}
                ${project.measurements[3].result ? `<li>T2: ${project.measurements[3].result.avg.toFixed(3)} kg - ${project.measurements[3].result.category}</li>` : '<li>T2: Não classificado</li>'}
                ${testeAvg ? `<li class="avg-highlight">Média: ${testeAvg.toFixed(3)} kg</li>` : ''}
              </ul>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    historyList.innerHTML = html;
    
    // Attach event listeners to buttons
    document.querySelectorAll('.load-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        loadProject(projects[index]);
        historyModal.classList.remove('show');
      });
    });
    
    document.querySelectorAll('.export-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        exportProject(projects[index]);
      });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        if(confirm(`Tem certeza que deseja deletar o projeto "${projects[index].projectNumber}"?`)){
          deleteProject(index);
          displayHistory(); // Refresh the list
        }
      });
    });
    
    historyModal.classList.add('show');
  }

  function loadProject(project){
    if(!confirm(`Carregar o projeto "${project.projectNumber}"? Os dados atuais serão substituídos.`)){
      return;
    }

    // Load project number
    projectNumberInput.value = project.projectNumber;

    // Load ranges
    document.getElementById('cat0_min').value = project.ranges.cat0.min;
    document.getElementById('cat0_max').value = project.ranges.cat0.max;
    document.getElementById('cat1_min').value = project.ranges.cat1.min;
    document.getElementById('cat1_max').value = project.ranges.cat1.max;
    document.getElementById('cat2_min').value = project.ranges.cat2.min;
    document.getElementById('cat2_max').value = project.ranges.cat2.max;
    document.getElementById('cat3_min').value = project.ranges.cat3.min;
    document.getElementById('cat3_max').value = project.ranges.cat3.max;

    // Load measurements and results
    for(let i = 0; i < 4; i++){
      valuesSets[i] = [...project.measurements[i].values];
      groupResults[i] = project.measurements[i].result;
      updateValuesList(i);
      
      if(groupResults[i]){
        const avgEl = document.getElementById(`avgText${i}`);
        if(avgEl) avgEl.textContent = `Média: ${groupResults[i].avg.toFixed(3)} kg`;
      }
    }

    updateResultDisplay();
    alert(`Projeto "${project.projectNumber}" carregado com sucesso!`);
  }

  function exportProject(project){
    const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.projectNumber}_${new Date(project.date).toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function deleteProject(index){
    let projects = loadProjects();
    projects.splice(index, 1);
    localStorage.setItem('eggClassifierProjects', JSON.stringify(projects));
  }

  // Modal controls
  viewHistoryBtn.addEventListener('click', displayHistory);
  closeModalBtn.addEventListener('click', () => {
    historyModal.classList.remove('show');
  });
  historyModal.addEventListener('click', (e) => {
    if(e.target === historyModal){
      historyModal.classList.remove('show');
    }
  });

  saveProjectBtn.addEventListener('click', saveProject);

  function readRanges(){
    const ranges = [];
    for(let i=0;i<4;i++){
      const minEl = document.getElementById(`cat${i}_min`);
      const maxEl = document.getElementById(`cat${i}_max`);
      const min = parseFloat(minEl.value);
      const max = parseFloat(maxEl.value);
      if (Number.isNaN(min) || Number.isNaN(max)) return { error: 'Insira limites numéricos válidos para todas as categorias.', errorHtml: 'Insira limites numéricos válidos para todas as categorias.' };
      if (min > max) return { error: `Categoria ${i+1}: o mínimo deve ser menor ou igual ao máximo.`, errorHtml: `Categoria <span class="err-name" data-idx="${i}">${labels[i]}</span>: o mínimo deve ser menor ou igual ao máximo.`, fields: [minEl, maxEl], idx: i };
      ranges.push({min,max});
    }
    // check for overlapping ranges (strict overlap, touching endpoints allowed)
    for(let i=0;i<ranges.length;i++){
      for(let j=i+1;j<ranges.length;j++){
        const a = ranges[i];
        const b = ranges[j];
        // disallow any intersection or touching endpoints between ranges
        if (!(a.max < b.min || b.max < a.min)){
          const minElI = document.getElementById(`cat${i}_min`);
          const maxElI = document.getElementById(`cat${i}_max`);
          const minElJ = document.getElementById(`cat${j}_min`);
          const maxElJ = document.getElementById(`cat${j}_max`);
          return { error: `Limites sobrepostos entre ${labels[i]} e ${labels[j]}. Ajuste os limites.`, errorHtml: `Limites sobrepostos entre <span class="err-name" data-idx="${i}">${labels[i]}</span> e <span class="err-name" data-idx="${j}">${labels[j]}</span>. Ajuste os limites.`, fields: [minElI,maxElI,minElJ,maxElJ], idx1: i, idx2: j };
        }
      }
    }
    return { ranges };
  }

  function clearInputErrors(){
    // remove from both inputs and category blocks
    document.querySelectorAll('.input-error').forEach(e=>e.classList.remove('input-error'));
    // remove any inline block error labels
    document.querySelectorAll('.block-error').forEach(be=>be.remove());
  }

  function markInputError(elements, message){
    clearInputErrors();
    elements.forEach(el=>{
      if (!el) return;
      // find the category block parent and mark it
      const block = el.closest('.cat-block');
      if (block) {
        block.classList.add('input-error');
        // ensure there is a block-error element inside the block
        let be = block.querySelector('.block-error');
        if (!be){
          be = document.createElement('div');
          be.className = 'block-error';
          block.appendChild(be);
        }
        // set message (short)
        be.textContent = message || 'Erro nos limites';
        // color the message according to this block's category index if possible
        const minInput = block.querySelector('input[id$="_min"]');
        if (minInput){
          const m = minInput.id.match(/cat(\d+)_min/);
          if (m){
            const idx = parseInt(m[1],10);
            be.style.color = palette[idx] || '#ff6b6b';
          }
        }
      }
    });
  }

  // Validate ranges as the user edits inputs
  function validateRangesOnEdit(){
    const read = readRanges();
    if (read.error){
      if (read.fields){
        const msg = (typeof read.idx1 !== 'undefined' && typeof read.idx2 !== 'undefined') ? 'Limite sobreposto' : (typeof read.idx !== 'undefined' ? 'Limite inválido' : 'Erro nos limites');
        markInputError(read.fields, msg);
      }
      return false;
    }
    clearInputErrors();
    return true;
  }

  function updateResultDisplay(){
    // Update individual results
    for(let i=0; i<4; i++){
      const resultEl = document.getElementById(`result${i}`);
      const valueEl = resultEl.querySelector('.result-value');
      
      if(groupResults[i]){
        const grams = Math.round(groupResults[i].avg * 1000);
        valueEl.innerHTML = `<span class="badge" style="background:${groupResults[i].color}">${groupResults[i].category}</span><br><span class="muted small">${groupResults[i].avg.toFixed(3)} kg (${grams} g)</span>`;
      } else {
        valueEl.textContent = '—';
      }
    }
    
    // Update Testemunha average (groups 0 and 1)
    const testemunhaAvgEl = document.getElementById('resultAvgTestemunha');
    const testemunhaValueEl = testemunhaAvgEl.querySelector('.result-value');
    if(groupResults[0] && groupResults[1]){
      const avg = (groupResults[0].avg + groupResults[1].avg) / 2;
      const grams = Math.round(avg * 1000);
      
      // Find which category this average falls into
      const read = readRanges();
      if(!read.error){
        let found = false;
        for(let i=0; i<read.ranges.length; i++){
          if(avg >= read.ranges[i].min && avg <= read.ranges[i].max){
            testemunhaValueEl.innerHTML = `<span class="badge" style="background:${palette[i]}">${labels[i]}</span><br><span class="muted small">${avg.toFixed(3)} kg (${grams} g)</span>`;
            found = true;
            break;
          }
        }
        if(!found){
          testemunhaValueEl.innerHTML = `<span class="muted small">${avg.toFixed(3)} kg (${grams} g)</span><br><span class="error-text small">Fora dos limites</span>`;
        }
      }
    } else {
      testemunhaValueEl.textContent = '—';
    }
    
    // Update Teste average (groups 2 and 3)
    const testeAvgEl = document.getElementById('resultAvgTeste');
    const testeValueEl = testeAvgEl.querySelector('.result-value');
    if(groupResults[2] && groupResults[3]){
      const avg = (groupResults[2].avg + groupResults[3].avg) / 2;
      const grams = Math.round(avg * 1000);
      
      // Find which category this average falls into
      const read = readRanges();
      if(!read.error){
        let found = false;
        for(let i=0; i<read.ranges.length; i++){
          if(avg >= read.ranges[i].min && avg <= read.ranges[i].max){
            testeValueEl.innerHTML = `<span class="badge" style="background:${palette[i]}">${labels[i]}</span><br><span class="muted small">${avg.toFixed(3)} kg (${grams} g)</span>`;
            found = true;
            break;
          }
        }
        if(!found){
          testeValueEl.innerHTML = `<span class="muted small">${avg.toFixed(3)} kg (${grams} g)</span><br><span class="error-text small">Fora dos limites</span>`;
        }
      }
    } else {
      testeValueEl.textContent = '—';
    }
  }

  // Support for 4 separate value sets and controls
  const valuesSets = [[], [], [], []];

  function updateValuesList(index){
    const valuesList = document.getElementById(`valuesList${index}`);
    valuesList.innerHTML = '';
    const set = valuesSets[index];
    set.forEach((v,i)=>{
      const li = document.createElement('li');
      li.textContent = `${v.toFixed(3)} kg`;
      const btn = document.createElement('button');
      btn.textContent = '✕';
      btn.title = 'Remover';
      btn.addEventListener('click', ()=>{ 
        set.splice(i,1); 
        updateValuesList(index); 
        const avgEl = document.getElementById(`avgText${index}`);
        if (avgEl) {
          avgEl.textContent = set.length ? `Média: ${(set.reduce((s,x)=>s+x,0)/set.length).toFixed(3)} kg` : 'Média: —';
        }
      });
      li.appendChild(btn);
      valuesList.appendChild(li);
    });
    const avgEl = document.getElementById(`avgText${index}`);
    if (avgEl) {
      avgEl.textContent = set.length ? `Média: ${(set.reduce((s,x)=>s+x,0)/set.length).toFixed(3)} kg` : 'Média: —';
    }
  }

  // attach handlers for 4 groups
  for(let g=0; g<4; g++){
    const addBtn = document.getElementById(`addValueBtn${g}`);
    const clearBtn = document.getElementById(`clearValuesBtn${g}`);
    const input = document.getElementById(`measureInput${g}`);
    const classifyBtnG = document.getElementById(`classifyBtn${g}`);

    if (!addBtn || !clearBtn || !input || !classifyBtnG) {
      console.error(`Missing elements for group ${g}`);
      continue;
    }

    addBtn.addEventListener('click', ()=>{
      const v = parseFloat(input.value);
      if (Number.isNaN(v) || v <= 0) {
        alert('Por favor, insira um peso válido maior que zero.');
        return;
      }
      valuesSets[g].push(v);
      updateValuesList(g);
      input.value = '';
      input.focus();
    });
    
    input.addEventListener('keydown', (e)=>{ 
      if (e.key === 'Enter') {
        e.preventDefault();
        addBtn.click();
      }
    });

    clearBtn.addEventListener('click', ()=>{ 
      valuesSets[g] = []; 
      updateValuesList(g); 
      const avgEl = document.getElementById(`avgText${g}`);
      if (avgEl) avgEl.textContent = 'Média: —';
      groupResults[g] = null;
      updateResultDisplay();
    });

    classifyBtnG.addEventListener('click', ()=>{
      // compute average for this group and classify
      const set = valuesSets[g];
      if (!validateRangesOnEdit()) return; // ensure ranges valid
      if (set.length === 0){ 
        alert('Adicione pelo menos uma medição antes de classificar.');
        return; 
      }
      const sum = set.reduce((s,v)=>s+v,0);
      const avg = sum / set.length;
      const avgEl = document.getElementById(`avgText${g}`);
      if (avgEl) avgEl.textContent = `Média: ${avg.toFixed(3)} kg`;
      
      const read = readRanges();
      if (read.error){ 
        if (read.fields){ 
          const msg = (typeof read.idx1 !== 'undefined' && typeof read.idx2 !== 'undefined') ? 'Limite sobreposto' : (typeof read.idx !== 'undefined' ? 'Limite inválido' : 'Erro nos limites'); 
          markInputError(read.fields, msg); 
        } 
        alert(read.error);
        return; 
      }
      const ranges = read.ranges;
      let found = false;
      for(let i=0;i<ranges.length;i++){
        if (avg >= ranges[i].min && avg <= ranges[i].max){
          groupResults[g] = {
            avg: avg,
            category: labels[i],
            color: palette[i]
          };
          found = true; 
          break;
        }
      }
      if (!found) {
        groupResults[g] = {
          avg: avg,
          category: 'Fora dos limites',
          color: '#999'
        };
      }
      updateResultDisplay();
    });
  }

  resetBtn.addEventListener('click', ()=>{
    if(!confirm('Tem certeza que deseja reiniciar os pesos? Os dados não salvos serão perdidos.')){
      return;
    }
    
    // DO NOT reset category ranges - keep them as is
    // DO NOT reset project number - keep it as is
    
    // clear all value sets and UI
    for(let g=0; g<4; g++){
      valuesSets[g] = [];
      updateValuesList(g);
      const inp = document.getElementById(`measureInput${g}`);
      if (inp) inp.value = '';
      const avgEl = document.getElementById(`avgText${g}`);
      if (avgEl) avgEl.textContent = 'Média: —';
      groupResults[g] = null;
    }
    
    updateResultDisplay();
    clearInputErrors();
  });


  // attach live validation on range inputs
  for(let i=0;i<4;i++){
    const minEl = document.getElementById(`cat${i}_min`);
    const maxEl = document.getElementById(`cat${i}_max`);
    if (minEl) minEl.addEventListener('input', validateRangesOnEdit);
    if (maxEl) maxEl.addEventListener('input', validateRangesOnEdit);
  }

});
