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
    defaultFuel: "Blast Potion",
    defaultFert: "Fertile Catalyst",
    selectedHeatingDevice: "Stone Furnace",
    fuelCostEnable: true,
    fertCostEnable: true,
    nodeSize: 1,
    showBeltCount: true,
    showFuelFert: true,
    showMaxCap: false,
    showHeatFert: false,
    preferredRecipes: {},
    nodeRecipeOverrides: {},
    recipeModifiers: {},
    activeRecyclers: {},
    customCosts: {}
};

let isSelfFuel = false;
let isSelfFert = false;

// COMBOBOX GLOBALS
let allItemsList = [];
let currentFocus = -1;

// ITEM PICKER GLOBALS
let currentPickerCategory = "[All]";
let currentPickerTier = 0; // 0 = 不篩選
let currentPickerProps = new Set(); // 'sellPrice' | 'wholesalePrice' | 'cauldronTarget'
const PICKER_PROP_DEFS = [
    { key: 'sellPrice',      label: 'Sell Price' },
    { key: 'wholesalePrice', label: 'Wholesale Price' },
    { key: 'cauldronTarget', label: 'Cauldron Target' }
];


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
    if(!DB.settings.nodeRecipeOverrides) DB.settings.nodeRecipeOverrides = {};
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
        case 'planner': btnIndex = 2; break;
        case 'help': btnIndex = 3; break;
        case 'db': btnIndex = 4; break;
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
    if (tabName === 'itemvalue' && typeof initItemValuePage === 'function') {
        initItemValuePage();
    }
    if (tabName === 'help' && typeof initHelpPage === 'function') {
        initHelpPage();
    }
    if (tabName === 'planner' && typeof initPlannerPage === 'function') {
        initPlannerPage();
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
    row.dataset.item = itemName;

    if (rate === 0) {
        const lvlBelt = parseInt(document.getElementById('lvlBelt').value) || 0;
        rate = getBeltSpeed(lvlBelt);
    }

    row.innerHTML = `
        <span class="drag-handle" title="Drag to reorder">⠿</span>
        <div class="mini-picker" onclick="pickMultiTargetRow(this)">
            <img src="img/item${itemDef.id}.png" width="20" height="20">
            <span class="item-name-label">${itemName}</span>
        </div>
        <input type="number" class="multi-rate-input" value="${rate}" oninput="calculate()">
        <button class="swap-btn" onclick="this.parentElement.remove(); calculate();" style="color:var(--danger); border-color:var(--danger);">x</button>
    `;
    
    container.appendChild(row);
    _initDragHandle(row.querySelector('.drag-handle'), row); // ← 新增
}

function _initDragHandle(handle, row) {
    handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);

        const container = document.getElementById('multi-target-list');
        row.classList.add('dragging');

        let targetRow = null;
        let insertBefore = true;

        const onMove = (e) => {
            const siblings = [...container.querySelectorAll('.multi-target-row:not(.dragging)')];
            siblings.forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom'));
            targetRow = null;

            for (const r of siblings) {
                const rect = r.getBoundingClientRect();
                if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    insertBefore = e.clientY < rect.top + rect.height / 2;
                    r.classList.add(insertBefore ? 'drag-over-top' : 'drag-over-bottom');
                    targetRow = r;
                    break;
                }
            }
        };

        const onUp = () => {
            handle.removeEventListener('pointermove', onMove);
            handle.removeEventListener('pointerup', onUp);

            row.classList.remove('dragging');
            container.querySelectorAll('.multi-target-row')
                .forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom'));

            if (targetRow) {
                container.insertBefore(row, insertBefore ? targetRow : targetRow.nextSibling);
                calculate();
            }
        };

        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
    });
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
    if(e?.currentTarget) flashButton(e.currentTarget);
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
 * 快速將多產物清單設為 [selectedFuel, selectedFert] 各一列，
 * 速率各自為「單一機台滿載」速率
 */
