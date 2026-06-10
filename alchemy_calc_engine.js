(function (global) {
    const YIELD_MULTIPLIER_MACHINES = ["Extractor", "Thermal Extractor", "Alembic", "Advanced Alembic"];

    function getBeltSpeed(lvl) {
        let speed = 60;
        if (lvl > 0) speed += Math.min(lvl, 12) * 15;
        if (lvl > 12) speed += (lvl - 12) * 3;
        return speed;
    }

    function getSpeedMult(lvl) {
        let mult = 1.0;
        mult += Math.min(lvl, 12) * 0.25;
        if (lvl > 12) mult += (lvl - 12) * 0.05;
        return mult;
    }

    function getAlchemyMult(lvl) {
        if (lvl <= 0) return 1.0;
        let percent = 0;
        for (let i = 1; i <= lvl; i++) {
            if (i <= 2) percent += 6;
            else if (i <= 8) percent += 8;
            else percent += 10;
        }
        return 1.0 + (percent / 100);
    }

    function getRecipesFor(db, item) {
        if (!db.recipes) return [];
        return db.recipes.filter(recipe => recipe.outputs[item]);
    }

    function getPreferredRecipe(db, state, item) {
        const candidates = getRecipesFor(db, item);
        if (candidates.length === 0) return null;
        if (candidates.length === 1) return candidates[0];

        const prefId = state?.preferredRecipes?.[item];
        if (prefId) {
            const found = candidates.find(recipe => recipe.id === prefId);
            if (found) return found;
        }
        return candidates[0];        
    }

    function getActiveRecipe(db, state, item) {
        // Return a copy of effective recipe
        const recipe = getPreferredRecipe(db, state, item);
        if (!recipe) return null;        

        // Apply recipeModifiers
        if (recipe.machine === 'Advanced Athanor') {            
            const cats = state?.recipeModifiers?.[recipe.id]?.catalysts;
            if (!cats || cats.length === 0) return recipe;

            let recipeInputs = { ...recipe.inputs };
            let recipeOutputs = { ...recipe.outputs };
            if (cats.includes('eternal')) {
                recipeInputs = {};
                const [itemKey, itemValue] = Object.entries(DB.items).find(([name, item]) => item.charges === 99999);
                recipeInputs[itemKey] = recipe.ChargeCost / 99999;
            }
            if (cats.includes('unstable')) {
                recipeOutputs = { ...recipe.unstableOutputs };
                const [itemKey, itemValue] = Object.entries(DB.items).find(([name, item]) => item.charges === 180);
                recipeInputs[itemKey] = recipe.ChargeCost / 180;
            }
            if (cats.includes('resonant')) {
                recipeOutputs = { ...recipe.resonantOutputs };
                const [itemKey, itemValue] = Object.entries(DB.items).find(([name, item]) => item.charges === 1500);
                recipeInputs[itemKey] = recipe.ChargeCost / 1500;
            }
            if (cats.includes('fertile')) {                
                for (const k in recipeOutputs) recipeOutputs[k] *= 2;
                const [itemKey, itemValue] = Object.entries(DB.items).find(([name, item]) => item.charges === 240);
                recipeInputs[itemKey] = recipe.ChargeCost / 240;
            }
            const r = { ...recipe, outputs: recipeOutputs, inputs: recipeInputs };
            return r;
        }
        return recipe;
    }

    function applyAlchemyMult(machineName, batchYield, alchemyMult) {
        if (YIELD_MULTIPLIER_MACHINES.includes(machineName)) {
            batchYield *= alchemyMult;
            if (machineName === "Thermal Extractor") batchYield *= 3;
        }
        return batchYield;
    }

    function getProductionHeatCost(db, state, item, speedMult, alchemyMult) {
        let cost = 0;
        const recipe = getActiveRecipe(db, state, item);
        if (recipe && recipe.outputs[item]) {
            let batchYield = recipe.outputs[item];
            batchYield = applyAlchemyMult(recipe.machine, batchYield, alchemyMult);
            if (db.machines[recipe.machine] && db.machines[recipe.machine].heatCost) {
                const machine = db.machines[recipe.machine];
                const parent = db.machines[machine.parent];
                const slotsRequired = machine.slotsRequired || 1;
                const parentSlots = machine.parentSlots || parent.slots || 3;
                const heatPerSec = (machine.heatCost * speedMult) + (parent.heatSelf / (parentSlots / slotsRequired));
                cost += heatPerSec * ((recipe.baseTime / speedMult) / batchYield);
            }

            Object.keys(recipe.inputs).forEach(inputName => {
                cost += getProductionHeatCost(db, state, inputName, speedMult, alchemyMult) * (recipe.inputs[inputName] / batchYield);
            });
        }
        return cost;
    }

    function getProductionFertCost(db, state, item, fertVal, fertSpeed, speedMult, alchemyMult) {
        let cost = 0;
        const itemDef = db.items[item] || {};
        if (itemDef.category === "Herbs" && itemDef.nutrientCost) cost += itemDef.nutrientCost;
        const recipe = getActiveRecipe(db, state, item);
        if (recipe && recipe.outputs[item]) {
            let batchYield = recipe.outputs[item];
            batchYield = applyAlchemyMult(recipe.machine, batchYield, alchemyMult);
            Object.keys(recipe.inputs).forEach(inputName => {
                cost += getProductionFertCost(db, state, inputName, fertVal, fertSpeed, speedMult, alchemyMult) * (recipe.inputs[inputName] / batchYield);
            });
        }
        return cost;
    }

    function cloneRecord(record) {
        return { ...record };
    }

    function createAggregates() {
        return {
            fuelDemandItems: 0,
            fertDemandItems: 0,
            heatLoad: 0,
            bioLoad: 0,
            goldPerMin: 0,
            forcedItems: {},
            rawItems: {},
            extraBuildCosts: {},
            machineStats: {},
            furnaceSlotDemand: {},
            commonNodesMap: {},
            byproductProducersMap: {},
            rawMaterialSourceMap: [],
            fuelSourceMap: [],
            fertSourceMap: [],
            externalSourceMap: {},
            totalByproducts: {}
        };
    }

    function ensureRecord(map, key, factory) {
        if (!map[key]) map[key] = factory();
        return map[key];
    }

    function addMachineCount(aggregates, machineName, outputItem, countMax, countRaw) {
        const machineEntry = ensureRecord(aggregates.machineStats, machineName, () => ({}));
        const outputEntry = ensureRecord(machineEntry, outputItem, () => ({ rawFloat: 0, nodeSumInt: 0 }));
        outputEntry.rawFloat += countRaw;
        outputEntry.nodeSumInt += countMax;
    }

    function pushExternalSource(aggregates, item, source) {
        const sources = ensureRecord(aggregates.externalSourceMap, item, () => []);
        sources.push(source);
    }

    function getRecipeTiming(db, params, recipe) {
        let recipeTime = recipe.baseTime || 1;
        const nutrientCost = recipe.nutrientCost || 0;
        if (nutrientCost > 0 && recipe.machine === "Nursery") {
            const fertilitySpeed = db.items[params.selectedFert]?.maxFertility || 1;
            recipeTime = nutrientCost / fertilitySpeed;
        }
        return recipeTime;
    }

    function getRecipeInfo(db, params, recipe, item) {
        const itemDef = db.items[item] || {};
        let batchYield = recipe.outputs[item] || 1;
        batchYield = applyAlchemyMult(recipe.machine, batchYield, params.alchemyMult);

        const recipeTime = getRecipeTiming(db, params, recipe);
        const machineOutputRate = (60 / (recipeTime || 1)) * params.speedMult;
        let effectiveBatchesPerMin = machineOutputRate;

        if (!itemDef.liquid) {
            const maxItemsPerMinPerMachine = machineOutputRate * batchYield;
            let effectiveBeltSpeed = params.beltSpeed;
            if (itemDef.category === "Currency") effectiveBeltSpeed *= 50;
            else if (recipe.sharedOutputs) effectiveBeltSpeed /= recipe.sharedOutputs;
            if (maxItemsPerMinPerMachine > effectiveBeltSpeed) {
                effectiveBatchesPerMin = effectiveBeltSpeed / batchYield;
            }
        }

        return {
            batchYield,
            recipeTime,
            machineOutputRate,
            effectiveBatchesPerMin
        };
    }

    function buildTooltipData(recipe, recipeTime, speedMult, throughput) {
        return {
            inputs: Object.entries(recipe.inputs || {}).map(([item, qty]) => ({ item, qty })),
            outputs: Object.entries(recipe.outputs || {}).map(([item, qty]) => ({ item, qty })),
            baseTime: recipeTime,
            speedMult,
            throughput
        };
    }

    function buildProductionModel(options) {
        const { db, params, state, isGhost, initialAvailableByproducts, initialTotalByproducts } = options;
        const aggregates = createAggregates();
        const availableByproducts = cloneRecord(initialAvailableByproducts || {});
        if (initialTotalByproducts) aggregates.totalByproducts = initialTotalByproducts;

        const fuelDef = db.items[params.selectedFuel] || {};
        const grossFuelEnergy = (fuelDef.heat || 1) * params.fuelMult;
        const fertDef = db.items[params.selectedFert] || { nutrientValue: 144, maxFertility: 12 };
        const grossFertVal = fertDef.nutrientValue * params.fertMult;

        function buildNode(item, rate, isInternalModule, ancestors = [], forceGhost = false, depth = 0, shouldExpand = true) {
            const effectiveGhost = isGhost || forceGhost;
            const pathKey = `${ancestors.join(">")}>${item}`;
            const currentPath = [...ancestors, item];
            const itemDef = db.items[item] || {};
            const recycleAvailable = availableByproducts[item] || 0;
            let deduction = 0;
            let canRecycle = false;
            const isExternalInput = state.forcedExternals?.has(pathKey);

            if (recycleAvailable > 0.001) {
                canRecycle = true;
                if (state.activeRecyclers?.has(pathKey)) {
                    deduction = Math.min(rate, recycleAvailable);
                    availableByproducts[item] -= deduction;
                }
            }

            const netRate = Math.max(0, rate - deduction);
            const node = {
                item,
                pathKey,
                ancestors,
                depth,
                requestedRate: rate,
                deductionRate: deduction,
                netRate,
                machine: null,
                machineCount: 0,
                recipe: null,
                recipeInfo: null,
                recipeTooltipData: null,
                yieldMultiplier: null,
                maxOutput: null,
                children: [],
                tags: {
                    detailsType: null,
                    costEntries: [],
                    byproducts: [],
                    heat: null,
                    bio: null,
                    output: null,
                    beltRatio: null
                },
                canRecycle,
                recycleAvailable,
                recycleActive: state.activeRecyclers?.has(pathKey) || false,
                isExternal: !!isExternalInput,
                isRaw: false,
                isInternalModule
            };

            if (isExternalInput || depth >= 20 || !shouldExpand) {
                if (!effectiveGhost && netRate > 0) {
                    aggregates.forcedItems[item] = (aggregates.forcedItems[item] || 0) + netRate;
                    pushExternalSource(aggregates, item, { rate: netRate, pathKey });
                    node.tags.detailsType = "external";
                }
                return effectiveGhost ? null : node;
            }

            const recipe = getActiveRecipe(db, state, item);
            if (!recipe) {
                if (!effectiveGhost) {
                    if (itemDef.buyPrice) {
                        const costPerMin = netRate * itemDef.buyPrice;
                        aggregates.rawItems[item] = (aggregates.rawItems[item] || 0) + netRate;
                        aggregates.goldPerMin += costPerMin;
                        aggregates.rawMaterialSourceMap.push({ item, gold: costPerMin, pathKey });
                        node.tags.detailsType = "raw";
                        node.tags.costEntries.push({ type: "gold", amount: costPerMin });
                        node.isRaw = true;
                    } else {
                        aggregates.forcedItems[item] = (aggregates.forcedItems[item] || 0) + netRate;
                        pushExternalSource(aggregates, item, { rate: netRate, pathKey });
                        node.tags.detailsType = "external";
                        node.isExternal = true;
                    }
                }
                return effectiveGhost ? null : node;
            }

            node.recipe = recipe;
            node.machine = recipe.machine;

            if (recipe.machine === "Bank Portal") {
                const costPerMin = netRate * (itemDef.sellPrice || 0);
                aggregates.goldPerMin += costPerMin;
                if (!effectiveGhost) {
                    aggregates.rawMaterialSourceMap.push({ item, gold: costPerMin, pathKey });
                    node.tags.costEntries.push({ type: "gold", amount: costPerMin });
                }
            }

            const recipeInfo = getRecipeInfo(db, params, recipe, item);
            const batchesPerMin = recipeInfo.batchYield > 0 ? netRate / recipeInfo.batchYield : 0;
            let machinesNeeded = recipeInfo.effectiveBatchesPerMin > 0 ? batchesPerMin / recipeInfo.effectiveBatchesPerMin : 0;
            if (Math.abs(Math.round(machinesNeeded) - machinesNeeded) < 0.0001) {
                machinesNeeded = Math.round(machinesNeeded);
            }

            node.machineCount = machinesNeeded;
            node.recipeInfo = recipeInfo;
            node.recipeTooltipData = buildTooltipData(recipe, recipeInfo.recipeTime, params.speedMult, recipeInfo.effectiveBatchesPerMin * recipeInfo.batchYield);

            if (YIELD_MULTIPLIER_MACHINES.includes(recipe.machine)) {
                const yieldMultiplier = recipe.machine === "Thermal Extractor" ? params.alchemyMult * 3 : params.alchemyMult;
                node.yieldMultiplier = yieldMultiplier;
                if (!effectiveGhost) node.tags.output = { multiplier: yieldMultiplier };
            }

            Object.keys(recipe.outputs).forEach(outputItem => {
                if (outputItem === item) return;
                const yieldPerBatch = recipe.outputs[outputItem];
                const totalByproduct = batchesPerMin * yieldPerBatch;
                aggregates.totalByproducts[outputItem] = (aggregates.totalByproducts[outputItem] || 0) + totalByproduct;

                if (!effectiveGhost) {
                    node.tags.byproducts.push({ item: outputItem, rate: totalByproduct });
                    const producers = ensureRecord(aggregates.byproductProducersMap, outputItem, () => []);
                    producers.push({
                        rate: totalByproduct,
                        recipe,
                        machineCount: machinesNeeded,
                        pathKey,
                        tooltipData: node.recipeTooltipData
                    });
                }
            });

            if (!effectiveGhost && deduction > 0.0001) {
                const producers = ensureRecord(aggregates.byproductProducersMap, item, () => []);
                producers.push({
                    rate: -deduction,
                    recipe,
                    machineCount: machinesNeeded,
                    pathKey,
                    tooltipData: node.recipeTooltipData
                });
            }

            if (!effectiveGhost) {
                addMachineCount(aggregates, recipe.machine, item, Math.ceil(machinesNeeded - 0.0001), machinesNeeded);
                if (recipe.buildCost) {
                    aggregates.extraBuildCosts[recipe.buildCost] = (aggregates.extraBuildCosts[recipe.buildCost] || 0) + Math.ceil(machinesNeeded - 0.0001);
                }
            }

            let fuelRate = 0;
            if (db.machines[recipe.machine] && db.machines[recipe.machine].heatCost) {
                const machine = db.machines[recipe.machine];
                const parent = db.machines[machine.parent];
                const slotsRequired = machine.slotsRequired || 1;
                const parentSlots = machine.parentSlots || parent.slots || 3;
                let activeHeat = machine.heatCost * params.speedMult;
                if (machine.heatCost < 0) activeHeat = (recipe.heatCost ?? 0) * params.speedMult;

                const parentMachinesNeeded = Math.ceil((machinesNeeded / (parentSlots / slotsRequired)) - 0.0001);
                const totalHeatPerSec = (parentMachinesNeeded * parent.heatSelf * params.speedMult) + (machinesNeeded * activeHeat);

                if (!effectiveGhost) {
                    aggregates.furnaceSlotDemand[machine.parent] = (aggregates.furnaceSlotDemand[machine.parent] || 0) + (Math.ceil(machinesNeeded - 0.0001) * slotsRequired);
                }

                aggregates.heatLoad += totalHeatPerSec;
                aggregates.fuelDemandItems += (totalHeatPerSec * 60) / grossFuelEnergy;

                if (!effectiveGhost) {
                    fuelRate = (totalHeatPerSec * 60) / grossFuelEnergy;
                    node.tags.heat = {
                        item: params.selectedFuel,
                        rate: fuelRate,
                        heatPerSec: totalHeatPerSec,
                        costPerMin: params.showFuelCost && params.fuelCost > Number.EPSILON ? Math.ceil(fuelRate * params.fuelCost - Number.EPSILON) : 0
                    };
                    if (node.tags.heat.costPerMin > 0) {
                        node.tags.costEntries.push({ type: "fuel", amount: node.tags.heat.costPerMin });
                    }
                }
            }

            let fertRate = 0;
            if (!effectiveGhost && (recipe.machine === "Nursery" || recipe.machine === "World Tree Nursery")) {
                const totalNutrientsNeeded = netRate * (recipe.nutrientCost || 0) / recipeInfo.batchYield;
                const itemsNeeded = totalNutrientsNeeded / grossFertVal;
                aggregates.fertDemandItems += itemsNeeded;
                aggregates.bioLoad += (totalNutrientsNeeded / 60);

                fertRate = itemsNeeded;
                node.tags.bio = {
                    item: params.selectedFert,
                    rate: itemsNeeded,
                    nutrientPerSec: totalNutrientsNeeded / 60,
                    costPerMin: params.showFertCost && params.fertCost > Number.EPSILON ? Math.ceil(itemsNeeded * params.fertCost - Number.EPSILON) : 0
                };
                if (node.tags.bio.costPerMin > 0) {
                    node.tags.costEntries.push({ type: "fert", amount: node.tags.bio.costPerMin });
                    aggregates.goldPerMin += node.tags.bio.costPerMin;
                }
            }

            if (!effectiveGhost) {
                const commonKey = `${item}_${recipe.machine}`;
                const commonEntry = ensureRecord(aggregates.commonNodesMap, commonKey, () => ({
                    item,
                    machine: recipe.machine,
                    totalRate: 0,
                    totalMachines: 0,
                    tooltipData: node.recipeTooltipData,
                    totalFuelRate: 0,
                    totalFertRate: 0,
                    instances: []
                }));
                commonEntry.totalRate += netRate;
                commonEntry.totalMachines += machinesNeeded;
                commonEntry.totalFuelRate += fuelRate;
                commonEntry.totalFertRate += fertRate;
                commonEntry.instances.push({
                    rate: netRate,
                    machines: machinesNeeded,
                    pathKey
                });

                if (fuelRate > 0.0001) {
                    aggregates.fuelSourceMap.push({ rate: fuelRate, item, machine: recipe.machine, count: machinesNeeded, pathKey });
                }
                if (fertRate > 0.0001) {
                    aggregates.fertSourceMap.push({ rate: fertRate, item, machine: recipe.machine, count: machinesNeeded, pathKey });
                }

                if (params.showMaxCap) {
                    const maxOutput = Math.ceil(machinesNeeded) * node.recipeTooltipData.throughput;
                    node.maxOutput = maxOutput;
                }

                if (params.showBeltCount && itemDef && itemDef.category !== "Liquid") {
                    node.tags.beltRatio = itemDef.category === "Currency" ? rate / (50 * params.beltSpeed) : rate / params.beltSpeed;
                }
            }

            if (netRate > 0.0001) {
                const netBatches = netRate / recipeInfo.batchYield;
                Object.keys(recipe.inputs).forEach(inputName => {
                    const qtyPerBatch = recipe.inputs[inputName];
                    const requiredInputRate = netBatches * qtyPerBatch;
                    // 高級煉金爐的催化劑, 因為有迴圈的風險(黑曜石-共振)所以不展開
                    let shouldExpand = true;
                    if (recipe.machine === 'Advanced Athanor' && DB.items[inputName]?.charges >= 1) {
                        shouldExpand = false;
                    }
                    const childNode = buildNode(inputName, requiredInputRate, isInternalModule, currentPath, effectiveGhost, depth + 1, shouldExpand);
                    if (!effectiveGhost && childNode) node.children.push(childNode);
                });
            }

            return effectiveGhost ? null : node;
        }

        const treeRoots = [];
        params.targets.forEach(target => {
            if (!db.items[target.item]) return;
            const rootNode = buildNode(target.item, target.rate, false, [], false, 0);
            if (!isGhost && rootNode) {
                treeRoots.push({ target, root: rootNode });
            }
        });

        const internalModules = [];
        if (!isGhost) {
            let stableFuelDemand = aggregates.fuelDemandItems;
            let stableFertDemand = aggregates.fertDemandItems;
            const byproductSnapshot = cloneRecord(availableByproducts);

            const baseFuel = aggregates.fuelDemandItems;
            const baseFert = aggregates.fertDemandItems;
            const baseHeat = aggregates.heatLoad;
            const baseBio = aggregates.bioLoad;
            const baseCost = aggregates.goldPerMin;

            if ((params.selfFuel && params.selectedFuel !== params.targetItem) || (params.selfFert && params.selectedFert !== params.targetItem)) {
                for (let i = 0; i < 10; i++) {
                    aggregates.fuelDemandItems = baseFuel;
                    aggregates.fertDemandItems = baseFert;
                    aggregates.heatLoad = baseHeat;
                    aggregates.bioLoad = baseBio;
                    aggregates.goldPerMin = baseCost;

                    Object.keys(availableByproducts).forEach(key => delete availableByproducts[key]);
                    Object.assign(availableByproducts, cloneRecord(byproductSnapshot));

                    const prevFuel = stableFuelDemand;
                    const prevFert = stableFertDemand;

                    if (params.selfFert && prevFert > 0) {
                        buildNode(params.selectedFert, prevFert, true, [], true, 0);
                    }

                    if (params.selfFuel && prevFuel > 0) {
                        buildNode(params.selectedFuel, prevFuel, true, [], true, 0);
                    }

                    const nextFuel = aggregates.fuelDemandItems;
                    const nextFert = aggregates.fertDemandItems;

                    if (Math.abs(nextFuel - prevFuel) < 0.01 && Math.abs(nextFert - prevFert) < 0.01) {
                        stableFuelDemand = nextFuel;
                        stableFertDemand = nextFert;
                        break;
                    }

                    stableFuelDemand = nextFuel;
                    stableFertDemand = nextFert;
                }
            }

            aggregates.fuelDemandItems = stableFuelDemand;
            aggregates.fertDemandItems = stableFertDemand;

            if (params.selfFert && stableFertDemand > 0 && params.targetItem !== params.selectedFert) {
                const fertRoot = buildNode(params.selectedFert, stableFertDemand, true, [], false, 0);
                if (fertRoot) {
                    internalModules.push({ type: "fert", item: params.selectedFert, rate: stableFertDemand, root: fertRoot });
                }
            }

            if (params.selfFuel && stableFuelDemand > 0 && params.targetItem !== params.selectedFuel) {
                const fuelRoot = buildNode(params.selectedFuel, stableFuelDemand, true, [], false, 0);
                if (fuelRoot) {
                    internalModules.push({ type: "fuel", item: params.selectedFuel, rate: stableFuelDemand, root: fuelRoot });
                }
            }
        }

        return {
            treeRoots,
            internalModules,
            availableByproducts,
            aggregates
        };
    }

    function solveByproducts(db, params, state) {
        let availableByproducts = {};
        let totalByproducts = {};
        buildProductionModel({
            db,
            params,
            state,
            isGhost: true,
            initialAvailableByproducts: availableByproducts,
            initialTotalByproducts: totalByproducts
        });

        availableByproducts = cloneRecord(totalByproducts);
        totalByproducts = {};
        buildProductionModel({
            db,
            params,
            state,
            isGhost: true,
            initialAvailableByproducts: availableByproducts,
            initialTotalByproducts: totalByproducts
        });

        let byproductSnapshot = cloneRecord(totalByproducts);
        let latestTotal = cloneRecord(totalByproducts);

        for (let i = 0; i < 30; i++) {
            availableByproducts = cloneRecord(byproductSnapshot);
            totalByproducts = {};

            buildProductionModel({
                db,
                params,
                state,
                isGhost: true,
                initialAvailableByproducts: availableByproducts,
                initialTotalByproducts: totalByproducts
            });

            latestTotal = cloneRecord(totalByproducts);
            let maxDiff = 0;
            const allKeys = [...new Set([...Object.keys(byproductSnapshot), ...Object.keys(totalByproducts)])];
            allKeys.forEach(key => {
                const valA = byproductSnapshot[key] || 0;
                const valB = totalByproducts[key] || 0;
                if (Math.abs(valA - valB) > maxDiff) maxDiff = Math.abs(valA - valB);
            });

            if (maxDiff < 0.0001) break;

            allKeys.forEach(key => {
                const valA = byproductSnapshot[key] || 0;
                const valB = totalByproducts[key] || 0;
                byproductSnapshot[key] = valA + ((valB - valA) * 0.5);
            });
        }

        return latestTotal;
    }

    function aggregateMachineStats(machineStats, db) {
        const flatMax = {};
        const flatMin = {};

        Object.entries(machineStats).forEach(([machineName, outputs]) => {
            let totalIntMax = 0;
            let totalCeiledMin = 0;
            Object.values(outputs).forEach(data => {
                totalIntMax += data.nodeSumInt;
                totalCeiledMin += Math.ceil(data.rawFloat - 0.0001);
            });
            flatMax[machineName] = totalIntMax;
            flatMin[machineName] = totalCeiledMin;
        });

        const totalFurnaces = Object.entries(machineStats).reduce((sum, [machineName]) => {
            if (!db.machines[machineName]?.isGenerator) return sum;
            return sum;
        }, 0);

        return { flatMax, flatMin, totalFurnaces };
    }

    function calculateTotalFurnaces(furnaceSlotDemand, db) {
        return Object.entries(furnaceSlotDemand).reduce((sum, [machineName, qty]) => {
            const slots = db.machines[machineName]?.slots || 3;
            return sum + Math.ceil((qty - 0.0001) / slots);
        }, 0);
    }

    function buildResultSections(db, params, model) {
        const { aggregates, availableByproducts } = model;
        const commonNodes = Object.values(aggregates.commonNodesMap).filter(entry => entry.instances.length > 1);

        const externalForced = Object.entries(aggregates.externalSourceMap).map(([itemName, sources]) => ({
            item: itemName,
            totalRate: sources.reduce((sum, source) => sum + source.rate, 0),
            sources
        }));

        const byproducts = Object.keys(aggregates.totalByproducts).sort().map(itemName => ({
            item: itemName,
            remaining: availableByproducts[itemName] || 0,
            totalGenerated: aggregates.totalByproducts[itemName],
            producers: aggregates.byproductProducersMap[itemName] || []
        }));

        const machineCounts = aggregateMachineStats(aggregates.machineStats, db);

        return {
            commonNodes,
            externalInputs: {
                rawMaterialCost: {
                    totalGoldPerMin: aggregates.goldPerMin,
                    sources: aggregates.rawMaterialSourceMap
                },
                fuel: !params.selfFuel ? {
                    item: params.selectedFuel,
                    totalRate: aggregates.fuelDemandItems,
                    sources: aggregates.fuelSourceMap
                } : null,
                fert: !params.selfFert ? {
                    item: params.selectedFert,
                    totalRate: aggregates.fertDemandItems,
                    sources: aggregates.fertSourceMap
                } : null,
                forced: externalForced
            },
            byproducts,
            construction: {
                maxCounts: machineCounts.flatMax,
                minCounts: machineCounts.flatMin,
                furnaces: calculateTotalFurnaces(aggregates.furnaceSlotDemand, db),
                extraBuildCosts: aggregates.extraBuildCosts
            }
        };
    }

    function runCalculation({ db, params, state }) {
        const stableByproducts = solveByproducts(db, params, state);
        const finalModel = buildProductionModel({
            db,
            params,
            state,
            isGhost: false,
            initialAvailableByproducts: cloneRecord(stableByproducts),
            initialTotalByproducts: {}
        });

        const sections = buildResultSections(db, params, finalModel);
        return {
            targets: params.targets,
            treeRoots: finalModel.treeRoots,
            internalModules: finalModel.internalModules,
            summary: {
                heatLoad: finalModel.aggregates.heatLoad,
                bioLoad: finalModel.aggregates.bioLoad,
                goldPerMin: finalModel.aggregates.goldPerMin,
                fuelDemandItems: finalModel.aggregates.fuelDemandItems,
                fertDemandItems: finalModel.aggregates.fertDemandItems,
                rawItems: finalModel.aggregates.rawItems,
                forcedItems: finalModel.aggregates.forcedItems
            },
            externalInputs: sections.externalInputs,
            byproducts: sections.byproducts,
            commonNodes: sections.commonNodes,
            machineStats: finalModel.aggregates.machineStats,
            construction: sections.construction,
            formulaLineData: {
                rawItems: finalModel.aggregates.rawItems,
                forcedItems: finalModel.aggregates.forcedItems,
                fuelDemandItems: finalModel.aggregates.fuelDemandItems,
                fertDemandItems: finalModel.aggregates.fertDemandItems,
                availableByproducts: finalModel.availableByproducts
            }
        };
    }

    global.AlchemyCalcEngine = {
        runCalculation,
        getBeltSpeed,
        getSpeedMult,
        getAlchemyMult,
        getRecipesFor,
        getActiveRecipe,
        applyAlchemyMult,
        getProductionHeatCost,
        getProductionFertCost
    };
})(window);
