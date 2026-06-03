/* ==========================================================================
   SECTION: CAULDRON STORAGE
   ========================================================================== */

const CAULDRON_STORAGE_KEY = "alchemy_cauldron_v1";

let cauldronState = {
    activeType: 0, // 0:煉金鍋 1:高級煉金鍋
    activeProfile: 0,
    favorites: [],
    profiles: [
        { candidates: [] }, // Profile 1
        { candidates: [] }, // Profile 2
        { candidates: [] }  // Profile 3
    ]
};

let cauldronCandidates = new Set(); // 存储被勾选的物品名
let cauldronCatFilter = "[All]";
let cauldronFilterItems = [null, null, null];

function isVaildCandidate(itemName) {
    const item = DB.items[itemName];
    return item && item.cauldronCost !== undefined && !(item.liquid);
}

// 初始化：在 alchemy_ui.js 的 init() 之后调用
function initCauldron() {
    loadCauldronSettings();
    populateCauldronCategories();
    renderCandidatePool();
    renderCauldronFavorites();
    translateText();
    pickFilterItem(1,true);
    pickFilterItem(2,true);
    switchCauldronType(cauldronState.activeType);
    switchCauldronProfile(cauldronState.activeProfile);
}

function loadCauldronSettings() {
    const saved = localStorage.getItem(CAULDRON_STORAGE_KEY);
    if (saved) {
        try {
            cauldronState = JSON.parse(saved);
        } catch (e) {
            console.error("Cauldron settings corrupt, using defaults.");
        }
    } else {
        // 如果是第一次运行，默認Profile 1為全選
        cauldronState.profiles[0].candidates = Object.keys(DB.items).filter(isVaildCandidate);        
        // 默认Profile 2為植物+晶石基底
        cauldronState.profiles[1].candidates = Array.from(getPresetCandidates('Herbs'));
        // 默认Profile 3為金幣+晶石基底
        cauldronState.profiles[2].candidates = Array.from(getPresetCandidates('Gold'));
    }
}

function saveCauldronSettings() {
    // 将 Set 同步回当前 Profile
    cauldronState.profiles[cauldronState.activeProfile].candidates = Array.from(cauldronCandidates);
    localStorage.setItem(CAULDRON_STORAGE_KEY, JSON.stringify(cauldronState));
}

function syncCandidatesFromProfile() {
    const currentList = cauldronState.profiles[cauldronState.activeProfile].candidates || [];
    cauldronCandidates = new Set();
    currentList.forEach(key => {if(isVaildCandidate(key)) cauldronCandidates.add(key);});
    cauldronState.profiles[cauldronState.activeProfile].candidates = Array.from(cauldronCandidates);
}

function getPresetCandidates(poolType) {
    let candidateSet = new Set();
    try {
        let inputSet = new Set();
        if (poolType === 'Herbs') {
            Object.entries(DB.items).forEach(([name, item]) => {
                if (item.cauldronCost !== undefined && item.nutrientCost !== undefined) {
                    candidateSet.add(name);
                    inputSet.add(name);
                }
            });
        }
        else if (poolType === 'Gold') {
            Object.entries(DB.items).forEach(([name, item]) => {
                if (item.cauldronCost !== undefined && (item.buyPrice !== undefined || item.category === 'Currency')) {
                    inputSet.add(name);
                    // Raw Materials has negative maxStack, it's not suitable for cauldron
                    if (item.category !== 'Raw Materials' && item.cauldronCost !== 750) candidateSet.add(name);
                }
            });
        }        

        for (let round = 0; round < 3; round++) {
            let outputSet = new Set();
            for (const { inputs, outputs, machine } of DB.recipes) {
                const inKeys = Object.keys(inputs);
                const outKeys = Object.keys(outputs);
                if (machine === 'Seed Plot' || DB.machines[machine].heatCost > 0) continue;
                if (inKeys.length === 1 && outKeys.length === 1 && inputSet.has(inKeys[0]) && isVaildCandidate(outKeys[0])) {
                    outputSet.add(outKeys[0]);
                    //console.log(outKeys[0] + "," + round);
                }
            }
            outputSet.forEach(item => candidateSet.add(item));
            inputSet = new Set(outputSet);
        }
    }
    catch (e) {
        console.error(e);
    }
    return candidateSet;
}

/* ==========================================================================
   SECTION: UI
   ========================================================================== */

function populateCauldronCategories() {
    const sel = document.getElementById('cauldron-cat-select');
    sel.innerHTML = '';
    
    const cats = ["[All]", "[Include]", "[Exclude]", "[Product]"];
    const itemCats = new Set();
    Object.values(DB.items).forEach(i => { if(i.category) itemCats.add(i.category); });
    const sortedCats = cats.concat(Array.from(itemCats));

    sortedCats.forEach(cat => {
        if (cat === "Liquid") return;
        let count = 0;
        let total = 0;

        Object.keys(DB.items).forEach(name => {
            const item = DB.items[name];
            if (!isVaildCandidate(name)) return;
            
            const isMatch = (cat === "[All]") || 
                            (cat === "[Include]" && cauldronCandidates.has(name)) ||
                            (cat === "[Exclude]" && !cauldronCandidates.has(name)) ||
                            (cat === "[Product]" && item.cauldronTarget) ||
                            (item.category === cat);
            
            if (isMatch) total++;
            if (isMatch && cauldronCandidates.has(name)) count++;
        });

        const option = new Option(`${t(cat, 'categories')} (${count}/${total})`, cat);
        sel.appendChild(option);
    });
}

function renderCandidatePool() {
    cauldronCatFilter = document.getElementById('cauldron-cat-select').value;
    const sortFlag = document.getElementById('cauldron-sort-by-cost').checked;
    const cauldronSortDescending = document.getElementById('cauldron-sort-order-btn').innerText === '🔽';
    const container = document.getElementById('candidate-pool');
    container.innerHTML = '';

    let array = [];
    Object.keys(DB.items).forEach(name => {
        const item = DB.items[name];
        if (!isVaildCandidate(name)) return;

        const isVisible = (cauldronCatFilter === "[All]") || 
                          (cauldronCatFilter === "[Include]" && cauldronCandidates.has(name)) ||
                          (cauldronCatFilter === "[Exclude]" && !cauldronCandidates.has(name)) ||
                          (cauldronCatFilter === "[Product]" && item.cauldronTarget) ||
                          (item.category === cauldronCatFilter);

        if (!isVisible) return;
        array.push({name: name, cost:item.cauldronCost||0, target:item.cauldronTarget||0, id:item.id||0});
    });

    if (sortFlag) array.sort((a, b) => (cauldronSortDescending ? (b.cost - a.cost) : (a.cost - b.cost)));

    array.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'candidate-item';
        const isChecked = cauldronCandidates.has(item.name) ? 'checked' : '';
        div.innerHTML = `
            <input type="checkbox" ${isChecked} onchange="toggleCandidate('${item.name}')">
            <img src="img/item${item.id ?? 0}.png" style="margin-left: 4px;" width="18" height="18" loading="lazy">
            <span class="cand-name" ${item.target > 0 ? 'style="color:#66ddff"' : ''}>${item.name}</span>
            <span class="cand-cost" >${item.cost.toFixed(2)}</span>
        `;
        container.appendChild(div);
    });
}

