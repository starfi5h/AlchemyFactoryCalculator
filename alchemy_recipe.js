/* ==========================================================================
   ALCHEMY RECIPE EXPLORER - CORE ENGINE
   ========================================================================== */

const RECIPE_STATE = {
    mode: 'batch', // 'batch' or 'min'
    visibleColumns: new Set(['id', 'name', 'flow', 'time', 'machine', 'gold', 'heat', 'nutr', 'alc_diff', 'alc_roi', 'net_diff', 'net_roi']),
    sortKey: 'net_diff',
    sortDir: -1,
    hpc: 20, // Heat per Cost
    npc: 20  // Nutrients per Cost
};

const COLUMN_DEFS = {
    id: { label: '#', sortable: true },
    name: { label: 'Product', sortable: true },
    flow: { label: 'Recipe Flow', sortable: false },
    time: { label: 'Time', sortable: true },
    machine: { label: 'Machine', sortable: true },
    gold: { label: 'Gold Cost', sortable: true },
    heat: { label: 'Heat', sortable: true },
    nutr: { label: 'Nutr', sortable: true },
    alc_diff: { label: 'Alc Δ', sortable: true },
    alc_roi: { label: 'Alc ROI', sortable: true },
    net_diff: { label: 'Net Δ', sortable: true },
    net_roi: { label: 'Net ROI', sortable: true }
};

/**
 * 初始化配方頁面
 */
function initRecipePage() {
    // 同步主介面等級
    document.getElementById('recipe-lvlAlchemy').value = document.getElementById('lvlAlchemy').value;
    document.getElementById('recipe-lvlFuel').value = document.getElementById('lvlFuel').value;
    document.getElementById('recipe-lvlFert').value = document.getElementById('lvlFert').value;

    // 初始化 HPC 和 NPC 顯示 (如果 HTML 中已有對應 Input)
    const hpcInput = document.getElementById('recipe-hpc');
    const npcInput = document.getElementById('recipe-npc');
    if (hpcInput) hpcInput.value = RECIPE_STATE.hpc;
    if (npcInput) npcInput.value = RECIPE_STATE.npc;

    renderColumnSelector();
    renderRecipeTable();
}

/**
 * 格式化數字：最大2位小數，超過1000顯示k
 */
function formatRecipeVal(val) {
    if (val === 0 || Math.abs(val) < 0.001) return '-';
    if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(2) + 'm';
    if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'k';
    return Number(val.toFixed(2)).toString();
}

/**
 * 顏色標記數值變化
 */
function colorize(val) {
    const color = val > 0.01 ? 'var(--profit)' : (val < -0.01 ? 'var(--danger)' : '#888');
    const sign = val > 0.01 ? '+' : '';
    return `<span style="color:${color}; font-weight:bold;">${sign}${formatRecipeVal(val)}</span>`;
}

/**
 * 調整等級或參數
 */
function adjustRecipeLvl(id, delta) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = Math.max(0, parseFloat(el.value) + delta);
    if (id === 'recipe-hpc') RECIPE_STATE.hpc = parseFloat(el.value);
    if (id === 'recipe-npc') RECIPE_STATE.npc = parseFloat(el.value);
    renderRecipeTable();
}

function setRecipeMode(m) {
    RECIPE_STATE.mode = m;
    document.querySelectorAll('.mini-tab').forEach(b => b.classList.remove('active'));
    document.getElementById('mode-' + m).classList.add('active');
    renderRecipeTable();
}

/**
 * 核心表格渲染
 */
