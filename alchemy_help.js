/* ==========================================================================
   ALCHEMY HELP PAGE  (Guides · Items · Machines)
   ========================================================================== */

/* ─── 1. BILINGUAL LONG-STRING DICTIONARY ─────────────────────────────────── */
const HELP_TEXT = {
    en: {
        // ===== CALCULATOR GUIDE =====
        'section.calc': '📐 Calculator Guide',

        'calc.target.title': 'Setting a Target',
        'calc.target.desc': 'Type an item name in the <strong>search box</strong> or click the item icon to open the <strong>Item Picker</strong>. Set the desired output using the <strong>Belt Load Fraction</strong> slider, or enter a custom <strong>Rate (Items/Min)</strong> directly.<br><br>' +
        'Toggle <strong>MULTI</strong> mode to plan multiple production targets simultaneously — each row can be set independently. Use <strong>Save List</strong> / <strong>Load List</strong> to persist multi-target sets in your browser. In multi-target mode, enable <strong>Self-Fuel</strong> or <strong>Self-Fert</strong> to automatically deduct factory consumption from the net output of the target item itself.<br><br>' +
        'Switch to <strong>Machine Count</strong> mode to calculate the required output rate from a fixed number of machines.',

        'calc.upgrades.title': 'Upgrades & Logistics',
        'calc.upgrades.desc': 'Enter your current research levels in the <strong>Upgrades</strong> panel for accurate results:<ol>' +
        '<li><strong>Logistics Efficiency</strong>: Increases conveyor belt speed (Items/Min).</li>' +
        '<li><strong>Factory Efficiency</strong>: Boosts the processing speed of all machines.</li>' +
        '<li><strong>Alchemy Skill</strong>: Increases the yield of Cauldrons and certain processing machines.</li>' +
        '<li><strong>Fuel Efficiency</strong>: Reduces fuel consumption by 10% per level.</li>' +
        '<li><strong>Fertilizer Efficiency</strong>: Reduces fertilizer consumption by 10% per level.</li></ol>' +
        'In the <strong>Logistics</strong> section, choose your <strong>Heating Device</strong>, <strong>Fuel Source</strong>, and <strong>Fertilizer Source</strong>. Click <strong>Save Upgrades</strong> to persist all settings to your browser.',

        'calc.tree.title': 'Reading the Production Tree',
        'calc.tree.desc': 'The tree shows every processing step from raw materials to the final product. Each node displays the item\'s <strong>output rate (/min)</strong>, the number of <strong>belts</strong> used, and the required <strong>machine count</strong>. Rates shown in <strong style="color:#e66;">red</strong> indicate that the belt capacity has been exceeded.<br><br>' +
        'Click the <strong>▶ arrow</strong> to collapse or expand a branch. Hover over a machine label to see its cycle time, per-machine throughput, and speed multiplier.<br><br>' +
        'Use the checkbox on any node to mark that demand as <strong>External Input</strong> — the system will not try to produce it internally, and it will appear in the "External Inputs" summary section. All leftover byproducts are collected in a dedicated <strong>Byproducts</strong> section, where you can jump directly to their source nodes.',

        'calc.recipe.title': 'Switching Recipes & Catalysts',
        'calc.recipe.desc': 'Click the <strong>🔄 button</strong> next to a machine name to open the recipe selector and choose an alternative production method (e.g., smelt with Coke vs. Charcoal).<br><br>' +
        'For the <strong>Advanced Athanor</strong>, you can also select catalysts (<strong>Unstable</strong> / <strong>Fertile</strong> / <strong>Resonant</strong> / <strong>Eternal</strong>) to change output ratios or input requirements. If a chosen recipe would create an <strong>infinite loop</strong> (A requires B, and B requires A), the system warns you and blocks the selection to prevent a crash.',

        'calc.recycle.title': 'Byproduct Recycling',
        'calc.recycle.desc': 'When a process generates a <strong>byproduct</strong> that is also consumed elsewhere in the chain, a purple <strong>♻️ button</strong> appears on that node. Enabling it redirects the byproduct to fill internal demand, reducing raw material imports. Use the <strong>Recycle All</strong> / <strong>Un-recycle All</strong> buttons at the top of the production chain to toggle all recyclers at once.',

        'calc.scale.title': 'Scale Modal (Proportional Scaling)',
        'calc.scale.desc': 'Click any <strong>output rate number</strong> on a tree node to open the Scale Modal. Three fields are linked and update each other in real time:<ol>' +
        '<li><strong>Output Rate (/min)</strong>: Direct rate value.</li>' +
        '<li><strong>Belt Count</strong>: Number of full belts at current belt speed.</li>' +
        '<li><strong>Machine Count</strong>: Number of machines required.</li></ol>' +
        'Edit any field to set your target; the <strong>Scaling Ratio</strong> updates automatically. Click <strong>Apply</strong> to proportionally rescale the entire production tree.',

        'calc.summary.title': 'Summary Box (Overview)',
        'calc.summary.desc': 'The summary bar at the top of the tree shows four data blocks:<ol>' +
        '<li><strong>Gross Output</strong>: Total production rate before internal consumption.</li>' +
        '<li><strong>Total Load</strong>: Factory heat (P/s) and nutrient (V/s) demand, with fuel/fertilizer item equivalents shown.</li>' +
        '<li><strong>Unit Cost</strong>: Coin, heat, and nutrient cost per output item.</li>' +
        '<li><strong>Unit Value</strong>: Total conversion cost vs. Retail Price and Wholesale Price, expressed as a percentage ratio.</li></ol>',

        'calc.construction.title': 'Construction List & Materials',
        'calc.construction.desc': 'The <strong>Construction List</strong> at the bottom of the page summarises every machine type and quantity needed for the current plan. Click any machine name to expand and reveal the <strong>total raw materials</strong> required to build all machines of that type.<br><br>' +
        'The <strong>Total Materials Required</strong> section at the bottom also calculates the estimated number of <strong>inventory slots</strong> needed, based on each item\'s max stack size.',

        // ===== CAULDRON GUIDE =====
        'section.cauldron': '⚗️ Cauldron Guide',

        'cauldron.f3.title': 'Standard Cauldron (3-slot)',
        'cauldron.f3.desc': 'The standard Cauldron combines <strong>three ingredient slots</strong>. The output is the item whose <strong>cauldron cost</strong> is closest to the computed value T:<br><br><code>T = (Cost₁ + Cost₂ + Cost₃) × Ratio</code><br><br>Ratio depends on how many slots share the same item:<ol><li><strong>All Different (×1.0)</strong>: All three items are distinct.</li><li><strong>Two Same (×0.65)</strong>: Exactly two slots hold the same item.</li><li><strong>All Same (×0.5)</strong>: All three slots hold the same item.</li></ol>',

        'cauldron.f2.title': 'Advanced Cauldron (2-slot)',
        'cauldron.f2.desc': 'The <strong>Advanced Cauldron</strong> uses only <strong>two ingredient slots</strong>, with two distinct calculation modes:<br><br>' +
        '<strong>Both Same</strong>: <code>T = Cost₁</code> (uses the single cost, searches <strong>upward</strong> for the nearest higher-tier product).<br>' +
        '<strong>Both Different</strong>: <code>T = |Cost₁ - Cost₂|</code> (uses the absolute difference, searches <strong>downward</strong> for the nearest lower-tier product).<br><br>' +
        'Switch between Cauldron types using the <strong>type toggle</strong> at the top of the Cauldron tab.',

        'cauldron.pool.title': 'Candidate Pool & Profiles',
        'cauldron.pool.desc': 'The <strong>Candidate Pool</strong> lists all items eligible as cauldron ingredients (must have a <code>cauldronCost</code> and not be a liquid). Check or uncheck items to include them in the search.<br><br>' +
        'Three independent <strong>Profiles</strong> let you save different candidate sets and switch instantly:<ol>' +
        '<li><strong>Profile 1</strong>: All valid ingredients (default).</li>' +
        '<li><strong>Profile 2</strong>: Herb-based items (auto-generated from herbal chains).</li>' +
        '<li><strong>Profile 3</strong>: Gold / currency-based items.</li></ol>' +
        'Use <strong>Select All</strong> / <strong>Deselect All</strong> to quickly configure the active profile. The <strong>🌿 Herb Preset</strong> button resets the pool to a herb-focused set. All settings are saved to the browser automatically.',

        'cauldron.filter.title': 'Category Filter & Slot Lock',
        'cauldron.filter.desc': 'Use the <strong>Category</strong> dropdown to filter the candidate pool by item type. Special filters: <strong>[Include]</strong> shows only checked items, <strong>[Exclude]</strong> shows only unchecked items, <strong>[Product]</strong> shows only valid cauldron output items.<br><br>' +
        'Enable <strong>Sort by Value</strong> to order items by cauldron cost (ascending or descending).<br><br>' +
        'Lock up to three <strong>Slot filters</strong> above the results table to restrict the search to recipes containing a specific item in a fixed position. Use the <strong>+/−</strong> arrows on each slot to cycle through items in cost order.',

        'cauldron.results.title': 'Reading Results',
        'cauldron.results.desc': 'The results table lists matching recipes for each item in the candidate pool. Click an item row to <strong>expand</strong> and reveal its compatible ingredient combinations.<br><br>' +
        'Each recipe row shows the ingredient set and the computed T value. The output is determined by matching the target value. Recipes that hit the target are highlighted in <strong style="color:#4c4;">green</strong>; non-matching ones are shown in <strong style="color:#c44;">red</strong>.<br><br>' +
        'If a target item is not produced by any combination, it appears in the <strong>Unattainable Targets</strong> section at the bottom, helping you adjust your candidate pool.',

        'cauldron.modal.title': 'Cauldron Recipe Modal (Quick Edit)',
        'cauldron.modal.desc': 'Click any recipe row to open the <strong>Cauldron Recipe Modal</strong> for detailed inspection and editing:<ol>' +
        '<li>Each <strong>slot</strong> shows the current ingredient and its cauldron cost. Click the slot to pick a different item, or use the <strong>+/−</strong> arrows to cycle through items in cost order.</li>' +
        '<li>The <strong>T value</strong> and its <strong>valid range [lower, upper]</strong> update in real time. Green means the combination hits the target; red means it does not. Distance to both bounds is displayed to help fine-tune your selection.</li>' +
        '<li>Click <strong>★</strong> to save the recipe to Favorites. Click <strong>Apply</strong> (enabled only when the recipe matches) to instantly register it in the main Calculator.</li></ol>',

        'cauldron.fav.title': 'Favorites & Sync to Calculator',
        'cauldron.fav.desc': 'Saved recipes appear in the <strong>Favorites</strong> panel. Click <strong>★</strong> on any recipe to add or remove it.<br><br>' +
        'Click <strong>Sync DB</strong> to inject all saved cauldron recipes into the main production database — after syncing, the Calculator can include cauldron steps in full production chains.<br><br>' +
        'Use <strong>Export</strong> to save favorites as a <code>.txt</code> file (<code>Item1 + Item2 (+ Item3) = Product</code>) and <strong>Import</strong> to load them back in bulk.',

        // ===== GENERAL UI =====
        'section.general': '🛠️ General Tips & Controls',

        'general.ui.title': 'Common Interface Operations',
        'general.ui.desc': '<ol>' +
        '<li><strong>Item Picker</strong>: Click any "☰" button or clickable item name to open the modal — browse by category or search by name.</li>' +
        '<li><strong>Scale Modal</strong>: Click any output rate number on a tree node to open the linked scaling panel for precise adjustments.</li>' +
        '<li><strong>Collapsing Nodes</strong>: Click the ▼ arrow to collapse/expand tree branches. Collapse states are saved in your browser.</li>' +
        '<li><strong>Data Persistence</strong>: All upgrades, multi-target lists, favorite recipes, and preferences are stored locally in your browser (localStorage).</li>' +
        '<li><strong>Database Editor</strong>: Advanced users can directly edit the database, translations, and settings via the "Database Editor" tab.</li>' +
        '<li><strong>Language Switch</strong>: Use the 🌐 button in the top-right corner to toggle between English and Chinese (built-in translation).</li></ol>'
    },
    zh: {
        // ===== 计算器指南 =====
        'section.calc': '📐 计算器指南',

        'calc.target.title': '设定生产目标',
        'calc.target.desc': '在<strong>搜索框</strong>输入物品名称，或点击物品图标打开<strong>物品选择器</strong>。使用<strong>传送带负载比例</strong>滑块，或直接输入<strong>速率（个/分钟）</strong>设定产量目标。<br><br>' +
        '切换 <strong>MULTI</strong> 模式可同时规划多个生产目标——每一行可独立设置物品和速率。使用 <strong>保存列表</strong> / <strong>加载列表</strong> 可将多目标清单保存在浏览器中。在多目标模式下，开启 <strong>自供燃料</strong> 或 <strong>自供肥料</strong>，可让目标物品自身的产出优先回补工厂消耗（形成净产出）。<br><br>' +
        '切换至 <strong>机器数量</strong> 模式，则可以从固定的机器数量反推产能。',

        'calc.upgrades.title': '升级与物流设置',
        'calc.upgrades.desc': '在 <strong>升级</strong> 面板填入当前的研究等级，以获得精确计算：<ol>' +
        '<li><strong>物流效率</strong>：提升传送带速度（个/分钟）。</li>' +
        '<li><strong>工厂效率</strong>：提升所有机器的处理速度。</li>' +
        '<li><strong>炼金技能</strong>：提升炼金锅及部分加工机器的产量。</li>' +
        '<li><strong>燃料效率</strong>：每级减少 10% 燃料消耗。</li>' +
        '<li><strong>肥料效率</strong>：每级减少 10% 肥料消耗。</li></ol>' +
        '在 <strong>物流设置</strong> 中选择 <strong>加热装置</strong>、<strong>燃料来源</strong> 和 <strong>肥料来源</strong>。点击 <strong>保存设置</strong> 可将所有设定持久化到浏览器中。',

        'calc.tree.title': '解读生产树',
        'calc.tree.desc': '生产树展示从原材料到最终产品的每一道工序。每个节点显示物品的 <strong>产出速率（/分钟）</strong>、<strong>传送带数</strong> 和 <strong>机器数量</strong>。速率数字显示为 <strong style="color:#e66;">红色</strong> 表示已超过传送带上限。<br><br>' +
        '点击 <strong>▶ 箭头</strong> 可折叠或展开该分支。将鼠标悬停于机器标签上，可查看其循环时间、单台机器产量和速度倍率。<br><br>' +
        '节点上的复选框可将该需求标记为 <strong>外部输入</strong> ——系统不会尝试内部生产，而是将其汇总到“外部输入”区块中。所有未被消耗的副产物会单独汇总到 <strong>副产品</strong> 区域，并可点击跳转至来源节点。',

        'calc.recipe.title': '切换配方与催化剂',
        'calc.recipe.desc': '点击机器名称旁的 <strong>🔄 按钮</strong> 可打开配方选择器，切换不同的合成方案（例如：用焦炭还是木炭炼钢）。<br><br>' +
        '对于 <strong>高级炼金炉</strong>，还可以选择催化剂（<strong>不稳定</strong> / <strong>肥沃</strong> / <strong>共鸣</strong> / <strong>永恒</strong>），以改变输出比例或输入原料要求。若所选配方会产生 <strong>无限循环</strong>（A 需要 B，B 又需要 A），系统会发出警告并阻止该选择，防止计算器崩溃。',

        'calc.recycle.title': '副产品回收',
        'calc.recycle.desc': '当某道工序产生的 <strong>副产品</strong> 也被生产链其他地方所需要时，会出现紫色的 <strong>♻️ 按钮</strong>。启用后，副产品会被导向填补内部需求缺口，从而减少原料的外部采购量。使用生产链顶部的 <strong>全部回收</strong> / <strong>全部不回收</strong> 按钮，可一次性切换所有回收器的状态。',

        'calc.scale.title': '比例缩放窗口',
        'calc.scale.desc': '点击生产树中任意节点的 <strong>产量数字</strong>，即可打开比例缩放窗口。三个栏位实时联动：<ol>' +
        '<li><strong>输出速率（/分钟）</strong>：直接输入速率值。</li>' +
        '<li><strong>传送带数</strong>：以当前传送带速度换算所需传送带条数。</li>' +
        '<li><strong>机器数量</strong>：所需的机器台数。</li></ol>' +
        '修改任一栏位，<strong>缩放比</strong> 会自动更新。点击 <strong>Apply</strong> 后，整棵生产树将依此比例等比缩放。',

        'calc.summary.title': '概览栏',
        'calc.summary.desc': '生产树顶部的概览栏显示四个数据区块：<ol>' +
        '<li><strong>总产出</strong>：扣除内部自耗前的总生产速率。</li>' +
        '<li><strong>总负载</strong>：工厂的热值（P/s）和肥力（V/s）消耗，并换算为燃料/肥料物品的用量。</li>' +
        '<li><strong>单位成本</strong>：每个产出物品所需的铜币、热值和肥力成本。</li>' +
        '<li><strong>单位价值</strong>：总转换成本与零售价/批发价的对比，显示为百分比。</li></ol>',

        'calc.construction.title': '建造清单与材料汇总',
        'calc.construction.desc': '页面底部的 <strong>建造清单</strong> 汇总当前方案所需的全部机器种类及数量。点击任意机器名称，可展开查看建造这些机器所需的 <strong>原材料总计</strong>。<br><br>' +
        '下方的 <strong>总材料需求</strong> 区域还会根据每种物品的堆叠上限，估算所需的 <strong>库存格数</strong>。',

        // ===== 炼金锅指南 =====
        'section.cauldron': '⚗️ 炼金锅指南',

        'cauldron.f3.title': '普通炼金锅（3格）',
        'cauldron.f3.desc': '普通炼金锅需放入 <strong>三格原料</strong>。系统将根据计算出的 T 值，输出 <strong>炼金价值</strong> 最接近 T 的物品：<br><br><code>T = (Cost₁ + Cost₂ + Cost₃) × Ratio</code><br><br>Ratio 根据三格中相同物品的数量决定：<ol><li><strong>全部不同（×1.0）</strong>：三格物品各不相同。</li><li><strong>两格相同（×0.65）</strong>：恰好有两格放置相同物品。</li><li><strong>三格相同（×0.5）</strong>：三格均放置相同物品。</li></ol>',

        'cauldron.f2.title': '高级炼金锅（2格）',
        'cauldron.f2.desc': '<strong>高级炼金锅</strong> 只需放入 <strong>两格原料</strong>，根据两格是否相同分为两种计算方式：<br><br>' +
        '<strong>两格相同</strong>：<code>T = Cost₁</code>（取单格价值，<strong>向上</strong>匹配最近的高阶产物）。<br>' +
        '<strong>两格不同</strong>：<code>T = |Cost₁ - Cost₂|</code>（取差值绝对值，<strong>向下</strong>匹配最近的低阶产物）。<br><br>' +
        '在炼金锅页面顶部的 <strong>类型切换</strong> 按钮，可在普通与高级炼金锅之间切换。',

        'cauldron.pool.title': '候选池与 Profile',
        'cauldron.pool.desc': '<strong>候选池</strong> 列出所有可作为炼金原料的物品（必须有 <code>cauldronCost</code> 且非液体）。勾选或取消勾选物品以决定纳入搜索的范围。<br><br>' +
        '三个独立的 <strong>Profile</strong> 让你储存不同的候选集合，并随时快速切换：<ol>' +
        '<li><strong>Profile 1</strong>：全部有效原料（预设）。</li>' +
        '<li><strong>Profile 2</strong>：以药草为基底的物品（从药草链自动生成）。</li>' +
        '<li><strong>Profile 3</strong>：以金币/货币为基底的物品。</li></ol>' +
        '使用 <strong>全选</strong> / <strong>取消全选</strong> 快速配置当前 Profile。<strong>🌿 草药预设组</strong> 按钮可将候选池重置为药草导向的集合。所有设定会自动保存至浏览器。',

        'cauldron.filter.title': '分类过滤与格位锁定',
        'cauldron.filter.desc': '使用 <strong>分类</strong> 下拉菜单依物品类型筛选候选池。特殊分类包括 <strong>[选取]</strong>（只显示已勾选物品）、<strong>[排除]</strong>（只显示未勾选物品）和 <strong>[产物]</strong>（只显示可作为炼金锅产出的物品）。<br><br>' +
        '开启 <strong>以炼金价值排序</strong> 可将物品依 cauldron cost 升序或降序排列。<br><br>' +
        '在结果上方锁定最多三个 <strong>格位过滤器</strong>，可将搜索范围限缩为特定物品在固定位置的配方组合。每个格位旁的 <strong>+/−</strong> 箭头可依成本顺序循环切换物品。',

        'cauldron.results.title': '解读搜索结果',
        'cauldron.results.desc': '结果表格为候选池中每个物品列出符合条件的配方。点击物品列可 <strong>展开</strong> 查看所有相容的原料组合。<br><br>' +
        '每笔配方列显示原料组合以及计算出的 T 值。命中目标的配方以 <strong style="color:#4c4;">绿色</strong> 标示，未命中的以 <strong style="color:#c44;">红色</strong> 标示。<br><br>' +
        '若某个目标物品没有任何组合能够产出，它会出现在底部的 <strong>无法达成的目标</strong> 列表中，方便您调整候选池。',

        'cauldron.modal.title': '炼金锅配方快捷编辑窗',
        'cauldron.modal.desc': '点击任意配方列，即可打开 <strong>炼金锅配方快捷编辑窗</strong>，对该组合进行详细调整：<ol>' +
        '<li>每个 <strong>格位</strong> 显示当前原料及其 cauldron cost。点击格位可更换物品，或用 <strong>+/−</strong> 箭头依成本顺序循环切换。</li>' +
        '<li><strong>T 值</strong> 与 <strong>有效区间 [下界, 上界]</strong> 实时更新。绿色表示命中目标，红色表示未命中；同时显示距上下界的差值以便微调。</li>' +
        '<li>点击 <strong>★</strong> 可将此配方加入收藏。当配方命中目标时，<strong>Apply</strong> 按钮亮起，点击即可将此配方直接写入主计算器。</li></ol>',

        'cauldron.fav.title': '收藏与同步至计算器',
        'cauldron.fav.desc': '已保存的配方列于 <strong>收藏</strong> 面板中。点击配方旁的 <strong>★</strong> 可新增或移除收藏。<br><br>' +
        '点击 <strong>同步数据库</strong> 可将所有收藏配方注入主生产数据库——同步后，计算器即可规划包含炼金锅步骤的完整生产链。<br><br>' +
        '使用 <strong>导出</strong> 将收藏保存为 <code>.txt</code> 文件（格式：<code>物品1 + 物品2 (+ 物品3) = 产物</code>），使用 <strong>导入</strong> 批量载入配方。',

        // ===== 通用操作 =====
        'section.general': '🛠️ 通用操作与提示',

        'general.ui.title': '通用界面控件',
        'general.ui.desc': '<ol>' +
        '<li><strong>物品选择器</strong>：点击任何 "☰" 按钮或可点击的物品名称，即可打开模态框——可按分类浏览或按名称搜索。</li>' +
        '<li><strong>缩放模态框</strong>：点击生产树节点上的任意产量数字，即可打开联动缩放面板，进行精确调整。</li>' +
        '<li><strong>折叠节点</strong>：点击 ▼ 箭头可折叠/展开树分支，折叠状态会自动保存在浏览器中。</li>' +
        '<li><strong>数据持久化</strong>：所有升级等级、多目标列表、收藏配方和偏好设定均保存在浏览器的 localStorage 中。</li>' +
        '<li><strong>数据库编辑器</strong>：高级用户可通过“数据库编辑器”标签页直接编辑数据库、翻译和设置。</li>' +
        '<li><strong>语言切换</strong>：使用右上角的 🌐 按钮可在英文和中文之间切换（基于内置翻译表）。</li></ol>'
    }
};

