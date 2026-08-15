// Main calculation engine in Planner Tab | Planner的核心計算函數
// Global Memeber Used: DB, plannerState
// Dependency: alchemy_planner.js


/* ==========================================================================
   SECTION: DATA STRUCTURE REFERENCE (for future maintainers)
   ==========================================================================

   --- "rates" objects: per-machine, NOT scaled by machineCount ---
   Returned by plannerGetRecipeRates(recipeId, recipeModifiers) and
   plannerGetNodeRates(node) (which dispatches to either the recipe version
   or plannerGetModuleRates() for module nodes):
   {
     recipe: object|null,              // resolved recipe (post-modifiers) or null
     inputsPerMachine:  [{item, rate}],// rate = units/min for ONE machine
     outputsPerMachine: [{item, rate}],
     heatItemsPerMachine: number,      // fuel-item units/min for ONE machine
     fertItemsPerMachine: number,
     errorCode: ''|'Missing Recipe'|'Missing Reference'|'Circular Reference'|'Unkown Error'
   }
   Use these when you need "what would ONE machine produce" (e.g. to compute
   how many machines are needed for a given target rate).

   --- "ports" objects: node-level TOTALS (rates * node.machineCount) ---
   Returned by computeNodePorts(node), consumed by rendering + flow resolution:
   {
     recipe: object|null,
     inputs:  [{item, rate}],   // rate already multiplied by node.machineCount
     outputs: [{item, rate}],
     heatItemsPerMin: number,
     fertItemsPerMin: number,
     errorCode: string
   }
   Do not confuse "ports" (node totals) with "rates" (per-machine) — they share
   {item, rate} shape but different scale. ports = rates * node.machineCount.

   --- recipeModifiers ---
   Same shape appears in THREE places and they are independent copies, not
   shared references:
     1. DB.settings.recipeModifiers[recipeId]      -- global default, Calculator tab
     2. node.recipeModifiers                        -- Planner node's own snapshot,
                                                        set once when the node is created
                                                        (addPlannerNode copies from #1) and
                                                        edited independently afterward via
                                                        plannerToggleCatalyst / plannerPickCustomInput
     3. DB.settings.nodeRecipeOverrides[pathKey]     -- Calculator tab's per-node override
                                                        (different mechanism, just an id string,
                                                        NOT a recipeModifiers object)
   Shape: { catalysts: ['unstable'|'fertile'|'resonant'|'eternal', ...] }
       or { customInput: itemName }  (Paradox Crucible custom-input recipes)
   Editing a Planner node's recipeModifiers does NOT affect DB.settings or other
   nodes using the same recipeId.

   --- plannerPortKey / flows (plannerResolveFlows return value) ---
   plannerPortKey(nodeId, item, dir) => `${nodeId}::${item}::${dir}`  (dir = 'in'|'out')
   flows = {
     nodePortsCache:  { [nodeId]: ports },              // see above
     portTheoretical: { [portKey]: rate },              // rate before any edge consumes it
     portRemaining:   { [portKey]: rate },               // rate left AFTER edges are resolved
                                                          // (surplus if 'out', shortage if 'in')
     portConnections: { [portKey]: edgeId[] },           // which edges touch this port
     edgeFlow:        { [edgeId]: number }               // actual flow assigned to each edge
   }
   Edges are resolved in createdAt order (first-created edge gets priority supply/demand).
   plannerResolveFlows(planData=null) operates on plannerState by default (isMain=true,
   caches result into _plannerLastFlows and prunes invalid edges + calls savePlannerState());
   when called with an explicit planData (e.g. from _computeFlowsForPlanData for module
   rate calculation) it is read-only and does NOT mutate/save anything.

   --- module nodes ---
   A node is either a recipe node (node.recipeId set, node.moduleId null) or a
   module node (node.moduleId set, node.recipeId null) wrapping another entire
   plan as a virtual recipe. plannerGetModuleRates() computes its exposed
   input/output rates at "quantity = 1" by resolving that plan's own internal
   flows and summing unmet input demand / unconsumed output surplus.
   ========================================================================== */

/* ==========================================================================
   SECTION: PLAN DEPENDENCY ANALYSIS (module usage / cycle detection)
   ========================================================================== */

/** 取得某個 plan 內，所有模組節點直接引用的 moduleId (去重) */
function _getDirectModuleIds(plan) {
    const ids = new Set();
    Object.values(plan.data.nodes || {}).forEach(node => {
        if (node.moduleId) ids.add(node.moduleId);
    });
    return [...ids];
}

/**
 * 遞迴 (BFS) 展開 planId 用到的所有模組 (含間接引用)，並偵測是否存在循環引用。
 * 循環的判定：展開過程中若重新走回 planId 自己，才視為環；
 * 單純多個模組共用同一個下層模組 (菱形依賴) 不算循環。
 * @returns { modules: string[], hasCycle: boolean }
 */
function getPlannerModulesUsedBy(planId) {
    const originPlan = plannerLibrary.plans[planId];
    if (!originPlan) return { modules: [], hasCycle: false };

    const visited = new Set();
    let hasCycle = false;
    const queue = [..._getDirectModuleIds(originPlan)];

    while (queue.length) {
        const cur = queue.shift();
        if (cur === planId) { hasCycle = true; continue; }
        if (visited.has(cur)) continue;
        visited.add(cur);
        const curPlan = plannerLibrary.plans[cur];
        if (!curPlan) continue; // 引用已不存在的 plan，跳過 (broken reference)
        _getDirectModuleIds(curPlan).forEach(id => queue.push(id));
    }

    return { modules: [...visited], hasCycle };
}

/** 找出哪些 plan (直接或間接) 把 planId 當作模組使用 */
function getPlannerModulesUsingPlan(planId) {
    const users = [];
    plannerLibrary.planOrder.forEach(id => {
        if (id === planId || !plannerLibrary.plans[id]) return;
        const { modules } = getPlannerModulesUsedBy(id);
        if (modules.includes(planId)) users.push(id);
    });
    return users;
}

/* ==========================================================================
   SECTION: RECIPE / RATE CALCULATION
   ========================================================================== */

function plannerGetRawRecipe(recipeId) {
    return (DB.recipes || []).find(r => r.id === recipeId) || null;
}

function plannerMainOutput(recipeId) {
    const r = plannerGetRawRecipe(recipeId);
    return r ? Object.keys(r.outputs)[0] : null;
}

