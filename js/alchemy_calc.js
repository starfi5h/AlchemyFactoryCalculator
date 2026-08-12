/* ==========================================================================
   ALCHEMY CALCULATOR TAB - UI renderer (DOM, modals, tree nodes)
   ========================================================================== */

/* --------------------------------------------------------------------------
   GLOBAL_CALC_STATE is in-memory only (NOT persisted to localStorage) —
   resets on page reload. All three Sets are keyed by pathKey (see
   alchemy_calc_engine.js's pathKey docs), scoped to the Calculator tab's
   current tree:
     activeRecyclers : pathKeys where byproduct recycling is toggled ON
     forcedExternals : pathKeys manually checked as "External Input"
     collapsedNode   : pathKeys (plus synthetic keys like 'ext_fuel',
                       'byp_<item>', 'common_<item>_<machine>') whose subtree
                       is currently collapsed in the UI
   -------------------------------------------------------------------------- */

const GLOBAL_CALC_STATE = {
    activeRecyclers: new Set(),
    forcedExternals: new Set(),
    collapsedNode: new Set(['ext_gold', 'ext_fuel', 'ext_fert'])
};

let _lastCalcResult = null;
let _lastCalcParams = null;

/* ==========================================================================
   SECTION: HELPER MATH FUNCTIONS
   ========================================================================== */
function getBeltSpeed(lvl) { return AlchemyCalcEngine.getBeltSpeed(lvl); }
function getSpeedMult(lvl) { return AlchemyCalcEngine.getSpeedMult(lvl); }
function getAlchemyMult(lvl) { return AlchemyCalcEngine.getAlchemyMult(lvl); }

function getRecipesFor(item) { return AlchemyCalcEngine.getRecipesFor(DB, item); }
function getActiveRecipe(item, pathKey = "") {
    return AlchemyCalcEngine.getActiveRecipe(DB, { preferredRecipes: DB.settings.preferredRecipes, nodeRecipeOverrides: DB.settings.nodeRecipeOverrides, recipeModifiers: DB.settings.recipeModifiers }, item, pathKey);
}
function getRecipeById(recipeId, recipeModifiers) {
    return AlchemyCalcEngine.getRecipeById(DB, recipeModifiers, recipeId);
}

function applyAlchemyMult(machineName, batchYield, alchemyMult) {
    return AlchemyCalcEngine.applyAlchemyMult(machineName, batchYield, alchemyMult);
}

function getProductionHeatCost(item, speedMult, alchemyMult) {
    return AlchemyCalcEngine.getProductionHeatCost(DB, { preferredRecipes: DB.settings.preferredRecipes }, item, speedMult, alchemyMult, DB.settings.selectedHeatingDevice);
}

function getProductionFertCost(item, fertVal, fertSpeed, speedMult, alchemyMult) {
    return AlchemyCalcEngine.getProductionFertCost(DB, { preferredRecipes: DB.settings.preferredRecipes }, item, fertVal, fertSpeed, speedMult, alchemyMult);
}

function formatVal(val) { if(val >= 1000000) return Number((val/1000000).toFixed(2)) + 'm'; if(val >= 10000) return Number((val/1000).toFixed(2)) + 'k'; return Number(val.toFixed(2)); }

function formatCoinIcons(coins) {
    const total = Math.round(coins);
    const gold   = Math.floor(total / 100000);
    const silver = Math.floor((total % 100000) / 1000);
    const copper = total % 1000;
    const img = (id) => `<img src="img/item${id}.png" width="24" height="24" style="vertical-align:middle; margin-bottom:4px;">`;
    let parts = [];
    if (gold   > 0) parts.push(`${gold.toLocaleString()}${img(906)}`);
    if (silver > 0) parts.push(`${silver.toLocaleString()}${img(809)}`);
    if (copper > 0 || parts.length === 0) parts.push(`${copper.toLocaleString()}${img(611)}`);
    return parts.join(' ');
}

function toggleBuildGroup(header) {
    header.classList.toggle('expanded');
}

function toggleNode(arrowElement, pathKey) {
    const node = arrowElement.closest('.node');
    if (node) node.classList.toggle('collapsed');
    if (GLOBAL_CALC_STATE.collapsedNode.has(pathKey)) {
        GLOBAL_CALC_STATE.collapsedNode.delete(pathKey);
    }
    else {
        GLOBAL_CALC_STATE.collapsedNode.add(pathKey);
    }
}

function toggleRecycle(pathKey) {
    if (GLOBAL_CALC_STATE.activeRecyclers.has(pathKey)) {
        GLOBAL_CALC_STATE.activeRecyclers.delete(pathKey)
    } else {
        GLOBAL_CALC_STATE.activeRecyclers.add(pathKey);
    }
    calculate();
}

function toggleExternal(pathKey) {
    if (GLOBAL_CALC_STATE.forcedExternals.has(pathKey)) {
        GLOBAL_CALC_STATE.forcedExternals.delete(pathKey)
    } else {
        GLOBAL_CALC_STATE.forcedExternals.add(pathKey);
    }
    calculate();
}

function toggleCatalystExpand(catalystType) {
    if (!DB.settings.expandCatalystInputs) DB.settings.expandCatalystInputs = {};
    DB.settings.expandCatalystInputs[catalystType] = !DB.settings.expandCatalystInputs[catalystType];
    persist();
    calculate();
}

/**
 * 控制主生產鏈中所有可回收節點的狀態
 * @param {boolean} enable - true 為全部回收, false 為全部不回收
 */
function setAllRecycling(enable) {
    // 尋找畫面上所有現有的「回收按鈕」，將其 pathKey 加入/移除 Set
    const buttons = document.querySelectorAll('.recycle-btn');
    buttons.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        const match = onclickAttr.match(/'([^']+)'/);
        if (match && match[1]) {
            enable ? GLOBAL_CALC_STATE.activeRecyclers.add(match[1]) : GLOBAL_CALC_STATE.activeRecyclers.delete(match[1]);
        }
    });
    calculate(); // 重新計算以套用變更
}

function toggleFirstLevel() {
    const sectionNodes = document.querySelectorAll('.node');
    const level1Nodes = Array.from(sectionNodes).filter(n => {
        const path = n.getAttribute('data-path') || "";
        const segments = path.split('>').filter(s => s.trim().length > 0);
        return segments.length === 2;
    });
    if (level1Nodes.length === 0) return;

    // 根據第一個符合項目的狀態決定「全部展開」或「全部摺疊」
    const isCurrentlyCollapsed = level1Nodes[0].classList.contains('collapsed');
    const shouldCollapse = !isCurrentlyCollapsed;
    level1Nodes.forEach(n => n.classList.toggle('collapsed', shouldCollapse));
}

/**
 * 批量切換標題下方節點的狀態
 */
function toggleNodesInSection(headerElement, shouldCollapse) {
    let sectionContainer = headerElement.closest('div');
    let next = sectionContainer.nextElementSibling;
    // 遍歷直到遇到下一個 section-header 或結束
    while (next && !next.classList.contains('section-header')) {
        if (next.classList.contains('node')) {
            const isCurrentlyCollapsed = next.classList.contains('collapsed');
            if (shouldCollapse !== isCurrentlyCollapsed) {
                const arrow = next.querySelector('.tree-arrow');
                if (arrow) arrow.click(); // 觸發現有的 toggleNode 邏輯以同步 GLOBAL_CALC_STATE
            }
        }
        next = next.nextElementSibling;
    }
}

function jumpToNode(pathKey) {
    let target = document.querySelector(`[data-path="${pathKey}"]`);
    if (!target) {
        // TODO: 展開折疊的父節點
        return;
    }

    // 捲動到目標節點
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 高亮視覺反饋
    const content = target.querySelector('.node-content');
    if (content) {
        content.classList.add('jump-highlight');
        setTimeout(() => content.classList.remove('jump-highlight'), 2000);
    }
}

/* ==========================================================================
   SECTION: CALCULATION ENGINE
   ========================================================================== */
function calculate() {
    try {
        if(!DB || !DB.recipes) return;
        
        console.time('calculate');
        const params = gatherInputs();
        updateLabels(params);
        const result = AlchemyCalcEngine.runCalculation({
            db: DB,
            params,
            state: {
                activeRecyclers: GLOBAL_CALC_STATE.activeRecyclers,
                forcedExternals: GLOBAL_CALC_STATE.forcedExternals,
                preferredRecipes: DB.settings.preferredRecipes,
                nodeRecipeOverrides: DB.settings.nodeRecipeOverrides,
                recipeModifiers: DB.settings.recipeModifiers,
                customCosts: DB.settings.customCosts,
                expandCatalystInputs: DB.settings.expandCatalystInputs
            }
        });
        _lastCalcResult = result;
        _lastCalcParams = params;

        renderCalculationResult(params, result);

        // --- PASS 3: TRANSLATION --- (extra)
        translateText();
        updateURL();
        console.timeEnd('calculate');

    } catch(e) { console.error(e); }
}

