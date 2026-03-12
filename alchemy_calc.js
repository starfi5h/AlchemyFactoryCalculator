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
function getBeltSpeed(lvl) { let s = 60; if(lvl>0) s += Math.min(lvl,12)*15; if(lvl>12) s += (lvl-12)*3; return s; }
function getSpeedMult(lvl) { let m = 1.0; m += Math.min(lvl,12)*0.25; if(lvl>12) m += (lvl-12)*0.05; return m; }
function getAlchemyMult(lvl) { if(lvl<=0) return 1.0; let p = 0; for(let i=1; i<=lvl; i++) { if(i<=2) p+=6; else if(i<=8) p+=8; else p+=10; } return 1.0 + (p/100); }

function getRecipesFor(item) { if(!DB.recipes) return []; return DB.recipes.filter(r => r.outputs[item]); }
function getActiveRecipe(item) {
    const candidates = getRecipesFor(item);
    if(candidates.length === 0) return null; if(candidates.length === 1) return candidates[0];
    const prefId = DB.settings.preferredRecipes[item];
    if(prefId) { const found = candidates.find(r => r.id === prefId); if(found) return found; }
    return candidates[0];
}

function applyAlchemyMult(machineName, batchYield, alchemyMult) {
    if (["Extractor", "Thermal Extractor", "Alembic", "Advanced Alembic"].includes(machineName)) {
        batchYield *= alchemyMult;
        if (machineName === "Thermal Extractor") batchYield *= 3;
    }
    return batchYield;
}

function getRecipeNutrientCost(recipe) {
    if (!recipe) return 0;
    if (recipe.machine !== "Nursery" && recipe.machine !== "World Tree Nursery") {
        return 0; // 非 Nursery 配方無營養成本
    }
    
    let totalCost = 0;
    Object.keys(recipe.outputs).forEach(itemName => {
        const itemDef = DB.items[itemName] || {};
        const quantity = recipe.outputs[itemName];
        const nutrientCost = itemDef.nutrientCost || 0;
        totalCost += quantity * nutrientCost;
    });
    
    return totalCost;
}

function getProductionHeatCost(item, speedMult, alchemyMult) {
    let cost = 0; const recipe = getActiveRecipe(item);
    if (recipe && recipe.outputs[item]) {
         let batchYield = recipe.outputs[item];
         batchYield = applyAlchemyMult(recipe.machine, batchYield, alchemyMult);
         if (DB.machines[recipe.machine] && DB.machines[recipe.machine].heatCost) {
            const mach = DB.machines[recipe.machine]; const parent = DB.machines[mach.parent];
            const slotsReq = mach.slotsRequired || 1; const pSlots = mach.parentSlots || parent.slots || 3;
            const heatPs = (mach.heatCost * speedMult) + (parent.heatSelf / (pSlots/slotsReq)); 
            cost += heatPs * ((recipe.baseTime / speedMult) / batchYield);
        }
        Object.keys(recipe.inputs).forEach(k => { 
            cost += getProductionHeatCost(k, speedMult, alchemyMult) * (recipe.inputs[k] / batchYield); 
        });
    }
    return cost;
}

function getProductionFertCost(item, fertVal, fertSpeed, speedMult, alchemyMult) {
    let cost = 0; const itemDef = DB.items[item] || {};
    if (itemDef.category === "Herbs" && itemDef.nutrientCost) cost += itemDef.nutrientCost;
    const recipe = getActiveRecipe(item);
    if (recipe && recipe.outputs[item]) {
        let batchYield = recipe.outputs[item];
        batchYield = applyAlchemyMult(recipe.machine, batchYield, alchemyMult);
        Object.keys(recipe.inputs).forEach(k => { 
            cost += getProductionFertCost(k, fertVal, fertSpeed, speedMult, alchemyMult) * (recipe.inputs[k] / batchYield); 
        });
    }
    return cost;
}

