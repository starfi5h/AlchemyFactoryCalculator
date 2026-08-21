// alchemy_main.js: Application entry point, initialization, URL state, module coordination

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
    if(!DB.settings.expandCatalystInputs) DB.settings.expandCatalystInputs = { unstable: false, fertile: false, resonant: false, eternal: false };

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
    } else if (!DB.settings.targetItem) {
        // 沒有指定 rate、也沒有已儲存設定時，默認啟用 "Set by Machine Count" 模式，machine count = 1
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
            DB.settings.lvlSell = upgrades[6];
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
    
    if (urlTab) switchTab(urlTab, false);

    document.getElementById('db-gameversion-text').innerText = t("Game version : ") + DB.gameVersion ?? 0;
}

function loadSettingsToUI() {
    if (DB.settings) {
        ['lvlBelt','lvlSpeed','lvlAlchemy','lvlFuel','lvlFert', 'lvlSell'].forEach(k => { if(DB.settings[k] !== undefined) document.getElementById(k).value = DB.settings[k]; });
        if(DB.settings.defaultFuel) document.getElementById('fuelSelect').value = DB.settings.defaultFuel; 
        if(DB.settings.defaultFert) document.getElementById('fertSelect').value = DB.settings.defaultFert;
        const heatingSel = document.getElementById('heatingDeviceSelect');
        if(DB.settings.selectedHeatingDevice) heatingSel.value = DB.settings.selectedHeatingDevice;
        if(!heatingSel.value) {
            heatingSel.value = heatingSel.querySelector('option[value="Stone Furnace"]') ? "Stone Furnace" : (heatingSel.options[0]?.value || "");
            DB.settings.selectedHeatingDevice = heatingSel.value;
        }
        if(DB.settings.nodeSize) {
            document.getElementById('nodeScaleSlider').value = DB.settings.nodeSize;
            setNodeScale(DB.settings.nodeSize);
        }
        if(DB.settings.showMaxCap) document.getElementById('showMaxCap').checked = DB.settings.showMaxCap;
        if(DB.settings.showFuelFert) document.getElementById('showFuelFert').checked = DB.settings.showFuelFert;
        if(DB.settings.showRawMachineCount) document.getElementById('showRawMachineCount').checked = DB.settings.showRawMachineCount;
        if(DB.settings.showHeatFert) document.getElementById('showHeatFert').checked = DB.settings.showHeatFert;
        if(DB.settings.showBeltCount) document.getElementById('showBeltCount').checked = DB.settings.showBeltCount;

        // --- Restore Calculator target/mode state ---
        if (DB.settings.targetItem) {
            document.getElementById('targetItemInput').value = DB.settings.targetItem;
            updateComboIcon();
        }
        if (DB.settings.targetRate !== undefined) {
            document.getElementById('targetRate').value = DB.settings.targetRate;
        }
        if (DB.settings.targetMachineCount !== undefined) {
            document.getElementById('targetMachine').value = DB.settings.targetMachineCount;
        }
        if (DB.settings.machineModeToggle) {
            document.getElementById('machineModeToggle').checked = true;
            toggleControlMode(false); // 套用禁用/啟用對應輸入框的 UI 效果
        }
        if (DB.settings.selfFuel) {
            const btn = document.getElementById('btnSelfFuel');
            btn.classList.remove('btn-inactive-red');
            btn.classList.add('btn-active-green');
        }
        if (DB.settings.selfFert) {
            const btn = document.getElementById('btnSelfFert');
            btn.classList.remove('btn-inactive-red');
            btn.classList.add('btn-active-green');
        }
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

/* ==========================================================================
   SECTION: Update Banner
   ========================================================================== */

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


/* ==========================================================================
   SECTION: Translation
   ========================================================================== */

function translateText() {
    const selectors = [
        'h1', '.panel h3', '.section-header', 
        'label', '.checkbox-row span', '.stat-label', '.scale-row-label',
        '.tab-btn', '.split-btn', '.save-btn', '.reset-btn', '.soild-btn', '.info'
    ].join(',');

    document.querySelectorAll(selectors).forEach(el => {
        const key = el.textContent.trim();
        el.textContent = t(key, 'ui');
    });

    const input = document.getElementById('targetItemInput');
    if (input) input.placeholder = t("Select or Type...", "ui");
    document.title = t("Alchemy Factory Calculator", "ui");
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
        url.searchParams.set('item', queryDualItemName(itemParam));
    }    
    DB.settings.defaultFuel = queryDualItemName(DB.settings.defaultFuel);
    DB.settings.defaultFert = queryDualItemName(DB.settings.defaultFert);
    saveSettings();

    window.location.href = url.toString();
}

/* ==========================================================================
   SECTION: URL
   ========================================================================== */

function switchTab(tabName, updateUrl = true) {
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
    document.getElementById('view-' + tabName).classList.add('active');

    const container = document.getElementById('page-tab-container');
    const tabBtns = container.querySelectorAll('.tab-btn');
    tabBtns.forEach(el => el.classList.remove('active'));
    if (tabBtns[btnIndex]) tabBtns[btnIndex].classList.add('active');

    if (updateUrl) {
        updateURL(tabName);
    }
    if (tabName === 'cauldron' && typeof initCauldron === 'function') {
        initCauldron();
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

function updateURL(tabName = '') {
    const isEn = window.ALCHEMY_I18N.enabled === false;    
    const params = new URLSearchParams();
    if (isEn) params.set('lang', 'en');

    if (tabName !== '' && tabName !== 'calc') {
        params.set('tab', tabName);        
    }

    const newUrl = window.location.pathname + '?' + params.toString();
    if (isHandlingPopstate) {        
        window.history.replaceState(null, '', newUrl);
    }
    else {
        window.history.pushState(null, '', newUrl);
    }
}

window.addEventListener('popstate', function(event) {
    isHandlingPopstate = true;
    const urlParams = new URLSearchParams(window.location.search);

    // 處理 tab（若無 tab 參數則切回預設 calc）
    if (urlParams.has('tab')) {
        switchTab(urlParams.get('tab'), false);
    } else {
        switchTab('calc', false);   // 預設頁籤
    }

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