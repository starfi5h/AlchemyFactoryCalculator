/* ==========================================================================
   SECTION: PLANNER TAB
   Model and Canvas
   ========================================================================== */

const PLANNER_LIBRARY_KEY = "alchemy_planner_library_v1";
const PLANNER_SETTINGS_KEY = "alchemy_planner_settings_v1";

/**
 * plannerLibrary: 存放所有「方案(Plan)」的容器，會整包寫入 localStorage。
 * {
 *   activePlanId: string,
 *   planOrder: string[],           // plan id 顯示順序 (下拉選單 / 管理清單皆依此排序)
 *   plans: { [planId]: { id, name, updatedAt, data } }
 * }
 * 其中每個 plan.data 的結構，就是原本單一 plannerState 的內容：
 * { nodes, edges, viewport, _edgeSeq, _nodeSeq, gridSize }
 */
let plannerLibrary = {
    activePlanId: null,
    planOrder: [],
    plans: {}
};

// plannerState 永遠指向「目前作用中 plan」的 data 物件參照；
let plannerState = null;

/* ==========================================================================
   SECTION: DATA STRUCTURE REFERENCE (for future maintainers)
   ==========================================================================

   plannerState (== plannerLibrary.plans[activePlanId].data):
   {
       nodes: {
           [nodeId]: {
               id: string,              // "pnode_<seq>"
               recipeId: string | null,      // 一般節點: 對應 DB.recipes[recipeId].id
               moduleId: string | null,      // 模塊節點: 指向 plannerLibrary.plans[moduleId]
               recipeModifiers: object, // 選用，例如高級煉金爐催化劑設定 (從 DB.settings.recipeModifiers 複製快照)
               machineCount: number,    // 該節點的機器台數，可為小數
               x: number,               // 節點左上角在「圖座標系」(graph space) 中的位置
               y: number
           }
       },
       edges: {
           [edgeId]: {
               id: string,       // "pedge_<seq>"
               item: string,     // 這條連線傳輸的物品名稱 (英文 key)
               fromNode: string, // 來源節點 id (該物品從這裡的 output port 流出)
               toNode: string,   // 目標節點 id (流入這裡的 input port)
               createdAt: number // = plannerState._edgeSeq 建立當下的值，用來決定流量分配的優先順序
           }
       },
       _edgeSeq: number,  // 自增序號，用於產生 edgeId 與 createdAt 排序
       _nodeSeq: number,  // 自增序號，用於產生 nodeId
       
   }

   節點的「port」(輸入/輸出接點) 不是存在 node 物件裡的欄位，而是每次由
   computeNodePorts(node) 依 node.recipeId + node.machineCount 即時算出：
   { recipe, inputs: [{item, rate}], outputs: [{item, rate}], heatItemsPerMin, fertItemsPerMin }

   node 沒有 width/height 欄位；卡片實際尺寸由 CSS 決定 (.planner-node 寬度固定
   200px，高度依 port 數量、是否有 heat/fert row 等內容而變動)，需要時得從
   document.getElementById('planner-node-' + id) 讀取 offsetWidth/offsetHeight。
   
   ========================================================================== */


/*
    Planner Settings (runtime state)
    viewport: { x: number, y: number, zoom: number }, // canvas 平移/縮放狀態
    gridSize: number   // 0 = 不吸附；否則為 snap 網格像素大小 (見 PLANNER_GRID_STEPS)    
*/

let _plannerSettings = {
    viewport: { x: 0, y: 0, zoom: 1 },
    gridSize: 40,
    summaryCollapsed: false,
    summarySectionCollapsed: {
        cost: false,
        output: false,
        input: false,
        machines: true
    }
};
let _plannerLastFlows = null; // 上一次 resolveFlows() 的結果快取 (供拖曳節點時即時重繪邊線用)
let _plannerCanvasHovered = false;
let _plannerLinkMode = false;
let _plannerSelectMode = false;
let _plannerSelectedNodeIds = new Set();
const PLANNER_ZOOM_MIN = 0.2;
const PLANNER_ZOOM_MAX = 3;
const PLANNER_GRID_STEPS = [40, 20, 0];

/** 每個 plan 各自的 viewport 暫存 (僅存在於本次 session 記憶體中，不寫入 localStorage)。
 *  key: planId -> { x, y, zoom }。用來在切換 plan 時記得「上次離開這個 plan 時的視角」。 */
let _plannerViewportCache = {};

/**
 * plannerHistory: 每個 plan 各自獨立的 undo/redo 堆疊，只存在記憶體中 (不寫入 localStorage)。
 * { [planId]: { stack: [ deep-cloned plan.data, ... ], index: number } }
 * index 指向 stack 中「目前所在」的快照；stack[0] 永遠是該 plan 在本次 session 被載入當下的初始狀態。
 */
let plannerHistory = {};
const PLANNER_HISTORY_LIMIT = 10;

/* ---------------- INIT / PERSISTENCE ---------------- */

function initPlannerPage() {
    _injectPlannerSummaryStyles();
    loadPlannerLibrary();
    loadPlannerSettings();
    renderPlannerToolbarSelect();
    _plannerViewportCache[plannerLibrary.activePlanId] = { ..._plannerSettings.viewport };

    renderPlanner();
    attachPlannerCanvasPan();
    attachPlannerPortDragHandlers();
    attachPlannerBoxSelect();
    attachPlannerWheelZoom();
    attachPlannerPinchZoom();
    attachPlannerKeyboardShortcuts();
    updatePlannerGridButton();
    updatePlannerGridBackground();
    updatePlannerUndoRedoButtons();
}

