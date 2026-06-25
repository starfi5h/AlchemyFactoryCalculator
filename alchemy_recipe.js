/* ==========================================================================
   ALCHEMY RECIPE EXPLORER  –  Complete Rewrite
   ========================================================================== */

// ---------------------------------------------------------------------------
// STATE
// ---------------------------------------------------------------------------
const RECIPE_STATE = {
    mode: 'batch',          // 'batch' | 'min'
    showRaw: false,         // toggle: show gold/heat/nutr as item-count instead of cc-units
    sortKey: 'net_diff',
    sortDir: -1,
    filterMachines: new Set(),   // empty = show all; populated = show only these
    searchText: '',

    // Conversion parameters (cauldron-cost units)
    hpc: 20,   // heat points per 1 cc (how much heat 1 cc of fuel buys)
    npc: 20,   // nutrient value per 1 cc (how much V 1 cc of fert buys)
    gpc: 1,    // gold coins per 1 cc (portal buy-price conversion)

    visibleColumns: new Set([
        'id', 'name', 'flow', 'time', 'type',
        'gold', 'heat', 'nutr',
        'alc_diff', 'alc_roi',
        'net_diff', 'net_roi'
    ]),

    // Internal cache
    _cachedParams: null,
    _cachedEntries: [],
};

// ---------------------------------------------------------------------------
// COLUMN DEFINITIONS
// ---------------------------------------------------------------------------
const RCP_COLUMNS = {
    id:       { label: '#',        sortable: true  },
    name:     { label: 'Product',  sortable: true  },
    flow:     { label: 'Flow',     sortable: false },
    time:     { label: 'Time',     sortable: true  },
    type:     { label: 'Type',     sortable: true  },
    gold:     { label: 'Gold',     sortable: true  },
    heat:     { label: 'Heat',     sortable: true  },
    nutr:     { label: 'Nutr',     sortable: true  },
    alc_diff: { label: 'Alc Δ',   sortable: true  },
    alc_roi:  { label: 'Alc ROI', sortable: true  },
    net_diff: { label: 'Net Δ',   sortable: true  },
    net_roi:  { label: 'Net ROI', sortable: true  },
};

// Machine groups for the chip filter row
const MACHINE_GROUPS = [
    { label: 'Grinders',    machines: ['Grinder', 'Enhanced Grinder'] },
    { label: 'Crushers',    machines: ['Stone Crusher'] },
    { label: 'Processors',  machines: ['Processor', 'Arcane Processor'] },
    { label: 'Assemblers',  machines: ['Assembler', 'Advanced Assembler'] },
    { label: 'Blenders',    machines: ['Blender', 'Advanced Blender'] },
    { label: 'Crucibles',   machines: ['Crucible', 'Stackable Crucible', 'Paradox Crucible'] },
    { label: 'Athanors',    machines: ['Athanor', 'Advanced Athanor'] },
    { label: 'Alembics',    machines: ['Alembic', 'Advanced Alembic'] },
    { label: 'Kilns',       machines: ['Kiln'] },
    { label: 'Extractors',  machines: ['Extractor', 'Thermal Extractor'] },
    { label: 'Refiners',    machines: ['Refiner'] },
    { label: 'Shapers',     machines: ['Shaper', 'Advanced Shaper', 'Arcane Shaper'] },
    { label: 'Smelters',    machines: ['Iron Smelter'] },
    { label: 'Cauldrons',   machines: ['Cauldron', 'Advanced Cauldron'] },
    { label: 'Nurseries',   machines: ['Nursery', 'World Tree Nursery'] },
    { label: 'Portals',     machines: ['Purchasing Portal'] },
    { label: 'Bank',        machines: ['Bank Portal'] },
];

// ---------------------------------------------------------------------------
// INIT (called by switchTab in alchemy_ui.js)
// ---------------------------------------------------------------------------
function initRecipePage() {
    populateRecipeFuelFert();
    buildMachineChips();
    buildColumnSelector();
    invalidateRecipeCache();
    renderRecipeTable();

    // Close col panel on outside click
    document.addEventListener('click', _closeColPanelOnOutside, { capture: true });
}