function sendCalcResultToPlanner() {
    if (!_lastCalcResult) return;
    if (typeof plannerImportFromCalcResult !== 'function') {
        console.error("alchemy_planner.js not loaded");
        return;
    }
    switchTab('planner');
    plannerImportFromCalcResult(_lastCalcResult, _lastCalcParams);
}

/**
 * 計算指定物品在單一機台滿載下的產出速率 (items/min)，
 * 已套用 Alchemy/Speed 倍率並被傳送帶速度上限裁切
 * @param {string} recipe
 * @param {string} itemName
 * @param {object} [opts] 可選覆寫參數 { lvlAlchemy, lvlSpeed, lvlBelt, selectedFert }
 * @returns {number} ratePerMachine，若無配方則回傳 0
 */
function getSingleMachineRate(recipe, itemName, opts = {}) {
    const itemDef = DB.items[itemName];
    if (!itemDef || !recipe) return 0;

    const lvlAlchemy   = opts.lvlAlchemy   ?? (parseInt(document.getElementById('lvlAlchemy').value) || 0);
    const lvlSpeed     = opts.lvlSpeed     ?? (parseInt(document.getElementById('lvlSpeed').value) || 0);
    const lvlBelt      = opts.lvlBelt      ?? (parseInt(document.getElementById('lvlBelt').value) || 0);
    const selectedFert = opts.selectedFert ?? document.getElementById('fertSelect').value;

    let batchYield = recipe.outputs[itemName] || 1;
    batchYield = applyAlchemyMult(recipe.machine, batchYield, getAlchemyMult(lvlAlchemy));

    let recipeTime = recipe.baseTime || 1;
    const recipeNutrientCost = recipe.nutrientCost || 0;
    if (recipeNutrientCost > 0 && recipe.machine === "Nursery") {
        const fertilitySpeed = DB.items[selectedFert]?.maxFertility || 1;
        recipeTime = recipeNutrientCost / fertilitySpeed;
    }

    let ratePerMachine = (60 / (recipeTime || 1)) * getSpeedMult(lvlSpeed) * batchYield;

    if (!itemDef.liquid) {
        let beltSpeed = getBeltSpeed(lvlBelt);
        if (itemDef.category === "Currency") beltSpeed *= 50;
        else if (recipe.sharedOutputs) beltSpeed /= recipe.sharedOutputs;
        ratePerMachine = Math.min(ratePerMachine, beltSpeed);
    }

    return ratePerMachine;
}

function gatherInputs() {

    const isMulti = document.getElementById('modeToggle').checked;
    let targets = [];
    let targetItem = "", targetRate = 0.0;

    if (!isMulti) {
        // 單產物模式
        let rawInput = document.getElementById('targetItemInput').value.trim();
        targetItem = Object.keys(DB.items).find(k => k.toLowerCase() === rawInput.toLowerCase()) || rawInput;
        targetRate = parseFloat(document.getElementById('targetRate').value) || 0;
        targets.push({
            item: targetItem,
            rate: targetRate
        });
    }
    else {
        // 多產物模式：遍歷 DOM 中的每一列
        document.querySelectorAll('.multi-target-row').forEach(row => {
            const item = row.dataset.item;
            const rate = parseFloat(row.querySelector('.multi-rate-input').value) || 0;
            if (item && rate > 0) {
                targets.push({ item, rate });
            }
        });
    }
    
    // Settings
    const selectedFuel = document.getElementById('fuelSelect').value;
    const heatingDeviceSelect = document.getElementById('heatingDeviceSelect');
    const selectedHeatingDevice = DB.machines[heatingDeviceSelect.value]?.isGenerator
        ? heatingDeviceSelect.value
        : (DB.machines["Stone Furnace"]?.isGenerator ? "Stone Furnace" : Object.keys(DB.machines).find(machineName => DB.machines[machineName]?.isGenerator));
    const selfFuel = document.getElementById('btnSelfFuel')?.classList.contains('btn-active-green') ?? false;
    const fuelCost = DB.settings.customCosts[selectedFuel] || 0;

    const selectedFert = document.getElementById('fertSelect').value;
    const selfFert = document.getElementById('btnSelfFert')?.classList.contains('btn-active-green') ?? false;
    const fertCost = DB.settings.customCosts[selectedFert] || 0;

    const showFuelCost = false;
    const showFertCost = false;
    const showBeltCount = document.getElementById('showBeltCount').checked;
    const showFuelFert = document.getElementById('showFuelFert').checked;
    const showRawMachineCount = document.getElementById('showRawMachineCount').checked;
    const showMaxCap = document.getElementById('showMaxCap').checked;
    const showHeatFert = document.getElementById('showHeatFert').checked;

    const lvlSpeed = parseInt(document.getElementById('lvlSpeed').value) || 0;
    const lvlBelt = parseInt(document.getElementById('lvlBelt').value) || 0;
    const lvlFuel = parseInt(document.getElementById('lvlFuel').value) || 0;
    const lvlAlchemy = parseInt(document.getElementById('lvlAlchemy').value) || 0;
    const lvlFert = parseInt(document.getElementById('lvlFert').value) || 0;
    const lvlSell = parseInt(document.getElementById('lvlSell').value) || 0;
            
    const isMachineMode = document.getElementById('machineModeToggle').checked;
    const recipe = getActiveRecipe(targetItem, ">" + targetItem);
    const machineName = recipe ? "(" + t(recipe.machine, 'machines') + ")" : "N/A";
    document.getElementById('active-machine-name').innerText = machineName;        

    if (recipe) {
        const ratePerMachine = getSingleMachineRate(recipe, targetItem, { lvlAlchemy, lvlSpeed, lvlBelt, selectedFert });
        if (isMachineMode) {
            const machineCount = parseFloat(document.getElementById('targetMachine').value) || 0;
            targetRate = machineCount * ratePerMachine;
            targets[0].rate = targetRate;
            document.getElementById('targetRate').value = Number(targetRate.toFixed(2));
            document.getElementById('rateLabel').textContent = `${(targetRate/getBeltSpeed(lvlBelt)*100).toFixed(1)}%`;
        }
        else {
            const machineCount = targetRate / ratePerMachine;
            document.getElementById('targetMachine').value = Number(machineCount.toFixed(2));
            document.getElementById('rateLabel').textContent = `${(targetRate/getBeltSpeed(lvlBelt)*100).toFixed(1)}%`;
        }
    }
    
    return {
        targets,
        isMulti,
        targetItem, targetRate, // 為了相容部分單產物邏輯
        selectedFuel, selfFuel, fuelCost, showFuelCost,
        selectedHeatingDevice,
        selectedFert, selfFert, fertCost, showFertCost,
        showFuelFert, showBeltCount, showRawMachineCount, showMaxCap, showHeatFert, 
        lvlSpeed, lvlBelt, lvlFuel, lvlAlchemy, lvlFert, lvlSell,
        beltSpeed: getBeltSpeed(lvlBelt),
        speedMult: getSpeedMult(lvlSpeed),
        alchemyMult: getAlchemyMult(lvlAlchemy),        
        sellMult: AlchemyCalcEngine.getSellMult(lvlSell),
        fuelMult: 1 + (lvlFuel * 0.10),
        fertMult: 1 + (lvlFert * 0.10)
    };
}

function updateLabels(params) {
    try {
        document.getElementById('lvlBelt-title').innerText = `${t('Logistics Efficiency')} (${(params.beltSpeed/60*100).toFixed(0)}%) ${params.beltSpeed}/min`;
        document.getElementById('lvlSpeed-title').innerText = `${t('Factory Efficiency')} (${(params.speedMult*100).toFixed(0)}%)`;
        document.getElementById('lvlAlchemy-title').innerText = `${t('Alchemy Skill')} (${(params.alchemyMult*100).toFixed(0)}%)`;
        document.getElementById('lvlFuel-title').innerText = `${t('Fuel Efficiency')} (${(params.fuelMult*100).toFixed(0)}%)`;
        document.getElementById('lvlFert-title').innerText = `${t('Fert Efficiency')} (${(params.fertMult*100).toFixed(0)}%)`;
        document.getElementById('lvlSell-title').innerText = `${t('Sales Ability')} (${((params.sellMult) * 100).toFixed(0)}%)`;
    } catch(e) { console.error(e); }
}

