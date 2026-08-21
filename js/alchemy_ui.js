// alchemy_ui.js: Shared UI logic: settings, combobox, item picker, slider, and modals

// COMBOBOX GLOBALS
let allItemsList = [];
let currentFocus = -1;

// ITEM PICKER GLOBALS
let currentPickerCategory = "[All]";
let currentPickerTier = 0; // 0 = 不篩選
let currentPickerProps = new Set(); // 'sellPrice' | 'wholesalePrice' | 'cauldronTarget'
const PICKER_PROP_DEFS = [
    { key: 'sellPrice',      label: 'Sell Price' },
    { key: 'wholesalePrice', label: 'Wholesale Price' },
    { key: 'cauldronTarget', label: 'Cauldron Target' }
];

const ATHANOR_CATALYSTS = [
    { id: 'unstable', label: '🧪 Unstable', charges: 180 },
    { id: 'fertile',  label: '🌿 Fertile', charges: 240  },
    { id: 'resonant', label: '✨ Resonant', charges: 1500 },
    { id: 'eternal',  label: '♾️ Eternal', charges: 99999  },
];

/* ==========================================================================
   SECTION: SLIDER LOGIC
   ========================================================================== */

const BELT_FRACTIONS = [
    // Low end precision
    { n: 1, d: 12, label: "1/12" },      // ~0.083
    { n: 1, d: 10, label: "1/10" },      // 0.1
    
    // Mid range (Standard factory ratios)
    { n: 1, d: 8,  label: "1/8" },     // 0.125
    { n: 1, d: 6,  label: "1/6" },     // ~0.166
    { n: 1, d: 5,  label: "1/5" },     // 0.2
    { n: 1, d: 4,  label: "1/4" },     // 0.25
    { n: 1, d: 3,  label: "1/3" },     // ~0.333
    { n: 2, d: 5,  label: null },      // 0.4
    
    // High range (Major splits)
    { n: 1, d: 2,  label: "1/2" },     // 0.5
    { n: 3, d: 5,  label: null },      // 0.6
    { n: 2, d: 3,  label: "2/3" },     // ~0.666
    { n: 3, d: 4,  label: "3/4" },     // 0.75
    { n: 4, d: 5,  label: "4/5" },     // 0.8
    { n: 5, d: 6,  label: "5/6" },     // ~0.833 (Unhidden per request)
    { n: 1, d: 1,  label: "Full" }     // 1.0
];

// Helper: Get decimal value
function getFractionValue(fractionObj) {
    return fractionObj.n / fractionObj.d;
}

// Helper: Calculate items/min based on belt speed
function calculateRateFromFraction(fractionObj, currentBeltSpeed) {
    const value = getFractionValue(fractionObj);
    return value * currentBeltSpeed;
}

// Helper: Get Smart Text for Label
function getSmartLabel(currentRate, maxSpeed) {
    if (maxSpeed <= 0) return "0%";
    const ratio = currentRate / maxSpeed;
    
    // 1. Check for exact/near match in our constants
    const epsilon = 0.002; 
    const match = BELT_FRACTIONS.find(f => Math.abs((f.n/f.d) - ratio) < epsilon);
    
    const percent = (ratio * 100).toFixed(1) + "%";
    
    if (match) {
        const fracStr = (match.n === 1 && match.d === 1) ? "Full Belt" : `${match.n}/${match.d} Belt`;
        const isApprox = Math.abs((match.n/match.d) - ratio) > 0.000001;
        const prefix = isApprox ? "~" : "";
        return `${prefix}${fracStr}, ${percent}`;
    }
    
    return `${percent} Load`;
}

function renderSlider() {
    if (typeof BELT_FRACTIONS === 'undefined') {
        console.error("alchemy_constants.js not loaded.");
        return;
    }
    const slider = document.getElementById('beltSlider');
    const ticksContainer = document.getElementById('sliderTicks');
    const thumbWidth = 14; // Must match CSS --thumb-size
    
    // Set slider max to array length
    slider.max = BELT_FRACTIONS.length - 1;
    slider.value = BELT_FRACTIONS.length - 1; // Default to Full
    
    ticksContainer.innerHTML = '';
    
    BELT_FRACTIONS.forEach((frac, idx) => {
        const pct = (idx / (BELT_FRACTIONS.length - 1));
        
        // --- ALIGNMENT MATH ---
        // Range Input Logic: Thumb center moves from [ThumbWidth/2] to [Width - ThumbWidth/2]
        // This formula nudges the ticks inward based on percentage to align with center
        const leftPos = `calc(${pct * 100}% + (${(thumbWidth/2) - (thumbWidth * pct) + 2}px))`;
        
        const tick = document.createElement('div');
        tick.className = `tick-mark ${frac.label ? 'labeled' : ''}`;
        tick.style.left = leftPos;
        
        let labelHtml = '';
        if (frac.label) {
            if (frac.label === "Full") {
                labelHtml = `<div class="vertical-frac full-label">Full</div>`;
            } else if (frac.label.includes("/")) {
                const [n, d] = frac.label.split("/");
                labelHtml = `
                    <div class="vertical-frac">
                        <span class="num">${n}</span>
                        <span class="sep"></span>
                        <span class="den">${d}</span>
                    </div>`;
            } else {
                labelHtml = `<div class="vertical-frac">${frac.label}</div>`;
            }
        }
        
        tick.innerHTML = `<div class="tick-line"></div>${labelHtml}`;
        ticksContainer.appendChild(tick);
    });
}

function updateFromSlider() {
    if (typeof BELT_FRACTIONS === 'undefined') return;
    
    const sliderIndex = parseInt(document.getElementById('beltSlider').value);
    const fraction = BELT_FRACTIONS[sliderIndex];
    const lvlBelt = parseInt(document.getElementById('lvlBelt').value) || 0;
    const currentSpeed = getBeltSpeed(lvlBelt);
    
    const rate = calculateRateFromFraction(fraction, currentSpeed);
    
    // Update the input box
    const rateInput = document.getElementById('targetRate');
    rateInput.value = parseFloat(rate.toFixed(2));
    
    calculate();
}

