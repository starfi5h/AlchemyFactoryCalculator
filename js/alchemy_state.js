/* ==========================================================================
   SECTION: JS - GLOBAL STATE
   ========================================================================== */
let DB = null;
const STORAGE_KEY = "alchemy_factory_save_v1";
const SOURCE_KEY = "alchemy_source_v1";
const BACKUP_KEY = "alchemy_source_backup_v1";
const I18N_DATA_KEY = "alchemy_i18n_source_v1";
const I18N_BACKUP_KEY = "alchemy_i18n_source_backup_v1";
const SETTINGS_KEY = "alchemy_settings_v1";
const SETTINGS_BACKUP_KEY = "alchemy_settings_backup_v1";

/* ==========================================================================
   SECTION: DB.settings FIELD REFERENCE
   ==========================================================================

   preferredRecipes[item] = recipeId
       GLOBAL default: "when producing `item` anywhere with no more specific
       override, use this recipe." Set via Wiki ★ or Recipe Modal "Global" tab.

   nodeRecipeOverrides[pathKey] = recipeId
       CALCULATOR-TAB-ONLY, per tree-node override keyed by pathKey (see
       alchemy_calc_engine.js's pathKey docs). Set via Recipe Modal "This Node
       Only" tab. Falls back to preferredRecipes if absent. Has NO effect on
       the Planner tab (which has its own per-node node.recipeId, an entirely
       separate field on Planner node objects, not this map).

   recipeModifiers[recipeId] = { catalysts: [...] } | { customInput: item }
       GLOBAL, keyed by recipeId (not item name) — stores Advanced Athanor
       catalyst selection or Paradox Crucible custom input, applied via
       applyRecipeModifiers() in alchemy_calc_engine.js. NOTE: Planner nodes
       copy this into their own node.recipeModifiers at creation time and can
       diverge from this global copy afterward — see the recipeModifiers
       cross-reference note in alchemy_planner_calc.js.

   customCosts[item] = number
       User-defined price override. Affects BOTH gold cost calculation
       (in place of buyPrice) AND, when `item` is the selected fuel/fert
       source, the displayed fuel/fert cost-per-min.

   expandCatalystInputs[catalystType] = boolean
       GLOBAL per catalyst-TYPE (unstable/fertile/resonant/eternal), not per
       recipe or per node. Controls whether Advanced Athanor catalyst inputs
       are expanded into their own subtree in the Calculator tab tree, or
       collapsed into an external-input leaf. Toggled via the 🧪 button on
       tree nodes (toggleCatalystExpand).
   ========================================================================== */

const DEFAULT_SETTINGS = {
    lvlBelt: 0,
    lvlSpeed: 0,
    lvlAlchemy: 0,
    lvlFuel: 0,
    lvlFert: 0,
    defaultFuel: "Blast Potion",
    defaultFert: "Fertile Catalyst",
    selectedHeatingDevice: "Stone Furnace",
    nodeSize: 1,
    showBeltCount: true,
    showFuelFert: true,
    showRawMachineCount: false,
    showMaxCap: false,
    showHeatFert: false,
    targetItem: "",
    targetRate: 60,
    targetMachineCount: 1,
    machineModeToggle: true,
    selfFuel: false,
    selfFert: false,
    preferredRecipes: {},
    nodeRecipeOverrides: {
        ">Copper Coin": "Copper Coin",
        ">Silver Coin": "Silver Coin",
        ">Gold Coin": "Gold Coin",                
        ">铜币": "Copper Coin",
        ">银币": "Silver Coin",
        ">金币": "Gold Coin",
    },
    recipeModifiers: {},
    activeRecyclers: {},
    customCosts: {},
    expandCatalystInputs: { unstable: false, fertile: false, resonant: false, eternal: false }
};

/* ==========================================================================
   SECTION: EDITOR & DATA MANAGEMENT
   ========================================================================== */

/** State API - store DB.settings to localStorage */
function persist() { 
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DB.settings));
}

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

function exportData() {
    const txt = document.getElementById('json-editor').value; const blob = new Blob([txt], { type: "text/javascript" });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = "alchemy_db.js"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

/* ==========================================================================
   SECTION: RESET PANEL
   ========================================================================== */

function resetSettings() {
    if(confirm(t('Reset Settings', 'ui') + "?")) {
        console.log("Reset Settings");
        const localSettingsData = localStorage.getItem(SETTINGS_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        if (localSettingsData) localStorage.setItem(SETTINGS_BACKUP_KEY, localSettingsData);
        location.reload();
    } 
}

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
