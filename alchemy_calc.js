/* ==========================================================================
   ALCHEMY CALCULATOR CORE ENGINE
   Handles recursion, math, and tree node generation.
   ========================================================================== */

const GLOBAL_CALC_STATE = {
    activeRecyclers: new Set(),
    forcedExternals: new Set(),
    collapsedNode: new Set(['ext_gold', 'ext_fuel', 'ext_fert'])
};

/* ==========================================================================
   SECTION: HELPER MATH FUNCTIONS
   ========================================================================== */
function getBeltSpeed(lvl) { return AlchemyCalcEngine.getBeltSpeed(lvl); }
function getSpeedMult(lvl) { return AlchemyCalcEngine.getSpeedMult(lvl); }
function getAlchemyMult(lvl) { return AlchemyCalcEngine.getAlchemyMult(lvl); }

function getRecipesFor(item) { return AlchemyCalcEngine.getRecipesFor(DB, item); }
function getActiveRecipe(item) {
    return AlchemyCalcEngine.getActiveRecipe(DB, { preferredRecipes: DB.settings.preferredRecipes, recipeModifiers: DB.settings.recipeModifiers }, item);
}

function applyAlchemyMult(machineName, batchYield, alchemyMult) {
    return AlchemyCalcEngine.applyAlchemyMult(machineName, batchYield, alchemyMult);
}

function getProductionHeatCost(item, speedMult, alchemyMult) {
    return AlchemyCalcEngine.getProductionHeatCost(DB, { preferredRecipes: DB.settings.preferredRecipes }, item, speedMult, alchemyMult);
}

function getProductionFertCost(item, fertVal, fertSpeed, speedMult, alchemyMult) {
    return AlchemyCalcEngine.getProductionFertCost(DB, { preferredRecipes: DB.settings.preferredRecipes }, item, fertVal, fertSpeed, speedMult, alchemyMult);
}