/* ==========================================================================
   SECTION: COMBOBOX LOGIC
   ========================================================================== */
function prepareComboboxData() {
    const allItems = new Set(Object.keys(DB.items || {}));
    if(DB.recipes) DB.recipes.forEach(r => Object.keys(r.outputs).forEach(k => allItems.add(k)));
    allItemsList = Array.from(allItems).sort().map(name => {
        return { name: name, category: t((DB.items[name] ? DB.items[name].category : "Other"), 'categories') };
    });
}

function toggleCombobox() {
    const list = document.getElementById('combobox-list');
    const input = document.getElementById('targetItemInput');
    if(list.style.display === 'block') { closeCombobox(); } else { input.focus(); filterCombobox(); }
}

function updateComboIcon() {
    const input = document.getElementById('targetItemInput');
    const icon = document.getElementById('combo-btn');
    if(input.value.trim().length > 0) {
        icon.innerText = "✖";
        icon.style.color = "#ff5252";
    } else {
        icon.innerText = "▼";
        icon.style.color = "#888";
    }
}

function handleComboIconClick(e) {
    e.stopPropagation();
    const input = document.getElementById('targetItemInput');
    if(input.value.trim().length > 0) {
        input.value = "";
        filterCombobox();
        updateComboIcon();
        input.focus();
        updateURL();
    } else {
        toggleCombobox();
    }
}

function closeCombobox() { document.getElementById('combobox-list').style.display = 'none'; currentFocus = -1; }
function closeComboboxDelayed() { setTimeout(() => closeCombobox(), 200); }

function filterCombobox() {
    const input = document.getElementById('targetItemInput');
    const filter = input.value.toLowerCase();
    const list = document.getElementById('combobox-list');
    const ghost = document.getElementById('ghost-text');
    
    list.innerHTML = ''; list.style.display = 'block';
    updateComboIcon();
    
    let matches = allItemsList.filter(item => item.name.toLowerCase().includes(filter));
    matches.sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(filter);
        const bStarts = b.name.toLowerCase().startsWith(filter);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.name.localeCompare(b.name);
    });

    matches.forEach((item) => {
        const div = document.createElement('div'); div.className = 'combo-item';
        div.innerHTML = `<span>${item.name}</span> <span class="combo-cat">${item.category}</span>`;
        div.onclick = function() { selectItem(item.name); };
        list.appendChild(div);
    });

    if (filter.length > 0 && matches.length > 0) {
        const topMatch = matches[0].name;
        if (topMatch.toLowerCase().startsWith(filter)) {
            const ghostSuffix = topMatch.substring(filter.length);
            ghost.innerText = input.value + ghostSuffix;
        } else { ghost.innerText = ""; }
    } else { ghost.innerText = ""; }
}

function handleComboKey(e) {
    const list = document.getElementById('combobox-list');
    const items = list.getElementsByClassName('combo-item');
    const input = document.getElementById('targetItemInput');
    const ghost = document.getElementById('ghost-text');

    if (e.key === 'ArrowDown') {
        currentFocus++; if (currentFocus >= items.length) currentFocus = 0; setActive(items); e.preventDefault();
    } else if (e.key === 'ArrowUp') {
        currentFocus--; if (currentFocus < 0) currentFocus = items.length - 1; setActive(items); e.preventDefault();
    } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentFocus > -1 && items.length > 0) { items[currentFocus].click(); } 
        else if (ghost.innerText.length > input.value.length) { selectItem(ghost.innerText); } 
        else if (items.length > 0) { items[0].click(); } 
        else { closeCombobox(); calculate(); }
    } else if (e.key === 'Tab') {
        if (ghost.innerText.length > input.value.length) { e.preventDefault(); selectItem(ghost.innerText); } 
        else { closeCombobox(); }
    }
}

function setActive(items) {
    if (!items) return;
    for (let i = 0; i < items.length; i++) { items[i].classList.remove('selected'); }
    if (currentFocus >= 0 && currentFocus < items.length) {
        items[currentFocus].classList.add('selected'); items[currentFocus].scrollIntoView({ block: 'nearest' });
        const name = items[currentFocus].getElementsByTagName('span')[0].innerText;
        document.getElementById('targetItemInput').value = name;
        document.getElementById('ghost-text').innerText = "";
        updateComboIcon();
    }
}

function selectItem(name) {
    const input = document.getElementById('targetItemInput'); input.value = name;
    document.getElementById('ghost-text').innerText = ""; closeCombobox(); updateComboIcon(); updateFromSlider(); 
}

function selectRate(rate) {
    document.getElementById('targetRate').disabled = false;
    document.getElementById('targetRate').value = rate;
}

function recalculate(item, rate) {
    selectItem(item);
    selectRate(rate);
    const machineToggle = document.getElementById('machineModeToggle');
    if (machineToggle?.checked) {
        machineToggle.checked = false;
    }
    calculate();
}

/* ==========================================================================
   SECTION: JS - Multiple Inputs
   ========================================================================== */

function switchCalcModeTab(isMulti) {
    document.getElementById('modeToggle').checked = isMulti;
    document.getElementById('calc-mode-btn-single').classList.toggle('active', !isMulti);
    document.getElementById('calc-mode-btn-multi').classList.toggle('active', isMulti);
    toggleCalcMode();
}

function toggleCalcMode() {
    const isMulti = document.getElementById('modeToggle').checked;
    document.getElementById('single-target-ui').style.display = isMulti ? 'none' : 'block';
    document.getElementById('multi-target-ui').style.display = isMulti ? 'block' : 'none';
    
    // 如果進入多產物模式且清單為空，先嘗試載入儲存的列表，沒找到再預設加一列
    const list = document.getElementById('multi-target-list');
    if (isMulti) {
        if (list.children.length === 0) loadMultiTargets();
        if (list.children.length === 0) addMultiTargetRow();
    }    
    calculate();
}