// Populate fuel/fert selects from same data as main calculator
function populateRecipeFuelFert() {
    const fuelSel = document.getElementById('rcp-fuel-select');
    const fertSel = document.getElementById('rcp-fert-select');
    if (!fuelSel || !fertSel) return;

    const fuels = [], ferts = [];
    Object.entries(DB.items).forEach(([name, item]) => {
        if (item.heat)          fuels.push({ name, heat: item.heat });
        if (item.nutrientValue) ferts.push({ name, val: item.nutrientValue });
    });
    fuels.sort((a, b) => b.heat - a.heat);
    ferts.sort((a, b) => b.val - a.val);

    fuelSel.innerHTML = fuels.map(f => `<option value="${f.name}">${f.name} (${f.heat} P)</option>`).join('');
    fertSel.innerHTML = ferts.map(f => `<option value="${f.name}">${f.name} (${f.val} V)</option>`).join('');

    // Default to settings values
    const defFuel = DB.settings?.defaultFuel || 'Plank';
    const defFert = DB.settings?.defaultFert || 'Basic Fertilizer';
    if (fuelSel.querySelector(`option[value="${defFuel}"]`)) fuelSel.value = defFuel;
    if (fertSel.querySelector(`option[value="${defFert}"]`)) fertSel.value = defFert;
}

function buildMachineChips() {
    const bar = document.getElementById('rcp-machine-chips');
    if (!bar) return;
    bar.innerHTML = '';

    MACHINE_GROUPS.forEach(group => {
        const btn = document.createElement('button');
        btn.className = 'rcp-chip';
        btn.dataset.machines = JSON.stringify(group.machines);
        btn.textContent = group.label;
        btn.onclick = () => toggleMachineChip(btn, group.machines);
        bar.appendChild(btn);
    });
}

function buildColumnSelector() {
    const panel = document.getElementById('rcp-col-panel');
    if (!panel) return;
    panel.innerHTML = '';
    Object.entries(RCP_COLUMNS).forEach(([key, def]) => {
        const label = document.createElement('label');
        label.className = 'rcp-col-row';
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = RECIPE_STATE.visibleColumns.has(key);
        chk.onchange = () => {
            if (chk.checked) RECIPE_STATE.visibleColumns.add(key);
            else RECIPE_STATE.visibleColumns.delete(key);
            renderRecipeTable();
        };
        label.appendChild(chk);
        label.appendChild(document.createTextNode(' ' + t(def.label, 'ui')));
        panel.appendChild(label);
    });
}

// ---------------------------------------------------------------------------
// EVENT HANDLERS
// ---------------------------------------------------------------------------
function setRecipeMode2(m) {
    RECIPE_STATE.mode = m;
    document.getElementById('rcp-mode-batch').classList.toggle('active', m === 'batch');
    document.getElementById('rcp-mode-min').classList.toggle('active', m === 'min');
    invalidateRecipeCache();
    renderRecipeTable();
}

function onRecipeSearch() {
    RECIPE_STATE.searchText = (document.getElementById('rcp-search')?.value || '').toLowerCase();
    renderRecipeTable(); // search/filter only; no recalc needed
}

function onRecipeRawToggle() {
    RECIPE_STATE.showRaw = document.getElementById('rcp-raw-toggle')?.checked || false;
    renderRecipeTable();
}

function onRecipeParamChange() {
    invalidateRecipeCache();
    renderRecipeTable();
}

function adjustRecipeParam(id, delta) {
    const el = document.getElementById(id);
    if (!el) return;
    const cur = parseFloat(el.value) || 0;
    el.value = Math.max(0.01, Math.round((cur + delta) * 100) / 100);
    invalidateRecipeCache();
    renderRecipeTable();
}

function toggleMachineChip(btn, machines) {
    const active = btn.classList.toggle('active');
    machines.forEach(m => {
        if (active) RECIPE_STATE.filterMachines.add(m);
        else RECIPE_STATE.filterMachines.delete(m);
    });
    renderRecipeTable();
}

function toggleRecipeColPanel(e) {
    e.stopPropagation();
    document.getElementById('rcp-col-panel')?.classList.toggle('show');
}

function _closeColPanelOnOutside(e) {
    const panel = document.getElementById('rcp-col-panel');
    if (!panel) return;
    if (!panel.contains(e.target) && !e.target.closest('.rcp-col-wrap')) {
        panel.classList.remove('show');
    }
}

