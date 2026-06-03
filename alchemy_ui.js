/* ==========================================================================
   SECTION: JS - GLOBAL STATE & INIT
   ========================================================================== */
let DB = null;
const STORAGE_KEY = "alchemy_factory_save_v1";
const SOURCE_KEY = "alchemy_source_v1";
const BACKUP_KEY = "alchemy_source_backup_v1";
const I18N_DATA_KEY = "alchemy_i18n_source_v1";
const I18N_BACKUP_KEY = "alchemy_i18n_source_backup_v1";
const SETTINGS_KEY = "alchemy_settings_v1";
const SETTINGS_BACKUP_KEY = "alchemy_settings_backup_v1";

const DEFAULT_SETTINGS = {
    lvlBelt: 0,
    lvlSpeed: 0,
    lvlAlchemy: 0,
    lvlFuel: 0,
    lvlFert: 0,
    defaultFuel: "Plank",
    defaultFert: "Basic Fertilizer",
    fuelCostEnable: true,
    fertCostEnable: true,
    showMaxCap: false,
    showHeatFert: false,
    showBeltCount: false,
    preferredRecipes: {},
    recipeModifiers: {},
    activeRecyclers: {},
    customCosts: { "Logs": 200, "Coal Ore": 4800 }
};

let isSelfFuel = false;
let isSelfFert = false;

// COMBOBOX GLOBALS
let allItemsList = [];
let currentFocus = -1;

// ITEM PICKER GLOBALS
let currentPickerCategory = "[All]";

// URL STATES
let lastUrlItem = ""; 
let isHandlingPopstate = false;

function init() {
    const localData = localStorage.getItem(STORAGE_KEY);
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get('lang');
    const urlTab = urlParams.get('tab');    
    const urlItem = urlParams.get('item');
    const urlRate = urlParams.get('rate');
    const urlFuel = urlParams.get('fuel');
    const urlFert = urlParams.get('fert');
    const urlSetupgrades = urlParams.get('setupgrades');
    
    lastUrlItem = urlItem || "";

    if (!window.ALCHEMY_DB) { alert("Error: alchemy_db.js not found!"); }
    if (!window.ALCHEMY_I18N) { alert("Error: alchemy_i18n.js not found!"); }

    const localTranslation = localStorage.getItem(I18N_DATA_KEY);
    if (localTranslation) {
        try {
            console.log("Loading local translation data...");
            window.ALCHEMY_I18N = JSON.parse(localTranslation);
        } catch (e) {
            console.error("Local translation data corrupt, resetting...");
            window.ALCHEMY_I18N = JSON.parse(JSON.stringify(window.ALCHEMY_I18N));
        }
    } else {
        console.log("Loading remote translation data...");
        window.ALCHEMY_I18N = JSON.parse(JSON.stringify(window.ALCHEMY_I18N));
    }
    if (urlLang === 'en') window.ALCHEMY_I18N.enabled = false;
    else ALCHEMY_I18N.enabled = true;

    const fileDB = window.ALCHEMY_DB;
    if (localData) {
        try {
            console.log("Loading local database...");
            DB = JSON.parse(localData);
            const localVersion = DB.version || 0;
            const fileVersion = fileDB.version || 0;

            if (fileVersion != localVersion) {
                console.log(fileVersion);
                showUpdateBanner(localVersion, fileVersion);
            }
        } catch (e) {
            console.error("Local data corrupt, resetting...");
            DB = JSON.parse(JSON.stringify(fileDB));
        }
    } else {
        console.log("Loading remote database...");
        DB = JSON.parse(JSON.stringify(fileDB));
    }

    const baseSettings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    const savedSettings = localStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
        try {
            console.log("Loading user settings...");
            const parsed = JSON.parse(savedSettings);
            DB.settings = Object.assign(baseSettings, parsed);
        } catch (e) {
            console.error("Settings corrupt, using defaults");
            DB.settings = baseSettings;
        }
    } else {
        console.log("Loading default settings...");
        DB.settings = baseSettings;
    }
    
    if(!DB.items) DB.items = {};
    if(!DB.settings.preferredRecipes) DB.settings.preferredRecipes = {};
    if(!DB.settings.recipeModifiers)  DB.settings.recipeModifiers = {};
    if(!DB.settings.activeRecyclers) DB.settings.activeRecyclers = {};
    if(!DB.settings.customCosts) DB.settings.customCosts = {};

    translateDatabase(DB, true); // Translate DB item key

    prepareComboboxData();
    populateSelects(); 
    loadSettingsToUI();
    renderSlider(); // Initialize the slider logic
    
    if (urlItem) {
        document.getElementById('targetItemInput').value = decodeURIComponent(urlItem);
        updateComboIcon();
    }    
    if (urlRate) {
        document.getElementById('targetRate').disabled = false;
        document.getElementById('targetRate').value = urlRate;
    } else {
        // 沒有指定 rate 時，默認啟用 "Set by Machine Count" 模式，machine count = 1
        const machineModeToggle = document.getElementById('machineModeToggle');
        machineModeToggle.checked = true;
        toggleControlMode(false); // 切換 UI 狀態（禁用 rate 輸入、啟用 machine 輸入）
    }
    
    if (urlFuel && document.querySelector(`#fuelSelect option[value="${urlFuel}"]`)) {
        document.getElementById('fuelSelect').value = urlFuel;
    }
    if (urlFert && document.querySelector(`#fertSelect option[value="${urlFert}"]`)) {
        document.getElementById('fertSelect').value = urlFert;
    }
    if (urlSetupgrades) {
        /*
        [0]Logistics Efficiency
        [1]Throwing Efficiency
        [2]Factory Efficiency
        [3]Alchemy Skill
        [4]Fuel Efficiency
        [5]Fertilizer Efficiency
        [6]Sales Ability
        [7]Negotiation Skill
        [8]Customer Management
        [9]Relic Knowledge
        */
        const upgrades = urlSetupgrades.split(',').map(Number) || [];
        if (upgrades.length > 5) {
            console.log(urlSetupgrades);
            DB.settings.lvlBelt = upgrades[0];
            DB.settings.lvlSpeed = upgrades[2];
            DB.settings.lvlAlchemy = upgrades[3];
            DB.settings.lvlFuel = upgrades[4];
            DB.settings.lvlFert = upgrades[5];
            loadSettingsToUI();
            persist();
        }
    }

    // Import caldron recipes (if exist)
    try {
        loadCauldronSettings();
        syncCauldronToMainDB();
    } catch (e) {
        log.error(e);
    }

    calculate();
    
    if (urlTab) switchTab(urlTab);

    document.getElementById('db-gameversion-text').innerText = t("Game version : ") + DB.gameVersion ?? 0;
}