function addMultiTargetRow(itemName, rate = 0) {
    const container = document.getElementById('multi-target-list');
    const itemDef = DB.items[itemName] || { id: 0 };
    if (!itemName) itemName = t('Target Item');
    
    const row = document.createElement('div');
    row.className = 'multi-target-row';
    row.dataset.item = itemName;

    if (rate === 0) {
        const lvlBelt = parseInt(document.getElementById('lvlBelt').value) || 0;
        rate = getBeltSpeed(lvlBelt);
    }

    row.innerHTML = `
        <span class="drag-handle" title="Drag to reorder">⠿</span>
        <div class="mini-picker" onclick="pickMultiTargetRow(this)">
            <img src="img/item${itemDef.id}.png" width="20" height="20">
            <span class="item-name-label">${itemName}</span>
        </div>
        <input type="number" class="multi-rate-input" value="${rate}" oninput="calculate()">
        <button class="swap-btn" onclick="this.parentElement.remove(); calculate();" style="color:var(--danger); border-color:var(--danger);">x</button>
    `;
    
    container.appendChild(row);
    _initDragHandle(row.querySelector('.drag-handle'), row); // ← 新增
}

function _initDragHandle(handle, row) {
    handle.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        handle.setPointerCapture(e.pointerId);

        const container = document.getElementById('multi-target-list');
        row.classList.add('dragging');

        let targetRow = null;
        let insertBefore = true;

        const onMove = (e) => {
            const siblings = [...container.querySelectorAll('.multi-target-row:not(.dragging)')];
            siblings.forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom'));
            targetRow = null;

            for (const r of siblings) {
                const rect = r.getBoundingClientRect();
                if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
                    insertBefore = e.clientY < rect.top + rect.height / 2;
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
            container.querySelectorAll('.multi-target-row')
                .forEach(r => r.classList.remove('drag-over-top', 'drag-over-bottom'));

            if (targetRow) {
                container.insertBefore(row, insertBefore ? targetRow : targetRow.nextSibling);
                calculate();
            }
        };

        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onUp);
    });
}

function pickMultiTargetRow(pickerEl) {
    const row = pickerEl.parentElement;
    const label = pickerEl.querySelector('.item-name-label');
    const img = pickerEl.querySelector('img');
    
    // 暫時重寫全域 selectItem，以便 Picker 選中時更新這一個 Row
    const originalSelectItem = window.selectItem;
    window.selectItem = (name) => {
        const itemDef = DB.items[name] || { id: 0 };
        row.dataset.item = name;
        label.innerText = name;
        img.src = `img/item${itemDef.id}.png`;
        
        window.selectItem = originalSelectItem; // 恢復原有的選擇邏輯
        calculate();
    };
    
    openItemPicker();
}

function saveMultiTargets(e) {
    const targets = [];
    const rows = document.querySelectorAll('.multi-target-row');    
    rows.forEach(row => {
        const item = row.dataset.item;
        const rate = parseFloat(row.querySelector('.multi-rate-input').value) || 0;
        if (item) {
            targets.push({ item, rate });
        }
    });
    if (targets.length === 0) {
        console.log(t("List is empty, nothing to save.", "ui"));
        return;
    }
    DB.settings.multiTargets = targets;
    persist();
    if(e?.currentTarget) flashButton(e.currentTarget);
}

function loadMultiTargets(e) {
    if (!DB.settings.multiTargets || DB.settings.multiTargets.length === 0) {
        console.log(t("No saved list found.", "ui"));
        return;
    }
    const container = document.getElementById('multi-target-list');
    container.innerHTML = ''; // 清空目前清單
    DB.settings.multiTargets.forEach(target => {
        addMultiTargetRow(target.item, target.rate);
    });
    calculate(); // 重新計算
    flashButton(e.currentTarget);
}

/**
 * 快速將多產物清單設為 [selectedFuel, selectedFert] 各一列，
 * 速率各自為「單一機台滿載」速率
 */
function quickSetFuelFertTargets() {
    const fuelItem = document.getElementById('fuelSelect').value;
    const fertItem = document.getElementById('fertSelect').value;
    if (!fuelItem || !fertItem) return;

    // 確保處於多產物模式
    const modeToggle = document.getElementById('modeToggle');
    if (!modeToggle.checked) {
        modeToggle.checked = true;
        toggleCalcMode();
    }

    const container = document.getElementById('multi-target-list');
    container.innerHTML = '';

    const fuelRate = getSingleMachineRate(fuelItem);
    const fertRate = getSingleMachineRate(fertItem);

    addMultiTargetRow(fuelItem, Number((fuelRate || 0).toFixed(2)));
    addMultiTargetRow(fertItem, Number((fertRate || 0).toFixed(2)));

    calculate();
}

/**
 * 讓按鈕閃爍一下的輔助函數
 */
function flashButton(el) {
    if (!el) return;
    el.classList.remove('btn-flash'); // 重置動畫
    void el.offsetWidth;             // 觸發重繪 (Reflow) 以重啟動畫
    el.classList.add('btn-flash');
    setTimeout(() => el.classList.remove('btn-flash'), 600);
}

/* ==========================================================================
   SECTION: JS - UI HANDLERS (INPUTS/SETTINGS)
   ========================================================================== */

function togglePanelCollapse(btn) {
    const body = btn.closest('.panel')?.querySelector('.panel-body');
    if (!body) return;
    const collapsed = body.classList.toggle('collapsed');
    btn.textContent = collapsed ? '▶' : '▼';
}

function toggleFuel() {
    const btn = document.getElementById('btnSelfFuel');
    const enable = btn.classList.contains('btn-active-green');
    if(!enable) { btn.classList.remove('btn-inactive-red'); btn.classList.add('btn-active-green'); }
    else { btn.classList.remove('btn-active-green'); btn.classList.add('btn-inactive-red'); }
    calculate();
}