function renderRecipeTable() {
    const tbody = document.getElementById('recipe-table-body');
    const thead = document.getElementById('recipe-table-header');
    const search = document.getElementById('recipe-search-input').value.toLowerCase();
    
    // 獲取最新參數
    RECIPE_STATE.hpc = parseFloat(document.getElementById('recipe-hpc')?.value) || 20;
    RECIPE_STATE.npc = parseFloat(document.getElementById('recipe-npc')?.value) || 20;

    // 1. 渲染 Sticky Header
    thead.innerHTML = '';
    Object.keys(COLUMN_DEFS).forEach(key => {
        if (!RECIPE_STATE.visibleColumns.has(key)) return;
        const th = document.createElement('th');
        let indicator = (RECIPE_STATE.sortKey === key) ? (RECIPE_STATE.sortDir === 1 ? ' 🔼' : ' 🔽') : '';
        th.innerHTML = t(COLUMN_DEFS[key].label, 'ui') + indicator;
        if (COLUMN_DEFS[key].sortable) {
            th.style.cursor = 'pointer';
            th.onclick = () => {
                if (RECIPE_STATE.sortKey === key) RECIPE_STATE.sortDir *= -1;
                else { RECIPE_STATE.sortKey = key; RECIPE_STATE.sortDir = 1; }
                renderRecipeTable();
            };
        }
        thead.appendChild(th);
    });

    // 2. 構建數據集 (原始配方 + 虛擬條目)
    let allEntries = [];

    // A. 原始配方
    DB.recipes.forEach((r, idx) => {
        allEntries.push({
            type: 'recipe',
            id: r.id,
            raw: r,
            machine: r.machine,
            outputs: r.outputs,
            inputs: r.inputs,
            stats: calculateRecipeRowStats(r)
        });
    });

    // B. 虛擬條目 1: 傳送門購買 (buyPrice > 0)
    Object.entries(DB.items).forEach(([name, item]) => {
        if (item.buyPrice > 0) {
            const virtualRecipe = {
                baseTime: 1.0, 
                machine: "Purchasing Portal",
                inputs: {}, 
                outputs: { [name]: 1 }
            };
            const stats = calculateRecipeRowStats(virtualRecipe, { isPortal: true, buyPrice: item.buyPrice });
            allEntries.push({
                type: 'portal',
                id: 'portal_' + name,
                raw: virtualRecipe,
                machine: "Purchasing Portal",
                outputs: virtualRecipe.outputs,
                inputs: virtualRecipe.inputs,
                stats: stats
            });
        }
    });

    // C. 虛擬條目 2: 苗圃種植 (nutrientCost > 0)
    Object.entries(DB.items).forEach(([name, item]) => {
        if (item.nutrientCost > 0) {
            let fertSpeed = 12;
            let machName = "Nursery";
            if (item.nutrientCost >= 30000) { fertSpeed = 20000; machName = "World Tree Nursery"; }
            
            const virtualRecipe = {
                baseTime: item.nutrientCost / fertSpeed,
                machine: machName,
                inputs: {},
                outputs: { [name]: 1 }
            };
            const stats = calculateRecipeRowStats(virtualRecipe, { isNursery: true, nutrientCost: item.nutrientCost });
            allEntries.push({
                type: 'nursery',
                id: 'nursery_' + name,
                raw: virtualRecipe,
                machine: machName,
                outputs: virtualRecipe.outputs,
                inputs: virtualRecipe.inputs,
                stats: stats
            });
        }
    });

    // 3. 過濾與排序
    let filteredData = allEntries.filter(entry => {
        const productMatch = Object.keys(entry.outputs).some(n => n.toLowerCase().includes(search));
        const machineMatch = entry.machine.toLowerCase().includes(search);
        return productMatch || machineMatch;
    });

    filteredData.sort((a, b) => {
        let vA, vB;
        if (RECIPE_STATE.sortKey === 'id') { vA = a.id; vB = b.id; }
        else if (RECIPE_STATE.sortKey === 'name') { vA = Object.keys(a.outputs)[0]; vB = Object.keys(b.outputs)[0]; }
        else if (RECIPE_STATE.sortKey === 'machine') { vA = a.machine; vB = b.machine; }
        else { vA = a.stats[RECIPE_STATE.sortKey]; vB = b.stats[RECIPE_STATE.sortKey]; }

        if (vA < vB) return -1 * RECIPE_STATE.sortDir;
        if (vA > vB) return 1 * RECIPE_STATE.sortDir;
        return 0;
    });

    // 4. 渲染行
    tbody.innerHTML = '';
    filteredData.forEach((item, idx) => {
        const tr = document.createElement('tr');
        const s = item.stats;
        Object.keys(COLUMN_DEFS).forEach(key => {
            if (!RECIPE_STATE.visibleColumns.has(key)) return;
            const td = document.createElement('td');
            switch(key) {
                case 'id': td.innerText = idx + 1; break;
                case 'name': 
                    td.innerHTML = `<div style="display:flex; gap:5px;">${Object.keys(item.outputs).map(n => `
                        <div style="text-align:center;">
                            <img src="img/item${DB.items[n]?.id || 0}.png" width="18"><br>
                            <span style="font-size:10px; font-weight:bold;">${n}</span>
                        </div>`).join('')}</div>`;
                    break;
                case 'flow': td.innerHTML = renderFlowIconDetailed(item.raw); break;
                case 'time': td.innerText = s.time.toFixed(1) + 's'; break;
                case 'machine': td.innerText = t(item.machine, 'machines'); break;
                case 'gold': td.innerText = formatRecipeVal(s.gold); if(s.gold > 0) td.style.color = 'var(--gold)'; break;
                case 'heat': td.innerText = formatRecipeVal(s.heat); if(s.heat > 0) td.style.color = 'var(--fuel)'; break;
                case 'nutr': td.innerText = formatRecipeVal(s.nutr); if(s.nutr > 0) td.style.color = 'var(--bio)'; break;
                case 'alc_diff': td.innerHTML = colorize(s.alc_diff); break;
                case 'alc_roi': td.innerText = s.alc_roi.toFixed(0) + '%'; break;
                case 'net_diff': td.innerHTML = colorize(s.net_diff); break;
                case 'net_roi': td.innerText = s.net_roi.toFixed(0) + '%'; break;
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

/**
 * 計算統計數據
 */
function calculateRecipeRowStats(r, virtualParams = null) {
    const alcLvl = parseInt(document.getElementById('recipe-lvlAlchemy').value) || 0;
    const alcMult = getAlchemyMult(alcLvl);
    const speedMult = getSpeedMult(parseInt(document.getElementById('lvlSpeed').value) || 0);
    
    // 計算單次循環時間
    const batchTime = (virtualParams?.isPortal) ? 1.0 : (r.baseTime / speedMult);
    const multiplier = (RECIPE_STATE.mode === 'min') ? (60 / batchTime) : 1;

    // 1. 產出價值
    let outAlcVal = 0;
    let mainOutName = Object.keys(r.outputs)[0];
    Object.keys(r.outputs).forEach(name => {
        let qty = r.outputs[name];
        // 只有原始配方且符合特定機器時才套用煉金倍率
        if (!virtualParams && name === mainOutName && ["Extractor", "Thermal Extractor", "Alembic", "Advanced Alembic"].includes(r.machine)) {
            qty *= alcMult;
            if (r.machine === "Thermal Extractor") qty *= 3;
        }
        outAlcVal += (DB.items[name]?.cauldronCost || 0) * qty;
    });

    // 2. 投入價值與金幣成本
    let inAlcVal = 0;
    let goldCost = 0;
    let heat = 0;
    let nutr = 0;

    if (virtualParams?.isPortal) {
        // 傳送門：Alc Δ = 產出價值 - 購買金幣
        goldCost = virtualParams.buyPrice;
        inAlcVal = goldCost; // 這裡將金幣視為投入價值
    } 
    else if (virtualParams?.isNursery) {
        // 苗圃：Alc Δ = 產出價值 - (Nutr / NPC)
        nutr = virtualParams.nutrientCost;
        inAlcVal = nutr / RECIPE_STATE.npc;
    } 
    else {
        // 普通配方
        Object.keys(r.inputs).forEach(name => {
            inAlcVal += (DB.items[name]?.cauldronCost || 0) * r.inputs[name];
            goldCost += (DB.items[name]?.buyPrice || 0) * r.inputs[name];
        });

        // 熱量計算
        if (DB.machines[r.machine]?.heatCost) {
            const m = DB.machines[r.machine];
            const p = DB.machines[m.parent];
            const hps = (m.heatCost * speedMult) + (p.heatSelf / (p.slots / (m.slotsRequired || 1)));
            heat = hps * batchTime;
        }
    }

    // 3. 價值變化計算
    // Alc Δ = 產出煉金總值 - 投入煉金總值
    const alcDiff = outAlcVal - inAlcVal;
    
    // Net Δ = Alc Δ - (Heat / HPC) - (Nutr / NPC) 
    // 注意：如果 Alc Δ 已經扣除過 Nutr (苗圃) 或 Gold (傳送門)，這裡不要重覆扣除
    let netDiff = alcDiff;
    if (!virtualParams?.isPortal) netDiff -= (goldCost / 1.0); // 這裡預設 Gold 是 1:1 影響 Net
    if (!virtualParams) netDiff -= (heat / RECIPE_STATE.hpc);
    if (!virtualParams?.isNursery) netDiff -= (nutr / RECIPE_STATE.npc);

    return {
        time: batchTime,
        gold: goldCost * multiplier,
        heat: heat * multiplier,
        nutr: nutr * multiplier,
        alc_diff: alcDiff * multiplier,
        alc_roi: inAlcVal > 0 ? (outAlcVal / inAlcVal * 100) : 0,
        net_diff: netDiff * multiplier,
        net_roi: (inAlcVal + (heat/RECIPE_STATE.hpc)) > 0 ? (outAlcVal / (inAlcVal + (heat/RECIPE_STATE.hpc)) * 100) : 0
    };
}

/**
 * 渲染流程圖 (18px 圖標 + 下方數字)
 */
function renderFlowIconDetailed(r) {
    let html = '<div class="recipe-flow-cell" style="display:flex; align-items:flex-start; gap:6px;">';
    
    // Inputs
    const inputKeys = Object.keys(r.inputs);
    if (inputKeys.length > 0) {
        html += '<div style="display:flex; gap:4px;">';
        inputKeys.forEach(k => {
            html += `<div style="text-align:center; min-width:24px;">
                <img src="img/item${DB.items[k]?.id || 0}.png" width="18" height="18">
                <div style="font-size:9px; color:#aaa;">${formatRecipeVal(r.inputs[k])}</div>
            </div>`;
        });
        html += '</div>';
    } else {
        html += '<div style="width:24px;"></div>'; // 占位
    }

    html += '<span class="arrow-divider" style="align-self:center; color:var(--accent);">→</span>';

    // Outputs
    html += '<div style="display:flex; gap:4px;">';
    Object.keys(r.outputs).forEach(k => {
        html += `<div style="text-align:center; min-width:24px;">
            <img src="img/item${DB.items[k]?.id || 0}.png" width="18" height="18">
            <div style="font-size:9px; color:var(--accent);">${formatRecipeVal(r.outputs[k])}</div>
        </div>`;
    });
    html += '</div></div>';
    return html;
}

/**
 * 渲染列選擇器
 */
function renderColumnSelector() {
    const container = document.getElementById('col-selector');
    if (!container) return;
    container.innerHTML = '';
    Object.keys(COLUMN_DEFS).forEach(key => {
        const label = document.createElement('label');
        label.className = 'checkbox-row';
        label.style.display = 'block';
        label.style.padding = '5px 10px';
        const chk = document.createElement('input');
        chk.type = 'checkbox';
        chk.checked = RECIPE_STATE.visibleColumns.has(key);
        chk.onchange = () => {
            if (chk.checked) RECIPE_STATE.visibleColumns.add(key);
            else RECIPE_STATE.visibleColumns.delete(key);
            renderRecipeTable();
        };
        label.appendChild(chk);
        label.appendChild(document.createTextNode(' ' + t(COLUMN_DEFS[key].label, 'ui')));
        container.appendChild(label);
    });
}