function formatVal(val) { if(val >= 1000000) return Number((val/1000000).toFixed(2)) + 'm'; if(val >= 10000) return Number((val/1000).toFixed(2)) + 'k'; return Number(val.toFixed(3)); }

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
        
        const params = gatherInputs();
        updateLabels(params);
        const result = AlchemyCalcEngine.runCalculation({
            db: DB,
            params,
            state: {
                activeRecyclers: GLOBAL_CALC_STATE.activeRecyclers,
                forcedExternals: GLOBAL_CALC_STATE.forcedExternals,
                preferredRecipes: DB.settings.preferredRecipes,
                recipeModifiers: DB.settings.recipeModifiers
            }
        });

        renderCalculationResult(params, result);

        // --- PASS 3: TRANSLATION --- (extra)
        translateText();
        updateURL();

    } catch(e) { console.error(e); }
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
    const selfFuel = document.getElementById('selfFuel').checked;
    const fuelCost = parseFloat(document.getElementById('fuelCostInput').value) || 0;

    const selectedFert = document.getElementById('fertSelect').value;
    const selfFert = document.getElementById('selfFert').checked;
    const fertCost = parseFloat(document.getElementById('fertCostInput').value) || 0;

    const showFuelCost = document.getElementById('fuelCostEnable').checked;
    const showFertCost = document.getElementById('fertCostEnable').checked;
    const showMaxCap = document.getElementById('showMaxCap').checked;
    const showHeatFert = document.getElementById('showHeatFert').checked;
    const showBeltCount = document.getElementById('showBeltCount').checked;

    const lvlSpeed = parseInt(document.getElementById('lvlSpeed').value) || 0;
    const lvlBelt = parseInt(document.getElementById('lvlBelt').value) || 0;
    const lvlFuel = parseInt(document.getElementById('lvlFuel').value) || 0;
    const lvlAlchemy = parseInt(document.getElementById('lvlAlchemy').value) || 0;
    const lvlFert = parseInt(document.getElementById('lvlFert').value) || 0;

            
    const isMachineMode = document.getElementById('machineModeToggle').checked;
    const recipe = getActiveRecipe(targetItem);
    const machineName = recipe ? "(" + t(recipe.machine, 'machines') + ")" : "N/A";
    document.getElementById('active-machine-name').innerText = machineName;        

    if (recipe) {
        let batchYield = recipe.outputs[targetItem] || 1;
        batchYield = applyAlchemyMult(recipe.machine, batchYield, getAlchemyMult(lvlAlchemy));
        let recipeTime = recipe.baseTime || 1;
        const recipeNtrientCost = recipe.nutrientCost || 0;
        if (recipeNtrientCost > 0 && recipe.machine === "Nursery") {
            let fertilitySpeed = DB.items[selectedFert]?.maxFertility || 1;
            recipeTime =  recipeNtrientCost / fertilitySpeed;
        }
        let ratePerMachine = (60 / (recipeTime || 1)) * getSpeedMult(lvlSpeed) * batchYield;        
        if (!(DB.items[targetItem].liquid)) {
            let beltSpeed = getBeltSpeed(lvlBelt);
            if (DB.items[targetItem].category === "Currency") beltSpeed *= 50; // 貨幣輸出為50個1堆疊
            else if (recipe.sharedOutputs) beltSpeed /= recipe.sharedOutputs; // 共用輸出口(龍膽花)
            ratePerMachine = Math.min(ratePerMachine, beltSpeed);
        }
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
        selectedFert, selfFert, fertCost, showFertCost,
        showMaxCap, showHeatFert, showBeltCount,
        lvlSpeed, lvlBelt, lvlFuel, lvlAlchemy, lvlFert,        
        beltSpeed: getBeltSpeed(lvlBelt),
        speedMult: getSpeedMult(lvlSpeed),
        alchemyMult: getAlchemyMult(lvlAlchemy),
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
        
        const fuelDef = DB.items[params.selectedFuel] || {};
        const netHeat = (fuelDef.heat || 0) * params.fuelMult;
        document.getElementById('fuelEfficiencyCostByHeat').innerText = (params.fuelCost == 0 || netHeat == 0) ? '' : (params.fuelCost/netHeat).toFixed(4) + ' G/P ';
        document.getElementById('fuelEfficiencyHeatByCost').innerText = (params.fuelCost == 0 || netHeat == 0) ? '' : (netHeat/params.fuelCost).toFixed(2) + ' P/G ';

        const fertDef = DB.items[params.selectedFert] || {};
        const netNtur = (fertDef.nutrientValue || 0) * params.fertMult;
        document.getElementById('fertEfficiencyCostByNutr').innerText = (params.fertCost == 0 || netNtur == 0) ? '' : (params.fertCost/netNtur).toFixed(4) + ' G/V ';
        document.getElementById('fertEfficiencyNutrByCost').innerText = (params.fertCost == 0 || netNtur == 0) ? '' : (netNtur/params.fertCost).toFixed(2) + ' V/G ';

    } catch(e) { console.error(e); }
}

function renderCalculationResult(params, result) {
    const treeContainer = document.getElementById('tree');
    treeContainer.innerText = '';

    result.treeRoots.forEach(entry => {
        const div = document.createElement('div');
        div.style.marginTop = '25px';
        div.style.marginBottom = '8px';
        div.style.paddingBottom = '4px';
        div.style.borderBottom = '1px dashed #555';
        div.innerHTML = `
            <span class="section-header">--- ${t('Production Chain')} (${entry.target.item}) ---</span>
            <span style="margin-left:auto; cursor:pointer;">
                <span class="section-header" onclick="setAllRecycling(true)">[${t('Recycle All')}]</span>
                <span class="section-header" onclick="setAllRecycling(false)">[${t('Un-recycle All')}]</span>
                <span class="section-header" onclick="toggleFirstLevel()" title="Toggle First Level" style="margin-right:10px;">💠</span>
            </span>
        `;
        treeContainer.appendChild(div);
        treeContainer.appendChild(renderTreeNode(params, entry.root));
    });

    result.internalModules.forEach(module => {
        const h = document.createElement('div');
        h.className = 'section-header';
        h.innerText = module.type === 'fert'
            ? `--- ${t('Internal Nutrient Module')} (${module.item}) ---`
            : `--- ${t('Internal Heat Module')} (${module.item}) ---`;
        treeContainer.appendChild(h);
        treeContainer.appendChild(renderTreeNode(params, module.root));
    });

    renderExternalInputsSection(treeContainer, params, result.externalInputs);
    renderByproductsSection(treeContainer, result.byproducts);
    renderCommonNodesSection(treeContainer, params, result.commonNodes);

    updateConstructionList(
        result.construction.maxCounts,
        result.construction.minCounts,
        result.construction.furnaces,
        result.construction.extraBuildCosts
    );

    updateSummaryBox(
        params,
        result.summary.heatLoad,
        result.summary.bioLoad,
        result.summary.goldPerMin,
        result.summary.fuelDemandItems,
        result.summary.fertDemandItems
    );

    updateSummaryLineFromResult(params, result.formulaLineData);
}