function plannerGetRecipeTime(recipe) {
    let recipeTime = recipe.baseTime || 1;
    const nutrientCost = recipe.nutrientCost || 0;
    if (nutrientCost > 0 && recipe.machine === "Nursery") {
        const fertSpeed = DB.items[DB.settings.defaultFert]?.maxFertility || 1;
        recipeTime = nutrientCost / fertSpeed;
    }
    return recipeTime;
}

/**
 * 依配方 id (與可選的 recipeModifiers，例如高級煉金爐催化劑) 算出「單台機器」的
 * input/output/heat/fert per-min 速率，不受任何節點的 machineCount 影響。
 * 回傳: { recipe, inputsPerMachine, outputsPerMachine, heatItemsPerMachine, fertItemsPerMachine }
 */
function plannerGetRecipeRates(recipeId, recipeModifiers) {
    const recipe = getRecipeById(recipeId, recipeModifiers);
    if (!recipe) return { recipe: null, inputsPerMachine: [], outputsPerMachine: [], heatItemsPerMachine: 0, fertItemsPerMachine: 0, errorCode: 'Missing Recipe' };

    const lvlBelt = DB.settings.lvlBelt || 0;
    const lvlSpeed = DB.settings.lvlSpeed || 0;
    const lvlAlchemy = DB.settings.lvlAlchemy || 0;
    const lvlFuel = DB.settings.lvlFuel || 0;
    const lvlFert = DB.settings.lvlFert || 0;    
    const beltSpeed = getBeltSpeed(lvlBelt);
    const speedMult = getSpeedMult(lvlSpeed);
    const alchemyMult = getAlchemyMult(lvlAlchemy);

    const recipeTime = plannerGetRecipeTime(recipe);    
    const mainOut = Object.keys(recipe.outputs)[0];
    const nutrientCost = recipe.nutrientCost || 0;
    const isNursery = recipe.machine === "Nursery" || recipe.machine === "World Tree Nursery";    

    let batchesPerMinPerMachine = (60 / (recipeTime || 1)) * speedMult;
    const inputsPerMachine = Object.entries(recipe.inputs || {}).map(([item, qty]) => ({
        item, rate: qty * batchesPerMinPerMachine
    }));
    const outputsPerMachine = Object.entries(recipe.outputs || {}).map(([item, qty]) => {
        const effQty = item === mainOut ? applyAlchemyMult(recipe.machine, qty, alchemyMult) : qty;
        return { item, rate: effQty * batchesPerMinPerMachine };
    });

    // 檢查端口傳送帶速度限制。inputsPerMachine因為有雕刻機多個入口，暫時不檢查
    let batchesRatio = 1.0;
    for (const { item, rate } of outputsPerMachine) {
        const itemDef = DB.items[item];
        if (itemDef && !itemDef.liquid) {
            let effectiveBeltSpeed = beltSpeed;
            if (itemDef.category === "Currency") effectiveBeltSpeed *= 50;
            else if (recipe.sharedOutputs) effectiveBeltSpeed /= recipe.sharedOutputs;
            if (rate > effectiveBeltSpeed) {
                batchesRatio = Math.min(batchesRatio, effectiveBeltSpeed/rate);
            }
        }
    }

    if (batchesRatio < 1) {
        batchesPerMinPerMachine *= batchesRatio;
        inputsPerMachine.forEach(io => io.rate *= batchesRatio);
        outputsPerMachine.forEach(io => io.rate *= batchesRatio);
    }

    // 燃料消耗 (heatCost -> 燃料物品/分鐘, 每台機器)
    let heatItemsPerMachine = 0;
    const machineDef = DB.machines[recipe.machine];
    if (machineDef && machineDef.heatCost) {
        const heatingDeviceName = DB.settings.selectedHeatingDevice || "Stone Furnace";
        const heatingDevice = DB.machines[heatingDeviceName]?.isGenerator
            ? DB.machines[heatingDeviceName]
            : (DB.machines["Stone Furnace"] || { heatSelf: 0, slots: 3 });
        const slotsRequired = machineDef.slotsRequired || 1;
        const heatingSlots = heatingDevice.slots || 3;
        let activeHeat = machineDef.heatCost * speedMult;
        if (machineDef.heatCost < 0) activeHeat = (recipe.heatCost ?? 0) * speedMult;
        const heatingDevicesNeededPerMachine = 1 / (heatingSlots / slotsRequired);
        const totalHeatPerSecPerMachine = heatingDevicesNeededPerMachine * (heatingDevice.heatSelf || 0) * speedMult
            + activeHeat;
        const fuelDef = DB.items[DB.settings.defaultFuel] || {};
        const grossFuelEnergy = (fuelDef.heat || 1) * (1 + lvlFuel * 0.10);
        heatItemsPerMachine = (totalHeatPerSecPerMachine * 60) / grossFuelEnergy;
    }

    // 肥料消耗 (Nursery, 每台機器)
    let fertItemsPerMachine = 0;
    if (isNursery) {
        const totalNutrientsPerMinPerMachine = batchesPerMinPerMachine * nutrientCost;
        const fertDef = DB.items[DB.settings.defaultFert] || { nutrientValue: 144 };
        const grossFertVal = fertDef.nutrientValue * (1 + lvlFert * 0.10);
        fertItemsPerMachine = totalNutrientsPerMinPerMachine / grossFertVal;
    }

    return { recipe, inputsPerMachine, outputsPerMachine, heatItemsPerMachine, fertItemsPerMachine, errorCode: '' };
}

/**
 * 依節點目前的機器數與全域共用設定(preferredRecipes/recipeModifiers/升級等級)，
 * 算出這個節點所有 input/output port 的速率，以及機台本身的燃料/肥料消耗。
 * 回傳: { recipe, inputs, outputs, heatItemsPerMachine, fertItemsPerMachine, errorCode }
 */
function computeNodePorts(node) {
    if (node.kind === 'note') return { recipe: null, inputs: [], outputs: [], heatItemsPerMin: 0, fertItemsPerMin: 0, errorCode: '' };
    const rates = plannerGetNodeRates(node);
    const result = { recipe : null, inputs: [], outputs: [], heatItemsPerMin: 0, fertItemsPerMin: 0, errorCode: '' };
    
    if (rates.errorCode) return { ...result, errorCode: rates.errorCode };

    const mc = node.machineCount;
    result.recipe = rates.recipe;
    result.inputs = rates.inputsPerMachine.map(p => ({ item: p.item, rate: p.rate * mc }));
    result.outputs = rates.outputsPerMachine.map(p => ({ item: p.item, rate: p.rate * mc }));
    result.heatItemsPerMin = rates.heatItemsPerMachine * mc;
    result.fertItemsPerMin = rates.fertItemsPerMachine * mc;
    return result;
}

