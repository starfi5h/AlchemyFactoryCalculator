/* ==========================================================================
   ALCHEMY CALCULATOR CORE ENGINE
   Handles recursion, math, and tree node generation.
   ========================================================================== */

let rowCounter = 0;
let globalByproducts = {};

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

function getProductionHeatCost(item, speedMult, alchemyMult) {
    let cost = 0; const recipe = getActiveRecipe(item);
    if (recipe && recipe.outputs[item]) {
         let batchYield = recipe.outputs[item];
         if (recipe.machine === "Extractor" || recipe.machine === "Thermal Extractor" || recipe.machine === "Alembic" || recipe.machine === "Advanced Alembic") batchYield *= alchemyMult;
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
        if (recipe.machine === "Extractor" || recipe.machine === "Thermal Extractor" || recipe.machine === "Alembic" || recipe.machine === "Advanced Alembic") batchYield *= alchemyMult;
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
        
        // 1. Gather Inputs
        let rawInput = document.getElementById('targetItemInput').value.trim();
        let targetItem = Object.keys(DB.items).find(k => k.toLowerCase() === rawInput.toLowerCase()) || rawInput;
        const targetRate = parseFloat(document.getElementById('targetRate').value) || 0;
        
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
        


        const params = {
            targetItem, targetRate, 
            selectedFuel, selfFuel, fuelCost, showFuelCost,
            selectedFert, selfFert, fertCost, showFertCost,
            showMaxCap, showHeatFert,
            lvlSpeed, lvlBelt, lvlFuel, lvlAlchemy, lvlFert,
            speedMult: getSpeedMult(lvlSpeed),
            alchemyMult: getAlchemyMult(lvlAlchemy),
            fuelMult: 1 + (lvlFuel * 0.10),
            fertMult: 1 + (lvlFert * 0.10),
            beltSpeed: getBeltSpeed(lvlBelt)
        };

        

        try {
            // --- UPDATE SMART LABEL ---
            if (typeof getSmartLabel === 'function') {
                const lbl = getSmartLabel(targetRate, params.beltSpeed);
                document.getElementById('rateLabel').innerText = `${t('Rate (Items/Min)')}: ${lbl}`;
            }
            
            const fuelDef = DB.items[selectedFuel] || {};
            let netHeat = (fuelDef.heat || 0) * (1 + (lvlFuel * 0.10));
            document.getElementById('fuelEfficiencyCost').innerText = (fuelCost == 0 || netHeat == 0) ? '' : (fuelCost/netHeat).toFixed(4) + ' G/P';

            const fertDef = DB.items[selectedFert] || {};
            let netNtur = (fertDef.nutrientValue || 0) * (1 + (lvlFert * 0.10));
            document.getElementById('fertEfficiencyCost').innerText = (fertCost == 0 || netNtur == 0) ? '' : (fertCost/netNtur).toFixed(4) + ' G/V';

        } catch(e) { console.error(e); }

        // --- PASS 1: GHOST CALCULATION (Find Byproducts) ---
        globalByproducts = {}; 
        calculatePass(params, true); // True = Ghost Mode (No DOM, just Byproducts)

        // --- PASS 2: RENDER ---
        rowCounter = 0;
        document.getElementById('tree').innerText = '';
        calculatePass(params, false); // False = Render Mode

        // --- PASS 3: TRANSLATION --- (extra)
        translateText();
        updateURL();

    } catch(e) { console.error(e); }
}