// [修改] switchCauldronType：加入 UI 顯示/隱藏切換，並在切換至 Type1 時清除 slot3 狀態
function switchCauldronType(index) {
    cauldronState.activeType = index;
    for (let i = 0; i < 2; i++) {
        document.getElementById(`cauldron-type-${i}`).classList.toggle('active', i === index);
    }

    const isAdvancedCauldron = index === 1;
    document.getElementById('slot3-wrapper').style.display = isAdvancedCauldron ? 'none' : '';
    document.getElementById('filter-2-diff').parentElement.style.display = isAdvancedCauldron ? '' : 'none';
    document.getElementById('filter-2-same').parentElement.style.display = isAdvancedCauldron ? '' : '';
    document.getElementById('filter-3-diff').parentElement.style.display = isAdvancedCauldron ? 'none' : '';
    document.getElementById('filter-3-same').parentElement.style.display = isAdvancedCauldron ? 'none' : '';

    if (document.getElementById('cauldron-real-time-calculation')?.checked) runCauldronSimulation();
}

function switchCauldronProfile(index) {    
    cauldronState.activeProfile = index;
    syncCandidatesFromProfile();
    for (let i = 0; i < 3; i++) {
        document.getElementById(`cauldron-tab-${i}`).classList.toggle('active', i === index);
    }
    populateCauldronCategories();
    renderCandidatePool();
    saveCauldronSettings();
    if (document.getElementById('cauldron-real-time-calculation')?.checked) runCauldronSimulation();
}

/**
 * 將目前 Profile 的候選清單重置為「草藥/植物」預設組
 */
function applyHerbPreset() {
    const herbSet = getPresetCandidates('Herbs');
    cauldronCandidates = new Set(herbSet);
    populateCauldronCategories();
    document.getElementById('cauldron-cat-select').value = cauldronCatFilter;
    renderCandidatePool();
    if (document.getElementById('cauldron-real-time-calculation')?.checked) runCauldronSimulation();
}

function toggleCauldronSortOrder() {
    document.getElementById('cauldron-sort-order-btn').innerText = document.getElementById('cauldron-sort-order-btn').innerText === '🔽' ? '🔼' : '🔽';
    renderCandidatePool();
}

function toggleCandidate(name) {
    if (cauldronCandidates.has(name)) cauldronCandidates.delete(name);
    else cauldronCandidates.add(name);
    populateCauldronCategories();
    document.getElementById('cauldron-cat-select').value = cauldronCatFilter;
    saveCauldronSettings();
    if (document.getElementById('cauldron-real-time-calculation')?.checked) runCauldronSimulation();
}

function bulkToggleCandidates(check) {
    Object.keys(DB.items).forEach(name => {
        const item = DB.items[name];
        if (!isVaildCandidate(name)) return;

        const isMatch = (cauldronCatFilter === "[All]") || 
                        (cauldronCatFilter === "[Include]" && cauldronCandidates.has(name)) ||
                        (cauldronCatFilter === "[Exclude]" && !cauldronCandidates.has(name)) ||
                        (cauldronCatFilter === "[Product]" && item.cauldronTarget) ||
                        (item.category === cauldronCatFilter);

        if (isMatch) {
            if (check) cauldronCandidates.add(name);
            else cauldronCandidates.delete(name);
        }
    });
    renderCandidatePool();
    populateCauldronCategories();
    document.getElementById('cauldron-cat-select').value = cauldronCatFilter;
    saveCauldronSettings();
    if (document.getElementById('cauldron-real-time-calculation')?.checked) runCauldronSimulation();
}

/**
 * 处理物品选择，复用已有的 Item Picker
 */
function pickFilterItem(slotIdx, clear = false) {
    if (clear) {
        cauldronFilterItems[slotIdx - 1] = null;
        updateFilterUI();
        return;
    }
    
    // 临时重写 selectItem 逻辑
    const originalSelectItem = window.selectItem;
    window.selectItem = (name) => {
        cauldronFilterItems[slotIdx - 1] = name;
        updateFilterUI();
        window.selectItem = originalSelectItem; // 还原
        runCauldronSimulation();
    };
    
    openItemPicker();
}

function updateFilterUI() {
    for (let i = 1; i <= 3; i++) {
        const slotEl = document.getElementById(`slot${i}`);
        const ctrlEl = document.getElementById(`slot-ctrl-${i}`);
        const val = cauldronFilterItems[i - 1];
        
        // 更新上方 Picker 文字
        slotEl.innerText = val ? val : t('Set Input') + ` ${i}`;
        slotEl.classList.toggle('active', !!val);

        // 更新下方控制列 HTML
        if (val) {
            const item = DB.items[val];
            ctrlEl.innerHTML = `
                <button class="swap-btn" onclick="shiftFilterItem(${i}, -1)">-</button>
                <img src="img/item${item.id ?? 0}.png" width="18" height="18" title="${val}">
                <span class="cand-cost">${Number(item.cauldronCost.toFixed(2))}</span>
                <button class="swap-btn" onclick="shiftFilterItem(${i}, 1)">+</button>
            `;
            ctrlEl.style.visibility = 'visible';
        } else {
            // 如果沒選中物品，可以選擇隱藏或顯示空的提示
            ctrlEl.innerHTML = `<button class="swap-btn" style="opacity:0.3" onclick="shiftFilterItem(${i}, 1)">+</button>`;
            // 或者直接 ctrlEl.style.visibility = 'hidden';
        }
    }
}

/**
 * 切換選中物品到上一個或下一個
 * @param {number} slotIdx 1, 2, 3
 * @param {number} delta -1 或 1
 */
function shiftFilterItem(slotIdx, delta) {
    const list = Object.keys(DB.items)
        .filter(isVaildCandidate)
        .sort((a, b) => DB.items[a].cauldronCost - DB.items[b].cauldronCost);

    if (list.length === 0) return;

    const currentItem = cauldronFilterItems[slotIdx - 1];
    let nextIdx = 0;

    if (currentItem) {
        const currentIdx = list.indexOf(currentItem);
        // 循環索引處理
        nextIdx = (currentIdx + delta + list.length) % list.length;
    } else {
        // 如果原本是空的，點擊 + 則從第一個開始，點擊 - 則從最後一個開始
        nextIdx = delta > 0 ? 0 : list.length - 1;
    }

    cauldronFilterItems[slotIdx - 1] = list[nextIdx];
    updateFilterUI();
    runCauldronSimulation();
}

/* ==========================================================================
   SECTION: ASYNC CAULDRON CALCULATION
   ========================================================================== */

let lastCauldronResults = {}; // 全局存储计算结果数据

/**
 * 线性插值函数：根据 cauldronTarget 计算时间与热值
 */