// ---------------------------------------------------------------------------
// PARAMS SNAPSHOT  –  read current UI state once per rebuild
// ---------------------------------------------------------------------------
function getRecipeParams() {
    const s = DB.settings || {};
    const lvlSpeed    = s.lvlSpeed    || 0;
    const lvlAlchemy  = s.lvlAlchemy  || 0;
    const lvlFuel     = s.lvlFuel     || 0;
    const lvlFert     = s.lvlFert     || 0;
    const selectedFuel = document.getElementById('rcp-fuel-select')?.value || s.defaultFuel || 'Plank';
    const selectedFert = document.getElementById('rcp-fert-select')?.value || s.defaultFert || 'Basic Fertilizer';

    const hpc = parseFloat(document.getElementById('rcp-hpc')?.value) || RECIPE_STATE.hpc;
    const npc = parseFloat(document.getElementById('rcp-npc')?.value) || RECIPE_STATE.npc;
    const gpc = parseFloat(document.getElementById('rcp-gpc')?.value) || RECIPE_STATE.gpc;

    const speedMult   = AlchemyCalcEngine.getSpeedMult(lvlSpeed);
    const alchemyMult = AlchemyCalcEngine.getAlchemyMult(lvlAlchemy);
    const fuelMult    = 1 + lvlFuel * 0.10;
    const fertMult    = 1 + lvlFert * 0.10;

    const fuelDef = DB.items[selectedFuel] || {};
    const fertDef = DB.items[selectedFert] || {};
    const grossFuelHeat = (fuelDef.heat || 1) * fuelMult;      // P per fuel item
    const grossFertVal  = (fertDef.nutrientValue || 1) * fertMult; // V per fert item
    const fertSpeed     = fertDef.maxFertility || 12;           // V/s nursery produces

    return {
        lvlSpeed, lvlAlchemy, lvlFuel, lvlFert,
        selectedFuel, selectedFert,
        speedMult, alchemyMult, fuelMult, fertMult,
        grossFuelHeat, grossFertVal, fertSpeed,
        hpc, npc, gpc,
        mode: RECIPE_STATE.mode,
    };
}

// ---------------------------------------------------------------------------
// CACHE INVALIDATION
// ---------------------------------------------------------------------------
function invalidateRecipeCache() {
    RECIPE_STATE._cachedParams = null;
    RECIPE_STATE._cachedEntries = [];
    // Sync state from UI
    RECIPE_STATE.hpc = parseFloat(document.getElementById('rcp-hpc')?.value) || RECIPE_STATE.hpc;
    RECIPE_STATE.npc = parseFloat(document.getElementById('rcp-npc')?.value) || RECIPE_STATE.npc;
    RECIPE_STATE.gpc = parseFloat(document.getElementById('rcp-gpc')?.value) || RECIPE_STATE.gpc;
}

function paramsChanged(p) {
    const c = RECIPE_STATE._cachedParams;
    if (!c) return true;
    return JSON.stringify(p) !== JSON.stringify(c);
}

// ---------------------------------------------------------------------------
// ENTRY BUILDERS
// ---------------------------------------------------------------------------

/**
 * Build entry for a standard recipe.
 */
