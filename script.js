const MUSCLES = [
  { id: 'peito', label: '💪 Peito', icon: '💪' },
  { id: 'costas', label: '🔙 Costas', icon: '🔙' },
  { id: 'ombros', label: '🔝 Ombros', icon: '🔝' },
  { id: 'biceps', label: '💥 Bíceps', icon: '💥' },
  { id: 'triceps', label: '⚡ Tríceps', icon: '⚡' },
  { id: 'pernas', label: '🦵 Pernas', icon: '🦵' },
  { id: 'abdomen', label: '🎯 Abdómen', icon: '🎯' },
  { id: 'cardio', label: '❤️ Cardio', icon: '❤️' },
];

function genId() {
  return Math.random().toString(36).substr(2, 9);
}

let state = {
  activeTab: 'peito',
  exercises: [
    {
      id: genId(),
      name: 'Supino com Barra',
      muscle: 'peito',
      weight: 20,
      lastWeight: 20,
      lastDate: null
    }
  ]
};

let openCards = new Set();
let steps = {};
let addMode = false;

document.getElementById('dateDisplay').textContent =
  new Date().toLocaleDateString('pt-PT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

function saveData() {
  localStorage.setItem('gymlog', JSON.stringify(state));
}

function loadData() {
  const data = localStorage.getItem('gymlog');

  if (data) {
    state = JSON.parse(data);
  }
}

loadData();

function showToast(msg) {
  const t = document.getElementById('toast');

  t.textContent = msg;
  t.classList.add('show');

  setTimeout(() => {
    t.classList.remove('show');
  }, 2000);
}

function render() {
  renderTabs();
  renderMain();
}

function renderTabs() {
  const nav = document.getElementById('navTabs');

  nav.innerHTML = '';

  MUSCLES.forEach(m => {
    const btn = document.createElement('button');

    btn.className =
      'tab-btn' + (state.activeTab === m.id ? ' active' : '');

    btn.textContent = m.label;

    btn.onclick = () => {
      state.activeTab = m.id;
      addMode = false;
      render();
    };

    nav.appendChild(btn);
  });
}

function renderMain() {
  const main = document.getElementById('mainContent');

  main.innerHTML = '';

  if (addMode) {
    renderAddForm(main);
    return;
  }

  const exs = state.exercises.filter(
    e => e.muscle === state.activeTab
  );

  const title = document.createElement('div');

  title.className = 'section-title';
  title.textContent = state.activeTab.toUpperCase();

  main.appendChild(title);

  if (exs.length === 0) {
    main.innerHTML += `
      <div class="empty-state">
        <h3>Sem exercícios</h3>
      </div>
    `;
    return;
  }

  exs.forEach(ex => {
    const isOpen = openCards.has(ex.id);
    const step = steps[ex.id] || 1;

    const card = document.createElement('div');

    card.className = 'exercise-card';

    card.innerHTML = `
      <div class="card-header" onclick="toggleCard('${ex.id}')">
        <div class="card-name">${ex.name}</div>

        <div class="card-weight">
          ${ex.weight}<span>kg</span>
        </div>

        <div class="chevron">›</div>
      </div>

      <div class="card-controls ${isOpen ? 'open' : ''}">
        <div class="weight-row">
          <button class="weight-btn minus"
            onclick="changeWeight('${ex.id}', -1)">
            −
          </button>

          <div>
            <div class="weight-display">${ex.weight}</div>
            <div class="weight-unit">kg</div>
          </div>

          <button class="weight-btn plus"
            onclick="changeWeight('${ex.id}', 1)">
            +
          </button>
        </div>

        <div class="step-row">
          <div class="step-btns">
            ${[0.5, 1, 2.5, 5]
              .map(v => `
                <button
                  class="step-btn ${step === v ? 'active' : ''}"
                  onclick="setStep('${ex.id}', ${v})">
                  ${v}
                </button>
              `)
              .join('')}
          </div>
        </div>

        <div class="card-actions">
          <button class="btn-save"
            onclick="saveSession('${ex.id}')">
            Guardar
          </button>

          <button class="btn-delete"
            onclick="deleteExercise('${ex.id}')">
            🗑
          </button>
        </div>
      </div>
    `;

    main.appendChild(card);
  });
}

function toggleCard(id) {
  if (openCards.has(id)) {
    openCards.delete(id);
  } else {
    openCards.add(id);
  }

  renderMain();
}

function changeWeight(id, direction) {
  const ex = state.exercises.find(e => e.id === id);

  if (!ex) return;

  const step = steps[id] || 1;

  ex.weight =
    Math.round((ex.weight + direction * step) * 10) / 10;

  saveData();
  renderMain();
}

function setStep(id, val) {
  steps[id] = val;
  renderMain();
}

function saveSession(id) {
  const ex = state.exercises.find(e => e.id === id);

  ex.lastWeight = ex.weight;
  ex.lastDate = new Date().toISOString();

  saveData();

  showToast('Sessão guardada');
}

function deleteExercise(id) {
  state.exercises =
    state.exercises.filter(e => e.id !== id);

  saveData();

  render();
}

function renderAddForm(main) {
  const panel = document.createElement('div');

  panel.className = 'add-panel';

  panel.innerHTML = `
    <h3>Novo Exercício</h3>

    <div class="form-group">
      <label class="form-label">Nome</label>

      <input class="form-input"
        id="newName"
        placeholder="Supino">
    </div>

    <div class="form-group">
      <label class="form-label">Peso</label>

      <input class="form-input"
        id="newWeight"
        type="number"
        value="0">
    </div>

    <div class="form-group">
      <label class="form-label">Músculo</label>

      <select class="form-input" id="newMuscle">
        ${MUSCLES.map(
          m => `<option value="${m.id}">${m.label}</option>`
        ).join('')}
      </select>
    </div>

    <button class="btn-add-ex"
      onclick="addExercise()">
      Adicionar
    </button>
  `;

  main.appendChild(panel);
}

function addExercise() {
  const name =
    document.getElementById('newName').value;

  const weight =
    parseFloat(
      document.getElementById('newWeight').value
    ) || 0;

  const muscle =
    document.getElementById('newMuscle').value;

  if (!name) return;

  state.exercises.push({
    id: genId(),
    name,
    muscle,
    weight,
    lastWeight: weight,
    lastDate: null
  });

  addMode = false;

  saveData();

  showToast('Exercício adicionado');

  render();
}

document.getElementById('fabBtn').onclick = () => {
  addMode = !addMode;
  render();
};

render();