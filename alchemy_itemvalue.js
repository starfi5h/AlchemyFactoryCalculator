/* ==========================================================================
   SECTION: ITEM VALUE PAGE (獨立模組，不依賴 AlchemyCalcEngine 之外的修改)
   計算每個物品生產所需的金幣/燃料/肥料數量
   ========================================================================== */

const ItemValue = (function () {
    let sortState = { col: 'name', dir: 'asc' };
    let searchTerm = '';
    let categoryFilter = '[All]';

    /* ---------------- 參數收集 ---------------- */
    function getParams() {
        const lvlSpeed = parseInt(document.getElementById('iv-lvlSpeed')?.value) || 0;
        const lvlAlchemy = parseInt(document.getElementById('iv-lvlAlchemy')?.value) || 0;
        const lvlFuel = parseInt(document.getElementById('iv-lvlFuel')?.value) || 0;
        const lvlFert = parseInt(document.getElementById('iv-lvlFert')?.value) || 0;

        const selectedFuel = document.getElementById('iv-fuelSelect')?.value;
        const selectedFert = document.getElementById('iv-fertSelect')?.value;
        const heatingSel = document.getElementById('iv-heatingDeviceSelect');
        const selectedHeatingDevice = DB.machines[heatingSel?.value]?.isGenerator
            ? heatingSel.value
            : (DB.machines["Stone Furnace"]?.isGenerator ? "Stone Furnace" : Object.keys(DB.machines).find(m => DB.machines[m]?.isGenerator));

        const costRatio = (parseFloat(document.getElementById('iv-costRatio')?.value) || 100) / 100;

        return {
            speedMult: AlchemyCalcEngine.getSpeedMult(lvlSpeed),
            alchemyMult: AlchemyCalcEngine.getAlchemyMult(lvlAlchemy),
            fuelMult: 1 + (lvlFuel * 0.10),
            fertMult: 1 + (lvlFert * 0.10),
            selectedFuel,
            selectedFert,
            selectedHeatingDevice,
            costRatio
        };
    }

    function getHeatingDevice(selectedHeatingDevice) {
        const selected = (DB.machines || {})[selectedHeatingDevice];
        if (selected?.isGenerator) return selected;
        const fallback = (DB.machines || {})["Stone Furnace"];
        if (fallback?.isGenerator) return fallback;
        return Object.values(DB.machines || {}).find(m => m.isGenerator) || { heatSelf: 0, slots: 3 };
    }

    /* ---------------- 核心遞迴計算 ---------------- */
    // 回傳 { gold, fuel, fert, ok } ok=false 代表無法計算(無配方也無buyPrice，或偵測到循環)
    function computeItemCost(item, params, visited, cache) {
        if (cache.has(item)) return cache.get(item);
        if (visited.has(item)) {
            // 循環保護：避免Advanced Athanor催化劑等潛在自我參照
            return { gold: 0, fuel: 0, fert: 0, ok: false };
        }

        const itemDef = DB.items[item] || {};
        let result;

        if (itemDef.nutrientCost) {
            // 特例：帶有 nutrientCost 的物品直接視為葉節點 (如 Bank Portal 一樣不走配方遞迴)
            const fertDef = DB.items[params.selectedFert] || { nutrientValue: 144 };
            const grossFertVal = fertDef.nutrientValue * params.fertMult;
            result = { gold: 0, fuel: 0, fert: itemDef.nutrientCost / grossFertVal, ok: true };
            cache.set(item, result);
            return result;
        }

        const state = { preferredRecipes: DB.settings.preferredRecipes, recipeModifiers: DB.settings.recipeModifiers };
        const recipe = AlchemyCalcEngine.getActiveRecipe(DB, state, item);

        if (!recipe) {
            // 葉節點：只能購買，或完全無法取得
            if (itemDef.buyPrice) {
                result = { gold: itemDef.buyPrice, fuel: 0, fert: 0, ok: true };
            } else {
                result = { gold: 0, fuel: 0, fert: 0, ok: false };
            }
            cache.set(item, result);
            return result;
        }

        if (recipe.machine === "Bank Portal") {
            result = { gold: itemDef.sellPrice || 0, fuel: 0, fert: 0, ok: true };
            cache.set(item, result);
            return result;
        }

        visited.add(item);

        let batchYield = recipe.outputs[item] || 1;
        batchYield = AlchemyCalcEngine.applyAlchemyMult(recipe.machine, batchYield, params.alchemyMult);
        const isMultiOutput = Object.keys(recipe.outputs).length > 1;

        let gold = 0, fuel = 0, fert = 0;
        let ok = true;

        Object.keys(recipe.inputs).forEach(inputName => {
            const qty = recipe.inputs[inputName];
            const childCost = computeItemCost(inputName, params, visited, cache);
            if (!childCost.ok) ok = false;
            gold += childCost.gold * qty;
            fuel += childCost.fuel * qty;
            fert += childCost.fert * qty;
        });

        // 燃料成本 (heatCost -> 燃料物品數量)
        const machine = DB.machines[recipe.machine];
        if (machine && machine.heatCost) {
            const heatingDevice = getHeatingDevice(params.selectedHeatingDevice);
            const slotsRequired = machine.slotsRequired || 1;
            const heatingSlots = heatingDevice.slots || 3;

            let activeHeat = machine.heatCost * params.speedMult;
            if (machine.heatCost < 0) activeHeat = (recipe.heatCost ?? 0) * params.speedMult;

            const heatingDevicesPerBatch = 1 / (heatingSlots / slotsRequired);
            const heatPerSec = (heatingDevicesPerBatch * (heatingDevice.heatSelf || 0) * params.speedMult) + activeHeat;
            const heatPerUnit = heatPerSec * ((recipe.baseTime || 1) / params.speedMult) / batchYield;

            const fuelDef = DB.items[params.selectedFuel] || {};
            const grossFuelEnergy = (fuelDef.heat || 1) * params.fuelMult;
            fuel += (heatPerUnit * 60) / grossFuelEnergy;
        }

        gold /= batchYield;
        fuel /= batchYield;
        fert /= batchYield;

        if (isMultiOutput) {
            gold *= params.costRatio;
            fuel *= params.costRatio;
            fert *= params.costRatio;
        }

        visited.delete(item);

        result = { gold, fuel, fert, ok };
        cache.set(item, result);
        return result;
    }

    /* ---------------- Tier 計算 ---------------- */
    // 葉節點(無配方/nutrientCost特例/Bank Portal): itemDef.tier，默認0
    // 一般配方: 所有直接輸入原料的tier最大值 (機台tier屬性目前DB未提供，略過)
    function computeItemTier(item, visited, tierCache) {
        if (tierCache.has(item)) return tierCache.get(item);
        if (visited.has(item)) return 0;

        const itemDef = DB.items[item] || {};

        if (itemDef.nutrientCost) {
            const tier = itemDef.tier ?? 0;
            tierCache.set(item, tier);
            return tier;
        }

        const state = { preferredRecipes: DB.settings.preferredRecipes, recipeModifiers: DB.settings.recipeModifiers };
        const recipe = AlchemyCalcEngine.getActiveRecipe(DB, state, item);

        if (!recipe || recipe.machine === "Bank Portal") {
            const tier = itemDef.tier ?? 0;
            tierCache.set(item, tier);
            return tier;
        }

        visited.add(item);
        const inputNames = Object.keys(recipe.inputs);
        let tier;
        if (inputNames.length === 0) {
            tier = itemDef.tier ?? 0;
        } else {
            tier = Math.max(...inputNames.map(inputName => computeItemTier(inputName, visited, tierCache)));
        }
        visited.delete(item);

        tierCache.set(item, tier);
        return tier;
    }

    function computeAll() {
        const params = getParams();
        const cache = new Map();
        const tierCache = new Map();
        const rows = [];

        const allItems = new Set(Object.keys(DB.items || {}));
        if (DB.recipes) DB.recipes.forEach(r => Object.keys(r.outputs).forEach(k => allItems.add(k)));

        allItems.forEach(item => {
            const visited = new Set();
            const cost = computeItemCost(item, params, visited, cache);
            const tier = computeItemTier(item, new Set(), tierCache);
            const itemDef = DB.items[item] || {};
            rows.push({
                item,
                category: itemDef.category || "Other",
                tier,
                machine: getMachineName(item),
                gold: cost.gold,
                fuel: cost.fuel,
                fert: cost.fert,
                ok: cost.ok,
                sellPrice: itemDef.sellPrice || null
            });
        });

        return { rows, params };
    }

    /* ---------------- 機台名稱取得 ---------------- */
    function getMachineName(item) {
        const itemDef = DB.items[item] || {};
        if (itemDef.nutrientCost) return 'Nursery';
        const state = { preferredRecipes: DB.settings.preferredRecipes, recipeModifiers: DB.settings.recipeModifiers };
        const recipe = AlchemyCalcEngine.getActiveRecipe(DB, state, item);
        if (!recipe) return itemDef.buyPrice ? 'Purchasing Portal' : null;
        return recipe.machine;
    }


    function populateSelectors() {
        const fuelSel = document.getElementById('iv-fuelSelect');
        const fertSel = document.getElementById('iv-fertSelect');
        const heatingSel = document.getElementById('iv-heatingDeviceSelect');
        if (!fuelSel || !fertSel || !heatingSel) return;

        fuelSel.innerHTML = ''; fertSel.innerHTML = ''; heatingSel.innerHTML = '';
        const fuels = []; const ferts = [];
        const allItems = new Set(Object.keys(DB.items || {}));
        if (DB.recipes) DB.recipes.forEach(r => Object.keys(r.outputs).forEach(k => allItems.add(k)));

        allItems.forEach(itemName => {
            const itemDef = DB.items[itemName] || {};
            if (itemDef.heat) fuels.push({ name: itemName, heat: itemDef.heat });
            if (itemDef.nutrientValue) ferts.push({ name: itemName, val: itemDef.nutrientValue });
        });

        fuels.sort((a, b) => b.heat - a.heat).forEach(f => { fuelSel.appendChild(new Option(`${t(f.name, 'items')} (${f.heat} P)`, f.name)); });
        ferts.sort((a, b) => b.val - a.val).forEach(f => { fertSel.appendChild(new Option(`${t(f.name, 'items')} (${f.val} V)`, f.name)); });
        Object.entries(DB.machines || {})
            .filter(([, machine]) => machine.isGenerator)
            .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
            .forEach(([machineName, machine]) => {
                heatingSel.appendChild(new Option(`${t(machineName, 'machines')} (${machine.slots || 0} ${t('slots')})`, machineName));
            });

        // 同步主頁面預設值
        fuelSel.value = DB.settings.defaultFuel || fuels[0]?.name || '';
        fertSel.value = DB.settings.defaultFert || ferts[0]?.name || '';
        heatingSel.value = DB.settings.selectedHeatingDevice || "Stone Furnace";
        if (!heatingSel.value) heatingSel.value = heatingSel.options[0]?.value || "";
    }

    function populateCategoryFilter() {
        const sel = document.getElementById('iv-categoryFilter');
        if (!sel) return;
        const cats = new Set();
        Object.values(DB.items || {}).forEach(i => { if (i.category) cats.add(i.category); });
        sel.innerHTML = '';
        sel.appendChild(new Option(t('All Categories'), '[All]'));
        Array.from(cats).sort().forEach(c => sel.appendChild(new Option(t(c, 'categories'), c)));
        sel.value = categoryFilter;
    }

    function syncUpgradeLevelsFromMain() {
        ['lvlSpeed', 'lvlAlchemy', 'lvlFuel', 'lvlFert'].forEach(k => {
            const mainEl = document.getElementById(k);
            const ivEl = document.getElementById('iv-' + k);
            if (mainEl && ivEl) ivEl.value = mainEl.value;
        });
    }

    function adjustLvl(id, delta) {
        const el = document.getElementById(id);
        if (!el) return;
        const min = el.min !== '' ? parseFloat(el.min) : 0;
        const max = el.max !== '' ? parseFloat(el.max) : Infinity;
        let val = parseFloat(el.value) || 0;
        val = Math.min(max, Math.max(min, val + delta));
        el.value = val;
        render();
    }

    function setSort(col) {
        if (sortState.col === col) {
            sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
        } else {
            sortState.col = col;
            sortState.dir = 'asc';
        }
        render();
    }

    function onSearchInput(val) {
        searchTerm = (val || '').toLowerCase();
        render();
    }

    function onCategoryChange(val) {
        categoryFilter = val;
        render();
    }

    function sortIcon(col) {
        if (sortState.col !== col) return '';
        return sortState.dir === 'asc' ? ' ▲' : ' ▼';
    }

    function formatFull(val) {
        if (val === null || val === undefined) return '—';
        const rounded = Math.round(val * 10000) / 10000;
        return rounded.toLocaleString('en-US', { maximumFractionDigits: 4 });
    }

    function formatCost(val, ok) {
        if (!ok && val === 0) return '<span class="iv-na">—</span>';
        if (val === 0) return '0';
        return formatFull(val);
    }

    function render() {
        const tbody = document.getElementById('iv-table-body');
        const header = document.getElementById('iv-table-header');
        if (!tbody || !header) return;

        const { rows, params } = computeAll();

        let filtered = rows.filter(r => {
            if (categoryFilter !== '[All]' && r.category !== categoryFilter) return false;
            if (searchTerm) {
                const displayName = t(r.item, 'items').toLowerCase();
                if (!displayName.includes(searchTerm) && !r.item.toLowerCase().includes(searchTerm)) return false;
            }
            return true;
        });

        filtered.sort((a, b) => {
            let valA, valB;
            switch (sortState.col) {
                case 'tier': valA = a.tier; valB = b.tier; break;
                case 'gold': valA = a.gold; valB = b.gold; break;
                case 'fuel': valA = a.fuel; valB = b.fuel; break;
                case 'fert': valA = a.fert; valB = b.fert; break;
                case 'sell': valA = a.sellPrice ?? -1; valB = b.sellPrice ?? -1; break;
                case 'margin': {
                    valA = (a.sellPrice && a.ok && a.gold > 0) ? a.sellPrice / a.gold : -Infinity;
                    valB = (b.sellPrice && b.ok && b.gold > 0) ? b.sellPrice / b.gold : -Infinity;
                    break;
                }
                case 'name':
                default:
                    valA = t(a.item, 'items'); valB = t(b.item, 'items');
                    break;
            }
            if (typeof valA === 'string') {
                const cmp = valA.localeCompare(valB);
                return sortState.dir === 'asc' ? cmp : -cmp;
            }
            // 無法計算的排到最後
            if (!a.ok && b.ok) return 1;
            if (a.ok && !b.ok) return -1;
            const cmp = valA - valB;
            return sortState.dir === 'asc' ? cmp : -cmp;
        });

        header.innerHTML = `
            <th onclick="ItemValue.setSort('tier')">${t('Tier')}${sortIcon('tier')}</th>
            <th onclick="ItemValue.setSort('name')">${t('Item')}${sortIcon('name')}</th>
            <th>${t('Category')}</th>
            <th>${t('Machine')}</th>
            <th onclick="ItemValue.setSort('gold')" class="iv-gold">${t('Gold')}${sortIcon('gold')}</th>
            <th onclick="ItemValue.setSort('fuel')" class="iv-fuel">${t('Fuel')} (${t(params.selectedFuel, 'items')})${sortIcon('fuel')}</th>
            <th onclick="ItemValue.setSort('fert')" class="iv-fert">${t('Fert')} (${t(params.selectedFert, 'items')})${sortIcon('fert')}</th>
            <th onclick="ItemValue.setSort('sell')">${t('Sell Price')}${sortIcon('sell')}</th>
            <th onclick="ItemValue.setSort('margin')">${t('Margin')}${sortIcon('margin')}</th>
        `;

        tbody.innerHTML = filtered.map(r => {
            const margin = (r.sellPrice && r.ok && r.gold > 0) ? ((r.sellPrice / r.gold) * 100).toFixed(0) + '%' : '—';
            const machineBadge = r.machine ? `<span class="iv-machine-badge">${t(r.machine, 'machines')}</span>` : '<span class="iv-na">—</span>';
            return `
                <tr>
                    <td>${r.tier}</td>
                    <td>${t(r.item, 'items')}</td>
                    <td>${t(r.category, 'categories')}</td>
                    <td>${machineBadge}</td>
                    <td class="iv-gold">${formatCost(r.gold, r.ok)}</td>
                    <td class="iv-fuel">${formatCost(r.fuel, r.ok)}</td>
                    <td class="iv-fert">${formatCost(r.fert, r.ok)}</td>
                    <td>${r.sellPrice ? formatFull(r.sellPrice) : '—'}</td>
                    <td>${margin}</td>
                </tr>
            `;
        }).join('');
    }

    function init() {
        syncUpgradeLevelsFromMain();
        populateSelectors();
        populateCategoryFilter();
        render();
    }

    return {
        init,
        render,
        setSort,
        adjustLvl,
        onSearchInput,
        onCategoryChange
    };
})();

function initItemValuePage() {
    ItemValue.init();
}