/* ==========================================================================
   SECTION: MODULE NODES (plan-as-virtual-recipe)
   ========================================================================== */

/**
 * 依節點類型 (一般配方 / 模組) dispatch 到對應的「每台機器/每單位倍率」速率計算。
 * 回傳格式與 plannerGetRecipeRates() 一致：
 * { recipe, inputsPerMachine, outputsPerMachine, heatItemsPerMachine, fertItemsPerMachine, errorCode }
 */
function plannerGetNodeRates(node) {
    if (node.kind === 'note') return null;
    if (node.kind === 'portal') return plannerGetPortalRates(node);
    if (node.moduleId) return plannerGetModuleRates(node.moduleId);
    return plannerGetRecipeRates(node.recipeId, node.recipeModifiers);
}

/**
 * 計算某個模組plan (moduleId) 「倍率=1」時，對外暴露的 input/output/heat/fert 速率 * 
 * 如果plannerLibrary.plans[moduleId]不存在，回傳 errorCode = 'Missing Reference'
 * getPlannerModulesUsedBy(planId) 檢查是否存在循環引用，是則回傳 errorCode = 'Circular Reference'
 * { recipe, inputsPerMachine, outputsPerMachine, heatItemsPerMachine, fertItemsPerMachine, errorCode }
 */
function plannerGetModuleRates(moduleId) {
    const result = { recipe: null, inputsPerMachine: [], outputsPerMachine: [], heatItemsPerMachine: 0, fertItemsPerMachine: 0, errorCode: '' };
    try {
        const plan = plannerLibrary.plans[moduleId];
        if (!plan) return {...result, errorCode: 'Missing Reference'};
        if (getPlannerModulesUsedBy(moduleId).hasCycle) return {...result, errorCode: 'Circular Reference'};

        const base = _computeFlowsForPlanData(plan);
        if (!base) return {...result, errorCode: 'Missing Reference'};

        return {
            recipe: null,
            inputsPerMachine: Object.entries(base.inputShortage).map(([item, qty]) => ({ item, rate: qty })),
            outputsPerMachine: Object.entries(base.outputSurplus).map(([item, qty]) => ({ item, rate: qty })),
            heatItemsPerMachine: base.heatTotal,
            fertItemsPerMachine: base.fertTotal,
            errorCode: ''
        };
    }
    catch (e) {
        console.error(e);
        return {...result, errorCode: 'Unkown Error'};
    }
}

/**
 * 唯讀計算：給定 planId，算出這個 plan 整體對外的
 * input 短缺 / output 剩餘 / heat / fert / gold 總量 (機器數=1 時的基準值)。
 * 不寫入/不修改 plannerState、不呼叫 savePlannerState、不清除失效邊。
 */
function _computeFlowsForPlanData(plan) {
    if (!plan || !plan.data) return null;

    const flow = plannerResolveFlows(plan.data);

    const inputShortage = {};
    const outputSurplus = {};
    let heatTotal = 0, fertTotal = 0, goldTotal = 0;

    Object.values(flow.nodePortsCache).forEach(ports => {
        heatTotal += ports.heatItemsPerMin || 0;
        fertTotal += ports.fertItemsPerMin || 0;
    });

    Object.keys(flow.portRemaining).forEach(key => {
        const val = flow.portRemaining[key];
        if (!(val > 0.001)) return;
        const parts = key.split('::'); // nodeId::item::dir
        const item = parts[1];
        const dir = parts[2];
        if (dir === 'out') outputSurplus[item] = (outputSurplus[item] || 0) + val;
        else inputShortage[item] = (inputShortage[item] || 0) + val;
    });

    Object.entries(inputShortage).forEach(([item, qty]) => {
        const def = DB.items[item];
        if (def && def.buyPrice) goldTotal += def.buyPrice * qty;
    });

    return { inputShortage: inputShortage, outputSurplus: outputSurplus, heatTotal: heatTotal, fertTotal: fertTotal };
}


/* ==========================================================================
   SECTION: FLOW RESOLUTION
   ========================================================================== */

function plannerPortKey(nodeId, item, dir) {
    return `${nodeId}::${item}::${dir}`;
}

/**
 * 重新計算整張規劃圖的流量與連接埠狀態。
 *
 * 計算邏輯包含：
 * 1. 估算每個節點各端口的理論速率。
 * 2. 清除因配方變更而失效的無效邊 (item 不再屬於該節點端口)。
 * 3. 依建立時間 (`createdAt`) 順序依序分配流量（先到先得原則）。
 *
 * @param {Object|null} [planData=null] 規劃圖數據資料庫。若為 null，則預設使用全域的 `plannerState` 並註記為主計算。
 * @returns { nodePortsCache, portTheoretical, portRemaining, portConnections, edgeFlow } 計算完畢的流量與狀態數據物件
 */