function renderCalculationResult(params, result) {
    const treeContainer = document.getElementById('tree');
    treeContainer.innerText = '';

    result.treeRoots.forEach(entry => {
        const rootCosts = sumResourceCosts(entry.root);
        const fuelTag = rootCosts.fuel > 0 ? `<span class="heat-tag">-${rootCosts.fuel.toFixed(2)}/m <img src="img/item${DB.items[params.selectedFuel]?.id ?? 0}.png" class="item-icon-small"</span>` : ``;
        const bioTag = rootCosts.fert > 0 ? `<span class="bio-tag">-${rootCosts.fert.toFixed(2)}/m <img src="img/item${DB.items[params.selectedFert]?.id ?? 0}.png" class="item-icon-small"></span>` : ``;

        const div = document.createElement('div');        
        div.className = 'section-title';
        div.innerHTML = `
            <span class="section-header">--- ${t('Production Chain')} (${entry.target.item}) ---
            </span>
            <span style="margin-left:auto; cursor:pointer;">
                <button class="recycle-btn" onclick="setAllRecycling(true)" title="Recycle all byproducts">${t('Recycle All')}</button>
                <button class="recycle-btn" onclick="setAllRecycling(false)" titile="Don't recycle any byproducts">${t('Un-recycle All')}</button>
                <span class="section-header" onclick="toggleFirstLevel()" title="Toggle First Level" style="margin-right:10px;">💠</span>
            </span>
            ${fuelTag}
            ${bioTag}
        `;
        treeContainer.appendChild(div);
        treeContainer.appendChild(renderTreeNode(params, entry.root));
    });

    renderExternalInputsSection(treeContainer, params, result.externalInputs);
    renderByproductsSection(treeContainer, result.byproducts);
    renderCommonNodesSection(treeContainer, params, result.commonNodes);

    updateConstructionList(
        result.construction.maxCounts,
        result.construction.minCounts,
        result.construction.furnaces,
        result.construction.extraBuildCosts,
        params.selectedHeatingDevice
    );

    // 新增：計算 fuel/fert 換算價值
    const fuelFertValues = solveFuelFertValue(params, result);

    updateSummaryBox(
        params,
        result.summary.heatLoad,
        result.summary.bioLoad,
        result.summary.goldPerMin,
        result.summary.fuelDemandItems,
        result.summary.fertDemandItems,
        fuelFertValues
    );

    updateSummaryLineFromResult(params, result.formulaLineData);
    updateEquilibriumWarning(result.equilibriumWarning);
}

function createSectionHeader(title) {
    const div = document.createElement('div');
    div.className = 'section-title';
    div.innerHTML = `
        <span class="section-header">${title}</span>
        <span style="margin-left:auto; cursor:pointer;">
            <button class="recycle-btn info" onclick="toggleNodesInSection(this, false)">${t('Expand All')}</button>
            <button class="recycle-btn info" onclick="toggleNodesInSection(this, true)">${t('Collapse All')}</button>
        </span>
    `;
    return div;
}

function buildRecipeTooltip(tooltipData) {
    if (!tooltipData) return '';
    const inputsStr = tooltipData.inputs.map(entry => `${entry.qty} ${entry.item}`).join(', ');
    const outputsStr = tooltipData.outputs.map(entry => `${entry.qty} ${entry.item}`).join(', ');
    let tooltipText = `${t('Recipe')}: ${inputsStr} -> ${outputsStr}\n`;
    tooltipText += `${t('Base Time')}: ${tooltipData.baseTime} s\n`;
    tooltipText += `${t('Speed Mult')}: ${tooltipData.speedMult.toFixed(2)}x\n`;
    tooltipText += `${t('Throughput')}: ${tooltipData.throughput.toFixed(2)}/min`;
    return tooltipText;
}

function renderCostEntries(costEntries, itemName) {
    return costEntries.map(entry => {
        if (entry.type !== 'gold') return ``; // ignore fuel and fert cost
        const amount = Math.ceil(entry.amount - Number.EPSILON).toLocaleString();
        const bolt = entry.custom ? ' ⚡' : '';
        return `<span class="cost-tag" style="cursor:pointer;" title="${t('Manage Custom Cost')}"
            onclick="event.stopPropagation(); openCustomCostModal('${itemName}')">-${amount} /m <img src="img/copper.png" class="item-icon-small">${bolt}</span>`;
    }).join('');
}

function renderTreeNode(params, node) {
    const itemDef = DB.items[node.item] || {};
    const div = document.createElement('div');
    div.className = 'node';
    div.setAttribute('data-depth', node.depth % 10);
    div.setAttribute('data-path', node.pathKey);
    if (GLOBAL_CALC_STATE.collapsedNode.has(node.pathKey)) div.classList.add('collapsed');
    const hasOverride = !!DB.settings.nodeRecipeOverrides?.[node.pathKey];
    if (hasOverride) div.classList.add('node-override');

    const hasChildren = node.children.length > 0;    
    const machineCountArg = node.machine ? node.machineCount : null;
    const rpmArg = node.machine ? (node.requestedRate / node.machineCount) : null;
    
    const arrowHtml = `<span class="tree-arrow" style="visibility:${hasChildren ? 'visible' : 'hidden'}" onclick="toggleNode(this, '${node.pathKey}')">▼</span>`;
    const rateHtml = `<span class="qty qty-clickable" onclick="openScaleModal('${node.item}', ${node.requestedRate}, ${machineCountArg}, ${rpmArg})">${formatVal(node.requestedRate)}/m</span>`;
    const beltCountTag = node.tags.beltRatio !== null ? `<span class="belt-count">(${Number(node.tags.beltRatio.toFixed(2))})</span>` : '';
    const itemTag = `<img src="img/item${itemDef?.id ?? 0}.png" class="item-icon">
        <span class="item-link" onclick="openDrillDown('${node.item}', ${node.requestedRate})"><strong>${node.item}</strong></span>`;

    let detailsTag = '';
    if (node.tags.detailsType === 'external') detailsTag = `<span class="details">(${t('External Input')})</span>`;
    if (node.tags.detailsType === 'raw') detailsTag = `<span class="details">(${t('Raw Input')})</span>`;

    let machineTag = '';
    let swapBtn = '';
    if (node.machine) {
        const tooltipText = buildRecipeTooltip(node.recipeTooltipData);
        let capTag = '';
        if (params.showMaxCap && node.maxOutput) {
            const usageRatio = node.maxOutput > 0 ? node.netRate / node.maxOutput : 0;
            capTag = `<span class="max-cap-tag" onclick="recalculate('${params.targetItem}', ${params.targetRate / usageRatio})">(Max: ${formatVal(node.maxOutput)}/m)</span>`;
        }
        const machineIcon = node.tags.heat ? '🔥' : (node.tags.bio ? '🌱' : '');
        const machineNumber = params.showRawMachineCount ? Number(node.machineCount.toFixed(2)) : Math.ceil(node.machineCount - 0.0001);
        machineTag = `<span class="machine-tag" data-tooltip="${tooltipText}">${machineNumber} ${t(node.machine, 'machines')}${capTag} ${machineIcon}</span>`;
        const recipeCandidates = getRecipesFor(node.item);
        const hasCauldronTarget = itemDef && itemDef.cauldronTarget !== undefined;
        const hasRecipeModifier = recipeCandidates?.length === 1 && recipeCandidates[0].machine === 'Advanced Athanor';
        if (recipeCandidates.length > 1 || hasCauldronTarget || hasRecipeModifier) {
            swapBtn = `<button class="swap-btn" onclick="openRecipeModal('${node.item}', '${node.pathKey}')" title="${t('Swap Recipe')}">🔄</button>`;
        }
    }

    let byproductTag = node.tags.byproducts.map(entry => `<span class="byproduct-tag">+${formatVal(entry.rate)}/m <img src="img/item${DB.items[entry.item]?.id ?? 0}.png" class="item-icon-small">${entry.item}</span>`).join('');

    let bioTag = '';
    if (node.tags.bio && params.showFuelFert) {
        let bioText = `-${formatVal(node.tags.bio.rate)}/m<img src="img/item${DB.items[params.selectedFert]?.id ?? 0}.png" title="${params.selectedFert}" class="item-icon-small">`;
        if (params.showHeatFert) bioText += ` (${formatVal(node.tags.bio.nutrientPerSec)} V/s)`;
        bioTag = `<span class="bio-tag">${bioText}</span>`;
    }

    let heatTag = '';
    if (node.tags.heat && params.showFuelFert) {
        let heatText = `-${formatVal(node.tags.heat.rate)}/m<img src="img/item${DB.items[params.selectedFuel]?.id ?? 0}.png" title="${params.selectedFuel}" class="item-icon-small">`;
        if (params.showHeatFert) heatText += ` (${formatVal(node.tags.heat.heatPerSec)} P/s)`;
        heatTag = `<span class="heat-tag">${heatText}</span>`;
    }

    let outputTag = '';
    if (node.tags.output && params.showFuelFert) outputTag = `<span class="output-tag">${t('Yields')}: ${(node.tags.output.multiplier * 100).toFixed(0)}%</span>`;

    let catalystExpandTag = '';
    if (node.tags.catalystType) {
        const expanded = !!DB.settings.expandCatalystInputs?.[node.tags.catalystType];
        catalystExpandTag = `<div><button class="recycle-btn ${expanded ? 'active' : ''}" onclick="toggleCatalystExpand('${node.tags.catalystType}')">🧪${expanded ? t('Expand') : t('Fold')}</button></div>`;
    }

    let recycleTag = '';
    if (node.canRecycle) {
        if (node.recycleActive) {
            recycleTag = `<div><button class="recycle-btn active" onclick="toggleRecycle('${node.pathKey}')">♻️ ${formatVal(node.deductionRate)} ${t('Used')}</button></div>`;
        } else {
            recycleTag = `<div><button class="recycle-btn" onclick="toggleRecycle('${node.pathKey}')">♻️ ${formatVal(node.recycleAvailable)} ${t('Avail')}</button></div>`;
        }
    }

    const externalTag = `<div><input type="checkbox" ${node.isExternal ? 'checked':''} onchange="toggleExternal('${node.pathKey}');"></input></div>`;
    const costTag = params.showFuelFert ? renderCostEntries(node.tags.costEntries, node.item) : '';
    if (node.netRate < Number.EPSILON) byproductTag = bioTag = heatTag = '';

    div.innerHTML = `<div class="node-content" data-ancestors='${JSON.stringify(node.ancestors)}'>
        ${arrowHtml}
        ${rateHtml}
        ${beltCountTag}
        ${itemTag}
        ${swapBtn}
        ${detailsTag}
        ${machineTag}
        ${byproductTag}
        ${bioTag}
        ${heatTag}
        ${costTag}
        ${outputTag}
        <div class="push-right"></div>
        ${catalystExpandTag}
        ${recycleTag}
        ${externalTag}
    </div>`;

    if (hasChildren) {
        const childrenDiv = document.createElement('div');
        childrenDiv.className = 'node-children';
        node.children.forEach(child => childrenDiv.appendChild(renderTreeNode(params, child)));
        div.appendChild(childrenDiv);
    }

    return div;
}