function calculatePass(p, isGhost) {
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
    let totalByproducts = {}; let globalForcedItems = {};

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
    function buildNode(item, rate, isInternalModule, ancestors = [], forceGhost = false) {
        const effectiveGhost = isGhost || forceGhost;

        // RECYCLING CHECK
        let deduction = 0;
        let pathKey = ancestors.join(">") + ">" + item;
        let canRecycle = false;
        const isExternalInput = GLOBAL_CALC_STATE.forcedExternals.has(pathKey);
        
        if (!effectiveGhost) {
            if (globalByproducts[item] && globalByproducts[item] > 0.01) {
                canRecycle = true;
                if (GLOBAL_CALC_STATE.activeRecyclers.has(pathKey)) {
                    deduction = Math.min(rate, globalByproducts[item]);
                    globalByproducts[item] -= deduction; 
                }
            }
        }

        const netRate = Math.max(0, rate - deduction);
        const itemDef = DB.items[item] || {}; 
        let ingredientChildren = []; 
        let currentPath = [...ancestors, item];
        let myRowID = 0;
        
        if (!effectiveGhost) { rowCounter++; myRowID = rowCounter; }

        let outputTag = ""; let machineTag = ""; let heatTag = ""; let swapBtn = ""; let byproductTag = "";
        let bioTag = ""; let costTag = ""; let detailsTag = ""; let recycleTag = ""; let externalTag = "";
        let machinesNeeded = 0; let hasChildren = false;

        let isFuel = (item === p.selectedFuel); let isFert = (item === p.selectedFert);
        if (p.showHeatFert) {
            if(isFuel) { outputTag = `<span class="output-tag">Output: ${formatVal((rate * (fuelDef.heat||10)*p.fuelMult)/60)} P/s</span>`; }
            else if (isFert) { outputTag = `<span class="output-tag">Output: ${formatVal((rate * fertDef.nutrientValue*p.fertMult)/60)} V/s</span>`; }
        }

        // --- RECYCLE UI ---
        if (canRecycle && !effectiveGhost) {
            if (GLOBAL_CALC_STATE.activeRecyclers.has(pathKey)) {
                let activeClass = "active";
                let label = `♻️ ${formatVal(deduction)} ${t('Used')}`;
                recycleTag = `<div><button class="recycle-btn ${activeClass}" onclick="toggleRecycle('${pathKey}')">${label}</button></div>`;
            } else {
                let label = `♻️ ${formatVal(globalByproducts[item])} ${t('Avail')}`;
                recycleTag = `<div><button class="recycle-btn" onclick="toggleRecycle('${pathKey}')">${label}</button></div>`;
            }
        }

        // --- External UI ---
        if (!effectiveGhost) {            
            externalTag = `<div><input type="checkbox" ${isExternalInput ? 'checked':''} id="buildModeToggle" onchange="toggleExternal('${pathKey}');"></input></div>`;
        }

        // Logic branching based on Item Type
        if (isExternalInput) {
            if (!effectiveGhost && netRate > 0) {
                if (!globalForcedItems[item]) globalForcedItems[item] = 0;
                globalForcedItems[item] += netRate;
                detailsTag = `<span class="details">(${t('External Input')})</span>`;
            }
        }
        else if (itemDef.category === "Herbs" && itemDef.nutrientCost) {
            // Nursery Logic
            const fertilitySpeed = (fertDef.maxFertility || 12); const timePerItem = itemDef.nutrientCost / fertilitySpeed; 
            const calculatedSpeed = (60 / timePerItem) * p.speedMult; 
            const isLiquid = (itemDef.liquid === true);
            const itemsPerMinPerMachine = isLiquid ? calculatedSpeed : Math.min(calculatedSpeed, p.beltSpeed);
            
            machinesNeeded = netRate / itemsPerMinPerMachine;
            if (Math.abs(Math.round(machinesNeeded) - machinesNeeded) < 0.0001) { machinesNeeded = Math.round(machinesNeeded); }

            if(!effectiveGhost) {
                addMachineCount("Nursery", item, Math.ceil(machinesNeeded - 0.0001), machinesNeeded);
            }

            const totalNutrientsNeeded = netRate * itemDef.nutrientCost; const itemsNeeded = totalNutrientsNeeded / grossFertVal; 
            
            // FIX: Always track Global Load (Fixes Summary Box)
            if (effectiveGhost || !isInternalModule || isInternalModule) {
                globalFertDemandItems += itemsNeeded; 
                globalBioLoad += (totalNutrientsNeeded / 60); 
            }
            
            if(!effectiveGhost) {
                let tooltipText = `Recipe: ${item} (Nursery)\nBase Time: ${(timePerItem * (60/p.speedMult)).toFixed(1)}s\nSpeed Mult: ${p.speedMult.toFixed(2)}x\nThroughput: ${itemsPerMinPerMachine.toFixed(2)} items/min`;
                let capTag = "";
                if(p.showMaxCap) {
                    const maxOutput = Math.ceil(machinesNeeded) * itemsPerMinPerMachine;
                    capTag = `<span class="max-cap-tag">(Max: ${formatVal(maxOutput)}/m)</span>`;
                }
                machineTag = `<span class="machine-tag" data-tooltip="${tooltipText}">${Math.ceil(machinesNeeded)} ${t('Nursery', 'machines')}${capTag}</span>`;

                const fertRate = netRate * itemDef.nutrientCost / grossFertVal;
                bioTag = `-${formatVal(fertRate)}/m ${p.selectedFert}`;
                if (p.showHeatFert) bioTag += ` (${formatVal(netRate * itemDef.nutrientCost / grossFertVal)} V/s)`;
                bioTag = `<span class="bio-tag">` + bioTag + `</span>`;
                if (p.showFertCost && p.fertCost > Number.EPSILON) costTag += `<span class="cost-tag">(${Math.ceil(fertRate * p.fertCost - Number.EPSILON).toLocaleString()} G/m)</span>`;
            }
        } 
        else {
            const recipe = getActiveRecipe(item);
            if (!recipe) {
                if(!effectiveGhost) {
                    if(itemDef.buyPrice) { 
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
                if (recipe.machine === "Extractor" || recipe.machine === "Thermal Extractor" || recipe.machine === "Alembic" || recipe.machine === "Advanced Alembic") batchYield *= p.alchemyMult;
                
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
                        
                        if(effectiveGhost) {
                            if(!globalByproducts[outKey]) globalByproducts[outKey] = 0;
                            globalByproducts[outKey] += totalByproduct;
                        } 
                        
                        if (!effectiveGhost) {
                            if(!totalByproducts[outKey]) totalByproducts[outKey] = 0;
                            totalByproducts[outKey] += totalByproduct;
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
                    if (recipe.heatCost !== undefined) { activeHeat = recipe.heatCost * p.speedMult;} // Overwrite 
                    
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
                        capTag = `<span class="max-cap-tag">(Max: ${formatVal(maxOutput)}/m)</span>`;
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
                buildNode(child.item, child.rate, isInternalModule, currentPath, effectiveGhost); 
            });
            return null; 
        }

        // --- RENDER DOM ---
        const div = document.createElement('div'); div.className = 'node';
        if (GLOBAL_CALC_STATE.collapsedNode.has(pathKey)) div.classList.add('collapsed');
        let arrowHtml = `<span class="tree-arrow" style="visibility:${hasChildren ? 'visible' : 'hidden'}" onclick="toggleNode(this, '${pathKey}')">▼</span>`;
        let nodeContent = `
            ${arrowHtml}
            <span class="row-id" onclick="toggleNode(this, '${pathKey}')">${myRowID})</span>
            <span class="qty">${formatVal(rate)}/m</span>
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
                childrenDiv.appendChild(buildNode(child.item, child.rate, isInternalModule, currentPath, effectiveGhost)); 
            });
            div.appendChild(childrenDiv);
        }
        return div;
    }

    // --- EXECUTE THE PASS ---
    if(p.targetItem) {
        const root = buildNode(p.targetItem, grossRate, false, []);
        if(!isGhost) {
            const h = document.createElement('div'); h.className = 'section-header'; h.innerText = `--- ${t('Primary Production Chain')} (${p.targetItem}) ---`; treeContainer.appendChild(h); 
            treeContainer.appendChild(root);
        }
    }

    if (!isGhost) {
        let stableFuelDemand = globalFuelDemandItems;
        let stableFertDemand = globalFertDemandItems;
        let byproductSnapshot = {...globalByproducts}; 
        
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
                
                globalByproducts = {...byproductSnapshot}; 
                
                let prevFuel = stableFuelDemand;
                let prevFert = stableFertDemand;
                
                if (p.selfFert && prevFert > 0) {
                    buildNode(p.selectedFert, prevFert, true, [], true); 
                }
                
                if (p.selfFuel && prevFuel > 0) {
                    buildNode(p.selectedFuel, prevFuel, true, [], true); 
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
                    const h = document.createElement('div'); h.className = 'section-header'; h.innerText = `--- ${t('Internal Nutrient Module')} (${p.selectedFert}) ---`; treeContainer.appendChild(h); rowCounter=0; 
                    treeContainer.appendChild(buildNode(p.selectedFert, grossFertNeeded, true, []));
                }
            }

            if (p.selfFuel && stableFuelDemand > 0) {
                const grossFuelNeeded = stableFuelDemand;
                if (p.targetItem == p.selectedFuel) {
                    // Do nothing
                } else {
                    const h = document.createElement('div'); h.className = 'section-header'; h.innerText = `--- ${t('Internal Heat Module')} (${p.selectedFuel}) ---`; treeContainer.appendChild(h); rowCounter=0; 
                    treeContainer.appendChild(buildNode(p.selectedFuel, grossFuelNeeded, true, []));
                }
            }
        }
    }

    if (!isGhost) {
        // --- SUMMARY & EXTERNALS ---
        const extH = document.createElement('div'); extH.className = 'section-header'; extH.innerText = `--- External Inputs ---`; treeContainer.appendChild(extH);
        const extDiv = document.createElement('div'); extDiv.className = 'node';
        let extHTML = `<div class="node-content" style="margin-bottom:5px;"><span class="qty" style="color:var(--gold)">${Math.ceil(globalCostPerMin).toLocaleString()} G/m</span><strong>${t('Raw Material Cost')}</strong></div>`;
        if (!p.selfFuel && globalFuelDemandItems > Number.EPSILON) { 
            extHTML += `<div class="node-content" style="margin-bottom:5px;"><span class="qty" style="color:var(--fuel)">${globalFuelDemandItems.toFixed(2)}/m</span><strong>${p.selectedFuel}</strong> (${t('Fuel Import')})`;
            if (p.showFuelCost && p.fuelCost > Number.EPSILON) extHTML += `<span class="cost-tag">(${Math.ceil(globalFuelDemandItems * p.fuelCost - Number.EPSILON).toLocaleString()} G/m)</span>`;
            extHTML += `</div>`;
        }
        if (!p.selfFert && globalFertDemandItems > Number.EPSILON) { 
            extHTML += `<div class="node-content" style="margin-bottom:5px;"><span class="qty" style="color:var(--bio)">${globalFertDemandItems.toFixed(2)}/m</span><strong>${p.selectedFert}</strong> (${t('Fertilizer Import')})`; 
            if (p.showFertCost && p.fertCost > Number.EPSILON) extHTML += `<span class="cost-tag">(${Math.ceil(globalFertDemandItems * p.fertCost - Number.EPSILON).toLocaleString()} G/m)</span>`;
            extHTML += `</div>`;
        }
        Object.keys(globalForcedItems).forEach(itemName => {
            const rate = globalForcedItems[itemName];
            extHTML += `
                <div class="node-content" style="margin-bottom:5px;">
                    <span class="qty">${formatVal(rate)}/m</span>
                    <strong>${itemName}</strong> 
                    (${t('External Input')})
                </div>`;
        });

        extDiv.innerHTML = extHTML; treeContainer.appendChild(extDiv);

        const bypHeader = document.createElement('div'); bypHeader.className = 'section-header'; bypHeader.innerText = `--- BYPRODUCTS ---`; treeContainer.appendChild(bypHeader);
        const bypDiv = document.createElement('div'); bypDiv.className = 'node';
        let bypHTML = '';
        const sortedByproducts = Object.keys(totalByproducts).sort();
        if (sortedByproducts.length > 0) {
            sortedByproducts.forEach(item => {
                let remaining = globalByproducts[item] || 0; 
                let note = "";
                if (remaining < totalByproducts[item]) {
                    note = ` <span style="font-size:0.8em; color:#888;">(${formatVal(totalByproducts[item] - remaining)} ${t(`recycled`, `ui`)})</span>`;
                }
                bypHTML += `<div class="node-content"><span class="qty" style="color:var(--byproduct)">${formatVal(remaining)}/m</span><strong>${item}</strong>${note}</div>`;
            });
        } else {
            bypHTML = `<div class="node-content"><span class="details" style="font-style:italic">${t('None')}</span></div>`;
        }
        bypDiv.innerHTML = bypHTML; treeContainer.appendChild(bypDiv);

        // --- FLATTEN AGGREGATION FOR UI ---
        let flatMax = {};
        let flatMin = {};
        
        Object.keys(machineStats).forEach(mName => {
            let totalIntMax = 0;
            let totalCeiledMin = 0;
            
            Object.keys(machineStats[mName]).forEach(outItem => {
                const data = machineStats[mName][outItem];
                totalIntMax += data.nodeSumInt;
                totalCeiledMin += Math.ceil(data.rawFloat - 0.0001);
            });
            
            flatMax[mName] = totalIntMax;
            flatMin[mName] = totalCeiledMin;
        });

        // CALCULATE FINAL FURNACE COUNT FROM SLOTS
        let totalFurnaces = 0;
        Object.keys(furnaceSlotDemand).forEach(parentName => {
            const parentDef = DB.machines[parentName];
            if (parentDef) {
                totalFurnaces += Math.ceil((furnaceSlotDemand[parentName] - 0.0001) / (parentDef.slots || 3));
            }
        });

        updateConstructionList(flatMax, flatMin, totalFurnaces);
        
        // Pass the actual simulated fuel/fert demand items to the summary
        if (p.fuelCost > Number.EPSILON) globalCostPerMin += p.fuelCost * globalFuelDemandItems;
        if (p.fertCost > Number.EPSILON) globalCostPerMin += p.fertCost * globalFertDemandItems;
        updateSummaryBox(p, globalHeatLoad, globalBioLoad, globalCostPerMin, globalFuelDemandItems, globalFertDemandItems);
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
                    <span>${mat}</span> 
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

function updateSummaryBox(p, heat, bio, cost, actualFuelNeed, actualFertNeed) {
    const { targetItem, targetRate, selfFuel, selfFert, beltSpeed, selectedFuel, selectedFert } = p;
    const targetItemDef = DB.items[targetItem] || {};

    // --- Output Blocks ---
    let usedRate = 0.0;
    if (selfFuel && targetItem === selectedFuel) usedRate += actualFuelNeed;
    if (selfFert && targetItem === selectedFert) usedRate += actualFertNeed;
    const netRate = targetRate - usedRate;
    const outputHtml = `
        <div class="stat-block">
            <span class="stat-label">${t('Gross Output')}</span>
            <span class="stat-value ${targetRate >= 0 ? 'net-positive' : 'net-warning'}">${targetRate.toFixed(1)} / min</span>
            ${usedRate > Number.EPSILON ? `<span class="stat-sub">Net: ${netRate.toFixed(1)} / min <br>Used: ${usedRate.toFixed(1)} / min</span>` : ''}
        </div>`;

    // --- Load Blocks ---
    const loadHtml = `
        <div class="stat-block">
            <span class="stat-label">${t('Load')}</span>
            <span class="stat-value" style="color:var(--fuel);">${t('Heat')}: ${(heat * 60).toLocaleString()} P / min</span>
            <span class="stat-value" style="color:var(--bio);">${t('Nutr')}: ${(bio * 60).toLocaleString()} V / min</span>
        </div>`;

    // --- Cost Block ---
    let valueHtml = ``;
    if (targetItemDef.sellPrice) {
        const profit = (targetRate * targetItemDef.sellPrice) - cost;
        const colorClass = profit >= 0 ? 'gold-profit' : 'gold-cost';
        valueHtml = `
            <div class="stat-block">
                <span class="stat-label">${t('Estimated Value')}</span>
                <span class="stat-value gold-cost">${t('Cost')}: ${Math.ceil(cost).toLocaleString()} G / min</span>
                <span class="stat-value ${colorClass}">${t('Profit')}: ${Math.floor(profit).toLocaleString()} G / min</span>
            </div>`;
    } else {
        valueHtml = `
            <div class="stat-block">
                <span class="stat-label">${t('Estimated Value')}</span>
                <span class="stat-value gold-cost">${t('Cost')}: ${Math.ceil(cost).toLocaleString()} G / min</span>
            </div>`;
    }

    // --- Combine ---
    document.getElementById('summary-container').innerHTML = `
        <div class="summary-box">
            ${outputHtml}
            ${loadHtml}
            ${valueHtml}
        </div>`;
}