/* ==========================================================================
   SECTION: SLIDER LOGIC
   ========================================================================== */
function renderSlider() {
    if (typeof BELT_FRACTIONS === 'undefined') {
        console.error("alchemy_constants.js not loaded.");
        return;
    }
    const slider = document.getElementById('beltSlider');
    const ticksContainer = document.getElementById('sliderTicks');
    const thumbWidth = 14; // Must match CSS --thumb-size
    
    // Set slider max to array length
    slider.max = BELT_FRACTIONS.length - 1;
    slider.value = BELT_FRACTIONS.length - 1; // Default to Full
    
    ticksContainer.innerHTML = '';
    
    BELT_FRACTIONS.forEach((frac, idx) => {
        const pct = (idx / (BELT_FRACTIONS.length - 1));
        
        // --- ALIGNMENT MATH ---
        // Range Input Logic: Thumb center moves from [ThumbWidth/2] to [Width - ThumbWidth/2]
        // This formula nudges the ticks inward based on percentage to align with center
        const leftPos = `calc(${pct * 100}% + (${(thumbWidth/2) - (thumbWidth * pct) + 2}px))`;
        
        const tick = document.createElement('div');
        tick.className = `tick-mark ${frac.label ? 'labeled' : ''}`;
        tick.style.left = leftPos;
        
        let labelHtml = '';
        if (frac.label) {
            if (frac.label === "Full") {
                labelHtml = `<div class="vertical-frac full-label">Full</div>`;
            } else if (frac.label.includes("/")) {
                const [n, d] = frac.label.split("/");
                labelHtml = `
                    <div class="vertical-frac">
                        <span class="num">${n}</span>
                        <span class="sep"></span>
                        <span class="den">${d}</span>
                    </div>`;
            } else {
                labelHtml = `<div class="vertical-frac">${frac.label}</div>`;
            }
        }
        
        tick.innerHTML = `<div class="tick-line"></div>${labelHtml}`;
        ticksContainer.appendChild(tick);
    });
}

function updateFromSlider() {
    if (typeof BELT_FRACTIONS === 'undefined') return;
    
    const sliderIndex = parseInt(document.getElementById('beltSlider').value);
    const fraction = BELT_FRACTIONS[sliderIndex];
    const lvlBelt = parseInt(document.getElementById('lvlBelt').value) || 0;
    const currentSpeed = getBeltSpeed(lvlBelt);
    
    const rate = calculateRateFromFraction(fraction, currentSpeed);
    
    // Update the input box
    const rateInput = document.getElementById('targetRate');
    rateInput.value = parseFloat(rate.toFixed(2));
    
    calculate();
}

/* ==========================================================================
   SECTION: EDITOR & DATA MANAGEMENT
   ========================================================================== */
function loadEditorContent() {
    const target = document.getElementById('editor-target').value;
    const editor = document.getElementById('json-editor');

    switch (target) {
        case 'db': editor.value = localStorage.getItem(SOURCE_KEY) ?? JSON.stringify(DB, null, 2); break;
        case 'db_backup': editor.value = localStorage.getItem(BACKUP_KEY) ?? ""; break;
        case 'i18n': editor.value = JSON.stringify(window.ALCHEMY_I18N, null, 2); break;
        case 'i18n_backup': editor.value = localStorage.getItem(I18N_BACKUP_KEY) ?? ""; break;
        case 'settings': editor.value = JSON.stringify(DB.settings, null, 2); break;
        case 'settings_backup': editor.value = localStorage.getItem(SETTINGS_BACKUP_KEY) ?? ""; break;
    }
}

function switchTab(tabName) {
    let btnIndex = 0;
    switch (tabName) {
        case 'calc': btnIndex = 0; break;
        case 'cauldron': btnIndex = 1; break;        
        case 'recipes': btnIndex = 2; break;
        case 'db': btnIndex = 3; break;
        default: return;
    }
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById('view-' + tabName).classList.add('active');
    document.querySelectorAll('.tab-btn')[btnIndex].classList.add('active');
    updateURL(tabName);
    if (tabName === 'cauldron' && typeof initCauldron === 'function') {
        initCauldron();
    }
    if (tabName === 'recipes') {
        initRecipePage();
    }
    if (tabName === 'calc') {
        syncCauldronToMainDB(); // 回到計算器頁面時, 嘗試同步煉金鍋配方
    }
}