/* ─── 2. STRING LOOKUP ────────────────────────────────────────────────────── */
function ht(key) {
    var lang = (window.ALCHEMY_I18N && window.ALCHEMY_I18N.enabled !== false) ? 'zh' : 'en';
    return (HELP_TEXT[lang] && HELP_TEXT[lang][key]) || (HELP_TEXT.en && HELP_TEXT.en[key]) || key;
}

function _tn(name, category = 'ui') { /* translate item/machine name via existing t() if available */
    return (typeof t === 'function') ? t(name, category) : name;
}

/* ─── 3. CARD DEFINITIONS ─────────────────────────────────────────────────── */
const HELP_CARDS = [
    // ===== Calculator Section =====
    { type: 'section', key: 'section.calc' },
    { key: 'calc.target' },
    { key: 'calc.upgrades' },
    { key: 'calc.tree' },
    { key: 'calc.recipe' },
    { key: 'calc.recycle' },
    { key: 'calc.scale' },
    { key: 'calc.summary' },
    { key: 'calc.construction' },

    // ===== Cauldron Section =====
    { type: 'section', key: 'section.cauldron' },
    { key: 'cauldron.f3' },
    { key: 'cauldron.f2' },
    { key: 'cauldron.pool' },
    { key: 'cauldron.filter' },
    { key: 'cauldron.results' },
    { key: 'cauldron.modal' },
    { key: 'cauldron.fav' },

    // ===== General Section =====
    { type: 'section', key: 'section.general' },
    { key: 'general.ui' }
];