function plannerResolveFlows(planData = null) {
    let isMain = false;
    if (planData === null) {
        planData = plannerState;
        isMain = true;
    }
    const nodePortsCache = {};
    Object.values(planData.nodes).forEach(node => {
        nodePortsCache[node.id] = computeNodePorts(node);
    });

    if (isMain) {
        // 清理失效的邊 (例如節點配方切換後，該 item 不再是 input/output)
        let changed = false;
        Object.keys(planData.edges).forEach(eid => {
            const e = planData.edges[eid];
            const fromPorts = nodePortsCache[e.fromNode];
            const toPorts = nodePortsCache[e.toNode];
            const fromOk = fromPorts && fromPorts.outputs.some(p => p.item === e.item);
            const toOk = toPorts && toPorts.inputs.some(p => p.item === e.item);
            if (!fromOk || !toOk) { delete planData.edges[eid]; changed = true; }
        });
        if (changed) savePlannerState();
    }

    const portTheoretical = {};
    Object.entries(nodePortsCache).forEach(([nodeId, ports]) => {
        ports.inputs.forEach(p => { portTheoretical[plannerPortKey(nodeId, p.item, 'in')] = p.rate; });
        ports.outputs.forEach(p => { portTheoretical[plannerPortKey(nodeId, p.item, 'out')] = p.rate; });
    });

    const portRemaining = Object.assign({}, portTheoretical);
    const portConnections = {};
    const edgeFlow = {};

    const sortedEdges = Object.values(planData.edges).sort((a, b) => a.createdAt - b.createdAt);
    sortedEdges.forEach(edge => {
        const outKey = plannerPortKey(edge.fromNode, edge.item, 'out');
        const inKey = plannerPortKey(edge.toNode, edge.item, 'in');
        (portConnections[outKey] = portConnections[outKey] || []).push(edge.id);
        (portConnections[inKey] = portConnections[inKey] || []).push(edge.id);

        const supply = portRemaining[outKey] ?? 0;
        const demand = portRemaining[inKey] ?? 0;
        const flow = Math.max(0, Math.min(supply, demand));
        edgeFlow[edge.id] = flow;
        portRemaining[outKey] = supply - flow;
        portRemaining[inKey] = demand - flow;
    });

    const flows = { nodePortsCache, portTheoretical, portRemaining, portConnections, edgeFlow };
    if (isMain) _plannerLastFlows = flows;
    return flows;
}

function plannerGetAvailableRateAtPort(nodeId, item, dir) {
    const flows = plannerResolveFlows();
    const key = plannerPortKey(nodeId, item, dir);
    return flows.portRemaining[key] ?? (flows.portTheoretical[key] ?? 0);
}


/* ==========================================================================
   SECTION: GRAPH NODE BFS
   ========================================================================== */

/** 以 sourceNodeId 為起點，用 BFS 找出整個無向連通分量內的所有節點 id (含自己) */
function getPlannerConnectedNodeIds(startNodeId) {
    const adjacency = {};
    Object.values(plannerState.edges).forEach(e => {
        (adjacency[e.fromNode] = adjacency[e.fromNode] || []).push(e.toNode);
        (adjacency[e.toNode] = adjacency[e.toNode] || []).push(e.fromNode);
    });
    const visited = new Set([startNodeId]);
    const queue = [startNodeId];
    while (queue.length) {
        const cur = queue.shift();
        (adjacency[cur] || []).forEach(nb => {
            if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
        });
    }
    return [...visited];
}

/** 沿著 edge 反方向 (toNode -> fromNode) BFS，找出「供給這個節點」的所有上游節點 (含自己) */
function getPlannerUpstreamNodeIds(startNodeId) {
    const inAdj = {};
    Object.values(plannerState.edges).forEach(e => {
        (inAdj[e.toNode] = inAdj[e.toNode] || []).push(e.fromNode);
    });
    const visited = new Set([startNodeId]);
    const queue = [startNodeId];
    while (queue.length) {
        const cur = queue.shift();
        (inAdj[cur] || []).forEach(nb => {
            if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
        });
    }
    return visited;
}

/** 沿著 edge 正方向 (fromNode -> toNode) BFS，找出「消耗這個節點」的所有下游節點 (含自己) */
function getPlannerDownstreamNodeIds(startNodeId) {
    const outAdj = {};
    Object.values(plannerState.edges).forEach(e => {
        (outAdj[e.fromNode] = outAdj[e.fromNode] || []).push(e.toNode);
    });
    const visited = new Set([startNodeId]);
    const queue = [startNodeId];
    while (queue.length) {
        const cur = queue.shift();
        (outAdj[cur] || []).forEach(nb => {
            if (!visited.has(nb)) { visited.add(nb); queue.push(nb); }
        });
    }
    return visited;
}

/* ==========================================================================
   SECTION: AUTO-GENERATE UPSTREAM NODES
   ========================================================================== */

/** 估算節點卡片高度：116px 基礎 + 24px * max(input埠數, output埠數) */
function estimatePlannerNodeHeight(recipe) {
    if (!recipe) return 116;
    const inCount = Object.keys(recipe.inputs || {}).length;
    const outCount = Object.keys(recipe.outputs || {}).length;
    return 116 + 24 * Math.max(inCount, outCount);
}

/**
 * 依來源節點的目前 input 缺額，在其左側自動生成上游節點 (套用 preferred 配方)，
 * 並自動連線。只展開這一層，不遞迴往上補 (遞迴版見 autoGenerateAllUpstreamNodes)。
 * 回傳這次呼叫新建立的節點 id 陣列 (供遞迴使用)，不做任何 render/save (由呼叫端負責)。
 */