function toggleFert() {
    const btn = document.getElementById('btnSelfFert');
    const enable = btn.classList.contains('btn-active-green');
    if(!enable) { btn.classList.remove('btn-inactive-red'); btn.classList.add('btn-active-green'); }
    else { btn.classList.remove('btn-active-green'); btn.classList.add('btn-inactive-red'); }
    calculate();
}

function setNodeScale(val) {
    document.documentElement.style.setProperty('--node-scale', val);
    document.getElementById('nodeSizeLabel').innerText = t('UI Size') + ': ' + (val * 100).toFixed(0) + '%';
}

function onLogisticsChange() {
    const curFuel = document.getElementById('fuelSelect').value;
    const curFert = document.getElementById('fertSelect').value;
    const curHeatingDevice = document.getElementById('heatingDeviceSelect').value;

    DB.settings.defaultFuel = curFuel;
    DB.settings.defaultFert = curFert;
    DB.settings.nodeSize = document.getElementById('nodeScaleSlider').value;
    DB.settings.showMaxCap = document.getElementById('showMaxCap').checked;
    DB.settings.showFuelFert = document.getElementById('showFuelFert').checked;
    DB.settings.showRawMachineCount = document.getElementById('showRawMachineCount').checked;
    DB.settings.showHeatFert = document.getElementById('showHeatFert').checked;
    DB.settings.showBeltCount = document.getElementById('showBeltCount').checked;
    DB.settings.selectedHeatingDevice = curHeatingDevice;
    persist();
    calculate();
}

function saveCalcUISettings() {
    DB.settings.targetItem = document.getElementById('targetItemInput').value;
    DB.settings.targetRate = parseFloat(document.getElementById('targetRate').value) || 0;
    DB.settings.targetMachineCount = parseFloat(document.getElementById('targetMachine').value) || 0;
    DB.settings.machineModeToggle = document.getElementById('machineModeToggle').checked;
    DB.settings.selfFuel = document.getElementById('btnSelfFuel')?.classList.contains('btn-active-green') ?? false;
    DB.settings.selfFert = document.getElementById('btnSelfFert')?.classList.contains('btn-active-green') ?? false;
    persist();
}

function saveSettings(e) { ['lvlBelt','lvlSpeed','lvlAlchemy','lvlFuel','lvlFert', 'lvlSell'].forEach(k => { DB.settings[k] = parseInt(document.getElementById(k).value) || 0; }); persist(); }

function toggleControlMode(shouldCalculate = false) {
    const isMachineMode = document.getElementById('machineModeToggle').checked;    
    const rateInputs = document.querySelectorAll('.rate-ctrl, #targetRate');
    const machineInputs = document.querySelectorAll('.machine-ctrl, #targetMachine');
    rateInputs.forEach(el => el.disabled = isMachineMode);
    machineInputs.forEach(el => el.disabled = !isMachineMode);
    document.getElementById('group-rate').style.opacity = isMachineMode ? "0.5" : "1";
    document.getElementById('group-machine').style.opacity = isMachineMode ? "1" : "0.5";
    if (shouldCalculate) calculate();
}

function adjustMachine(delta) {
    const el = document.getElementById('targetMachine');
    if (el.disabled) return;
    let val = parseFloat(el.value) || 0;
    el.value = Math.max(0, (Math.round((val + delta) * 10) / 10)).toFixed(1);
    calculate();
}

function adjustRate(delta) { 
    const el = document.getElementById('targetRate'); 
    if(el.disabled) return; 
    let val = parseFloat(el.value) || 0; 
    el.value = (Math.round((val + delta) * 10) / 10).toFixed(1); 
    calculate(); 
}

function adjustInput(id, delta) { const el = document.getElementById(id); let val = parseInt(el.value) || 0; el.value = Math.max(0, val + delta); saveSettings(); }


/* ==========================================================================
   SECTION: MODAL LOGIC
   ========================================================================== */

function closeModal(id) { document.getElementById(id).style.display = 'none'; }

/**
 * Opens the item picker modal and populates it with categorized items.
 */
function openItemPicker() {
    document.getElementById('ui-picker-title').innerText = t('Select Item', 'ui');
    renderCategoryBar();
    renderPickerTierRow();
    renderPickerPropsBar();
    renderItemPicker();
    document.getElementById('picker-modal').style.display = 'flex';
}

// 渲染頂部的分類按鈕
function renderCategoryBar() {
    const bar = document.getElementById('picker-category-bar');
    bar.innerHTML = '';
    
    // 獲取所有存在的分類
    const categories = new Set(["[All]"]);
    Object.values(DB.items).forEach(item => {
        if (item.category) categories.add(item.category);
    });

    Array.from(categories).forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `category-btn ${currentPickerCategory === cat ? 'active' : ''}`;
        btn.innerText = t(cat, 'categories');
        btn.onclick = () => {
            currentPickerCategory = cat;
            renderCategoryBar(); // 刷新按鈕狀態
            renderItemPicker();  // 刷新列表
        };
        bar.appendChild(btn);
    });
}

function renderPickerTierRow() {
    const row = document.getElementById('picker-tier-row');
    if (!row) return;
    row.innerHTML = `
        <label style="flex-shrink:0; margin:0;">${t('Tier')}</label>
        <input type="range" id="picker-tier-slider" min="0" max="9" step="1"
               value="${currentPickerTier}" oninput="onPickerTierChange(this.value)">
        <span id="picker-tier-value" style="min-width:20px; text-align:center; color:var(--accent); font-weight:bold;">${currentPickerTier > 0 ? currentPickerTier : '—'}</span>
    `;
}

function onPickerTierChange(val) {
    currentPickerTier = parseInt(val) || 0;
    const valSpan = document.getElementById('picker-tier-value');
    if (valSpan) valSpan.innerText = currentPickerTier > 0 ? currentPickerTier : '—';
    renderItemPicker();
}