function getCauldronStats(target) {
    const t = [1, 100, 1000, 10000, 1000000];
    const times = [3, 6, 12, 24, 60];
    const heats = [1, 20, 200, 1500, 10000];

    // 边界处理
    if (target <= t[0]) return { time: times[0], heat: heats[0] };
    if (target >= t[t.length - 1]) return { time: times[times.length - 1], heat: heats[heats.length - 1] };

    // 查找区间
    for (let i = 0; i < t.length - 1; i++) {
        if (target >= t[i] && target <= t[i+1]) {
            const p = (target - t[i]) / (t[i+1] - t[i]); // 百分比
            return {
                time: Math.round((times[i] + p * (times[i+1] - times[i]))*10)/10,
                heat: Math.round((heats[i] + p * (heats[i+1] - heats[i]))*10)/10
            };
        }
    }
}

/**
 * 检查配方是否符合当前的过滤器
 */
async function runCauldronSimulation() {
    if (cauldronState.activeType === 1) {
        return runCauldronSimulationType1();
    }

    // 檢查條件
    const f100 = document.getElementById('filter-3-diff').checked;
    const f065 = document.getElementById('filter-2-same').checked;
    const f050 = document.getElementById('filter-3-same').checked;
    function isRecipeMatch(inputs, ratio) {
        if (ratio === 1.0 && !f100) return false;
        if (ratio === 0.65 && !f065) return false;
        if (ratio === 0.5 && !f050) return false;
        return true;
    }

    const validTargets = Object.keys(DB.items)
    .filter(name => DB.items[name].cauldronTarget !== undefined)
    .map(name => ({
        name: name,
        id: DB.items[name].id || 3000,
        target: DB.items[name].cauldronTarget,
        mult: DB.items[name].cauldronMulti || 1,
        cost: DB.items[name].cauldronCost || 0
    }));

    // 核心计算公式
    function getCauldronResult(n1, n2, n3) {
        const i1 = DB.items[n1], i2 = DB.items[n2], i3 = DB.items[n3];
        const c1 = i1.cauldronCost, c2 = i2.cauldronCost, c3 = i3.cauldronCost;

        let ratio = 1.0;
        if (n1 === n2 && n2 === n3) ratio = 0.5;
        else if (n1 === n2 || n2 === n3 || n1 === n3) ratio = 0.65;

        const T = (c1 + c2 + c3) * ratio;

        let bestItem = null;
        let bestValue = 0;
        let minDistance = Infinity;
        //let lastTieDistance = 0;
        for (let target of validTargets) {
            const dist = Math.abs((T - target.target) * (target.mult));
            if (dist < minDistance) {
                minDistance = dist;
                bestItem = target.name;
                bestValue = target.id;
            } else if (Math.abs(dist - minDistance) < 1e-7) {
                // Tie-breaker: choose one with less item id
                if (target.id < bestValue) {
                    bestItem = target.name;
                    bestValue = target.id;
                }
                //lastTieDistance = dist;
            }
        }
        //if (minDistance == lastTieDistance) console.log(`${n1} + ${n2} + ${n3} = ${bestItem}`);
        return { output: bestItem, totalValue: (c1 + c2 + c3) };
    }       
    
    const list = [...cauldronCandidates].filter(isVaildCandidate);
    list.sort((a, b) => (DB.items[b].cauldronCost - DB.items[a].cauldronCost)); // 由大至小

    const btn = document.getElementById('btn-run-cauldron');
    const progText = document.getElementById('cauldron-progress');
    btn.disabled = true;

    const resultsByOutput = {};
    const totalCombos = (list.length * (list.length + 1) * (list.length + 2)) / 6;
    let comboCount = 0; let recipeCount = 0;
    let lastUpdate = Date.now();
    let n0, n1, n2;

    if (list.length === 0) {
        // 特例: 在完全沒有候選物品時, 若有指定物品, 則將指定物品設為候選物品
        for (let i = 0; i < 3; i++) {
            if (cauldronFilterItems[i]) {
                list.push(cauldronFilterItems[i]);
            }
        }
    }

    for (let i = 0; i < list.length; i++) {        
        n0 = cauldronFilterItems[0] ?? list[i];
        for (let j = i; j < list.length; j++) {
            n1 = cauldronFilterItems[1] ?? list[j];
            for (let k = j; k < list.length; k++) {
                n2 = cauldronFilterItems[2] ?? list[k];

                // 计算 Ratio
                let ratio = 1.0;
                if (n0 === n1 && n1 === n2) ratio = 0.5;
                else if (n0 === n1 || n1 === n2 || n0 === n2) ratio = 0.65;

                // 提前过滤，减少后续计算压力
                if (isRecipeMatch([n0, n1, n2], ratio)) {
                    const res = getCauldronResult(n0, n1, n2);
                    // 輸入原料若包含輸出產物(且不是指定的原料), 則跳過這個組合
                    if (!([n0, n1, n2].includes(res.output) && !cauldronFilterItems.includes(res.output))) { 
                        if (!resultsByOutput[res.output]) resultsByOutput[res.output] = [];
                        resultsByOutput[res.output].push({
                            inputs: [n0, n1, n2],
                            totalValue: res.totalValue
                        });
                        recipeCount++;
                    }
                }
                comboCount++;
                if (cauldronFilterItems[2] != null) break;
            }

            if (Date.now() - lastUpdate > 150) {
                progText.innerText = `${Math.round((comboCount / totalCombos) * 100)}%`;
                await new Promise(r => setTimeout(r, 0));
                lastUpdate = Date.now();
            }
            if (cauldronFilterItems[1] != null) break;
        }
        if (cauldronFilterItems[0] != null) break;
    }

    lastCauldronResults = resultsByOutput; 

    renderCauldronResults(resultsByOutput);
    checkUnattainableItems(resultsByOutput);
    progText.innerText = `${t('Number of matching recipes')}: (${recipeCount}) `;
    btn.disabled = false;
}

/**
 * 高級煉金鍋 模式的計算函數
 * 輸入兩個原料 A 和 B，獲得產物 C。
 */
