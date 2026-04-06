// ====================================================
// YugiohEdle - By LyraNova
//
// Credits:
// - YGOPRODeck API
// - Inspired by pokemonle and yichengxia's yugioh-guess
// ====================================================

const MAX_TRIES = 10;
let allCards = [];
let answer = null;
let tries = 0;
let currentMode = 'card';   // 'monster' | 'card' | 'infinite'

// ====================================================
// Fields Configuration
// ====================================================

const DISPLAY_FIELDS = [
  "name", "archetype", "type", "attribute", "race",
  "level", "atk", "def", "linkval", "scale"
];

const FIELDS_TO_CHECK = [
  "archetype", "type", "attribute", "race",
  "level", "atk", "def", "linkval", "scale"
];

// ====================================================
// Loader
// ====================================================

function showLoader() {
  let loader = document.getElementById('loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'loader';
    loader.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.9); display: flex; align-items: center;
      justify-content: center; flex-direction: column; color: white;
      font-size: 1.6rem; z-index: 9999; text-align: center;
    `;
    loader.innerHTML = `
      <div style="border: 8px solid #333; border-top: 8px solid #ffd700; 
                  border-radius: 50%; width: 70px; height: 70px; 
                  animation: spin 1s linear infinite; margin-bottom: 25px;"></div>
      <div>Loading all Yu-Gi-Oh cards...</div>
      <div style="margin-top: 12px; font-size: 1.1rem;">This may take a few seconds on first load</div>
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

// ====================================================
// Load Cards from API
// ====================================================

async function loadAllCards() {
  showLoader();

  try {
    const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
    if (!response.ok) throw new Error('API connection error');

    const data = await response.json();
    allCards = data.data || [];

    console.log(`✅ ${allCards.length} cards successfully loaded from YGOPRODeck API`);

    hideLoader();
    populateDatalist();
    startNewGame();

  } catch (error) {
    hideLoader();
    console.error(error);
    alert('Failed to load cards. Please check your internet connection and try again.');
  }
}

// ====================================================
// Get card pool based on current mode
// ====================================================

function getCurrentPool() {
  if (currentMode === 'monster') {
    return allCards.filter(card => card.type && card.type.toLowerCase().includes('monster'));
  }
  return allCards; // 'card' or 'infinite'
}

function pickRandomCard() {
  const pool = getCurrentPool();
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ====================================================
// Start New Game
// ====================================================

function startNewGame() {
  tries = 0;
  answer = pickRandomCard();

  if (!answer) {
    alert("No cards available in this mode.");
    return;
  }

  const results = document.getElementById('results');
  results.innerHTML = '';
  createTableHeader();

  updateTriesLeft();
  document.getElementById('guessInput').value = '';

  console.log("Secret card:", answer.name);
}

// ====================================================
// Autocomplete (Datalist)
// ====================================================

function populateDatalist() {
  const datalist = document.getElementById('cardList');
  if (!datalist) return;
  datalist.innerHTML = '';

  allCards.forEach(card => {
    const option = document.createElement('option');
    option.value = card.name;
    datalist.appendChild(option);
  });
}

// ====================================================
// Create Table Header
// ====================================================

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

    span.textContent = title;
    header.appendChild(span);
  });

  document.getElementById('results').appendChild(header);
}

// ====================================================
// Submit Guess
// ====================================================

function submitGuess() {
  if (tries >= MAX_TRIES && currentMode !== 'infinite') return;

  const input = document.getElementById('guessInput');
  const guessName = input.value.trim();

  if (!guessName) return;

  const guessedCard = allCards.find(c => c.name.toLowerCase() === guessName.toLowerCase());

  if (!guessedCard) {
    alert("Card not found. Please type the exact name.");
    return;
  }

  displayResult(guessedCard);
  tries++;
  updateTriesLeft();

  const isWin = guessedCard.name === answer.name;

  if (isWin || (tries >= MAX_TRIES && currentMode !== 'infinite')) {
    if (isWin) {
      alert("🎉 Congratulations! You guessed the card correctly.");
    } else {
      alert(`❌ No more attempts left.\nThe card was: ${answer.name}`);
      displayResult(answer);
    }
    if (!isWin) tries = MAX_TRIES;
  }

  input.value = '';
}

// ====================================================
// Display Result Row
// ====================================================

function displayResult(guess) {
  const row = document.createElement('div');
  row.className = 'result-row';
  if (guess.name === answer.name) row.classList.add('correct-row');

  DISPLAY_FIELDS.forEach(field => {
    const span = document.createElement('span');
    span.className = 'field';

    let value = (guess[field] !== undefined && guess[field] !== null) ? guess[field] : '-';

    // Card Name + Image
    if (field === 'name') {
      const imgUrl = guess.card_images && guess.card_images[0] 
        ? guess.card_images[0].image_url 
        : 'https://db.ygoprodeck.com/card-back.jpg';

      span.innerHTML = `
        <img src="${imgUrl}" class="card-thumbnail" alt="${value}" 
             style="height:65px; vertical-align:middle; margin-right:10px; border-radius:4px;">
        ${value}
      `;
      span.style.display = 'flex';
      span.style.alignItems = 'center';
    } 
    else {
      span.textContent = value;
    }

    // Coloring + Higher / Lower arrows
    if (FIELDS_TO_CHECK.includes(field)) {
      let correctValue = answer[field];
      if (correctValue === null || correctValue === undefined) correctValue = '-';

      const val1 = parseFloat(value);
      const val2 = parseFloat(correctValue);

      if (value == correctValue || (isNaN(val1) && isNaN(val2))) {
        span.classList.add('correct');
      } else {
        span.classList.add('incorrect');

        // Higher/Lower arrows for numeric fields
        if (["atk", "def", "level", "linkval", "scale"].includes(field)) {
          if (!isNaN(val1) && !isNaN(val2) && val1 !== val2) {
            const arrow = document.createElement('span');
            arrow.style.marginLeft = '8px';
            arrow.style.fontWeight = 'bold';
            arrow.style.fontSize = '1.1em';
            arrow.textContent = val1 < val2 ? '↑' : '↓';
            span.appendChild(arrow);
          }
        }
      }
    }

    row.appendChild(span);
  });

  document.getElementById('results').appendChild(row);
}

// ====================================================
// Update Tries Display
// ====================================================

function updateTriesLeft() {
  const triesEl = document.getElementById('triesLeft');
  if (!triesEl) return;

  if (currentMode === 'infinite') {
    triesEl.textContent = 'Infinite Mode — Unlimited attempts';
  } else {
    const left = MAX_TRIES - tries;
    triesEl.textContent = `Attempts left: ${left}`;
  }
}

// ====================================================
// Change Mode
// ====================================================

function setMode(newMode) {
  currentMode = newMode;
  startNewGame();
}

// ====================================================
// Initialization
// ====================================================

window.onload = () => {
  loadAllCards();

  // Enter key support
  const guessInput = document.getElementById('guessInput');
  if (guessInput) {
    guessInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') submitGuess();
    });
  }
};
