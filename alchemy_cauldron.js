/* ==========================================================================
   SECTION: CAULDRON STORAGE
   ========================================================================== */

const CAULDRON_STORAGE_KEY = "alchemy_cauldron_v1";

let cauldronState = {
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
let cauldronFilterItems = [null, null];

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
        // 如果是第一次运行，默认Profile 1為草藥
        cauldronState.profiles[0].candidates = Array.from(getPresetCandidates('Herbs'));
        // 默认Profile 1為金幣
        cauldronState.profiles[1].candidates = Array.from(getPresetCandidates('Gold'));
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
                if (machine === 'Planting') continue;
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
    
    const cats = ["[All]", "[Include]", "[Exclude]"];
    const itemCats = new Set();
    Object.values(DB.items).forEach(i => { if(i.category) itemCats.add(i.category); });
    const sortedCats = cats.concat(Array.from(itemCats));

    sortedCats.forEach(cat => {
        let count = 0;
        let total = 0;

        Object.keys(DB.items).forEach(name => {
            const item = DB.items[name];
            if (!isVaildCandidate(name)) return;
            
            const isMatch = (cat === "[All]") || 
                            (cat === "[Include]" && cauldronCandidates.has(name)) ||
                            (cat === "[Exclude]" && !cauldronCandidates.has(name)) ||
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
    const container = document.getElementById('candidate-pool');
    container.innerHTML = '';

    let array = [];
    Object.keys(DB.items).forEach(name => {
        const item = DB.items[name];
        if (!isVaildCandidate(name)) return;

        const isVisible = (cauldronCatFilter === "[All]") || 
                          (cauldronCatFilter === "[Include]" && cauldronCandidates.has(name)) ||
                          (cauldronCatFilter === "[Exclude]" && !cauldronCandidates.has(name)) ||
                          (item.category === cauldronCatFilter);

        if (!isVisible) return;
        array.push({name: name, cost:item.cauldronCost||0, target:item.cauldronTarget||0, id:item.id||0});
    });

    if (sortFlag) array.sort((a, b) => ((a.cost) - (b.cost)));

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

function switchCauldronProfile(index) {    
    cauldronState.activeProfile = index;
    syncCandidatesFromProfile();
    for (let i = 0; i < 3; i++) {
        document.getElementById(`cauldron-tab-${i}`).classList.toggle('active', i === index);
    }
    populateCauldronCategories();
    renderCandidatePool();
    saveCauldronSettings();
}

function toggleCandidate(name) {
    if (cauldronCandidates.has(name)) cauldronCandidates.delete(name);
    else cauldronCandidates.add(name);
    populateCauldronCategories();
    document.getElementById('cauldron-cat-select').value = cauldronCatFilter;
    saveCauldronSettings();
}

function bulkToggleCandidates(check) {
    Object.keys(DB.items).forEach(name => {
        const item = DB.items[name];
        if (!isVaildCandidate(name)) return;

        const isMatch = (cauldronCatFilter === "[All]") || 
                        (cauldronCatFilter === "[Include]" && cauldronCandidates.has(name)) ||
                        (cauldronCatFilter === "[Exclude]" && !cauldronCandidates.has(name)) ||
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
    for (let i = 1; i <= 2; i++) {
        const el = document.getElementById(`slot${i}`);
        const val = cauldronFilterItems[i - 1];
        el.innerText = val ? val : t('Set Item') + ` ${i}`;
        el.classList.toggle('active', !!val);
    }
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
                time: (times[i] + p * (times[i+1] - times[i])),
                heat: (heats[i] + p * (heats[i+1] - heats[i]))
            };
        }
    }
}

/**
 * 检查配方是否符合当前的过滤器
 */


async function runCauldronSimulation() {

    // 檢查條件
    const f100 = document.getElementById('f-ratio-100').checked;
    const f065 = document.getElementById('f-ratio-065').checked;
    const f050 = document.getElementById('f-ratio-050').checked;
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
    
    const list = Array.from(cauldronCandidates);
    list.sort((a, b) => (DB.items[a].cauldronCost - DB.items[b].cauldronCost));

    const btn = document.getElementById('btn-run-cauldron');
    const progText = document.getElementById('cauldron-progress');
    btn.disabled = true;

    const resultsByOutput = {};
    const totalCombos = (list.length * (list.length + 1) * (list.length + 2)) / 6;
    let comboCount = 0; let recipeCount = 0;
    let lastUpdate = Date.now();
    let n0, n1, n2;

    for (let i = 0; i < list.length; i++) {        
        n0 = cauldronFilterItems[0] ?? list[i];
        for (let j = i; j < list.length; j++) {
            n1 = cauldronFilterItems[1] ?? list[j];
            for (let k = j; k < list.length; k++) {
                n2 = list[k];

                // 计算 Ratio
                let ratio = 1.0;
                if (n0 === n1 && n1 === n2) ratio = 0.5;
                else if (n0 === n1 || n1 === n2 || n0 === n2) ratio = 0.65;

                // 提前过滤，减少后续计算压力
                if (isRecipeMatch([n0, n1, n2], ratio)) {
                    const res = getCauldronResult(n0, n1, n2);
                    if (!resultsByOutput[res.output]) resultsByOutput[res.output] = [];
                    resultsByOutput[res.output].push({
                        inputs: [n0, n1, n2],
                        totalValue: res.totalValue
                    });
                    recipeCount++;
                }
                comboCount++;
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
    progText.innerText = ` (${recipeCount}) `;
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
}

/**
 * 点击标题行时的处理：切换显示并按需生成 DOM
 */
function toggleCauldronCard(thisCard, cardElement) {
    const childrenContainer = cardElement.querySelector('.node-children');
    const isCollapsed = cardElement.classList.contains('collapsed');
    if (isCollapsed && childrenContainer.querySelector('.loading-placeholder')) {
        const { out } = thisCard.dataset;
        renderRecipeRows(out, childrenContainer);
    }
    cardElement.classList.toggle('collapsed');
}

function renderRecipeRows(outName, container) {
    const recipes = lastCauldronResults[outName];
    if (!recipes) {
        container.innerHTML = '';
        return;
    }

    // 1. 排序 (在運算之前先做)
    recipes.sort((a, b) => a.totalValue - b.totalValue);

    // 2. 清空容器並準備分批
    container.innerHTML = '';
    const CHUNK_SIZE = 50; // 每一幀渲染的數量，可以根據複雜度調整
    let currentIndex = 0;

    // 3. 定義分批執行函數
    function renderChunk() {
        const end = Math.min(currentIndex + CHUNK_SIZE, recipes.length);
        let fragmentHtml = "";

        for (let i = currentIndex; i < end; i++) {
            fragmentHtml += createRecipeRowHtml(recipes[i], outName);
        }

        // 使用 insertAdjacentHTML 避免清空原有內容
        container.insertAdjacentHTML('beforeend', fragmentHtml);
        
        currentIndex = end;

        // 如果還沒畫完，請求下一幀繼續
        if (currentIndex < recipes.length) {
            requestAnimationFrame(renderChunk);
        }
    }

    // 4. 事件委託 (只需綁定一次，建議放在外部初始化)
    if (!container.dataset.hasListener) {
        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-fav');
            if (btn) toggleFavoriteStar(e, btn);
        });
        container.dataset.hasListener = "true";
    }

    // 開始渲染
    requestAnimationFrame(renderChunk);
}

function createRecipeRowHtml(r, outName) {
    const { inputs, totalValue } = r;
    const isFav = isRecipeFavorite(inputs, outName);
    
    let ratioTag = ``;
    const [i0, i1, i2, i3] = inputs;
    if (i0 === i1 && i1 === i2) ratioTag = `<span style="color:var(--danger);"> * 0.5</span>`;
    else if (i0 === i1 || i1 === i2 || i2 === i3) ratioTag = `<span style="color:var(--warn);"> * 0.65</span>`;

    const inputsHtml = inputs.map(n => {
        const item = DB.items[n] || { id: 0, cauldronCost: 0 };
        return `<img src="img/item${item.id ?? 0}.png" width="18" height="18" loading="lazy">${n} <small>(${Number(item.cauldronCost.toFixed(2))})</small>`;
    }).join(' + ');

    // 移除 inline onclick，改用 class 識別
    return `
    <div class="cauldron-recipe-row">
        <span class="recipe-text">
            ${inputsHtml} 
            <span style="color:var(--info);">➔</span> ${totalValue.toFixed(2)} ${ratioTag}
        </span>
        <button class="btn-fav ${isFav ? 'active' : ''}" 
            data-i1="${i0 || ''}" data-i2="${i1 || ''}" data-i3="${i2 || ''}" data-out="${outName}">
            ${isFav ? '★' : '☆'}
        </button>
    </div>`;
}

function isRecipeFavorite(inputs, out) {
    const favs = cauldronState.favorites;
    const sortedIn = [...inputs].sort();
    return favs.some(f => f.output === out && [...f.inputs].sort().join('|') === sortedIn.join('|'));
}

function toggleFavoriteStar(event, btn) {
    event.stopPropagation();
    const { i1, i2, i3, out } = btn.dataset;
    const favs = cauldronState.favorites;
    const recipeInputs = [i1, i2, i3].sort();
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

function toggleFavorite(i1, i2, i3, out) {
    const favs = cauldronState.favorites;
    const recipe = { inputs: [i1, i2, i3], output: out };
    const idx = favs.findIndex(f => f.output === out && f.inputs.every(v => recipe.inputs.includes(v)));

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
        let itemPerMin = 0;
        const targetItem = DB.items[outName];
        if (targetItem !== undefined && targetItem.cauldronTarget !== undefined) itemPerMin = 60 / getCauldronStats(targetItem.cauldronTarget).time;
        
        const items = grouped[outName];
        const card = document.createElement('div');        
        card.className = 'node cauldron-card'; // 收藏夹默认不折叠，或者保持 active        
        card.innerHTML = `
            <div class="node-content compact-card" onclick="this.parentElement.classList.toggle('collapsed')">
                <span class="tree-arrow">▼</span>
                <img src="img/item${DB.items[outName]?.id ?? 0}.png" width="24" height="24">
                <span class="item-link"><strong>${outName}</strong></span>
                <span class="qty">(${items.length})</span>
                <span class="info-tag">${itemPerMin > 0 ? itemPerMin.toFixed(1) + '/min' : ''}</span>
            </div>
            <div class="node-children compact-children">
                ${items.map(f => `
                    <div class="cauldron-recipe-row">
                        <span class="recipe-text">
                            <img src="img/item${DB.items[f.inputs[0]]?.id ?? 0}.png" width="18" height="18">${f.inputs[0]} + 
                            <img src="img/item${DB.items[f.inputs[1]]?.id ?? 0}.png" width="18" height="18">${f.inputs[1]} + 
                            <img src="img/item${DB.items[f.inputs[2]]?.id ?? 0}.png" width="18" height="18">${f.inputs[2]}
                        </span>
                        <button class="swap-btn" style="color:var(--warn); border-color:var(--warn);" 
                                onclick="toggleFavorite('${f.inputs[0]}','${f.inputs[1]}','${f.inputs[2]}','${outName}')">
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
 * 格式：物品1 + 物品2 + 物品3 = 产物
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
 * 预期格式：物品1 + 物品2 + 物品3 = 产物
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

                    // 校验：必须有 3 个输入，且产物存在于数据库
                    if (inputs.length === 3 && DB.items[output]) {
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
    favs.forEach((fav, index) => {
        const targetItem = fav.output;
        const targetDef = DB.items[targetItem];
        if (!targetDef) return;

        // 计算插值数据
        const stats = getCauldronStats(targetDef.cauldronTarget || 0);

        // 处理输入物品计数 (例如 [Plank, Plank, Stone] -> {Plank: 2, Stone: 1})
        const inputCounts = {};
        fav.inputs.forEach(name => {
            // 對於原料或聖物, 它們的maxStack是負數, 每次只會使用一小部分
            const inputDef = DB.items[targetItem];
            let inputCount = 1;
            if (inputDef?.maxStack && inputDef.maxStack < 0) inputCount = 1.0 / (-inputDef.maxStack);
            inputCounts[name] = (inputCounts[name] || 0) + inputCount;
        });

        const newRecipe = {
            id: `AUTO_GENERATED_CAULDRON_${index + 1}`,
            machine: "Cauldron",
            inputs: inputCounts,
            outputs: { [targetItem]: 1 },
            baseTime: parseFloat(stats.time),
            // 注意：主数据库的 recipes 通常不直接存 heatCost，
            // 但为了兼容计算逻辑，我们可以把它作为一个特殊属性存入
            // 如果计算引擎支持读取配方级热耗，这里可以生效
            heatCost: parseFloat(stats.heat) 
        };

        DB.recipes.push(newRecipe);
    });
    console.log(`Synced ${favs.length} recipes from cauldron`);
    if (notify) alert(`Synced ${favs.length} recipes to the Production Tab! You can now select them in the calculator.`);
}