function buildRecipeEntry(recipe, params) {
    const mainOut = Object.keys(recipe.outputs)[0];
    const batchTime = recipe.baseTime / params.speedMult;
    const multiplier = params.mode === 'min' ? (60 / batchTime) : 1;

    // Output alc-value (apply alchemy multiplier for qualifying machines)
    let alcOut = 0;
    const YIELD_MACHINES = ['Extractor', 'Thermal Extractor', 'Alembic', 'Advanced Alembic'];
    Object.entries(recipe.outputs).forEach(([name, qty]) => {
        let q = qty;
        if (YIELD_MACHINES.includes(recipe.machine) && name === mainOut) {
            q *= params.alchemyMult;
            if (recipe.machine === 'Thermal Extractor') q *= 3;
        }
        alcOut += (DB.items[name]?.cauldronCost || 0) * q;
    });

    // Input alc-value and gold cost
    let alcIn = 0, goldCost = 0;
    Object.entries(recipe.inputs).forEach(([name, qty]) => {
        alcIn     += (DB.items[name]?.cauldronCost || 0) * qty;
        goldCost  += (DB.items[name]?.buyPrice     || 0) * qty;
    });

    // Heat cost per batch (per-slot share of parent furnace included)
    let heatPerBatch = 0;
    const machDef = DB.machines[recipe.machine];
    if (machDef?.heatCost) {
        const parentDef    = DB.machines[machDef.parent];
        const slotsReq     = machDef.slotsRequired || 1;
        const parentSlots  = machDef.parentSlots || parentDef?.slots || 3;
        let activeHeat     = machDef.heatCost * params.speedMult;
        if (machDef.heatCost < 0) activeHeat = (recipe.heatCost ?? 0) * params.speedMult;
        const heatPerSec   = activeHeat + (parentDef?.heatSelf ?? 0) * params.speedMult / (parentSlots / slotsReq);
        heatPerBatch       = heatPerSec * batchTime;
    }

    const alcDiff = alcOut - alcIn;
    // Net Δ deducts all real costs expressed in cc units
    const netDiff = alcDiff
        - goldCost / params.gpc
        - heatPerBatch / params.hpc;

    return {
        id: recipe.id,
        type: 'recipe',
        machine: recipe.machine,
        outputName: mainOut,
        inputs: recipe.inputs,
        outputs: recipe.outputs,
        rawRecipe: recipe,
        stats: {
            time: batchTime,
            gold:     goldCost     * multiplier,
            heat:     heatPerBatch * multiplier,
            nutr:     0,
            alcIn:    alcIn        * multiplier,
            alcOut:   alcOut       * multiplier,
            alcDiff:  alcDiff      * multiplier,
            alcRoi:   alcIn > 0 ? (alcOut / alcIn * 100) : 0,
            netDiff:  netDiff      * multiplier,
            netRoi:   (alcIn + heatPerBatch / params.hpc) > 0
                        ? (alcOut / (alcIn + heatPerBatch / params.hpc) * 100) : 0,
        },
        // Raw resource amounts for "Raw Units" toggle display
        rawCounts: {
            // fuel items consumed (approx: heat / grossFuelHeat)
            fuelItems: heatPerBatch / params.grossFuelHeat * multiplier,
            // fert items: not applicable for normal recipes
            fertItems: 0,
            goldCoins: goldCost * multiplier,
        },
    };
}

/**
 * Build entry for a Nursery recipe (uses nutrientCost, no standard baseTime).
 */
function buildNurseryEntry(recipe, params) {
    const mainOut = Object.keys(recipe.outputs)[0];
    const nutrientCost = recipe.nutrientCost || 0;
    // Time depends on selected fertilizer's maxFertility
    const batchTime = nutrientCost / (params.fertSpeed || 12);
    const multiplier = params.mode === 'min' ? (60 / batchTime) : 1;

    // Fert items consumed per batch = nutrientCost / grossFertVal
    const fertItemsPerBatch = nutrientCost / params.grossFertVal;

    // Output alc-value
    let alcOut = 0;
    Object.entries(recipe.outputs).forEach(([name, qty]) => {
        alcOut += (DB.items[name]?.cauldronCost || 0) * qty;
    });

    // Cost expressed in cc units: nutrientCost / NPC
    const nutCostInCc = nutrientCost / params.npc;
    const alcIn  = nutCostInCc;   // treat nutrient spend as input
    const alcDiff = alcOut - alcIn;
    const netDiff = alcDiff;      // no additional gold or heat for nurseries

    return {
        id: 'nursery_' + recipe.id,
        type: 'nursery',
        machine: recipe.machine,
        outputName: mainOut,
        inputs: {},
        outputs: recipe.outputs,
        rawRecipe: recipe,
        stats: {
            time: batchTime,
            gold:    0,
            heat:    0,
            nutr:    nutrientCost * multiplier,
            alcIn:   alcIn   * multiplier,
            alcOut:  alcOut  * multiplier,
            alcDiff: alcDiff * multiplier,
            alcRoi:  alcIn > 0 ? (alcOut / alcIn * 100) : 0,
            netDiff: netDiff * multiplier,
            netRoi:  alcIn > 0 ? (alcOut / alcIn * 100) : 0,
        },
        rawCounts: {
            fuelItems: 0,
            fertItems: fertItemsPerBatch * multiplier,
            goldCoins: 0,
        },
    };
}

/**
 * Build entry for a Purchasing Portal "virtual recipe".
 */