function renderCommonNodesSection(treeContainer, params, commonNodes) {
    if (commonNodes.length === 0) return;
    treeContainer.appendChild(createSectionHeader(`--- ${t('Common Nodes')} ---`));

    commonNodes.forEach(entry => {
        const pathKey = `common_${entry.item}_${entry.machine}`;
        const div = document.createElement('div');
        div.className = 'node';
        if (GLOBAL_CALC_STATE.collapsedNode.has(pathKey)) div.classList.add('collapsed');

        const machineLabel = `<span class="machine-tag" data-tooltip="${buildRecipeTooltip(entry.tooltipData)}">${Number(entry.totalMachines.toFixed(2))} ${t(entry.machine, 'machines')}</span>`;
        const heatTag = entry.totalFuelRate > 0.0001 ? `<span class="heat-tag">-${formatVal(entry.totalFuelRate)}/m ${params.selectedFuel}</span>` : '';
        const bioTag = entry.totalFertRate > 0.0001 ? `<span class="bio-tag">-${formatVal(entry.totalFertRate)}/m ${params.selectedFert}</span>` : '';

        let childrenHtml = '';
        entry.instances.forEach(inst => {
            childrenHtml += `
                <div class="node-content" style="margin-bottom:2px; border-bottom:1px dashed #333; opacity:0.8;">
                    <span class="qty" style="min-width:60px; display:inline-block;">${formatVal(inst.rate)}/m</span>
                    <span style="font-size:0.85em; color: #FFF; margin-right:5px;">${Number(inst.machines.toFixed(2))} ${t(entry.machine, 'machines')}</span>
                    <span class="details" style="font-size:0.85em; cursor:pointer;" onclick="jumpToNode('${inst.pathKey}')">[ ${inst.pathKey} ]</span>
                </div>
            `;
        });

        div.innerHTML = `
            <div class="node-content" style="background: rgba(76, 175, 80, 0.05); border-left: 3px solid var(--accent);">
                <span class="tree-arrow" onclick="toggleNode(this, '${pathKey}')">▼</span>
                <span class="qty">${formatVal(entry.totalRate)}/m</span>
                <img src="img/item${DB.items[entry.item]?.id ?? 0}.png" class="item-icon">
                <strong>${entry.item}</strong>
                ${machineLabel}
                ${heatTag}
                ${bioTag}
            </div>
            <div class="node-children" style="margin-left: 20px; border-left: 1px solid #444;">${childrenHtml}</div>
        `;
        treeContainer.appendChild(div);
    });
}

function renderExternalInputsSection(treeContainer, params, externalInputs) {
    treeContainer.appendChild(createSectionHeader('--- External Inputs ---'));

    function createExtNode(label, qty, colorVar, pathKey, producersHtml, mainIconHtml = "") {
        const div = document.createElement('div');
        div.className = 'node';
        if (GLOBAL_CALC_STATE.collapsedNode.has(pathKey)) div.classList.add('collapsed');
        div.innerHTML = `
            <div class="node-content" style="background: rgba(255, 255, 255, 0.02); border-left: 3px solid var(--${colorVar});">
                <span class="tree-arrow" onclick="toggleNode(this, '${pathKey}')">▼</span>
                <span class="qty" style="color:var(--${colorVar})">${qty}</span>
                ${mainIconHtml}
                <strong>${label}</strong>
            </div>
            <div class="node-children" style="margin-left: 20px; border-left: 1px solid #444;">${producersHtml}</div>
        `;
        treeContainer.appendChild(div);
    }

    if (externalInputs.rawMaterialCost.totalGoldPerMin > 0) {
        let producersHtml = '';
        externalInputs.rawMaterialCost.sources.forEach(src => {
            producersHtml += `
                <div class="node-content" style="opacity:0.8;">
                    <span class="qty" style="color:var(--gold); min-width:80px; display:inline-block;">${Math.ceil(src.gold).toLocaleString()} /m</span>
                    <img src="img/item${DB.items[src.item]?.id ?? 0}.png" width="20" height="20">
                    <span class="details" style="font-size:0.85em; cursor:pointer;" onclick="jumpToNode('${src.pathKey}')">[ ${src.pathKey} ]</span>
                </div>`;
        });
        createExtNode(
            `${t('Raw Material Cost')} (${externalInputs.rawMaterialCost.sources.length})`,
            `${Math.ceil(externalInputs.rawMaterialCost.totalGoldPerMin).toLocaleString()} /m`,
            'gold',
            'ext_gold',
            producersHtml
        );
    }

    if (externalInputs.fuel && externalInputs.fuel.totalRate > 0.001) {
        let producersHtml = '';
        externalInputs.fuel.sources.forEach(src => {
            producersHtml += `
                <div class="node-content" style="opacity:0.8;">
                    <span class="qty" style="color:var(--fuel); min-width:60px; display:inline-block;">${formatVal(src.rate)}/m</span>
                    <span class="machine-tag">${Math.ceil(src.count - 0.0001)} ${t(src.machine, 'machines')}</span>
                    <span class="details" style="font-size:0.85em; cursor:pointer;" onclick="jumpToNode('${src.pathKey}')">[ ${src.pathKey} ]</span>
                    <img src="img/item${DB.items[src.item]?.id ?? 0}.png" width="20" height="20">
                </div>`;
        });
        createExtNode(
            `${externalInputs.fuel.item} (${externalInputs.fuel.sources.length})`,
            `${externalInputs.fuel.totalRate.toFixed(2)}/m`,
            'fuel',
            'ext_fuel',
            producersHtml,
            `<img src="img/item${DB.items[externalInputs.fuel.item]?.id ?? 0}.png" class="item-icon"> `
        );
    }

    if (externalInputs.fert && externalInputs.fert.totalRate > 0.001) {
        let producersHtml = '';
        externalInputs.fert.sources.forEach(src => {
            producersHtml += `
                <div class="node-content" style="opacity:0.8;">
                    <span class="qty" style="color:var(--bio); min-width:60px; display:inline-block;">${formatVal(src.rate)}/m</span>
                    <span class="machine-tag">${Math.ceil(src.count - 0.0001)} ${t(src.machine, 'machines')}</span>
                    <span class="details" style="font-size:0.85em; cursor:pointer;" onclick="jumpToNode('${src.pathKey}')">[ ${src.pathKey} ]</span>
                    <img src="img/item${DB.items[src.item]?.id ?? 0}.png" width="20" height="20">
                </div>`;
        });
        createExtNode(
            `${externalInputs.fert.item} (${externalInputs.fert.sources.length})`,
            `${externalInputs.fert.totalRate.toFixed(2)}/m`,
            'bio',
            'ext_fert',
            producersHtml,
            `<img src="img/item${DB.items[externalInputs.fert.item]?.id ?? 0}.png" class="item-icon"> `
        );
    }

    externalInputs.forced.forEach(entry => {
        let producersHtml = '';
        entry.sources.forEach(src => {
            producersHtml += `
                <div class="node-content" style="opacity:0.8;">
                    <span class="qty" style="color:var(--default); min-width:60px; display:inline-block;">${formatVal(src.rate)}/m</span>
                    <span class="details" style="font-size:0.85em; cursor:pointer;" onclick="jumpToNode('${src.pathKey}')">[ ${src.pathKey} ]</span>
                </div>`;
        });
        createExtNode(
            entry.item,
            `${formatVal(entry.totalRate)}/m`,
            'default',
            `ext_forced_${entry.item}`,
            producersHtml,
            `<img src="img/item${DB.items[entry.item]?.id ?? 0}.png" class="item-icon"> `
        );
    });
}