/* ─── 4. STYLE INJECTION ──────────────────────────────────────────────────── */
function _injectHelpStyles() {
    if (document.getElementById('help-styles')) return;
    var s = document.createElement('style');
    s.id = 'help-styles';
    s.textContent = `
        /* ── Outer shell: #help-inner owns the flex layout so
              #view-help can remain display:block for the tab system ── */
        #help-inner {
            display: flex; flex-direction: column;
            height: 100%; overflow: hidden;
        }
        .wiki-subnav {
            flex-shrink: 0; display: flex; gap: 6px;
            padding: 7px 12px; border-bottom: 1px solid var(--border, #333);
        }
        .wiki-tab-btn {
            padding: 3px 14px; border-radius: 4px;
            border: 1px solid var(--border, #333); background: transparent;
            color: var(--text-muted, #aaa); cursor: pointer;
            font-size: 1.0em; font-weight: 600;
        }
        .wiki-tab-btn:hover  { background: var(--hover-bg, #1e2a3a); color: var(--text, #eee); }
        .wiki-tab-btn.active { background: var(--accent-bg, #1e3a5f); border-color: var(--accent, #4af); color: var(--accent, #4af); }
        #wiki-area {
            flex: 1; min-height: 0; overflow-y: auto;
            display: flex;
        }

        /* ── Guides ── */
        .wiki-guides-area { flex: 1; min-height: 0; overflow-y: auto; }
        .help-container { max-width: 1400px; margin: 0 auto; padding: 20px 20px 48px; }
        .help-section-title {
            font-size: 0.78em; font-weight: 700; letter-spacing: 0.1em;
            text-transform: uppercase; color: var(--text-muted, #888);
            border-bottom: 1px solid var(--border, #333);
            padding-bottom: 8px; margin: 32px 0 14px;
        }
        .help-section-title:first-child { margin-top: 0; }
        .help-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
        .help-card { padding: 14px 16px; border-radius: 6px; background: var(--panel-bg, #1a2535); border: 1px solid var(--border, #2a3a4a); }
        .help-card h3 { margin: 0 0 8px; font-size: 0.88em; font-weight: 700; color: var(--text, #eee); }
        .help-desc { font-size: 0.82em; line-height: 1.65; color: var(--text-muted, #bbb); }
        .help-desc ol { margin: 8px 0 0; padding-left: 18px; }
        .help-desc ol li { margin-bottom: 4px; }
        .help-desc code { background: rgba(0,0,0,0.3); padding: 2px 5px; border-radius: 3px; font-family: monospace; font-size: 0.95em; color: var(--accent, #7af); }

        /* ── Split layout ── */
        .wiki-split-area {
            display: flex; flex-direction: row;
            width: 100%; overflow: hidden;
        }
        .wiki-left-pane {
            box-sizing: border-box; flex: 3 1 75%; min-width: 50px;
            border-right: 1px solid var(--border, #333);
            display: flex; flex-direction: column; overflow: hidden;
        }
        .wiki-right-pane {
            box-sizing: border-box; flex: 1 1 25%; min-width: 270px;
            padding: 14px 18px; overflow-y: auto;
        }
        @media (max-width: 720px) {
            .wiki-split-area {
                flex-direction: column;
            }
            .wiki-left-pane {
                flex: 1 1 auto;
                border-right: none;
                max-height: 36vh;  /* 限制左側高度，避免佔滿畫面 */
            }
            .wiki-right-pane {
                flex: 1 1 auto;
                min-width: 0;
                width: 100%;
                max-height: 64vh;
                border-top: 1px solid var(--border, #333);
            }
        }

        .wiki-search-bar { flex-shrink: 0; padding: 7px 8px; border-bottom: 1px solid var(--border, #333); }
        .wiki-search-input {
            width: 100%; box-sizing: border-box; padding: 5px 8px;
            background: var(--input-bg, #0d1a26); border: 1px solid var(--border, #333);
            border-radius: 4px; color: var(--text, #eee); font-size: 0.8em; outline: none;
        }
        .wiki-search-input:focus { border-color: var(--accent, #4af); }
        .wiki-placeholder { color: var(--text-muted, #555); font-size: 0.83em; padding-top: 48px; text-align: center; }

        /* ── Item grid ── */
        .wiki-item-grid {
            flex: 1; min-height: 0; overflow-y: auto;
            display: grid; grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
            gap: 2px; padding: 4px; align-content: start;
        }
        .wiki-tile {
            display: flex; flex-direction: column; align-items: center;
            padding: 6px 4px; border-radius: 4px; cursor: pointer;
            font-size: 0.8em; text-align: center; gap: 3px;
            color: var(--text, #ddd); border: 1px solid transparent; user-select: none;
        }
        .wiki-tile:hover    { background: var(--hover-bg, #1e2a3a); }
        .wiki-tile.selected { background: var(--accent-bg, #1a3050); border-color: var(--accent, #4af); }
        .wiki-tile span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3; }
        .wiki-icon { display: block; flex-shrink: 0; }

        /* ── Machine list ── */
        .wiki-machine-list { flex: 1; min-height: 0; overflow-y: auto; padding: 4px; display: flex; flex-direction: column; gap: 2px; }
        .machine-tile { flex-direction: row; justify-content: flex-start; text-align: left; font-size: 0.8em; padding: 7px 10px; }

        /* ── Detail ── */
        .wiki-detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--border, #333); }
        .wiki-detail-title-area { flex: 1; }
        .wiki-detail-name { margin: 0 0 5px; font-size: 1.05em; font-weight: 700; color: var(--text, #eee); }
        .wiki-detail-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; }
        .wiki-badge { font-size: 0.7em; padding: 2px 7px; border-radius: 10px; font-weight: 600; }
        .wiki-badge.category { background: rgba(100,120,180,0.15); color: #8ab; border: 1px solid rgba(100,120,180,0.35); }
        .wiki-stats-grid { display: grid; grid-template-columns: auto 1fr; gap: 3px 12px; font-size: 0.8em; }
        .wiki-stat-key { color: var(--text-muted, #888); }
        .wiki-stat-val { color: var(--text, #ddd); }
        .wiki-section { margin-top: 14px; }
        .wiki-section-title { font-size: 0.7em; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted, #777); border-bottom: 1px solid var(--border, #2a3a4a); padding-bottom: 4px; margin-bottom: 7px; }
        .wiki-empty { font-size: 0.78em; color: var(--text-muted, #555); margin: 4px 0; }

        /* ── Recipe rows ── */
        .wiki-recipe-row {
            display: flex; align-items: center; gap: 6px;
            padding: 4px 8px; border-radius: 4px; margin-bottom: 3px;
            border: 1px solid transparent; min-height: 30px;
        }
        .wiki-recipe-row:hover { background: var(--hover-bg, #1e2a3a); }
        .wiki-recipe-row.preferred { background: rgba(68,170,255,0.07); border-color: rgba(68,170,255,0.22); }
        .wiki-recipe-formula { flex: 1; display: flex; align-items: center; flex-wrap: wrap; gap: 3px; min-width: 0; }
        .wiki-items { display: flex; align-items: center; flex-wrap: wrap; gap: 2px; }
        .wiki-arrow { color: var(--text-muted, #555); font-size: 0.85em; margin: 0 2px; flex-shrink: 0; }
        .wiki-recipe-item { display: inline-flex; align-items: center; gap: 1px; cursor: pointer; }
        .wiki-item-qty { font-size: 0.7em; color: var(--accent, #7af); line-height: 1; }
        .wiki-recipe-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; font-size: 0.78em; }
        .wiki-recipe-machine { background: rgba(255,255,255,0.05); padding: 1px 5px; border-radius: 3px; cursor: pointer; }

        /* ── Star toggle ── */
        .wiki-star { flex-shrink: 0; background: none; border: none; color: #555; cursor: pointer; font-size: 0.95em; padding: 0 2px; line-height: 1; }
        .wiki-star:hover { color: #fa0; }
        .wiki-star.active { color: #fa0; }
        .wiki-star-ph { width: 18px; flex-shrink: 0; }

        /* ── Build cost ── */
        .wiki-build-cost { display: flex; flex-wrap: wrap; gap: 6px; }
        .wiki-build-item { display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: var(--panel-bg, #1a2535); border: 1px solid var(--border, #2a3a4a); border-radius: 4px; font-size: 0.78em; cursor: pointer; }
        .wiki-build-item:hover { border-color: var(--accent, #4af); }

        /* ── Chip filter bar ── */
        .wiki-chip-bar {
            flex-shrink: 0; display: flex; flex-wrap: wrap; gap: 5px;
            padding: 6px 8px; border-bottom: 1px solid var(--border, #333);
        }
        .wiki-chip-wrap { position: relative; }
        .wiki-filter-chip {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 3px 10px; border: 1px solid var(--border, #444); border-radius: 12px;
            background: transparent; color: var(--text-muted, #aaa);
            font-size: 0.9em; cursor: pointer; white-space: nowrap; user-select: none;
            transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .wiki-filter-chip:hover  { border-color: #888; color: #eee; }
        .wiki-filter-chip.active { background: rgba(76,175,80,0.12); border-color: var(--accent,#4caf50); color: var(--accent,#4caf50); }
        .wiki-filter-chip.open   { border-color: #777; color: #ddd; background: rgba(255,255,255,0.04); }
        .chip-arrow { opacity: 0.5; font-size: 0.75em; }
        .chip-clear { opacity: 0.7; line-height: 1; }
        .chip-clear:hover { opacity: 1; }

        .wiki-chip-panel {
            position: absolute; top: calc(100% + 4px); left: 0; min-width: 160px;
            background: #252525; border: 1px solid #555; border-radius: 6px;
            padding: 6px; z-index: 300; box-shadow: 0 6px 18px rgba(0,0,0,0.55);
            display: flex; flex-wrap: wrap; gap: 4px;
        }
        .wiki-cat-btn {
            padding: 3px 8px; border: 1px solid #444; border-radius: 4px;
            background: transparent; color: #bbb; font-size: 0.8em;
            cursor: pointer; white-space: nowrap; transition: 0.15s;
        }
        .wiki-cat-btn:hover  { background: #333; color: #eee; border-color: #666; }
        .wiki-cat-btn.active { background: rgba(76,175,80,0.12); border-color: var(--accent,#4caf50); color: var(--accent,#4caf50); }

        .wiki-chip-panel-num { flex-direction: column; min-width: 140px; gap: 6px; }
        .chip-panel-row { display: flex; align-items: center; gap: 6px; font-size: 0.78em; color: #aaa; }
        .chip-num-input {
            flex: 1; padding: 3px 5px; background: #1a1a1a;
            border: 1px solid #555; border-radius: 3px; color: #eee;
            font-size: 0.85em; width: 70px; min-width: 30px;
            -moz-appearance: textfield; appearance: textfield;
        }
        .chip-num-input::-webkit-inner-spin-button,
        .chip-num-input::-webkit-outer-spin-button { -webkit-appearance: none; }
        .chip-num-input:focus { outline: none; border-color: var(--accent,#4caf50); }
        .chip-exist-btn {
            padding: 3px 8px; border: 1px solid #555; border-radius: 4px;
            background: transparent; color: #aaa; font-size: 0.78em; cursor: pointer; transition: 0.15s;
        }
        .chip-exist-btn:hover  { border-color: #888; color: #eee; }
        .chip-exist-btn.active { background: rgba(76,175,80,0.12); border-color: var(--accent,#4caf50); color: var(--accent,#4caf50); }

        .wiki-active-filter-bar {
            display: flex; flex-wrap: wrap; align-items: center; gap: 5px;
            padding: 5px 8px; border-bottom: 1px solid var(--border,#333);
            background: rgba(76,175,80,0.03);
        }
        .wiki-active-chip {
            display: inline-flex; align-items: center; gap: 3px;
            padding: 2px 8px; background: rgba(76,175,80,0.10);
            border: 1px solid rgba(76,175,80,0.35); border-radius: 10px;
            color: var(--accent,#4caf50); font-size: 0.74em;
        }
        .wiki-active-chip button {
            background: none; border: none; color: inherit; cursor: pointer;
            font-size: 0.9em; padding: 0 1px; opacity: 0.7; line-height: 1;
        }
        .wiki-active-chip button:hover { opacity: 1; }
        .chip-clear-all {
            margin-left: auto; background: transparent; border: 1px solid #555;
            border-radius: 4px; color: #888; font-size: 0.72em; cursor: pointer;
            padding: 2px 7px; transition: 0.15s;
        }
        .chip-clear-all:hover { border-color: #888; color: #eee; }
        .wiki-no-results {
            padding: 32px 16px; text-align: center;
            color: var(--text-muted,#666); font-size: 0.82em; font-style: italic;
        }
    `;
    document.head.appendChild(s);
}