function renderPickerPropsBar() {
    const bar = document.getElementById('picker-props-bar');
    if (!bar) return;
    bar.innerHTML = `<label style="flex-shrink:0; margin:0;">${t('Properties')}</label>` +
        PICKER_PROP_DEFS.map(p => {
            const active = currentPickerProps.has(p.key);
            return `<button class="category-btn ${active ? 'active' : ''}" onclick="togglePickerProp('${p.key}')">${t(p.label, 'ui')}</button>`;
        }).join('');
}

function togglePickerProp(key) {
    if (currentPickerProps.has(key)) currentPickerProps.delete(key);
    else currentPickerProps.add(key);
    renderPickerPropsBar();
    renderItemPicker();
}

// 渲染物品列表
function renderItemPicker() {    
    const grid = document.getElementById('picker-items-grid');
    const filterText = document.getElementById('itemPickerSearch').value.toLowerCase();
    grid.innerHTML = '';

    // 將 DB.items 轉換為數組以保持順序（或按 ID 排序）
    const itemsToShow = Object.entries(DB.items).filter(([name, data]) => {
        const matchesCategory = (data.category === currentPickerCategory
            || currentPickerCategory === "[All]"
            || currentPickerCategory === t('Fuel') && data.heat > 0
            || currentPickerCategory === t('Fertilizer') && data.nutrientValue > 0
        );
        const matchesSearch = name.toLowerCase().includes(filterText);
        const matchesTier = currentPickerTier <= 0 || data.tier === currentPickerTier;
        const matchesProps = [...currentPickerProps].every(key => data[key] != null);
        return matchesCategory && matchesSearch && matchesTier && matchesProps;
    });

    const showCauldronCost = (document.getElementById('view-cauldron')?.classList.contains('active') || document.getElementById('cauldron-recipe-modal')?.style.display === 'flex') ?? false;
    const isGeneralCatagory = currentPickerCategory === "[All]";
    itemsToShow.forEach(([name, data]) => {
        const card = document.createElement('div');
        card.className = 'picker-item-row';

        card.innerHTML = `
            <img src="img/item${data.id ?? 0}.png" loading="lazy">
            <span class="picker-item-name">${name}</span>            
        `;

        if (showCauldronCost && data.cauldronCost) {
            card.innerHTML += `<span class="cand-cost" >${Number(data.cauldronCost.toFixed(2))}</span>`;
        }
        else if (isGeneralCatagory) {
            // 根據分類獲取標籤顏色類名
            const tagClass = `tag-${data.category ? data.category.replace(/\s+/g, '') : 'Other'}`;
            const translatedCat = t(data.category || "Other", 'categories');
            card.innerHTML += `<span class="picker-item-tag ${tagClass}">${translatedCat}</span>`;
        }

        card.onclick = () => {
            selectItem(name);
            closeModal('picker-modal');
        };

        grid.appendChild(card);
    });
}

function toggleCatalyst(recipeId, catalystId, item, btn) {
    if (!DB.settings.recipeModifiers[recipeId]) DB.settings.recipeModifiers[recipeId] = { catalysts: [] };
    const cats = DB.settings.recipeModifiers[recipeId].catalysts;
    const idx = cats.indexOf(catalystId);
    if (idx >= 0) { cats.splice(idx, 1); btn.classList.remove('active'); }
    else           { cats.push(catalystId); btn.classList.add('active'); }
    if (cats.length === 0) delete DB.settings.recipeModifiers[recipeId];
    persist();
    calculate();
    openRecipeModal(item, _recipeModalPathKey);
}

/* ==========================================================================
   SECTION: RECIPE MODAL
   ========================================================================== */

let _recipeModalScope = 'global'; // 'global' | 'node'
let _recipeModalPathKey = '';
let _recipeModalItem = '';

function openRecipeModal(item, pathKey = '') {
    _recipeModalItem = item;
    _recipeModalPathKey = pathKey;
    _recipeModalScope = DB.settings.nodeRecipeOverrides[pathKey] ? 'node' : 'global';

    _renderRecipeModalScopeBar();
    _renderRecipeModalList();

    document.getElementById('recipe-modal').style.display = 'flex';
}

function _renderRecipeModalScopeBar() {
    const titleEl = document.getElementById('recipe-modal-title');
    titleEl.innerText = t('Select Recipe for ') + _recipeModalItem;

    // 清除舊的 scope bar / cauldron 按鈕
    document.getElementById('recipe-modal-scope-bar')?.remove();
    titleEl.querySelectorAll('.cauldron-shortcut-btn').forEach(b => b.remove());

    const itemDef = DB.items[_recipeModalItem];
    if (itemDef && itemDef.cauldronTarget !== undefined) {
        const btn = document.createElement('button');
        btn.className = 'cauldron-shortcut-btn swap-btn';
        btn.style.cssText = 'margin-left:8px; width:auto; padding:2px 6px; border-radius:4px; font-size:0.8em;';
        btn.innerText = t('+ Add Cauldron Recipe');
        btn.onclick = (e) => { e.stopPropagation(); openCauldronRecipeModal(_recipeModalItem); };
        titleEl.appendChild(btn);
    }

    // 只有在有 pathKey 時才顯示 scope 開關（無 pathKey = 沒有節點context，只能全局）
    if (!_recipeModalPathKey) return;

    const bar = document.createElement('div');
    bar.id = 'recipe-modal-scope-bar';
    bar.style.cssText = 'display:flex; gap:4px; margin:8px 0;';
    bar.innerHTML = `
        <button class="tab-btn mini-tab ${_recipeModalScope === 'global' ? 'active' : ''}"
            onclick="_setRecipeModalScope('global')">🌐 ${t('Global')}</button>
        <button class="tab-btn mini-tab ${_recipeModalScope === 'node' ? 'active' : '' }" title="${_recipeModalPathKey}"
            onclick="_setRecipeModalScope('node')">📍 ${t('This Node Only')}</button>
    `;
    document.getElementById('recipe-list').insertAdjacentElement('beforebegin', bar);
}

