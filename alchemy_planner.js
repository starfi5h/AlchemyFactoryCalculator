/* ==========================================================================
   SECTION: PLANNER TAB
   Phase 1: 自由節點圖 - 手動放置節點、設定機器數，即時算出各 port 速率
   Phase 2: 手動拉線建立/刪除連線
   Phase 3: 依 edge 建立順序做流量分配，port 變色 + 卡片外 +N/-N 標籤
   ========================================================================== */

const PLANNER_STORAGE_KEY = "alchemy_planner_v1";

let plannerState = {
    nodes: {},          // { [nodeId]: { id, recipeId, recipeModifiers, machineCount, x, y } }
    edges: {},          // { [edgeId]: { id, item, fromNode, toNode, createdAt } }
    viewport: { x: 0, y: 0, zoom: 1 },
    _edgeSeq: 0,
    _nodeSeq: 0
};

let _plannerLastFlows = null; // 上一次 resolveFlows() 的結果快取 (供拖曳節點時即時重繪邊線用)

/* ---------------- INIT / PERSISTENCE ---------------- */

function initPlannerPage() {
    loadPlannerState();
    renderPlanner();
    attachPlannerCanvasPan();
    attachPlannerPortDragHandlers();
}

function loadPlannerState() {
    const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
    if (!saved) return;
    try {
        const parsed = JSON.parse(saved);
        plannerState = Object.assign(
            { nodes: {}, edges: {}, viewport: { x: 0, y: 0, zoom: 1 }, _edgeSeq: 0, _nodeSeq: 0 },
            parsed
        );
        // 遷移邊的物品(中/英轉換)
        Object.values(plannerState.edges).forEach(edge => {
            const itemName = edge.item;
            if (!DB.items[itemName]) {
                const alterName = queryDualItemName(itemName); // i18n
                if (DB.items[alterName]) {
                    edge.item = alterName;                    
                }
            }
        });
    } catch (e) {
        console.error("Planner state corrupt, resetting.", e);
    }
}

function savePlannerState() {
    localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(plannerState));
}

/* ---------------- COORDINATE HELPERS ---------------- */

function plannerScreenToGraph(clientX, clientY) {
    const canvas = document.getElementById('planner-canvas');
    const rect = canvas.getBoundingClientRect();
    return {
        x: clientX - rect.left - plannerState.viewport.x,
        y: clientY - rect.top - plannerState.viewport.y
    };
}

function applyPlannerViewportTransform() {
    const vp = document.getElementById('planner-viewport');
    if (vp) vp.style.transform = `translate(${plannerState.viewport.x}px, ${plannerState.viewport.y}px)`;
}

/* ---------------- ADD / REMOVE NODES ---------------- */

function onPlannerAddNodeClick() {
    const canvas = document.getElementById('planner-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const stackOffset = (Object.keys(plannerState.nodes).length % 6) * 26;
    const graphX = (rect.width / 2 - plannerState.viewport.x) - 110 + stackOffset;
    const graphY = (rect.height / 2 - plannerState.viewport.y) - 60 + stackOffset;
    openPlannerItemPicker(graphX, graphY);
}

function onPlannerCanvasContextMenu(e) {
    if (e.target.closest('.planner-node')) return;
    e.preventDefault();
    const g = plannerScreenToGraph(e.clientX, e.clientY);
    openPlannerItemPicker(g.x - 110, g.y - 20);
}

function openPlannerItemPicker(graphX, graphY) {
    const originalSelectItem = window.selectItem;
    window.selectItem = (name) => {
        window.selectItem = originalSelectItem;
        if (getRecipesFor(name).length === 0) {
            alert(t('This item has no recipe and cannot be added as a Planner node.', 'ui'));
            return;
        }
        addPlannerNode(name, graphX, graphY);
    };
    openItemPicker();
}

function addPlannerNode(itemName, graphX, graphY) {
    const recipe = getActiveRecipe(itemName); // 只在建立當下取一次，之後不再受 preferred 影響
    if (!recipe) return;

    plannerState._nodeSeq = (plannerState._nodeSeq || 0) + 1;
    const id = 'pnode_' + plannerState._nodeSeq;
    plannerState.nodes[id] = {
        id,
        recipeId: recipe.id,
        recipeModifiers: DB.settings?.recipeModifiers?.[recipe.id],
        machineCount: 1,
        x: Math.round(graphX),
        y: Math.round(graphY)
    };
    renderPlanner();
    savePlannerState();
}

function removePlannerNode(nodeId) {
    delete plannerState.nodes[nodeId];
    Object.keys(plannerState.edges).forEach(eid => {
        const e = plannerState.edges[eid];
        if (e.fromNode === nodeId || e.toNode === nodeId) delete plannerState.edges[eid];
    });
    renderPlanner();
    savePlannerState();
}

/* ---------------- RECIPE / RATE CALCULATION ---------------- */

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
    const isNursery = recipe.machine === "Nursery" || recipe.machine === "World Tree Nursery";
    if (nutrientCost > 0 && isNursery) {
        const fertSpeed = DB.items[DB.settings.defaultFert]?.maxFertility || 1;
        recipeTime = nutrientCost / fertSpeed;
    }
    return recipeTime;
}