function applyChanges() {
    const txt = document.getElementById('json-editor').value;
    const target = document.getElementById('editor-target').value;
    try {
        const jsonMatch = txt.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("Format error: No valid JSON found (missing { ... })");
        
        let jsonString = jsonMatch[0];
        jsonString = jsonString.replace(/\/\/.*$/gm, '');
        const parsedData = JSON.parse(jsonString); // Avoid using eval()

        switch (target) {
            case 'db': 
            case 'db_backup': 
                window.ALCHEMY_DB = parsedData;
                DB = window.ALCHEMY_DB;
                if (localStorage.getItem(SOURCE_KEY)) localStorage.setItem(BACKUP_KEY, localStorage.getItem(SOURCE_KEY));
                localStorage.setItem(SOURCE_KEY, txt);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(DB));
                init();
            case 'i18n':
            case 'i18n_backup':                
                translateDatabase(DB, false); // Revert DB item key back the the original key
                window.ALCHEMY_I18N = parsedData;
                if (localStorage.getItem(I18N_DATA_KEY)) localStorage.setItem(I18N_BACKUP_KEY, localStorage.getItem(I18N_DATA_KEY));
                localStorage.setItem(I18N_DATA_KEY, JSON.stringify(window.ALCHEMY_I18N));
                location.reload();
            case 'settings':
            case 'settings_backup':
                DB.settings = parsedData;
                if (localStorage.getItem(SETTINGS_KEY)) localStorage.setItem(SETTINGS_BACKUP_KEY, localStorage.getItem(SETTINGS_KEY));
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(DB.settings));
                init();
        } 
        alert("Applied " + target + " safely!");
    } catch(e) {
        alert("JSON Parsing Error: " + e.message + "\n\nNote: Please ensure the data uses double quotes and no trailing commas.");
    }
}

function showUpdateBanner(oldV, newV) {
    const banner = document.getElementById('update-banner');
    banner.style.display = 'flex';
    document.getElementById('old-version-id').innerText = 'v' + oldV;
    document.getElementById('new-version-id').innerText = 'v' + newV;
    document.getElementById('ui-update-msg').innerText = t('New database version available', 'ui');
    document.getElementById('ui-update-local-msg').innerText = t('Current local version:', 'ui');
    document.getElementById('ui-btn-update').innerText = t('Update Now', 'ui');
    document.getElementById('ui-btn-later').innerText = t('Skip Update', 'ui');   
}

function closeUpdateBanner() {
    document.getElementById('update-banner').style.display = 'none';
    console.log("Bump local data version to " + window.ALCHEMY_DB.version);
    DB.version = window.ALCHEMY_DB.version;
    persist();
}

function performUpdate() {
    console.log("Updating database v" + window.ALCHEMY_DB.version);    
    const newData = JSON.parse(JSON.stringify(window.ALCHEMY_DB));
    if (DB && DB.settings) {
        newData.settings = DB.settings;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    const localSourceData = localStorage.getItem(SOURCE_KEY);
    if (localSourceData) {
        localStorage.setItem(BACKUP_KEY, localSourceData);
    }
    localStorage.removeItem(SOURCE_KEY);
    location.reload();
}

function exportData() {
    const txt = document.getElementById('json-editor').value; const blob = new Blob([txt], { type: "text/javascript" });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = "alchemy_db.js"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function persist() { 
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DB.settings));
}

/* ==========================================================================
   SECTION: COMBOBOX LOGIC
   ========================================================================== */
function prepareComboboxData() {
    const allItems = new Set(Object.keys(DB.items || {}));
    if(DB.recipes) DB.recipes.forEach(r => Object.keys(r.outputs).forEach(k => allItems.add(k)));
    allItemsList = Array.from(allItems).sort().map(name => {
        return { name: name, category: t((DB.items[name] ? DB.items[name].category : "Other"), 'categories') };
    });
}

function toggleCombobox() {
    const list = document.getElementById('combobox-list');
    const input = document.getElementById('targetItemInput');
    if(list.style.display === 'block') { closeCombobox(); } else { input.focus(); filterCombobox(); }
}

function updateComboIcon() {
    const input = document.getElementById('targetItemInput');
    const icon = document.getElementById('combo-btn');
    if(input.value.trim().length > 0) {
        icon.innerText = "✖";
        icon.style.color = "#ff5252";
    } else {
        icon.innerText = "▼";
        icon.style.color = "#888";
    }
}

function handleComboIconClick(e) {
    e.stopPropagation();
    const input = document.getElementById('targetItemInput');
    if(input.value.trim().length > 0) {
        input.value = "";
        filterCombobox();
        updateComboIcon();
        input.focus();
        updateURL();
    } else {
        toggleCombobox();
    }
}

function closeCombobox() { document.getElementById('combobox-list').style.display = 'none'; currentFocus = -1; }
function closeComboboxDelayed() { setTimeout(() => closeCombobox(), 200); }