function createSectionHeader(title) {
    const div = document.createElement('div');
    div.style.marginTop = '25px';
    div.style.marginBottom = '8px';
    div.style.paddingBottom = '4px';
    div.style.borderBottom = '1px dashed #555';
    div.innerHTML = `
        <span class="section-header">${title}</span>
        <span style="margin-left:auto; cursor:pointer;">
            <span class="section-header" onclick="toggleNodesInSection(this, false)">[${t('Expand All')}]</span>
            <span class="section-header" onclick="toggleNodesInSection(this, true)">[${t('Collapse All')}]</span>
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

function renderCostEntries(costEntries) {
    return costEntries.map(entry => {
        const amount = Math.ceil(entry.amount - Number.EPSILON).toLocaleString();
        if (entry.type === 'gold') return `<span class="cost-tag">-${amount} G/m</span>`;
        return `<span class="cost-tag">(${amount} G/m)</span>`;
    }).join('');
}

function renderTreeNode(params, node) {
    const itemDef = DB.items[node.item] || {};
    const div = document.createElement('div');
    div.className = 'node';
    div.setAttribute('data-depth', node.depth % 10);
    div.setAttribute('data-path', node.pathKey);
    if (GLOBAL_CALC_STATE.collapsedNode.has(node.pathKey)) div.classList.add('collapsed');

    const hasChildren = node.children.length > 0;    
    const machineCountArg = node.machine ? node.machineCount : null;
    const rpmArg = node.machine ? (node.requestedRate / node.machineCount) : null;
    
    const arrowHtml = `<span class="tree-arrow" style="visibility:${hasChildren ? 'visible' : 'hidden'}" onclick="toggleNode(this, '${node.pathKey}')">▼</span>`;
    const rateHtml = `<span class="qty qty-clickable" onclick="openScaleModal('${node.item}', ${node.requestedRate}, ${machineCountArg}, ${rpmArg})">${formatVal(node.requestedRate)}/m</span>`;
    const beltCountTag = node.tags.beltRatio !== null ? `<span class="belt-count">(${Number(node.tags.beltRatio.toFixed(2))})</span>` : '';
    const itemTag = `<img src="img/item${itemDef?.id ?? 0}.png" width="24" height="24" loading="lazy">
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
        machineTag = `<span class="machine-tag" data-tooltip="${tooltipText}">${Math.ceil(node.machineCount - 0.0001)} ${t(node.machine, 'machines')}${capTag}</span>`;
        const recipeCandidates = getRecipesFor(node.item);
        const hasCauldronTarget = itemDef && itemDef.cauldronTarget !== undefined;
        const hasRecipeModifier = recipeCandidates?.length === 1 && recipeCandidates[0].machine === 'Advanced Athanor';
        if (recipeCandidates.length > 1 || hasCauldronTarget || hasRecipeModifier) {
            swapBtn = `<button class="swap-btn" onclick="openRecipeModal('${node.item}')" title="${t('Swap Recipe')}">🔄</button>`;
        }
    }

    const byproductTag = node.tags.byproducts.map(entry => `<span class="byproduct-tag">+${formatVal(entry.rate)}/m ${entry.item}</span>`).join('');

    let bioTag = '';
    if (node.tags.bio) {
        let bioText = `-${formatVal(node.tags.bio.rate)}/m ${params.selectedFert}`;
        if (params.showHeatFert) bioText += ` (${formatVal(node.tags.bio.nutrientPerSec)} V/s)`;
        bioTag = `<span class="bio-tag">${bioText}</span>`;
    }

    let heatTag = '';
    if (node.tags.heat) {
        let heatText = `-${formatVal(node.tags.heat.rate)}/m ${params.selectedFuel}`;
        if (params.showHeatFert) heatText += ` (${formatVal(node.tags.heat.heatPerSec)} P/s)`;
        heatTag = `<span class="heat-tag">${heatText}</span>`;
    }

    let outputTag = '';
    if (node.tags.output) outputTag = `<span class="output-tag">${t('Yields')}: ${(node.tags.output.multiplier * 100).toFixed(0)}%</span>`;

    let recycleTag = '';
    if (node.canRecycle) {
        if (node.recycleActive) {
            recycleTag = `<div><button class="recycle-btn active" onclick="toggleRecycle('${node.pathKey}')">♻️ ${formatVal(node.deductionRate)} ${t('Used')}</button></div>`;
        } else {
            recycleTag = `<div><button class="recycle-btn" onclick="toggleRecycle('${node.pathKey}')">♻️ ${formatVal(node.recycleAvailable)} ${t('Avail')}</button></div>`;
        }
    }

    const externalTag = `<div><input type="checkbox" ${node.isExternal ? 'checked':''} onchange="toggleExternal('${node.pathKey}');"></input></div>`;
    const costTag = renderCostEntries(node.tags.costEntries);

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

        const machineLabel = `<span class="machine-tag" data-tooltip="${buildRecipeTooltip(entry.tooltipData)}">${Math.ceil(entry.totalMachines - 0.0001)} ${t(entry.machine, 'machines')}</span>`;
        const heatTag = entry.totalFuelRate > 0.0001 ? `<span class="heat-tag">-${formatVal(entry.totalFuelRate)}/m ${params.selectedFuel}</span>` : '';
        const bioTag = entry.totalFertRate > 0.0001 ? `<span class="bio-tag">-${formatVal(entry.totalFertRate)}/m ${params.selectedFert}</span>` : '';

        let childrenHtml = '';
        entry.instances.forEach(inst => {
            childrenHtml += `
                <div class="node-content" style="margin-bottom:2px; border-bottom:1px dashed #333; opacity:0.8;">
                    <span class="qty" style="min-width:60px; display:inline-block;">${formatVal(inst.rate)}/m</span>
                    <span style="font-size:0.85em; color: #FFF; margin-right:5px;">${Math.ceil(inst.machines - 0.0001)} ${t(entry.machine, 'machines')}</span>
                    <span class="details" style="font-size:0.85em; cursor:pointer;" onclick="jumpToNode('${inst.pathKey}')">[ ${inst.pathKey} ]</span>
                </div>
            `;
        });

        div.innerHTML = `
            <div class="node-content" style="background: rgba(76, 175, 80, 0.05); border-left: 3px solid var(--accent);">
                <span class="tree-arrow" onclick="toggleNode(this, '${pathKey}')">▼</span>
                <span class="qty">${formatVal(entry.totalRate)}/m</span>
                <img src="img/item${DB.items[entry.item]?.id ?? 0}.png" width="24" height="24">
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
                    <span class="qty" style="color:var(--gold); min-width:80px; display:inline-block;">${Math.ceil(src.gold).toLocaleString()} G/m</span>
                    <img src="img/item${DB.items[src.item]?.id ?? 0}.png" width="20" height="20">
                    <span class="details" style="font-size:0.85em; cursor:pointer;" onclick="jumpToNode('${src.pathKey}')">[ ${src.pathKey} ]</span>
                </div>`;
        });
        createExtNode(
            `${t('Raw Material Cost')} (${externalInputs.rawMaterialCost.sources.length})`,
            `${Math.ceil(externalInputs.rawMaterialCost.totalGoldPerMin).toLocaleString()} G/m`,
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
            `<img src="img/item${DB.items[externalInputs.fuel.item]?.id ?? 0}.png" width="24" height="24"> `
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
            `<img src="img/item${DB.items[externalInputs.fert.item]?.id ?? 0}.png" width="24" height="24"> `
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
            `<img src="img/item${DB.items[entry.item]?.id ?? 0}.png" width="24" height="24"> `
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
                    <span class="qty" style="min-width:60px; display:inline-block; ${inst.rate > 0.0001 ? 'color:var(--byproduct);' : ''}">${formatVal(inst.rate)}/m</span>
                    <span class="machine-tag" data-tooltip="${buildRecipeTooltip(inst.tooltipData)}">${Math.ceil(inst.machineCount)} ${t(inst.recipe.machine, 'machines')}</span>
                    <span class="details" style="font-size:0.85em; cursor:pointer;" onclick="jumpToNode('${inst.pathKey}')">[ ${inst.pathKey} ]</span>
                </div>
            `;
        });

        div.innerHTML = `
            <div class="node-content" style="background: rgba(213, 109, 231, 0.03); border-left: 3px solid var(--byproduct);">
                <span class="tree-arrow" onclick="toggleNode(this, '${pathKey}')">▼</span>
                <span class="qty" style="color:var(--byproduct)">${formatVal(entry.remaining)}/m</span>
                <img src="img/item${DB.items[entry.item]?.id ?? 0}.png" width="24" height="24" loading="lazy">
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
        if (target.rate > 0.0001) summaryLine += formattedText(target.item, target.rate, 'profit');
    });

    Object.entries(formulaLineData.availableByproducts).forEach(([name, rate]) => {
        if (rate > 0.0001) summaryLine += formattedText(name, rate, 'byproduct');
    });

    document.getElementById('summary-line').innerHTML = summaryLine;
}