async function runCauldronSimulationType1() {

    const include2diff = document.getElementById('filter-2-diff').checked;
    const include2same = document.getElementById('filter-2-same').checked;

    function isRecipeMatch(nA, nB) {
        if (nA === nB) return include2same;
        else return include2diff;
    }

    const validTargets = Object.keys(DB.items)
        .filter(name => DB.items[name].cauldronTarget !== undefined)
        .map(name => ({
            name: name,
            id: DB.items[name].id || 3000,
            target: DB.items[name].cauldronTarget,
            mult: DB.items[name].cauldronMulti || 1,
        }));
    const maxTargetItem = validTargets.reduce((prev, current) => (prev.target > current.target) ? prev : current);
    const minTargetItem = validTargets.reduce((prev, current) => (prev.target < current.target) ? prev : current);

    function getType1Result(nA, nB) {
        const cA = DB.items[nA].cauldronCost;
        const cB = DB.items[nB].cauldronCost;
        // 計算基準分(T)，相同素材=該物品價值，不同素材=兩者價值的差值絕對值
        const T = (nA === nB) ? cA : Math.abs(cA - cB);

        let bestItem = null;
        let minDistance = Infinity;
        // 同類合成： 向上尋找最接近的更高階物品。
        if (nA === nB) {
            bestItem = maxTargetItem;
            for (let target of validTargets) {
                const dist = target.target - T;
                if (1e-7 < dist && dist < minDistance && target.name !== nA) {
                    minDistance = dist;
                    bestItem = target;
                }
            }            
        }
        // 異類合成： 向下尋找加權距離最接近的低階物品。
        else {
            bestItem = minTargetItem;
            for (let target of validTargets) {
                if (target.target > T) continue;
                const dist = (T - target.target) * target.mult;
                if (dist < minDistance && target.name !== nA && target.name !== nB) {
                    minDistance = dist;
                    bestItem = target;
                }
            }
        }
        return { output: bestItem.name, totalValue: T };
    }

    const list = [...cauldronCandidates].filter(isVaildCandidate);
    list.sort((a, b) => (DB.items[b].cauldronCost - DB.items[a].cauldronCost)); // 由大至小

    const btn = document.getElementById('btn-run-cauldron');
    const progText = document.getElementById('cauldron-progress');
    btn.disabled = true;

    const resultsByOutput = {};
    const totalCombos = (list.length * (list.length + 1)) / 2;
    let comboCount = 0; let recipeCount = 0;
    let lastUpdate = Date.now();

    if (list.length === 0) {
        // 特例: 在完全沒有候選物品時, 若有指定物品, 則將指定物品設為候選物品
        for (let i = 0; i < 2; i++) {
            if (cauldronFilterItems[i]) {
                list.push(cauldronFilterItems[i]);
            }
        }
    }

    for (let i = 0; i < list.length; i++) {
        const nA = cauldronFilterItems[0] ?? list[i];
        for (let j = i; j < list.length; j++) {
            const nB = cauldronFilterItems[1] ?? list[j];

            const res = getType1Result(nA, nB);
            if (isRecipeMatch(nA, nB))
            {
                if (!resultsByOutput[res.output]) resultsByOutput[res.output] = [];
                resultsByOutput[res.output].push({
                    inputs: [nA, nB],
                    totalValue: res.totalValue
                });
                recipeCount++;
            }

            comboCount++;
            if (cauldronFilterItems[1] != null) break;
        }

        if (Date.now() - lastUpdate > 150) {
            progText.innerText = `${Math.round((comboCount / totalCombos) * 100)}%`;
            await new Promise(r => setTimeout(r, 0));
            lastUpdate = Date.now();
        }
        if (cauldronFilterItems[0] != null) break;
    }

    lastCauldronResults = resultsByOutput;

    renderCauldronResults(resultsByOutput);
    checkUnattainableItems(resultsByOutput);
    progText.innerText = `${t('Number of matching recipes')}: (${recipeCount}) `;
    btn.disabled = false;
}

function renderCauldronResults(data) {
    const container = document.getElementById('cauldron-results');
    container.innerHTML = '';

    const sortedOutputs = Object.keys(data).sort((a, b) => 
        (DB.items[a].cauldronTarget || 0) - (DB.items[b].cauldronTarget || 0)
    );

    sortedOutputs.forEach(outName => {
        const outputItem = DB.items[outName];
        const recipes = data[outName];
        const stats = getCauldronStats(outputItem.cauldronTarget);
        const card = document.createElement('div');
        card.className = 'node cauldron-card collapsed';
        card.id = `cauldron-out-${outName.replace(/\s+/g, '-')}`; // 方便定位
        
        card.innerHTML = `
            <div class="node-content compact-card" data-out="${outName}" onclick="toggleCauldronCard(this, this.parentElement)">
                <span class="tree-arrow">▼</span>
                <img src="img/item${outputItem.id ?? 0}.png" width="24" height="24">
                <span class="item-link"><strong>${outName}</strong></span>                
                <span class="qty" style="font-size:0.9em;">(${recipes.length})</span>
                <span class="info-tag">${stats.time.toFixed(1)}s</span>
                <span class="heat-tag">${stats.heat.toFixed(1)}P/s</span>
                <div class="push-right details">T: ${outputItem.cauldronTarget}</div>
            </div>
            <div class="node-children" style="max-height: 300px; overflow-y: auto;">
                <div class="loading-placeholder" style="padding:10px; color:#666; font-size:0.8em;">Loading recipes...</div>
            </div>
        `;
        container.appendChild(card);
    });

    if (sortedOutputs.length === 1) {        
        // 當只有一個產物時, 直接展開
        const firstCardContent = container.querySelector('.node-content');
        if (firstCardContent) {
            // 直接呼叫函數，並模擬傳入 this (content) 和 parent (card)
            toggleCauldronCard(firstCardContent, firstCardContent.parentElement);
        }
    }
}

// 1. 建立一個查找用的快取，避免渲染時反覆遍歷陣列
function getFavoriteKey(out, inputs) {
    return `${out}|${[...inputs].sort().join(',')}`;
}

function toggleCauldronCard(thisCard, cardElement) {
    const childrenContainer = cardElement.querySelector('.node-children');
    const isCollapsed = cardElement.classList.contains('collapsed');
    
    if (isCollapsed) {
        // 每次展開都重新渲染（清除舊內容讓 DOM 輕量化）
        childrenContainer.innerHTML = '<div class="loading-placeholder"></div>';
        const outName = thisCard.dataset.out;
        renderRecipeRows(outName, childrenContainer);
    }
    cardElement.classList.toggle('collapsed');
}

function renderRecipeRows(outName, container) {
    const recipes = lastCauldronResults[outName];
    if (!recipes || recipes.length === 0) {
        container.innerHTML = '';
        return;
    }

    // 排序一次
    recipes.sort((a, b) => a.totalValue - b.totalValue);

    // 預先處理「收藏夾」索引，將複雜度從 O(N*M) 降到 O(N)
    const favSet = new Set(
        cauldronState.favorites
            .filter(f => f.output === outName)
            .map(f => [...f.inputs].sort().join(','))
    );

    container.innerHTML = '';
    const CHUNK_SIZE = 100; // 稍微調高，現代瀏覽器處理簡單 HTML 很快
    let currentIndex = 0;

    // 事件委託改進：只需綁定一次（通常建議在頁面初始化時綁定在父容器，而非此處）
    if (!container.dataset.hasListener) {
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-fav');
            if (btn) toggleFavoriteStar(e, btn);
        });
        container.dataset.hasListener = "true";
    }

    function renderChunk() {
        const end = Math.min(currentIndex + CHUNK_SIZE, recipes.length);
        const rows = [];

        for (let i = currentIndex; i < end; i++) {
            rows.push(createRecipeRowHtml(recipes[i], outName, favSet));
        }

        container.insertAdjacentHTML('beforeend', rows.join(''));
        currentIndex = end;

        if (currentIndex < recipes.length) {
            requestAnimationFrame(renderChunk);
        }
    }

    requestAnimationFrame(renderChunk);
}