function buildPortalEntry(itemName, item, params) {
    const buyPrice = item.buyPrice;
    const alcOut   = item.cauldronCost || 0;
    // Cost in cc units
    const goldCostInCc = buyPrice / params.gpc;
    const alcIn  = goldCostInCc;
    const alcDiff = alcOut - alcIn;
    const netDiff = alcDiff; // gold is already the only cost

    return {
        id: 'portal_' + itemName,
        type: 'portal',
        machine: 'Purchasing Portal',
        outputName: itemName,
        inputs: {},
        outputs: { [itemName]: 1 },
        rawRecipe: null,
        stats: {
            time: 1.0,
            gold:    buyPrice,
            heat:    0,
            nutr:    0,
            alcIn:   alcIn,
            alcOut:  alcOut,
            alcDiff: alcDiff,
            alcRoi:  alcIn > 0 ? (alcOut / alcIn * 100) : 0,
            netDiff: netDiff,
            netRoi:  alcIn > 0 ? (alcOut / alcIn * 100) : 0,
        },
        rawCounts: {
            fuelItems: 0,
            fertItems: 0,
            goldCoins: buyPrice,
        },
    };
}

// ---------------------------------------------------------------------------
// BUILD ALL ENTRIES  (cached)
// ---------------------------------------------------------------------------
function buildAllEntries(params) {
    const entries = [];

    // 1. Standard recipes (including Nursery machine type from DB.recipes)
    DB.recipes.forEach(recipe => {
        if (recipe.machine === 'Nursery' || recipe.machine === 'World Tree Nursery') {
            if (recipe.nutrientCost > 0) {
                entries.push(buildNurseryEntry(recipe, params));
            }
        } else {
            entries.push(buildRecipeEntry(recipe, params));
        }
    });

    // 2. Portal virtual entries (items with buyPrice that have no portal recipe already)
    const alreadyPortal = new Set(
        DB.recipes
            .filter(r => r.machine === 'Purchasing Portal')
            .flatMap(r => Object.keys(r.outputs))
    );
    Object.entries(DB.items).forEach(([name, item]) => {
        if (item.buyPrice > 0 && !alreadyPortal.has(name)) {
            entries.push(buildPortalEntry(name, item, params));
        }
    });

    return entries;
}

// ---------------------------------------------------------------------------
// MAIN RENDER
// ---------------------------------------------------------------------------
function renderRecipeTable() {
    const params = getRecipeParams();

    // Rebuild entries only when params change
    if (paramsChanged(params)) {
        RECIPE_STATE._cachedEntries = buildAllEntries(params);
        RECIPE_STATE._cachedParams  = params;
    }

    let entries = RECIPE_STATE._cachedEntries.slice();

    // --- Filter: search text ---
    const q = RECIPE_STATE.searchText;
    if (q) {
        entries = entries.filter(e =>
            e.outputName.toLowerCase().includes(q) ||
            e.machine.toLowerCase().includes(q) ||
            Object.keys(e.outputs).some(n => n.toLowerCase().includes(q))
        );
    }

    // --- Filter: machine chips ---
    if (RECIPE_STATE.filterMachines.size > 0) {
        entries = entries.filter(e => RECIPE_STATE.filterMachines.has(e.machine));
    }

    // --- Sort ---
    const sk = RECIPE_STATE.sortKey;
    const sd = RECIPE_STATE.sortDir;
    entries.sort((a, b) => {
        let va, vb;
        if (sk === 'id')   { va = a.id;         vb = b.id; }
        else if (sk === 'name')  { va = a.outputName; vb = b.outputName; }
        else if (sk === 'type')  { va = a.type;       vb = b.type; }
        else if (sk === 'time')  { va = a.stats.time; vb = b.stats.time; }
        else {
            // map column key to stats key
            const MAP = {
                gold: 'gold', heat: 'heat', nutr: 'nutr',
                alc_diff: 'alcDiff', alc_roi: 'alcRoi',
                net_diff: 'netDiff', net_roi: 'netRoi',
            };
            va = a.stats[MAP[sk]] ?? 0;
            vb = b.stats[MAP[sk]] ?? 0;
        }
        if (va < vb) return -sd;
        if (va > vb) return  sd;
        return 0;
    });

    // --- Render header ---
    renderRecipeHeader();

    // --- Render rows ---
    const tbody = document.getElementById('rcp-tbody');
    tbody.innerHTML = '';
    entries.forEach((entry, idx) => {
        tbody.appendChild(buildRecipeRow(entry, idx + 1, params));
    });
}

