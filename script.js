// ====================================================
// YugiohEdle - Versión completa y funcional
// ====================================================

const MAX_TRIES = 10;
let allCards = [];
let answer = null;
let tries = 0;
let currentMode = 'card';

const DISPLAY_FIELDS = ["name", "archetype", "type", "attribute", "race", "level", "atk", "def", "linkval", "scale", "tcg_date", "ocg_date"];
const FIELDS_TO_CHECK = ["archetype", "type", "attribute", "race", "level", "atk", "def", "linkval", "scale", "tcg_date", "ocg_date"];

// ====================== LOADER ======================
function showLoader() {
  let loader = document.getElementById('loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'loader';
    loader.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;font-size:1.6rem;z-index:9999;text-align:center;`;
    loader.innerHTML = `
      <div style="border:8px solid #333;border-top:8px solid #ffd700;border-radius:50%;width:70px;height:70px;animation:spin 1s linear infinite;margin-bottom:25px;"></div>
      <div>Loading all Yu-Gi-Oh cards...</div>
    `;
    document.body.appendChild(loader);
    const style = document.createElement('style');
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }
  loader.style.display = 'flex';
}

function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';
}

// ====================== LOAD CARDS ======================
async function loadAllCards() {
  showLoader();
  try {
    const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes');
    const data = await response.json();
    allCards = data.data || [];
    console.log(`✅ ${allCards.length} cards loaded`);
    hideLoader();
    populateDatalist();
    startNewGame();
  } catch (error) {
    hideLoader();
    console.error(error);
    alert('Failed to load cards. Make sure you are using GitHub Pages.');
  }
}

// ====================== MODE & GAME ======================
function getCurrentPool() {
  if (currentMode === 'monster') {
    return allCards.filter(c => c.type && c.type.toLowerCase().includes('monster'));
  }
  return allCards;
}

function pickRandomCard() {
  const pool = getCurrentPool();
  return pool[Math.floor(Math.random() * pool.length)];
}

function startNewGame() {
  tries = 0;
  answer = pickRandomCard();
  document.getElementById('results').innerHTML = '';
  createTableHeader();
  updateTriesLeft();
  document.getElementById('guessInput').value = '';
  resetHints();
}

// ====================== HINTS ======================
function resetHints() {
  document.getElementById('initialHintDisplay').textContent = '';
  document.getElementById('wordHintDisplay').textContent = '';
  document.getElementById('appearanceHintDisplay').textContent = '';
  document.getElementById('archetypeHintDisplay').textContent = '';

  document.getElementById('initialHintBtn').disabled = false;
  document.getElementById('wordHintBtn').disabled = true;
  document.getElementById('appearanceHintBtn').disabled = true;
  document.getElementById('archetypeHintBtn').disabled = true;
}

function updateHintAvailability() {
  document.getElementById('initialHintBtn').disabled = false;
  if (tries >= 3) document.getElementById('wordHintBtn').disabled = false;
  if (tries >= 5) document.getElementById('appearanceHintBtn').disabled = false;
  if (tries >= MAX_TRIES - 1) document.getElementById('archetypeHintBtn').disabled = false;
}

function setupHintButtons() {
  document.getElementById('initialHintBtn').onclick = () => {
    document.getElementById('initialHintDisplay').textContent = answer.name[0].toUpperCase();
  };
  document.getElementById('wordHintBtn').onclick = () => {
    const count = answer.name.trim().split(/\s+/).length;
    document.getElementById('wordHintDisplay').textContent = count + " words";
  };
  document.getElementById('appearanceHintBtn').onclick = () => {
    const misc = answer.misc_info?.[0];
    let date = "Unknown";
    if (misc?.tcg_date) date = misc.tcg_date;
    document.getElementById('appearanceHintDisplay').textContent = date;
  };
  document.getElementById('archetypeHintBtn').onclick = () => {
    document.getElementById('archetypeHintDisplay').textContent = answer.archetype || "No Archetype";
  };
}

// ====================== AUTOCOMPLETE (Needs update) ======================
function populateDatalist() {
  const datalist = document.getElementById('cardList');
  datalist.innerHTML = '';

  allCards.forEach(card => {
    const option = document.createElement('option');
    option.value = card.name;
    
    // Guardamos la URL de la imagen para usarla después
    if (card.card_images && card.card_images[0]) {
      option.dataset.image = card.card_images[0].image_url;
    }
    
    datalist.appendChild(option);
  });
}

// ====================== TABLE HEADER ======================
function createTableHeader() {
  const header = document.createElement('div');
  header.className = 'result-row header';
  DISPLAY_FIELDS.forEach(field => {
    const span = document.createElement('span');
    span.className = 'field';
    span.style.fontWeight = 'bold';
    let title = field.charAt(0).toUpperCase() + field.slice(1);
    if (field === 'linkval') title = 'Link';
    if (field === 'scale') title = 'Pendulum';
    if (field === 'name') title = 'Card';
    if (field === 'tcg_date') title = 'TCG Date';
    if (field === 'ocg_date') title = 'OCG Date';
    span.textContent = title;
    header.appendChild(span);
  });
  document.getElementById('results').appendChild(header);
}

// ====================== SUBMIT & DISPLAY ======================
function submitGuess() {
  if (tries >= MAX_TRIES && currentMode !== 'infinite') return;
  const guessName = document.getElementById('guessInput').value.trim();
  if (!guessName) return;
  const guessedCard = allCards.find(c => c.name.toLowerCase() === guessName.toLowerCase());
  if (!guessedCard) { alert("Card not found."); return; }

  displayResult(guessedCard);
  tries++;
  updateTriesLeft();
  updateHintAvailability();

  const isWin = guessedCard.name === answer.name;
  if (isWin || (tries >= MAX_TRIES && currentMode !== 'infinite')) {
    if (isWin) alert("🎉 Congratulations! You guessed the card.");
    else {
      alert(`❌ Game Over.\nThe card was: ${answer.name}`);
      displayResult(answer);
    }
    if (!isWin) tries = MAX_TRIES;
  }
  document.getElementById('guessInput').value = '';
}

function displayResult(guess) {
  const row = document.createElement('div');
  row.className = 'result-row';
  if (guess.name === answer.name) row.classList.add('correct-row');

  DISPLAY_FIELDS.forEach(field => {
    const span = document.createElement('span');
    span.className = 'field';

    let value = '-';
    if (field === 'tcg_date' || field === 'ocg_date') {
      const misc = guess.misc_info?.[0];
      value = (field === 'tcg_date' ? misc?.tcg_date : misc?.ocg_date) || '-';
    } else {
      value = guess[field] ?? '-';
    }

    if (field === 'name') {
      const imgUrl = guess.card_images?.[0]?.image_url || 'https://db.ygoprodeck.com/card-back.jpg';
      span.innerHTML = `
        <img src="${imgUrl}" 
             class="card-thumbnail" 
             onclick="zoomImage(this.src)" 
             style="height:58px; margin-right:8px; border-radius:4px; cursor:zoom-in;">
        ${value}
      `;
      span.style.display = 'flex';
      span.style.alignItems = 'center';
    } else if (field === 'attribute') {
      span.innerHTML = getAttributeIcon(value);
    } else {
      span.textContent = value;
    }

    if (FIELDS_TO_CHECK.includes(field)) {
      let correctVal = '-';
      if (field === 'tcg_date' || field === 'ocg_date') {
        const misc = answer.misc_info?.[0];
        correctVal = (field === 'tcg_date' ? misc?.tcg_date : misc?.ocg_date) || '-';
      } else {
        correctVal = answer[field] ?? '-';
      }

      if (String(value).toLowerCase() === String(correctVal).toLowerCase()) {
        span.classList.add('correct');
      } else {
        span.classList.add('incorrect');

        if (["tcg_date", "ocg_date"].includes(field)) {
          const v1 = parseInt(String(value).substring(0,4));
          const v2 = parseInt(String(correctVal).substring(0,4));
          if (!isNaN(v1) && !isNaN(v2) && v1 !== v2) {
            const arrow = document.createElement('span');
            arrow.textContent = v1 < v2 ? ' ↑' : ' ↓';
            arrow.style.fontWeight = 'bold';
            span.appendChild(arrow);
          }
        } else if (["atk","def","level","linkval","scale"].includes(field)) {
          const v1 = parseFloat(value);
          const v2 = parseFloat(correctVal);
          if (!isNaN(v1) && !isNaN(v2) && v1 !== v2) {
            const arrow = document.createElement('span');
            arrow.textContent = v1 < v2 ? ' ↑' : ' ↓';
            arrow.style.fontWeight = 'bold';
            span.appendChild(arrow);
          }
        }
      }
    }
    row.appendChild(span);
  });
  document.getElementById('results').appendChild(row);
}

function getAttributeIcon(attr) {
  const map = {
    'EARTH': 'icons/attribute/attribute_icon_earth.png',
    'FIRE': 'icons/attribute/attribute_icon_fire.png',
    'WATER': 'icons/attribute/attribute_icon_water.png',
    'WIND': 'icons/attribute/attribute_icon_wind.png',
    'LIGHT': 'icons/attribute/attribute_icon_light.png',
    'DARK': 'icons/attribute/attribute_icon_dark.png',
    'DIVINE': 'icons/attribute/attribute_icon_divine.png'
  };
  const src = map[attr?.toUpperCase()] || '';
  return src ? `<img src="${src}" style="height:32px;" alt="${attr}">` : attr;
}

// ====================== ZOOM ======================
function zoomImage(src) {
  const modal = document.getElementById('zoomModal');
  const zoomedImg = document.getElementById('zoomedImage');
  
  zoomedImg.src = src;
  modal.classList.remove('hidden');
  modal.style.display = 'flex';

  // Cerrar con la X
  const closeBtn = modal.querySelector('.close-zoom');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    };
  }

  // Cerrar haciendo clic fuera de la carta (en el fondo oscuro)
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  };

  // Cerrar con tecla ESC
  const escHandler = (e) => {
    if (e.key === "Escape") {
      modal.classList.add('hidden');
      modal.style.display = 'none';
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

function updateTriesLeft() {
  const el = document.getElementById('triesLeft');
  if (currentMode === 'infinite') {
    el.textContent = 'Infinite Mode — Unlimited attempts';
  } else {
    el.textContent = `Attempts left: ${MAX_TRIES - tries}`;
  }
}

function setMode(mode) {
  currentMode = mode;
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`button[onclick="setMode('${mode}')"]`).classList.add('active');
  startNewGame();
}

function confirmNewGame() {
  if (confirm("Start a new game?")) startNewGame();
}

// ====================== INIT ======================
window.onload = () => {
  loadAllCards();

  const input = document.getElementById('guessInput');
  input.addEventListener('keypress', e => { if (e.key === 'Enter') submitGuess(); });

  setupHintButtons();

  document.getElementById('zoomModal').addEventListener('click', e => {
    if (e.target.id === 'zoomModal') e.target.classList.add('hidden');
  });
};