/* ─── 5. WIKI STATE ───────────────────────────────────────────────────────── */
var _currentWikiView = 'guides';
var _selectedItem    = null;
var _selectedMachine = null;
var _itemFilter      = '';
var _machineFilter   = '';
var _wikiIndex       = null;

/* ─── 5b. CHIP FILTER STATE ──────────────────────────────────────────────── */
var _itemChipFilters = {
    category:      null,    
    tier:          { active: false, min: '', max: '' },
    sell:          { active: false, min: '', max: '' },
    wholesale:     { active: false, min: '', max: '' },
    cauldronTarget:{ active: false, min: '', max: '' }
};
var _activeChip = null; // 'category' | 'sell' | 'wholesale' | 'cauldronTarget' | null

/* ─── 6. WIKI INDEX ───────────────────────────────────────────────────────── */
function _getWikiIndex() {
    if (_wikiIndex) return _wikiIndex;
    var rawDB = (typeof DB !== 'undefined') ? DB : {};
    var recipes = rawDB.recipes || [];
    var producedBy = {}, usedIn = {}, machineRecipes = {};
    for (var i = 0; i < recipes.length; i++) {
        var r = recipes[i];
        var m = r.machine || '';
        if (!machineRecipes[m]) machineRecipes[m] = [];
        machineRecipes[m].push(r);
        var outKeys = Object.keys(r.outputs || {});
        for (var j = 0; j < outKeys.length; j++) {
            var ok = outKeys[j];
            if (!producedBy[ok]) producedBy[ok] = [];
            producedBy[ok].push(r);
        }
        var inKeys = Object.keys(r.inputs || {});
        for (var k = 0; k < inKeys.length; k++) {
            var ik = inKeys[k];
            if (!usedIn[ik]) usedIn[ik] = [];
            usedIn[ik].push(r);
        }
    }
    _wikiIndex = { producedBy: producedBy, usedIn: usedIn, machineRecipes: machineRecipes };
    return _wikiIndex;
}