// ---------------------------------------------------------------------------
// HEADER RENDERING
// ---------------------------------------------------------------------------
function renderRecipeHeader() {
    const thead = document.getElementById('rcp-thead');
    thead.innerHTML = '';
    Object.entries(RCP_COLUMNS).forEach(([key, def]) => {
        if (!RECIPE_STATE.visibleColumns.has(key)) return;
        const th = document.createElement('th');
        const isSorted = RECIPE_STATE.sortKey === key;
        const arrow = isSorted ? (RECIPE_STATE.sortDir === 1 ? ' 🔼' : ' 🔽') : '';
        th.innerHTML = t(def.label, 'ui') + arrow;
        if (def.sortable) {
            th.style.cursor = 'pointer';
            th.title = 'Sort by ' + def.label;
            th.onclick = () => {
                if (RECIPE_STATE.sortKey === key) RECIPE_STATE.sortDir *= -1;
                else { RECIPE_STATE.sortKey = key; RECIPE_STATE.sortDir = -1; }
                renderRecipeTable();
            };
        }
        thead.appendChild(th);
    });
}

// ---------------------------------------------------------------------------
// ROW RENDERING
// ---------------------------------------------------------------------------
function buildRecipeRow(entry, idx, params) {
    const tr = document.createElement('tr');
    const s  = entry.stats;
    const rc = entry.rawCounts;
    const showRaw = RECIPE_STATE.showRaw;

    Object.keys(RCP_COLUMNS).forEach(key => {
        if (!RECIPE_STATE.visibleColumns.has(key)) return;
        const td = document.createElement('td');

        switch (key) {
            case 'id':
                td.textContent = idx;
                break;

            case 'name':
                td.innerHTML = renderOutputIcons(entry.outputs);
                break;

            case 'flow':
                td.innerHTML = renderFlowCell(entry, showRaw);
                break;

            case 'time':
                td.textContent = formatTime(s.time);
                break;

            case 'type':
                td.innerHTML = renderTypeBadge(entry.type);
                break;

            case 'gold':
                if (s.gold === 0) { td.textContent = '—'; break; }
                if (showRaw) {
                    td.innerHTML = `<span style="color:var(--gold);">${rcpFmt(rc.goldCoins)}<span style="font-size:9px; color:#aaa;"> G</span></span>`;
                } else {
                    td.innerHTML = `<span style="color:var(--gold);">${rcpFmt(s.gold)}</span>`;
                }
                break;

            case 'heat':
                if (s.heat === 0) { td.textContent = '—'; break; }
                if (showRaw) {
                    // Show how many fuel items are consumed
                    const fuelName = params.selectedFuel;
                    td.innerHTML = `<span style="color:var(--fuel);">${rcpFmt(rc.fuelItems)}<span style="font-size:9px; color:#aaa;"> ${fuelName}</span></span>`;
                } else {
                    td.innerHTML = `<span style="color:var(--fuel);">${rcpFmt(s.heat)}<span style="font-size:9px; color:#aaa;"> P</span></span>`;
                }
                break;

            case 'nutr':
                if (s.nutr === 0) { td.textContent = '—'; break; }
                if (showRaw) {
                    const fertName = params.selectedFert;
                    td.innerHTML = `<span style="color:var(--bio);">${rcpFmt(rc.fertItems)}<span style="font-size:9px; color:#aaa;"> ${fertName}</span></span>`;
                } else {
                    td.innerHTML = `<span style="color:var(--bio);">${rcpFmt(s.nutr)}<span style="font-size:9px; color:#aaa;"> V</span></span>`;
                }
                break;

            case 'alc_diff':
                td.innerHTML = colorizeVal(s.alcDiff);
                break;

            case 'alc_roi':
                td.innerHTML = roiSpan(s.alcRoi);
                break;

            case 'net_diff':
                td.innerHTML = colorizeVal(s.netDiff);
                // Title tooltip: show breakdown
                td.title = buildNetTooltip(s, params, entry);
                break;

            case 'net_roi':
                td.innerHTML = roiSpan(s.netRoi);
                break;
        }

        tr.appendChild(td);
    });

    return tr;
}

// ---------------------------------------------------------------------------
// CELL HELPERS
// ---------------------------------------------------------------------------