function _autoGenerateUpstreamNodesCore(nodeId) {
    const sourceNode = plannerState.nodes[nodeId];
    if (!sourceNode) return [];

    const flows = plannerResolveFlows();
    const ports = flows.nodePortsCache[nodeId];
    if (!ports) return [];

    const deficits = [];
    ports.inputs.forEach(p => {
        const key = plannerPortKey(nodeId, p.item, 'in');
        const remaining = flows.portRemaining[key] ?? 0;
        if (remaining > 0.001) deficits.push({ item: p.item, deficit: remaining });
    });
    if (deficits.length === 0) return [];

    const plans = [];
    deficits.forEach(({ item, deficit }) => {
        const recipe = getActiveRecipe(item);
        if (!recipe) return; // 跳過無配方物品 (原料/外部輸入)

        const rates = plannerGetRecipeRates(recipe.id, DB.settings.recipeModifiers?.[recipe.id]);
        if (!rates) return;
        const perMachineRate = (rates.outputsPerMachine.find(p => p.item === item) || {}).rate || 0;
        if (perMachineRate <= 0) return;

        let machineCount = deficit / perMachineRate;
        machineCount = Math.max(0, machineCount);

        plans.push({ item, recipe, recipeModifiers: DB.settings.recipeModifiers?.[recipe.id], machineCount });
    });
    if (plans.length === 0) return [];

    const sourceEl = document.getElementById('planner-node-' + nodeId);
    const sourceHeight = sourceEl ? sourceEl.offsetHeight : 116;
    const newNodeWidth = 200;
    let x = plannerSnapVal(sourceNode.x - newNodeWidth - 120);

    const heights = plans.map(p => estimatePlannerNodeHeight(p.recipe));
    const baseGap = _plannerSettings.gridSize ? Math.min(80, Math.max(20, _plannerSettings.gridSize)) : 20;
    const count = plans.length;
    const yPositions = new Array(count);

    if (count % 2 === 1) {
        const midIdx = Math.floor(count / 2);
        yPositions[midIdx] = sourceNode.y;
        let curTop = sourceNode.y;
        for (let i = midIdx - 1; i >= 0; i--) {
            curTop -= (baseGap + heights[i + 1]);
            yPositions[i] = curTop;
        }
        let curBottom = sourceNode.y + heights[midIdx];
        for (let i = midIdx + 1; i < count; i++) {
            yPositions[i] = curBottom + baseGap;
            curBottom = yPositions[i] + heights[i];
        }
    } else {
        const totalHeight = heights.reduce((s, h) => s + h, 0) + baseGap * (count - 1);
        const sourceCenterY = sourceNode.y + sourceHeight / 2;
        let curY = sourceCenterY - totalHeight / 2;
        for (let i = 0; i < count; i++) {
            yPositions[i] = curY;
            curY += heights[i] + baseGap;
        }
    }

    const createdIds = [];
    plans.forEach((plan, i) => {
        let y = plannerSnapVal(yPositions[i]);

        plannerState._nodeSeq = (plannerState._nodeSeq || 0) + 1;
        const newNodeId = 'pnode_' + plannerState._nodeSeq;
        plannerState.nodes[newNodeId] = {
            id: newNodeId, kind: 'recipe',
            recipeId: plan.recipe.id,
            recipeModifiers: plan.recipeModifiers,
            machineCount: plan.machineCount,
            x: Math.round(x),
            y: Math.round(y)
        };

        plannerState._edgeSeq = (plannerState._edgeSeq || 0) + 1;
        const edgeId = 'pedge_' + plannerState._edgeSeq;
        plannerState.edges[edgeId] = {
            id: edgeId, item: plan.item, fromNode: newNodeId, toNode: nodeId,
            createdAt: plannerState._edgeSeq
        };

        createdIds.push(newNodeId);
    });

    return createdIds;
}

/** 對外版本：單層展開，展開後立即 render + 存檔 */
function autoGenerateUpstreamNodes(nodeId) {
    const created = _autoGenerateUpstreamNodesCore(nodeId);
    if (created.length === 0) return;
    renderPlanner();
    savePlannerState();
}

/**
 * 遞迴版本：以 nodeId 為起點，持續往上游展開，直到每個節點都沒有缺額為止。
 */
function autoGenerateAllUpstreamNodes(rootNodeId) {
    const expandingRecipes = new Set();
    const allCreated = [];

    function dfs(nodeId) {
        const node = plannerState.nodes[nodeId];
        if (!node) return;
        if (node.kind !== 'recipe') return;

        if (nodeId != rootNodeId) {
            const cats = node.recipeModifiers?.catalysts;
            if (cats && cats.length > 0) return; //不展開有催化劑的子節點
        }

        if (expandingRecipes.has(node.recipeId))
            return;

        expandingRecipes.add(node.recipeId);

        const created = _autoGenerateUpstreamNodesCore(nodeId);
        allCreated.push(...created);
        created.forEach(dfs);

        expandingRecipes.delete(node.recipeId);
    }

    dfs(rootNodeId);
    console.info('Create upstream nodes: ' + allCreated.length);

    _plannerSelectedNodeIds.clear();
    _plannerSelectedNodeIds.add(rootNodeId);
    allCreated.forEach(id => _plannerSelectedNodeIds.add(id));

    renderPlanner();
    savePlannerState();
}

/** 選取 rootNodeId 本身 + 所有上游節點 (沿 input edge 反向走的全部祖先)，加入目前選取集合並重繪 */
function plannerSelectAllUpstreamNodes(rootNodeId) {
    const visited = getPlannerUpstreamNodeIds(rootNodeId);
    _plannerSelectedNodeIds.clear();
    visited.forEach(id => _plannerSelectedNodeIds.add(id));
    renderPlanner();
}

/** 刪除 rootNodeId 以外所有上游節點 */
function removeAllUpsteamNodes(rootNodeId) {
    const visited = getPlannerUpstreamNodeIds(rootNodeId);
    visited.delete(rootNodeId);
    visited.forEach(nId => delete plannerState.nodes[nId]);
    renderPlanner();
    savePlannerState();
}

/* ==========================================================================
   SECTION: LAYOUT UPSTREAM (BFS spanning tree, RT-style layout)
   ========================================================================== */

const PLANNER_LAYOUT_COL_GAP = 280;   // 每層 (depth) 之間的水平間距 (含節點寬度)
const PLANNER_LAYOUT_ROW_GAP = 40;    // 同層節點之間的最小垂直間距

/**
 * 以 rootNodeId 為根，只排版它的上游節點。
 * 做法：先用 BFS 沿著 input edge 反向走，建出一棵 spanning tree
 * (每個節點只認第一次被走到的那條邊當 parent，其餘跨子樹的邊直接忽略，不影響排版)。
 * 再用 post-order 算出每個子樹需要的垂直空間，最後 pre-order 由上而下指定座標，
 * 父節點置中對齊自己所有子節點的中心範圍 (視覺概念類似 D3 tree / Reingold-Tilford)。
 * root 本身位置不變；上游節點以 root 的 x 為起點往左展開分層。
 */
function plannerAutoLayoutUpstream(rootNodeId) {
    const root = plannerState.nodes[rootNodeId];
    if (!root) return;

    const inAdj = {};
    Object.keys(plannerState.nodes).forEach(id => { inAdj[id] = []; });
    Object.values(plannerState.edges).forEach(e => {
        if (!inAdj[e.toNode] || !plannerState.nodes[e.fromNode]) return;
        inAdj[e.toNode].push(e.fromNode);
    });

    const children = _plannerBuildUpstreamTree(rootNodeId, inAdj);
    if (Object.keys(children).length === 0 || (children[rootNodeId] || []).length === 0) return; // 沒有上游節點可排

    const extents = {};
    _plannerComputeExtent(rootNodeId, children, extents);
    _plannerAssignTreeCoordinates(rootNodeId, children, extents);

    renderPlanner();
    savePlannerState();
}

/**
 * BFS 沿著 inAdj 方向走 (即沿著 edge 反向，往上游走)，建出以 rootId 為根的 spanning tree。
 * 每個節點只會被指定唯一一個 parent (第一次走訪到它的節點)；若某個節點同時是多個
 * 下游節點的上游 (匯流)，只有第一條路徑會被視為 tree edge，其餘邊被忽略不畫入排版計算。
 * 回傳 { [nodeId]: childNodeId[] }，只包含有子節點的項目 (leaf 不會出現在裡面)。
 */