/* ==========================================================================
   SECTION: JS - DOM RENDERING
   ========================================================================== */
function updateConstructionList(maxCounts, minCounts, furnaces, extraBuildCosts) {
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
        li.innerHTML = `<div class="build-header" onclick="toggleBuildGroup(this.parentNode)"><span><span class="build-arrow">▶</span> ${t(m, 'machines')}</span> <span class="build-count">${label}</span></div>${subListHtml}`;
        buildList.appendChild(li);
    });

    // Stone Furnaces (Calculated as shared sources, but can scale in MAX mode if nodes are separate)
    if(furnaces > 0) {
        const li = document.createElement('li'); li.className = 'build-group';
        const mName = "Stone Furnace";
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
        li.innerHTML = `<div class="build-header" style="border-top:1px dashed #555" onclick="toggleBuildGroup(this.parentNode)"><span><span class="build-arrow">▶</span> ${t('Stone Furnace', 'machines')}</span> <span class="build-count" style="color:var(--warn)">${count}</span></div>${subListHtml}`;
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


function updateSummaryBox(p, heatPerSec, nutrPerSec, goldPerMin, actualFuelNeed, actualFertNeed) {
    const { targetItem, targetRate, selfFuel, selfFert, selectedFuel, selectedFert, fuelCost, fertCost } = p;
    const targetItemDef = DB.items[targetItem] || {};
    
    let usedRate = 0.0;
    if (selfFuel && targetItem === selectedFuel) usedRate += actualFuelNeed;
    if (selfFert && targetItem === selectedFert) usedRate += actualFertNeed;
    if (selfFuel) heatPerSec = 0;
    if (selfFert) nutrPerSec = 0;
    const netRate = targetRate - usedRate;
    let refRate = targetRate;
    if (netRate > 0) refRate = targetRate * (targetRate / netRate);

    // --- Output Blocks ---
    let outputHtml = `<div class="stat-block"><span class="stat-label">${t('Gross Output')}</span>`;
    if (!p.isMulti) {
        outputHtml += `<span class="stat-value net-positive">${targetRate.toFixed(1)} / min <img src="img/item${DB.items[targetItem]?.id ?? 0}.png" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;"></span>
            ${usedRate > Number.EPSILON ? `<span class="stat-sub" onclick="recalculate('${targetItem}' , ${refRate})">Net: ${netRate.toFixed(1)} / min <br>Used: ${usedRate.toFixed(1)} / min</span>` : ''}
            </div>`;
    } else {
        p.targets.forEach((target) => {
            if (!DB.items[target.item]) return;
            outputHtml += `<span class="stat-value net-positive">
            ${target.rate.toFixed(1)} / min 
            <img src="img/item${DB.items[target.item]?.id ?? 0}.png" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;">
            </span>`
        });
        outputHtml += `</div>`;
    }

    // --- Load Blocks ---
    let loadHtml = `<div class="stat-block"><span class="stat-label">${t('Total Load')}</span>`;
    if (goldPerMin > 0) loadHtml += `<span class="stat-value" style="color:var(--gold);">${t('Coin')}: ${Math.ceil(goldPerMin).toLocaleString()} G / min</span>`;
    if (heatPerSec > 0) {
        loadHtml += `<span>`;
        loadHtml += `<span class="stat-value" style="color:var(--fuel);">${t('Heat')}: ${(heatPerSec * 60).toLocaleString()} P / min</span>`;
        loadHtml += ` ( ${(actualFuelNeed).toLocaleString()}<img src="img/item${DB.items[selectedFuel]?.id ?? 0}.png" alt="${selectedFuel}" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;">/min )`;
        loadHtml += `</span>`;
    }
    if (nutrPerSec > 0) {
        loadHtml += `<span>`;
        loadHtml += `<span class="stat-value" style="color:var(--bio);">${t('Nutr')}: ${(nutrPerSec * 60).toLocaleString()} V / min</span>`;
        loadHtml += `  ( ${(actualFertNeed).toLocaleString()}<img src="img/item${DB.items[selectedFert]?.id ?? 0}.png" alt="${selectedFert}" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;">/min )`;
        loadHtml += `</span>`;
    }
    loadHtml += `</div>`;
    
    // --- Cost Block ---
    let costHtml = `<div class="stat-block"><span class="stat-label">${t('Unit Cost')}</span>`;
    if (!p.isMulti) {
        if (goldPerMin > 0) costHtml += `<span class="stat-value" style="color:var(--gold);">${t('Coin')}: ${(goldPerMin / netRate).toLocaleString()} G</span>`;
        if (heatPerSec > 0) {
            costHtml += `<span>`
            costHtml += `<span class="stat-value" style="color:var(--fuel);">${t('Heat')}: ${(heatPerSec * 60 / netRate).toLocaleString()} P</span>`;
            costHtml += `  ( ${(actualFuelNeed/netRate).toLocaleString()}<img src="img/item${DB.items[selectedFuel]?.id ?? 0}.png" alt="${selectedFuel}" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;"> )`;
            costHtml += `</span>`;
        }
        if (nutrPerSec > 0) { 
            costHtml += `<span>`
            costHtml += `<span class="stat-value" style="color:var(--bio);">${t('Nutr')}: ${(nutrPerSec * 60 / netRate).toLocaleString()} V</span>`;
            costHtml += `  ( ${(actualFertNeed/netRate).toLocaleString()}<img src="img/item${DB.items[selectedFert]?.id ?? 0}.png" alt="${selectedFert}" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;"> )`;
            costHtml += `</span>`;
        }
    }
    costHtml += `</div>`;

    // --- Value Block ---
    let valueHtml = `<div class="stat-block"><span class="stat-label">${t('Unit Value')}</span>`;
    if (!p.isMulti) {
        const convertedCost = (goldPerMin + fuelCost * actualFuelNeed + fertCost * actualFertNeed) / netRate;
        valueHtml += `<span class="stat-value gold-profit">${t('Conversion Cost')}: ${(convertedCost).toLocaleString()}</span>`;
        
        if (targetItemDef.sellPrice) {
            const ratio = convertedCost > 0 ? targetItemDef.sellPrice  / convertedCost : 0;
            valueHtml += `<span class="stat-value gold-profit">${t('Retail Price   ')}: ${targetItemDef.sellPrice.toLocaleString()} (${(ratio * 100).toFixed(1)}%)</span>`;
        }
        if (targetItemDef.wholesalePrice) {
            const ratio = convertedCost > 0 ? targetItemDef.wholesalePrice  / convertedCost : 0;
            valueHtml += `<span class="stat-value gold-profit">${t('Wholesale Price')}: ${targetItemDef.wholesalePrice.toLocaleString()} (${(ratio * 100).toFixed(1)}%)</span>`;
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

    const ratio = parseFloat(document.getElementById('scale-ratio-display').innerText) || 1;
    const isMulti = document.getElementById('modeToggle').checked;

    if (!isMulti) {
        // 單目標模式
        const rateEl = document.getElementById('targetRate');
        const currentRate = parseFloat(rateEl.value) || 0;
        const newRate = currentRate * ratio;
        rateEl.value = Number(newRate.toFixed(2));

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
                input.value = Number((cur * ratio).toFixed(2));
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