function filterCombobox() {
    const input = document.getElementById('targetItemInput');
    const filter = input.value.toLowerCase();
    const list = document.getElementById('combobox-list');
    const ghost = document.getElementById('ghost-text');
    
    list.innerHTML = ''; list.style.display = 'block';
    updateComboIcon();
    
    let matches = allItemsList.filter(item => item.name.toLowerCase().includes(filter));
    matches.sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(filter);
        const bStarts = b.name.toLowerCase().startsWith(filter);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.name.localeCompare(b.name);
    });

    matches.forEach((item) => {
        const div = document.createElement('div'); div.className = 'combo-item';
        div.innerHTML = `<span>${item.name}</span> <span class="combo-cat">${item.category}</span>`;
        div.onclick = function() { selectItem(item.name); };
        list.appendChild(div);
    });

    if (filter.length > 0 && matches.length > 0) {
        const topMatch = matches[0].name;
        if (topMatch.toLowerCase().startsWith(filter)) {
            const ghostSuffix = topMatch.substring(filter.length);
            ghost.innerText = input.value + ghostSuffix;
        } else { ghost.innerText = ""; }
    } else { ghost.innerText = ""; }
}

function handleComboKey(e) {
    const list = document.getElementById('combobox-list');
    const items = list.getElementsByClassName('combo-item');
    const input = document.getElementById('targetItemInput');
    const ghost = document.getElementById('ghost-text');

    if (e.key === 'ArrowDown') {
        currentFocus++; if (currentFocus >= items.length) currentFocus = 0; setActive(items); e.preventDefault();
    } else if (e.key === 'ArrowUp') {
        currentFocus--; if (currentFocus < 0) currentFocus = items.length - 1; setActive(items); e.preventDefault();
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentFocus > -1 && items.length > 0) { items[currentFocus].click(); } 
        else if (ghost.innerText.length > input.value.length) { selectItem(ghost.innerText); } 
        else if (items.length > 0) { items[0].click(); } 
        else { closeCombobox(); calculate(); }
    } else if (e.key === 'Tab') {
        if (ghost.innerText.length > input.value.length) { e.preventDefault(); selectItem(ghost.innerText); } 
        else { closeCombobox(); }
    }
}

function setActive(items) {
    if (!items) return;
    for (let i = 0; i < items.length; i++) { items[i].classList.remove('selected'); }
    if (currentFocus >= 0 && currentFocus < items.length) {
        items[currentFocus].classList.add('selected'); items[currentFocus].scrollIntoView({ block: 'nearest' });
        const name = items[currentFocus].getElementsByTagName('span')[0].innerText;
        document.getElementById('targetItemInput').value = name;
        document.getElementById('ghost-text').innerText = "";
        updateComboIcon();
    }
}

function selectItem(name) {
    const input = document.getElementById('targetItemInput'); input.value = name;
    document.getElementById('ghost-text').innerText = ""; closeCombobox(); updateComboIcon(); updateFromSlider(); 
}

function selectRate(rate) {
    document.getElementById('targetRate').disabled = false;
    document.getElementById('targetRate').value = rate;
}

function recalculate(item, rate) {
    selectItem(item);
    selectRate(rate);
    calculate();
}

/* ==========================================================================
   SECTION: JS - Multiple Inputs
   ========================================================================== */

function toggleCalcMode() {
    const isMulti = document.getElementById('modeToggle').checked;
    document.getElementById('single-target-ui').style.display = isMulti ? 'none' : 'block';
    document.getElementById('multi-target-ui').style.display = isMulti ? 'block' : 'none';
    
    // 如果進入多產物模式且清單為空，先嘗試載入儲存的列表，沒找到再預設加一列
    const list = document.getElementById('multi-target-list');
    if (isMulti) {
        if (list.children.length === 0) loadMultiTargets();
        if (list.children.length === 0) addMultiTargetRow();
    }    
    calculate();
}

function addMultiTargetRow(itemName, rate = 0) {
    const container = document.getElementById('multi-target-list');
    const itemDef = DB.items[itemName] || { id: 0 };
    if (!itemName) itemName = t('Target Item');
    
    const row = document.createElement('div');
    row.className = 'multi-target-row';
    // 使用 dataset 儲存當前選中的物品名稱，方便 gatherInputs 讀取
    row.dataset.item = itemName;

    if (rate === 0) {
        const lvlBelt = parseInt(document.getElementById('lvlBelt').value) || 0;
        rate = getBeltSpeed(lvlBelt);
    }

    row.innerHTML = `
        <div class="mini-picker" onclick="pickMultiTargetRow(this)">
            <img src="img/item${itemDef.id}.png" width="20" height="20">
            <span class="item-name-label">${itemName}</span>
        </div>
        <input type="number" class="multi-rate-input" value="${rate}" oninput="calculate()">
        <button class="swap-btn" onclick="this.parentElement.remove(); calculate();" style="color:var(--danger); border-color:var(--danger);">x</button>
    `;
    
    container.appendChild(row);
}

function pickMultiTargetRow(pickerEl) {
    const row = pickerEl.parentElement;
    const label = pickerEl.querySelector('.item-name-label');
    const img = pickerEl.querySelector('img');
    
    // 暫時重寫全域 selectItem，以便 Picker 選中時更新這一個 Row
    const originalSelectItem = window.selectItem;
    window.selectItem = (name) => {
        const itemDef = DB.items[name] || { id: 0 };
        row.dataset.item = name;
        label.innerText = name;
        img.src = `img/item${itemDef.id}.png`;
        
        window.selectItem = originalSelectItem; // 恢復原有的選擇邏輯
        calculate();
    };
    
    openItemPicker();
}