/* ─── 7. PREFERRED RECIPE ─────────────────────────────────────────────────── */
function _getPreferred(itemName) {
    try {
        var db = (typeof DB !== 'undefined') ? DB : ALCHEMY_DB;
        return db && db.settings && db.settings.preferredRecipes && db.settings.preferredRecipes[itemName];
    } catch(e) { return null; }
}

function _togglePreferred(itemName, recipeId) {
    try {
        var db = (typeof DB !== 'undefined') ? DB : ALCHEMY_DB;
        if (!db.settings) db.settings = {};
        if (!db.settings.preferredRecipes) db.settings.preferredRecipes = {};
        if (db.settings.preferredRecipes[itemName] === recipeId) {
            delete db.settings.preferredRecipes[itemName];
        } else {
            db.settings.preferredRecipes[itemName] = recipeId;
        }
        if (typeof persist === 'function') persist();
    } catch(e) { console.warn('help: togglePreferred failed', e); }
    _renderItemDetail(itemName);
}

/* ─── 8. FORMAT HELPERS ───────────────────────────────────────────────────── */
function _itemIcon(id, size) {
    size = size || 32;
    return '<img src="img/item' + (id || 0) + '.png" width="' + size + '" height="' + size
        + '" loading="lazy" class="wiki-icon" onerror="this.style.opacity=\'0.15\'">';
}