function createRecipeRowHtml(r, outName, favSet) {
    const { inputs, totalValue } = r;
    
    // 使用預先計算好的 Set 進行查找，性能極大提升
    const sortedKey = [...inputs].sort().join(',');
    const isFav = favSet.has(sortedKey);
        
    let ratioTag = '';
    if (cauldronState.activeType === 0) {
        const [i0, i1, i2] = inputs;
        if (i0 === i1 && i1 === i2) {
            ratioTag = '<span style="color:var(--danger);"> * 0.5</span>';
        } else if (i0 === i1 || i1 === i2 || i2 === i0) {
            ratioTag = '<span style="color:var(--warn);"> * 0.65</span>';
        }
    }

    // 預先處理 HTML 片段
    const inputsHtml = inputs.map(n => {
        const item = DB.items[n] || { id: 0, cauldronCost: 0 };
        return `<img src="img/item${item.id}.png" width="18" height="18" loading="lazy">
                ${n} <small>(${item.cauldronCost.toFixed(1)})</small>`;
    }).join(' + ');

    const dataAttrs = inputs.map((n, idx) => `data-i${idx + 1}="${n}"`).join(' ');

    return `
    <div class="cauldron-recipe-row">
        <span class="recipe-text">
            ${inputsHtml} 
            <span style="color:var(--info);">➔</span> ${totalValue.toFixed(1)} ${ratioTag}
        </span>
        <button class="btn-fav ${isFav ? 'active' : ''}" 
            ${dataAttrs} data-out="${outName}">
            ${isFav ? '★' : '☆'}
        </button>
    </div>`;
}

function toggleFavoriteStar(event, btn) {
    event.stopPropagation();
    const { i1, i2, i3, out } = btn.dataset;
    const favs = cauldronState.favorites;

    // Type1 只有 2 個原料，Type0 有 3 個
    const recipeInputs = cauldronState.activeType === 1
        ? [i1, i2].filter(Boolean).sort()
        : [i1, i2, i3].filter(Boolean).sort();

    const idx = favs.findIndex(f => f.output === out && [...f.inputs].sort().join('|') === recipeInputs.join('|'));

    if (idx > -1) {
        favs.splice(idx, 1);
        btn.classList.remove('active');
        btn.innerText = '☆';
    } else {
        favs.push({ inputs: recipeInputs, output: out });
        btn.classList.add('active');
        btn.innerText = '★';
    }
    renderCauldronFavorites();
    saveCauldronSettings();
}

function checkUnattainableItems(producedData) {
    const producedSet = new Set(Object.keys(producedData));
    const unattainableList = [];

    for (let name in DB.items) {
        const item = DB.items[name];
        if (item.cauldronTarget !== undefined && !producedSet.has(name)) {
            unattainableList.push(name);
        }
    }

    unattainableList.sort((a, b) => DB.items[a].cauldronTarget - DB.items[b].cauldronTarget);

    const section = document.getElementById('unattainable-section');
    const container = document.getElementById('unattainable-list');
    
    if (unattainableList.length > 0) {
        section.style.display = 'block';
        container.innerHTML = unattainableList.map(name => `
            <div class="picker-item" style="border-color:#444; padding:5px;">
                <div style="font-size:1.0em; display: flex; align-items: center;"><img src="img/item${DB.items[name]?.id ?? 0}.png" alt="icon" width="24" height="24">${name}</div>
                <div style="font-size:0.9em; color:var(--warn);">T: ${DB.items[name].cauldronTarget}</div>
            </div>
        `).join('');
    } else {
        section.style.display = 'none';
    }
}

/* ==========================================================================
   SECTION: Favorite List
   ========================================================================== */

// [修改] toggleFavorite：改為接受不定數量的原料，最後一個參數固定為產物名
function toggleFavorite(...args) {
    const out = args[args.length - 1];
    const inputs = args.slice(0, -1);
    const favs = cauldronState.favorites;
    const recipe = { inputs: inputs, output: out };
    const sortedNew = [...inputs].sort().join('|');
    const idx = favs.findIndex(f => f.output === out && [...f.inputs].sort().join('|') === sortedNew);

    if (idx > -1) favs.splice(idx, 1);
    else favs.push(recipe);

    renderCauldronFavorites();
    saveCauldronSettings();
}

function renderCauldronFavorites() {
    const container = document.getElementById('cauldron-favorites');
    container.innerHTML = '';
    const favs = cauldronState.favorites || [];
    if (favs.length === 0) {
        container.innerHTML = `<div style="color:#666; padding:10px; font-size:0.85em; text-align:center;">${t('No saved recipes yet.')}</div>`;
        return;
    }

    // 1. 按产出物品分组
    const grouped = {};
    favs.forEach(f => {
        if (!grouped[f.output]) grouped[f.output] = [];
        grouped[f.output].push(f);
    });

    // 2. 渲染卡片
    const sortedOutputs = Object.keys(grouped).sort();
    
    sortedOutputs.forEach(outName => {
        let itemPerMin = 0; let heatPerItem = 0;
        const targetItem = DB.items[outName];
        if (targetItem !== undefined && targetItem.cauldronTarget !== undefined) {
            const stat = getCauldronStats(targetItem.cauldronTarget);
            itemPerMin = 60 / stat.time;
            heatPerItem = stat.time * stat.heat;
        }
        
        const items = grouped[outName];
        const card = document.createElement('div');        
        card.className = 'node cauldron-card'; // 收藏夹默认不折叠，或者保持 active        
        card.innerHTML = `
            <div class="node-content compact-card" onclick="this.parentElement.classList.toggle('collapsed')">
                <span class="tree-arrow">▼</span>
                <img src="img/item${DB.items[outName]?.id ?? 0}.png" width="24" height="24">
                <span class="item-link"><strong>${outName}</strong></span>
                <span class="qty">(${items.length})</span>
                <span class="info-tag">${itemPerMin > 0 ? itemPerMin.toFixed(2) + '/min' : ''}</span>
                <span class="heat-tag">${heatPerItem > 0 ? heatPerItem.toFixed(1) + 'P' : ''}</span>
            </div>
            <div class="node-children compact-children">
                ${items.map(f => `
                    <div class="cauldron-recipe-row">
                        <span class="recipe-text">
                            ${f.inputs.map(name => 
                                DB.items[name] 
                                    ? `<img src="img/item${DB.items[name].id}.png" width="18" height="18">${name}` 
                                    : `<span style="color:var(--warn);" title="找不到的物品名称">⚠️${name}</span>`
                            ).join(' + ')}
                        </span>
                        <button class="swap-btn" style="color:var(--warn); border-color:var(--warn);" 
                                onclick="toggleFavorite(${f.inputs.map(n => `'${n}'`).join(',')}, '${outName}')">
                            ×
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(card);
    });
}


function removeFavorite(idx) {
    cauldronState.favorites.splice(idx, 1);    
    renderCauldronFavorites();
    saveCauldronSettings();
}

/**
 * 导出当前 Profile 的收藏夹为文本格式 (.txt)
 * 格式：物品1 + 物品2 (+ 物品3) = 产物
 */