function _setRecipeModalScope(scope) {
    _recipeModalScope = scope;    
    _renderRecipeModalScopeBar();
    _renderRecipeModalList();
    
    const pathKey = _recipeModalPathKey;
    if (pathKey) {
        const item = _recipeModalItem;
        const currentId = (getActiveRecipe(item) || {}).id;
        if (_recipeModalScope === 'node') {
            DB.settings.nodeRecipeOverrides[pathKey] = currentId;
        } else {
            DB.settings.preferredRecipes[item] = currentId;
            delete DB.settings.nodeRecipeOverrides[pathKey];
        }
        persist();
        calculate();
    }
}

function _renderRecipeModalList() {
    const item = _recipeModalItem;
    const pathKey = _recipeModalPathKey;
    const candidates = getRecipesFor(item);
    const list = document.getElementById('recipe-list');
    list.innerHTML = '';

    // 依 scope 決定「目前選中」的判斷依據
    const currentId = (getActiveRecipe(item, pathKey) || {}).id;

    candidates.forEach(r => {
        const div = document.createElement('div');
        div.className = `recipe-option ${r.id === currentId ? 'active' : ''}`;

        // 寫入邏輯依 scope 分流
        const applyRecipe = () => {
            if (pathKey) {
                if (_recipeModalScope === 'node') {
                    DB.settings.nodeRecipeOverrides[pathKey] = r.id;
                } else {
                    DB.settings.preferredRecipes[item] = r.id;
                    delete DB.settings.nodeRecipeOverrides[pathKey];
                }                
            }            
            persist();
            closeModal('recipe-modal');
            calculate();
        };

        // 自訂輸入配方 (Paradox Crucible 等)
        if (r.customInputSlot) {
            const mod = DB.settings.recipeModifiers[r.id] || {};
            const selectedItem = mod.customInput;
            const inputDef = selectedItem ? DB.items[selectedItem] : null;
            const previewTime = selectedItem ? AlchemyCalcEngine.computeParadoxTime(DB, selectedItem) : null;
            const isReady = !!selectedItem && previewTime !== null;

            div.classList.toggle('disabled', !isReady);

            const pickerHtml = `
                <span class="mini-picker" style="display:inline-flex;" onclick="event.stopPropagation(); pickCustomRecipeInput('${r.id}', '${item}')">
                    ${inputDef ? `<img src="img/item${inputDef.id ?? 0}.png" width="18" height="18">` : ''}
                    <span>${selectedItem ? selectedItem : t('Select Input Item')}</span>
                </span>`;

            let warnHtml = '';
            if (!selectedItem) {
                warnHtml = `<div class="loop-warning">${t('Please select an input item first.')}</div>`;
            } else if (previewTime === null) {
                warnHtml = `<div class="loop-warning">${t('Selected item is missing baseCost data.')}</div>`;
            }

            div.innerHTML = `
                <div class="recipe-header"><span><strong>${t(r.machine, 'machines')}</strong> <span style="font-size:0.9em; opacity:0.8;">( ${previewTime !== null ? previewTime.toFixed(2) : '—'} s )</span></span>${r.id === currentId ? '✅' : ''}</div>
                <div class="recipe-details">${t('Input')}: ${pickerHtml}<br>${t('Yields')}: 1x <img src="img/item${DB.items[item]?.id ?? 0}.png" width="18" height="18"> ${item}</div>
                ${warnHtml}
            `;

            div.onclick = (e) => {
                if (e.target.closest('.mini-picker')) return;
                if (!isReady) return;
                applyRecipe();
            };

            list.appendChild(div);
            return;
        }

        let recipeInputs = r.inputs;
        let recipeOutputs = r.outputs;

        const cats = DB.settings.recipeModifiers[r.id]?.catalysts;
        if (cats && cats.length > 0) {
            recipeInputs = {...r.inputs};
            recipeOutputs = {...r.outputs};
            if (cats.includes('eternal')) {
                recipeInputs = {};
                const [itemKey, itemValue] = Object.entries(DB.items).find(([name, item]) => item.charges === 99999);
                recipeInputs[itemKey] = r.ChargeCost / 99999;
            }
            if (cats.includes('unstable')) {
                recipeOutputs = { ...r.unstableOutputs };
                const [itemKey, itemValue] = Object.entries(DB.items).find(([name, item]) => item.charges === 180);
                recipeInputs[itemKey] = r.ChargeCost / 180;
            }
            if (cats.includes('resonant')) {
                recipeOutputs = { ...r.resonantOutputs };
                const [itemKey, itemValue] = Object.entries(DB.items).find(([name, item]) => item.charges === 1500);
                recipeInputs[itemKey] = r.ChargeCost / 1500;
            }
            if (cats.includes('fertile')) {                
                for (const k in recipeOutputs) recipeOutputs[k] *= 2;
                const [itemKey, itemValue] = Object.entries(DB.items).find(([name, item]) => item.charges === 240);
                recipeInputs[itemKey] = r.ChargeCost / 240;
            }
        }

        let inputs = []; Object.keys(recipeInputs).forEach(key => { inputs.push(`${Number(recipeInputs[key].toFixed(4))}x ${key}<img src="img/item${DB.items[key]?.id ?? 0}.png" width="18" height="18">`); });
        let outputs = []; Object.keys(recipeOutputs).forEach(key => { outputs.push(`${Number(recipeOutputs[key].toFixed(4))}x ${key}<img src="img/item${DB.items[key]?.id ?? 0}.png" width="18" height="18">`); });
        let content = `
            <div class="recipe-header"><span><strong>${t(r.machine, 'machines')}</strong> <span style="font-size:0.9em; opacity:0.8;">( ${r.baseTime} s )</span></span>${r.id === currentId ? '✅' : ''}</div>
            <div class="recipe-details">${t('Input')}: ${inputs.join(', ')}<br>${t('Yields')}: ${outputs.join(', ')}</div>
        `;

        div.onclick = (e) => {
            if (e.target.closest('.catalyst-row')) return;
            applyRecipe();
        };

        if (r.machine === 'Advanced Athanor') {
            const activeCats = DB.settings.recipeModifiers[r.id]?.catalysts || [];
            const btns = ATHANOR_CATALYSTS.map(c => {
                const isActive = activeCats.includes(c.id);
                return `<button class="catalyst-btn${isActive ? ' active' : ''}" onclick="toggleCatalyst('${r.id}', '${c.id}', '${item}', this)" title="${t('Charges')}: ${c.charges}">${t(c.label)}</button>`;
            }).join('');
            content += `<div class="catalyst-row">${t('Catalysts')} (${t('Charge Cost')}:${r.ChargeCost}) ${btns}</div>`;
        }

        div.innerHTML = content;
        list.appendChild(div);
    });
    document.getElementById('recipe-modal').style.display = 'flex';
}