// 讀取UI全局設定
function loadPlannerSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(PLANNER_SETTINGS_KEY) || '{}');

        _plannerSettings.viewport = {
            x: saved.viewport?.x ?? 0,
            y: saved.viewport?.y ?? 0,
            zoom: saved.viewport?.zoom ?? 1
        };

        _plannerSettings.gridSize = saved.gridSize ?? 0;

        // 读取摘要折叠状态
        _plannerSettings.summaryCollapsed = saved.summaryCollapsed ?? false;
        _plannerSettings.summarySectionCollapsed = {
            cost: saved.summarySectionCollapsed?.cost ?? false,
            output: saved.summarySectionCollapsed?.output ?? false,
            input: saved.summarySectionCollapsed?.input ?? false,
            machines: saved.summarySectionCollapsed?.machines ?? true
        };
    } catch {
        _plannerSettings = {
            viewport: { x: 0, y: 0, zoom: 1 },
            gridSize: 0,
            summaryCollapsed: false,
            summarySectionCollapsed: {
                cost: false,
                output: false,
                input: false,
                machines: true
            }
        };
    }    
}

// 寫入UI全局設定
function savePlannerSettings() {
    localStorage.setItem(
        PLANNER_SETTINGS_KEY,
        JSON.stringify(_plannerSettings)
    );
}

/** 建立一個全新、空白的 plan 資料本體 (即原本 plannerState 的初始值) */
function _createEmptyPlanData() {
    return { nodes: {}, edges: {}, viewport: { x: 0, y: 0, zoom: 1 }, _edgeSeq: 0, _nodeSeq: 0, gridSize: 0 };
}

/** 建立一筆新的 plan 條目 (含 meta: id/name/updatedAt) */
function _createPlan(name) {
    const id = 'plan_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    return { id, name: name || t('New Plan', 'ui'), updatedAt: Date.now(), data: _createEmptyPlanData() };
}

/** 讀取整個 plan library；若無資料或損毀，建立一個預設空白方案 */
function loadPlannerLibrary() {
    const saved = localStorage.getItem(PLANNER_LIBRARY_KEY);
    if (saved) {
        try {
            plannerLibrary = JSON.parse(saved);
        } catch (e) {
            console.error("Planner library corrupt, resetting.", e);
            plannerLibrary = null;
        }
    }

    if (!plannerLibrary || !plannerLibrary.plans || Object.keys(plannerLibrary.plans).length === 0) {
        const plan = _createPlan(t('Default Plan', 'ui'));
        plannerLibrary = { activePlanId: plan.id, planOrder: [plan.id], plans: { [plan.id]: plan } };
    }
    if (!plannerLibrary.planOrder || plannerLibrary.planOrder.length === 0) {
        plannerLibrary.planOrder = Object.keys(plannerLibrary.plans);
    }
    if (!plannerLibrary.activePlanId || !plannerLibrary.plans[plannerLibrary.activePlanId]) {
        plannerLibrary.activePlanId = plannerLibrary.planOrder[0];
    }

    // 遷移每個 plan 中，邊(edge)所記錄的物品名稱(中/英轉換)
    Object.values(plannerLibrary.plans).forEach(plan => {
        Object.values(plan.data.edges || {}).forEach(edge => {
            const itemName = edge.item;
            if (!DB.items[itemName]) {
                const alterName = queryDualItemName(itemName); // i18n
                if (DB.items[alterName]) {
                    edge.item = alterName;
                }
            }
        });
    });

    _activatePlanData(plannerLibrary.activePlanId);
}

/** 將 plannerState 指向指定 plan 的資料本體，並補齊缺漏欄位 */
function _activatePlanData(planId) {
    const plan = plannerLibrary.plans[planId];
    if (!plan) return;
    plannerState = plan.data;
    _plannerLastFlows = null;
    _plannerSelectedNodeIds.clear();
    _ensurePlannerHistory(planId);
}

/** 只保存 library 結構本身 (方案清單/順序/目前選中哪個)，不視為對內容的編輯 */
function savePlannerLibraryMeta() {
    localStorage.setItem(PLANNER_LIBRARY_KEY, JSON.stringify(plannerLibrary));
}

/** 保存目前作用中 plan 的內容變更；同時更新其 updatedAt 時間戳記，並推進 undo 歷史堆疊 */
function savePlannerState() {
    const plan = plannerLibrary.plans[plannerLibrary.activePlanId];
    if (plan) plan.updatedAt = Date.now();
    _pushPlannerHistory(plannerLibrary.activePlanId);
    savePlannerLibraryMeta();
    updatePlannerUndoRedoButtons();
}

/* ==========================================================================
   SECTION: UNDO / REDO (per-plan, in-memory only)
   ========================================================================== */

/** 若指定 plan 尚無歷史堆疊，以目前狀態建立一筆初始快照 (index 0) */
function _ensurePlannerHistory(planId) {
    if (plannerHistory[planId]) return;
    plannerHistory[planId] = {
        stack: [JSON.parse(JSON.stringify(plannerLibrary.plans[planId].data))],
        index: 0
    };
}

/** 將目前 plannerState 的深拷貝推進歷史堆疊；若曾經 undo 過，先捨棄後面的 redo 分支 */
function _pushPlannerHistory(planId) {
    _ensurePlannerHistory(planId);
    const hist = plannerHistory[planId];
    hist.stack = hist.stack.slice(0, hist.index + 1);
    hist.stack.push(JSON.parse(JSON.stringify(plannerState)));
    if (hist.stack.length > PLANNER_HISTORY_LIMIT) {
        hist.stack.shift(); // 超過上限 (10 筆)，捨棄最舊的一筆
    }
    hist.index = hist.stack.length - 1;
}

/** 依目前歷史堆疊位置，更新 toolbar 上 Undo/Redo 按鈕的 disabled 狀態 */
function updatePlannerUndoRedoButtons() {
    const hist = plannerHistory[plannerLibrary.activePlanId];
    const undoBtn = document.getElementById('planner-undo-btn');
    const redoBtn = document.getElementById('planner-redo-btn');
    if (undoBtn) undoBtn.disabled = !hist || hist.index <= 0;
    if (redoBtn) redoBtn.disabled = !hist || hist.index >= hist.stack.length - 1;
}