function formatVal(val) { if(val >= 1000000) return Number((val/1000000).toFixed(2)) + 'm'; if(val >= 10000) return Number((val/1000).toFixed(2)) + 'k'; return Number(val.toFixed(2)); }

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

        // 先找到不回收時的所有副產物
        let globalAvilByproducts = {}; let globalTotalByproducts = {};
        calculatePass(params, true, globalAvilByproducts, globalTotalByproducts); // True = Ghost Mode (No DOM, just Byproducts)        
        

        // 再計算第一次回收後剩下的所有副產物
        globalAvilByproducts = {...globalTotalByproducts};
        globalTotalByproducts = {};
        calculatePass(params, true, globalAvilByproducts, globalTotalByproducts);
        let byproductSnapShot = {...globalTotalByproducts};

        // 迴圈計算產物是否穩定, 最多30次
        for (let i = 0; i < 30; i++) {
            globalAvilByproducts = {...byproductSnapShot};
            globalTotalByproducts = {};
            calculatePass(params, true, globalAvilByproducts, globalTotalByproducts);

            let maxDiff = 0;
            const allKeys = [...new Set([...Object.keys(byproductSnapShot), ...Object.keys(globalTotalByproducts)])];
            for (const key of allKeys) {
                const valA = byproductSnapShot[key] || 0;
                const valB = globalTotalByproducts[key] || 0;

                if (Math.abs(valA - valB) > maxDiff) {
                    maxDiff = Math.abs(valA - valB);
                }
            }
            console.log(`第 ${i} 次迭代, 偏差:${maxDiff}`)
            if (maxDiff < 0.0001) break;

            for (const key of allKeys) {
                const valA = byproductSnapShot[key] || 0;
                const valB = globalTotalByproducts[key] || 0;
                
                // 計算新值: A + (B - A) * 0.5
                const newValue = valA + (valB - valA) * 0.5;
                byproductSnapShot[key] = newValue;
            }
        }


        // --- PASS 2: RENDER ---
        document.getElementById('tree').innerText = '';
        globalAvilByproducts = {...globalTotalByproducts};
        globalTotalByproducts = {};
        calculatePass(params, false, globalAvilByproducts, globalTotalByproducts); // False = Render Mode

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
        const recipeNtrientCost = getRecipeNutrientCost(recipe);
        if (recipeNtrientCost > 0 && recipe.machine === "Nursery") {
            let fertilitySpeed = DB.items[selectedFert]?.maxFertility || 1;
            recipeTime =  recipeNtrientCost / fertilitySpeed;
        }
        let ratePerMachine = (60 / (recipeTime || 1)) * getSpeedMult(lvlSpeed) * batchYield;        
        if (!(DB.items[targetItem].liquid)) {
            const beltSpeed = DB.items[targetItem].category === "Currency" ? 50 * getBeltSpeed(lvlBelt) : getBeltSpeed(lvlBelt); // 貨幣輸出為50個1堆疊
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
            console.log(`${(targetRate/getBeltSpeed(lvlBelt)*100).toFixed(1)}%`);
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

function calculatePass(p, isGhost, globalAvilByproducts, globalTotalByproducts) {
    // Re-calc basic inputs derived from params
    const fuelDef = DB.items[p.selectedFuel] || {};
    const grossFuelEnergy = (fuelDef.heat || 1) * p.fuelMult;;    
    const fertDef = DB.items[p.selectedFert] || { nutrientValue: 144, maxFertility: 12 };
    const grossFertVal = fertDef.nutrientValue * p.fertMult;

    let globalFuelDemandItems = 0; let globalFertDemandItems = 0; let globalHeatLoad = 0; let globalBioLoad = 0; let globalCostPerMin = 0;
    let globalForcedItems = {}; let globalRawItems = {}; let globalExtraBuildCosts = {};

    // --- AGGREGATION STRUCTURES ---
    let machineStats = {};
    let furnaceSlotDemand = {}; 
    let commonNodesMap = {}; // 用於收集共同節點的 Map (Key: Item + MachineName)
    let byproductProducersMap = {};
    let rawMaterialSourceMap = []; // 紀錄金幣購買來源
    let fuelSourceMap = [];        // 紀錄燃料消耗來源
    let fertSourceMap = [];        // 紀錄肥料消耗來源
    let externalSourceMap = {};    // 紀錄強制外部輸入來源 (按物品名稱分組)

    function addMachineCount(machineName, outputItem, countMax, countRaw) {
        if (!machineStats[machineName]) machineStats[machineName] = {};
        if (!machineStats[machineName][outputItem]) machineStats[machineName][outputItem] = { rawFloat: 0, nodeSumInt: 0 };
        machineStats[machineName][outputItem].rawFloat += countRaw;
        machineStats[machineName][outputItem].nodeSumInt += countMax;
    }   

    // Recursive Builder
    function buildNode(item, rate, isInternalModule, ancestors = [], forceGhost = false, depth = 0) {
        const effectiveGhost = isGhost || forceGhost;

        // RECYCLING CHECK
        let deduction = 0;
        let pathKey = ancestors.join(">") + ">" + item;
        let canRecycle = false;
        const isExternalInput = GLOBAL_CALC_STATE.forcedExternals.has(pathKey);
        
        if (globalAvilByproducts[item] && globalAvilByproducts[item] > 0.001) {
            canRecycle = true;
            if (GLOBAL_CALC_STATE.activeRecyclers.has(pathKey)) {
                deduction = Math.min(rate, globalAvilByproducts[item]);
                globalAvilByproducts[item] -= deduction; 
            }
        }

        const netRate = Math.max(0, rate - deduction);
        const itemDef = DB.items[item] || {};
        let ingredientChildren = []; 
        let currentPath = [...ancestors, item];
        
        let beltCountTag = "", outputTag = ""; let machineTag = ""; let heatTag = ""; let swapBtn = ""; let byproductTag = "";
        let bioTag = ""; let costTag = ""; let detailsTag = ""; let recycleTag = ""; let externalTag = "";
        let machinesNeeded = 0; let hasChildren = false;
        
        // --- RECYCLE UI ---
        if (canRecycle && !effectiveGhost) {
            if (GLOBAL_CALC_STATE.activeRecyclers.has(pathKey)) {
                let activeClass = "active";
                let label = `♻️ ${formatVal(deduction)} ${t('Used')}`;
                recycleTag = `<div><button class="recycle-btn ${activeClass}" onclick="toggleRecycle('${pathKey}')">${label}</button></div>`;
            } else {
                let label = `♻️ ${formatVal(globalAvilByproducts[item])} ${t('Avail')}`;
                recycleTag = `<div><button class="recycle-btn" onclick="toggleRecycle('${pathKey}')">${label}</button></div>`;
            }
        }

        // --- External UI ---
        if (!effectiveGhost) {            
            externalTag = `<div><input type="checkbox" ${isExternalInput ? 'checked':''} id="buildModeToggle" onchange="toggleExternal('${pathKey}');"></input></div>`;
        }

        // Logic branching based on Item Type
        if (isExternalInput || depth >= 20) {
            if (!effectiveGhost && netRate > 0) {
                if (!globalForcedItems[item]) globalForcedItems[item] = 0;
                globalForcedItems[item] += netRate;
                detailsTag = `<span class="details">(${t('External Input')})</span>`;
                if (!externalSourceMap[item]) externalSourceMap[item] = [];
                externalSourceMap[item].push({ rate: netRate, pathKey });
            }
        }
        else {
            const recipe = getActiveRecipe(item);
            if (!recipe) {
                if(!effectiveGhost) {
                    if(itemDef.buyPrice) { 
                        if (!globalRawItems[item]) globalRawItems[item] = 0;
                        globalRawItems[item] += netRate;
                        let c = netRate * itemDef.buyPrice; 
                        globalCostPerMin += c; 
                        costTag = `<span class="cost-tag">-${Math.ceil(c - Number.EPSILON).toLocaleString()} G/m</span>`;
                        detailsTag = `<span class="details">(${t('Raw Input')})</span>`;
                        rawMaterialSourceMap.push({ item, gold: c, pathKey });
                    }
                    else {
                        if (!globalForcedItems[item]) globalForcedItems[item] = 0;
                        globalForcedItems[item] += netRate;
                        detailsTag = `<span class="details">(${t('External Input')})</span>`;
                        if (!externalSourceMap[item]) externalSourceMap[item] = [];
                        externalSourceMap[item].push({ rate: netRate, pathKey });
                    }                    
                }
            } else {
                hasChildren = recipe.inputs !== undefined;
                if(recipe.machine === "Bank Portal") {
                    let c = netRate * itemDef.sellPrice; 
                    globalCostPerMin += c; 
                    costTag = `<span class="cost-tag">-${Math.ceil(c - Number.EPSILON).toLocaleString()} G/m</span>`;
                    rawMaterialSourceMap.push({ item, gold: c, pathKey });
                }

                let batchYield = recipe.outputs[item] || 1;
                if (recipe.machine === "Extractor" || recipe.machine === "Thermal Extractor" || recipe.machine === "Alembic" || recipe.machine === "Advanced Alembic") { 
                    const ratio = recipe.machine === "Thermal Extractor" ? p.alchemyMult * 3 : p.alchemyMult;
                    batchYield *= ratio;
                    outputTag = `<span class="output-tag">${t('Yields')}: ${(ratio*100).toFixed(0)}%</span>`
                }
                const batchesPerMin = netRate / batchYield;                
                
                let recipeTime = recipe.baseTime || 1;
                const recipeNtrientCost = getRecipeNutrientCost(recipe);
                if (recipeNtrientCost > 0 && recipe.machine === "Nursery") {
                    let fertilitySpeed = fertDef.maxFertility || 1;
                    recipeTime =  recipeNtrientCost / fertilitySpeed;
                }
                let machineOutputRate  = (60 / (recipeTime || 1)) * p.speedMult;
                let effectiveBatchesPerMin = machineOutputRate;
                const isLiquid = (itemDef.liquid === true);
                if (!isLiquid) {
                    const maxItemsPerMinPerMachine = machineOutputRate * batchYield;
                    const beltSpeed = itemDef.category === "Currency" ? 50 * p.beltSpeed : p.beltSpeed; // 貨幣輸出為50個1堆疊
                    if (maxItemsPerMinPerMachine > beltSpeed) { effectiveBatchesPerMin = beltSpeed / batchYield; }
                }
                
                let rawMachines = batchesPerMin / effectiveBatchesPerMin;
                if (Math.abs(Math.round(rawMachines) - rawMachines) < 0.0001) { rawMachines = Math.round(rawMachines); }
                machinesNeeded = rawMachines;
                
                Object.keys(recipe.outputs).forEach(outKey => {
                    if (outKey !== item) {
                        let yieldPerBatch = recipe.outputs[outKey];
                        let totalByproduct = batchesPerMin * yieldPerBatch;

                        // 累積紀錄Total Byproduct
                        if(!globalTotalByproducts[outKey]) globalTotalByproducts[outKey] = 0;
                        globalTotalByproducts[outKey] += totalByproduct;

                        if (!effectiveGhost) {
                            byproductTag += `<span class="byproduct-tag">+${formatVal(totalByproduct)}/m ${outKey}</span>`;                        
                        }

                         // --- 新增：收集來源資訊 (僅在 Rendering Mode) ---
                        if (!effectiveGhost) {
                            if (!byproductProducersMap[outKey]) byproductProducersMap[outKey] = [];
                            byproductProducersMap[outKey].push({
                                rate: totalByproduct,
                                recipe: recipe,
                                machineCount: machinesNeeded,
                                pathKey: pathKey,                                
                            });
                        }
                    }
                });
                // 收集回收利用的
                if (!effectiveGhost && deduction > 0.0001) {
                    if (!byproductProducersMap[item]) byproductProducersMap[item] = [];
                    byproductProducersMap[item].push({
                        rate: -deduction,
                        recipe: recipe,
                        machineCount: machinesNeeded,
                        pathKey: pathKey,                                
                    });
                }

                // Machine Usage Stats
                if(!effectiveGhost) {
                    addMachineCount(recipe.machine, item, Math.ceil(machinesNeeded - 0.0001), machinesNeeded);                    
                    if (recipe.buildCost) {
                        const mat = t(recipe.buildCost, 'items');
                        if (!globalExtraBuildCosts[mat]) globalExtraBuildCosts[mat] = 0;
                        globalExtraBuildCosts[mat] += Math.ceil(machinesNeeded - 0.0001);
                    }
                }

                // HEAT CALCULATION
                let fuelRate = 0;
                if (DB.machines[recipe.machine] && DB.machines[recipe.machine].heatCost) {
                    const mach = DB.machines[recipe.machine]; const parent = DB.machines[mach.parent];
                    const sReq = mach.slotsRequired || 1; const pSlots = mach.parentSlots || parent.slots || 3;
                    let activeHeat = mach.heatCost * p.speedMult;
                    if (mach.heatCost < 0) { activeHeat = (recipe.heatCost ?? 0) * p.speedMult;} // Overwrite 
                    
                    // NOTE: This part of heat calculation is different from others
                    const nodeParentsNeeded = Math.ceil((machinesNeeded / (pSlots/sReq)) - 0.0001);
                    const totalHeatPs = (nodeParentsNeeded * parent.heatSelf * p.speedMult) + (machinesNeeded * activeHeat);
                    
                    if (!effectiveGhost) {
                        const pName = mach.parent; 
                        if (!furnaceSlotDemand[pName]) furnaceSlotDemand[pName] = 0;
                        // FIX: Use CEIL() here to count PHYSICAL slots needed, not fractional heat load.
                        furnaceSlotDemand[pName] += Math.ceil(machinesNeeded - 0.0001) * sReq;
                    }
                    
                    // FIX: Always track Global Load (Fixes Summary Box)
                    if (effectiveGhost || !isInternalModule || isInternalModule) {
                        globalHeatLoad += totalHeatPs; 
                        globalFuelDemandItems += (totalHeatPs * 60) / grossFuelEnergy;
                    }
                    
                    if(!effectiveGhost) {
                        fuelRate = ((totalHeatPs * 60) / grossFuelEnergy);
                        heatTag = `-${formatVal(fuelRate)}/m ${p.selectedFuel}`;
                        if (p.showHeatFert) heatTag += ` (${formatVal(totalHeatPs)} P/s)`;
                        heatTag = `<span class="heat-tag">` + heatTag + `</span>`;
                        if (p.showFuelCost && p.fuelCost > Number.EPSILON) costTag += `<span class="cost-tag">(${Math.ceil(fuelRate * p.fuelCost - Number.EPSILON).toLocaleString()} G/m)</span>`;
                    }
                }

                // NUTR CALCULAION
                let fertRate = 0;
                if (!effectiveGhost && (recipe.machine === "Nursery" || recipe.machine === "World Tree Nursery")) {
                    const totalNutrientsNeeded = netRate * getRecipeNutrientCost(recipe) / batchYield;
                    const itemsNeeded = totalNutrientsNeeded / grossFertVal;
                    globalFertDemandItems += itemsNeeded;
                    globalBioLoad += (totalNutrientsNeeded / 60);
                    
                    // 生成 Bio Tag
                    fertRate = itemsNeeded;
                    let bioText = `-${formatVal(fertRate)}/m ${p.selectedFert}`;
                    if (p.showHeatFert) {
                        bioText += ` (${formatVal(totalNutrientsNeeded/60)} V/s)`;
                    }
                    bioTag = `<span class="bio-tag">${bioText}</span>`;
                    
                    // 生成 Cost Tag
                    if (p.showFertCost && p.fertCost > Number.EPSILON) {
                        const costPerMin = Math.ceil(fertRate * p.fertCost - Number.EPSILON);
                        costTag += `<span class="cost-tag">(${costPerMin.toLocaleString()} G/m)</span>`;
                        globalCostPerMin += costPerMin;
                    }
                }

                if(!effectiveGhost) {
                    let inputsStr = Object.keys(recipe.inputs).map(k => `${recipe.inputs[k]} ${k}`).join(', ');
                    let outputsStr = Object.keys(recipe.outputs).map(k => `${recipe.outputs[k]} ${k}`).join(', ');
                    let throughput = effectiveBatchesPerMin * batchYield;
                    let tooltipText = "";
                    tooltipText += `${t('Recipe')}: ${inputsStr} -> ${outputsStr}\n`;
                    tooltipText += `${t('Base Time')}: ${recipeTime} s\n`;
                    tooltipText += `${t('Speed Mult')}: ${p.speedMult.toFixed(2)}x\n`;
                    tooltipText += `${t('Throughput')}: ${throughput.toFixed(2)}/min`;

                    let capTag = "";
                    if(p.showMaxCap) {
                        const maxOutput = Math.ceil(machinesNeeded) * throughput;
                        const usageRatio = netRate / maxOutput;
                        capTag = `<span class="max-cap-tag" onclick="recalculate('${p.targetItem}', ${p.targetRate / usageRatio})">(Max: ${formatVal(maxOutput)}/m)</span>`;
                    }
                    machineTag = `<span class="machine-tag" data-tooltip="${tooltipText}">${Math.ceil(machinesNeeded)} ${t(recipe.machine, 'machines')}${capTag}</span>`;

                    const alts = getRecipesFor(item);
                    if(alts.length > 1) { 
                        swapBtn = `<button class="swap-btn" onclick="openRecipeModal('${item}', this.parentElement)" title="Swap Recipe">🔄</button>`; 
                    }

                    // RECORD COMMON NODES
                    const commonKey = `${item}_${recipe.machine}`;
                    if (!commonNodesMap[commonKey]) {
                        commonNodesMap[commonKey] = {
                            item: item,
                            machine: recipe.machine,
                            totalRate: 0,
                            totalMachines: 0,
                            tooltipText: tooltipText,
                            totalFuelRate: 0,
                            totalFertRate: 0,
                            instances: []
                        };
                    }
                    const entry = commonNodesMap[commonKey];
                    entry.totalRate += netRate;
                    entry.totalMachines += machinesNeeded;
                    entry.totalFuelRate += fuelRate;
                    entry.totalFertRate += fertRate;
                    
                    entry.instances.push({
                        rate: netRate,
                        machines: machinesNeeded,
                        pathKey: pathKey
                    });

                    if (fuelRate > 0.0001) fuelSourceMap.push({ rate: fuelRate, item: item, machine: recipe.machine, count: machinesNeeded, pathKey });
                    if (fertRate > 0.0001) fertSourceMap.push({ rate: fertRate, item: item, machine: recipe.machine, count: machinesNeeded, pathKey });
                }
                
                // RECURSE INPUTS
                if (netRate > 0.0001) {
                    const netBatches = netRate / batchYield;
                    Object.keys(recipe.inputs).forEach(iName => {
                        let qtyPerBatch = recipe.inputs[iName];
                        let requiredInputRate = netBatches * qtyPerBatch;
                        ingredientChildren.push({ type: 'input', item: iName, rate: requiredInputRate });
                    });
                }
            }
        }

        if (effectiveGhost) {
            ingredientChildren.forEach(child => { 
                buildNode(child.item, child.rate, isInternalModule, currentPath, effectiveGhost, depth + 1); 
            });
            return null; 
        }

        // --- RENDER DOM ---
        const div = document.createElement('div'); div.className = 'node'; div.setAttribute('data-depth', depth % 10); div.setAttribute('data-path', pathKey);
        if (GLOBAL_CALC_STATE.collapsedNode.has(pathKey)) div.classList.add('collapsed');
        if (p.showBeltCount && itemDef) {
            if (itemDef.category !== "Liquid") {
                const ratio = itemDef.category === "Currency" ? rate / (50 * p.beltSpeed) : rate / p.beltSpeed;
                beltCountTag = `<span class="belt-count">(${Number(ratio.toFixed(2))})</span>`;
            }
        }
        let arrowHtml = `<span class="tree-arrow" style="visibility:${hasChildren ? 'visible' : 'hidden'}" onclick="toggleNode(this, '${pathKey}')">▼</span>`;
        let nodeContent = `
            ${arrowHtml}
            <span class="qty">${formatVal(rate)}/m</span>
            ${beltCountTag}
            <img src="img/item${DB.items[item]?.id ?? 0}.png" width="24" height="24" loading="lazy">
            <span class="item-link" onclick="openDrillDown('${item}', ${rate})"><strong>${item}</strong></span>
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
        `;

        div.innerHTML = `<div class="node-content" data-ancestors='${JSON.stringify(ancestors)}'>${nodeContent}</div>`;
        if (ingredientChildren.length > 0) {
            const childrenDiv = document.createElement('div');
            childrenDiv.className = 'node-children';
            ingredientChildren.forEach(child => { 
                childrenDiv.appendChild(buildNode(child.item, child.rate, isInternalModule, currentPath, effectiveGhost, depth + 1)); 
            });
            div.appendChild(childrenDiv);
        }
        return div;
    }

    // --- EXECUTE THE PASS ---
    const treeContainer = document.getElementById('tree');
    p.targets.forEach((target, idx) => {        
        if (!DB.items[target.item]) return;
        // 核心：所有目標共用同一個 globalAvilByproducts 池實現回收抵充
        const root = buildNode(target.item, target.rate, false, [], 0);
        if(!isGhost) {
            const div = document.createElement('div');
            div.style.marginTop = '25px';
            div.style.marginBottom = '8px';
            div.style.paddingBottom = '4px';
            div.style.borderBottom = '1px dashed #555';
            div.innerHTML = `
                <span class="section-header">--- ${t('Production Chain')} (${target.item}) ---</span>
                <span style="margin-left:auto; cursor:pointer;">
                    <span class="section-header" onclick="setAllRecycling(true)">[${t('Recycle All')}]</span>
                    <span class="section-header" onclick="setAllRecycling(false)">[${t('Un-recycle All')}]</span>
                    <span class="section-header" onclick="toggleFirstLevel()" title="Toggle First Level" style="margin-right:10px;">💠</span>
                </span>
            `;        
            treeContainer.appendChild(div); 
            treeContainer.appendChild(root);
        }
    });

    if (!isGhost) {
        let stableFuelDemand = globalFuelDemandItems;
        let stableFertDemand = globalFertDemandItems;
        let byproductSnapshot = {...globalAvilByproducts}; 
        
        let baseFuel = globalFuelDemandItems;
        let baseFert = globalFertDemandItems;
        let baseHeat = globalHeatLoad;
        let baseBio = globalBioLoad;
        let baseCost = globalCostPerMin;
        
        if ((p.selfFuel && p.selectedFuel != p.targetItem) || (p.selfFert && p.selectedFert != p.targetItem)) {
            for(let i=0; i<10; i++) {
                globalFuelDemandItems = baseFuel;
                globalFertDemandItems = baseFert;
                globalHeatLoad = baseHeat;
                globalBioLoad = baseBio;
                globalCostPerMin = baseCost;
                
                globalAvilByproducts = {...byproductSnapshot}; 
                
                let prevFuel = stableFuelDemand;
                let prevFert = stableFertDemand;
                
                if (p.selfFert && prevFert > 0) {
                    buildNode(p.selectedFert, prevFert, true, [], true, 0); 
                }
                
                if (p.selfFuel && prevFuel > 0) {
                    buildNode(p.selectedFuel, prevFuel, true, [], true , 0); 
                }
                
                let nextFuel = globalFuelDemandItems;
                let nextFert = globalFertDemandItems;
                
                if (Math.abs(nextFuel - prevFuel) < 0.01 && Math.abs(nextFert - prevFert) < 0.01) {
                    stableFuelDemand = nextFuel;
                    stableFertDemand = nextFert;
                    break;
                }
                stableFuelDemand = nextFuel;
                stableFertDemand = nextFert;
            }
        }
        
        globalFuelDemandItems = stableFuelDemand;
        globalFertDemandItems = stableFertDemand;
        
        if (!isGhost) {
            if (p.selfFert && stableFertDemand > 0) {
                const grossFertNeeded = stableFertDemand;
                if (p.targetItem == p.selectedFert) {
                    // Do nothing
                } else {
                    const h = document.createElement('div'); h.className = 'section-header'; h.innerText = `--- ${t('Internal Nutrient Module')} (${p.selectedFert}) ---`; treeContainer.appendChild(h); 
                    treeContainer.appendChild(buildNode(p.selectedFert, grossFertNeeded, true, [], 0));
                }
            }

            if (p.selfFuel && stableFuelDemand > 0) {
                const grossFuelNeeded = stableFuelDemand;
                if (p.targetItem == p.selectedFuel) {
                    // Do nothing
                } else {
                    const h = document.createElement('div'); h.className = 'section-header'; h.innerText = `--- ${t('Internal Heat Module')} (${p.selectedFuel}) ---`; treeContainer.appendChild(h); 
                    treeContainer.appendChild(buildNode(p.selectedFuel, grossFuelNeeded, true, [], 0));
                }
            }
        }
    }

    const createNodeItemHTML = (label, qty, colorVar = 'default', suffix = '') => `
        <div class="node-content" style="margin-bottom:5px;">
            <span class="qty" style="color:var(--${colorVar})">${qty}</span>
            <img src="img/item${DB.items[label]?.id ?? 0}.png" width="${DB.items[label] ? 24 : 1}" height="24" loading="lazy">
            <strong>${label}</strong> ${suffix}
        </div>`;

    if (!isGhost) {

        // --- 渲染外部輸入 (External Inputs) ---
        renderExternalInputs();

        // --- 渲染副產品 (Byproducts) ---
        renderByproducts();

        // --- 渲染共同節點 ---
        renderCommonNodes();

        // --- 機器數據聚合 (Machine Stats) ---
        const { flatMax, flatMin } = aggregateMachineStats(machineStats);

        // --- 計算熔爐數量 ---
        const totalFurnaces = calculateTotalFurnaces(furnaceSlotDemand);

        // --- 更新 UI 組件 ---
        updateConstructionList(flatMax, flatMin, totalFurnaces, globalExtraBuildCosts);
        
        // --- 計算最終成本並更新摘要 ---
        updateSummaryBox(p, globalHeatLoad, globalBioLoad, globalCostPerMin, globalFuelDemandItems, globalFertDemandItems);

        // --- 更新產物公式 ---
        updateSummaryLine(p, globalRawItems, globalForcedItems, globalFuelDemandItems, globalFertDemandItems, globalAvilByproducts);
    }

    // --- 以下為封裝的邏輯函式 ---

    function updateSummaryLine(p, globalRawItems, globalForcedItems, globalFuelDemandItems, globalFertDemandItems, globalAvilByproducts) {

        function formattedText(name, qty, color) {
            console.log(name);
            return  ` <span class="qty" style="color:var(--${color})">${Number(qty.toFixed(2))}<img src="img/item${DB.items[name]?.id ?? 0}.png" title="${name}" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;"></span>`;
        }

        let summaryLine = "";
        Object.entries(globalRawItems).forEach(([name, rate]) => summaryLine += formattedText(name, rate, 'accent'));
        Object.entries(globalForcedItems).forEach(([name, rate]) => summaryLine += formattedText(name, rate, 'accent'));
        // 自供燃料及肥料的用量不是外部輸入, 因此不顯示
        if (p.selfFuel) globalFuelDemandItems = 0;
        if (p.selfFert) globalFertDemandItems = 0;
        const sumDemandItems = globalFuelDemandItems + globalFertDemandItems;
        if (sumDemandItems > 0.0001) {
            summaryLine += ` (`;
            if (p.selectedFuel === p.selectedFert) summaryLine += formattedText(p.selectedFuel, sumDemandItems, 'gold');
            else {
                if (globalFuelDemandItems > 0.0001) summaryLine += formattedText(p.selectedFuel, globalFuelDemandItems, 'fuel');
                if (globalFertDemandItems > 0.0001) summaryLine += formattedText(p.selectedFert, globalFertDemandItems, 'bio');
            }
            summaryLine += `) `;
        }
        summaryLine += `<span style="color:var(--info);"> ➔ </span>`;

        p.targets.forEach(target => {
            if (target.rate > 0.0001) summaryLine += formattedText(target.item, target.rate, 'profit');
        });
        
        Object.entries(globalAvilByproducts).forEach(([name, rate]) => { 
            if (rate > 0.0001) summaryLine += formattedText(name, rate, 'byproduct');
        });

        console.log(summaryLine);
        document.getElementById('summary-line').innerHTML = summaryLine;
    }


    /**
     * 創建帶有摺疊/展開按鈕的區塊標題
     */
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

    function renderCommonNodes() {
        // 篩選出出現次數 > 1 的節點
        const commonEntries = Object.values(commonNodesMap).filter(e => e.instances.length > 1);
        if (commonEntries.length === 0) return;

        treeContainer.appendChild(createSectionHeader(`--- ${t('Common Nodes')} ---`));


        commonEntries.forEach(entry => {
            const pathKey = `common_${entry.item}_${entry.machine}`;
            const div = document.createElement('div');
            div.className = 'node';
            if (GLOBAL_CALC_STATE.collapsedNode.has(pathKey)) div.classList.add('collapsed');

            const mName = t(entry.machine, 'machines');
            const mLabel = `<span class="machine-tag" data-tooltip="${entry.tooltipText}">${Math.ceil(entry.totalMachines - 0.0001)} ${mName}</span>`;
            const heatTag = entry.totalFuelRate > 0.0001 ? `<span class="heat-tag">-${formatVal(entry.totalFuelRate)}/m ${p.selectedFuel}</span>` : ``;
            const bioTag = entry.totalFertRate > 0.0001 ? `<span class="bio-tag">-${formatVal(entry.totalFertRate)}/m ${p.selectedFert}</span>` : ``;            

            // 主標題 HTML
            let nodeContent = `
                <span class="tree-arrow" onclick="toggleNode(this, '${pathKey}')">▼</span>
                <span class="qty">${formatVal(entry.totalRate)}/m</span>
                <img src="img/item${DB.items[entry.item]?.id ?? 0}.png" width="24" height="24">
                <strong>${entry.item}</strong>
                ${mLabel}
                ${heatTag}
                ${bioTag}
            `;

            // 子項目 (Instances)
            let childrenHtml = '';
            entry.instances.forEach(inst => {
                childrenHtml += `
                    <div class="node-content" style="margin-bottom:2px; border-bottom:1px dashed #333; opacity:0.8;">
                        <span class="qty" style="min-width:60px; display:inline-block;">${formatVal(inst.rate)}/m</span>
                        <span style="font-size:0.85em; color: #FFF; margin-right:5px;">${Math.ceil(inst.machines - 0.0001)} ${mName}</span>
                        <span class="details" style="font-size:0.85em; cursor:pointer;" onclick="jumpToNode('${inst.pathKey}')">[ ${inst.pathKey} ]</span>
                    </div>
                `;
            });

            div.innerHTML = `
                <div class="node-content" style="background: rgba(76, 175, 80, 0.05); border-left: 3px solid var(--accent);">${nodeContent}</div>
                <div class="node-children" style="margin-left: 20px; border-left: 1px solid #444;">${childrenHtml}</div>
            `;
            treeContainer.appendChild(div);
        });
    }

    function renderExternalInputs() {
        treeContainer.appendChild(createSectionHeader('--- External Inputs ---'));

        // --- 輔助函式：建立外部輸入節點 ---
        const createExtNode = (label, qty, colorVar, pathKey, producersHtml, mainIconHtml = "") => {
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
        };

        // 1. 原料成本 (Gold)
        if (globalCostPerMin > 0) {
            let producersHtml = ''; let sourceCount = 0;
            rawMaterialSourceMap.forEach(src => {
                producersHtml += `
                    <div class="node-content" style="opacity:0.8;">
                        <span class="qty" style="color:var(--gold); min-width:80px; display:inline-block;">${Math.ceil(src.gold).toLocaleString()} G/m</span>
                        <img src="img/item${DB.items[src.item]?.id ?? 0}.png" width="20" height="20">
                        <span class="details" style="font-size:0.85em; cursor:pointer;" onclick="jumpToNode('${src.pathKey}')">[ ${src.pathKey} ]</span>
                    </div>`;
                sourceCount++;
            });
            createExtNode(t('Raw Material Cost') + ` (${sourceCount})`, `${Math.ceil(globalCostPerMin).toLocaleString()} G/m`, 'gold', 'ext_gold', producersHtml);
        }

        // 2. 燃料輸入 (Fuel)
        if (!p.selfFuel && globalFuelDemandItems > 0.001) {
            let producersHtml = ''; let sourceCount = 0;
            fuelSourceMap.forEach(src => {
                producersHtml += `
                    <div class="node-content" style="opacity:0.8;">
                        <span class="qty" style="color:var(--fuel); min-width:60px; display:inline-block;">${formatVal(src.rate)}/m</span>
                        <span class="machine-tag">${Math.ceil(src.count - 0.0001)} ${t(src.machine, 'machines')}</span>
                        <span class="details" style="font-size:0.85em; cursor:pointer;" onclick="jumpToNode('${src.pathKey}')">[ ${src.pathKey} ]</span>
                        <img src="img/item${DB.items[src.item]?.id ?? 0}.png" width="20" height="20">
                    </div>`;
                sourceCount++;
            });
            const fuelIcon = `<img src="img/item${DB.items[p.selectedFuel]?.id ?? 0}.png" width="24" height="24"> `;
            createExtNode(p.selectedFuel + ` (${sourceCount})`, `${globalFuelDemandItems.toFixed(2)}/m`, 'fuel', 'ext_fuel', producersHtml, fuelIcon);
        }

        // 3. 肥料輸入 (Fertilizer)
        if (!p.selfFert && globalFertDemandItems > 0.001) {
            let producersHtml = ''; let sourceCount = 0;
            fertSourceMap.forEach(src => {
                producersHtml += `
                    <div class="node-content" style="opacity:0.8;">
                        <span class="qty" style="color:var(--bio); min-width:60px; display:inline-block;">${formatVal(src.rate)}/m</span>
                        <span class="machine-tag">${Math.ceil(src.count - 0.0001)} ${t(src.machine, 'machines')}</span>
                        <span class="details" style="font-size:0.85em; cursor:pointer;" onclick="jumpToNode('${src.pathKey}')">[ ${src.pathKey} ]</span>
                        <img src="img/item${DB.items[src.item]?.id ?? 0}.png" width="20" height="20">
                    </div>`;
                sourceCount++;
            });
            const fertIcon = `<img src="img/item${DB.items[p.selectedFert]?.id ?? 0}.png" width="24" height="24"> `;
            createExtNode(p.selectedFert + ` (${sourceCount})`, `${globalFertDemandItems.toFixed(2)}/m`, 'bio', 'ext_fert', producersHtml, fertIcon);
        }

        // 4. 強制外部輸入 (External Forced)
        Object.entries(externalSourceMap).forEach(([itemName, sources]) => {
            let producersHtml = '';
            let totalRate = 0;
            sources.forEach(src => {
                totalRate += src.rate;
                producersHtml += `
                    <div class="node-content" style="opacity:0.8;">
                        <span class="qty" style="color:var(--default); min-width:60px; display:inline-block;">${formatVal(src.rate)}/m</span>
                        <span class="details" style="font-size:0.85em; cursor:pointer;" onclick="jumpToNode('${src.pathKey}')">[ ${src.pathKey} ]</span>
                    </div>`;
            });
            const itemIcon = `<img src="img/item${DB.items[itemName]?.id ?? 0}.png" width="24" height="24"> `;
            createExtNode(itemName, `${formatVal(totalRate)}/m`, 'default', `ext_forced_${itemName}`, producersHtml, itemIcon);
        });
    }

    function renderByproducts() {
        treeContainer.appendChild(createSectionHeader('--- BYPRODUCTS ---'));

        const sortedNames = Object.keys(globalTotalByproducts).sort();
        if (sortedNames.length === 0) {
            const emptyDiv = Object.assign(document.createElement('div'), {
                className: 'node',
                innerHTML: `<div class="node-content"><span class="details" style="font-style:italic">${t('None')}</span></div>`
            });
            treeContainer.appendChild(emptyDiv);
            return;
        }

        sortedNames.forEach(name => {
            const remaining = globalAvilByproducts[name] || 0;
            const totalGenerated = globalTotalByproducts[name];
            const producers = byproductProducersMap[name] || [];
            const pathKey = `byp_${name}`; // 唯一的摺疊 Key

            const div = document.createElement('div');
            div.className = 'node';
            if (GLOBAL_CALC_STATE.collapsedNode.has(pathKey)) div.classList.add('collapsed');

            // 父節點：[加總qty] [物品圖片] [物品名稱]
            // 注意：這裡顯示的是回收後剩餘的數量 (Available)
            const recycledNote = remaining < totalGenerated 
                ? ` <span style="font-size:0.8em; color:#888;">(${formatVal(totalGenerated - remaining)} ${t('recycled')})</span>` 
                : '';

            let nodeContent = `
                <span class="tree-arrow" onclick="toggleNode(this, '${pathKey}')">▼</span>
                <span class="qty" style="color:var(--byproduct)">${formatVal(remaining)}/m</span>
                <img src="img/item${DB.items[name]?.id ?? 0}.png" width="24" height="24" loading="lazy">
                <strong>${name}</strong>
                ${recycledNote}
            `;

            // 子節點：[qty] [加總機器數量+名稱] [pathKey]
            let childrenHtml = '';
            producers.forEach(inst => {
                const recipe = inst.recipe;
                let inputsStr = Object.keys(recipe.inputs).map(k => `${recipe.inputs[k]} ${k}`).join(', ');
                let outputsStr = Object.keys(recipe.outputs).map(k => `${recipe.outputs[k]} ${k}`).join(', ');
                let tooltipText = "";
                tooltipText += `${t('Recipe')}: ${inputsStr} -> ${outputsStr}\n`;
                if (recipe.baseTime) tooltipText += `${t('Base Time')}: ${recipe.baseTime} s\n`;
                machineTag = `<span class="machine-tag" data-tooltip="${tooltipText}">${Math.ceil(inst.machineCount)} ${t(recipe.machine, 'machines')}</span>`;

                childrenHtml += `
                    <div class="node-content" style="margin-bottom:2px; opacity:0.8;">
                        <span class="qty" style="min-width:60px; display:inline-block; ${inst.rate > 0.0001 ? 'color:var(--byproduct);' : ''}">${formatVal(inst.rate)}/m</span>
                        ${machineTag}
                        <span class="details" style="font-size:0.85em; cursor:pointer;" onclick="jumpToNode('${inst.pathKey}')">[ ${inst.pathKey} ]</span>
                    </div>
                `;
            });

            div.innerHTML = `
                <div class="node-content" style="background: rgba(213, 109, 231, 0.03); border-left: 3px solid var(--byproduct);">${nodeContent}</div>
                <div class="node-children" style="margin-left: 20px; border-left: 1px solid #444;">${childrenHtml}</div>
            `;
            treeContainer.appendChild(div);
        });
    }

    function aggregateMachineStats(stats) {
        const flatMax = {};
        const flatMin = {};
        
        for (const [mName, outputs] of Object.entries(stats)) {
            let totalIntMax = 0;
            let totalCeiledMin = 0;
            
            for (const data of Object.values(outputs)) {
                totalIntMax += data.nodeSumInt;
                totalCeiledMin += Math.ceil(data.rawFloat - 0.0001);
            }
            flatMax[mName] = totalIntMax;
            flatMin[mName] = totalCeiledMin;
        }
        return { flatMax, flatMin };
    }

    function calculateTotalFurnaces(demand) {
        return Object.entries(demand).reduce((sum, [name, qty]) => {
            const slots = DB.machines[name]?.slots || 3;
            return sum + Math.ceil((qty - 0.0001) / slots);
        }, 0);
    }
}

/* ==========================================================================
   SECTION: JS - DOM RENDERING
   ========================================================================== */
function updateConstructionList(maxCounts, minCounts, furnaces, extraBuildCosts) {
    const buildList = document.getElementById('construction-list'); buildList.innerHTML = '';
    const totalMatsContainer = document.getElementById('total-mats-container'); totalMatsContainer.innerHTML = '';
    
    // Check if we are in MAX mode
    const isMaxMode = !document.getElementById('buildModeToggle').checked;
    
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

    updateBuildModeLabel();
}

function updateBuildModeLabel() {
    const isMinMode = document.getElementById('buildModeToggle').checked;
    document.getElementById('build-mode-label').classList.toggle('active-mode', isMinMode);
    document.getElementById('build-mode-label').innerText = isMinMode ? "MIN" : "MAX";
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
