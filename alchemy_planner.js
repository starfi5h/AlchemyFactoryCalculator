/* ==========================================================================
   SECTION: PLANNER TAB
   Phase 1: 自由節點圖 - 手動放置節點、設定機器數，即時算出各 port 速率
   Phase 2: 手動拉線建立/刪除連線
   Phase 3: 依 edge 建立順序做流量分配，port 變色 + 卡片外 +N/-N 標籤
   ========================================================================== */

const PLANNER_LIBRARY_KEY = "alchemy_planner_library_v1";

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
// 畫布相關的所有函式維持讀寫 plannerState，不需要知道 library 的存在。
let plannerState = null;

let _plannerLastFlows = null; // 上一次 resolveFlows() 的結果快取 (供拖曳節點時即時重繪邊線用)
let _plannerCanvasHovered = false;
let _plannerManageSelectedId = null; // 「方案管理」Modal 內目前選中(highlight)的 plan id
let _plannerLinkMode = false;
let _plannerSummaryCollapsed = false;
let _plannerSummarySectionCollapsed = { cost: false, output: false, input: false, machines: true };
const PLANNER_ZOOM_MIN = 0.2;
const PLANNER_ZOOM_MAX = 3;
const PLANNER_GRID_STEPS = [40, 20, 0];

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
    renderPlannerToolbarSelect();

    renderPlanner();
    attachPlannerCanvasPan();
    attachPlannerPortDragHandlers();
    attachPlannerWheelZoom();
    attachPlannerPinchZoom();
    attachPlannerKeyboardShortcuts();
    updatePlannerGridButton();
    updatePlannerGridBackground();
    updatePlannerUndoRedoButtons();
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
    if (!plannerState.viewport) plannerState.viewport = { x: 0, y: 0, zoom: 1 };
    if (!plannerState.viewport.zoom) plannerState.viewport.zoom = 1;
    if (plannerState.gridSize === undefined) plannerState.gridSize = 0;
    _plannerLastFlows = null;
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
}

function plannerRedo() {
    const planId = plannerLibrary.activePlanId;
    const hist = plannerHistory[planId];
    if (!hist || hist.index >= hist.stack.length - 1) return;
    hist.index++;
    _restorePlannerHistorySnapshot(planId, hist);
}

/* ==========================================================================
   SECTION: PLAN LIBRARY UI - Toolbar Dropdown
   ========================================================================== */

/** 重繪 toolbar 上的方案下拉選單，選中項對應 activePlanId */
function renderPlannerToolbarSelect() {
    const sel = document.getElementById('planner-plan-select');
    if (!sel) return;
    sel.innerHTML = plannerLibrary.planOrder
        .filter(id => plannerLibrary.plans[id])
        .map(id => {
            const plan = plannerLibrary.plans[id];
            const selected = id === plannerLibrary.activePlanId ? 'selected' : '';
            return `<option value="${id}" ${selected}>${_escapeHtml(plan.name)}</option>`;
        }).join('');
}

/** 切換目前作用中的方案：重新指向 plannerState、重繪整個畫布 */
function switchPlannerPlan(planId) {
    if (!plannerLibrary.plans[planId] || planId === plannerLibrary.activePlanId) return;
    plannerLibrary.activePlanId = planId;
    _activatePlanData(planId);

    renderPlanner();
    updatePlannerGridButton();
    updatePlannerGridBackground();
    applyPlannerViewportTransform();
    renderPlannerToolbarSelect();
    updatePlannerUndoRedoButtons();
    savePlannerLibraryMeta(); // 只是切換選中對象，不算編輯內容
}

function _escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function _formatPlannerTime(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    const min = 60000, hr = 3600000, day = 86400000;
    if (diff < min) return t('just now', 'ui');
    if (diff < hr) return Math.floor(diff / min) + ' ' + t('min ago', 'ui');
    if (diff < day) return Math.floor(diff / hr) + ' ' + t('hr ago', 'ui');
    if (diff < day * 7) return Math.floor(diff / day) + ' ' + t('days ago', 'ui');
    return new Date(ts).toLocaleDateString();
}

/* ==========================================================================
   SECTION: PLAN LIBRARY UI - Manage Plans Modal
   ========================================================================== */

/** 開啟「方案管理」Modal，預設選中目前作用中的方案 */
function openPlannerManageModal() {
    _plannerManageSelectedId = plannerLibrary.activePlanId;
    renderPlannerManageList();
    document.getElementById('planner-manage-modal').style.display = 'flex';
}

/** 重繪 Modal 內的方案清單 (含拖曳排序 handle 綁定) */
function renderPlannerManageList() {
    const container = document.getElementById('planner-plan-list');
    if (!container) return;
    container.innerHTML = plannerLibrary.planOrder
        .filter(id => plannerLibrary.plans[id])
        .map(id => {
            const plan = plannerLibrary.plans[id];
            const isSelected = id === _plannerManageSelectedId;
            const isActive = id === plannerLibrary.activePlanId;
            return `
                <div class="planner-plan-row ${isSelected ? 'selected' : ''}" data-plan-id="${id}" onclick="selectPlannerManageRow('${id}')">
                    <span class="planner-plan-drag-handle" title="Drag to reorder">⠿</span>
                    <span class="planner-plan-name">${_escapeHtml(plan.name)}</span>
                    ${isActive ? `<span class="planner-plan-active-tag">${t('Active', 'ui')}</span>` : ''}
                    <span class="planner-plan-meta">${_formatPlannerTime(plan.updatedAt)}</span>
                </div>`;
        }).join('');

    container.querySelectorAll('.planner-plan-row').forEach(row => {
        _initPlannerPlanDragHandle(row.querySelector('.planner-plan-drag-handle'), row);
    });

    _updatePlannerManageActionsState();
}

/** 選中/未選中時，啟用或停用「載入/重新命名/複製/刪除/匯出」這排操作按鈕 */
function _updatePlannerManageActionsState() {
    const row = document.getElementById('planner-plan-actions-row');
    if (!row) return;
    const disabled = !_plannerManageSelectedId;
    row.querySelectorAll('button').forEach(btn => btn.disabled = disabled);
}

function selectPlannerManageRow(id) {
    _plannerManageSelectedId = id;
    renderPlannerManageList();
}