/** Item icon grid for outputs */
function renderOutputIcons(outputs) {
    return Object.keys(outputs).map(name => {
        const id = DB.items[name]?.id || 0;
        return `<div class="rcp-icon-cell">
            <img src="img/item${id}.png" width="18" height="18" title="${name}">
            <span>${name}</span>
        </div>`;
    }).join('');
}

/** Flow cell: inputs → outputs with icons and quantities */
function renderFlowCell(entry, showRaw) {
    const inputs  = entry.inputs  || {};
    const outputs = entry.outputs || {};

    const renderItems = (obj, color) => Object.entries(obj).map(([name, qty]) => {
        const id = DB.items[name]?.id || 0;
        return `<div class="rcp-flow-item">
            <img src="img/item${id}.png" width="16" height="16" title="${name}">
            <span style="color:${color}; font-size:9px;">${rcpFmt(qty)}</span>
        </div>`;
    }).join('');

    const inHtml  = Object.keys(inputs).length
        ? renderItems(inputs,  '#aaa')
        : '<span style="color:#555; font-size:10px;">—</span>';
    const outHtml = renderItems(outputs, 'var(--accent)');

    return `<div class="rcp-flow-cell">${inHtml}<span class="rcp-flow-arrow">→</span>${outHtml}</div>`;
}

/** Type badge */
function renderTypeBadge(type) {
    const MAP = {
        recipe:  { label: 'Craft',    cls: 'rcp-badge-craft'   },
        nursery: { label: 'Nursery',  cls: 'rcp-badge-nursery' },
        portal:  { label: 'Portal',   cls: 'rcp-badge-portal'  },
    };
    const d = MAP[type] || { label: type, cls: '' };
    return `<span class="rcp-badge ${d.cls}">${d.label}</span>`;
}

/** Colored +/- value */
function colorizeVal(val) {
    if (Math.abs(val) < 0.001) return '<span style="color:#666;">—</span>';
    const color = val > 0 ? 'var(--profit)' : 'var(--danger)';
    const sign  = val > 0 ? '+' : '';
    return `<span style="color:${color}; font-weight:bold;">${sign}${rcpFmt(val)}</span>`;
}

/** ROI % colored */
function roiSpan(roi) {
    if (!isFinite(roi) || roi === 0) return '<span style="color:#666;">—</span>';
    const color = roi >= 100 ? 'var(--profit)' : 'var(--danger)';
    return `<span style="color:${color};">${roi.toFixed(0)}%</span>`;
}

/** Tooltip text for Net Δ column */
function buildNetTooltip(s, params, entry) {
    const lines = [];
    lines.push(`Alc Δ:  ${s.alcDiff >= 0 ? '+' : ''}${s.alcDiff.toFixed(2)} cc`);
    if (s.heat !== 0) lines.push(`Heat cost:  −${(s.heat / params.hpc).toFixed(2)} cc  (${rcpFmt(s.heat)} P ÷ HPC ${params.hpc})`);
    if (s.nutr !== 0) lines.push(`Nutr cost:  −${(s.nutr / params.npc).toFixed(2)} cc  (${rcpFmt(s.nutr)} V ÷ NPC ${params.npc})`);
    if (s.gold !== 0) lines.push(`Gold cost:  −${(s.gold / params.gpc).toFixed(2)} cc  (${rcpFmt(s.gold)} G ÷ GPC ${params.gpc})`);
    lines.push(`─────────────────`);
    lines.push(`Net Δ:  ${s.netDiff >= 0 ? '+' : ''}${s.netDiff.toFixed(2)} cc`);
    return lines.join('\n');
}

/** Format time nicely */
function formatTime(sec) {
    if (sec >= 3600) return (sec / 3600).toFixed(1) + 'h';
    if (sec >= 60)   return (sec / 60).toFixed(1) + 'm';
    return sec.toFixed(1) + 's';
}

/** Format number: compact with k/m suffix */
function rcpFmt(val) {
    if (val === undefined || val === null) return '—';
    const abs = Math.abs(val);
    if (abs === 0) return '0';
    if (abs >= 1_000_000) return (val / 1_000_000).toFixed(2) + 'm';
    if (abs >= 10_000)    return (val / 1_000).toFixed(1) + 'k';
    if (abs >= 100)       return val.toFixed(0);
    if (abs >= 1)         return val.toFixed(1);
    return val.toFixed(2);
}