/**
 * 依節點目前的機器數與全域共用設定(preferredRecipes/recipeModifiers/升級等級)，
 * 算出這個節點所有 input/output port 的速率，以及機台本身的燃料/肥料消耗。
 */
function computeNodePorts(node) {
    const recipe = getRecipeById(node.recipeId, node.recipeModifiers);
    const result = { recipe, inputs: [], outputs: [], heatItemsPerMin: 0, fertItemsPerMin: 0 };
    if (!recipe) return result;

    const lvlSpeed = DB.settings.lvlSpeed || 0;
    const lvlAlchemy = DB.settings.lvlAlchemy || 0;
    const lvlFuel = DB.settings.lvlFuel || 0;
    const lvlFert = DB.settings.lvlFert || 0;
    const speedMult = getSpeedMult(lvlSpeed);
    const alchemyMult = getAlchemyMult(lvlAlchemy);

    const recipeTime = plannerGetRecipeTime(recipe);
    const nutrientCost = recipe.nutrientCost || 0;
    const isNursery = recipe.machine === "Nursery" || recipe.machine === "World Tree Nursery";
    const batchesPerMin = (60 / (recipeTime || 1)) * speedMult * node.machineCount;

    const mainOut = Object.keys(recipe.outputs)[0]; // 取代原本的 node.itemTarget

    Object.entries(recipe.inputs || {}).forEach(([item, qty]) => {
        result.inputs.push({ item, rate: qty * batchesPerMin });
    });
    Object.entries(recipe.outputs || {}).forEach(([item, qty]) => {
        let effQty = qty;
        if (item === mainOut) effQty = applyAlchemyMult(recipe.machine, qty, alchemyMult);
        result.outputs.push({ item, rate: effQty * batchesPerMin });
    });

    // 燃料消耗 (heatCost -> 燃料物品/分鐘)
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
        const heatingDevicesNeeded = node.machineCount / (heatingSlots / slotsRequired);
        const totalHeatPerSec = heatingDevicesNeeded * (heatingDevice.heatSelf || 0) * speedMult
            + node.machineCount * activeHeat;
        const fuelDef = DB.items[DB.settings.defaultFuel] || {};
        const grossFuelEnergy = (fuelDef.heat || 1) * (1 + lvlFuel * 0.10);
        result.heatItemsPerMin = (totalHeatPerSec * 60) / grossFuelEnergy;
    }

    // 肥料消耗 (Nursery)
    if (isNursery) {
        const totalNutrientsPerMin = batchesPerMin * nutrientCost;
        const fertDef = DB.items[DB.settings.defaultFert] || { nutrientValue: 144 };
        const grossFertVal = fertDef.nutrientValue * (1 + lvlFert * 0.10);
        result.fertItemsPerMin = totalNutrientsPerMin / grossFertVal;
    }

    return result;
}

/* ---------------- FLOW RESOLUTION (Phase 3) ---------------- */

function plannerPortKey(nodeId, item, dir) {
    return `${nodeId}::${item}::${dir}`;
}

/**
 * 重新計算整張圖：
 * 1) 每個節點各 port 的理論速率
 * 2) 清掉配方已改變導致無效的邊 (item 不再是該節點的 port)
 * 3) 依 edge 建立順序 (createdAt) 依序分配流量：先建立的邊優先拿滿自己需要的量
 */
function plannerResolveFlows() {
    const nodePortsCache = {};
    Object.values(plannerState.nodes).forEach(node => {
        nodePortsCache[node.id] = computeNodePorts(node);
    });

    // 清理失效的邊 (例如節點配方切換後，該 item 不再是 input/output)
    let changed = false;
    Object.keys(plannerState.edges).forEach(eid => {
        const e = plannerState.edges[eid];
        const fromPorts = nodePortsCache[e.fromNode];
        const toPorts = nodePortsCache[e.toNode];
        const fromOk = fromPorts && fromPorts.outputs.some(p => p.item === e.item);
        const toOk = toPorts && toPorts.inputs.some(p => p.item === e.item);
        if (!fromOk || !toOk) { delete plannerState.edges[eid]; changed = true; }
    });
    if (changed) savePlannerState();

    const portTheoretical = {};
    Object.entries(nodePortsCache).forEach(([nodeId, ports]) => {
        ports.inputs.forEach(p => { portTheoretical[plannerPortKey(nodeId, p.item, 'in')] = p.rate; });
        ports.outputs.forEach(p => { portTheoretical[plannerPortKey(nodeId, p.item, 'out')] = p.rate; });
    });

    const portRemaining = Object.assign({}, portTheoretical);
    const portConnections = {};
    const edgeFlow = {};

    const sortedEdges = Object.values(plannerState.edges).sort((a, b) => a.createdAt - b.createdAt);
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
    _plannerLastFlows = flows;
    return flows;
}

function plannerGetAvailableRateAtPort(nodeId, item, dir) {
    const flows = plannerResolveFlows();
    const key = plannerPortKey(nodeId, item, dir);
    return flows.portRemaining[key] ?? (flows.portTheoretical[key] ?? 0);
}