/** 將歷史堆疊中指定位置的快照還原為目前的 plan 資料，並重繪畫布 (不會再推進歷史) */
function _restorePlannerHistorySnapshot(planId, hist) {
    const snapshot = hist.stack[hist.index];
    const restored = JSON.parse(JSON.stringify(snapshot));
    plannerLibrary.plans[planId].data = restored;
    plannerLibrary.plans[planId].updatedAt = Date.now();
    plannerState = restored;
    _plannerLastFlows = null;

    // Selection is transient UI state and isn't part of history; just prune ids
    // that no longer exist in the restored snapshot so they don't linger forever.
    [..._plannerSelectedNodeIds].forEach(id => {
        if (!plannerState.nodes[id]) _plannerSelectedNodeIds.delete(id);
    });

    renderPlanner();
    updatePlannerGridButton();
    updatePlannerGridBackground();
    applyPlannerViewportTransform();
    updatePlannerUndoRedoButtons();
    savePlannerLibraryMeta(); // 還原操作本身不算新的編輯，不推進歷史堆疊
}

function plannerUndo() {
    const planId = plannerLibrary.activePlanId;
    const hist = plannerHistory[planId];
    if (!hist || hist.index <= 0) return;
    hist.index--;
    _restorePlannerHistorySnapshot(planId, hist);
    hidePlannerRateTooltip();
}

function plannerRedo() {
    const planId = plannerLibrary.activePlanId;
    const hist = plannerHistory[planId];
    if (!hist || hist.index >= hist.stack.length - 1) return;
    hist.index++;
    _restorePlannerHistorySnapshot(planId, hist);
    hidePlannerRateTooltip();
}

/* ---------------- COORDINATE HELPERS ---------------- */

function plannerScreenToGraph(clientX, clientY) {
    const canvas = document.getElementById('planner-canvas');
    const rect = canvas.getBoundingClientRect();
    const zoom = _plannerSettings.viewport.zoom || 1;
    return {
        x: (clientX - rect.left - _plannerSettings.viewport.x) / zoom,
        y: (clientY - rect.top - _plannerSettings.viewport.y) / zoom
    };
}

function applyPlannerViewportTransform() {
    const vp = document.getElementById('planner-viewport');
    const zoom = _plannerSettings.viewport.zoom || 1;
    if (vp) vp.style.transform = `translate(${_plannerSettings.viewport.x}px, ${_plannerSettings.viewport.y}px) scale(${zoom})`;
    updatePlannerGridBackground();
}

/* ==========================================================================
   SECTION: SELECT MODE
   ========================================================================== */

function togglePlannerSelectMode() {
    _plannerSelectMode = !_plannerSelectMode;
    updatePlannerSelectModeButton();
}

function updatePlannerSelectModeButton() {
    const btn = document.getElementById('planner-select-btn');
    if (btn) btn.classList.toggle('active', _plannerSelectMode);
    const canvas = document.getElementById('planner-canvas');
    if (canvas) canvas.classList.toggle('select-mode', _plannerSelectMode);
}

function clearPlannerSelection() {
    if (_plannerSelectedNodeIds.size === 0) return;
    _plannerSelectedNodeIds.clear();
    document.querySelectorAll('.planner-node.selected').forEach(el => el.classList.remove('selected'));
}

function attachPlannerBoxSelect() {
    const canvas = document.getElementById('planner-canvas');
    if (!canvas || canvas.dataset.boxSelectBound) return;
    canvas.dataset.boxSelectBound = "1";

    canvas.addEventListener('pointerdown', (e) => {
        if (!_plannerSelectMode) return;
        if (e.target.closest('.planner-node')) return;
        if (e.target.closest('.planner-view-controls')) return;
        if (e.target.closest('.planner-summary-panel')) return;
        if (e.button !== 0) return;

        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        const rect = canvas.getBoundingClientRect();
        const startX = e.clientX, startY = e.clientY;

        const box = document.createElement('div');
        box.className = 'planner-select-box';
        canvas.appendChild(box);

        const updateBox = (x2, y2) => {
            const left = Math.min(startX, x2), top = Math.min(startY, y2);
            const w = Math.abs(x2 - startX), h = Math.abs(y2 - startY);
            box.style.left = (left - rect.left) + 'px';
            box.style.top = (top - rect.top) + 'px';
            box.style.width = w + 'px';
            box.style.height = h + 'px';
            return { left, top, right: left + w, bottom: top + h };
        };
        let lastBounds = updateBox(startX, startY);

        const onMove = (ev) => { lastBounds = updateBox(ev.clientX, ev.clientY); };
        const onUp = () => {
            canvas.removeEventListener('pointermove', onMove);
            canvas.removeEventListener('pointerup', onUp);
            box.remove();
            applyPlannerBoxSelection(lastBounds);
        };
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);
        hidePlannerRateTooltip();
    });
}

function applyPlannerBoxSelection(bounds) {
    _plannerSelectedNodeIds.clear();
    document.querySelectorAll('.planner-node').forEach(el => {
        const r = el.getBoundingClientRect();
        const hit = r.left < bounds.right && r.right > bounds.left &&
                    r.top < bounds.bottom && r.bottom > bounds.top;
        el.classList.toggle('selected', hit);
        if (hit) _plannerSelectedNodeIds.add(el.id.replace('planner-node-', ''));
    });
}

function deletePlannerSelectedNodes() {
    const ids = [..._plannerSelectedNodeIds];
    if (ids.length === 0) return;
    ids.forEach(id => {
        delete plannerState.nodes[id];
        Object.keys(plannerState.edges).forEach(eid => {
            const e = plannerState.edges[eid];
            if (e.fromNode === id || e.toNode === id) delete plannerState.edges[eid];
        });
    });
    _plannerSelectedNodeIds.clear();
    renderPlanner();
    savePlannerState();
    hidePlannerRateTooltip();
}