function _plannerBuildUpstreamTree(rootId, inAdj) {
    const visited = new Set([rootId]);
    const children = {};
    const queue = [rootId];
    while (queue.length) {
        const cur = queue.shift();
        (inAdj[cur] || []).forEach(parent => {
            if (visited.has(parent)) return; // 已經被其他節點認領走了，當作 cross edge 忽略
            visited.add(parent);
            (children[cur] = children[cur] || []).push(parent);
            queue.push(parent);
        });
    }
    return children;
}

/**
 * Post-order 遞迴計算每個子樹所需的垂直空間 (extent)。
 * Leaf：extent = 自己卡片的實際高度。
 * 非 leaf：extent = 所有子節點 extent 累加 + 間距，且至少要 ≥ 自己卡片高度
 */
function _plannerComputeExtent(nodeId, children, extents) {
    const el = document.getElementById('planner-node-' + nodeId);
    const ownHeight = el ? el.offsetHeight : 140;
    const kids = children[nodeId] || [];

    if (kids.length === 0) {
        extents[nodeId] = ownHeight;
        return ownHeight;
    }

    let childrenTotal = 0;
    kids.forEach(childId => {
        childrenTotal += _plannerComputeExtent(childId, children, extents);
    });
    childrenTotal += (kids.length - 1) * PLANNER_LAYOUT_ROW_GAP;

    const extent = Math.max(ownHeight, childrenTotal);
    extents[nodeId] = extent;
    return extent;
}

/**
 * Pre-order 由上而下指定座標。
 * 每個節點分配到一段垂直區間 [top, top+extent)；
 * 若有子節點，子節點群依序疊放在這個區間裡置中，
 * 父節點自己的 y 則對齊「第一個子節點中心」到「最後一個子節點中心」的中點。
 * x 座標單純由深度(depth)決定，root 深度為 0，每往上游一層往左移動一個 COL_GAP。
 */
function _plannerAssignTreeCoordinates(rootId, children, extents) {
    const root = plannerState.nodes[rootId];

    function place(nodeId, depth, top, extent) {
        const kids = children[nodeId] || [];
        const node = plannerState.nodes[nodeId];

        if (depth > 0) node.x = root.x - depth * PLANNER_LAYOUT_COL_GAP;

        if (kids.length === 0) {
            if (depth > 0) node.y = top; // leaf 直接佔滿分配到的區間頂端 (區間高度 = 自己高度)
            return;
        }

        // 依序疊放子節點，並記錄各自的中心 y，供最後置中父節點使用
        let cursor = top;
        const childCenters = [];
        kids.forEach(childId => {
            const childExtent = extents[childId];
            place(childId, depth + 1, cursor, childExtent);
            childCenters.push(cursor + childExtent / 2);
            cursor += childExtent + PLANNER_LAYOUT_ROW_GAP;
        });

        if (depth > 0) {
            const centerY = (childCenters[0] + childCenters[childCenters.length - 1]) / 2;
            const el = document.getElementById('planner-node-' + nodeId);
            const ownHeight = el ? el.offsetHeight : 140;
            node.y = centerY - ownHeight / 2;
        }
    }

    place(rootId, 0, root.y - extents[rootId] / 2, extents[rootId]);
}

/* ==========================================================================
   SECTION: IMPORT FROM CALCULATOR RESULT
   ========================================================================== */

/**
 * 將 Calculator 分頁目前的計算結果 (calcResult = AlchemyCalcEngine.runCalculation 的回傳值)
 * 轉換成 Planner 節點圖，疊加到目前作用中的 plan。
 *
 * Stage 1: 遍歷 treeRoots，依 recipe.id 聚合成節點 (machineCount 加總)，跳過 raw/external 葉節點
 * Stage 2: 建立 parent-child 主要 edges
 * Stage 3: 依 byproducts[].producers 的正負配對，建立回收 edges
 *          (負值 entry 的 pathKey 是「產出該副產物的節點自己」，回收邊真正該接的是它的父節點，
 *           因為父節點才是實際消耗這個副產物的配方)
 * Stage 4: 疊加到目前 plan，依現有節點 bounding box 做座標偏移避免重疊
 * Stage 5: 重用 RT-style 排版 (虛擬 root 包裝多個真實 root)
 * Stage 6: resolveFlows 後，砍掉流量趨近於 0 的回收邊
 */