function saveMultiTargets(e) {
    const targets = [];
    const rows = document.querySelectorAll('.multi-target-row');    
    rows.forEach(row => {
        const item = row.dataset.item;
        const rate = parseFloat(row.querySelector('.multi-rate-input').value) || 0;
        if (item) {
            targets.push({ item, rate });
        }
    });
    if (targets.length === 0) {
        console.log(t("List is empty, nothing to save.", "ui"));
        return;
    }
    DB.settings.multiTargets = targets;
    persist();
    flashButton(e.currentTarget);
}

function loadMultiTargets(e) {
    if (!DB.settings.multiTargets || DB.settings.multiTargets.length === 0) {
        console.log(t("No saved list found.", "ui"));
        return;
    }
    const container = document.getElementById('multi-target-list');
    container.innerHTML = ''; // 清空目前清單
    DB.settings.multiTargets.forEach(target => {
        addMultiTargetRow(target.item, target.rate);
    });
    calculate(); // 重新計算
    flashButton(e.currentTarget);
}

/**
 * 讓按鈕閃爍一下的輔助函數
 */
function flashButton(el) {
    if (!el) return;
    el.classList.remove('btn-flash'); // 重置動畫
    void el.offsetWidth;             // 觸發重繪 (Reflow) 以重啟動畫
    el.classList.add('btn-flash');
    setTimeout(() => el.classList.remove('btn-flash'), 600);
}

/* ==========================================================================
   SECTION: JS - UI HANDLERS (INPUTS/SETTINGS)
   ========================================================================== */
function loadSettingsToUI() {
    if (DB.settings) {
        ['lvlBelt','lvlSpeed','lvlAlchemy','lvlFuel','lvlFert'].forEach(k => { if(DB.settings[k] !== undefined) document.getElementById(k).value = DB.settings[k]; });
        if(DB.settings.defaultFuel) document.getElementById('fuelSelect').value = DB.settings.defaultFuel; 
        if(DB.settings.defaultFert) document.getElementById('fertSelect').value = DB.settings.defaultFert;
        if(DB.settings.fuelCostEnable) document.getElementById('fuelCostEnable').checked = DB.settings.fuelCostEnable;
        if(DB.settings.fertCostEnable) document.getElementById('fertCostEnable').checked = DB.settings.fertCostEnable;
        if(DB.settings.showMaxCap) document.getElementById('showMaxCap').checked = DB.settings.showMaxCap;
        if(DB.settings.showHeatFert) document.getElementById('showHeatFert').checked = DB.settings.showHeatFert;
        if(DB.settings.showBeltCount) document.getElementById('showBeltCount').checked = DB.settings.showBeltCount;
    }
    updateDefaultButtonState();
}

function populateSelects() {
    const fuelSel = document.getElementById('fuelSelect'); const fertSel = document.getElementById('fertSelect');
    fuelSel.innerHTML = ''; fertSel.innerHTML = '';
    const fuels = []; const ferts = [];
    const allItems = new Set(Object.keys(DB.items || {}));
    if(DB.recipes) DB.recipes.forEach(r => Object.keys(r.outputs).forEach(k => allItems.add(k)));

    allItems.forEach(itemName => {
        const itemDef = DB.items[itemName] || {};
        if(itemDef.heat) fuels.push({ name: itemName, heat: itemDef.heat });
        if(itemDef.nutrientValue) ferts.push({ name: itemName, val: itemDef.nutrientValue });
    });

    fuels.sort((a,b) => b.heat - a.heat).forEach(f => { fuelSel.appendChild(new Option(`${f.name} (${f.heat} P)`, f.name)); });
    ferts.sort((a,b) => b.val - a.val).forEach(f => { fertSel.appendChild(new Option(`${f.name} (${f.val} V)`, f.name)); });
}

function toggleFuel() {
    const btn = document.getElementById('btnSelfFuel'); const chk = document.getElementById('selfFuel');
    chk.checked = !chk.checked;
    if(chk.checked) { btn.innerText = "Self-Fuel: ON"; btn.classList.remove('btn-inactive-red'); btn.classList.add('btn-active-green'); } 
    else { btn.innerText = "Self-Fuel: OFF"; btn.classList.remove('btn-active-green'); btn.classList.add('btn-inactive-red'); }
    calculate();
}

function toggleFert() {
    const btn = document.getElementById('btnSelfFert'); const chk = document.getElementById('selfFert');
    chk.checked = !chk.checked;
    if(chk.checked) { btn.innerText = "Self-Fert: ON"; btn.classList.remove('btn-inactive-red'); btn.classList.add('btn-active-green'); } 
    else { btn.innerText = "Self-Fert: OFF"; btn.classList.remove('btn-active-green'); btn.classList.add('btn-inactive-red'); }
    calculate();
}

function setDefaultFuel(e) { const c = document.getElementById('fuelSelect').value; DB.settings.defaultFuel = c; persist(); updateDefaultButtonState(); flashButton(e.currentTarget); }
function setDefaultFert(e) { const c = document.getElementById('fertSelect').value; DB.settings.defaultFert = c; persist(); updateDefaultButtonState(); flashButton(e.currentTarget); }