/* ---------------- FULL RENDER ---------------- */

function renderPlanner() {
    const layer = document.getElementById('planner-nodes-layer');
    if (!layer) return;
    const flows = plannerResolveFlows();
    layer.innerHTML = '';
    Object.values(plannerState.nodes).forEach(node => {
        layer.appendChild(createPlannerNodeEl(node, flows));
    });
    applyPlannerViewportTransform();
    renderPlannerEdges(flows);
}

/** 輕量刷新：重算流量後只 patch 既有節點卡片內容與邊線，不重建節點 DOM (保留拖曳/輸入焦點狀態) */
function recomputeAndRefreshPlanner() {
    const flows = plannerResolveFlows();
    Object.values(plannerState.nodes).forEach(node => patchPlannerNodeDisplay(node, flows));
    renderPlannerEdges(flows);
    return flows;
}

function createPlannerNodeEl(node, flows) {
    const wrap = document.createElement('div');
    wrap.className = 'planner-node';
    wrap.id = 'planner-node-' + node.id;
    wrap.style.left = node.x + 'px';
    wrap.style.top = node.y + 'px';

    const ports = flows.nodePortsCache[node.id] || computeNodePorts(node);
    const machineKey = ports.recipe ? ports.recipe.machine : '';
    const mainOut = ports.recipe ? Object.keys(ports.recipe.outputs)[0] : plannerMainOutput(node.recipeId) || '';
    const machineName = ports.recipe ? t(ports.recipe.machine, 'machines') : t('No Recipe', 'ui');
    const machineIconHtml = machineKey
    ? `<img src="img/machines/${machineKey.toLowerCase().replaceAll(' ', '-')}.png" class="planner-node-icon" onerror="this.style.opacity='0'">`
    : `<span class="planner-node-icon"></span>`;

    wrap.innerHTML = `
        <div class="planner-node-header">
            ${machineIconHtml}
            <span class="planner-node-title" title="${mainOut}">${machineName}</span>
            <button class="planner-gear-btn" title="${t('Node Settings', 'ui')}" onclick="openPlannerNodeModal('${node.id}')">⚙</button>
            <button class="planner-close-btn" title="${t('Remove Node', 'ui')}" onclick="removePlannerNode('${node.id}')">✕</button>
        </div>
        <div class="planner-node-body" id="planner-node-body-${node.id}">
            ${renderPlannerPortsHtml(node, ports, flows)}
            <div class="planner-machine-count-row">
                <label>${t('Machine Count', 'ui')}</label>
                <input type="number" min="0" step="1" value="${node.machineCount}"
                       data-mc-for="${node.id}"
                       oninput="updatePlannerMachineCount('${node.id}', this.value)">
            </div>
            <div class="planner-heatfert-row" id="planner-heatfert-${node.id}">
                ${renderPlannerHeatFertHtml(ports)}
            </div>
        </div>
    `;

    attachPlannerNodeDrag(wrap, node);
    return wrap;
}

function renderPlannerPortsHtml(node, ports, flows) {
    const inRows = ports.inputs.map(p => renderPlannerPortRow(node.id, p, 'in', flows)).join('');
    const outRows = ports.outputs.map(p => renderPlannerPortRow(node.id, p, 'out', flows)).join('');
    return `<div class="planner-ports-row">
        <div class="planner-ports-col planner-ports-in">${inRows || `<div class="planner-port-empty">—</div>`}</div>
        <div class="planner-ports-col planner-ports-out">${outRows || `<div class="planner-port-empty">—</div>`}</div>
    </div>`;
}

function renderPlannerPortRow(nodeId, port, dir, flows) {
    const itemDef = DB.items[port.item] || {};
    const key = plannerPortKey(nodeId, port.item, dir);
    const connected = flows && (flows.portConnections[key] || []).length > 0;
    const remaining = flows ? (flows.portRemaining[key] ?? port.rate) : port.rate;

    let colorClass = dir === 'in' ? 'planner-port-gray' : 'planner-port-yellow';
    let rateClass = '';
    let badgeHtml = '';

    if (dir === 'out') {
        if (connected) {
            colorClass = 'planner-port-green';
            if (remaining > 0.001) {
                badgeHtml = `<span class="planner-port-badge planner-badge-surplus">+${formatVal(remaining)}</span>`;
                colorClass = rateClass = 'planner-port-yellow';
            }
        } else {
            colorClass = port.rate > 0.0001 ? 'planner-port-yellow' : 'planner-port-gray';
        }
    } else {
        if (connected) {
            if (remaining > 0.001) {
                colorClass = rateClass = 'planner-port-red';
                badgeHtml = `<span class="planner-port-badge planner-badge-shortage">-${formatVal(remaining)}</span>`;
            } else {
                colorClass = 'planner-port-green';
            }
        } else {
            colorClass = 'planner-port-gray';
        }
    }


    const dot = `<span class="planner-port-dot ${colorClass}" data-item="${port.item}" data-dir="${dir}"></span>`;
    const icon = `<img src="img/item${itemDef.id ?? 0}.png" width="16" height="16">`;
    const name = `<span class="planner-port-name">${port.item}</span>`;
    const rate = `<span class="planner-port-rate ${rateClass}">${formatVal(port.rate)}</span>`;
    if (dir === 'in') return `<div class="planner-port planner-port-in">${badgeHtml}${dot}${rate}${icon}${name}</div>`;
    return `<div class="planner-port planner-port-out">${name}${icon}${rate}${dot}${badgeHtml}</div>`;
}