/** 清單列的拖曳排序：沿用 multi-target-row 既有的 pointer event pattern */
function _initPlannerPlanDragHandle(handle, row) {
    if (!handle) return;
    handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handle.setPointerCapture(e.pointerId);

        const container = document.getElementById('planner-plan-list');
        row.classList.add('dragging');
        let targetRow = null;
        let insertBefore = true;

        const onMove = (ev) => {
            const siblings = [...container.querySelectorAll('.planner-plan-row:not(.dragging)')];
            siblings.forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom'));
            targetRow = null;

            for (const r of siblings) {
                const rect = r.getBoundingClientRect();
                if (ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
                    insertBefore = ev.clientY < rect.top + rect.height / 2;
                    r.classList.add(insertBefore ? 'drag-over-top' : 'drag-over-bottom');
                    targetRow = r;
                    break;
                }
            }
        };

        const onUp = () => {
            handle.removeEventListener('pointermove', onMove);
            handle.removeEventListener('pointerup', onUp);
            row.classList.remove('dragging');
            container.querySelectorAll('.planner-plan-row')
                .forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom'));

            if (targetRow) {
                container.insertBefore(row, insertBefore ? targetRow : targetRow.nextSibling);
                plannerLibrary.planOrder = [...container.querySelectorAll('.planner-plan-row')].map(r => r.dataset.planId);
                savePlannerLibraryMeta();
                renderPlannerToolbarSelect();
            }
        };

        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
    });
}

/* ---- Modal 操作按鈕：載入 / 重新命名 / 複製 / 刪除 / 匯出 ---- */

/** 把 Modal 內選中的方案設為作用中方案，並關閉 Modal */
function managePlannerLoadSelected() {
    if (!_plannerManageSelectedId) return;
    switchPlannerPlan(_plannerManageSelectedId);
    closeModal('planner-manage-modal');
}

/** 就地將選中列的名稱換成輸入框，方便重新命名 */
function managePlannerRenameSelected() {
    const id = _plannerManageSelectedId;
    if (!id) return;
    const nameEl = document.querySelector(`.planner-plan-row[data-plan-id="${id}"] .planner-plan-name`);
    if (!nameEl) return;
    const plan = plannerLibrary.plans[id];
    const oldName = plan.name;
    nameEl.innerHTML = `<input type="text" value="${_escapeHtml(oldName)}">`;
    const input = nameEl.querySelector('input');
    input.focus();
    input.select();
    input.addEventListener('click', (e) => e.stopPropagation());

    const commit = () => {
        const newName = input.value.trim();
        plan.name = newName || oldName;
        savePlannerLibraryMeta();
        renderPlannerToolbarSelect();
        renderPlannerManageList();
    };
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') { input.value = oldName; input.blur(); }
    });
}

/** 複製選中的方案 (含全部節點/連線)，插入在原方案之後 */
function managePlannerDuplicateSelected() {
    const id = _plannerManageSelectedId;
    if (!id) return;
    const src = plannerLibrary.plans[id];
    const copy = _createPlan(src.name + ' ' + t('(Copy)', 'ui'));
    copy.data = JSON.parse(JSON.stringify(src.data));

    const idx = plannerLibrary.planOrder.indexOf(id);
    plannerLibrary.plans[copy.id] = copy;
    plannerLibrary.planOrder.splice(idx + 1, 0, copy.id);

    _plannerManageSelectedId = copy.id;
    savePlannerLibraryMeta();
    renderPlannerToolbarSelect();
    renderPlannerManageList();
}

/** 刪除選中的方案；若刪掉的是目前作用中方案，自動切換到清單第一筆；不可刪到 0 個方案 */
function managePlannerDeleteSelected() {
    const id = _plannerManageSelectedId;
    if (!id) return;
    if (!confirm(t('Delete this plan?', 'ui'))) return;

    delete plannerLibrary.plans[id];
    plannerLibrary.planOrder = plannerLibrary.planOrder.filter(pid => pid !== id);
    delete plannerHistory[id]; // 該 plan 的 undo/redo 歷史一併清除

    if (plannerLibrary.planOrder.length === 0) {
        const plan = _createPlan(t('Default Plan', 'ui'));
        plannerLibrary.plans[plan.id] = plan;
        plannerLibrary.planOrder = [plan.id];
    }

    if (plannerLibrary.activePlanId === id) {
        plannerLibrary.activePlanId = plannerLibrary.planOrder[0];
        _activatePlanData(plannerLibrary.activePlanId);
        renderPlanner();
        updatePlannerGridButton();
        updatePlannerGridBackground();
        applyPlannerViewportTransform();
        updatePlannerUndoRedoButtons();
    }

    _plannerManageSelectedId = plannerLibrary.activePlanId;
    savePlannerLibraryMeta();
    renderPlannerToolbarSelect();
    renderPlannerManageList();
}