function onLogisticsChange() {
    const fItem = document.getElementById('fuelSelect').value;
    const tItem = document.getElementById('fertSelect').value;
    DB.settings.fuelCostEnable = document.getElementById('fuelCostEnable').checked;
    DB.settings.fertCostEnable = document.getElementById('fertCostEnable').checked;
    DB.settings.customCosts[fItem] = parseFloat(document.getElementById('fuelCostInput').value) || 0;
    DB.settings.customCosts[tItem] = parseFloat(document.getElementById('fertCostInput').value) || 0;
    DB.settings.showMaxCap = document.getElementById('showMaxCap').checked;
    DB.settings.showHeatFert = document.getElementById('showHeatFert').checked;    
    DB.settings.showBeltCount = document.getElementById('showBeltCount').checked;
    persist();
    calculate();
}

function updateDefaultButtonState() {
    const curFuel = document.getElementById('fuelSelect').value; const defFuel = DB.settings.defaultFuel;
    const btnFuel = document.getElementById('btnDefFuel');
    if(curFuel === defFuel) { btnFuel.disabled = true; btnFuel.textContent = t("Current Default"); } else { btnFuel.disabled = false; btnFuel.textContent = t("Make Default"); }

    const curFert = document.getElementById('fertSelect').value; const defFert = DB.settings.defaultFert;
    const btnFert = document.getElementById('btnDefFert');
    if(curFert === defFert) { btnFert.disabled = true; btnFert.textContent = t("Current Default"); } else { btnFert.disabled = false; btnFert.textContent = t("Make Default"); }
    
    document.getElementById('fuelCostInput').value = DB.settings.customCosts[curFuel] || 0;
    document.getElementById('fertCostInput').value = DB.settings.customCosts[curFert] || 0;        
}

function saveSettings(e) { ['lvlBelt','lvlSpeed','lvlAlchemy','lvlFuel','lvlFert'].forEach(k => { DB.settings[k] = parseInt(document.getElementById(k).value) || 0; }); persist(); flashButton(e.currentTarget); }

function resetRecips() {
    if(confirm(t('Reset Recipes', 'ui') + "?")) {
        console.log("Reset Recipes");
        const localSourceData = localStorage.getItem(SOURCE_KEY);
        localStorage.removeItem(SOURCE_KEY);
        if (localSourceData) localStorage.setItem(BACKUP_KEY, localSourceData);
        location.reload();
    } 
}

function resetTranslations() {
    if(confirm(t('Reset Translations', 'ui') + "?")) {
        console.log("Reset Translations");
        const localSourceI18NData = localStorage.getItem(I18N_DATA_KEY);
        localStorage.removeItem(I18N_DATA_KEY);
        if (localSourceI18NData) localStorage.setItem(I18N_BACKUP_KEY, localSourceI18NData);
        location.reload();
    } 
}

function resetAllData() {
    if(confirm(t('Reset All Database?', 'ui'))) {
        console.log("Reset All Database");
        const localSourceData = localStorage.getItem(SOURCE_KEY);
        const localSourceI18NData = localStorage.getItem(I18N_DATA_KEY);
        const localSettingsData = localStorage.getItem(SETTINGS_KEY);
        localStorage.clear();
        if (localSourceData) localStorage.setItem(BACKUP_KEY, localSourceData);
        if (localSourceI18NData) localStorage.setItem(I18N_BACKUP_KEY, localSourceI18NData);
        if (localSettingsData) localStorage.setItem(SETTINGS_BACKUP_KEY, localSettingsData);
        location.reload();
    } 
}

function toggleControlMode(shouldCalculate = false) {
    const isMachineMode = document.getElementById('machineModeToggle').checked;    
    const rateInputs = document.querySelectorAll('.rate-ctrl, #targetRate');
    const machineInputs = document.querySelectorAll('.machine-ctrl, #targetMachine');
    rateInputs.forEach(el => el.disabled = isMachineMode);
    machineInputs.forEach(el => el.disabled = !isMachineMode);
    document.getElementById('group-rate').style.opacity = isMachineMode ? "0.5" : "1";
    document.getElementById('group-machine').style.opacity = isMachineMode ? "1" : "0.5";
    if (shouldCalculate) calculate();
}

function adjustMachine(delta) {
    const el = document.getElementById('targetMachine');
    if (el.disabled) return;
    let val = parseFloat(el.value) || 0;
    el.value = Math.max(0, (Math.round((val + delta) * 10) / 10)).toFixed(1);
    calculate();
}

function adjustRate(delta) { 
    const el = document.getElementById('targetRate'); 
    if(el.disabled) return; 
    let val = parseFloat(el.value) || 0; 
    el.value = (Math.round((val + delta) * 10) / 10).toFixed(1); 
    calculate(); 
}

function adjustInput(id, delta) { const el = document.getElementById(id); let val = parseInt(el.value) || 0; el.value = Math.max(0, val + delta); }


/* ==========================================================================
   SECTION: MODAL LOGIC
   ========================================================================== */

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

/**
 * Opens the item picker modal and populates it with categorized items.
 */
function openItemPicker() {
    document.getElementById('ui-picker-title').innerText = t('Select Item', 'ui');
    renderCategoryBar();
    renderItemPicker();
    document.getElementById('picker-modal').style.display = 'flex';
}