function renderPlannerHeatFertHtml(ports) {
    let html = '';
    if (ports.heatItemsPerMin > 0.001) {
        const fuelDef = DB.items[DB.settings.defaultFuel] || {};
        html += `<span class="heat-tag">-${formatVal(ports.heatItemsPerMin)}/m <img src="img/item${fuelDef.id ?? 0}.png" class="item-icon-small" title="${DB.settings.defaultFuel}"></span>`;
    }
    if (ports.fertItemsPerMin > 0.001) {
        const fertDef = DB.items[DB.settings.defaultFert] || {};
        html += `<span class="bio-tag">-${formatVal(ports.fertItemsPerMin)}/m <img src="img/item${fertDef.id ?? 0}.png" class="item-icon-small" title="${DB.settings.defaultFert}"></span>`;
    }
    return html;
}

/* ---------------- MACHINE COUNT UPDATE ---------------- */

function updatePlannerMachineCount(nodeId, value) {
    const node = plannerState.nodes[nodeId];
    if (!node) return;
    node.machineCount = Math.max(0, parseFloat(value) || 0);
    recomputeAndRefreshPlanner();
    savePlannerState();
}

/** 只 patch 單一節點卡片的顯示內容 (ports/機器數/heat-fert)，不重建 DOM，保留輸入焦點 */
function patchPlannerNodeDisplay(node, flows) {
    const ports = flows.nodePortsCache[node.id];
    if (!ports) return;
    const body = document.getElementById('planner-node-body-' + node.id);
    if (body) {
        const portsRowEl = body.querySelector('.planner-ports-row');
        if (portsRowEl) portsRowEl.outerHTML = renderPlannerPortsHtml(node, ports, flows);
        const heatFertEl = document.getElementById('planner-heatfert-' + node.id);
        if (heatFertEl) heatFertEl.innerHTML = renderPlannerHeatFertHtml(ports);
    }
    document.querySelectorAll(`[data-mc-for="${node.id}"]`).forEach(el => {
        if (document.activeElement !== el) el.value = node.machineCount;
    });

    const modalBody = document.getElementById('planner-node-modal-body');
    const modalEl = document.getElementById('planner-node-modal');
    if (modalBody && modalBody.dataset.nodeId === node.id && modalEl && modalEl.style.display === 'flex') {
        const modalPortsRow = modalBody.querySelector('.planner-ports-row');
        if (modalPortsRow) modalPortsRow.outerHTML = renderPlannerPortsHtml(node, ports, flows);
        const modalHeatFert = modalBody.querySelector('.planner-heatfert-row');
        if (modalHeatFert) modalHeatFert.innerHTML = renderPlannerHeatFertHtml(ports);
    }
}

/* ---------------- NODE SETTINGS MODAL (gear button) ---------------- */

function openPlannerNodeModal(nodeId) {
    const modalBody = document.getElementById('planner-node-modal-body');
    if (!modalBody) return;
    modalBody.dataset.nodeId = nodeId;
    renderPlannerNodeModalBody(nodeId);
    document.getElementById('planner-node-modal').style.display = 'flex';
}

function renderPlannerNodeModalBody(nodeId) {
    const node = plannerState.nodes[nodeId];
    const modalBody = document.getElementById('planner-node-modal-body');
    if (!node || !modalBody) return;

    const flows = plannerResolveFlows();
    const ports = flows.nodePortsCache[nodeId] || computeNodePorts(node);
    const mainOut = plannerMainOutput(node.recipeId);
    const itemDef = mainOut ? (DB.items[mainOut] || {}) : {};

    const titleEl = document.getElementById('planner-node-modal-title');
    if (titleEl) {
        titleEl.innerHTML = mainOut
            ? `<img src="img/item${itemDef.id ?? 0}.png" width="20" height="20" style="vertical-align:middle; margin-bottom:2px;"> ${mainOut}`
            : t('No Recipe', 'ui');
    }

    const recipeInfoHtml = ports.recipe
        ? `<div style="display:flex; align-items:center; gap:8px;">
               <strong>${t(ports.recipe.machine, 'machines')}</strong>
               <span style="opacity:0.7; font-size:0.85em;">(${ports.recipe.baseTime ?? '—'} s)</span>
               <button class="swap-btn" style="width:auto; padding:2px 10px; border-radius:4px;"
                       onclick="openPlannerRecipeSwitch('${node.id}')">🔄 ${t('Swap Recipe', 'ui')}</button>
           </div>`
        : `<div style="display:flex; align-items:center; gap:8px; color:var(--danger);">
               ${t('No recipe selected', 'ui')}
               ${mainOut ? `<button class="swap-btn" style="width:auto; padding:2px 10px; border-radius:4px;"
                       onclick="openPlannerRecipeSwitch('${node.id}')">${t('Select Recipe', 'ui')}</button>` : ''}
           </div>`;

    modalBody.innerHTML = `
        <div style="padding:12px; display:flex; flex-direction:column; gap:12px;">
            ${recipeInfoHtml}
            <div class="planner-machine-count-row" style="border-top:1px dashed #444; padding-top:10px;">
                <label>${t('Machine Count', 'ui')}</label>
                <input type="number" min="0" step="1" value="${node.machineCount}"
                       data-mc-for="${node.id}"
                       oninput="updatePlannerMachineCount('${node.id}', this.value)">
            </div>
            ${renderPlannerPortsHtml(node, ports, flows)}
            <div class="planner-heatfert-row">${renderPlannerHeatFertHtml(ports)}</div>
        </div>
    `;
}

