/* ==========================================================================
   ALCHEMY CALCULATOR CORE ENGINE
   Handles recursion, math, and tree node generation.
   ========================================================================== */

const GLOBAL_CALC_STATE = {
    activeRecyclers: new Set(),
    forcedExternals: new Set(),
    collapsedNode: new Set()
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
    // 1. Gather Inputs
    let rawInput = document.getElementById('targetItemInput').value.trim();
    let targetItem = Object.keys(DB.items).find(k => k.toLowerCase() === rawInput.toLowerCase()) || rawInput;
    let targetRate = parseFloat(document.getElementById('targetRate').value) || 0;
    
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
        const ratePerMachine = (60 / (recipe.baseTime || 1)) * getSpeedMult(lvlSpeed) * batchYield;
        if (isMachineMode) {
            const machineCount = parseFloat(document.getElementById('targetMachine').value) || 0;
            targetRate = machineCount * ratePerMachine;            
            document.getElementById('targetRate').value = Number(targetRate.toFixed(2));
        }
        else {
            const machineCount = targetRate / ratePerMachine;
            document.getElementById('targetMachine').value = Number(machineCount.toFixed(2));
        }
    }
    
    return {
        targetItem, targetRate, 
        selectedFuel, selfFuel, fuelCost, showFuelCost,
        selectedFert, selfFert, fertCost, showFertCost,
        showMaxCap, showHeatFert,
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
        // --- UPDATE SMART LABEL ---
        if (typeof getSmartLabel === 'function') {
            const lbl = getSmartLabel(targetRate, params.beltSpeed);
            document.getElementById('rateLabel').innerText = `${t('Rate (Items/Min)')}: ${lbl}`;
        }

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
    let netFuelEnergy = (fuelDef.heat || 10) * p.fuelMult; const grossFuelEnergy = netFuelEnergy; 
    if (p.selfFuel) { netFuelEnergy -= getProductionHeatCost(p.selectedFuel, p.speedMult, p.alchemyMult); }
    if(netFuelEnergy <= 0) netFuelEnergy = 0.1; 

    const fertDef = DB.items[p.selectedFert] || { nutrientValue: 144, maxFertility: 12 };
    let netFertVal = fertDef.nutrientValue * p.fertMult; const grossFertVal = netFertVal;
    if (p.selfFert) { netFertVal -= getProductionFertCost(p.selectedFert, netFertVal, fertDef.maxFertility, p.speedMult, p.alchemyMult); }
    if(netFertVal <= 0) netFertVal = 0.1;

    let globalFuelDemandItems = 0; let globalFertDemandItems = 0; let globalHeatLoad = 0; let globalBioLoad = 0; let globalCostPerMin = 0;
    let globalForcedItems = {}; let globalRawItems = {};

    // --- AGGREGATION STRUCTURES ---
    let machineStats = {};
    let furnaceSlotDemand = {}; 

    function addMachineCount(machineName, outputItem, countMax, countRaw) {
        if (!machineStats[machineName]) machineStats[machineName] = {};
        if (!machineStats[machineName][outputItem]) machineStats[machineName][outputItem] = { rawFloat: 0, nodeSumInt: 0 };
        machineStats[machineName][outputItem].rawFloat += countRaw;
        machineStats[machineName][outputItem].nodeSumInt += countMax;
    }

    let grossRate = p.targetRate;

    const treeContainer = document.getElementById('tree');

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
        
        let outputTag = ""; let machineTag = ""; let heatTag = ""; let swapBtn = ""; let byproductTag = "";
        let bioTag = ""; let costTag = ""; let detailsTag = ""; let recycleTag = ""; let externalTag = "";
        let machinesNeeded = 0; let hasChildren = false;
        
        /*
        let isFuel = (item === p.selectedFuel); let isFert = (item === p.selectedFert);
        if (p.showHeatFert) {
            if(isFuel) { outputTag = `<span class="output-tag">Output: ${formatVal((rate * (fuelDef.heat||10)*p.fuelMult)/60)} P/s</span>`; }
            else if (isFert) { outputTag = `<span class="output-tag">Output: ${formatVal((rate * fertDef.nutrientValue*p.fertMult)/60)} V/s</span>`; }
        }
        */

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
            }
        }
        else if (itemDef.nutrientCost) {
            // --- 1. 計算 Nursery 生產速率與機器需求 ---
            let machineName = "Nursery";
            let fertilitySpeed = fertDef.maxFertility || 12;
            if (itemDef.nutrientCost >= 30000) {
                // 世界樹的特例處理
                machineName = "World Tree Nursery";
                fertilitySpeed = 20000;
            }
            const timePerItem = itemDef.nutrientCost / fertilitySpeed;

            // 考慮玩家速度加成後的單機產量 (items/min)
            const machineOutputRate = (60 / timePerItem) * p.speedMult;
            const itemsPerMinPerMachine = Math.min(machineOutputRate, p.beltSpeed);

            // 計算所需機器總數，並處理浮點數捨入問題 (靠近整數時自動校正)
            let machinesNeeded = netRate / itemsPerMinPerMachine;
            if (Math.abs(Math.round(machinesNeeded) - machinesNeeded) < 0.0001) {
                machinesNeeded = Math.round(machinesNeeded);
            }

            // --- 2. 全域負載與需求追蹤 ---
            const totalNutrientsNeeded = netRate * itemDef.nutrientCost;
            const itemsNeeded = totalNutrientsNeeded / grossFertVal;
            globalFertDemandItems += itemsNeeded;
            globalBioLoad += (totalNutrientsNeeded / 60);

            // --- 3. 處理非 Ghost 模式下的顯示邏輯 (UI/Tags) ---
            if (!effectiveGhost) {
                // A. 記錄機器數量
                addMachineCount(machineName, item, Math.ceil(machinesNeeded - 0.0001), machinesNeeded);

                // B. 生成 Tooltip 資訊
                const actualBaseTime = timePerItem * (60 / p.speedMult);
                const tooltipText = [
                    `Recipe: ${item} (${t(machineName, 'machines')})`,
                    `Base Time: ${actualBaseTime.toFixed(1)}s`,
                    `Speed Mult: ${p.speedMult.toFixed(2)}x`,
                    `Throughput: ${itemsPerMinPerMachine.toFixed(2)} items/min`
                ].join('\n');

                // C. 生成機器標籤 (Machine Tag)
                let capTag = "";
                if (p.showMaxCap) {
                    const maxOutput = Math.ceil(machinesNeeded) * itemsPerMinPerMachine;
                    const usageRatio = netRate / maxOutput;
                    capTag = `<span class="max-cap-tag" onclick="recalculate('${p.targetItem}', ${p.targetRate / usageRatio})">(Max: ${formatVal(maxOutput)}/m)</span>`;
                }
                machineTag = `<span class="machine-tag" data-tooltip="${tooltipText}">${Math.ceil(machinesNeeded)} ${t(machineName, 'machines')}${capTag}</span>`;

                // D. 生成生物/肥料標籤 (Bio Tag)
                const fertRate = netRate * itemDef.nutrientCost / grossFertVal;
                let bioText = `-${formatVal(fertRate)}/m ${p.selectedFert}`;
                
                if (p.showHeatFert) {
                    bioText += ` (${formatVal(fertRate)} V/s)`;
                }
                bioTag = `<span class="bio-tag">${bioText}</span>`;

                // E. 生成成本標籤 (Cost Tag)
                if (p.showFertCost && p.fertCost > Number.EPSILON) {
                    const costPerMin = Math.ceil(fertRate * p.fertCost - Number.EPSILON);
                    costTag += `<span class="cost-tag">(${costPerMin.toLocaleString()} G/m)</span>`;
                }
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
                    }
                    else {
                        if (!globalForcedItems[item]) globalForcedItems[item] = 0;
                        globalForcedItems[item] += netRate;
                        detailsTag = `<span class="details">(${t('External Input')})</span>`;
                    }                    
                }
            } else {
                hasChildren = true;
                let batchYield = recipe.outputs[item] || 1;
                if (recipe.machine === "Extractor" || recipe.machine === "Thermal Extractor" || recipe.machine === "Alembic" || recipe.machine === "Advanced Alembic") { 
                    const ratio = recipe.machine === "Thermal Extractor" ? p.alchemyMult * 3 : p.alchemyMult;
                    batchYield *= ratio;
                    outputTag = `<span class="output-tag">${t('Yields')}: ${(ratio*100).toFixed(0)}%</span>`
                }
                
                const batchesPerMin = netRate / batchYield;
                const maxBatchesPerMin = (60 / recipe.baseTime) * p.speedMult;
                const isLiquid = (itemDef.liquid === true);
                let effectiveBatchesPerMin = maxBatchesPerMin;
                
                if (!isLiquid) {
                    const maxItemsPerMin = maxBatchesPerMin * batchYield;
                    if (maxItemsPerMin > p.beltSpeed) { effectiveBatchesPerMin = p.beltSpeed / batchYield; }
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
                    }
                });

                if(!effectiveGhost) {
                    addMachineCount(recipe.machine, item, Math.ceil(machinesNeeded - 0.0001), machinesNeeded);
                }

                // HEAT CALCULATION
                if (DB.machines[recipe.machine] && DB.machines[recipe.machine].heatCost) {
                    const mach = DB.machines[recipe.machine]; const parent = DB.machines[mach.parent];
                    const sReq = mach.slotsRequired || 1; const pSlots = mach.parentSlots || parent.slots || 3;
                    let activeHeat = mach.heatCost * p.speedMult;
                    if (mach.heatCost < 0) { activeHeat = (recipe.heatCost ?? 0) * p.speedMult; console.log(recipe.heatCost)} // Overwrite 
                    
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
                        const fuelRate = ((totalHeatPs * 60) / grossFuelEnergy);
                        heatTag = `-${formatVal(fuelRate)}/m ${p.selectedFuel}`;
                        if (p.showHeatFert) heatTag += ` (${formatVal(totalHeatPs)} P/s)`;
                        heatTag = `<span class="heat-tag">` + heatTag + `</span>`;
                        if (p.showFuelCost && p.fuelCost > Number.EPSILON) costTag += `<span class="cost-tag">(${Math.ceil(fuelRate * p.fuelCost - Number.EPSILON).toLocaleString()} G/m)</span>`;
                    }
                }

                if(!effectiveGhost) {
                    let inputsStr = Object.keys(recipe.inputs).map(k => `${recipe.inputs[k]} ${k}`).join(', ');
                    let outputsStr = Object.keys(recipe.outputs).map(k => `${recipe.outputs[k]} ${k}`).join(', ');
                    let cycleTime = recipe.baseTime / p.speedMult;
                    let throughput = effectiveBatchesPerMin * batchYield;
                    let tooltipText = `Recipe: ${inputsStr} -> ${outputsStr}\nBase Time: ${recipe.baseTime}s\nSpeed Mult: ${p.speedMult.toFixed(2)}x\nCycle Time: ${cycleTime.toFixed(2)}s\nThroughput: ${throughput.toFixed(2)} items/min per machine`;

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
        const div = document.createElement('div'); div.className = 'node'; div.setAttribute('data-depth', depth % 10);
        if (GLOBAL_CALC_STATE.collapsedNode.has(pathKey)) div.classList.add('collapsed');
        let arrowHtml = `<span class="tree-arrow" style="visibility:${hasChildren ? 'visible' : 'hidden'}" onclick="toggleNode(this, '${pathKey}')">▼</span>`;
        let nodeContent = `
            ${arrowHtml}
            <span class="qty">${formatVal(rate)}/m</span>
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
    if(p.targetItem) {
        const root = buildNode(p.targetItem, grossRate, false, [], 0);
        if(!isGhost) {
            const h = document.createElement('div'); h.className = 'section-header'; h.innerText = `--- ${t('Primary Production Chain')} (${p.targetItem}) ---`; treeContainer.appendChild(h); 
            treeContainer.appendChild(root);
        }
    }

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
        // --- 1. 渲染外部輸入 (External Inputs) ---
        renderExternalInputs();

        // --- 2. 渲染副產品 (Byproducts) ---
        renderByproducts();

        // --- 3. 機器數據聚合 (Machine Stats) ---
        const { flatMax, flatMin } = aggregateMachineStats(machineStats);

        // --- 4. 計算熔爐數量 ---
        const totalFurnaces = calculateTotalFurnaces(furnaceSlotDemand);

        // --- 5. 更新 UI 組件 ---
        updateConstructionList(flatMax, flatMin, totalFurnaces);
        
        // 計算最終成本並更新摘要
        updateSummaryBox(p, globalHeatLoad, globalBioLoad, globalCostPerMin, globalFuelDemandItems, globalFertDemandItems);


        let summaryLine = "";
        Object.entries(globalRawItems).forEach(([name, rate]) => {
            const qty = Number(rate.toFixed(2));
            summaryLine += ` <span class="qty" style="color:var(--accent)">${qty}<img src="img/item${DB.items[name]?.id ?? 0}.png" title="${name}" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;"></span>`;
        });
        Object.entries(globalForcedItems).forEach(([name, rate]) => {
            const qty = Number(rate.toFixed(2));
            summaryLine += ` <span class="qty" style="color:var(--accent)">${qty}<img src="img/item${DB.items[name]?.id ?? 0}.png" title="${name}" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;"></span>`;
        });
        summaryLine += `<span style="color:var(--info);"> ➔ </span>`;
        summaryLine += ` <span class="qty" style="color:var(--profit)">${Number(p.targetRate.toFixed(2))}<img src="img/item${DB.items[p.targetItem]?.id ?? 0}.png" title="${p.targetItem}" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;"></span>  `;
        Object.entries(globalAvilByproducts).forEach(([name, rate]) => {
            const qty = Number(rate.toFixed(2));
            if (qty > 0.001) summaryLine += ` <span class="qty" style="color:var(--byproduct)">${qty}<img src="img/item${DB.items[name]?.id ?? 0}.png" title="${name}" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;"></span>`;
        });
        document.getElementById('summary-line').innerHTML = summaryLine;
    }

    // --- 以下為封裝的邏輯函式 ---

    function renderExternalInputs() {
        const extH = Object.assign(document.createElement('div'), {
            className: 'section-header',
            innerText: '--- External Inputs ---'
        });
        treeContainer.appendChild(extH);

        let html = createNodeItemHTML(t('Raw Material Cost'), `${Math.ceil(globalCostPerMin).toLocaleString()} G/m`, 'gold');

        // 燃料輸入
        if (!p.selfFuel && globalFuelDemandItems > Number.EPSILON) {
            let costTag = (p.showFuelCost && p.fuelCost > Number.EPSILON) 
                ? `<span class="cost-tag">(${Math.ceil(globalFuelDemandItems * p.fuelCost).toLocaleString()} G/m)</span>` 
                : '';
            html += createNodeItemHTML(p.selectedFuel, `${globalFuelDemandItems.toFixed(2)}/m`, 'fuel', `(${t('Fuel Import')}) ${costTag}`);
        }

        // 肥料輸入
        if (!p.selfFert && globalFertDemandItems > Number.EPSILON) {
            let costTag = (p.showFertCost && p.fertCost > Number.EPSILON) 
                ? `<span class="cost-tag">(${Math.ceil(globalFertDemandItems * p.fertCost).toLocaleString()} G/m)</span>` 
                : '';
            html += createNodeItemHTML(p.selectedFert, `${globalFertDemandItems.toFixed(2)}/m`, 'bio', `(${t('Fertilizer Import')}) ${costTag}`);
        }

        // 強制項目
        Object.entries(globalForcedItems).forEach(([name, rate]) => {
            html += createNodeItemHTML(name, `${formatVal(rate)}/m`, 'default', `(${t('External Input')})`);
        });

        const extDiv = Object.assign(document.createElement('div'), { className: 'node', innerHTML: html });
        treeContainer.appendChild(extDiv);
    }

    function renderByproducts() {
        const bypHeader = Object.assign(document.createElement('div'), {
            className: 'section-header',
            innerText: '--- BYPRODUCTS ---'
        });
        treeContainer.appendChild(bypHeader);

        const sortedNames = Object.keys(globalTotalByproducts).sort();
        let html = '';

        if (sortedNames.length > 0) {
            sortedNames.forEach(name => {
                const remaining = globalAvilByproducts[name] || 0;
                const total = globalTotalByproducts[name];
                const recycledNote = remaining < total 
                    ? ` <span style="font-size:0.8em; color:#888;">(${formatVal(total - remaining)} ${t('recycled')})</span>` 
                    : '';
                html += createNodeItemHTML(name, `${formatVal(remaining)}/m`, 'byproduct', recycledNote);
            });
        } else {
            html = `<div class="node-content"><span class="details" style="font-style:italic">${t('None')}</span></div>`;
        }

        const bypDiv = Object.assign(document.createElement('div'), { className: 'node', innerHTML: html });
        treeContainer.appendChild(bypDiv);
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
function updateConstructionList(maxCounts, minCounts, furnaces) {
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
    const outputHtml = `
        <div class="stat-block">
            <span class="stat-label">${t('Gross Output')}</span>
            <span class="stat-value net-positive">${targetRate.toFixed(1)} / min <img src="img/item${DB.items[targetItem]?.id ?? 0}.png" width="24" height="24" style="vertical-align: middle; margin-bottom: 4px;"></span>
            ${usedRate > Number.EPSILON ? `<span class="stat-sub" onclick="recalculate('${targetItem}' , ${refRate})">Net: ${netRate.toFixed(1)} / min <br>Used: ${usedRate.toFixed(1)} / min</span>` : ''}
        </div>`;

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
    costHtml += `</div>`;

    // --- Value Block ---
    let valueHtml = `<div class="stat-block"><span class="stat-label">${t('Unit Value')}</span>`;
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