function _fmtItems(obj) {
    var rawDB = (typeof DB !== 'undefined') ? DB : {};
    return Object.entries(obj).map(function(e) {
        var name = e[0], qty = e[1];
        var def = rawDB.items && rawDB.items[name];
        var label = name.replace(/"/g, '&quot;');
        return '<span class="wiki-recipe-item" title="' + label + ' \xd7' + qty + '"' + _oc('wikiSwitchToItem', name) + '>'
            + _itemIcon(def ? def.id : 0, 22)
            + '<span class="wiki-item-qty">\xd7' + qty + '</span>'
            + '</span>';
    }).join('');
}

/* Safe onclick helpers */
function _oc(fn, arg) {
    return 'onclick="' + fn + '(decodeURIComponent(\'' + encodeURIComponent(arg) + '\'))"';
}
function _oc2(fn, a, b) {
    return 'onclick="' + fn + '(decodeURIComponent(\'' + encodeURIComponent(a)
        + '\'),decodeURIComponent(\'' + encodeURIComponent(b) + '\'))"';
}

/* ─── 9. CROSS-NAV ────────────────────────────────────────────────────────── */
function wikiSwitchToItem(name) {
    _selectedItem = name;
    _itemFilter   = '';
    wikiSwitchView('items');
    setTimeout(function() {
        var el = document.querySelector('#wiki-item-grid .wiki-tile.selected');
        if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 0);
}

function wikiSwitchToMachine(name) {
    _selectedMachine = name;
    _machineFilter   = '';
    wikiSwitchView('machines');
}

/* ─── 10. ITEM PAGE ───────────────────────────────────────────────────────── */

function _buildItemSplitHTML() {
    return '<div class="wiki-left-pane">'
        + '<div class="wiki-search-bar"><input type="text" class="wiki-search-input" id="wiki-item-search"'
        + ' placeholder="' + _tn('Search items...') + '" value="' + _itemFilter.replace(/"/g, '&quot;') + '"'
        + ' oninput="_itemFilter=this.value;_refreshItemGrid()"></div>'
        + '<div class="wiki-chip-bar" id="wiki-chip-bar">' + _buildChipBarInner() + '</div>'
        + '<div id="wiki-active-filters">' + _buildActiveFiltersHTML() + '</div>'
        + '<div class="wiki-item-grid" id="wiki-item-grid">' + _buildItemGridHTML() + '</div>'
        + '</div>'
        + '<div class="wiki-right-pane" id="wiki-right-pane"><div class="wiki-placeholder"></div></div>';
}

function _buildItemGridHTML() {
    var rawDB = (typeof DB !== 'undefined') ? DB : {};
    var entries = Object.entries(rawDB.items || {});

    // text filter
    if (_itemFilter) {
        var f = _itemFilter.toLowerCase();
        entries = entries.filter(function(e) { return e[0].toLowerCase().includes(f); });
    }
    // category chip
    if (_itemChipFilters.category) {
        var cat = _itemChipFilters.category;
        entries = entries.filter(function(e) { return e[1].category === cat; });
    }
    // numeric chips
    var PROP_MAP = { tier: 'tier', sell: 'sellPrice', wholesale: 'wholesalePrice', cauldronTarget: 'cauldronTarget' };
    ['tier', 'sell', 'wholesale', 'cauldronTarget'].forEach(function(key) {
        var fi = _itemChipFilters[key];
        if (!fi.active) return;
        var prop = PROP_MAP[key];
        entries = entries.filter(function(e) {
            var val = e[1][prop];
            if (val == null) return false;
            if (fi.min !== '' && val < parseFloat(fi.min)) return false;
            if (fi.max !== '' && val > parseFloat(fi.max)) return false;
            return true;
        });
    });

    entries.sort(function(a, b) { return (a[1].id || 0) - (b[1].id || 0); });

    if (!entries.length) {
        return '<div class="wiki-no-results">No items match the current filters.</div>';
    }

    return entries.map(function(e) {
        var name = e[0], def = e[1];
        var sel = name === _selectedItem ? ' selected' : '';
        return '<div class="wiki-tile' + sel + '" data-name="' + name.replace(/"/g, '&quot;') + '" '
            + _oc('wikiSelectItem', name) + '>'
            + _itemIcon(def.id, 32) + '<span>' + name + '</span></div>';
    }).join('');
}

function _refreshItemGrid() {
    var grid = document.getElementById('wiki-item-grid');
    if (grid) grid.innerHTML = _buildItemGridHTML();
}

/* ─── CHIP FILTER FUNCTIONS ─────────────────────────────────────────────── */

function _toggleChip(key) {
    _activeChip = (_activeChip === key) ? null : key;
    _refreshChipBar();
    event.stopPropagation();
}

function _onChipOutsideClick(e) {
    if (_activeChip && !e.target.closest('#wiki-chip-bar')) {
        _activeChip = null;
        _refreshChipBar();
    }
}

function _refreshChipBar() {
    var bar = document.getElementById('wiki-chip-bar');
    if (bar) bar.innerHTML = _buildChipBarInner();
    var af = document.getElementById('wiki-active-filters');
    if (af) af.innerHTML = _buildActiveFiltersHTML();
    _refreshItemGrid();
}

function _buildChipBarInner() {
    var rawDB = (typeof DB !== 'undefined') ? DB : {};
    var catSet = new Set();
    Object.values(rawDB.items || {}).forEach(function(d) { if (d.category) catSet.add(d.category); });
    var cats = ['[All]'].concat(Array.from(catSet).sort());

    var CHIPS = [
        {
            key: 'category',
            label: function() {
                return _itemChipFilters.category
                    ? _tn(_itemChipFilters.category, 'categories')
                    : _tn('Category', 'ui');
            }
        },
        { key: 'tier',          label: function() { return _tn('Tier', 'ui');            } },
        { key: 'sell',          label: function() { return _tn('Sell Price', 'ui');      } },
        { key: 'wholesale',     label: function() { return _tn('Wholesale Price', 'ui'); } },
        { key: 'cauldronTarget',label: function() { return _tn('Cauldron Target', 'ui'); } }
    ];

    return CHIPS.map(function(c) {
        var isNumeric = c.key !== 'category';
        var f         = isNumeric ? _itemChipFilters[c.key] : null;
        var isActive  = isNumeric ? f.active : !!_itemChipFilters.category;
        var isOpen    = _activeChip === c.key;

        // suffix: active → clear ✕ button; else → chevron
        var suffix = isActive
            ? ' <span class="chip-clear" onclick="event.stopPropagation();_clearChip(\'' + c.key + '\')">✕</span>'
            : ' <span class="chip-arrow">' + (isOpen ? '▲' : '▾') + '</span>';

        return '<div class="wiki-chip-wrap">'
            + '<button class="wiki-filter-chip'
            + (isActive ? ' active' : '') + (isOpen && !isActive ? ' open' : '')
            + '" onclick="_toggleChip(\'' + c.key + '\')">'
            + c.label() + suffix
            + '</button>'
            + (isOpen ? _buildChipPanelHTML(c.key, cats) : '')
            + '</div>';
    }).join('');
}

function _buildChipPanelHTML(key, cats) {
    if (key === 'category') {
        return '<div class="wiki-chip-panel">'
            + cats.map(function(cat) {
                var sel = (_itemChipFilters.category || '[All]') === cat;
                return '<button class="wiki-cat-btn' + (sel ? ' active' : '') + '" '
                    + _oc('_selectCategory', cat) + '>'
                    + _tn(cat, 'categories')
                    + '</button>';
            }).join('')
            + '</div>';
    }
    if (key === 'tier') {
        var f = _itemChipFilters[key];
        var tierBtns = '';
        for (var t = 1; t <= 9; t++) {
            var tStr = String(t);
            // 高亮：min 或 max 有值時，該按鈕若在區間內就標示
            var inRange = f.active
                && (f.min === '' || t >= parseInt(f.min))
                && (f.max === '' || t <= parseInt(f.max));
            tierBtns += '<button class="wiki-cat-btn' + (inRange ? ' active' : '') + '" '
                + 'onclick="_setTierQuick(' + t + ')">' + t + '</button>';
        }
        return '<div class="wiki-chip-panel" style="min-width:190px;">'
            + '<div style="width:100%; font-size:0.72em; color:#777; margin-bottom:2px;">' + _tn('Quick select (exact)') + '</div>'
            + tierBtns
            + '<div style="width:100%; height:1px; background:#333; margin:4px 0;"></div>'
            + '<label class="chip-panel-row"><span>Min</span>'
            + '<input type="number" class="chip-num-input" value="' + (f.min || '') + '" placeholder="1" min="1" max="9" '
            + 'oninput="_onChipNum(\'tier\',\'min\',this.value)"></label>'
            + '<label class="chip-panel-row"><span>Max</span>'
            + '<input type="number" class="chip-num-input" value="' + (f.max || '') + '" placeholder="9" min="1" max="9" '
            + 'oninput="_onChipNum(\'tier\',\'max\',this.value)"></label>'
            + '</div>';
    }

    // Numeric panel (sell / wholesale / cauldronTarget)
    var f = _itemChipFilters[key];
    var isExistOnly = f.active && f.min === '' && f.max === '';
    return '<div class="wiki-chip-panel wiki-chip-panel-num">'
        + '<button class="chip-exist-btn' + (isExistOnly ? ' active' : '')
        + '" onclick="_toggleExistFilter(\'' + key + '\')" title="Match items that have this property">' + _tn('Has Value') + '</button>'
        + '<label class="chip-panel-row"><span>Min</span>'
        + '<input type="number" class="chip-num-input" value="' + (f.min || '') + '" placeholder="—" '
        + 'oninput="_onChipNum(\'' + key + '\',\'min\',this.value)"></label>'
        + '<label class="chip-panel-row"><span>Max</span>'
        + '<input type="number" class="chip-num-input" value="' + (f.max || '') + '" placeholder="—" '
        + 'oninput="_onChipNum(\'' + key + '\',\'max\',this.value)"></label>'
        + '</div>';
}

function _buildActiveFiltersHTML() {
    var LABELS = {
        tier:          _tn('Tier', 'ui'),
        sell:          _tn('Sell Price', 'ui'),
        wholesale:     _tn('Wholesale Price', 'ui'),
        cauldronTarget:_tn('Cauldron Target', 'ui')
    };
    var chips = [];

    if (_itemChipFilters.category) {
        chips.push('<span class="wiki-active-chip">'
            + _tn(_itemChipFilters.category, 'categories')
            + ' <button onclick="_clearChip(\'category\')">✕</button></span>');
    }
    ['tier', 'sell', 'wholesale', 'cauldronTarget'].forEach(function(key) {
        var f = _itemChipFilters[key];
        if (!f.active) return;
        var range = (f.min !== '' || f.max !== '')
            ? (f.min || '*') + ' ~ ' + (f.max || '*')
            : '✓';
        chips.push('<span class="wiki-active-chip">'
            + LABELS[key] + ': ' + range
            + ' <button onclick="_clearChip(\'' + key + '\')">✕</button></span>');
    });

    if (!chips.length) return '';

    return '<div class="wiki-active-filter-bar">'
        + chips.join('')
        + '<button class="chip-clear-all" onclick="_clearAllChips()">Clear All</button>'
        + '</div>';
}

function _selectCategory(cat) {
    _itemChipFilters.category = (cat === '[All]') ? null : cat;
    _activeChip = null;
    _refreshChipBar();
    event.stopPropagation();
}

/* Called from oninput — intentionally does NOT rebuild the chip panel
   so the focused <input> keeps focus across the partial refresh.        */
function _onChipNum(key, field, val) {
    _itemChipFilters[key][field] = val;
    _itemChipFilters[key].active = true;
    var af = document.getElementById('wiki-active-filters');
    if (af) af.innerHTML = _buildActiveFiltersHTML();
    _refreshItemGrid();
    event.stopPropagation();
}

function _toggleExistFilter(key) {
    var f = _itemChipFilters[key];
    // If already "exist-only" (active, no range) → deactivate; else → activate with no range
    if (f.active && f.min === '' && f.max === '') {
        f.active = false;
    } else {
        f.active = true;
        f.min = '';
        f.max = '';
    }
    _refreshChipBar();
    event.stopPropagation();
}

function _setTierQuick(t) {
    var tStr = String(t);
    _itemChipFilters.tier = { active: true, min: tStr, max: tStr };
    _refreshChipBar();
}

function _clearChip(key) {
    if (key === 'category') {
        _itemChipFilters.category = null;
    } else {
        _itemChipFilters[key] = { active: false, min: '', max: '' };
    }
    if (_activeChip === key) _activeChip = null;
    _refreshChipBar();
    event.stopPropagation();
}

function _clearAllChips() {
    _itemChipFilters = {
        category:      null,
        tier:          { active: false, min: '', max: '' },
        sell:          { active: false, min: '', max: '' },
        wholesale:     { active: false, min: '', max: '' },
        cauldronTarget:{ active: false, min: '', max: '' }
    };
    _activeChip = null;
    _refreshChipBar();
    event.stopPropagation();
}

/* ─── 11. ITEM DETAIL ─────────────────────────────────────────────────────── */
function wikiSelectItem(name) {
    _selectedItem = name;
    document.querySelectorAll('#wiki-item-grid .wiki-tile').forEach(function(el) {
        el.classList.toggle('selected', el.dataset.name === name);
    });
    _renderItemDetail(name);
}

function _renderItemDetail(itemName) {
    var pane = document.getElementById('wiki-right-pane');
    if (!pane) return;
    var rawDB = (typeof DB !== 'undefined') ? DB : {};
    var def   = rawDB.items && rawDB.items[itemName];
    if (!def) { pane.innerHTML = '<div class="wiki-placeholder">' + _tn('Item data not found') + '</div>'; return; }

    var idx       = _getWikiIndex();
    var producers = idx.producedBy[itemName] || [];
    var consumers = idx.usedIn[itemName]     || [];
    var preferred = _getPreferred(itemName);

    /* Stats */
    var stats = [];
    if (def.tier           != null) stats.push([_tn('Tier'),            def.tier]);
    if (def.buyPrice       != null) stats.push([_tn('Buy Price'),       def.buyPrice.toLocaleString()       + ' \xa2']);
    if (def.sellPrice      != null) stats.push([_tn('Sell Price'),      def.sellPrice.toLocaleString()      + ' \xa2']);
    if (def.wholesalePrice != null) stats.push([_tn('Wholesale Price'), def.wholesalePrice.toLocaleString() + ' \xa2']);
    if (def.heat           != null) stats.push([_tn('Heat Value'),      def.heat          + ' P']);
    if (def.nutrientCost   != null) stats.push([_tn('Nutrient Cost'),   def.nutrientCost  + ' V/min']);
    if (def.nutrientValue  != null) stats.push([_tn('Nutrient Value'),  def.nutrientValue + ' V']);
    if (def.maxFertility   != null) stats.push([_tn('Max Fertility'),   def.maxFertility]);
    if (def.cauldronCost   != null) stats.push([_tn('Cauldron Cost'),   def.cauldronCost]);
    if (def.cauldronTarget != null) stats.push([_tn('Cauldron Target'), def.cauldronTarget]);
    if (def.charges        != null) stats.push([_tn('Charges'),         def.charges]);
    if (def.maxStack       != null) stats.push([_tn('Max Stack'),       def.maxStack]);

    var statsHTML = stats.length
        ? '<div class="wiki-stats-grid">' + stats.map(function(s) {
            return '<span class="wiki-stat-key">' + s[0] + '</span><span class="wiki-stat-val">' + s[1] + '</span>';
          }).join('') + '</div>'
        : '';

    /* Produced by */
    var producersHTML = producers.length === 0
        ? '<p class="wiki-empty">' + _tn('No production recipes') + '</p>'
        : producers.map(function(recipe) {
            var isPreferred = preferred === recipe.id;
            var starHTML = '<button class="wiki-star' + (isPreferred ? ' active' : '') + '" title="'
                         + (isPreferred ? _tn('Remove Preferred') : _tn('Set as Preferred')) + '" '
                         + _oc2('_togglePreferred', itemName, recipe.id) + '>' + (isPreferred ? '★' : '☆') + '</button>';
            var hasIn   = Object.keys(recipe.inputs  || {}).length > 0;
            var inHTML  = hasIn ? _fmtItems(recipe.inputs) : '<em style="font-size:0.78em;color:#666">—</em>';
            var outHTML = _fmtItems(recipe.outputs || {});
            return '<div class="wiki-recipe-row' + (isPreferred ? ' preferred' : '') + '">'
                + starHTML
                + '<div class="wiki-recipe-formula">'
                + '<span class="wiki-items">' + inHTML  + '</span>'
                + '<span class="wiki-arrow">→</span>'
                + '<span class="wiki-items">' + outHTML + '</span>'
                + '</div>'
                + '<div class="wiki-recipe-right">'
                + '<span class="wiki-recipe-machine" ' + _oc('wikiSwitchToMachine', recipe.machine) + '>' + _tn(recipe.machine, 'machines') + '</span>'
                + (recipe.baseTime != null ? '<span>' + recipe.baseTime + 's</span>' : '')
                + '</div></div>';
          }).join('');

    /* Used in */
    var consumersHTML = consumers.length === 0
        ? '<p class="wiki-empty">' + _tn('Not used in any recipe') + '</p>'
        : consumers.map(function(recipe) {
            var inHTML  = _fmtItems(recipe.inputs  || {});
            var outHTML = _fmtItems(recipe.outputs || {});
            return '<div class="wiki-recipe-row">'
                + '<span class="wiki-star-ph"></span>'
                + '<div class="wiki-recipe-formula">'
                + '<span class="wiki-items">' + inHTML  + '</span>'
                + '<span class="wiki-arrow">→</span>'
                + '<span class="wiki-items">' + outHTML + '</span>'
                + '</div>'
                + '<div class="wiki-recipe-right">'
                + '<span class="wiki-recipe-machine" ' + _oc('wikiSwitchToMachine', recipe.machine) + '>' + _tn(recipe.machine, 'machines') + '</span>'
                + (recipe.baseTime != null ? '<span>' + recipe.baseTime + 's</span>' : '')
                + '</div></div>';
          }).join('');

    pane.innerHTML =
        '<div class="wiki-detail-header">'
        + _itemIcon(def.id, 32)
        + '<div class="wiki-detail-title-area">'
        + '<h2 class="wiki-detail-name">' + itemName + '</h2>'
        + '<div class="wiki-detail-meta"><span class="wiki-badge category">' + (_tn(def.category, 'categories') || '—') + '</span></div>'
        + '</div></div>'
        + (statsHTML ? '<div class="wiki-section"><div class="wiki-section-title">' + _tn('Properties') + '</div>' + statsHTML + '</div>' : '')
        + '<div class="wiki-section"><div class="wiki-section-title">' + _tn('Production Recipes') + ' (' + producers.length + ')</div>' + producersHTML + '</div>'
        + '<div class="wiki-section"><div class="wiki-section-title">' + _tn('Used In') + ' (' + consumers.length + ')</div>' + consumersHTML + '</div>';
}

/* ─── 12. MACHINE PAGE ────────────────────────────────────────────────────── */
function _buildMachineListHTML() {
    var rawDB    = (typeof DB !== 'undefined') ? DB : {};
    var machines = rawDB.machines || {};
    var entries  = Object.entries(machines);
    if (_machineFilter) {
        var f = _machineFilter.toLowerCase();
        entries = entries.filter(function(e) {
            return e[0].toLowerCase().includes(f) || _tn(e[0], 'machines').toLowerCase().includes(f);
        });
    }
    return entries.map(function(e) {
        var name = e[0];
        var sel  = name === _selectedMachine ? ' selected' : '';
        var machine = machines[name] || {};
        let badges = ' ';
        if(machine.heatCost || machine.isGenerator) badges += '🔥';
        if(machine.fertility) badges += '🌱';
        if(_tn("Glass", 'items') in machine["buildCost"]) badges += '💧';
        return '<div class="wiki-tile machine-tile' + sel + '" data-name="' + name.replace(/"/g, '&quot;') + '" '
            + _oc('wikiSelectMachine', name) + '>'
            + '<span>' + _tn(name, 'machines') + badges + '</span></div>';
    }).join('');
}

function _buildMachineSplitHTML() {
    return '<div class="wiki-left-pane">'
        + '<div class="wiki-search-bar"><input type="text" class="wiki-search-input" id="wiki-machine-search"'
        + ' placeholder="' + _tn('Search machines...') + '" value="' + _machineFilter.replace(/"/g, '&quot;') + '"'
        + ' oninput="_machineFilter=this.value;_refreshMachineList()"></div>'
        + '<div class="wiki-machine-list" id="wiki-machine-grid">' + _buildMachineListHTML() + '</div>'
        + '</div>'
        + '<div class="wiki-right-pane" id="wiki-right-pane"><div class="wiki-placeholder"></div></div>';
}

function _refreshMachineList() {
    var grid = document.getElementById('wiki-machine-grid');
    if (grid) grid.innerHTML = _buildMachineListHTML();
}

function wikiSelectMachine(name) {
    _selectedMachine = name;
    document.querySelectorAll('#wiki-machine-grid .wiki-tile').forEach(function(el) {
        el.classList.toggle('selected', el.dataset.name === name);
    });
    _renderMachineDetail(name);
}

function _renderMachineDetail(machineName) {
    var pane = document.getElementById('wiki-right-pane');
    if (!pane) return;
    var rawDB   = (typeof DB !== 'undefined') ? DB : {};
    var def     = rawDB.machines && rawDB.machines[machineName];
    if (!def) { pane.innerHTML = '<div class="wiki-placeholder">' + _tn('Machine data not found') + '</div>'; return; }
    var idx     = _getWikiIndex();
    var recipes = idx.machineRecipes[machineName] || [];

    /* Properties */
    var props = [];
    if (def.tier != null)                      props.push([_tn('Tier'),             def.tier]);
    if (def.isGenerator)                       props.push([_tn('Type'),             _tn('Heating Device')]);
    if (def.fertility)                         props.push([_tn('Type'),             _tn('Fertilizer Device')]);
    if (def.heatCost != null && def.heatCost > 0) props.push([_tn('Heat Cost'),     def.heatCost + ' P/s']);
    if (def.heatSelf != null)                  props.push([_tn('Heat Cost (Self)'), def.heatSelf + ' P/s']);
    if (def.slotsRequired != null)             props.push([_tn('Slots Required'),   def.slotsRequired]);
    if (def.slots != null)                     props.push([_tn('Max Slots'),        def.slots]);
    var propsHTML = props.length
        ? '<div class="wiki-stats-grid">' + props.map(function(p) {
            return '<span class="wiki-stat-key">' + p[0] + '</span><span class="wiki-stat-val">' + p[1] + '</span>';
          }).join('') + '</div>'
        : '';

    /* Build cost */
    var buildCost = def.buildCost || {};
    var buildCostHTML = Object.keys(buildCost).length > 0
        ? '<div class="wiki-build-cost">' + Object.entries(buildCost).map(function(e) {
            var item = e[0], qty = e[1];
            var itemDef = rawDB.items && rawDB.items[item];
            return '<div class="wiki-build-item" ' + _oc('wikiSwitchToItem', item) + '>'
                + _itemIcon(itemDef ? itemDef.id : 0, 22)
                + '<span>' + item + ' \xd7' + qty + '</span></div>';
          }).join('') + '</div>'
        : '<p class="wiki-empty">' + _tn('No build materials') + '</p>';

    /* Recipes */
    var recipesHTML = recipes.length === 0
        ? '<p class="wiki-empty">' + _tn('No recipes') + '</p>'
        : recipes.map(function(recipe) {
            var inHTML = Object.keys(recipe.inputs || {}).length > 0
                ? _fmtItems(recipe.inputs)
                : '<em style="font-size:0.78em;color:#666">—</em>';
            var outHTML = _fmtItems(recipe.outputs || {});
            return '<div class="wiki-recipe-row">'
                + '<span class="wiki-star-ph"></span>'
                + '<div class="wiki-recipe-formula">'
                + '<span class="wiki-items">' + inHTML  + '</span>'
                + '<span class="wiki-arrow">→</span>'
                + '<span class="wiki-items">' + outHTML + '</span>'
                + '</div>'
                + '<div class="wiki-recipe-right">'
                + (recipe.baseTime != null ? '<span>' + recipe.baseTime + 's</span>' : '')
                + '</div></div>';
          }).join('');

    pane.innerHTML =
        '<div class="wiki-detail-header">'
        + '<div class="wiki-detail-title-area">'
        + '<h2 class="wiki-detail-name">' + _tn(machineName, 'machines') + '</h2>'
        + '</div></div>'
        + (propsHTML ? '<div class="wiki-section"><div class="wiki-section-title">' + _tn('Properties') + '</div>' + propsHTML + '</div>' : '')
        + '<div class="wiki-section"><div class="wiki-section-title">' + _tn('Build Cost') + '</div>' + buildCostHTML + '</div>'
        + '<div class="wiki-section"><div class="wiki-section-title">' + _tn('Production Recipes') + ' (' + recipes.length + ')</div>' + recipesHTML + '</div>';
}

/* ─── 13. GUIDES INNER HTML ───────────────────────────────────────────────── */
function _buildGuidesInnerHTML() {
    var html = '<div class="help-container">';
    var inGrid = false;
    for (var i = 0; i < HELP_CARDS.length; i++) {
        var item = HELP_CARDS[i];
        if (item.type === 'section') {
            if (inGrid) { html += '</div>'; inGrid = false; }
            html += '<div class="help-section-title">' + ht(item.key) + '</div><div class="help-grid">';
            inGrid = true;
        } else {
            html += '<div class="help-card"><h3>' + ht(item.key + '.title') + '</h3>'
                + '<div class="help-desc">' + ht(item.key + '.desc') + '</div></div>';
        }
    }
    if (inGrid) html += '</div>';
    return html + '</div>';
}

/* ─── 14. SUB-NAV SWITCHER ────────────────────────────────────────────────── */
function wikiSwitchView(view) {
    _currentWikiView = view;
    document.querySelectorAll('.wiki-tab-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Always remove the outside-click listener; re-add only when entering items view
    document.removeEventListener('click', _onChipOutsideClick);

    var area = document.getElementById('wiki-area');
    if (!area) return;

    if (view === 'guides') {
        area.className = 'wiki-guides-area';
        area.innerHTML = _buildGuidesInnerHTML();
    } else if (view === 'items') {
        area.className = 'wiki-split-area';
        area.innerHTML = _buildItemSplitHTML();
        document.addEventListener('click', _onChipOutsideClick);
        if (_selectedItem) _renderItemDetail(_selectedItem);
    } else if (view === 'machines') {
        area.className = 'wiki-split-area';
        area.innerHTML = _buildMachineSplitHTML();
        if (_selectedMachine) _renderMachineDetail(_selectedMachine);
    }
}

/* ─── 15. ENTRY POINTS ────────────────────────────────────────────────────── */
function initHelpPage() {
    _injectHelpStyles();
    renderHelpPage();
}

function renderHelpPage() {
    var container = document.getElementById('view-help');
    if (!container) return;
    container.innerHTML =
        '<div id="help-inner">'
        + '<div class="wiki-subnav">'
        + '<button class="wiki-tab-btn" data-view="guides"   ' + _oc('wikiSwitchView', 'guides')   + '>' + _tn('Guides')   + '</button>'
        + '<button class="wiki-tab-btn" data-view="items"    ' + _oc('wikiSwitchView', 'items')    + '>' + _tn('Items')    + '</button>'
        + '<button class="wiki-tab-btn" data-view="machines" ' + _oc('wikiSwitchView', 'machines') + '>' + _tn('Machines') + '</button>'
        + '</div>'
        + '<div id="wiki-area"></div>'
        + '</div>';
    wikiSwitchView(_currentWikiView);
}