// 新增：把 node.recipeId 換成使用者選的新配方（不寫入全域 preferredRecipes）
function openPlannerRecipeSwitch(nodeId) {
    const node = plannerState.nodes[nodeId];
    if (!node) return;
    const mainOut = plannerMainOutput(node.recipeId);
    if (!mainOut) return; // 沒有 raw 配方可查，無法判斷候選清單

    openRecipeModal(mainOut, '', (newRecipeId) => {
        node.recipeId = newRecipeId;
        savePlannerState();
    }, node.recipeId);
}

/**
 * 由 alchemy_ui.js 在配方/催化劑/自訂輸入變更時呼叫 (共用全域設定變更通知)。
 * 因為機台/圖示等 header 內容也可能一併改變，這裡做完整重建。
 */
function notifyPlannerRecipeChanged() {
    if (!document.getElementById('planner-nodes-layer')) return;
    renderPlanner();
    const modalBody = document.getElementById('planner-node-modal-body');
    const modalEl = document.getElementById('planner-node-modal');
    if (modalBody && modalBody.dataset.nodeId && modalEl && modalEl.style.display === 'flex') {
        renderPlannerNodeModalBody(modalBody.dataset.nodeId);
    }
}

/* ---------------- DRAG NODE (header only) ---------------- */

function attachPlannerNodeDrag(wrap, node) {
    const header = wrap.querySelector('.planner-node-header');
    header.addEventListener('pointerdown', (e) => {
        if (e.target.closest('button')) return;
        e.preventDefault();
        header.setPointerCapture(e.pointerId);
        header.classList.add('dragging');
        const startX = e.clientX, startY = e.clientY;
        const originX = node.x, originY = node.y;

        const onMove = (ev) => {
            node.x = originX + (ev.clientX - startX);
            node.y = originY + (ev.clientY - startY);
            wrap.style.left = node.x + 'px';
            wrap.style.top = node.y + 'px';
            if (_plannerLastFlows) renderPlannerEdges(_plannerLastFlows);
        };
        const onUp = () => {
            header.removeEventListener('pointermove', onMove);
            header.removeEventListener('pointerup', onUp);
            header.classList.remove('dragging');
            savePlannerState();
        };
        header.addEventListener('pointermove', onMove);
        header.addEventListener('pointerup', onUp);
    });
}

/* ---------------- CANVAS PAN (drag empty background) ---------------- */

function attachPlannerCanvasPan() {
    const canvas = document.getElementById('planner-canvas');
    if (!canvas || canvas.dataset.panBound) return;
    canvas.dataset.panBound = "1";

    canvas.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.planner-node')) return;
        if (e.button !== 0) return; // 只用左鍵拖曳平移；右鍵保留給新增節點
        canvas.setPointerCapture(e.pointerId);
        canvas.classList.add('panning');
        const startX = e.clientX, startY = e.clientY;
        const originX = plannerState.viewport.x, originY = plannerState.viewport.y;

        const onMove = (ev) => {
            plannerState.viewport.x = originX + (ev.clientX - startX);
            plannerState.viewport.y = originY + (ev.clientY - startY);
            applyPlannerViewportTransform();
        };
        const onUp = () => {
            canvas.removeEventListener('pointermove', onMove);
            canvas.removeEventListener('pointerup', onUp);
            canvas.classList.remove('panning');
            savePlannerState();
        };
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);
    });
}

/* ==========================================================================
   SECTION: EDGES (Phase 2/3) - 繪製、拉線建立、刪除
   ========================================================================== */

function getPlannerPortDotEl(nodeId, item, dir) {
    const nodeEl = document.getElementById('planner-node-' + nodeId);
    if (!nodeEl) return null;
    const dots = nodeEl.querySelectorAll('.planner-port-dot');
    for (const d of dots) {
        if (d.dataset.item === item && d.dataset.dir === dir) return d;
    }
    return null;
}