function quickSetFuelFertTargets() {
    const fuelItem = document.getElementById('fuelSelect').value;
    const fertItem = document.getElementById('fertSelect').value;
    if (!fuelItem || !fertItem) return;

    // 確保處於多產物模式
    const modeToggle = document.getElementById('modeToggle');
    if (!modeToggle.checked) {
        modeToggle.checked = true;
        toggleCalcMode();
    }

    const container = document.getElementById('multi-target-list');
    container.innerHTML = '';

    const fuelRate = getSingleMachineRate(fuelItem);
    const fertRate = getSingleMachineRate(fertItem);

    addMultiTargetRow(fuelItem, Number((fuelRate || 0).toFixed(2)));
    addMultiTargetRow(fertItem, Number((fertRate || 0).toFixed(2)));

    calculate();
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
        const heatingSel = document.getElementById('heatingDeviceSelect');
        if(DB.settings.selectedHeatingDevice) heatingSel.value = DB.settings.selectedHeatingDevice;
        if(!heatingSel.value) {
            heatingSel.value = heatingSel.querySelector('option[value="Stone Furnace"]') ? "Stone Furnace" : (heatingSel.options[0]?.value || "");
            DB.settings.selectedHeatingDevice = heatingSel.value;
        }
        if(DB.settings.fuelCostEnable) document.getElementById('fuelCostEnable').checked = DB.settings.fuelCostEnable;
        if(DB.settings.fertCostEnable) document.getElementById('fertCostEnable').checked = DB.settings.fertCostEnable;
        if(DB.settings.nodeSize) {
            document.getElementById('nodeScaleSlider').value = DB.settings.nodeSize;
            setNodeScale(DB.settings.nodeSize);
        }
        if(DB.settings.showMaxCap) document.getElementById('showMaxCap').checked = DB.settings.showMaxCap;
        if(DB.settings.showFuelFert) document.getElementById('showFuelFert').checked = DB.settings.showFuelFert;
        if(DB.settings.showHeatFert) document.getElementById('showHeatFert').checked = DB.settings.showHeatFert;
        if(DB.settings.showBeltCount) document.getElementById('showBeltCount').checked = DB.settings.showBeltCount;
    }
}

function populateSelects() {
    const fuelSel = document.getElementById('fuelSelect'); const fertSel = document.getElementById('fertSelect'); const heatingSel = document.getElementById('heatingDeviceSelect');
    fuelSel.innerHTML = ''; fertSel.innerHTML = ''; heatingSel.innerHTML = '';
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
    Object.entries(DB.machines || {})
        .filter(([, machine]) => machine.isGenerator)
        .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
        .forEach(([machineName, machine]) => {
            heatingSel.appendChild(new Option(`${t(machineName, 'machines')} (${machine.slots || 0} ${t('slots')})`, machineName));
        });
    heatingSel.value = DB.settings.selectedHeatingDevice || "Stone Furnace";
    if(!heatingSel.value) heatingSel.value = heatingSel.options[0]?.value || "";
}

function togglePanelCollapse(btn) {
    const body = btn.closest('.panel')?.querySelector('.panel-body');
    if (!body) return;
    const collapsed = body.classList.toggle('collapsed');
    btn.textContent = collapsed ? '▶' : '▼';
}

function toggleFuel() {
    const btn = document.getElementById('btnSelfFuel');
    const enable = btn.innerText === t("Self-Fuel: ON");
    if(!enable) { btn.innerText = t("Self-Fuel: ON"); btn.classList.remove('btn-inactive-red'); btn.classList.add('btn-active-green'); } 
    else { btn.innerText = t("Self-Fuel: OFF"); btn.classList.remove('btn-active-green'); btn.classList.add('btn-inactive-red'); }
    calculate();
}

function toggleFert() {
    const btn = document.getElementById('btnSelfFert');
    const enable = btn.innerText === t("Self-Fert: ON");
    if(!enable) { btn.innerText = t("Self-Fert: ON"); btn.classList.remove('btn-inactive-red'); btn.classList.add('btn-active-green'); } 
    else { btn.innerText = t("Self-Fert: OFF"); btn.classList.remove('btn-active-green'); btn.classList.add('btn-inactive-red'); }
    calculate();
}