// 渲染頂部的分類按鈕
function renderCategoryBar() {
    const bar = document.getElementById('picker-category-bar');
    bar.innerHTML = '';
    
    // 獲取所有存在的分類
    const categories = new Set(["[All]"]);
    Object.values(DB.items).forEach(item => {
        if (item.category) categories.add(item.category);
    });

    Array.from(categories).forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `category-btn ${currentPickerCategory === cat ? 'active' : ''}`;
        btn.innerText = t(cat, 'categories');
        btn.onclick = () => {
            currentPickerCategory = cat;
            renderCategoryBar(); // 刷新按鈕狀態
            renderItemPicker();  // 刷新列表
        };
        bar.appendChild(btn);
    });
}

// 渲染物品列表
function renderItemPicker() {    
    const grid = document.getElementById('picker-items-grid');
    const filterText = document.getElementById('itemPickerSearch').value.toLowerCase();
    grid.innerHTML = '';

    // 將 DB.items 轉換為數組以保持順序（或按 ID 排序）
    const itemsToShow = Object.entries(DB.items).filter(([name, data]) => {
        const matchesCategory = (data.category === currentPickerCategory
            || currentPickerCategory === "[All]"
            || currentPickerCategory === t('Fuel') && data.heat > 0
            || currentPickerCategory === t('Fertilizer') && data.nutrientValue > 0
        );
        const matchesSearch = name.toLowerCase().includes(filterText);
        return matchesCategory && matchesSearch;
    });

    const showCauldronCost = (document.getElementById('view-cauldron')?.classList.contains('active') || document.getElementById('cauldron-recipe-modal')?.style.display === 'flex') ?? false;
    const isGeneralCatagory = currentPickerCategory === "[All]";
    itemsToShow.forEach(([name, data]) => {
        const card = document.createElement('div');
        card.className = 'picker-item-row';

        card.innerHTML = `
            <img src="img/item${data.id ?? 0}.png" loading="lazy">
            <span class="picker-item-name">${name}</span>            
        `;

        if (showCauldronCost && data.cauldronCost) {
            card.innerHTML += `<span class="cand-cost" >${Number(data.cauldronCost.toFixed(2))}</span>`;
        }
        else if (isGeneralCatagory) {
            // 根據分類獲取標籤顏色類名
            const tagClass = `tag-${data.category ? data.category.replace(/\s+/g, '') : 'Other'}`;
            const translatedCat = t(data.category || "Other", 'categories');
            card.innerHTML += `<span class="picker-item-tag ${tagClass}">${translatedCat}</span>`;
        }

        card.onclick = () => {
            selectItem(name);
            closeModal('picker-modal');
        };

        grid.appendChild(card);
    });
}

const ATHANOR_CATALYSTS = [
    { id: 'unstable', label: '🧪 Unstable' },
    { id: 'fertile',  label: '🌿 Fertile'  },
    { id: 'resonant', label: '✨ Resonant' },
    { id: 'eternal',  label: '♾️ Eternal'  },
];

function toggleCatalyst(recipeId, catalystId, item, btn) {
    if (!DB.settings.recipeModifiers[recipeId]) DB.settings.recipeModifiers[recipeId] = { catalysts: [] };
    const cats = DB.settings.recipeModifiers[recipeId].catalysts;
    const idx = cats.indexOf(catalystId);
    if (idx >= 0) { cats.splice(idx, 1); btn.classList.remove('active'); }
    else           { cats.push(catalystId); btn.classList.add('active'); }
    if (cats.length === 0) delete DB.settings.recipeModifiers[recipeId];
    persist();
    calculate();
    openRecipeModal(item);
}