function plannerImportFromCalcResult(calcResult, params) {
    if (!calcResult || !calcResult.treeRoots || calcResult.treeRoots.length === 0) {
        alert(t('No calculation result to import.', 'ui'));
        return;
    }

    const aggMap = {};          // recipeId -> { recipeId, recipeModifiers, machineCount }
    const pathKeyToAgg = {};    // pathKey -> recipeId (只記有被聚合成節點的路徑)
    const parentOfPathKey = {}; // pathKey -> 父節點的 pathKey (或 null)
    const pendingEdgeSet = new Set();
    const pendingEdges = [];    // { fromKey, toKey, item, isRecycle }
    const rootAggKeys = new Set();

    function addPendingEdge(fromKey, toKey, item, isRecycle) {
        if (!fromKey || !toKey) return;
        const dedupeKey = `${fromKey}|${toKey}|${item}`;
        if (pendingEdgeSet.has(dedupeKey)) return;
        pendingEdgeSet.add(dedupeKey);
        pendingEdges.push({ fromKey, toKey, item, isRecycle: !!isRecycle });
    }

    // ---- Stage 1 + 2: 遍歷樹，聚合節點 + 建立主要 edges ----
    function walk(node, parentPathKey, parentAggKey) {
        parentOfPathKey[node.pathKey] = parentPathKey;

        const isAggregatable = node.recipe && !node.isRaw && !node.isExternal;
        if (!isAggregatable) return; // raw/external/無配方的葉節點：跳過，不生成節點

        const key = node.recipe.id;
        pathKeyToAgg[node.pathKey] = key;
        if (!aggMap[key]) {
            aggMap[key] = {
                recipeId: node.recipe.id,
                recipeModifiers: DB.settings.recipeModifiers?.[node.recipe.id],
                machineCount: 0
            };
        }
        aggMap[key].machineCount += node.machineCount;

        if (parentAggKey) {
            addPendingEdge(key, parentAggKey, node.item, false);
        }

        node.children.forEach(child => walk(child, node.pathKey, key));
    }

    calcResult.treeRoots.forEach(entry => {
        walk(entry.root, null, null);
        if (entry.root.recipe && !entry.root.isRaw && !entry.root.isExternal) {
            rootAggKeys.add(entry.root.recipe.id);
        }
    });
    // internalModules (燃料/肥料模組) 依需求不處理

    // machineCount <= 0 的聚合節點不生成
    Object.keys(aggMap).forEach(key => {
        if (aggMap[key].machineCount <= 0.000001) {
            delete aggMap[key];
            rootAggKeys.delete(key);
        }
    });

    // ---- Stage 3: 回收 edges ----
    (calcResult.byproducts || []).forEach(bypEntry => {
        const item = bypEntry.item;
        const positives = []; // 供給端 (產出這個副產物的節點)
        const negatives = []; // 需求端 (該節點的父節點，即真正消耗此副產物的配方)

        (bypEntry.producers || []).forEach(p => {
            if (p.rate > 0.0001) {
                const aggKey = pathKeyToAgg[p.pathKey];
                if (aggKey && aggMap[aggKey]) positives.push(aggKey);
            } else if (p.rate < -0.0001) {
                const parentPathKey = parentOfPathKey[p.pathKey];
                const parentAggKey = parentPathKey ? pathKeyToAgg[parentPathKey] : null;
                if (parentAggKey && aggMap[parentAggKey]) negatives.push(parentAggKey);
            }
        });

        positives.forEach(fromKey => {
            negatives.forEach(toKey => addPendingEdge(fromKey, toKey, item, true));
        });
    });

    if (Object.keys(aggMap).length === 0) {
        alert(t('Nothing to import (no producible nodes).', 'ui'));
        return;
    }

    // ---- Stage 4: 疊加到目前 plan，計算座標偏移 ----
    const hasExisting = Object.keys(plannerState.nodes).length > 0;
    let existingMaxX = -Infinity, existingMinY = Infinity;
    if (hasExisting) {
        Object.values(plannerState.nodes).forEach(n => {
            existingMaxX = Math.max(existingMaxX, n.x + 200); // 200 = 卡片寬度
            existingMinY = Math.min(existingMinY, n.y);
        });
    }
    const offsetX = hasExisting ? existingMaxX + 150 : 0;
    const offsetY = hasExisting ? existingMinY : 0;

    // 建立實際節點
    const keyToNodeId = {};
    Object.entries(aggMap).forEach(([key, agg]) => {
        plannerState._nodeSeq = (plannerState._nodeSeq || 0) + 1;
        const nodeId = 'pnode_' + plannerState._nodeSeq;
        keyToNodeId[key] = nodeId;
        plannerState.nodes[nodeId] = {
            id: nodeId, kind: 'recipe',
            recipeId: agg.recipeId,
            recipeModifiers: agg.recipeModifiers,
            machineCount: agg.machineCount,
            x: 0, y: 0
        };
    });


    // ---- 建立實際 edges，回收邊給予比所有現有邊都更小的 createdAt，享有最高優先度 ----

    let existingMinCreatedAt = 0;
    Object.values(plannerState.edges).forEach(e => {
        existingMinCreatedAt = Math.min(existingMinCreatedAt, e.createdAt);
    });
    let nextRecycleCreatedAt = existingMinCreatedAt - 1; // 遞減，確保回收邊全部排在最前面

    const recycleEdgeIds = [];
    pendingEdges.forEach(({ fromKey, toKey, item, isRecycle }) => {
        const fromNode = keyToNodeId[fromKey], toNode = keyToNodeId[toKey];
        if (!fromNode || !toNode) return;
        plannerState._edgeSeq = (plannerState._edgeSeq || 0) + 1;
        const edgeId = 'pedge_' + plannerState._edgeSeq;
        const createdAt = isRecycle ? (nextRecycleCreatedAt--) : plannerState._edgeSeq;
        plannerState.edges[edgeId] = { id: edgeId, item, fromNode, toNode, createdAt, ...(isRecycle ? {color: 'var(--byproduct)'} : {}) };
        if (isRecycle) recycleEdgeIds.push(edgeId);
    });

    // ---- Stage 5: 排版 ----
    const newNodeIds = Object.values(keyToNodeId);
    const rootNodeIds = [...rootAggKeys].map(k => keyToNodeId[k]).filter(Boolean);
    _plannerLayoutImportedGraph(newNodeIds, rootNodeIds, offsetX, offsetY);

    // ---- Stage 6: 清掉流量趨近 0 的回收邊 ----
    const flows = plannerResolveFlows();
    recycleEdgeIds.forEach(eid => {
        if (plannerState.edges[eid] && (flows.edgeFlow[eid] || 0) < 0.001) {
            delete plannerState.edges[eid];
        }
    });

    renderPlanner();
    savePlannerState();
    requestAnimationFrame(() => plannerFitToView(newNodeIds));
}

/**
 * 對一批新匯入的節點套用 RT-style 排版：
 * 用一個不會真正生成節點的「虛擬 root」把所有真實 root 接在它下面，
 * 重用 _plannerBuildUpstreamTree / _plannerComputeExtent / _plannerAssignTreeCoordinates，
 * 排版完成後刪除虛擬 root，再依 offsetX/offsetY 把整批節點平移到指定位置。
 */