/**
 * 開啟 Item Picker 讓玩家為「自訂輸入配方」選擇 input 物品
 * @param {string} recipeId  例如 "Oblivion Essence (Custom)"
 * @param {string} forItem   該配方所屬的產出物品，用於選完後重繪 recipe modal
 */
function pickCustomRecipeInput(recipeId, forItem) {
    const originalSelectItem = window.selectItem;
    window.selectItem = (name) => {
        if (!DB.settings.recipeModifiers[recipeId]) DB.settings.recipeModifiers[recipeId] = {};
        DB.settings.recipeModifiers[recipeId].customInput = name;
        persist();

        window.selectItem = originalSelectItem;
        closeModal('picker-modal');
        calculate();
        openRecipeModal(forItem); // 重新渲染 recipe modal 顯示新選擇
    };
    openItemPicker();
}

function openDrillDown(item, rate) {
    const url = `index.html?item=${encodeURIComponent(item)}&rate=${rate.toFixed(2)}`;
    window.open(url, '_blank');
}

/* ==========================================================================
   SECTION: CUSTOM COST MODAL
   ========================================================================== */

function openCustomCostModal(focusItem = null) {
    if (!DB.settings.customCosts) DB.settings.customCosts = {};
    document.getElementById('custom-cost-modal-title').innerText = '⚙ ' + t('Manage Custom Costs', 'ui');
    renderCustomCostList(focusItem);
    document.getElementById('custom-cost-modal').style.display = 'flex';
}

function renderCustomCostList(focusItem = null) {
    const container = document.getElementById('custom-cost-list');
    const costs = DB.settings.customCosts || {};
    const entries = Object.keys(costs);

    if (entries.length === 0) {
        container.innerHTML = `<div style="color:#666; padding:10px; font-size:0.85em; text-align:center;">${t('No custom costs set.', 'ui')}</div>`;
        return;
    }

    const lvlFuel = parseInt(document.getElementById('lvlFuel')?.value) || 0;
    const lvlFert = parseInt(document.getElementById('lvlFert')?.value) || 0;

    container.innerHTML = entries.map(name => {
        const itemDef = DB.items[name] || {};
        const cost = costs[name] || 0;

        // 燃料/肥料比例文字，顯示在 item-name-label 右側
        let ratioText = '';
        if (itemDef.heat) {
            const perCost = cost > 0 ? (itemDef.heat * (1 + lvlFuel * 0.10) / cost) : 0;
            ratioText += `<span class="details" style="color:var(--fuel); white-space:nowrap; font-size:0.8em;">${perCost.toFixed(2)} P/${t('Coin')}</span>`;
        }
        if (itemDef.nutrientValue) {
            const perCost = cost > 0 ? (itemDef.nutrientValue * (1 + lvlFert * 0.10) / cost) : 0;
            ratioText += `<span class="details" style="color:var(--bio); white-space:nowrap; font-size:0.8em;">${perCost.toFixed(2)} V/${t('Coin')}</span>`;
        }

        // details 區域一律顯示硬幣格式
        const coinDisplay = `<span class="details" style="text-align:right;">${formatCoinIcons(cost)}</span>`;

        const highlight = name === focusItem ? 'border-color:var(--accent); background:#2e3d30;' : '';
        return `
        <div class="multi-target-row" style="${highlight}">
            <img src="img/item${itemDef.id ?? 0}.png" width="20" height="20">
            <span class="item-name-label" style="flex:1; display:flex; gap:10px;">
                <span>${name}</span>
                ${ratioText}
            </span>
            ${coinDisplay}
            <input type="number" class="small-num-input" style="width:120px;" value="${cost}"
                   onchange="updateCustomCostValue('${name}', this.value)">
            <button class="swap-btn" onclick="removeCustomCostRow('${name}')" style="color:var(--danger); border-color:var(--danger);">x</button>
        </div>`;
    }).join('');
}

function updateCustomCostValue(item, val) {
    DB.settings.customCosts[item] = parseFloat(val) || 0;
    persist();
    renderCustomCostList();
    calculate();
}

function removeCustomCostRow(item) {
    delete DB.settings.customCosts[item];
    persist();
    renderCustomCostList();
    calculate();
}

function addCustomCostRow() {
    const originalSelectItem = window.selectItem;
    window.selectItem = (name) => {
        window.selectItem = originalSelectItem;
        closeModal('picker-modal');
        if (DB.settings.customCosts[name] === undefined) DB.settings.customCosts[name] = 0;
        persist();
        openCustomCostModal(name);
    };
    openItemPicker();
}

/* ==========================================================================
   SECTION: SCALE MODAL
   ========================================================================== */

// 暫存目前 modal 的基準數值（套用後更新）
let _scaleModalBase = null;