function setNodeScale(val) {
    document.documentElement.style.setProperty('--node-scale', val);
    document.getElementById('nodeSizeLabel').innerText = t('UI Size') + ': ' + (val * 100).toFixed(0) + '%';
}

function onLogisticsChange() {
    const curFuel = document.getElementById('fuelSelect').value;
    const curFert = document.getElementById('fertSelect').value;
    const curHeatingDevice = document.getElementById('heatingDeviceSelect').value;

    if (DB.settings.defaultFuel !== curFuel || curFert !== DB.settings.defaultFert) {
        document.getElementById('fuelCostInput').value = DB.settings.customCosts[curFuel] || 0;
        document.getElementById('fertCostInput').value = DB.settings.customCosts[curFert] || 0;
        DB.settings.defaultFuel = curFuel;
        DB.settings.defaultFert = curFert;
    }
    else {
        DB.settings.fuelCostEnable = document.getElementById('fuelCostEnable').checked;
        DB.settings.fertCostEnable = document.getElementById('fertCostEnable').checked;
        DB.settings.customCosts[curFuel] = parseFloat(document.getElementById('fuelCostInput').value) || 0;
        DB.settings.customCosts[curFert] = parseFloat(document.getElementById('fertCostInput').value) || 0;
    }
    DB.settings.nodeSize = document.getElementById('nodeScaleSlider').value;
    DB.settings.showMaxCap = document.getElementById('showMaxCap').checked;
    DB.settings.showFuelFert = document.getElementById('showFuelFert').checked;
    DB.settings.showHeatFert = document.getElementById('showHeatFert').checked;    
    DB.settings.showBeltCount = document.getElementById('showBeltCount').checked;
    DB.settings.selectedHeatingDevice = curHeatingDevice;
    persist();
    calculate();
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
    renderPickerTierRow();
    renderPickerPropsBar();
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

function renderPickerTierRow() {
    const row = document.getElementById('picker-tier-row');
    if (!row) return;
    row.innerHTML = `
        <label style="flex-shrink:0; margin:0;">${t('Tier')}</label>
        <input type="range" id="picker-tier-slider" min="0" max="9" step="1"
               value="${currentPickerTier}" oninput="onPickerTierChange(this.value)">
        <span id="picker-tier-value" style="min-width:20px; text-align:center; color:var(--accent); font-weight:bold;">${currentPickerTier > 0 ? currentPickerTier : '—'}</span>
    `;
}

function onPickerTierChange(val) {
    currentPickerTier = parseInt(val) || 0;
    const valSpan = document.getElementById('picker-tier-value');
    if (valSpan) valSpan.innerText = currentPickerTier > 0 ? currentPickerTier : '—';
    renderItemPicker();
}

function renderPickerPropsBar() {
    const bar = document.getElementById('picker-props-bar');
    if (!bar) return;
    bar.innerHTML = `<label style="flex-shrink:0; margin:0;">${t('Properties')}</label>` +
        PICKER_PROP_DEFS.map(p => {
            const active = currentPickerProps.has(p.key);
            return `<button class="category-btn ${active ? 'active' : ''}" onclick="togglePickerProp('${p.key}')">${t(p.label, 'ui')}</button>`;
        }).join('');
}

function togglePickerProp(key) {
    if (currentPickerProps.has(key)) currentPickerProps.delete(key);
    else currentPickerProps.add(key);
    renderPickerPropsBar();
    renderItemPicker();
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
        const matchesTier = currentPickerTier <= 0 || data.tier === currentPickerTier;
        const matchesProps = [...currentPickerProps].every(key => data[key] != null);
        return matchesCategory && matchesSearch && matchesTier && matchesProps;
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
    openRecipeModal(item, _recipeModalPathKey);
}

let _recipeModalScope = 'global'; // 'global' | 'node'
let _recipeModalPathKey = '';
let _recipeModalItem = '';

function openRecipeModal(item, pathKey = '') {
    _recipeModalItem = item;
    _recipeModalPathKey = pathKey;
    _recipeModalScope = DB.settings.nodeRecipeOverrides[pathKey] ? 'node' : 'global';

    _renderRecipeModalScopeBar();
    _renderRecipeModalList();

    document.getElementById('recipe-modal').style.display = 'flex';
}

function _renderRecipeModalScopeBar() {
    const titleEl = document.getElementById('recipe-modal-title');
    titleEl.innerText = t('Select Recipe for ') + _recipeModalItem;

    // 清除舊的 scope bar / cauldron 按鈕
    document.getElementById('recipe-modal-scope-bar')?.remove();
    titleEl.querySelectorAll('.cauldron-shortcut-btn').forEach(b => b.remove());

    const itemDef = DB.items[_recipeModalItem];
    if (itemDef && itemDef.cauldronTarget !== undefined) {
        const btn = document.createElement('button');
        btn.className = 'cauldron-shortcut-btn swap-btn';
        btn.style.cssText = 'margin-left:8px; width:auto; padding:2px 6px; border-radius:4px; font-size:0.8em;';
        btn.innerText = t('+ Add Cauldron Recipe');
        btn.onclick = (e) => { e.stopPropagation(); openCauldronRecipeModal(_recipeModalItem); };
        titleEl.appendChild(btn);
    }

    // 只有在有 pathKey 時才顯示 scope 開關（無 pathKey = 沒有節點context，只能全局）
    if (!_recipeModalPathKey) return;

    const bar = document.createElement('div');
    bar.id = 'recipe-modal-scope-bar';
    bar.style.cssText = 'display:flex; gap:4px; margin:8px 0;';
    bar.innerHTML = `
        <button class="tab-btn mini-tab ${_recipeModalScope === 'global' ? 'active' : ''}"
            onclick="_setRecipeModalScope('global')">🌐 ${t('Global')}</button>
        <button class="tab-btn mini-tab ${_recipeModalScope === 'node' ? 'active' : ''}"
            onclick="_setRecipeModalScope('node')">📍 ${t('This Node Only')}</button>
    `;
    document.getElementById('recipe-list').insertAdjacentElement('beforebegin', bar);
}

function _setRecipeModalScope(scope) {
    _recipeModalScope = scope;    
    _renderRecipeModalScopeBar();
    _renderRecipeModalList();
    
    const pathKey = _recipeModalPathKey;
    if (pathKey) {
        const item = _recipeModalItem;
        const currentId = (getActiveRecipe(item) || {}).id;
        if (_recipeModalScope === 'node') {
            DB.settings.nodeRecipeOverrides[pathKey] = currentId;
        } else {
            DB.settings.preferredRecipes[item] = currentId;
            delete DB.settings.nodeRecipeOverrides[pathKey];
        }
        persist();
        calculate();
    }
}

function _renderRecipeModalList() {
    const item = _recipeModalItem;
    const pathKey = _recipeModalPathKey;
    const candidates = getRecipesFor(item);
    const list = document.getElementById('recipe-list');
    list.innerHTML = '';

    // 依 scope 決定「目前選中」的判斷依據
    const currentId = (getActiveRecipe(item, pathKey) || {}).id;

    candidates.forEach(r => {
        const div = document.createElement('div');
        div.className = `recipe-option ${r.id === currentId ? 'active' : ''}`;

        // 寫入邏輯依 scope 分流
        const applyRecipe = () => {
            if (pathKey) {
                if (_recipeModalScope === 'node') {
                    DB.settings.nodeRecipeOverrides[pathKey] = r.id;
                } else {
                    DB.settings.preferredRecipes[item] = r.id;
                    delete DB.settings.nodeRecipeOverrides[pathKey];
                }                
                
            }
            persist();
            closeModal('recipe-modal');            
            console.log("pathKey1 = " + pathKey);
            console.log(getActiveRecipe(item, pathKey));
            calculate();
        };

        // 自訂輸入配方 (Paradox Crucible 等)
        if (r.customInputSlot) {
            const mod = DB.settings.recipeModifiers[r.id] || {};
            const selectedItem = mod.customInput;
            const inputDef = selectedItem ? DB.items[selectedItem] : null;
            const previewTime = selectedItem ? AlchemyCalcEngine.computeParadoxTime(DB, selectedItem) : null;
            const isReady = !!selectedItem && previewTime !== null;

            div.classList.toggle('disabled', !isReady);

            const pickerHtml = `
                <span class="mini-picker" style="display:inline-flex;" onclick="event.stopPropagation(); pickCustomRecipeInput('${r.id}', '${item}')">
                    ${inputDef ? `<img src="img/item${inputDef.id ?? 0}.png" width="18" height="18">` : ''}
                    <span>${selectedItem ? selectedItem : t('Select Input Item')}</span>
                </span>`;

            let warnHtml = '';
            if (!selectedItem) {
                warnHtml = `<div class="loop-warning">${t('Please select an input item first.')}</div>`;
            } else if (previewTime === null) {
                warnHtml = `<div class="loop-warning">${t('Selected item is missing baseCost data.')}</div>`;
            }

            div.innerHTML = `
                <div class="recipe-header"><span><strong>${t(r.machine, 'machines')}</strong> <span style="font-size:0.9em; opacity:0.8;">( ${previewTime !== null ? previewTime.toFixed(2) : '—'} s )</span></span>${r.id === currentId ? '✅' : ''}</div>
                <div class="recipe-details">${t('Input')}: ${pickerHtml}<br>${t('Yields')}: 1x <img src="img/item${DB.items[item]?.id ?? 0}.png" width="18" height="18"> ${item}</div>
                ${warnHtml}
            `;

            div.onclick = (e) => {
                if (e.target.closest('.mini-picker')) return;
                if (!isReady) return;
                DB.settings.preferredRecipes[item] = r.id; persist();
                if (typeof notifyPlannerRecipeChanged === 'function') notifyPlannerRecipeChanged();
                closeModal('recipe-modal'); calculate();
            };

            list.appendChild(div);
            return;
        }

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
            DB.settings.preferredRecipes[item] = r.id; persist();
            if (typeof notifyPlannerRecipeChanged === 'function') notifyPlannerRecipeChanged();
            closeModal('recipe-modal'); calculate();
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

/**
 * 開啟 Item Picker 讓玩家為「自訂輸入配方」選擇 input 物品
 * @param {string} recipeId  例如 "Oblivion Essence (Custom)"
 * @param {string} forItem   該配方所屬的產出物品，用於選完後重繪 recipe modal
 */
function pickCustomRecipeInput(recipeId, forItem) {
    const originalSelectItem = window.selectItem;
    window.selectItem = (name) => {
        if (!DB.settings.recipeModifiers[recipeId]) DB.settings.recipeModifiers[recipeId] = {};
        DB.settings.recipeModifiers[recipeId].customInput = name;
        persist();
        if (typeof notifyPlannerRecipeChanged === 'function') notifyPlannerRecipeChanged();

        window.selectItem = originalSelectItem;
        closeModal('picker-modal');
        calculate();
        openRecipeModal(forItem); // 重新渲染 recipe modal 顯示新選擇
    };
    openItemPicker();
}

function openDrillDown(item, rate) {
    const url = `index.html?item=${encodeURIComponent(item)}&rate=${rate.toFixed(2)}`;
    window.open(url, '_blank');
}

function openCustomCostModal(focusItem = null) {
    if (!DB.settings.customCosts) DB.settings.customCosts = {};
    document.getElementById('custom-cost-modal-title').innerText = '⚙ ' + t('Manage Custom Costs', 'ui');
    renderCustomCostList(focusItem);
    document.getElementById('custom-cost-modal').style.display = 'flex';
}

function renderCustomCostList(focusItem = null) {
    const container = document.getElementById('custom-cost-list');
    const costs = DB.settings.customCosts || {};
    const entries = Object.keys(costs);

    if (entries.length === 0) {
        container.innerHTML = `<div style="color:#666; padding:10px; font-size:0.85em; text-align:center;">${t('No custom costs set.', 'ui')}</div>`;
        return;
    }

    const lvlFuel = parseInt(document.getElementById('lvlFuel')?.value) || 0;
    const lvlFert = parseInt(document.getElementById('lvlFert')?.value) || 0;

    container.innerHTML = entries.map(name => {
        const itemDef = DB.items[name] || {};
        const cost = costs[name] || 0;

        // 燃料/肥料比例文字，顯示在 item-name-label 右側
        let ratioText = '';
        if (itemDef.nutrientValue) {
            const perCost = cost > 0 ? (itemDef.nutrientValue * (1 + lvlFert * 0.10) / cost) : 0;
            ratioText = `<span class="details" style="color:var(--bio); white-space:nowrap; font-size:0.8em;">${perCost.toFixed(2)} V/${t('Coin')}</span>`;
        }
        else if (itemDef.heat) {
            const perCost = cost > 0 ? (itemDef.heat * (1 + lvlFuel * 0.10) / cost) : 0;
            ratioText = `<span class="details" style="color:var(--fuel); white-space:nowrap; font-size:0.8em;">${perCost.toFixed(2)} P/${t('Coin')}</span>`;
        }

        // details 區域一律顯示硬幣格式
        const coinDisplay = `<span class="details" style="text-align:right;">${formatCoinIcons(cost)}</span>`;

        const highlight = name === focusItem ? 'border-color:var(--accent); background:#2e3d30;' : '';
        return `
        <div class="multi-target-row" style="${highlight}">
            <img src="img/item${itemDef.id ?? 0}.png" width="20" height="20">
            <span class="item-name-label" style="flex:1; display:flex; gap:10px;">
                <span>${name}</span>
                ${ratioText}
            </span>
            ${coinDisplay}
            <input type="number" class="small-num-input" style="width:120px;" value="${cost}"
                   onchange="updateCustomCostValue('${name}', this.value)">
            <button class="swap-btn" onclick="removeCustomCostRow('${name}')" style="color:var(--danger); border-color:var(--danger);">x</button>
        </div>`;
    }).join('');
}

function updateCustomCostValue(item, val) {
    DB.settings.customCosts[item] = parseFloat(val) || 0;
    persist();
    // 與舊的 fuel/fert 輸入框同步
    if (item === document.getElementById('fuelSelect')?.value) {
        document.getElementById('fuelCostInput').value = DB.settings.customCosts[item];
    }
    if (item === document.getElementById('fertSelect')?.value) {
        document.getElementById('fertCostInput').value = DB.settings.customCosts[item];
    }
    renderCustomCostList();
}

function removeCustomCostRow(item) {
    delete DB.settings.customCosts[item];
    persist();
    renderCustomCostList();
    calculate();
}

function addCustomCostRow() {
    const originalSelectItem = window.selectItem;
    window.selectItem = (name) => {
        window.selectItem = originalSelectItem;
        closeModal('picker-modal');
        if (DB.settings.customCosts[name] === undefined) DB.settings.customCosts[name] = 0;
        persist();
        openCustomCostModal(name);
    };
    openItemPicker();
}


/* ==========================================================================
   SECTION: Translation & URL
   ========================================================================== */
function translateText() {
    const selectors = [
        'h1', '.panel h3', '.section-header',
        '.input-group label', '.checkbox-row label', '.checkbox-row span', '.stat-label', '.scale-row-label',
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

    // --- translate the 'item' param to match the new language ---
    const itemParam = url.searchParams.get('item');
    if (itemParam) {
        const i18n = window.ALCHEMY_I18N;
        const goingToEnglish = i18n.enabled === false; // state AFTER the toggle above
        let translated = itemParam;

        if (i18n.items) {
            if (goingToEnglish) {
                // itemParam is currently Chinese -> find matching English key
                const found = Object.entries(i18n.items).find(([, zh]) => zh === itemParam);
                if (found) translated = found[0];
            } else {
                // itemParam is currently English -> look up Chinese value
                translated = i18n.items[itemParam] || itemParam;
            }
        }
        url.searchParams.set('item', translated);
    }
    
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
    if (tabName !== '' && tabName !== 'calc') {
        params.set('tab', tabName);        
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