/* ==========================================================================
   SECTION: VIEW CONTROLS - ZOOM / GRID SNAP / FIT TO VIEW
   ========================================================================== */

function attachPlannerCanvasPan() {
    const canvas = document.getElementById('planner-canvas');
    if (!canvas || canvas.dataset.panBound) return;
    canvas.dataset.panBound = "1";

    canvas.addEventListener('pointerdown', (e) => {
         if (_plannerSelectMode) return; // 交給 box-select 處理
        if (e.target.closest('.planner-node')) return;
        if (e.target.closest('.planner-edge-group')) return;
        if (e.target.closest('.planner-view-controls')) return;
        if (e.target.closest('.planner-summary-panel')) return;
        if (e.button !== 0) return;
        canvas.setPointerCapture(e.pointerId);
        canvas.classList.add('panning');
        const startX = e.clientX, startY = e.clientY;
        const originX = _plannerSettings.viewport.x, originY = _plannerSettings.viewport.y;
        let moved = 0;

        const onMove = (ev) => {
            moved = Math.max(moved, Math.hypot(ev.clientX - startX, ev.clientY - startY));
            _plannerSettings.viewport.x = originX + (ev.clientX - startX);
            _plannerSettings.viewport.y = originY + (ev.clientY - startY);
            applyPlannerViewportTransform();
            if (_plannerLastFlows) renderPlannerEdges(_plannerLastFlows);
        };
        const onUp = () => {
            canvas.removeEventListener('pointermove', onMove);
            canvas.removeEventListener('pointerup', onUp);
            canvas.classList.remove('panning');
            savePlannerSettings();
            if (moved < 3) clearPlannerSelection();   // 新增：純點擊 → 清空選取
        };
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);        
        hidePlannerRateTooltip();
    });
}

function plannerSetZoom(newZoom, anchorClientX, anchorClientY) {
    const canvas = document.getElementById('planner-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ax = anchorClientX ?? (rect.left + rect.width / 2);
    const ay = anchorClientY ?? (rect.top + rect.height / 2);
    const oldZoom = _plannerSettings.viewport.zoom || 1;

    newZoom = Math.min(PLANNER_ZOOM_MAX, Math.max(PLANNER_ZOOM_MIN, newZoom));
    if (Math.abs(newZoom - oldZoom) < 0.0001) return;

    const graphX = (ax - rect.left - _plannerSettings.viewport.x) / oldZoom;
    const graphY = (ay - rect.top - _plannerSettings.viewport.y) / oldZoom;

    _plannerSettings.viewport.zoom = newZoom;
    _plannerSettings.viewport.x = (ax - rect.left) - graphX * newZoom;
    _plannerSettings.viewport.y = (ay - rect.top) - graphY * newZoom;

    applyPlannerViewportTransform();
    if (_plannerLastFlows) renderPlannerEdges(_plannerLastFlows);
    savePlannerSettings();
}

function plannerZoomIn()  { plannerSetZoom((_plannerSettings.viewport.zoom || 1) * 1.2); }
function plannerZoomOut() { plannerSetZoom((_plannerSettings.viewport.zoom || 1) / 1.2); }

function attachPlannerWheelZoom() {
    const canvas = document.getElementById('planner-canvas');
    if (!canvas || canvas.dataset.wheelBound) return;
    canvas.dataset.wheelBound = "1";
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        plannerSetZoom((_plannerSettings.viewport.zoom || 1) * factor, e.clientX, e.clientY);
    }, { passive: false });
}

function attachPlannerPinchZoom() {
    const canvas = document.getElementById('planner-canvas');
    if (!canvas || canvas.dataset.pinchBound) return;
    canvas.dataset.pinchBound = "1";

    let pinchStartDist = 0;
    let pinchStartZoom = 1;
    let pinchMidpoint = null;

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const [t1, t2] = e.touches;
            pinchStartDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            pinchStartZoom = _plannerSettings.viewport.zoom || 1;
            pinchMidpoint = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
        }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2 && pinchStartDist > 0) {
            e.preventDefault();
            const [t1, t2] = e.touches;
            const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
            const scale = dist / pinchStartDist;
            plannerSetZoom(pinchStartZoom * scale, pinchMidpoint.x, pinchMidpoint.y);
        }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) pinchStartDist = 0;
    });
}

function attachPlannerKeyboardShortcuts() {
    const canvas = document.getElementById('planner-canvas');
    if (!canvas || canvas.dataset.keyBound) return;
    canvas.dataset.keyBound = "1";

    canvas.addEventListener('mouseenter', () => _plannerCanvasHovered = true);
    canvas.addEventListener('mouseleave', () => _plannerCanvasHovered = false);

    document.addEventListener('keydown', (e) => {
        if (!_plannerCanvasHovered) return;
        const tag = (e.target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;

        if (e.key === '+' || e.key === '=') { e.preventDefault(); plannerZoomIn(); }
        else if (e.key === '-' || e.key === '_') { e.preventDefault(); plannerZoomOut(); }
        else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); plannerFitToView(); }
        else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); plannerUndo(); }
        else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); plannerRedo(); }        
        else if ((e.key === 'Delete' || e.key === 'Backspace') && _plannerSelectedNodeIds.size > 0) {
            e.preventDefault();
            deletePlannerSelectedNodes();
        }
    });
}

function plannerSnapVal(v) {
    const g = _plannerSettings.gridSize || 0;
    if (!g) return v;
    return Math.round(v / g) * g;
}

