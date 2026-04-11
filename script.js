// ====================================================
// YugiohEdle - V0.6
// ====================================================

const MAX_TRIES = 10;
let allCards = [];
let answer = null;
let tries = 0;
let currentMode = 'monster';

// ====================== FIELDS ======================
const DISPLAY_FIELDS = ["name", "archetype", "type", "attribute", "race", "level", "atk", "def", "linkval", "scale", "tcg_date", "ocg_date", "ban_tcg"];
const FIELDS_TO_CHECK = ["archetype", "type", "attribute", "race", "level", "atk", "def", "linkval", "scale", "tcg_date", "ocg_date", "ban_tcg"];

// ====================== LOADER ======================
function showLoader() {
  let loader = document.getElementById('loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'loader';
    loader.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;font-size:1.6rem;z-index:9999;text-align:center;`;
    loader.innerHTML = `
      <div style="border:8px solid #333;border-top:8px solid #ffd700;border-radius:50%;width:70px;height:70px;animation:spin 1s linear infinite;margin-bottom:25px;"></div>
      <div>Loading Yu-Gi-Oh cards...</div>
    `;
    document.body.appendChild(loader);
    const style = document.createElement('style');
    style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
    document.head.appendChild(style);
  }
  loader.style.display = 'flex';
}
async function loadAllCards() {
  showLoader();
  try {
    const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes');
    const data = await response.json();
    allCards = data.data || [];
    console.log(`${allCards.length} cards loaded`);
    hideLoader();
    populateDatalist();
    startNewGame();
  } catch (error) {
    hideLoader();
    console.error(error);
    alert('Failed to load cards.');
  }
}
function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'none';
}

// =============== MODE, GAME & LOGIC =================
function getCurrentPool() {
  if (currentMode === 'monster') {
    return allCards.filter(card => {
      const typeStr = String(card.type || '').toLowerCase();
      return typeStr.includes('monster') && 
             !typeStr.includes('skill') && 
             !typeStr.includes('spell') && 
             !typeStr.includes('trap');
    });
  }
  return allCards;
}
function pickRandomCard() {
  const pool = getCurrentPool();
  return pool[Math.floor(Math.random() * pool.length)];
}
function startNewGame() {
  const endScreen = document.getElementById('endScreen');
  endScreen.classList.remove('show');
  tries = 0;
  answer = pickRandomCard();
  document.getElementById('results').innerHTML = '';
  createTableHeader();
  updateTriesLeft();
  document.getElementById('guessInput').value = '';
  resetHints();
  const misc = answer.misc_info?.[0] || {};
  const ban_tcg = getBanTCG(answer);
  console.log(`New game - Mode: ${currentMode} | Answer: ${answer.name}`);
  console.log("=== DEBUG BANLIST ===");
  console.log("Nombre:", answer.name);
  console.log("banlist_info completo:", answer.banlist_info);
  console.log("misc_info[0] ban_tcg:", answer.misc_info?.[0]?.ban_tcg);
  console.log("getBanTCG resultado:", ban_tcg);
  console.log("=== DEBUG BANLIST ===");
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
function getBanTCG(card) {
  if (!card) return 'Unlimited';
  if (card.banlist_info && card.banlist_info.ban_tcg) {
    console.log(`[getBanTCG] ${card.name} - ${card.banlist_info.ban_tcg}`);
    return card.banlist_info.ban_tcg;
  }
  if (card.misc_info && card.misc_info[0] && card.misc_info[0].ban_tcg) {
    console.log(`[getBanTCG] ${card.name} - ${card.banlist_info.ban_tcg}`);
    return card.misc_info[0].ban_tcg;
  }
  console.log(`[getBanTCG] ${card.name} - No ban info found, default Unlimited`);
  return 'Unlimited';
}

// ====================== HINTS =======================
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
  if (tries >= MAX_TRIES / 3.4) document.getElementById('wordHintBtn').disabled = false;
  if (tries >= MAX_TRIES / 2) document.getElementById('appearanceHintBtn').disabled = false;
  if (tries >= MAX_TRIES - 1) document.getElementById('archetypeHintBtn').disabled = false;
}
function setupHintButtons() {
  document.getElementById('initialHintBtn').onclick = () => {
    document.getElementById('initialHintDisplay').textContent = answer.name[0].toUpperCase();
    console.log(`Initial Hint Displayed: ${answer.name[0].toUpperCase()}`);
  };
  document.getElementById('wordHintBtn').onclick = () => {
    const count = answer.name.trim().split(/\s+/).length;
    document.getElementById('wordHintDisplay').textContent = count + " words";
    console.log(`Word Count Hint Displayed: ${count}`);
  };
  document.getElementById('appearanceHintBtn').onclick = () => {
    const misc = answer.misc_info?.[0];
    let date = "???";
    if (misc?.tcg_date) date = misc.tcg_date;
    document.getElementById('appearanceHintDisplay').textContent = date;
    console.log(`TCG Realease Hint Displayed: ${date}`);
  };
  document.getElementById('archetypeHintBtn').onclick = () => {
    document.getElementById('archetypeHintDisplay').textContent = answer.archetype || "No Archetype";
    console.log(`Archetype Hint Displayed: ${answer.archetype}`);
  };
}

// ================== AUTOCOMPLETE ====================
let currentFocus = -1;
function populateDatalist() {
  const input = document.getElementById('guessInput');
  const list = document.getElementById('autocomplete-list');
  function positionAutocomplete() {
    const input = document.getElementById('guessInput');
    const list = document.getElementById('autocomplete-list');
    const rect = input.getBoundingClientRect();
    list.style.top = (rect.bottom + window.scrollY + 6) + "px";
    list.style.left = (rect.left + window.scrollX) + "px";
}
list.style.display = 'block';
positionAutocomplete();
  input.addEventListener('input', function() {
    const val = this.value.toLowerCase().trim();
    list.innerHTML = '';
    currentFocus = -1;
    if (!val) {
      list.style.display = 'none';
      return;
    }
    const filtered = allCards.filter(card => 
      card.name.toLowerCase().includes(val)
    ).slice(0, 100);
    if (filtered.length === 0) {
      list.style.display = 'none';
      return;
    }
    filtered.forEach(card => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      const imgUrl = card.card_images?.[0]?.image_url || 'https://db.ygoprodeck.com/card-back.jpg';
      item.innerHTML = `
        <img src="${imgUrl}" alt="">
        <span>${card.name}</span>
      `;
      item.onclick = () => {
        input.value = card.name;
        list.style.display = 'none';
      };
      list.appendChild(item);
    });
    list.style.display = 'block';
  });
  input.addEventListener('keydown', function(e) {
    const items = list.getElementsByClassName('autocomplete-item');
    if (e.key === 'ArrowDown') {
      currentFocus++;
      addActive(items);
    } else if (e.key === 'ArrowUp') {
      currentFocus--;
      addActive(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentFocus > -1 && items[currentFocus]) {
        items[currentFocus].click();
      } else {
      }
    }
  });
  function addActive(items) {
    if (!items) return;
    removeActive(items);
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = items.length - 1;
    items[currentFocus].classList.add('autocomplete-active');
  }
  function removeActive(items) {
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove('autocomplete-active');
    }
  }
  document.addEventListener('click', function(e) {
    if (e.target !== input) {
      list.style.display = 'none';
    }
  });
}

// =================== TABLE HEADER ===================
function createTableHeader() {
  const header = document.createElement('div');
  header.className = 'result-row header';
  DISPLAY_FIELDS.forEach(field => {
    const span = document.createElement('span');
    span.className = 'field';
    span.style.fontWeight = 'bold';
    let title = field.charAt(0).toUpperCase() + field.slice(1);
    if (field === 'type') title = 'Card Type';
    if (field === 'race') title = 'Type';
    if (field === 'linkval') title = 'Link';
    if (field === 'scale') title = 'Pendulum';
    if (field === 'name') title = 'Card';
    if (field === 'tcg_date') title = 'TCG Date';
    if (field === 'ocg_date') title = 'OCG Date';
    if (field === 'ban_tcg') title = 'Banlist (TCG)';
    span.textContent = title;
    header.appendChild(span);
  });
  document.getElementById('results').appendChild(header);
}

// ================= SUBMIT & DISPLAY =================
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
  if (guessedCard.name === answer.name) {
    console.log(`Win!`);
    displayResult(guessedCard);
    showEndScreen(true);
    return;
  }
  if (tries >= MAX_TRIES && currentMode !== 'infinite') {
    showEndScreen(false);
    return;
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
      value = (field === 'tcg_date' ? misc?.tcg_date : misc?.ocg_date) || '???';
    } 
    else if (field === 'ban_tcg') {
      value = getBanTCG(guess);
    } 
    else {
      value = guess[field] ?? '???';
    }
    if ((field === 'atk' || field === 'def') && (value === '-1' || value === -1)) {
      value = '?';
    }
    if (field === 'name') {
      const imgUrl = guess.card_images?.[0]?.image_url || 'https://db.ygoprodeck.com/card-back.jpg';
      span.innerHTML = `
        <img src="${imgUrl}" class="card-thumbnail" onclick="zoomImage(this.src)" 
             style="height:58px; margin-right:6px; border-radius:1px; cursor:zoom-in;">
        ${value}
      `;
      span.style.display = 'flex';
      span.style.alignItems = 'center';
    } else if (field === 'attribute') {
      span.innerHTML = getAttributeIcon(value);
    } else if (field === 'type') {
      span.innerHTML = getCardIcon(value);
    } else if (field === 'race') {
      span.innerHTML = getTypeIcon(value);
    } else if (field === 'scale') {
      span.innerHTML = getPendhl(value, answer.scale);
    } else if (field === 'level') {
      const icon = getLevelIcon(guess.type, value);
      span.innerHTML = icon + value;
    } else {
      span.textContent = value;
    }

    // ===================== COLORING =====================
    if (FIELDS_TO_CHECK.includes(field)) {
      let displayValue = String(value).replace(/[↑↓]/g, '').trim();
      let correctVal = '???';
      if (field === 'tcg_date' || field === 'ocg_date') {
        const misc = answer.misc_info?.[0];
        correctVal = (field === 'tcg_date' ? misc?.tcg_date : misc?.ocg_date) || '???';
      } else if (field === 'ban_tcg') {
        correctVal = getBanTCG(answer);
      } else {
        correctVal = answer[field] ?? '???';
      }
      if ((field === 'atk' || field === 'def') && (correctVal === '-1' || correctVal === -1)) {
        correctVal = '???';
      }
      const isExact = String(displayValue).toLowerCase() === String(correctVal).toLowerCase();
      if (isExact) {
        span.classList.add('correct');
        console.log(`Correct: ${displayValue}`);
      } else {
        let isClose = false;
        if (["atk", "def"].includes(field)) {
          const v1 = parseFloat(displayValue);
          const v2 = parseFloat(correctVal);
          if (!isNaN(v1) && !isNaN(v2) && Math.abs(v1 - v2) <= 200) isClose = true;
        } 
        else if (["level", "linkval", "scale"].includes(field)) {
          const v1 = parseFloat(displayValue);
          const v2 = parseFloat(correctVal);
          if (!isNaN(v1) && !isNaN(v2) && Math.abs(v1 - v2) <= 1) isClose = true;
        } 
        else if (["tcg_date", "ocg_date"].includes(field)) {
          const d1 = displayValue.substring(0,10);
          const d2 = String(correctVal).substring(0,10);
          const date1 = new Date(d1);
          const date2 = new Date(d2);
          if (!isNaN(date1.getTime()) && !isNaN(date2.getTime())) {
            const diffDays = Math.abs((date1 - date2) / (1000 * 60 * 60 * 24));
            if (diffDays <= 185) isClose = true;
          }
        }
        if (isClose) {
          span.classList.add('close');
          console.log(`Close: ${displayValue}`);
        } else {
          span.classList.add('incorrect');
          console.log(`Incorrect: ${displayValue}`);
        }
      }
      if (!isExact) {
        if (["atk", "def"].includes(field)) {
          const v1 = parseFloat(displayValue);
          const v2 = parseFloat(correctVal);
          if (!isNaN(v1) && !isNaN(v2) && v1 !== v2) {
            const arrow = document.createElement('span');
            arrow.textContent = v1 < v2 ? ' ↑' : ' ↓';
            arrow.style.fontWeight = 'bold';
            arrow.style.marginLeft = '6px';
            span.appendChild(arrow);
          }
        } 
        else if (["level", "linkval"].includes(field)) {
          const v1 = parseFloat(displayValue);
          const v2 = parseFloat(correctVal);
          if (!isNaN(v1) && !isNaN(v2) && v1 !== v2) {
            const arrow = document.createElement('span');
            arrow.textContent = v1 < v2 ? ' ↑' : ' ↓';
            arrow.style.fontWeight = 'bold';
            arrow.style.marginLeft = '6px';
            span.appendChild(arrow);
          }
        } 
        else if (["tcg_date", "ocg_date"].includes(field)) {
          const d1 = displayValue.substring(0,10);
          const d2 = String(correctVal).substring(0,10);
          const date1 = new Date(d1);
          const date2 = new Date(d2);
          if (!isNaN(date1.getTime()) && !isNaN(date2.getTime())) {
            const arrow = document.createElement('span');
            arrow.textContent = date1 < date2 ? ' ↑' : ' ↓';
            arrow.style.fontWeight = 'bold';
            arrow.style.marginLeft = '6px';
            span.appendChild(arrow);
          }
        }
      }
    }
    row.appendChild(span);
  });
  document.getElementById('results').appendChild(row);
}

// ====================== ICONS =======================
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
function getCardIcon(type) {
  const map = {
    'SPELL CARD': 'icons/spelltraps/card_type_icon_spell.svg',
    'TRAP CARD': 'icons/spelltraps/card_type_icon_trap.svg',
  };
  const src = map[type?.toUpperCase()] || '';
  return src ? `<img src="${src}" style="height:32px;" alt="${type}">` : type;
}
function getTypeIcon(race) {
  const map = {
    'FIELD': 'icons/spelltraps/effect_icon_field.png',
    'CONTINUOUS': 'icons/spelltraps/effect_icon_continuous.png',
    'COUNTER': 'icons/spelltraps/effect_icon_counter.png',
    'QUICK PLAY': 'icons/spelltraps/effect_icon_quickplay.png',
    'EQUIP': 'icons/spelltraps/effect_icon_equip.png',
    'RITUAL': 'icons/spelltraps/effect_icon_ritual.png',
  };
  const src = map[race?.toUpperCase()] || '';
  return src ? `<img src="${src}" style="height:32px;" alt="${race}">` : race;
}
function getPendhl(guessScale, answerScale) {
  if (guessScale === undefined || guessScale === null || guessScale === '') {
    return '???';
  }
  const num = String(guessScale);
  let iconSrc = '';
  const g = parseInt(guessScale);
  const a = parseInt(answerScale);
  if (!isNaN(g) && !isNaN(a) && g !== a) {
    if (g < a) {
      iconSrc = 'icons/pendhighlow/pend_red_up.png';
    } else {
      iconSrc = 'icons/pendhighlow/pend_blue_down.png';
    }
  }
  return `${num} <img src="${iconSrc}" style="height:28px; margin-left:6px; vertical-align:middle;" alt="">`;
}
function getLevelIcon(cardType, level) {
  if (!level || level === '?' || level === '-') return '';
  const typeStr = String(cardType || '').toUpperCase();
  if (typeStr.includes('SPELL') || typeStr.includes('TRAP')) {
    return '???';
  }
  if (typeStr.includes('XYZ')) {
    return `<img src="icons/level/Rank.png" style="height:28px; margin-right:6px; vertical-align:middle;" alt="Rank ">`;
  }
  if (typeStr.includes('LINK')) {
    return '???';
  }
  return `<img src="icons/level/Level.png" style="height:28px; margin-right:6px; vertical-align:middle;" alt="Level ">`;
}

// ====================== ZOOM ======================
function zoomImage(src) {
  const modal = document.getElementById('zoomModal');
  const zoomedImg = document.getElementById('zoomedImage');
  zoomedImg.src = src;
  modal.classList.remove('hidden');
  modal.style.display = 'flex';
  const closeBtn = modal.querySelector('.close-zoom');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    };
  }
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
      modal.style.display = 'none';
    }
  };
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
function showEndScreen(won) {
  const endScreen = document.getElementById('endScreen');
  const title = document.getElementById('endTitle');
  const cardImage = document.getElementById('endCardImage');
  const cardName = document.getElementById('endCardName');
  const message = document.getElementById('endMessage');
  cardImage.src = answer.card_images?.[0]?.image_url || '';
  cardName.textContent = answer.name;
  if (won) {
    title.textContent = "🎉 Congratulations!";
    title.style.color = "#4ade80";
    message.textContent = `You guessed the card in ${tries} tries!`;
  } else {
    title.textContent = "Game Over";
    title.style.color = "#ff6b6b";
    message.textContent = `The card was: ${answer.name}`;
  }
  endScreen.classList.add('show');
}
function showFullTable() {
  const endScreen = document.getElementById('endScreen');
  endScreen.classList.remove('show');
  const resultsDiv = document.getElementById('results');
  if (resultsDiv.lastElementChild && resultsDiv.lastElementChild.classList.contains('correct-row')) {
    resultsDiv.scrollIntoView({ behavior: "smooth", block: "end" });
    return;
  } else {
    const finalRow = document.createElement('div');
    finalRow.className = 'result-row correct-row';
    DISPLAY_FIELDS.forEach(field => {
      const span = document.createElement('span');
      span.className = 'field';
      let val = answer[field] ?? '-';
      if (field === 'tcg_date' || field === 'ocg_date') {
        const misc = answer.misc_info?.[0];
        val = (field === 'tcg_date' ? misc?.tcg_date : misc?.ocg_date) || '-';
      } else if (field === 'ban_tcg') {
        val = getBanTCG(answer);
      }
      if ((field === 'atk' || field === 'def') && (val === '-1' || val === -1)) val = '?';
      if (field === 'name' && answer.card_images?.[0]) {
        span.innerHTML = `
          <img src="${answer.card_images[0].image_url}" class="card-thumbnail" style="height:52px; margin-right:10px;">
          ${answer.name}
        `;
      } else {
        span.textContent = val;
      }
      finalRow.appendChild(span);
    });
    resultsDiv.appendChild(finalRow);
    setTimeout(() => {
      finalRow.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }
}