function openScaleModal(itemName, requestedRate, machineCount, ratePerMachine) {
    const itemDef = DB.items[itemName] || {};
    const beltSpeed = getBeltSpeed(parseInt(document.getElementById('lvlBelt').value) || 0);

    // 基準數值
    _scaleModalBase = {
        itemName,
        rate: requestedRate,
        machineCount,
        ratePerMachine,
        beltSpeed
    };

    // 標題 icon + 名稱
    const iconId = itemDef.id ?? 0;
    document.getElementById('scale-modal-title').innerHTML = `${t('Adjust Ratio')} <img src="img/item${iconId}.png" width="24" height="24" style="vertical-align:middle;"> ${itemName}`;

    // 填入左側舊值
    document.getElementById('scale-old-rate').innerText = Number(requestedRate.toFixed(4));
    document.getElementById('scale-old-belt').innerText = Number((requestedRate / beltSpeed).toFixed(4));

    // 機器區域顯示/隱藏
    const machineRow = document.getElementById('scale-machine-row');
    if (machineCount !== null && machineCount !== undefined && ratePerMachine !== null && ratePerMachine !== undefined && machineCount > 0) {
        machineRow.style.display = '';
        document.getElementById('scale-old-machine').innerText = Number(machineCount.toFixed(4));
    } else {
        machineRow.style.display = 'none';
    }

    // 右側新值初始填入（等於舊值）
    document.getElementById('scale-new-rate').value = Number(requestedRate.toFixed(4));
    document.getElementById('scale-new-belt').value = Number((requestedRate / beltSpeed).toFixed(4));
    if (machineCount !== null && machineCount !== undefined && machineCount > 0) {
        document.getElementById('scale-new-machine').value = Number(machineCount.toFixed(4));
    }

    // 縮放比初始為 1
    document.getElementById('scale-ratio-display').innerText = '1.000';
    document.getElementById('scale-modal').style.display = 'flex';
}

function onScaleInputChange(source) {
    if (!_scaleModalBase) return;
    const { rate: baseRate, beltSpeed, machineCount, ratePerMachine } = _scaleModalBase;

    let ratio = 1;

    if (source === 'rate') {
        const newRate = parseFloat(document.getElementById('scale-new-rate').value) || 0;
        ratio = baseRate > 0 ? newRate / baseRate : 0;
    } else if (source === 'belt') {
        const newBelt = parseFloat(document.getElementById('scale-new-belt').value) || 0;
        ratio = baseRate > 0 ? (newBelt * beltSpeed) / baseRate : 0;
    } else if (source === 'machine') {
        const newMachine = parseFloat(document.getElementById('scale-new-machine').value) || 0;
        ratio = baseRate > 0 ? (newMachine * ratePerMachine) / baseRate : 0;
    }

    // 更新其他欄位
    if (source !== 'rate') {
        document.getElementById('scale-new-rate').value = Number((baseRate * ratio).toFixed(4));
    }
    if (source !== 'belt') {
        document.getElementById('scale-new-belt').value = Number(((baseRate * ratio) / beltSpeed).toFixed(4));
    }
    if (source !== 'machine' && machineCount !== null && machineCount !== undefined && machineCount > 0) {
        const rpm = ratePerMachine > 0 ? ratePerMachine : 1;
        document.getElementById('scale-new-machine').value = Number(((baseRate * ratio) / rpm).toFixed(4));
    }

    document.getElementById('scale-ratio-display').innerText = ratio.toFixed(3);
}

function applyScaleModal() {
    if (!_scaleModalBase) return;

    const { rate: baseRate, beltSpeed, machineCount, ratePerMachine } = _scaleModalBase;
    const newRate = parseFloat(document.getElementById('scale-new-rate').value) || 0;
    const ratio = baseRate > 0 ? newRate / baseRate : 1;
    const isMulti = document.getElementById('modeToggle').checked;

    if (!isMulti) {
        // 單目標模式
        const rateEl = document.getElementById('targetRate');
        const currentRate = parseFloat(rateEl.value) || 0;
        const newRate = currentRate * ratio;
        rateEl.value = newRate;

        // 若目前是機器模式，要切換回 rate 模式才能寫入
        const machineToggle = document.getElementById('machineModeToggle');
        if (machineToggle.checked) {
            machineToggle.checked = false;
            toggleControlMode(false);
        }
    } else {
        // 多目標模式：對所有列等比縮放
        document.querySelectorAll('.multi-target-row').forEach(row => {
            const input = row.querySelector('.multi-rate-input');
            if (input) {
                const cur = parseFloat(input.value) || 0;
                input.value = cur * ratio;
            }
        });
    }

    calculate();

    // 套用後更新基準值（讓使用者可繼續疊加）
    const newBaseRate = _scaleModalBase.rate * ratio;
    _scaleModalBase.rate = newBaseRate;
    if (_scaleModalBase.machineCount !== null && _scaleModalBase.machineCount !== undefined) {
        _scaleModalBase.machineCount = _scaleModalBase.machineCount * ratio;
    }

    // 更新左側舊值顯示
    document.getElementById('scale-old-rate').innerText = Number(newBaseRate.toFixed(4));
    document.getElementById('scale-old-belt').innerText = Number((newBaseRate / _scaleModalBase.beltSpeed).toFixed(4));
    if (_scaleModalBase.machineCount !== null && _scaleModalBase.machineCount !== undefined && _scaleModalBase.machineCount > 0) {
        document.getElementById('scale-old-machine').innerText = Number(_scaleModalBase.machineCount.toFixed(4));
    }

    // 右側新值同步（縮放比歸 1）
    document.getElementById('scale-new-rate').value = Number(newBaseRate.toFixed(4));
    document.getElementById('scale-new-belt').value = Number((newBaseRate / _scaleModalBase.beltSpeed).toFixed(4));
    if (_scaleModalBase.machineCount !== null && _scaleModalBase.machineCount !== undefined && _scaleModalBase.machineCount > 0) {
        document.getElementById('scale-new-machine').value = Number(_scaleModalBase.machineCount.toFixed(4));
    }
    document.getElementById('scale-ratio-display').innerText = '1.000';
}