/** 將選中方案匯出成單一 .json 檔 (含 name + data，方便匯入時直接還原名稱) */
function managePlannerExportSelected() {
    const id = _plannerManageSelectedId;
    if (!id) return;
    const plan = plannerLibrary.plans[id];
    const exportObj = { name: plan.name, data: plan.data };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planner_${plan.name.replace(/[^\w\-]+/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* ---- Modal 底部操作：新方案 / 匯入 (與選中列無關的全域操作) ---- */

/** 建立一個空白新方案並直接進入重新命名狀態 */
function managePlannerCreateNew() {
    const plan = _createPlan(t('New Plan', 'ui'));
    plannerLibrary.plans[plan.id] = plan;
    plannerLibrary.planOrder.push(plan.id);
    _plannerManageSelectedId = plan.id;
    savePlannerLibraryMeta();
    renderPlannerToolbarSelect();
    renderPlannerManageList();
    managePlannerRenameSelected();
}

/** 從檔案匯入一個方案 (新增一筆到清單，不覆蓋既有方案) */
function managePlannerImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            try {
                const parsed = JSON.parse(readerEvent.target.result);
                if (!parsed || typeof parsed !== 'object' || !parsed.data || !parsed.data.nodes) {
                    throw new Error("Invalid plan file format.");
                }
                const plan = _createPlan(parsed.name || t('Imported Plan', 'ui'));
                plan.data = Object.assign(_createEmptyPlanData(), parsed.data);

                plannerLibrary.plans[plan.id] = plan;
                plannerLibrary.planOrder.push(plan.id);
                _plannerManageSelectedId = plan.id;

                savePlannerLibraryMeta();
                renderPlannerToolbarSelect();
                renderPlannerManageList();
            } catch (err) {
                alert(t('Failed to import plan: ', 'ui') + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

/* ---------------- COORDINATE HELPERS ---------------- */

function plannerScreenToGraph(clientX, clientY) {
    const canvas = document.getElementById('planner-canvas');
    const rect = canvas.getBoundingClientRect();
    const zoom = plannerState.viewport.zoom || 1;
    return {
        x: (clientX - rect.left - plannerState.viewport.x) / zoom,
        y: (clientY - rect.top - plannerState.viewport.y) / zoom
    };
}

function applyPlannerViewportTransform() {
    const vp = document.getElementById('planner-viewport');
    const zoom = plannerState.viewport.zoom || 1;
    if (vp) vp.style.transform = `translate(${plannerState.viewport.x}px, ${plannerState.viewport.y}px) scale(${zoom})`;
    updatePlannerGridBackground();
}

/* ==========================================================================
   SECTION: VIEW CONTROLS - ZOOM / GRID SNAP / FIT TO VIEW
   ========================================================================== */

function plannerSetZoom(newZoom, anchorClientX, anchorClientY) {
    const canvas = document.getElementById('planner-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ax = anchorClientX ?? (rect.left + rect.width / 2);
    const ay = anchorClientY ?? (rect.top + rect.height / 2);
    const oldZoom = plannerState.viewport.zoom || 1;

    newZoom = Math.min(PLANNER_ZOOM_MAX, Math.max(PLANNER_ZOOM_MIN, newZoom));
    if (Math.abs(newZoom - oldZoom) < 0.0001) return;

    // アンカー下のグラフ座標を保ったままズーム
    const graphX = (ax - rect.left - plannerState.viewport.x) / oldZoom;
    const graphY = (ay - rect.top - plannerState.viewport.y) / oldZoom;

    plannerState.viewport.zoom = newZoom;
    plannerState.viewport.x = (ax - rect.left) - graphX * newZoom;
    plannerState.viewport.y = (ay - rect.top) - graphY * newZoom;

    applyPlannerViewportTransform();
    if (_plannerLastFlows) renderPlannerEdges(_plannerLastFlows);
}

function plannerZoomIn()  { plannerSetZoom((plannerState.viewport.zoom || 1) * 1.2); }
function plannerZoomOut() { plannerSetZoom((plannerState.viewport.zoom || 1) / 1.2); }

function attachPlannerWheelZoom() {
    const canvas = document.getElementById('planner-canvas');
    if (!canvas || canvas.dataset.wheelBound) return;
    canvas.dataset.wheelBound = "1";
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        plannerSetZoom((plannerState.viewport.zoom || 1) * factor, e.clientX, e.clientY);
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
            pinchStartZoom = plannerState.viewport.zoom || 1;
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
    });
}

function plannerSnapVal(v) {
    const g = plannerState.gridSize || 0;
    if (!g) return v;
    return Math.round(v / g) * g;
}

function plannerCycleGridSnap() {
    const idx = PLANNER_GRID_STEPS.indexOf(plannerState.gridSize || 0);
    plannerState.gridSize = PLANNER_GRID_STEPS[(idx + 1) % PLANNER_GRID_STEPS.length];
    updatePlannerGridButton();
    updatePlannerGridBackground();
    savePlannerLibraryMeta(); // 純視圖操作 (格線設定)：只寫入 localStorage，不計入 undo 歷史
}

function updatePlannerGridButton() {
    const btn = document.getElementById('planner-grid-btn');
    if (!btn) return;
    const g = plannerState.gridSize || 0;
    btn.textContent = g ? `⊞${g}` : '⊞';
    btn.title = g ? `Grid Snap: ${g}px` : 'Grid Snap: Off';
    btn.classList.toggle('active', !!g);
}

function updatePlannerGridBackground() {
    const canvas = document.getElementById('planner-canvas');
    if (!canvas) return;
    const g = plannerState.gridSize || 0;
    const zoom = plannerState.viewport.zoom || 1;

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
    canvas.style.backgroundPosition = `${plannerState.viewport.x}px ${plannerState.viewport.y}px`;
}

function plannerFitToView() {
    const nodes = Object.values(plannerState.nodes);
    const canvas = document.getElementById('planner-canvas');
    if (!canvas) return;

    if (nodes.length === 0) {
        plannerState.viewport = { x: 0, y: 0, zoom: 1 };
        applyPlannerViewportTransform();
        savePlannerLibraryMeta(); // 純視圖操作 (fit to view)：只寫入 localStorage，不計入 undo 歷史
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

    plannerState.viewport.zoom = zoom;
    plannerState.viewport.x = (rect.width - graphW * zoom) / 2 - minX * zoom;
    plannerState.viewport.y = (rect.height - graphH * zoom) / 2 - minY * zoom;

    applyPlannerViewportTransform();
    if (_plannerLastFlows) renderPlannerEdges(_plannerLastFlows);
    savePlannerLibraryMeta(); // 純視圖操作 (fit to view)：只寫入 localStorage，不計入 undo 歷史
}

/* ---------------- ADD / REMOVE NODES ---------------- */

function onPlannerAddNodeClick() {
    const canvas = document.getElementById('planner-canvas');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const zoom = plannerState.viewport.zoom || 1;
    const stackOffset = (Object.keys(plannerState.nodes).length % 6) * 26;
    const graphX = (rect.width / 2 - plannerState.viewport.x) / zoom - 110 + stackOffset;
    const graphY = (rect.height / 2 - plannerState.viewport.y) / zoom - 60 + stackOffset;
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
 * 依配方 id (與可選的 recipeModifiers，例如高級煉金爐催化劑) 算出「單台機器」的
 * input/output/heat/fert per-min 速率，不受任何節點的 machineCount 影響。
 * 回傳: { recipe, inputsPerMachine, outputsPerMachine, heatItemsPerMachine, fertItemsPerMachine }
 */
function plannerGetRecipeRates(recipeId, recipeModifiers) {
    const recipe = getRecipeById(recipeId, recipeModifiers);
    if (!recipe) return null;

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

    return { recipe, inputsPerMachine, outputsPerMachine, heatItemsPerMachine, fertItemsPerMachine };
}

/**
 * 依節點目前的機器數與全域共用設定(preferredRecipes/recipeModifiers/升級等級)，
 * 算出這個節點所有 input/output port 的速率，以及機台本身的燃料/肥料消耗。
 */
function computeNodePorts(node) {
    const rates = plannerGetRecipeRates(node.recipeId, node.recipeModifiers);
    const result = { recipe: rates ? rates.recipe : null, inputs: [], outputs: [], heatItemsPerMin: 0, fertItemsPerMin: 0 };
    if (!rates) return result;

    const mc = node.machineCount;
    result.inputs = rates.inputsPerMachine.map(p => ({ item: p.item, rate: p.rate * mc }));
    result.outputs = rates.outputsPerMachine.map(p => ({ item: p.item, rate: p.rate * mc }));
    result.heatItemsPerMin = rates.heatItemsPerMachine * mc;
    result.fertItemsPerMin = rates.fertItemsPerMachine * mc;
    return result;
}

/** 依 plannerGetRecipeRates() 的結果，組出 hover tooltip 的 HTML 內容 */
function buildPlannerRateTooltipHtml(rates) {
    if (!rates) return '';

    const rowHtml = (item, qty, color) => {
        const def = DB.items[item] || {};
        const plusSign = qty > 0 ? '+' : '';
        return `<div class="planner-rate-tooltip-row">
            <span class="planner-rate-tooltip-qty" style="color:${color}">${plusSign}${formatVal(qty)}</span>
            <img src="img/item${def.id ?? 0}.png">
            <span class="planner-rate-tooltip-name">${item}</span>
        </div>`;
    };

    let html = '';
    if (rates.inputsPerMachine.length > 0) {
        html += rates.inputsPerMachine.map(p => rowHtml(p.item, -p.rate, '#e0e0e0')).join('');
    }
    if (rates.outputsPerMachine.length > 0) {
        if (html) html += `<div class="planner-rate-tooltip-divider"></div>`;
        html += rates.outputsPerMachine.map(p => rowHtml(p.item, p.rate, '#00e676')).join('');
    }
    if (html) html += `<div class="planner-rate-tooltip-divider"></div>`;
    if (rates.heatItemsPerMachine > 0.0001) {        
        html += rowHtml(DB.settings.defaultFuel, -rates.heatItemsPerMachine, '#ff5722');
    }
    if (rates.fertItemsPerMachine > 0.0001) {
        html += rowHtml(DB.settings.defaultFert, -rates.fertItemsPerMachine, '#76ff03');
    }

    html += `<div class="planner-rate-tooltip-footer">${t('per machine (/min)', 'ui')}</div>`;
    return html;
}

function showPlannerRateTooltip(anchorEl, rates) {
    hidePlannerRateTooltip();
    if (!rates) return;

    const tip = document.createElement('div');
    tip.id = 'planner-rate-tooltip';
    tip.className = 'planner-rate-tooltip';
    tip.innerHTML = buildPlannerRateTooltipHtml(rates);
    document.body.appendChild(tip);

    const rect = anchorEl.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    let left = rect.left;
    let top = rect.top - tipRect.height - 6;
    if (left + tipRect.width > window.innerWidth) left = window.innerWidth - tipRect.width - 8;
    if (top < 4) top = rect.bottom + 6; // 上方空間不足時改顯示在下方
    tip.style.left = Math.max(4, left) + 'px';
    tip.style.top = top + 'px';
}

function hidePlannerRateTooltip() {
    const tip = document.getElementById('planner-rate-tooltip');
    if (tip) tip.remove();
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
    const machineKey = ports.recipe ? ports.recipe.machine : '';
    const mainOut = ports.recipe ? Object.keys(ports.recipe.outputs)[0] : plannerMainOutput(node.recipeId) || '';
    const machineName = ports.recipe ? t(ports.recipe.machine, 'machines').replace('Advanced', 'Adv.') : t('No Recipe', 'ui');
    const machineIconHtml = machineKey
    ? `<img src="img/machines/${machineKey.toLowerCase().replaceAll(' ', '-')}.png" class="planner-node-icon" onerror="this.style.opacity='0'">`
    : `<span class="planner-node-icon"></span>`;

    const heatTag = ports.heatItemsPerMin > 0 ? 'heat' : '';
    wrap.innerHTML = `
        <div class="planner-node-header ${heatTag}" 
             onmouseenter="onPlannerHeaderHover(this, '${node.id}')"
             onmouseleave="hidePlannerRateTooltip()">
            ${machineIconHtml}
            <span class="planner-node-title">${machineName}</span>            
            <button class="planner-gear-btn" title="${t('Node Settings', 'ui')}" onclick="event.stopPropagation(); openPlannerNodeModal('${node.id}')">⚙</button>
            <button class="planner-close-btn" title="${t('Remove Node', 'ui')}" onclick="removePlannerNode('${node.id}')">✕</button>
        </div>
        <div class="planner-node-body" id="planner-node-body-${node.id}">
            ${renderPlannerPortsHtml(node, ports, flows)}
            <div class="planner-machine-count-row">
                <button class="planner-gear-btn" title="${t('Auto-generate upstream', 'ui')}" onclick="autoGenerateUpstreamNodes('${node.id}')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L6 12h5l-1 8 7-12h-5l1-6z"/>
                    </svg>                
                </button>
                <input type="number" min="0" step="1" value="${node.machineCount}"
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
    const rates = plannerGetRecipeRates(node.recipeId, node.recipeModifiers);
    if (!rates) return; // 無 recipe 不顯示
    showPlannerRateTooltip(headerEl, rates);
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
    if (dir === 'in') return `<div class="planner-port planner-port-in ${rateClass}">${badgeHtml}${dot}${rate}${icon}${name}</div>`;
    return `<div class="planner-port planner-port-out ${rateClass}">${name}${icon}${rate}${dot}${badgeHtml}</div>`;
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
        if (n) n.machineCount = Math.max(0, Math.round(n.machineCount * ratio * 1e6) / 1e6);
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

/* ==========================================================================
   SECTION: NODE SETTINGS MODAL - recipe modifiers (catalysts / custom input)
   + recipe switching (grouped by the node's main output item)
   ========================================================================== */

function openPlannerNodeModal(nodeId) {
    if (!plannerState.nodes[nodeId]) return;
    renderPlannerNodeModalBody(nodeId);
    document.getElementById('planner-node-modal').style.display = 'flex';
}

function renderPlannerNodeModalBody(nodeId) {
    const node = plannerState.nodes[nodeId];
    const body = document.getElementById('planner-node-modal-body');
    if (!node || !body) return;
    body.dataset.nodeId = nodeId;

    const rawRecipe = plannerGetRawRecipe(node.recipeId);
    const mainOut = rawRecipe ? Object.keys(rawRecipe.outputs)[0] : null;

    const titleEl = document.getElementById('planner-node-modal-title');
    if (titleEl) {
        titleEl.innerText = t('Node Settings', 'ui') + (mainOut ? ' — ' + t(mainOut, 'items') : '');
    }

    body.innerHTML = `
        <div class="planner-modifier-section">
            ${_buildPlannerNodeModifierHtml(node, rawRecipe)}
        </div>
        <div style="height:1px; background:var(--border); margin:12px 0;"></div>
        <div class="planner-recipe-switch-section">
            <div style="font-size:0.78em; color:#888; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">
                ${t('Select Recipe', 'ui')}
            </div>
            <div class="planner-picker-list" style="max-height:240px; overflow-y:auto; padding:0;">
                ${mainOut ? _buildPlannerNodeRecipeSwitchHtml(node, mainOut) : `<div class="planner-picker-empty">${t('No recipe selected', 'ui')}</div>`}
            </div>
        </div>
    `;
}

/** 顯示目前配方的內容(套用 node 自己的 recipeModifiers 後)，固定佔用一塊版面，
 *  並依機器種類提供對應的修飾控制 (高級煉金爐催化劑 / 悖論坩堝自訂輸入) */
function _buildPlannerNodeModifierHtml(node, rawRecipe) {
    if (!rawRecipe) {
        return `<div class="planner-picker-empty">${t('No recipe selected', 'ui')}</div>`;
    }

    let effRecipe = rawRecipe;
    if (typeof getRecipeById === 'function') {
        effRecipe = getRecipeById(node.recipeId, node.recipeModifiers) || rawRecipe;
    }

    const inputsHtml = _plannerFormatIOList(effRecipe.inputs);
    const outputsHtml = _plannerFormatIOList(effRecipe.outputs);

    let controlsHtml = '';
    if (rawRecipe.machine === 'Advanced Athanor') {
        const activeCats = node.recipeModifiers?.catalysts || [];
        const btns = ATHANOR_CATALYSTS.map(c => {
            const isActive = activeCats.includes(c.id);
            return `<button class="catalyst-btn${isActive ? ' active' : ''}" onclick="plannerToggleCatalyst('${node.id}','${c.id}')">${t(c.label)}</button>`;
        }).join('');
        controlsHtml = `<div class="catalyst-row" style="margin-top:10px; padding-top:8px; border-top:1px dashed var(--border);">${t('Catalysts')} ${btns}</div>`;
    } else if (rawRecipe.machine === 'Paradox Crucible' && rawRecipe.customInputSlot) {
        const selectedItem = node.recipeModifiers?.customInput;
        const inputDef = selectedItem ? DB.items[selectedItem] : null;
        controlsHtml = `
            <div style="margin-top:10px; padding-top:8px; border-top:1px dashed var(--border); display:flex; align-items:center; gap:8px;">
                <span style="font-size:0.82em; color:#aaa;">${t('Input')}:</span>
                <span class="mini-picker" style="display:inline-flex; align-items:center; gap:4px;" onclick="plannerPickCustomInput('${node.id}')">
                    ${inputDef ? `<img src="img/item${inputDef.id ?? 0}.png" width="18" height="18">` : ''}
                    <span>${selectedItem ? selectedItem : t('Select Input Item')}</span>
                </span>
            </div>`;
    }

    return `
        <div>
            <div style="font-weight:bold; color:#eee; margin-bottom:8px;">${t(rawRecipe.machine, 'machines')}</div>
            <div style="display:flex; align-items:center; flex-wrap:wrap; gap:4px;">
                <span style="display:flex; flex-wrap:wrap; gap:4px;">${inputsHtml || `<em style="font-size:0.8em;color:#666;">—</em>`}</span>
                <span style="color:#666; margin:0 4px;">→</span>
                <span style="display:flex; flex-wrap:wrap; gap:4px;">${outputsHtml}</span>
            </div>
            ${controlsHtml}
        </div>`;
}

function _plannerFormatIOList(ioObj) {
    const entries = Object.entries(ioObj || {});
    if (entries.length === 0) return '';
    return entries.map(([name, qty]) => {
        const d = DB.items[name] || {};
        const qtyNum = typeof qty === 'number' ? qty : (parseFloat(qty) || 0);
        const qtyStr = Number.isInteger(qtyNum) ? qtyNum : Number(qtyNum.toFixed(3));
        return `<span style="display:inline-flex; align-items:center; gap:2px;" title="${name} ×${qtyStr}">
            <img src="img/item${d.id ?? 0}.png" width="20" height="20">
            <span style="font-size:0.75em; color:var(--accent); font-weight:bold;">×${qtyStr}</span>
        </span>`;
    }).join('');
}

/** 列出所有輸出 mainOut 的配方 (與目前節點的配方同群)，點擊即切換該節點的 recipeId */
function _buildPlannerNodeRecipeSwitchHtml(node, mainOut) {
    const candidates = getRecipesFor(mainOut);
    if (!candidates || candidates.length === 0) {
        return `<div class="planner-picker-empty">${t('No recipes found', 'ui')}</div>`;
    }
    return candidates.map(r => {
        const isActive = r.id === node.recipeId;
        const inputIcons = Object.keys(r.inputs || {}).map(name => {
            const d = DB.items[name] || {};
            return `<img src="img/item${d.id ?? 0}.png" width="18" height="18" title="${name}">`;
        }).join('');
        const outDef = DB.items[mainOut] || {};
        const machineIconSrc = `img/machines/${r.machine.toLowerCase().replaceAll(' ', '-')}.png`;
        const activeStyle = isActive
            ? 'background:rgba(76,175,80,0.12); border:1px solid var(--accent);'
            : 'border:1px solid transparent;';
        return `
            <div class="planner-picker-row" style="${activeStyle}" onclick="plannerSwitchNodeRecipe('${node.id}','${r.id}')">
                <div class="planner-picker-flow">
                    ${inputIcons}<span class="planner-picker-arrow">→</span><img src="img/item${outDef.id ?? 0}.png" width="20" height="20">
                </div>
                <span class="planner-picker-machine">
                    <img src="${machineIconSrc}" width="18" height="18" onerror="this.style.opacity='0'">${t(r.machine, 'machines')}
                </span>
                ${isActive ? '<span style="color:var(--accent); font-weight:bold; margin-left:4px;">✓</span>' : ''}
            </div>`;
    }).join('');
}

/** 重新整理 modal 內容 + 節點卡片/連線/摘要面板，並存檔 */
function _plannerNodeModalRefresh(nodeId) {
    renderPlannerNodeModalBody(nodeId);
    recomputeAndRefreshPlanner();
    savePlannerState();
}

function plannerToggleCatalyst(nodeId, catalystId) {
    const node = plannerState.nodes[nodeId];
    if (!node) return;
    if (!node.recipeModifiers) node.recipeModifiers = {};
    if (!node.recipeModifiers.catalysts) node.recipeModifiers.catalysts = [];
    const cats = node.recipeModifiers.catalysts;
    const idx = cats.indexOf(catalystId);
    if (idx >= 0) cats.splice(idx, 1); else cats.push(catalystId);
    if (cats.length === 0) delete node.recipeModifiers.catalysts;
    if (node.recipeModifiers && Object.keys(node.recipeModifiers).length === 0) delete node.recipeModifiers;
    _plannerNodeModalRefresh(nodeId);
}

function plannerPickCustomInput(nodeId) {
    const node = plannerState.nodes[nodeId];
    if (!node) return;
    const originalSelectItem = window.selectItem;
    window.selectItem = (name) => {
        if (!node.recipeModifiers) node.recipeModifiers = {};
        node.recipeModifiers.customInput = name;
        window.selectItem = originalSelectItem;
        closeModal('picker-modal');
        _plannerNodeModalRefresh(nodeId);
    };
    openItemPicker();
}

/** 切換節點的配方 (依舊配方 mainOut 分組挑選)；因催化劑/自訂輸入是綁定特定配方 id 的，
 *  換配方後重置該節點的 recipeModifiers。失效的連線由 plannerResolveFlows() 自動清除。 */
function plannerSwitchNodeRecipe(nodeId, recipeId) {
    const node = plannerState.nodes[nodeId];
    if (!node || node.recipeId === recipeId) return;
    node.recipeId = recipeId;
    delete node.recipeModifiers;
    renderPlannerNodeModalBody(nodeId);
    renderPlanner();
    savePlannerState();
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

        const onMove = (ev) => {
            const zoom = plannerState.viewport.zoom || 1;
            node.x = originX + (ev.clientX - startX) / zoom;
            node.y = originY + (ev.clientY - startY) / zoom;
            if (plannerState.gridSize) {
                node.x = plannerSnapVal(node.x);
                node.y = plannerSnapVal(node.y);
            }
            wrap.style.left = node.x + 'px';
            wrap.style.top = node.y + 'px';
            if (_plannerLastFlows) renderPlannerEdges(_plannerLastFlows);
        };
        const onUp = () => {
            header.removeEventListener('pointermove', onMove);
            header.removeEventListener('pointerup', onUp);
            header.classList.remove('dragging');

            // Grid Snap: 節點左上角座標を対象に丸める
            if (plannerState.gridSize) {
                node.x = plannerSnapVal(node.x);
                node.y = plannerSnapVal(node.y);
                wrap.style.left = node.x + 'px';
                wrap.style.top = node.y + 'px';
                if (_plannerLastFlows) renderPlannerEdges(_plannerLastFlows);
            }
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
        if (e.target.closest('.planner-edge-group')) return;
        if (e.target.closest('.planner-view-controls')) return;
        if (e.target.closest('.planner-summary-panel')) return;
        if (e.button !== 0) return;
        canvas.setPointerCapture(e.pointerId);
        canvas.classList.add('panning');
        const startX = e.clientX, startY = e.clientY;
        const originX = plannerState.viewport.x, originY = plannerState.viewport.y;

        const onMove = (ev) => {
            plannerState.viewport.x = originX + (ev.clientX - startX);
            plannerState.viewport.y = originY + (ev.clientY - startY);
            applyPlannerViewportTransform();
            if (_plannerLastFlows) renderPlannerEdges(_plannerLastFlows);   // 追加：pan中も邊線を追従
        };
        const onUp = () => {
            canvas.removeEventListener('pointermove', onMove);
            canvas.removeEventListener('pointerup', onUp);
            canvas.classList.remove('panning');
        };
        canvas.addEventListener('pointermove', onMove);
        canvas.addEventListener('pointerup', onUp);        
        hidePlannerRateTooltip();
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
            <button class="reset-btn" style="margin-top:8px; font-size:1em" onclick="deletePlannerEdge('${edgeId}')">${t('Delete Connection', 'ui')}</button>
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

    const rates = plannerGetRecipeRates(recipe.id);
    const portList = consuming ? rates.inputsPerMachine : rates.outputsPerMachine;
    const perMachineRate = (portList.find(p => p.item === ctx.item) || {}).rate || 0;

    let machineCount = (perMachineRate > 0 && targetRate > 0) ? targetRate / perMachineRate : 1;
    machineCount = Math.max(0.000001, Math.round(machineCount * 1000000) / 1000000);

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

/* ---------------- AUTO-GENERATE UPSTREAM NODES ---------------- */

/** 估算節點卡片高度：116px 基礎 + 24px * max(input埠數, output埠數) */
function estimatePlannerNodeHeight(recipe) {
    if (!recipe) return 116;
    const inCount = Object.keys(recipe.inputs || {}).length;
    const outCount = Object.keys(recipe.outputs || {}).length;
    return 116 + 24 * Math.max(inCount, outCount);
}

/**
 * 依來源節點的目前 input 缺額，在其左側自動生成上游節點 (套用 preferred 配方)，
 * 並自動連線。只展開這一層，不遞迴往上補。
 */
function autoGenerateUpstreamNodes(nodeId) {
    const sourceNode = plannerState.nodes[nodeId];
    if (!sourceNode) return;

    const flows = plannerResolveFlows();
    const ports = flows.nodePortsCache[nodeId];
    if (!ports) return;

    // 找出有缺額的 input port
    const deficits = [];
    ports.inputs.forEach(p => {
        const key = plannerPortKey(nodeId, p.item, 'in');
        const remaining = flows.portRemaining[key] ?? 0;
        if (remaining > 0.001) deficits.push({ item: p.item, deficit: remaining });
    });
    if (deficits.length === 0) return; // no-op

    // 為每個缺額物品準備配方與機器數，過濾掉沒有配方/無法生產的
    const plans = [];
    deficits.forEach(({ item, deficit }) => {
        const recipe = getActiveRecipe(item);
        if (!recipe) return; // 跳過無配方物品 (原料/外部輸入)

        const rates = plannerGetRecipeRates(recipe.id, DB.settings.recipeModifiers?.[recipe.id]);
        if (!rates) return;
        const perMachineRate = (rates.outputsPerMachine.find(p => p.item === item) || {}).rate || 0;
        if (perMachineRate <= 0) return;

        let machineCount = deficit / perMachineRate;
        machineCount = Math.max(0.000001, Math.round(machineCount * 1000000) / 1000000);

        plans.push({ item, recipe, recipeModifiers: DB.settings.recipeModifiers?.[recipe.id], machineCount });
    });
    if (plans.length === 0) return;

    // 計算擺放位置
    const sourceEl = document.getElementById('planner-node-' + nodeId);
    const sourceHeight = sourceEl ? sourceEl.offsetHeight : 116;
    const newNodeWidth = 200;

    let x = sourceNode.x - newNodeWidth - 120;
    if (plannerState.gridSize) x = plannerSnapVal(x);

    const heights = plans.map(p => estimatePlannerNodeHeight(p.recipe));
    const baseGap = plannerState.gridSize ? Math.min(80, Math.max(20, plannerState.gridSize)) : 20;
    const count = plans.length;

    const yPositions = new Array(count);

    if (count % 2 === 1) {
        // 奇數個：正中央那個節點的上緣與來源節點上緣對齊，其餘依序往上/往下排開
        const midIdx = Math.floor(count / 2);
        yPositions[midIdx] = sourceNode.y;

        // 往上排 (index 遞減)
        let curTop = sourceNode.y;
        for (let i = midIdx - 1; i >= 0; i--) {
            curTop -= (baseGap + heights[i + 1]); // 減去「上一個(較靠中央)節點的高度」與間距
            yPositions[i] = curTop;
        }

        // 往下排 (index 遞增)
        let curBottom = sourceNode.y + heights[midIdx];
        for (let i = midIdx + 1; i < count; i++) {
            yPositions[i] = curBottom + baseGap;
            curBottom = yPositions[i] + heights[i];
        }
    } else {
        // 偶數個：維持整體置中分佈
        const totalHeight = heights.reduce((s, h) => s + h, 0) + baseGap * (count - 1);
        const sourceCenterY = sourceNode.y + sourceHeight / 2;
        let curY = sourceCenterY - totalHeight / 2;
        for (let i = 0; i < count; i++) {
            yPositions[i] = curY;
            curY += heights[i] + baseGap;
        }
    }

    plans.forEach((plan, i) => {
        let y = yPositions[i];
        if (plannerState.gridSize) y = plannerSnapVal(y);

        plannerState._nodeSeq = (plannerState._nodeSeq || 0) + 1;
        const newNodeId = 'pnode_' + plannerState._nodeSeq;
        plannerState.nodes[newNodeId] = {
            id: newNodeId,
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
    });

    renderPlanner();
    savePlannerState();
}

/* ==========================================================================
   SECTION: SUMMARY PANEL (top-left overlay)
   ========================================================================== */

function _injectPlannerSummaryStyles() {
    if (document.getElementById('planner-summary-styles')) return;
    const s = document.createElement('style');
    s.id = 'planner-summary-styles';
    s.textContent = `
        .planner-summary-panel {
            position: absolute; top: 14px; left: 14px; z-index: 50;
            width: 240px; max-height: calc(100% - 28px);
            background: rgba(26,26,26,0.95); border: 1px solid var(--border,#444);
            border-radius: 6px; box-shadow: 0 4px 14px rgba(0,0,0,0.45);
            display: flex; flex-direction: column; overflow: hidden;
            font-size: 0.85em;
        }
        .planner-summary-panel.collapsed { width: auto; background: transparent; border: none; box-shadow: none; }
        .planner-summary-min-btn {
            background: rgba(26,26,26,0.95); border: 1px solid var(--border,#444); color: #ddd;
            border-radius: 6px; padding: 7px 12px; cursor: pointer; font-size: 0.95em;
            box-shadow: 0 4px 14px rgba(0,0,0,0.45);
        }
        .planner-summary-min-btn:hover { border-color: var(--accent); color: #fff; }
        .planner-summary-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 8px 10px; border-bottom: 1px solid var(--border,#444);
            flex-shrink: 0; background: #202020;
        }
        .planner-summary-title { font-weight: bold; color: #eee; letter-spacing: 0.03em; text-transform: uppercase; font-size: 0.85em; }
        .planner-summary-close-btn {
            background: transparent; border: none; color: #999; cursor: pointer;
            font-size: 1.1em; line-height: 1; padding: 0 2px;
        }
        .planner-summary-close-btn:hover { color: #fff; }
        .planner-summary-body { overflow-y: auto; padding: 4px 0; }
        .planner-summary-section { border-bottom: 1px solid #2e2e2e; }
        .planner-summary-section:last-child { border-bottom: none; }
        .planner-summary-section-header {
            display: flex; align-items: center; gap: 6px;
            padding: 7px 10px; cursor: pointer; user-select: none;
            color: #ccc; font-weight: bold;
        }
        .planner-summary-section-header:hover { background: #262626; }
        .planner-summary-arrow { font-size: 0.75em; color: #888; width: 10px; flex-shrink: 0; }
        .planner-summary-count {
            margin-left: auto; background: #333; color: #aaa; border-radius: 8px;
            padding: 0 7px; font-size: 0.8em; font-weight: normal;
        }
        .planner-summary-section-body { padding: 2px 10px 8px 10px; }
        .planner-summary-row {
            display: flex; align-items: center; gap: 6px;
            padding: 3px 0; font-size: 0.95em; color: #ddd;
        }
        .planner-summary-row span:nth-child(2) { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .planner-summary-val { font-weight: bold; flex-shrink: 0; }
        .planner-summary-empty { color: #666; font-style: italic; font-size: 0.9em; padding: 2px 0; }
    `;
    document.head.appendChild(s);
}

function ensurePlannerSummaryPanel() {
    let panel = document.getElementById('planner-summary-panel');
    if (panel) return panel;
    const canvas = document.getElementById('planner-canvas');
    if (!canvas) return null;
    panel = document.createElement('div');
    panel.id = 'planner-summary-panel';
    panel.className = 'planner-summary-panel';
    canvas.appendChild(panel);
    return panel;
}

function togglePlannerSummaryPanel() {
    _plannerSummaryCollapsed = !_plannerSummaryCollapsed;
    renderPlannerSummary(_plannerLastFlows);
}

function togglePlannerSummarySection(key) {
    _plannerSummarySectionCollapsed[key] = !_plannerSummarySectionCollapsed[key];
    renderPlannerSummary(_plannerLastFlows);
}

/** 依 flows 彙總: 金錢/燃料/肥料消耗、機器數、輸出剩餘、輸入短缺 */
function computePlannerSummaryStats(flows) {
    const machineCounts = {};
    let heatTotal = 0, fertTotal = 0;

    Object.values(plannerState.nodes).forEach(node => {
        const ports = flows.nodePortsCache[node.id];
        if (!ports) return;
        if (ports.recipe && node.machineCount > 0) {
            const count = Math.ceil(node.machineCount - 0.000001);
            machineCounts[ports.recipe.machine] = (machineCounts[ports.recipe.machine] || 0) + count;
        }
        heatTotal += ports.heatItemsPerMin || 0;
        fertTotal += ports.fertItemsPerMin || 0;
    });

    const outputSurplus = {};
    const inputShortage = {};
    Object.keys(flows.portRemaining).forEach(key => {
        const val = flows.portRemaining[key];
        if (!(val > 0.001)) return;
        const parts = key.split('::'); // nodeId::item::dir
        const item = parts[1];
        const dir = parts[2];
        if (dir === 'out') outputSurplus[item] = (outputSurplus[item] || 0) + val;
        else if (dir === 'in') inputShortage[item] = (inputShortage[item] || 0) + val;
    });

    let goldTotal = 0;
    Object.entries(inputShortage).forEach(([item, qty]) => {
        const def = DB.items[item];
        if (def && def.buyPrice) goldTotal += def.buyPrice * qty;
    });

    return { machineCounts, heatTotal, fertTotal, outputSurplus, inputShortage, goldTotal };
}

function renderPlannerSummary(flows) {
    const panel = ensurePlannerSummaryPanel();
    if (!panel) return;
    flows = flows || plannerResolveFlows();

    if (_plannerSummaryCollapsed) {
        panel.classList.add('collapsed');
        panel.innerHTML = `<button class="planner-summary-min-btn" onclick="togglePlannerSummaryPanel()">☰ ${t('Summary', 'ui')}</button>`;
        return;
    }
    panel.classList.remove('collapsed');

    const stats = computePlannerSummaryStats(flows);

    const sectionHtml = (key, titleHtml, bodyHtml, count) => {
        const collapsed = _plannerSummarySectionCollapsed[key];
        return `
            <div class="planner-summary-section">
                <div class="planner-summary-section-header" onclick="togglePlannerSummarySection('${key}')">
                    <span class="planner-summary-arrow">${collapsed ? '▶' : '▼'}</span>
                    <span>${titleHtml}</span>
                    ${count != null ? `<span class="planner-summary-count">${count}</span>` : ''}
                </div>
                ${collapsed ? '' : `<div class="planner-summary-section-body">${bodyHtml}</div>`}
            </div>`;
    };

    // --- Section 1: Cost & Resources ---
    let costRows = '';
    if (stats.goldTotal > 0.0001) {
        costRows += `<div class="planner-summary-row"><img src="img/copper.png" class="item-icon-small"><span>${t('Coin', 'ui')}</span><span class="planner-summary-val" style="color:var(--gold);">${Math.ceil(stats.goldTotal).toLocaleString()}</span></div>`;
    }
    if (stats.heatTotal > 0.0001) {
        const fuelDef = DB.items[DB.settings.defaultFuel] || {};
        costRows += `<div class="planner-summary-row"><img src="img/item${fuelDef.id ?? 0}.png" class="item-icon-small"><span>${DB.settings.defaultFuel}</span><span class="planner-summary-val" style="color:var(--fuel);">${formatVal(stats.heatTotal)}/m</span></div>`;
    }
    if (stats.fertTotal > 0.0001) {
        const fertDef = DB.items[DB.settings.defaultFert] || {};
        costRows += `<div class="planner-summary-row"><img src="img/item${fertDef.id ?? 0}.png" class="item-icon-small"><span>${DB.settings.defaultFert}</span><span class="planner-summary-val" style="color:var(--bio);">${formatVal(stats.fertTotal)}/m</span></div>`;
    }
    if (!costRows) costRows = `<div class="planner-summary-empty">${t('None', 'ui')}</div>`;

    // --- Section 2: Machines ---
    const machineEntries = Object.entries(stats.machineCounts).sort((a, b) => b[1] - a[1]);
    let machineRows = machineEntries.map(([name, count]) => {
        const icon = `<img src="img/machines/${name.toLowerCase().replaceAll(' ', '-')}.png" class="item-icon-small" onerror="this.style.opacity='0'">`;
        return `<div class="planner-summary-row">${icon}<span>${t(name, 'machines')}</span><span class="planner-summary-val">${count}</span></div>`;
    }).join('');
    if (!machineRows) machineRows = `<div class="planner-summary-empty">${t('None', 'ui')}</div>`;

    // --- Section 3: Output surplus ---
    const outputEntries = Object.entries(stats.outputSurplus).sort((a, b) => b[1] - a[1]);
    let outputRows = outputEntries.map(([item, qty]) => {
        const def = DB.items[item] || {};
        return `<div class="planner-summary-row"><img src="img/item${def.id ?? 0}.png" class="item-icon-small"><span>${item}</span><span class="planner-summary-val" style="color:var(--profit);">${formatVal(qty)}/m</span></div>`;
    }).join('');
    if (!outputRows) outputRows = `<div class="planner-summary-empty">${t('None', 'ui')}</div>`;

    // --- Section 4: Input shortage ---
    const inputEntries = Object.entries(stats.inputShortage).sort((a, b) => b[1] - a[1]);
    let inputRows = inputEntries.map(([item, qty]) => {
        const def = DB.items[item] || {};
        return `<div class="planner-summary-row"><img src="img/item${def.id ?? 0}.png" class="item-icon-small"><span>${item}</span><span class="planner-summary-val" style="color:var(--danger);">${formatVal(qty)}/m</span></div>`;
    }).join('');
    if (!inputRows) inputRows = `<div class="planner-summary-empty">${t('None', 'ui')}</div>`;

    panel.innerHTML = `
        <div class="planner-summary-header">
            <span class="planner-summary-title">${t('Summary', 'ui')}</span>
            <button class="planner-summary-close-btn" onclick="togglePlannerSummaryPanel()" title="${t('Minimize', 'ui')}">×</button>
        </div>
        <div class="planner-summary-body">
            ${sectionHtml('cost', t('Total Load', 'ui'), costRows)}
            ${sectionHtml('output', t('Output', 'ui'), outputRows, outputEntries.length)}
            ${sectionHtml('input', t('Input', 'ui'), inputRows, inputEntries.length)}            
            ${sectionHtml('machines', t('Machines', 'ui'), machineRows, machineEntries.reduce((s, [, c]) => s + c, 0))}
        </div>
    `;
}