function plannerCycleGridSnap() {
    const idx = PLANNER_GRID_STEPS.indexOf(_plannerSettings.gridSize || 0);
    _plannerSettings.gridSize = PLANNER_GRID_STEPS[(idx + 1) % PLANNER_GRID_STEPS.length];
    updatePlannerGridButton();
    updatePlannerGridBackground();
    savePlannerSettings();
}

function updatePlannerGridButton() {
    const btn = document.getElementById('planner-grid-btn');
    if (!btn) return;
    const g = _plannerSettings.gridSize || 0;
    btn.textContent = g ? `⊞${g}` : '⊞';
    btn.title = g ? `Grid Snap: ${g}px` : 'Grid Snap: Off';
    btn.classList.toggle('active', !!g);
}

function updatePlannerGridBackground() {
    const canvas = document.getElementById('planner-canvas');
    if (!canvas) return;
    const g = _plannerSettings.gridSize || 0;
    const zoom = _plannerSettings.viewport.zoom || 1;

    if (!g) {
        canvas.style.backgroundImage = 'radial-gradient(#2a2a2a 1px, transparent 1px)';
        canvas.style.backgroundSize = '24px 24px';
    } else {
        const size = g * zoom;
        canvas.style.backgroundImage =
            'linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), ' +
            'linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)';
        canvas.style.backgroundSize = `${size}px ${size}px`;
    }
    canvas.style.backgroundPosition = `${_plannerSettings.viewport.x}px ${_plannerSettings.viewport.y}px`;
}