function _plannerLayoutImportedGraph(newNodeIds, rootNodeIds, offsetX, offsetY) {
    if (newNodeIds.length === 0) return;

    const virtualId = '__virtual_root__';
    plannerState.nodes[virtualId] = { id: virtualId, kind: 'recipe', x: 0, y: 0, machineCount: 0, recipeId: null };

    // 先 render 一次，讓新節點的 DOM 卡片存在，才能量測高度供 _plannerComputeExtent 使用
    renderPlanner();

    const idSet = new Set(newNodeIds);
    const inAdj = {};
    newNodeIds.forEach(id => inAdj[id] = []);
    inAdj[virtualId] = rootNodeIds.length > 0 ? rootNodeIds : newNodeIds;

    Object.values(plannerState.edges).forEach(e => {
        if (idSet.has(e.fromNode) && idSet.has(e.toNode) && inAdj[e.toNode]) {
            inAdj[e.toNode].push(e.fromNode);
        }
    });

    const children = _plannerBuildUpstreamTree(virtualId, inAdj);
    const extents = {};
    _plannerComputeExtent(virtualId, children, extents);
    _plannerAssignTreeCoordinates(virtualId, children, extents);

    delete plannerState.nodes[virtualId];

    let minX = Infinity, minY = Infinity;
    newNodeIds.forEach(id => {
        const n = plannerState.nodes[id];
        if (!n) return;
        minX = Math.min(minX, n.x);
        minY = Math.min(minY, n.y);
    });
    if (!isFinite(minX)) { minX = 0; minY = 0; }

    newNodeIds.forEach(id => {
        const n = plannerState.nodes[id];
        if (!n) return;
        n.x = plannerSnapVal(n.x - minX + offsetX);
        n.y = plannerSnapVal(n.y - minY + offsetY);
    });
}

/* ==========================================================================
   SECTION: ENCAPSULATE SELECTED NODES INTO MODULE
   ========================================================================== */

/** 依選取節點的輸出 port，找出 cauldronCost 最高的物品，供命名使用 */
function _findHighestCauldronCostOutputItem(nodeIds) {
    let bestItem = null;
    let bestCost = -Infinity;
    nodeIds.forEach(id => {
        const node = plannerState.nodes[id];
        if (!node) return;
        const rates = plannerGetRecipeRates(node.recipeId, node.recipeModifiers);
        if (!rates) return;
        rates.outputsPerMachine.forEach(({ item }) => {
            const cost = DB.items[item]?.cauldronCost;
            if (typeof cost === 'number' && cost > bestCost) {
                bestCost = cost;
                bestItem = item;
            }
        });
    });
    return bestItem;
}

/** 主功能：將目前選取的節點與其內部連線封裝為一個新的模組 (plan)，並在原位置留下一個模組節點 */
function encapsulatePlannerSelectedNodes() {
    const selectedIds = [..._plannerSelectedNodeIds];
    if (selectedIds.length === 0) return;
    const selectedSet = new Set(selectedIds);

    // 1. 分類 edges
    const internalEdges = [];
    const inEdges = [];
    const outEdges = [];
    Object.values(plannerState.edges).forEach(edge => {
        const fromIn = selectedSet.has(edge.fromNode);
        const toIn = selectedSet.has(edge.toNode);
        if (fromIn && toIn) internalEdges.push(edge);
        else if (toIn) inEdges.push(edge);
        else if (fromIn) outEdges.push(edge);
    });

    // 2. 命名：找選取節點中 cauldronCost 最高的輸出物品，否則 fallback 為時間戳
    const namingItem = _findHighestCauldronCostOutputItem(selectedIds);
    const planName = namingItem ? `${t('Module', 'ui')} - ${namingItem}` : `${t('Module', 'ui')} - ${Date.now()}`;

    // 3. 計算選取節點的中心位置 (供新模組節點放置用)
    let sumX = 0, sumY = 0, count = 0;
    selectedIds.forEach(id => {
        const node = plannerState.nodes[id];
        if (!node) return;
        const el = document.getElementById('planner-node-' + id);
        const w = el ? el.offsetWidth : 200;
        const h = el ? el.offsetHeight : 140;
        sumX += node.x + w / 2;
        sumY += node.y + h / 2;
        count++;
    });
    const centerX = count > 0 ? sumX / count : 0;
    const centerY = count > 0 ? sumY / count : 0;

    // 4. 建立新 plan，搬移節點 + internal edges (深拷貝)
    const newPlan = _createPlan(planName);
    newPlan.data.nodes = {};
    selectedIds.forEach(id => {
        const node = plannerState.nodes[id];
        if (node) newPlan.data.nodes[id] = JSON.parse(JSON.stringify(node));
    });
    newPlan.data.edges = {};
    internalEdges.forEach(edge => {
        newPlan.data.edges[edge.id] = JSON.parse(JSON.stringify(edge));
    });
    // 避免新 plan 之後自行新增節點/連線時，序號與被搬移過來的舊 id 衝突
    newPlan.data._nodeSeq = plannerState._nodeSeq || 0;
    newPlan.data._edgeSeq = plannerState._edgeSeq || 0;

    // 5. 從原 plan 移除選取節點 + internal edges
    selectedIds.forEach(id => delete plannerState.nodes[id]);
    internalEdges.forEach(edge => delete plannerState.edges[edge.id]);

    // 6. 在原位置建立新的模組節點
    plannerState._nodeSeq = (plannerState._nodeSeq || 0) + 1;
    const moduleNodeId = 'pnode_' + plannerState._nodeSeq;
    plannerState.nodes[moduleNodeId] = {
        id: moduleNodeId, kind: 'module',
        recipeId: null,
        moduleId: newPlan.id,
        machineCount: 1,
        x: Math.round(centerX - 100),
        y: Math.round(centerY - 70)
    };

    // 7. in/out edges 改指向新模組節點
    inEdges.forEach(edge => { edge.toNode = moduleNodeId; });
    outEdges.forEach(edge => { edge.fromNode = moduleNodeId; });

    // 8. 將新 plan 註冊進 library，並建立其初始 undo 歷史快照
    plannerLibrary.plans[newPlan.id] = newPlan;
    plannerLibrary.planOrder.push(newPlan.id);
    plannerHistory[newPlan.id] = {
        stack: [JSON.parse(JSON.stringify(newPlan.data))],
        index: 0
    };

    // 9. 清空選取狀態、重繪、存檔
    _plannerSelectedNodeIds.clear();
    renderPlanner();
    savePlannerState();       // 記錄目前 (原) plan 的這次編輯到 undo 歷史
    savePlannerLibraryMeta(); // 確保新 plan 被寫入 localStorage
    renderPlannerToolbarSelect(); // 讓下拉選單能選到新 plan
}

function plannerGetPortalRates(node) {
    const result = { recipe: null, inputsPerMachine: [], outputsPerMachine: [], heatItemsPerMachine: 0, fertItemsPerMachine: 0, errorCode: '' };
    const item = node.portalItem;
    if (!item || !DB.items[item]) return { ...result, errorCode: 'No Item Selected' };
    return { ...result, inputsPerMachine: [{ item, rate: 1 }], outputsPerMachine: [{ item, rate: 1 }] };
}