function openRecipeModal(item) {
    const candidates = getRecipesFor(item);
    const list = document.getElementById('recipe-list');
    list.innerHTML = '';
    document.getElementById('recipe-modal-title').innerText = t('Select Recipe for ') + item;

    // 煉金鍋按鈕（若 item 有 cauldronTarget）
    const titleEl = document.getElementById('recipe-modal-title');
    const itemDef = DB.items[item];
    // 清除舊按鈕（避免重複添加）
    titleEl.querySelectorAll('.cauldron-shortcut-btn').forEach(b => b.remove());
    if (itemDef && itemDef.cauldronTarget !== undefined) {
        const btn = document.createElement('button');
        btn.className = 'cauldron-shortcut-btn swap-btn';
        btn.style.cssText = 'margin-left:8px; width:auto; padding:2px 6px; border-radius:4px; font-size:0.8em;';
        btn.innerText = t('+ Add Cauldron Recipe');
        btn.onclick = (e) => { e.stopPropagation(); openCauldronRecipeModal(item); };
        titleEl.appendChild(btn);
    }

    const currentId = (getActiveRecipe(item) || {}).id;
    
    candidates.forEach(r => {
        const div = document.createElement('div');
        div.className = `recipe-option ${r.id === currentId ? 'active' : ''}`;        

        let recipeInputs = r.inputs;
        let recipeOutputs = r.outputs;

        const cats = DB.settings.recipeModifiers[r.id]?.catalysts;
        if (cats && cats.length > 0) {
            recipeInputs = {...r.inputs};
            recipeOutputs = {...r.outputs};
            if (cats.includes('eternal')) {
                recipeInputs = {};
                const [itemKey, itemValue] = Object.entries(DB.items).find(([name, item]) => item.charges === 99999);
                recipeInputs[itemKey] = r.ChargeCost / 99999;
            }
            if (cats.includes('unstable')) {
                recipeOutputs = { ...r.unstableOutputs };
                const [itemKey, itemValue] = Object.entries(DB.items).find(([name, item]) => item.charges === 180);
                recipeInputs[itemKey] = r.ChargeCost / 180;
            }
            if (cats.includes('resonant')) {
                recipeOutputs = { ...r.resonantOutputs };
                const [itemKey, itemValue] = Object.entries(DB.items).find(([name, item]) => item.charges === 1500);
                recipeInputs[itemKey] = r.ChargeCost / 1500;
            }
            if (cats.includes('fertile')) {                
                for (const k in recipeOutputs) recipeOutputs[k] *= 2;
                const [itemKey, itemValue] = Object.entries(DB.items).find(([name, item]) => item.charges === 240);
                recipeInputs[itemKey] = r.ChargeCost / 240;
            }
        }

        let inputs = []; Object.keys(recipeInputs).forEach(key => { inputs.push(`${Number(recipeInputs[key].toFixed(4))}x ${key}<img src="img/item${DB.items[key]?.id ?? 0}.png" width="18" height="18">`); });
        let outputs = []; Object.keys(recipeOutputs).forEach(key => { outputs.push(`${Number(recipeOutputs[key].toFixed(4))}x ${key}<img src="img/item${DB.items[key]?.id ?? 0}.png" width="18" height="18">`); });
        let content = `
            <div class="recipe-header"><span><strong>${t(r.machine, 'machines')}</strong> <span style="font-size:0.9em; opacity:0.8;">( ${r.baseTime} s )</span></span>${r.id === currentId ? '✅' : ''}</div>
            <div class="recipe-details">${t('Input')}: ${inputs.join(', ')}<br>${t('Yields')}: ${outputs.join(', ')}</div>
        `;

        div.onclick = (e) => {
            if (e.target.closest('.catalyst-row')) return;
            DB.settings.preferredRecipes[item] = r.id; persist(); closeModal('recipe-modal'); calculate();
        };

        if (r.machine === 'Advanced Athanor') {
            const activeCats = DB.settings.recipeModifiers[r.id]?.catalysts || [];
            const btns = ATHANOR_CATALYSTS.map(c => {
                const isActive = activeCats.includes(c.id);
                return `<button class="catalyst-btn${isActive ? ' active' : ''}" onclick="toggleCatalyst('${r.id}', '${c.id}', '${item}', this)">${t(c.label)}</button>`;
            }).join('');
            content += `<div class="catalyst-row">${t('Catalysts')} ${btns}</div>`;
        }

        div.innerHTML = content;
        list.appendChild(div);
    });
    document.getElementById('recipe-modal').style.display = 'flex';
}

function openDrillDown(item, rate) {
    const url = `index.html?item=${encodeURIComponent(item)}&rate=${rate.toFixed(2)}`;
    window.open(url, '_blank');
}

/* ==========================================================================
   SECTION: Translation & URL
   ========================================================================== */
function translateText() {
    const selectors = [
        'h1', '.panel h3', '.section-header',
        '.input-group label', '.checkbox-row label', '.checkbox-row span', '.stat-label',
        '.tab-btn', '.split-btn', '.save-btn', '.reset-btn', '.info'
    ].join(',');

    document.querySelectorAll(selectors).forEach(el => {
        const key = el.textContent.trim();
        el.textContent = t(key, 'ui');
    });

    const input = document.getElementById('targetItemInput');
    if (input) input.placeholder = t("Select or Type...", "ui");
    document.title = t("Alchemy Factory Calculator", "ui");
    document.getElementById('ui-mode-label').innerText = t("MULTI", "ui");
}

function toggleLanguage() {
    if (window.ALCHEMY_I18N.enabled === undefined) window.ALCHEMY_I18N.enabled = true;
    window.ALCHEMY_I18N.enabled = !window.ALCHEMY_I18N.enabled;
    const url = new URL(window.location.href);
    if (!window.ALCHEMY_I18N.enabled) url.searchParams.set('lang', 'en');
    else url.searchParams.delete('lang');    
    window.location.href = url.toString();
}

function updateURL(tabName = '') {
    const isEn = window.ALCHEMY_I18N.enabled === false;
    const item = document.getElementById('targetItemInput').value;
    const rate = document.getElementById('targetRate').value;
    //const fuel = document.getElementById('fuelSelect').value;
    //const fert = document.getElementById('fertSelect').value;
    
    const params = new URLSearchParams();
    if (isEn) params.set('lang', 'en');
    if (tabName === 'cauldron') {
        params.set('tab', 'cauldron');        
    }
    else if (item && rate) {
        params.set('item', item);
        params.set('rate', Number(rate));
        //if (fuel) params.set('fuel', fuel);
        //if (fert) params.set('fert', fert);
    }

    const newUrl = window.location.pathname + '?' + params.toString();
    if (isHandlingPopstate || item == lastUrlItem) {        
        window.history.replaceState(null, '', newUrl);
    }
    else {
        window.history.pushState(null, '', newUrl);
        lastUrlItem = item;
    }
}

window.addEventListener('popstate', function(event) {
    isHandlingPopstate = true;
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('item')) {
        document.getElementById('targetItemInput').value = urlParams.get('item');
        if (urlParams.has('rate')) document.getElementById('targetRate').value = urlParams.get('rate');
        if (urlParams.has('fuel')) document.getElementById('fuelSelect').value = urlParams.get('fuel');
        if (urlParams.has('fert')) document.getElementById('fertSelect').value = urlParams.get('fert');
        calculate(); 
    }
    isHandlingPopstate = false;
});

window.onload = init;