function plannerFitToView(nodeIds = []) {
    let nodes = Object.values(plannerState.nodes);
    if(nodeIds.length > 0) {
        const nodeIdSet = new Set(nodeIds);
        nodes = nodes.filter(node => nodeIdSet.has(node.id));
    }
    const canvas = document.getElementById('planner-canvas');
    if (!canvas) return;

    if (nodes.length === 0) {
        _plannerSettings.viewport = { x: 0, y: 0, zoom: 1 };
        applyPlannerViewportTransform();
        savePlannerSettings();
        return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(node => {
        const el = document.getElementById('planner-node-' + node.id);
        const w = el ? el.offsetWidth : 220;
        const h = el ? el.offsetHeight : 120;
        minX = Math.min(minX, node.x);
        minY = Math.min(minY, node.y);
        maxX = Math.max(maxX, node.x + w);
        maxY = Math.max(maxY, node.y + h);
    });

    const PAD = 60;
    minX -= PAD; minY -= PAD; maxX += PAD; maxY += PAD;
    const graphW = Math.max(1, maxX - minX);
    const graphH = Math.max(1, maxY - minY);

    const rect = canvas.getBoundingClientRect();
    let zoom = Math.min(rect.width / graphW, rect.height / graphH);
    zoom = Math.min(PLANNER_ZOOM_MAX, Math.max(PLANNER_ZOOM_MIN, zoom));

    _plannerSettings.viewport.zoom = zoom;
    _plannerSettings.viewport.x = (rect.width - graphW * zoom) / 2 - minX * zoom;
    _plannerSettings.viewport.y = (rect.height - graphH * zoom) / 2 - minY * zoom;

    applyPlannerViewportTransform();
    if (_plannerLastFlows) renderPlannerEdges(_plannerLastFlows);
    savePlannerSettings();
}

/* ---------------- ADD / REMOVE NODES ---------------- */

function onPlannerAddNodeClick() {
    const canvas = document.getElementById('planner-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const zoom = _plannerSettings.viewport.zoom || 1;
    const graphX = plannerSnapVal((rect.width / 2 - _plannerSettings.viewport.x) / zoom - 110);
    const graphY = plannerSnapVal((rect.height / 2 - _plannerSettings.viewport.y) / zoom - 60);
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
    hidePlannerRateTooltip();
}

/* ---------------- FULL RENDER ---------------- */

function renderPlanner() {
    const layer = document.getElementById('planner-nodes-layer');
    if (!layer) return;
    const flows = plannerResolveFlows();
    layer.innerHTML = '';
    Object.values(plannerState.nodes).forEach(node => {
        const el = createPlannerNodeEl(node, flows);
        if (_plannerSelectedNodeIds.has(node.id)) el.classList.add('selected');
        layer.appendChild(el);
    });
    applyPlannerViewportTransform();
    renderPlannerEdges(flows);
    updateAllPlannerLinkButtons();
    renderPlannerSummary(flows);
}

/** 輕量刷新：重算流量後只 patch 既有節點卡片內容與邊線，不重建節點 DOM (保留拖曳/輸入焦點狀態) */
function recomputeAndRefreshPlanner() {
    const flows = plannerResolveFlows();
    Object.values(plannerState.nodes).forEach(node => patchPlannerNodeDisplay(node, flows));
    renderPlannerEdges(flows);
    renderPlannerSummary(flows);
    return flows;
}

function createPlannerNodeEl(node, flows) {
    const wrap = document.createElement('div');
    wrap.className = 'planner-node';
    wrap.id = 'planner-node-' + node.id;
    wrap.style.left = node.x + 'px';
    wrap.style.top = node.y + 'px';

    const ports = flows.nodePortsCache[node.id] || computeNodePorts(node);
    wrap.innerHTML = ``;

    if (node.recipeId) {        
        const heatTag = ports.heatItemsPerMin > 0 ? 'heat' : '';
        const machineKey = ports.recipe ? ports.recipe.machine : '';
        const mainOut = ports.recipe ? Object.keys(ports.recipe.outputs)[0] : plannerMainOutput(node.recipeId) || '';
        const machineName = ports.recipe ? t(ports.recipe.machine, 'machines').replace('Advanced', 'Adv.') : t('Missing Recipe', 'ui');
        const machineIconHtml = machineKey
        ? `<img src="img/machines/${machineKey.toLowerCase().replaceAll(' ', '-')}.png" class="planner-node-icon" onerror="this.style.opacity='0'">`
        : `<span class="planner-node-icon"></span>`;
        wrap.innerHTML += `
            <div class="planner-node-header ${heatTag}" 
                onmouseenter="onPlannerHeaderHover(this, '${node.id}')"
                onmouseleave="hidePlannerRateTooltip()">
                ${machineIconHtml}
                <span class="planner-node-title">${machineName}</span>            
                <button class="planner-gear-btn" title="${t('Node Settings', 'ui')}" onclick="event.stopPropagation(); openPlannerNodeModal('${node.id}')">⚙</button>
                <button class="planner-close-btn" title="${t('Remove Node', 'ui')}" onclick="removePlannerNode('${node.id}')">✕</button>
            </div>`;
    }
    else {
        const plan = plannerLibrary.plans[node.moduleId];
        const titleName = plan ? plan.name : t('Invaild Module', 'ui');
        wrap.innerHTML += `
        <div class="planner-node-header module" 
            onmouseenter="onPlannerHeaderHover(this, '${node.id}')"
            onmouseleave="hidePlannerRateTooltip()">
            <span class="planner-node-title">${titleName}</span>            
            <button class="planner-gear-btn" title="${t('Node Settings', 'ui')}" onclick="event.stopPropagation(); openPlannerNodeModal('${node.id}')">⚙</button>
            <button class="planner-close-btn" title="${t('Remove Node', 'ui')}" onclick="removePlannerNode('${node.id}')">✕</button>
        </div>`;
    }

    const errorMessage = ports.errorCode ? `<div>${t('Error')}: ${t(ports.errorCode)}</div>` : ``;
    wrap.innerHTML += `
        <div class="planner-node-body" id="planner-node-body-${node.id}">
            ${errorMessage}
            ${renderPlannerPortsHtml(node, ports, flows)}
            <div class="planner-machine-count-row">
                <button class="planner-gear-btn" title="${t('Auto-generate upstream', 'ui')}" onclick="autoGenerateUpstreamNodes('${node.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L6 12h5l-1 8 7-12h-5l1-6z"/>
                    </svg>                
                </button>
                <input type="number" min="0" step="1" value="${Number(node.machineCount.toFixed(6))}"
                    title="${t('Machine Count', 'ui')}"
                    data-mc-for="${node.id}"
                    onfocus="onPlannerMachineCountFocus('${node.id}', this)"
                    onblur="onPlannerMachineCountBlur('${node.id}', this)"
                    oninput="updatePlannerMachineCount('${node.id}', this.value)">
                <button class="planner-link-btn ${_plannerLinkMode ? 'active' : ''}"
                        data-link-for="${node.id}"
                        onclick="togglePlannerLinkMode()"
                        title="${t('Link machine count changes', 'ui')}">                        
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 17H7A5 5 0 0 1 7 7h2"/>
                            <path d="M15 7h2a5 5 0 1 1 0 10h-2"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
                            </svg>                        
                        </button>
            </div>
            <div class="planner-heatfert-row" id="planner-heatfert-${node.id}">
                ${renderPlannerHeatFertHtml(ports)}
            </div>
        </div>
    `;

    attachPlannerNodeDrag(wrap, node);
    return wrap;
}

function onPlannerHeaderHover(headerEl, nodeId) {
    const node = plannerState.nodes[nodeId];
    if (!node) return;
    const rates = plannerGetNodeRates(node);
    if (!rates || rates.errorCode) return; // 無 recipe 或已失效(循環/找不到 plan) 不顯示
    showPlannerRateTooltip(headerEl, rates);
}

function renderPlannerPortsHtml(node, ports, flows) {
    const orderedInputs = applyPortOrder(ports.inputs, node.portOrder?.in);
    const orderedOutputs = applyPortOrder(ports.outputs, node.portOrder?.out);
    const inRows = orderedInputs.map(p => renderPlannerPortRow(node.id, p, 'in', flows)).join('');
    const outRows = orderedOutputs.map(p => renderPlannerPortRow(node.id, p, 'out', flows)).join('');
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

    let colorClass = 'planner-port-gray';
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
            if (port.rate > 0.001) {
                badgeHtml = `<span class="planner-port-badge planner-badge-surplus">+${formatVal(port.rate)}</span>`;
                colorClass = 'planner-port-yellow';
            }
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
    const rate = `<span class="planner-port-rate">${formatVal(port.rate)}</span>`;
    if (dir === 'in') return `<div class="planner-port planner-port-in ${rateClass}" title="${port.item}">${badgeHtml}${dot}${rate}${icon}${name}</div>`;
    return `<div class="planner-port planner-port-out ${rateClass}" title="${port.item}">${name}${icon}${rate}${dot}${badgeHtml}</div>`;
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

/* ==========================================================================
   SECTION: PORT ORDER OPTIMIZATION (single-node barycenter/median)
   ========================================================================== */

/**
 * 依 node.portOrder（若存在）重新排序一組 port 清單。
 * portOrder 內找不到的 item 一律視為 Infinity，排到最後，
 * 並維持它們彼此原始的相對順序（stable sort）。
 * @param {{item:string, rate:number}[]} portList
 * @param {string[]|undefined} orderArr
 */
function applyPortOrder(portList, orderArr) {
    if (!orderArr || orderArr.length === 0) return portList;
    const indexMap = new Map(orderArr.map((item, i) => [item, i]));
    return [...portList].sort((a, b) => {
        const ia = indexMap.has(a.item) ? indexMap.get(a.item) : Infinity;
        const ib = indexMap.has(b.item) ? indexMap.get(b.item) : Infinity;
        return ia - ib; // Array.sort 是 stable 的 (現代瀏覽器/V8 保證)，同分不動原順序
    });
}

/**
 * 取陣列中位數 (輸入不需先排序)
 */
function _plannerMedian(values) {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * 對單一 port（item + dir）計算排序用的分數：
 * 取該 port 所有連線對方節點的「卡片中心 y」的中位數。
 * 未連線的 port 回傳 null（呼叫端會把這類 port 排到最後）。
 * @param {string} nodeId
 * @param {string} item
 * @param {'in'|'out'} dir
 * @param {object} flows  plannerResolveFlows() 的回傳值
 */
function _plannerPortSortScore(nodeId, item, dir, flows) {
    const key = plannerPortKey(nodeId, item, dir);
    const edgeIds = flows.portConnections[key] || [];
    if (edgeIds.length === 0) return null;

    const yValues = [];
    edgeIds.forEach(edgeId => {
        const edge = plannerState.edges[edgeId];
        if (!edge) return;
        const otherNodeId = (dir === 'in') ? edge.fromNode : edge.toNode;
        const otherEl = document.getElementById('planner-node-' + otherNodeId);
        if (!otherEl) return;
        yValues.push(otherEl.offsetTop + otherEl.offsetHeight / 2);
    });
    if (yValues.length === 0) return null;
    return _plannerMedian(yValues);
}

/**
 * 依 _plannerPortSortScore 排序一組 port 清單，回傳排好的 item 名稱陣列。
 * 已連線的 port 依分數 (對方節點中心 y 的中位數) 由小到大排列；
 * 未連線的 port 一律排在最後，並維持原始相對順序。
 * @param {{item:string, rate:number}[]} portList
 * @param {string} nodeId
 * @param {'in'|'out'} dir
 * @param {object} flows
 * @returns {string[]}
 */
function _plannerComputePortOrder(portList, nodeId, dir, flows) {
    const scored = portList.map(p => ({
        item: p.item,
        score: _plannerPortSortScore(nodeId, p.item, dir, flows)
    }));
    const connected = scored.filter(s => s.score !== null).sort((a, b) => a.score - b.score);
    const unconnected = scored.filter(s => s.score === null);
    return [...connected, ...unconnected].map(s => s.item);
}

/**
 * 只調整單一節點的 port 順序 (input/output 各自重排)，
 * 依據目前連到它的邊，讓對方節點 y 座標盡量單調排列以減少視覺交叉。
 * 不影響其他節點的順序或位置。
 * @param {string} nodeId
 */
function plannerOptimizePortOrderForNode(nodeId) {
    const node = plannerState.nodes[nodeId];
    if (!node) return;

    const flows = _plannerLastFlows || plannerResolveFlows();
    const ports = flows.nodePortsCache[nodeId];
    if (!ports) return;

    node.portOrder = {
        in: _plannerComputePortOrder(ports.inputs, nodeId, 'in', flows),
        out: _plannerComputePortOrder(ports.outputs, nodeId, 'out', flows)
    };

    recomputeAndRefreshPlanner();
    savePlannerState();
}

/**
 * 對目前 plan 中所有節點各自獨立跑一次單節點 port 排序 (單輪，不疊代收斂)。
 * 共用同一份 flows 快照，避免每個節點各自重新 resolve。
 */
function plannerOptimizeAllPortOrders() {
    const flows = plannerResolveFlows();

    Object.values(plannerState.nodes).forEach(node => {
        const ports = flows.nodePortsCache[node.id];
        if (!ports) return;
        node.portOrder = {
            in: _plannerComputePortOrder(ports.inputs, node.id, 'in', flows),
            out: _plannerComputePortOrder(ports.outputs, node.id, 'out', flows)
        };
    });

    recomputeAndRefreshPlanner();
    savePlannerState();
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

function togglePlannerLinkMode() {
    _plannerLinkMode = !_plannerLinkMode;
    updateAllPlannerLinkButtons();
}

function updateAllPlannerLinkButtons() {
    document.querySelectorAll('.planner-link-btn').forEach(btn => {
        btn.classList.toggle('active', _plannerLinkMode);
    });
}

function onPlannerMachineCountFocus(nodeId, inputEl) {
    if (!_plannerLinkMode) return;
    const node = plannerState.nodes[nodeId];
    inputEl.dataset.oldVal = node ? node.machineCount : inputEl.value;
}

function onPlannerMachineCountBlur(nodeId, inputEl) {
    if (!_plannerLinkMode) { delete inputEl.dataset.oldVal; return; }
    const oldVal = parseFloat(inputEl.dataset.oldVal);
    const node = plannerState.nodes[nodeId];
    const newVal = node ? node.machineCount : parseFloat(inputEl.value);
    delete inputEl.dataset.oldVal;

    if (!oldVal || !newVal || oldVal === newVal) return; // 舊值0/新值0/未變化 -> 不傳播

    const ratio = newVal / oldVal;
    propagatePlannerMachineRatio(nodeId, ratio);
}

function propagatePlannerMachineRatio(sourceNodeId, ratio) {
    const connected = getPlannerConnectedNodeIds(sourceNodeId).filter(id => id !== sourceNodeId);
    if (connected.length === 0) return;

    connected.forEach(id => {
        const n = plannerState.nodes[id];
        if (n) n.machineCount = Math.max(0, n.machineCount * ratio);
    });

    recomputeAndRefreshPlanner();
    savePlannerState();
    flashPlannerLinkFeedback(sourceNodeId, connected);
}

/** 對符合 selector 的元素套用一次性 flash 動畫 (先移除再重新加上 class，觸發 reflow 重啟動畫) */
function flashPlannerElements(selector, flashClass, duration = 500) {
    document.querySelectorAll(selector).forEach(el => {
        el.classList.remove(flashClass);
        void el.offsetWidth;
        el.classList.add(flashClass);
        setTimeout(() => el.classList.remove(flashClass), duration);
    });
}

function flashPlannerLinkFeedback(sourceNodeId, affectedNodeIds) {
    flashPlannerElements(`[data-link-for="${sourceNodeId}"]`, 'link-flash');
    affectedNodeIds.forEach(id => flashPlannerElements(`[data-mc-for="${id}"]`, 'mc-flash'));
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
        hidePlannerRateTooltip();

        const isGroupDrag = _plannerSelectedNodeIds.has(node.id) && _plannerSelectedNodeIds.size > 1;
        const origins = isGroupDrag
            ? [..._plannerSelectedNodeIds]
                .map(id => plannerState.nodes[id])
                .filter(Boolean)
                .map(n => ({ id: n.id, x: n.x, y: n.y }))
            : [{ id: node.id, x: node.x, y: node.y }];

        const onMove = (ev) => {
            const zoom = _plannerSettings.viewport.zoom || 1;
            const dx = (ev.clientX - startX) / zoom;
            const dy = (ev.clientY - startY) / zoom;
            origins.forEach(o => {
                const n = plannerState.nodes[o.id];
                if (!n) return;
                n.x = plannerSnapVal(o.x + dx);
                n.y = plannerSnapVal(o.y + dy);
                const el = document.getElementById('planner-node-' + o.id);
                if (el) { el.style.left = n.x + 'px'; el.style.top = n.y + 'px'; }
            });
            if (_plannerLastFlows) renderPlannerEdges(_plannerLastFlows);
        };
        const onUp = () => {
            header.removeEventListener('pointermove', onMove);
            header.removeEventListener('pointerup', onUp);
            header.classList.remove('dragging');
            savePlannerState();
            plannerOptimizePortOrderForNode(node.id);
        };
        header.addEventListener('pointermove', onMove);
        header.addEventListener('pointerup', onUp);
    });
}

/* ==========================================================================
   SECTION: EDGES - 繪製、拉線建立、刪除
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
        const lineStyle = edge.color ? ` style="stroke:${edge.color};"` : '';
        const labelStyle = edge.color ? ` style="border-left:3px solid ${edge.color};"` : '';

        html += `
            <g class="planner-edge-group" data-edge-id="${edge.id}">
                <path class="planner-edge-hit" d="${d}" onclick="openPlannerEdgeModal('${edge.id}')"></path>
                <path class="planner-edge-line" d="${d}"${lineStyle}></path>
                <foreignObject x="${midX - 60}" y="${midY - 15}" width="120" height="32" style="overflow:visible;">
                    <div xmlns="http://www.w3.org/1999/xhtml" class="planner-edge-label" onclick="openPlannerEdgeModal('${edge.id}')"${labelStyle}>
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
        const row = e.target.closest('.planner-port');
        if (!row) return;
        const dot = row.querySelector('.planner-port-dot');
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
        // 若目前懸停在一個「方向相反、item相同」的合法 port 上，讓預覽線終點吸附到該 port 的 dot
        let endPos = plannerScreenToGraph(clientX, clientY);
        const hoverEl = document.elementFromPoint(clientX, clientY);
        const hoverRow = hoverEl ? hoverEl.closest('.planner-port') : null;
        if (hoverRow) {
            const hoverDot = hoverRow.querySelector('.planner-port-dot');
            if (hoverDot && hoverDot !== dotEl && hoverDot.dataset.item === item && hoverDot.dataset.dir !== dir) {
                const hoverNodeId = hoverRow.closest('.planner-node').id.replace('planner-node-', '');
                const snapped = getPlannerPortGraphPos(hoverNodeId, hoverDot.dataset.item, hoverDot.dataset.dir);
                if (snapped) endPos = snapped;
            }
        }

        const d = dir === 'out' ? buildPlannerEdgePathD(startPos, endPos) : buildPlannerEdgePathD(endPos, startPos);
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
        const targetRow = dropEl ? dropEl.closest('.planner-port') : null;
        const targetDot = targetRow ? targetRow.querySelector('.planner-port-dot') : null;

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
        // 放到卡片上但不是 port row -> 取消，不做任何事
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

    if (targetItem !== item) { console.log(t('Ports must be the same item to connect.', 'ui')); return; }
    if (targetDir === sourceDir) { console.log(t('Cannot connect two ports of the same direction.', 'ui')); return; }

    const fromNode = sourceDir === 'out' ? sourceNodeId : targetNodeId;
    const toNode = sourceDir === 'out' ? targetNodeId : sourceNodeId;

    const dup = Object.values(plannerState.edges).some(e =>
        e.fromNode === fromNode && e.toNode === toNode && e.item === item);
    if (dup) { console.log(t('These two ports are already connected.', 'ui')); return; }

    plannerState._edgeSeq = (plannerState._edgeSeq || 0) + 1;
    const edgeId = 'pedge_' + plannerState._edgeSeq;
    plannerState.edges[edgeId] = { id: edgeId, item, fromNode, toNode, createdAt: plannerState._edgeSeq };

    let flows = recomputeAndRefreshPlanner();

    // 從 sourceNode 的輸入端拉線連接時，若連上後 sourceNode 對此 item 仍然短缺，
    // 自動提升 targetNode 的機器數以補足短缺量。
    if (sourceDir !== 'out') {
        const sourceInKey = plannerPortKey(sourceNodeId, item, 'in');
        const shortage = flows.portRemaining[sourceInKey] || 0;
        if (shortage > 0.001) {
            const targetNode = plannerState.nodes[targetNodeId];
            const rates = targetNode ? plannerGetRecipeRates(targetNode.recipeId, targetNode.recipeModifiers) : null;
            const perMachineRate = rates
                ? (rates.outputsPerMachine.find(p => p.item === item) || {}).rate || 0
                : 0;
            if (targetNode && perMachineRate > 0) {
                targetNode.machineCount += shortage / perMachineRate;
                flows = recomputeAndRefreshPlanner();
                flashPlannerElements(`[data-mc-for="${targetNodeId}"]`, 'mc-flash');
            }
        }
    }
    savePlannerState();
}