function renderByproductsSection(treeContainer, byproducts) {
    treeContainer.appendChild(createSectionHeader('--- BYPRODUCTS ---'));

    if (byproducts.length === 0) {
        const emptyDiv = Object.assign(document.createElement('div'), {
            className: 'node',
            innerHTML: `<div class="node-content"><span class="details" style="font-style:italic">${t('None')}</span></div>`
        });
        treeContainer.appendChild(emptyDiv);
        return;
    }

    byproducts.forEach(entry => {
        const pathKey = `byp_${entry.item}`;
        const div = document.createElement('div');
        div.className = 'node';
        if (GLOBAL_CALC_STATE.collapsedNode.has(pathKey)) div.classList.add('collapsed');

        const recycledNote = entry.remaining < entry.totalGenerated
            ? ` <span style="font-size:0.8em; color:#888;">(${formatVal(entry.totalGenerated - entry.remaining)} ${t('recycled')})</span>`
            : '';

        let childrenHtml = '';
        entry.producers.forEach(inst => {
            childrenHtml += `
                <div class="node-content" style="margin-bottom:2px; opacity:0.8;">
                    <span class="qty" style="min-width:60px; display:inline-block; ${inst.rate > 0.0001 ? 'color:var(--byproduct);' : ''}">${inst.rate > 0.0001 ? formatVal(inst.rate) : formatVal(-inst.rate)}/m</span>
                    <span class="machine-tag" data-tooltip="${buildRecipeTooltip(inst.tooltipData)}">${Math.ceil(inst.machineCount)} ${t(inst.recipe.machine, 'machines')}</span>
                    <span class="details" style="font-size:0.85em; cursor:pointer;" onclick="jumpToNode('${inst.pathKey}')">[ ${inst.pathKey} ]</span>
                </div>
            `;
        });

        div.innerHTML = `
            <div class="node-content" style="background: rgba(213, 109, 231, 0.03); border-left: 3px solid var(--byproduct);">
                <span class="tree-arrow" onclick="toggleNode(this, '${pathKey}')">▼</span>
                <span class="qty" style="color:var(--byproduct)">${formatVal(entry.remaining)}/m</span>
                <img src="img/item${DB.items[entry.item]?.id ?? 0}.png" class="item-icon">
                <strong>${entry.item}</strong>
                ${recycledNote}
            </div>
            <div class="node-children" style="margin-left: 20px; border-left: 1px solid #444;">${childrenHtml}</div>
        `;
        treeContainer.appendChild(div);
    });
}

function updateSummaryLineFromResult(params, formulaLineData) {
    function formattedText(name, qty, color) {
        return ` <span class="qty" style="color:var(--${color})">${Number(qty.toFixed(2))}<img src="img/item${DB.items[name]?.id ?? 0}.png" title="${name}" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;"></span>`;
    }

    let summaryLine = '';
    Object.entries(formulaLineData.rawItems).forEach(([name, rate]) => summaryLine += formattedText(name, rate, 'accent'));
    Object.entries(formulaLineData.forcedItems).forEach(([name, rate]) => summaryLine += formattedText(name, rate, 'accent'));

    let fuelDemandItems = formulaLineData.fuelDemandItems;
    let fertDemandItems = formulaLineData.fertDemandItems;
    if (params.selfFuel) fuelDemandItems = 0;
    if (params.selfFert) fertDemandItems = 0;

    const sumDemandItems = fuelDemandItems + fertDemandItems;
    if (sumDemandItems > 0.0001) {
        summaryLine += ` (`;
        if (params.selectedFuel === params.selectedFert) {
            summaryLine += formattedText(params.selectedFuel, sumDemandItems, 'gold');
        } else {
            if (fuelDemandItems > 0.0001) summaryLine += formattedText(params.selectedFuel, fuelDemandItems, 'fuel');
            if (fertDemandItems > 0.0001) summaryLine += formattedText(params.selectedFert, fertDemandItems, 'bio');
        }
        summaryLine += `) `;
    }
    summaryLine += `<span style="color:var(--info);"> ➔ </span>`;

    params.targets.forEach(target => {
        if (target.rate > 0.0001) {
            let targetRate = target.rate;
            if (params.selfFuel && params.selectedFuel === target.item) targetRate -= formulaLineData.fuelDemandItems;
            if (params.selfFert && params.selectedFert === target.item) targetRate -= formulaLineData.fertDemandItems;
            summaryLine += formattedText(target.item, targetRate, 'profit');
        }
    });

    Object.entries(formulaLineData.availableByproducts).forEach(([name, rate]) => {
        if (rate > 0.0001) summaryLine += formattedText(name, rate, 'byproduct');
    });

    document.getElementById('summary-line').innerHTML = summaryLine;
}