function exportCauldronFavorites() {
    const favs = cauldronState.favorites;
    if (favs.length === 0) return alert("No recipes to export.");
    
    // 转换为一行一个配方的格式
    const lines = favs.map(f => {
        return `${f.inputs.join(' + ')} = ${f.output}`;
    });
    
    const dataStr = lines.join('\n');
    const blob = new Blob([dataStr], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `cauldron_recipes.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * 从文本文件导入配方
 * 预期格式：物品1 + 物品2 (+ 物品3) = 产物
  */
function importCauldronFavorites() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = readerEvent => {
            try {
                const content = readerEvent.target.result;
                const lines = content.split(/\r?\n/); // 兼容 Windows 和 Unix 换行符
                const currentFavs = cauldronState.favorites;
                let importCount = 0;

                lines.forEach(line => {
                    if (!line.trim()) return; // 跳过空行

                    // 解析 "输入 = 输出"
                    const parts = line.split('=');
                    if (parts.length !== 2) return;

                    const output = parts[1].trim();
                    const inputs = parts[0].split('+').map(i => i.trim());

                    // 校验：支援 2 或 3 個輸入，且产物存在于数据库
                    if ((inputs.length === 2 || inputs.length === 3) && DB.items[output]) {
                        const sortedNew = [...inputs].sort();
                        
                        // 去重检查
                        const isExist = currentFavs.some(f => 
                            f.output === output && 
                            JSON.stringify([...f.inputs].sort()) === JSON.stringify(sortedNew)
                        );

                        if (!isExist) {
                            currentFavs.push({ inputs: sortedNew, output: output });
                            importCount++;
                        }
                    }
                });
                
                if (importCount > 0) {
                    saveCauldronSettings();
                    renderCauldronFavorites();
                    alert(`Successfully imported ${importCount} recipes!`);
                } else {
                    alert("No new or valid recipes found in the file.");
                }
            } catch (err) {
                alert("Failed to parse file: " + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

/**
 * 将收藏夹同步到主数据库 (DB.recipes)
 */
function syncCauldronToMainDB(notify = false) {
    const favs = cauldronState.favorites;
    if (favs.length === 0) return;
    //if (favs.length === 0) return alert("No recipes to sync.");
    //if (!confirm(`This will sync ${favs.length} recipes to the main calculator. Continue?`)) return;

    // 1. 移除旧的自动生成配方
    DB.recipes = DB.recipes.filter(r => !r.id.startsWith("AUTO_GENERATED_CAULDRON"));

    // 2. 转换并导入
    let importedCount = 0;
    favs.forEach((fav, index) => {
        const targetItem = fav.output;
        const targetDef = DB.items[targetItem];
        // 檢查目標物品是否存在, 檢查 inputs 陣列中的所有名稱是否都在 DB 中
        const isValid = targetDef !== undefined && 
                        fav.inputs.every(name => DB.items[name] !== undefined);
        if (!isValid) return;        

        // 计算插值数据
        const stats = getCauldronStats(targetDef.cauldronTarget || 0);

        // 处理输入物品计数 (例如 [Plank, Plank, Stone] -> {Plank: 2, Stone: 1})
        const inputCounts = {};
        let itemIdString = "";
        fav.inputs.forEach(name => {
            // 對於原料或聖物, 它們的maxStack是負數, 每次只會使用一小部分
            const inputDef = DB.items[name];
            let inputCount = 1;
            if (inputDef?.maxStack && inputDef.maxStack < 0) inputCount = 1.0 / (-inputDef.maxStack);
            inputCounts[name] = (inputCounts[name] || 0) + inputCount;
            itemIdString += `_${inputDef?.id ?? 0}`;
        });

        const machineType = fav.inputs.length === 3 ? "Cauldron" : "Advanced Cauldron";
        const newRecipe = {
            id: `AUTO_GENERATED_CAULDRON` + itemIdString,
            machine: machineType,
            inputs: inputCounts,
            outputs: { [targetItem]: 1 },
            baseTime: parseFloat(stats.time),
            // 注意：主数据库的 recipes 通常不直接存 heatCost，
            // 但为了兼容计算逻辑，我们可以把它作为一个特殊属性存入
            // 如果计算引擎支持读取配方级热耗，这里可以生效
            heatCost: parseFloat(stats.heat) 
        };

        DB.recipes.push(newRecipe);
        importedCount++;
    });
    console.log(`Synced ${importedCount} recipes from cauldron`);
    if (notify) alert(`Synced ${importedCount} recipes to the Production Tab! You can now select them in the calculator.`);
}


/* ==========================================================================
   SECTION: CAULDRON RECIPE MODAL (from recipe-modal shortcut)
   ========================================================================== */

let _cauldronModalState = {
    targetItem: null,
    cauldronType: 0,    // 0=普通(3格), 1=高級(2格)
    slots: [null, null, null],
};

function openCauldronRecipeModal(targetItem) {
    _cauldronModalState.targetItem = targetItem;
    _cauldronModalState.cauldronType = 0;
    _cauldronModalState.slots = [null, null, null];

    const favs = cauldronState.favorites || [];
    const existing = favs.find(f => f.output === targetItem && f.inputs.length === 3);
    if (existing) {
        existing.inputs.forEach((name, i) => { _cauldronModalState.slots[i] = name; });
    }

    document.getElementById('cauldron-recipe-modal-title').innerText = t('Cauldron') + ' → ' + targetItem;
    _renderCauldronRecipeModal();
    document.getElementById('cauldron-recipe-modal').style.display = 'flex';
}

function _switchCauldronModalType(type) {
    _cauldronModalState.cauldronType = type;
    _cauldronModalState.slots = [null, null, null];

    const slotCount = type === 1 ? 2 : 3;
    const favs = cauldronState.favorites || [];
    const existing = favs.find(f => f.output === _cauldronModalState.targetItem && f.inputs.length === slotCount);
    if (existing) {
        existing.inputs.forEach((name, i) => { _cauldronModalState.slots[i] = name; });
    }
    _renderCauldronRecipeModal();
}

/**
 * 計算目標 item 的 cauldronTarget 上下界
 * 排序所有 validTargets 依 cauldronTarget，取鄰近點的中位數為界
 */
function _getCauldronTargetBounds(targetItem) {
    const sorted = Object.keys(DB.items)
        .filter(name => DB.items[name].cauldronTarget !== undefined)
        .map(name => ({ name, target: DB.items[name].cauldronTarget }))
        .sort((a, b) => a.target - b.target);

    const idx = sorted.findIndex(x => x.name === targetItem);
    if (idx === -1) return null;

    const self = sorted[idx].target;
    const lower = idx > 0
        ? (sorted[idx - 1].target + self) / 2
        : null; // 無左鄰
    const upper = idx < sorted.length - 1
        ? (self + sorted[idx + 1].target) / 2
        : null; // 無右鄰

    return { self, lower, upper };
}

/**
 * 計算當前 slots 的 T 值（普通鍋）
 */
function _calcCauldronModalT(slots, cauldronType) {
    const slotCount = cauldronType === 1 ? 2 : 3;
    const filled = slots.slice(0, slotCount);
    if (filled.some(s => !s)) return null;

    if (cauldronType === 0) {
        const [n0, n1, n2] = filled;
        const c0 = DB.items[n0]?.cauldronCost ?? 0;
        const c1 = DB.items[n1]?.cauldronCost ?? 0;
        const c2 = DB.items[n2]?.cauldronCost ?? 0;
        let ratio = 1.0;
        if (n0 === n1 && n1 === n2) ratio = 0.5;
        else if (n0 === n1 || n1 === n2 || n0 === n2) ratio = 0.65;
        return (c0 + c1 + c2) * ratio;
    } else {
        const [nA, nB] = filled;
        const cA = DB.items[nA]?.cauldronCost ?? 0;
        const cB = DB.items[nB]?.cauldronCost ?? 0;
        return nA === nB ? cA : Math.abs(cA - cB);
    }
}

/**
 * 計算當前 slots 的輸出物品（複用 cauldron.js 的判斷邏輯）
 */
function _calcCauldronModalOutput(slots, cauldronType, T) {
    if (T === null) return null;
    const slotCount = cauldronType === 1 ? 2 : 3;
    const filled = slots.slice(0, slotCount);

    const validTargets = Object.keys(DB.items)
        .filter(name => DB.items[name].cauldronTarget !== undefined)
        .map(name => ({
            name,
            id: DB.items[name].id ?? 3000,
            target: DB.items[name].cauldronTarget,
            mult: DB.items[name].cauldronMulti ?? 1,
        }));

    if (cauldronType === 0) {
        let best = null, bestDist = Infinity, bestId = 9999;
        for (const vt of validTargets) {
            const dist = Math.abs((T - vt.target) * vt.mult);
            if (dist < bestDist || (Math.abs(dist - bestDist) < 1e-7 && vt.id < bestId)) {
                bestDist = dist; best = vt.name; bestId = vt.id;
            }
        }
        return best;
    } else {
        const [nA, nB] = filled;
        const maxT = validTargets.reduce((p, c) => p.target > c.target ? p : c);
        const minT = validTargets.reduce((p, c) => p.target < c.target ? p : c);
        if (nA === nB) {
            let minDist = Infinity, best = maxT.name;
            for (const vt of validTargets) {
                const dist = vt.target - T;
                if (dist > 1e-7 && dist < minDist && vt.name !== nA) { minDist = dist; best = vt.name; }
            }
            return best;
        } else {
            let minDist = Infinity, best = minT.name;
            for (const vt of validTargets) {
                if (vt.target > T) continue;
                const dist = (T - vt.target) * vt.mult;
                if (dist < minDist && vt.name !== nA && vt.name !== nB) { minDist = dist; best = vt.name; }
            }
            return best;
        }
    }
}

function _renderCauldronRecipeModal() {
    const { targetItem, cauldronType, slots } = _cauldronModalState;
    const slotCount = cauldronType === 1 ? 2 : 3;
    const body = document.getElementById('cauldron-recipe-modal-body');

    // ── T 值與輸出計算 ──
    const T = _calcCauldronModalT(slots, cauldronType);
    const currentOutput = _calcCauldronModalOutput(slots, cauldronType, T);
    const allFilled = T !== null;
    const isMatch = allFilled && currentOutput === targetItem;

    // ── 目標上下界 ──
    const bounds = _getCauldronTargetBounds(targetItem);

    // ── 收藏狀態 ──
    const favs = cauldronState.favorites || [];
    const favCount = favs.filter(f => f.output === currentOutput && f.inputs.length === slotCount).length;
    const sortedCurrentKey = slots.slice(0, slotCount).filter(Boolean).sort().join(',');
    const isCurrentFav = allFilled && favs.some(f =>
        f.output === targetItem && [...f.inputs].sort().join(',') === sortedCurrentKey
    );

    // ── mini-tab ──
    const tabHtml = `
        <div style="display:flex; gap:4px; margin-bottom:2px;">
            <button class="tab-btn mini-tab ${cauldronType === 0 ? 'active' : ''}"
                onclick="_switchCauldronModalType(0)">${t('Cauldron')}</button>
            <button class="tab-btn mini-tab ${cauldronType === 1 ? 'active' : ''}"
                onclick="_switchCauldronModalType(1)">${t('Advanced Cauldron')}</button>
        </div>`;

    // ── Slots + ctrl 列 ──
    // 固定渲染 3 格，高級模式第 3 格隱藏（保留佔位）
    let slotsHtml = '<div style="display:flex; gap:8px; align-items:flex-start;">';
    for (let i = 0; i < 3; i++) {
        const hidden = i >= slotCount;
        const name = hidden ? null : slots[i];
        const def = name ? DB.items[name] : null;
        const cost = def ? Number(def.cauldronCost.toFixed(2)) : null;

        slotsHtml += `
            <div style="display:flex; flex-direction:column; align-items:center; gap:4px; ${hidden ? 'visibility:hidden;' : ''}">
                <!-- picker 按鈕 -->
                <button class="cauldron-slot-btn ${name ? 'active' : ''}"
                    onclick="_pickCauldronModalSlot(${i})"
                    style="display:flex; align-items:center; gap:4px; padding:5px 8px;
                           background:#1a1a1a; border:1px solid ${name ? '#557' : '#444'};
                           border-radius:4px; cursor:pointer; min-width:100px; color:inherit; font-size:0.85em;">
                    ${def
                        ? `<img src="img/item${def.id ?? 0}.png" width="18" height="18">`
                        : '<span style="opacity:0.4; font-size:1.1em;">＋</span>'}
                    <span>${name ?? (t('Set Input') + (i + 1))}</span>
                </button>
                <!-- cost 控制列：無論有無選取都佔位 -->
                <div style="display:flex; align-items:center; gap:3px; height:24px;">
                    ${name ? `
                        <button class="swap-btn" onclick="_shiftCauldronModalSlot(${i}, -1)">-</button>
                        <span style="font-size:0.8em; min-width:40px; text-align:center;">${cost}</span>
                        <button class="swap-btn" onclick="_shiftCauldronModalSlot(${i}, 1)">+</button>
                    ` : `
                        <button class="swap-btn" style="opacity:0.3;" onclick="_shiftCauldronModalSlot(${i}, 1)">+</button>
                    `}
                </div>
            </div>`;
    }
    slotsHtml += '</div>';

    // ── 輸出結果列 ──
    let resultHtml = '';
    if (allFilled && currentOutput) {
        const outDef = DB.items[currentOutput] || {};
        resultHtml = `
            <div style="padding:5px 8px; border-radius:4px; font-size:0.85em; display:flex; align-items:center; gap:6px;
                        background:${isMatch ? 'rgba(0,200,100,0.1)' : 'rgba(200,50,50,0.1)'};
                        border:1px solid ${isMatch ? 'var(--success,#4c4)' : 'var(--danger,#c44)'};">
                <img src="img/item${outDef.id ?? 0}.png" width="20" height="20">
                ${isMatch
                    ? `<span style="color:var(--success,#4c4);">✔ ${t('Current Product')}：${currentOutput}</span>`
                    : `<span style="color:var(--danger,#c44);">✘ ${t('Current Product')}：${currentOutput}</span>`}
            </div>`;
    }

    // ── 目標 cauldronTarget 及上下界 ──
    let boundsHtml = `
            <div style="font-size:0.8em; color:#aaa; display:flex; align-items:center; gap:8px;">
                <img src="img/item${DB.items[targetItem]?.id ?? 0}.png" width="20" height="20">
                <span><strong style="color:#ddd;">${targetItem}</strong></span>
                <span>${t('Target Value')} = <strong style="color:#ddd;">${bounds.self}</strong></span>`;
    if (bounds && slotCount === 3) {
        const lowerStr = bounds.lower !== null ? Number(bounds.lower.toFixed(2)) : '-∞';
        const upperStr = bounds.upper !== null ? Number(bounds.upper.toFixed(2)) : '+∞';
        boundsHtml += `<span style="color:#888;">${t('Valid Range')}：[${lowerStr}, ${upperStr}]</span>`;
    }
    boundsHtml += `</div>`;

    // ── T 值及與區間的差 ──
    let tInfoHtml = '';
    if (bounds) {
        if (!allFilled) {
            tInfoHtml = `---`;
        } else {
            const tDisplay = Number(T.toFixed(3));
            const inBounds =
                (bounds.lower === null || T >= bounds.lower) &&
                (bounds.upper === null || T <= bounds.upper);
            const color = inBounds ? 'var(--success,#4c4)' : 'var(--danger,#c44)';

            const dLower = bounds.lower !== null && slotCount === 3
                ? Number((T - bounds.lower).toFixed(3))
                : null;
            const dUpper = bounds.upper !== null && slotCount === 3
                ? Number((bounds.upper - T).toFixed(3))
                : null;

            const dLowerStr = dLower !== null
                ? `${t('Distance to lower bound')}：<span style="color:${dLower >= 0 ? '#4c4' : '#c44'};">${dLower >= 0 ? '+' : ''}${dLower}</span>`
                : '';
            const dUpperStr = dUpper !== null
                ? `${t('Distance to upper bound')}：<span style="color:${dUpper >= 0 ? '#4c4' : '#c44'};">${dUpper >= 0 ? '+' : ''}${dUpper}</span>`
                : '';

            tInfoHtml = `
                <div style="font-size:0.8em; display:flex; align-items:center; gap:12px;">
                    <span>${t('Current Value')} = <strong style="color:${color};">${tDisplay}</strong></span>
                    ${dLowerStr ? `<span>${dLowerStr}</span>` : ''}
                    ${dUpperStr ? `<span>${dUpperStr}</span>` : ''}
                </div>`;
        }
    }

    // ── 底部按鈕列 ──
    const bottomHtml = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">            
            <span style="font-size:0.8em; color:#888;"><img src="img/item${DB.items[currentOutput]?.id ?? 0}.png" width="18" height="18"> ${t('Current Product')} ${t('Saved Recipes')} : ${favCount}</span>
            <div style="display:flex; gap:6px;">
                <button class="swap-btn"
                    style="width:auto; padding:3px 10px; border-radius:4px; font-size:1.1em; ${allFilled ? '' : 'opacity:0.4; cursor:not-allowed;'}"
                    onclick="_toggleCauldronModalFav()" ${allFilled ? '' : 'disabled'}>
                    ${isCurrentFav ? '★' : '☆'}
                </button>
                <button class="swap-btn"
                    style="width:auto; padding:3px 12px; border-radius:4px;
                           background:${isMatch ? 'rgba(0,160,80,0.3)' : '#222'};
                           border-color:${isMatch ? 'var(--success,#4c4)' : '#555'};
                           ${isMatch ? '' : 'opacity:0.4; cursor:not-allowed;'}"
                    onclick="_applyCauldronModalRecipe()" ${isMatch ? '' : 'disabled'}>
                    ${t('Apply')}
                </button>
            </div>
        </div>`;

    body.innerHTML = `
        <div style="padding:12px; display:flex; flex-direction:column; gap:8px;">
            ${tabHtml}
            ${slotsHtml}
            ${resultHtml}
            ${boundsHtml}
            ${tInfoHtml}
            ${bottomHtml}
        </div>`;
}

/**
 * 和 cauldron page 的 shiftFilterItem 相同邏輯，但作用在 modal slots
 */
function _shiftCauldronModalSlot(slotIdx, delta) {
    const list = Object.keys(DB.items)
        .filter(isVaildCandidate)
        .sort((a, b) => DB.items[a].cauldronCost - DB.items[b].cauldronCost);
    if (list.length === 0) return;

    const current = _cauldronModalState.slots[slotIdx];
    let nextIdx = 0;
    if (current) {
        const idx = list.indexOf(current);
        nextIdx = (idx + delta + list.length) % list.length;
    } else {
        nextIdx = delta > 0 ? 0 : list.length - 1;
    }
    _cauldronModalState.slots[slotIdx] = list[nextIdx];
    _renderCauldronRecipeModal();
}

function _pickCauldronModalSlot(slotIdx) {
    const originalSelectItem = window.selectItem;
    window.selectItem = (name) => {
        if (!isVaildCandidate(name)) {
            alert(`"${name}" 不是有效的煉金原料（無 cauldronCost）`);
            window.selectItem = originalSelectItem;
            return;
        }
        _cauldronModalState.slots[slotIdx] = name;
        window.selectItem = originalSelectItem;
        closeModal('picker-modal');
        _renderCauldronRecipeModal();
    };
    openItemPicker();
}

function _toggleCauldronModalFav() {
    const { targetItem, cauldronType, slots } = _cauldronModalState;
    const slotCount = cauldronType === 1 ? 2 : 3;
    const inputs = slots.slice(0, slotCount).filter(Boolean).sort();
    if (inputs.length < slotCount) return;

    const favs = cauldronState.favorites;
    const key = inputs.join('|');
    const idx = favs.findIndex(f => f.output === targetItem && [...f.inputs].sort().join('|') === key);
    if (idx > -1) favs.splice(idx, 1);
    else favs.push({ inputs, output: targetItem });

    saveCauldronSettings();
    renderCauldronFavorites();
    _renderCauldronRecipeModal();
}

function _applyCauldronModalRecipe() {
    const { targetItem, cauldronType, slots } = _cauldronModalState;
    const slotCount = cauldronType === 1 ? 2 : 3;
    const inputs = slots.slice(0, slotCount).filter(Boolean).sort();
    if (inputs.length < slotCount) return;

    // 1. 確保已加入收藏
    const favs = cauldronState.favorites;
    const key = inputs.join('|');
    if (!favs.some(f => f.output === targetItem && [...f.inputs].sort().join('|') === key)) {
        favs.push({ inputs, output: targetItem });
    }
    saveCauldronSettings();
    renderCauldronFavorites();

    // 2. 同步到主 DB 並套用對應 recipe
    syncCauldronToMainDB();

    const matchedRecipe = (DB.recipes || []).find(r => {
        if (!r.id?.startsWith('AUTO_GENERATED_CAULDRON')) return false;
        if (!r.outputs?.[targetItem]) return false;
        return Object.keys(r.inputs).sort().join(',') === [...inputs].sort().join(',');
    });
    if (matchedRecipe) {
        DB.settings.preferredRecipes[targetItem] = matchedRecipe.id;
        persist();
    }

    // 3. 關閉兩個 modal 並重算
    closeModal('cauldron-recipe-modal');
    closeModal('recipe-modal');
    calculate();
}