function getPlannerPortGraphPos(nodeId, item, dir) {
    const dot = getPlannerPortDotEl(nodeId, item, dir);
    if (!dot) return null;
    const rect = dot.getBoundingClientRect();
    return plannerScreenToGraph(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function buildPlannerEdgePathD(p1, p2) {
    const dx = Math.max(40, Math.abs(p2.x - p1.x) * 0.5);
    return `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;
}

function renderPlannerEdges(flows) {
    const svg = document.getElementById('planner-svg-layer');
    if (!svg) return;
    const beltSpeed = getBeltSpeed(DB.settings.lvlBelt || 0);
    let html = '';

    Object.values(plannerState.edges).forEach(edge => {
        const p1 = getPlannerPortGraphPos(edge.fromNode, edge.item, 'out');
        const p2 = getPlannerPortGraphPos(edge.toNode, edge.item, 'in');
        if (!p1 || !p2) return;

        const flow = flows.edgeFlow[edge.id] || 0;
        const itemDef = DB.items[edge.item] || {};
        const d = buildPlannerEdgePathD(p1, p2);
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const beltCount = !itemDef.liquid ? (flow / beltSpeed) : null;

        html += `
            <g class="planner-edge-group" data-edge-id="${edge.id}">
                <path class="planner-edge-hit" d="${d}" onclick="openPlannerEdgeModal('${edge.id}')"></path>
                <path class="planner-edge-line" d="${d}"></path>
                <foreignObject x="${midX - 60}" y="${midY - 15}" width="120" height="32" style="overflow:visible;">
                    <div xmlns="http://www.w3.org/1999/xhtml" class="planner-edge-label" onclick="openPlannerEdgeModal('${edge.id}')">
                        <img src="img/item${itemDef.id ?? 0}.png" width="16" height="16">
                        <span>${formatVal(flow)}/m</span>
                        ${beltCount !== null ? `<span class="planner-edge-belt">(${beltCount.toFixed(2)})</span>` : ''}
                    </div>
                </foreignObject>
            </g>`;
    });

    svg.innerHTML = html;
}

/* ---- 拉線互動 ---- */

function attachPlannerPortDragHandlers() {
    const layer = document.getElementById('planner-nodes-layer');
    if (!layer || layer.dataset.portDragBound) return;
    layer.dataset.portDragBound = "1";
    layer.addEventListener('pointerdown', (e) => {
        const dot = e.target.closest('.planner-port-dot');
        if (!dot) return;
        e.stopPropagation();
        e.preventDefault();
        startPlannerConnectionDrag(dot, e);
    });
}

function startPlannerConnectionDrag(dotEl, e) {
    const nodeId = dotEl.closest('.planner-node').id.replace('planner-node-', '');
    const item = dotEl.dataset.item;
    const dir = dotEl.dataset.dir; // 起點 port 的方向
    const svg = document.getElementById('planner-svg-layer');
    const startPos = getPlannerPortGraphPos(nodeId, item, dir) || plannerScreenToGraph(e.clientX, e.clientY);

    let previewEl = null;
    const updatePreview = (clientX, clientY) => {
        const cur = plannerScreenToGraph(clientX, clientY);
        const d = dir === 'out' ? buildPlannerEdgePathD(startPos, cur) : buildPlannerEdgePathD(cur, startPos);
        if (!previewEl) {
            previewEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            previewEl.setAttribute('class', 'planner-edge-line planner-edge-preview');
            svg.appendChild(previewEl);
        }
        previewEl.setAttribute('d', d);
    };
    updatePreview(e.clientX, e.clientY);

    const onMove = (ev) => updatePreview(ev.clientX, ev.clientY);
    const onUp = (ev) => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        if (previewEl) previewEl.remove();

        const dropEl = document.elementFromPoint(ev.clientX, ev.clientY);
        const targetDot = dropEl ? dropEl.closest('.planner-port-dot') : null;

        if (targetDot && targetDot !== dotEl) {
            tryCreatePlannerEdgeFromDots(nodeId, item, dir, targetDot);
            return;
        }
        const targetNodeEl = dropEl ? dropEl.closest('.planner-node') : null;
        if (!targetNodeEl) {
            // 放到空白畫布 -> 開啟新增節點的配方選單
            const g = plannerScreenToGraph(ev.clientX, ev.clientY);
            openPlannerRecipePickerMenu({
                item, originDir: dir, sourceNodeId: nodeId,
                graphX: g.x, graphY: g.y,
                clientX: ev.clientX, clientY: ev.clientY
            });
        }
        // 放到卡片上但不是 port dot -> 取消，不做任何事
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
}

function tryCreatePlannerEdgeFromDots(sourceNodeId, item, sourceDir, targetDotEl) {
    const targetNodeEl = targetDotEl.closest('.planner-node');
    if (!targetNodeEl) return;
    const targetNodeId = targetNodeEl.id.replace('planner-node-', '');
    const targetItem = targetDotEl.dataset.item;
    const targetDir = targetDotEl.dataset.dir;

    if (targetItem !== item) { alert(t('Ports must be the same item to connect.', 'ui')); return; }
    if (targetDir === sourceDir) { alert(t('Cannot connect two ports of the same direction.', 'ui')); return; }

    const fromNode = sourceDir === 'out' ? sourceNodeId : targetNodeId;
    const toNode = sourceDir === 'out' ? targetNodeId : sourceNodeId;

    const dup = Object.values(plannerState.edges).some(e =>
        e.fromNode === fromNode && e.toNode === toNode && e.item === item);
    if (dup) { alert(t('These two ports are already connected.', 'ui')); return; }

    plannerState._edgeSeq = (plannerState._edgeSeq || 0) + 1;
    const edgeId = 'pedge_' + plannerState._edgeSeq;
    plannerState.edges[edgeId] = { id: edgeId, item, fromNode, toNode, createdAt: plannerState._edgeSeq };

    recomputeAndRefreshPlanner();
    savePlannerState();
}

/* ---- 連線資訊 Modal (點擊 label / 連線本體) ---- */

function openPlannerEdgeModal(edgeId) {
    const edge = plannerState.edges[edgeId];
    if (!edge) return;
    const flows = plannerResolveFlows();
    const flow = flows.edgeFlow[edgeId] || 0;
    const itemDef = DB.items[edge.item] || {};
    const fromNode = plannerState.nodes[edge.fromNode];
    const toNode = plannerState.nodes[edge.toNode];
    const fromRecipe = fromNode ? getRecipeById(fromNode.recipeId) : null;
    const toRecipe = toNode ? getRecipeById(toNode.recipeId) : null;
    const fromMain = fromNode ? plannerMainOutput(fromNode.recipeId) : null;
    const toMain = toNode ? plannerMainOutput(toNode.recipeId) : null;

    document.getElementById('planner-edge-modal-title').innerHTML =
        `<img src="img/item${itemDef.id ?? 0}.png" width="18" height="18" style="vertical-align:middle;"> ${t(edge.item, 'items')}`;

    document.getElementById('planner-edge-modal-body').innerHTML = `
        <div style="padding:12px; display:flex; flex-direction:column; gap:8px; font-size:0.9em;">
            <div><strong>${t('From', 'ui')}:</strong> ${fromRecipe ? t(fromRecipe.machine, 'machines') : '?'} (${fromMain ?? '?'})</div>
            <div><strong>${t('To', 'ui')}:</strong> ${toRecipe ? t(toRecipe.machine, 'machines') : '?'} (${toMain ?? '?'})</div>
            <div><strong>${t('Current Flow', 'ui')}:</strong> ${formatVal(flow)}/min</div>
            <button class="reset-btn" style="margin-top:8px;" onclick="deletePlannerEdge('${edgeId}')">${t('Delete Connection', 'ui')}</button>
        </div>
    `;
    document.getElementById('planner-edge-modal').style.display = 'flex';
}

function deletePlannerEdge(edgeId) {
    delete plannerState.edges[edgeId];
    closeModal('planner-edge-modal');
    recomputeAndRefreshPlanner();
    savePlannerState();
}

/* ==========================================================================
   SECTION: 從「拉到空白處」新增節點的配方選單
   ========================================================================== */

let _plannerPickerContext = null;
let _plannerPickerCandidates = [];
let _plannerPickerFiltered = [];

function getRecipesConsuming(item) {
    return (DB.recipes || []).filter(r => r.inputs && r.inputs[item] !== undefined);
}

function openPlannerRecipePickerMenu(ctx) {
    _plannerPickerContext = ctx;
    const consuming = ctx.originDir === 'out'; // 從輸出端拉出 -> 找「消耗這個物品」的配方；從輸入端拉出 -> 找「生產這個物品」的配方
    const candidates = consuming ? getRecipesConsuming(ctx.item) : getRecipesFor(ctx.item);

    _plannerPickerCandidates = candidates.map(r => {
        const mainOut = Object.keys(r.outputs)[0];
        const mainOutName = t(mainOut, 'items');
        const machineName = t(r.machine, 'machines');
        return {
            recipe: r,
            mainOut,
            mainOutName,
            machineName,
            machineKey: r.machine,
            searchBlob: (mainOut + ' ' + r.machine + ' ' + mainOutName + ' ' + machineName).toLowerCase()
        };
    });

    closePlannerRecipePickerMenu();
    const panel = document.createElement('div');
    panel.id = 'planner-recipe-picker';
    panel.className = 'planner-recipe-picker';
    document.body.appendChild(panel);

    const headerText = `${t(consuming ? 'CONSUME' : 'PRODUCE', 'ui')} ${t(ctx.item, 'items')}`;

    panel.innerHTML = `
        <div class="planner-picker-header">${headerText}</div>
        <input type="text" class="planner-picker-search" placeholder="${t('Search...', 'ui')}"
               oninput="filterPlannerRecipePicker(this.value)">
        <div class="planner-picker-list" id="planner-picker-list"></div>
    `;

    positionPlannerFloatingPanel(panel, ctx.clientX, ctx.clientY);
    renderPlannerRecipePickerList('');
    panel.querySelector('.planner-picker-search').focus();

    setTimeout(() => document.addEventListener('mousedown', _onPlannerPickerOutsideClick), 0);
}

function positionPlannerFloatingPanel(panel, clientX, clientY) {
    const w = 320, h = 420;
    let left = clientX, top = clientY;
    if (left + w > window.innerWidth) left = window.innerWidth - w - 10;
    if (top + h > window.innerHeight) top = window.innerHeight - h - 10;
    panel.style.left = Math.max(10, left) + 'px';
    panel.style.top = Math.max(10, top) + 'px';
}

function _onPlannerPickerOutsideClick(e) {
    const panel = document.getElementById('planner-recipe-picker');
    if (panel && !panel.contains(e.target)) closePlannerRecipePickerMenu();
}

function closePlannerRecipePickerMenu() {
    const panel = document.getElementById('planner-recipe-picker');
    if (panel) panel.remove();
    document.removeEventListener('mousedown', _onPlannerPickerOutsideClick);
}

function filterPlannerRecipePicker(text) {
    renderPlannerRecipePickerList((text || '').toLowerCase());
}

function renderPlannerRecipePickerList(filterText) {
    const list = document.getElementById('planner-picker-list');
    if (!list) return;
    _plannerPickerFiltered = _plannerPickerCandidates.filter(c => !filterText || c.searchBlob.includes(filterText));

    if (_plannerPickerFiltered.length === 0) {
        list.innerHTML = `<div class="planner-picker-empty">${t('No matching recipes', 'ui')}</div>`;
        return;
    }

    list.innerHTML = _plannerPickerFiltered.map((c, idx) => {
        const inputIcons = Object.keys(c.recipe.inputs || {}).map(name => {
            const d = DB.items[name] || {};
            return `<img src="img/item${d.id ?? 0}.png" width="18" height="18" title="${name}">`;
        }).join('');
        const outDef = DB.items[c.mainOut] || {};
        const machineIconSrc = `img/machines/${c.machineKey.toLowerCase().replaceAll(' ', '-')}.png`;
        return `
            <div class="planner-picker-row" onclick="choosePlannerRecipeFromPicker(${idx})">
                <div class="planner-picker-flow">
                    ${inputIcons}<span class="planner-picker-arrow">→</span><img src="img/item${outDef.id ?? 0}.png" width="20" height="20">
                </div>
                <span class="planner-picker-name">${c.mainOutName}</span>
                <span class="planner-picker-machine">
                    <img src="${machineIconSrc}" width="18" height="18" onerror="this.style.opacity='0'">${c.machineName}
                </span>
            </div>`;
    }).join('');
}

function choosePlannerRecipeFromPicker(idx) {
    const candidate = _plannerPickerFiltered[idx];
    if (!candidate || !_plannerPickerContext) return;
    createPlannerNodeFromPicker(candidate, _plannerPickerContext);
    closePlannerRecipePickerMenu();
}

/**
 * 使用者從下拉選單選定配方後，建立一個新節點並自動連上原本拖曳的那條線。
 * 機器數會被反推，讓新節點在這個物品上的 input/output 量剛好等於拉出時的可用流量。
 */
function createPlannerNodeFromPicker(candidate, ctx) {
    const recipe = candidate.recipe;
    const consuming = ctx.originDir === 'out';
    const targetRate = plannerGetAvailableRateAtPort(ctx.sourceNodeId, ctx.item, ctx.originDir);

    const speedMult = getSpeedMult(DB.settings.lvlSpeed || 0);
    const alchemyMult = getAlchemyMult(DB.settings.lvlAlchemy || 0);
    const recipeTime = plannerGetRecipeTime(recipe);
    const batchRatePerMachine = (60 / (recipeTime || 1)) * speedMult;

    let machineCount;
    if (consuming) {
        const qty = recipe.inputs[ctx.item] || 0;
        machineCount = (qty > 0 && targetRate > 0) ? targetRate / (qty * batchRatePerMachine) : 1;
    } else {
        let qty = recipe.outputs[ctx.item] || 0;
        qty = applyAlchemyMult(recipe.machine, qty, alchemyMult);
        machineCount = (qty > 0 && targetRate > 0) ? targetRate / (qty * batchRatePerMachine) : 1;
    }
    machineCount = Math.max(0.000001, Math.round(machineCount * 1000000) / 1000000);

    // 移除：不再需要寫入全域 preferredRecipes，節點自己記著 recipeId 即可
    // DB.settings.preferredRecipes[itemTarget] = recipe.id;
    // persist();

    plannerState._nodeSeq = (plannerState._nodeSeq || 0) + 1;
    const nodeId = 'pnode_' + plannerState._nodeSeq;
    plannerState.nodes[nodeId] = {
        id: nodeId, recipeId: recipe.id, machineCount,
        x: Math.round(ctx.graphX - 115), y: Math.round(ctx.graphY - 40)
    };

    plannerState._edgeSeq = (plannerState._edgeSeq || 0) + 1;
    const edgeId = 'pedge_' + plannerState._edgeSeq;
    const fromNode = consuming ? ctx.sourceNodeId : nodeId;
    const toNode = consuming ? nodeId : ctx.sourceNodeId;
    plannerState.edges[edgeId] = { id: edgeId, item: ctx.item, fromNode, toNode, createdAt: plannerState._edgeSeq };

    renderPlanner();
    savePlannerState();
}