function updateEquilibriumWarning(equilibriumWarning) {
    let el = document.getElementById('equilibrium-warning-line');
    let warningText = '';
    switch (equilibriumWarning) {
        case 'LowSupply': warningText = t('Internal fuel/fert module demand exceeds its own supply.'); break;
        case 'Divergence': warningText = t('By-product Recycling: Value Unconverged.'); break;
    }
    if (warningText) {
        el.innerText = '⚠︎ ' + warningText;
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

/* ==========================================================================
   SECTION: JS - DOM RENDERING
   ========================================================================== */
function updateConstructionList(maxCounts, minCounts, furnaces, extraBuildCosts, selectedHeatingDevice) {
    const buildList = document.getElementById('construction-list'); buildList.innerHTML = '';
    const totalMatsContainer = document.getElementById('total-mats-container'); totalMatsContainer.innerHTML = '';
    const isMaxMode = false;
    
    const sortedMachines = Object.keys(maxCounts).sort();
    let totalConstructionMaterials = {};

    sortedMachines.forEach(m => {
        const countMax = maxCounts[m]; 
        const countMin = Math.ceil(minCounts[m]);
        if(countMax <= 0) return;
        
        // Decide which count to use for material calculation
        const activeCount = isMaxMode ? countMax : countMin;
        
        let label = (countMax === countMin) ? `${countMax}` : 
                    isMaxMode ? `<span>${countMax}</span>` : 
                    `<span style="color:var(--accent)">${countMin}</span>`;

        const li = document.createElement('li'); li.className = 'build-group';
        const machineDef = DB.machines[m] || {};
        const buildCost = machineDef.buildCost;

        let subListHtml = '';
        if (buildCost) {
            subListHtml = `<ul class="build-sublist">`;
            Object.keys(buildCost).forEach(mat => {
                // Calculation based on activeCount
                const totalQty = buildCost[mat] * activeCount;
                subListHtml += `<li class="build-subitem"><span>${mat}</span> <span class="build-val">${totalQty}</span></li>`;
                if(!totalConstructionMaterials[mat]) totalConstructionMaterials[mat] = 0;
                totalConstructionMaterials[mat] += totalQty;
            });
            subListHtml += `</ul>`;
        }
        const machineIcon = `<img src="img/machines/${m.toLowerCase().replaceAll(' ', '-')}.png" width="16" height="16" loading="lazy" onerror="this.style.opacity='0'">`;
        li.innerHTML = `<div class="build-header" onclick="toggleBuildGroup(this.parentNode)"><span><span class="build-arrow">▶</span>${machineIcon} ${t(m, 'machines')}</span> <span class="build-count">${label}</span></div>${subListHtml}`;
        buildList.appendChild(li);
    });

    // Heating devices (calculated as shared heat-slot sources)
    if(furnaces > 0) {
        const li = document.createElement('li'); li.className = 'build-group';
        const mName = selectedHeatingDevice || "Stone Furnace";
        // If MAX mode, furnaces usually increase because machines are spread out
        // For simplicity, we keep it as 'furnaces' but you could implement a max-furnace logic if needed
        const count = furnaces; 
        const machineDef = DB.machines[mName] || {}; const buildCost = machineDef.buildCost;
        let subListHtml = '';
        if (buildCost) {
            subListHtml = `<ul class="build-sublist">`;
            Object.keys(buildCost).forEach(mat => {
                const totalQty = buildCost[mat] * count;
                subListHtml += `<li class="build-subitem"><span>${mat}</span> <span class="build-val">${totalQty}</span></li>`;
                if(!totalConstructionMaterials[mat]) totalConstructionMaterials[mat] = 0;
                totalConstructionMaterials[mat] += totalQty;
            });
            subListHtml += `</ul>`;
        }
        const machineIcon = `<img src="img/machines/${mName.toLowerCase().replaceAll(' ', '-')}.png" width="16" height="16" loading="lazy" onerror="this.style.opacity='0'">`;
        li.innerHTML = `<div class="build-header" style="border-top:1px dashed #555" onclick="toggleBuildGroup(this.parentNode)"><span><span class="build-arrow">▶</span>${machineIcon} ${t(mName, 'machines')}</span> <span class="build-count" style="color:var(--warn)">${count}</span></div>${subListHtml}`;
        buildList.appendChild(li);
    }

    // Render Total Section
    if (Object.keys(totalConstructionMaterials).length > 0) {
        let totalHtml = `<div class="total-mats-header">${t('Total Materials Required')}</div>`;
        let totalSlots = 0;

        Object.keys(totalConstructionMaterials).sort().forEach(mat => {
            const qty = totalConstructionMaterials[mat];
            const itemDef = DB.items[mat] || {};
            const stackSize = itemDef.maxStack || 200;
            const slotsNeeded = Math.ceil(qty / stackSize);
            totalSlots += slotsNeeded;
            totalHtml += `
                <div class="total-mat-item">                    
                    <span><img src="img/item${itemDef?.id ?? 0}.png" width="18" height="18" loading="lazy"> ${mat}</span> 
                    <strong>
                        ${qty} 
                        <span style="color:#888; font-size:0.85em; margin-left:4px; font-weight:normal;"> [${slotsNeeded}]</span>
                    </strong>
                </div>`;
        });
        Object.keys(extraBuildCosts).forEach(mat => {
            const qty = extraBuildCosts[mat];
            const itemDef = DB.items[mat] || {};
            const stackSize = itemDef.maxStack || 200;
            const slotsNeeded = Math.ceil(qty / stackSize);
            totalSlots += slotsNeeded;
            totalHtml += `
                <div class="total-mat-item">                    
                    <span><img src="img/item${itemDef?.id ?? 0}.png" width="18" height="18" loading="lazy"> ${mat}</span> 
                    <strong>
                        ${qty} 
                        <span style="color:#888; font-size:0.85em; margin-left:4px; font-weight:normal;"> [${slotsNeeded}]</span>
                    </strong>
                </div>`;
        });
        totalHtml += `
        <div style="margin-top:10px; padding-top:8px; border-top:1px dashed #444; display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.85em; color:#aaa; text-transform:uppercase;">${t('Total Slots', 'ui')}</span>
            <strong style="color:#888; font-size:0.85em; margin-left:4px; font-weight:normal;">[${totalSlots}]</strong>
        </div>`;
        totalMatsContainer.innerHTML = totalHtml;
    }
}

/**
 * 遞迴加總一棵生產樹中所有節點的 gold cost / fuel 消耗量 / fert 消耗量
 * (只取 costEntries 中 type==='gold' 的部分，避免混入 fuel/fert 的自訂單價)
 */
function sumResourceCosts(node, acc = { gold: 0, fuel: 0, fert: 0 }) {
    (node.tags.costEntries || []).forEach(entry => {
        if (entry.type === 'gold') acc.gold += entry.amount;
    });
    if (node.tags.heat) acc.fuel += node.tags.heat.rate;
    if (node.tags.bio)  acc.fert += node.tags.bio.rate;
    node.children.forEach(child => sumResourceCosts(child, acc));
    return acc;
}

/**
 * 當多目標模式下恰好有 2 個目標，且分別為 selectedFuel / selectedFert 時，
 * 解出 Fuel / Fert 相對於 Coin(=1) 的換算價值
 * 回傳 { fuelValue, fertValue } 或 null (條件不符) 
 * fuelValue/fertValue 為 null 代表無法求解 (det ≈ 0)
 */
function solveFuelFertValue(params, result) {
    if (!params.isMulti || params.targets.length !== 2) return null;

    const fuelItem = params.selectedFuel;
    const fertItem = params.selectedFert;
    if (!fuelItem || !fertItem || fuelItem === fertItem) return null;

    const itemSet = new Set(params.targets.map(tg => tg.item));
    if (!itemSet.has(fuelItem) || !itemSet.has(fertItem)) return null;

    const rootFuel = result.treeRoots.find(entry => entry.target.item === fuelItem);
    const rootFert = result.treeRoots.find(entry => entry.target.item === fertItem);
    if (!rootFuel || !rootFert) return null;

    const c1 = sumResourceCosts(rootFuel.root); // fuel 目標鏈的 x1,y1,z1
    const c2 = sumResourceCosts(rootFert.root); // fert 目標鏈的 x2,y2,z2

    const w1 = rootFuel.target.rate;
    const w2 = rootFert.target.rate;

    // (w1-y1)*Vf - z1*Vz = x1
    // -y2*Vf + (w2-z2)*Vz = x2
    const a11 = w1 - c1.fuel, a12 = -c1.fert;
    const a21 = -c2.fuel,     a22 = w2 - c2.fert;
    const det = a11 * a22 - a12 * a21;

    if (Math.abs(det) < 1e-6) {
        return { fuelValue: null, fertValue: null };
    }

    const fuelValue = (c1.gold * a22 - a12 * c2.gold) / det;
    const fertValue = (a11 * c2.gold - a21 * c1.gold) / det;

    return { fuelValue, fertValue };
}

function updateSummaryBox(p, heatPerSec, nutrPerSec, goldPerMin, actualFuelNeed, actualFertNeed, fuelFertValues) {
    let { targetItem, targetRate, selfFuel, selfFert, selectedFuel, selectedFert, fuelCost, fertCost } = p;
    if (p.isMulti) {
        targetItem = p.targets[0].item;
        targetRate = p.targets[0].rate;
    }
    const targetItemDef = DB.items[targetItem] || {};
    
    let usedRate = 0.0;
    if (targetItem === selectedFuel) usedRate += actualFuelNeed;
    if (targetItem === selectedFert) usedRate += actualFertNeed;
    if (selfFuel) heatPerSec = 0;
    if (selfFert) nutrPerSec = 0;
    let netRate = targetRate;
    if (selfFuel && targetItem === selectedFuel) netRate -= actualFuelNeed;
    if (selfFert && targetItem === selectedFert) netRate -= actualFertNeed;
    let refRate = targetRate;
    if (netRate > 0) refRate = targetRate * (targetRate / netRate);

    // --- Output Blocks ---
    let outputHtml = `<div class="stat-block"><span class="stat-label">${t('Gross Output')}</span>`;
    if (p.targets.length <= 1) {
        outputHtml += `<span class="stat-value net-positive">${targetRate.toFixed(1)} / min <img src="img/item${DB.items[targetItem]?.id ?? 0}.png" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;" title="${targetItem}"></span>
            ${usedRate > Number.EPSILON ? `<span class="stat-sub net-positive" onclick="recalculate('${targetItem}' , ${refRate})">Net: ${(targetRate - usedRate).toFixed(1)} / min <br>Used: ${usedRate.toFixed(1)} / min</span>` : ''}
            `;
        if (targetItemDef.exp) {
            outputHtml += `<span class="stat-value net-positive">${formatVal(targetRate * targetItemDef.exp)} ${t('Exp')} / min</spn>`;
        }
        outputHtml += `</div>`;
    } else {
        p.targets.forEach((target) => {
            if (!DB.items[target.item]) return;
            outputHtml += `<span class="stat-value net-positive">
            ${target.rate.toFixed(1)} / min 
            <img src="img/item${DB.items[target.item]?.id ?? 0}.png" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;" title="${target.item}">
            </span>`
        });
        outputHtml += `</div>`;
    }

    // --- Load Blocks ---
    const netText = netRate === targetRate ? '' : `(${t('Net Output')}: ${Number(netRate.toFixed(2))}/min)`;
    let loadHtml = `<div class="stat-block"><span class="stat-label">${t('Total Load')} ${netText}</span>`;
    if (goldPerMin > 0) loadHtml += `<span class="stat-value" style="color:var(--gold);" title="${Math.ceil(goldPerMin).toLocaleString()}/min">${t('Coin')}: ${formatCoinIcons(goldPerMin)}/ min</span>`;
    if (heatPerSec > 0) {
        if (p.selectedHeatingDevice === 'Steam Heating Pad') {
            const steamIcon = `<img src="img/item9002.png" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;">`;
            const steamPerMin = heatPerSec * 60 / 20;
            loadHtml += `
                <span class="stat-value stat-flex-row" style="color:var(--fuel);">
                    <span style="color:var(--fuel);">
                        ${t('Steam')}: ${(steamPerMin).toLocaleString()} ${steamIcon} / min
                    </span>
                    <span class="stat-extra" style="color:var(--warn);">
                        (${(steamPerMin / 9000).toFixed(2)} ${t('Steam Boiler', 'machines')})
                    </span>
                </span>
            `;
        }
        loadHtml += `<span class="stat-value stat-flex-row" style="color:var(--fuel);">`;
        loadHtml += `<span>${t('Heat')}: ${(actualFuelNeed).toLocaleString()}<img src="img/item${DB.items[selectedFuel]?.id ?? 0}.png" alt="${selectedFuel}" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;">/ min</span>`;
        loadHtml += `<span class="stat-extra" style="color:var(--warn);">(${(heatPerSec * 60).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} P/min)</span>`;
        loadHtml += `</span>`;
    }
    if (nutrPerSec > 0) {
        loadHtml += `<span class="stat-value stat-flex-row" style="color:var(--bio);">`;
        loadHtml += `<span>${t('Nutr')}:  ${(actualFertNeed).toLocaleString()}<img src="img/item${DB.items[selectedFert]?.id ?? 0}.png" alt="${selectedFert}" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;">/ min</span>`;
        loadHtml += `<span class="stat-extra">(${(nutrPerSec * 60).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} V/min)</span>`;
        loadHtml += `</span>`;
    }
    loadHtml += `</div>`;
    
    // --- Cost Block ---
    let costHtml = `<div class="stat-block"><span class="stat-label">${t('Unit Cost')} (${targetItem})</span>`;
    if (p.targets.length === 2 && fuelFertValues) {
        const fmtVal = (v) => (v === null || v === undefined || !isFinite(v))
            ? '—'
            : v.toLocaleString(undefined, { maximumFractionDigits: 2 });

        const fuelItemDef = DB.items[p.selectedFuel] || {};
        const fertItemDef = DB.items[p.selectedFert] || {};

        if (fuelItemDef && fertItemDef) {
            const coinIcon = `<img src="img/copper.png" width="16" height="16" style="vertical-align:middle; margin-bottom:2px;">`;
            const fuelIcon = `<img src="img/item${fuelItemDef.id}.png" width="18" height="18" style="vertical-align:middle; margin-bottom:2px;">`;
            const fertIcon = `<img src="img/item${fertItemDef.id}.png" width="18" height="18" style="vertical-align:middle; margin-bottom:2px;">`;

            costHtml += `<span class="stat-value" style="color:var(--fuel);">
                ${fuelIcon} ${t('Fuel Value')}: ${fmtVal(fuelFertValues.fuelValue)} ${coinIcon}
            </span>`;

            costHtml += `<span class="stat-value" style="color:var(--bio);">
                ${fertIcon} ${t('Fert Value')}: ${fmtVal(fuelFertValues.fertValue)} ${coinIcon}
            </span>`;

            
            if (fuelFertValues.fuelValue) {
                const costPerHeat = fuelFertValues.fuelValue / (fuelItemDef.heat * p.fuelMult);
                costHtml += `
                    <span class="stat-value stat-flex-row">
                        <span class="stat-value" style="color:var(--fuel);">
                            ${fuelIcon} ${t('Cost per Heat')}: ${costPerHeat.toFixed(4)} ${coinIcon}
                        </span>
                        <span class="stat-extra" style="color:var(--warn);">
                            (${(1/costPerHeat).toFixed(2)} P/${t('Coin')})
                        </span>
                    </span>`;
            }        
            
            if (fuelFertValues.fertValue) {
                const costPerNutr = fuelFertValues.fertValue / (fertItemDef.nutrientValue * p.fertMult);            
                costHtml += `
                    <span class="stat-value stat-flex-row">
                        <span class="stat-value" style="color:var(--bio);">
                            ${fertIcon} ${t('Cost per Nutr')}: ${costPerNutr.toFixed(4)} ${coinIcon}
                        </span>
                        <span class="stat-extra" style="color:var(--bio);">
                            (${(1/costPerNutr).toFixed(2)} V/${t('Coin')})
                        </span>
                    </span>`;
            }
        }
    }
    else {
        if (goldPerMin > 0) costHtml += `<span class="stat-value" style="color:var(--gold); title="${(goldPerMin / netRate).toLocaleString()}">${t('Coin')}: ${formatCoinIcons(goldPerMin/netRate)}</span>`;
        if (heatPerSec > 0) {
            if (p.selectedHeatingDevice === 'Steam Heating Pad') {
                const steamIcon = `<img src="img/item9002.png" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;">`;
                const steamPerItem = heatPerSec * 60 / netRate / 20;
                costHtml += `
                    <span class="stat-value stat-flex-row" style="color:var(--fuel);">
                        <span style="color:var(--fuel);">
                            ${t('Steam')}: ${(steamPerItem).toLocaleString()} ${steamIcon}
                        </span>
                        <span class="stat-extra" style="color:var(--warn);">
                            (${(steamPerItem / 9000).toFixed(2)} ${t('Steam Boiler', 'machines')})
                        </span>
                    </span>
                `;
            }
            costHtml += `<span class="stat-value stat-flex-row" style="color:var(--fuel);">`;
            costHtml += `<span>${t('Heat')}: ${(actualFuelNeed/netRate).toLocaleString()}<img src="img/item${DB.items[selectedFuel]?.id ?? 0}.png" alt="${selectedFuel}" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;"> </span>`;
            costHtml += `<span class="stat-extra" style="color:var(--warn);">(${(heatPerSec * 60 / netRate).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} P)</span>`;
            costHtml += `</span>`;
        }
        if (nutrPerSec > 0) { 
            costHtml += `<span class="stat-value stat-flex-row" style="color:var(--bio);">`;
            costHtml += `<span>${t('Nutr')}: ${(actualFertNeed/netRate).toLocaleString()}<img src="img/item${DB.items[selectedFert]?.id ?? 0}.png" alt="${selectedFert}" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;"> </span>`;
            costHtml += `<span class="stat-extra">(${(nutrPerSec * 60 / netRate).toLocaleString(undefined, {minimumFractionDigits: 1, maximumFractionDigits: 1})} V)</span>`;
            costHtml += `</span>`;
        }
    }
    costHtml += `</div>`;

    // --- Value Block ---
    let valueHtml = `<div class="stat-block"><span class="stat-label">${t('Unit Value')} (${targetItem})</span>`;
    if (true) {
        const convertedCost = (goldPerMin + (selfFuel ? 0 : fuelCost * actualFuelNeed) +  (selfFert ? 0 : fertCost * actualFertNeed)) / netRate;
        valueHtml += `<span class="stat-value gold-profit">${t('Conversion Cost')}: ${Math.ceil(convertedCost).toLocaleString()}</span>`;
        
        if (targetItemDef.sellPrice) {
            const effectiveSell = targetItemDef.category !== 'Currency' ? Math.round(targetItemDef.sellPrice * p.sellMult) : targetItemDef.sellPrice;
            const ratio = convertedCost > 0 ? effectiveSell / convertedCost : 0;
            const margin = ratio - 1;
            valueHtml += `<span>`
            valueHtml += `<span class="stat-value gold-profit">${t('Retail Price   ')}: ${effectiveSell.toLocaleString()} </span>`;
            if (margin > -1) valueHtml += margin > 0 ? `<span class="stat-pos">(+${(margin*100).toFixed(0)}%)</span>` : `<span class="stat-sub">(${(margin*100).toFixed(0)}%)</span>`;
            valueHtml += `</span>`
        }
        if (targetItemDef.wholesalePrice) {
            const ratio = convertedCost > 0 ? targetItemDef.wholesalePrice  / convertedCost : 0;
            const margin = ratio - 1;
            valueHtml += `<span>`
            valueHtml += `<span class="stat-value gold-profit">${t('Wholesale Price')}: ${targetItemDef.wholesalePrice.toLocaleString()} </span>`;
            if (margin > -1) valueHtml += margin > 0 ? `<span class="stat-pos">(+${(margin*100).toFixed(0)}%)</span>` : `<span class="stat-sub">(${(margin*100).toFixed(0)}%)</span>`;
            valueHtml += `</span>`
        }
        if (targetItemDef.exp) {
            valueHtml += `<span class="stat-value gold-profit">${t('Cost Per Exp   ')}: ${Math.ceil(convertedCost/targetItemDef.exp).toLocaleString()}</span>`;
        }
    }
    valueHtml += `</div>`;

    // --- Combine ---
    document.getElementById('summary-container').innerHTML = `
        <div class="summary-box">
            ${outputHtml}            
            ${loadHtml}
            ${costHtml}
            ${valueHtml}
        </div>`;
}

/* ==========================================================================
   SECTION: SCALE MODAL
   ========================================================================== */

// 暫存目前 modal 的基準數值（套用後更新）
let _scaleModalBase = null;

function openScaleModal(itemName, requestedRate, machineCount, ratePerMachine) {
    const itemDef = DB.items[itemName] || {};
    const beltSpeed = getBeltSpeed(parseInt(document.getElementById('lvlBelt').value) || 0);

    // 基準數值
    _scaleModalBase = {
        itemName,
        rate: requestedRate,
        machineCount,
        ratePerMachine,
        beltSpeed
    };

    // 標題 icon + 名稱
    const iconId = itemDef.id ?? 0;
    document.getElementById('scale-modal-title').innerHTML = `${t('Adjust Ratio')} <img src="img/item${iconId}.png" width="24" height="24" style="vertical-align:middle;"> ${itemName}`;

    // 填入左側舊值
    document.getElementById('scale-old-rate').innerText = Number(requestedRate.toFixed(4));
    document.getElementById('scale-old-belt').innerText = Number((requestedRate / beltSpeed).toFixed(4));

    // 機器區域顯示/隱藏
    const machineRow = document.getElementById('scale-machine-row');
    if (machineCount !== null && machineCount !== undefined && ratePerMachine !== null && ratePerMachine !== undefined && machineCount > 0) {
        machineRow.style.display = '';
        document.getElementById('scale-old-machine').innerText = Number(machineCount.toFixed(4));
    } else {
        machineRow.style.display = 'none';
    }

    // 右側新值初始填入（等於舊值）
    document.getElementById('scale-new-rate').value = Number(requestedRate.toFixed(4));
    document.getElementById('scale-new-belt').value = Number((requestedRate / beltSpeed).toFixed(4));
    if (machineCount !== null && machineCount !== undefined && machineCount > 0) {
        document.getElementById('scale-new-machine').value = Number(machineCount.toFixed(4));
    }

    // 縮放比初始為 1
    document.getElementById('scale-ratio-display').innerText = '1.000';
    document.getElementById('scale-modal').style.display = 'flex';
}

function onScaleInputChange(source) {
    if (!_scaleModalBase) return;
    const { rate: baseRate, beltSpeed, machineCount, ratePerMachine } = _scaleModalBase;

    let ratio = 1;

    if (source === 'rate') {
        const newRate = parseFloat(document.getElementById('scale-new-rate').value) || 0;
        ratio = baseRate > 0 ? newRate / baseRate : 0;
    } else if (source === 'belt') {
        const newBelt = parseFloat(document.getElementById('scale-new-belt').value) || 0;
        ratio = baseRate > 0 ? (newBelt * beltSpeed) / baseRate : 0;
    } else if (source === 'machine') {
        const newMachine = parseFloat(document.getElementById('scale-new-machine').value) || 0;
        ratio = baseRate > 0 ? (newMachine * ratePerMachine) / baseRate : 0;
    }

    // 更新其他欄位
    if (source !== 'rate') {
        document.getElementById('scale-new-rate').value = Number((baseRate * ratio).toFixed(4));
    }
    if (source !== 'belt') {
        document.getElementById('scale-new-belt').value = Number(((baseRate * ratio) / beltSpeed).toFixed(4));
    }
    if (source !== 'machine' && machineCount !== null && machineCount !== undefined && machineCount > 0) {
        const rpm = ratePerMachine > 0 ? ratePerMachine : 1;
        document.getElementById('scale-new-machine').value = Number(((baseRate * ratio) / rpm).toFixed(4));
    }

    document.getElementById('scale-ratio-display').innerText = ratio.toFixed(3);
}

function applyScaleModal() {
    if (!_scaleModalBase) return;

    const { rate: baseRate, beltSpeed, machineCount, ratePerMachine } = _scaleModalBase;
    const newRate = parseFloat(document.getElementById('scale-new-rate').value) || 0;
    const ratio = baseRate > 0 ? newRate / baseRate : 1;
    const isMulti = document.getElementById('modeToggle').checked;

    if (!isMulti) {
        // 單目標模式
        const rateEl = document.getElementById('targetRate');
        const currentRate = parseFloat(rateEl.value) || 0;
        const newRate = currentRate * ratio;
        rateEl.value = newRate;

        // 若目前是機器模式，要切換回 rate 模式才能寫入
        const machineToggle = document.getElementById('machineModeToggle');
        if (machineToggle.checked) {
            machineToggle.checked = false;
            toggleControlMode(false);
        }
    } else {
        // 多目標模式：對所有列等比縮放
        document.querySelectorAll('.multi-target-row').forEach(row => {
            const input = row.querySelector('.multi-rate-input');
            if (input) {
                const cur = parseFloat(input.value) || 0;
                input.value = cur * ratio;
            }
        });
    }

    calculate();

    // 套用後更新基準值（讓使用者可繼續疊加）
    const newBaseRate = _scaleModalBase.rate * ratio;
    _scaleModalBase.rate = newBaseRate;
    if (_scaleModalBase.machineCount !== null && _scaleModalBase.machineCount !== undefined) {
        _scaleModalBase.machineCount = _scaleModalBase.machineCount * ratio;
    }

    // 更新左側舊值顯示
    document.getElementById('scale-old-rate').innerText = Number(newBaseRate.toFixed(4));
    document.getElementById('scale-old-belt').innerText = Number((newBaseRate / _scaleModalBase.beltSpeed).toFixed(4));
    if (_scaleModalBase.machineCount !== null && _scaleModalBase.machineCount !== undefined && _scaleModalBase.machineCount > 0) {
        document.getElementById('scale-old-machine').innerText = Number(_scaleModalBase.machineCount.toFixed(4));
    }

    // 右側新值同步（縮放比歸 1）
    document.getElementById('scale-new-rate').value = Number(newBaseRate.toFixed(4));
    document.getElementById('scale-new-belt').value = Number((newBaseRate / _scaleModalBase.beltSpeed).toFixed(4));
    if (_scaleModalBase.machineCount !== null && _scaleModalBase.machineCount !== undefined && _scaleModalBase.machineCount > 0) {
        document.getElementById('scale-new-machine').value = Number(_scaleModalBase.machineCount.toFixed(4));
    }
    document.getElementById('scale-ratio-display').innerText = '1.000';
}
