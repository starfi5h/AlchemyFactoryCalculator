// Translation helper function
function t(text, category = 'ui') {
    if (!text) return "";
    if (window.ALCHEMY_I18N.enabled === false) return text;
    const i18n = window.ALCHEMY_I18N;
	const translatedText = i18n?.[category]?.[text];
	if (!translatedText && category != 'ui') {
		console.info(`[i18n][${category}] Missing: ${text}`);
	}	
    return translatedText ?? text;
}

// Input item name, return the translated item name. And vice versice
function queryDualItemName(itemName) {
    const i18n = window.ALCHEMY_I18N;
    if (!i18n || !i18n.items) return "";
    const translatedText = i18n.items[itemName];
    if (translatedText) return translatedText;
    for (const [originalName, nameInDb] of Object.entries(i18n.items)) {
        if (nameInDb === itemName) return originalName;
    }
    return "";
}

function translateDatabase(db, forward) {
    const i18n = window.ALCHEMY_I18N;
    if (!db || !i18n || !i18n.items) return;
    if (i18n.enabled === false) return;

    const item2translate = new Map();
    const translate2item = new Map();
    for (let key in i18n.items) {
        const value = i18n.items[key];
        item2translate.set(key, value);
        translate2item.set(value, key);
    }
    const forwardMap = forward ? item2translate : translate2item;
    const invertedMap = forward ? translate2item : item2translate;
    const missingKeys = new Set();

    const getT = (str) => {
        if (!str) return str; 
        const translated = forwardMap.get(str);
        if (translated === undefined) {
            if (!invertedMap.has(str)) missingKeys.add(str);
            return str;
        }
        return translated;
    };

    // Destructive replace the item keys
    if (db.items) {
        const newItems = {};
        for (let key in db.items) {
            const newKey = getT(key);
            const itemData = db.items[key];
            newItems[newKey] = itemData;
        }
        db.items = newItems;
    }

    if (db.machines) {
        const newMachines = {};
        for (let key in db.machines) {
            const machineData = db.machines[key];        
            if (machineData.buildCost) {
                const newCost = {};
                for (let mat in machineData.buildCost) {
                    newCost[getT(mat)] = machineData.buildCost[mat];
                }
                machineData.buildCost = newCost;
            }
            newMachines[key] = machineData;
        }
        db.machines = newMachines;
    }

    if (db.recipes) {
        db.recipes.forEach(recipe => {        
            const newInputs = {};
            for (let inKey in recipe.inputs) {
                newInputs[getT(inKey)] = recipe.inputs[inKey];
            }
            recipe.inputs = newInputs;

            const newOutputs = {};
            for (let outKey in recipe.outputs) {
                newOutputs[getT(outKey)] = recipe.outputs[outKey];
            }
            recipe.outputs = newOutputs;

            const newOutputs1 = {};
            for (let outKey in recipe.unstableOutputs) {
                newOutputs1[getT(outKey)] = recipe.unstableOutputs[outKey];
            }
            recipe.unstableOutputs = newOutputs1;

            const newOutputs2 = {};
            for (let outKey in recipe.resonantOutputs) {
                newOutputs2[getT(outKey)] = recipe.resonantOutputs[outKey];
            }
            recipe.resonantOutputs = newOutputs2;

            if (recipe.buildCost) {
                recipe.buildCost = getT(recipe.buildCost);
            }
        });
    }
    
    if (db.settings) {
        if (db.settings.defaultFuel) db.settings.defaultFuel = getT(db.settings.defaultFuel);
        if (db.settings.defaultFert) db.settings.defaultFert = getT(db.settings.defaultFert);    
        const newPrefs = {};
        for (let itemKey in db.settings.preferredRecipes) {
            newPrefs[getT(itemKey)] = db.settings.preferredRecipes[itemKey];
        }
        db.settings.preferredRecipes = newPrefs;
        const customCosts = {};
        for (let itemKey in db.settings.customCosts) {
            customCosts[getT(itemKey)] = db.settings.customCosts[itemKey];
        }
        db.settings.customCosts = customCosts;
        if (db.settings.recipeModifiers) {
            for (let recipeId in db.settings.recipeModifiers) {
                const mod = db.settings.recipeModifiers[recipeId];
                if (mod && mod.customInput) mod.customInput = getT(mod.customInput);
            }
        }
    }

    if (missingKeys.size > 0) {
        console.warn(`DB Translate: Missing ${missingKeys.size} keys\n` + [...missingKeys]);
    }
    console.log("Database successfully translated.");
}


window.ALCHEMY_I18N = {    
    "version": 1,
    "enabled": true,
    "ui": {
        // --- 0. Title ---
        "Alchemy Factory Calculator": "炼金工厂计算器",
        "Game version : ": "游戏版本 : ",
        "Calculator": "计算器",
        "Cauldron": "炼金锅",
        "Advanced Cauldron": "高级炼金锅",
        "Database Editor": "数据库",
        "New database version available": "发现新版本数据库",
        "Current local version:": "您的本地版本为:",
        "Update Now": "立即更新",
        "Skip Update": "略过更新",
        "Reset All Database?": "是否重置所有数据库?",

        // --- 1. Production Goal ---
        "Production Goal": "生产目标",
        "MULTI": "多产物",
        "+ Add Item": "+ 添加需求物品",
        "💾 Save List": "💾 保存列表",
        "📂 Load List": "📂 加载列表",
        "⚡ Fuel/Fert 1-Machine Quick Set": "⚡ 快速设定燃料/肥料(单机器)",
        "Target Item": "目标物品",
        "Select or Type...": "选择或输入...",
        "Set by Machine Count": "按机器数量设置",
        "Machine Count": "机器数量",
        "Belt Load Fraction": "传送带负载比例",
        "Belt": "带",
        "Custom Rate": "自定义速率",
        "Rate (Items/Min)": "速率 (个/分钟)",
        "Select Item": "选择物品",
        "Expand All": "全部展开",
        "Collapse All": "全部收起",
        "All Items": "所有物品",
        "Browse Items": "浏览物品清单",

        // --- 2. Logistics ---
        "Logistics": "物流设置",
        "Heating Device": "加热设备",
        "Fuel Source": "燃料来源",
        "Fertilizer Source": "肥料来源",
        "slots": "格",
        "Self-Fuel: OFF": "自供燃料: 关",
        "Self-Fuel: ON": "自供燃料: 开",
        "Self-Fert: OFF": "自供肥料: 关",
        "Self-Fert: ON": "自供肥料: 开",
        "Cost (/item):" : "成本设置(每个):",
        "UI Size": "版面大小",
        "Show Belt Count": "显示传送带需求",
        "Show Machine Usage": "显示机器消耗用量",
        "Show Machine Max Cap": "显示机器产能上限",        
        "Show Machine Heat & Nutr": "显示机器热值&肥力用量",
        

        // --- 3. Tree & Nodes ---
        "Summary": "摘要",
        "Gross Output": "总产出",
        "Total Load": "总负载",
        "Unit Cost": "单位成本",
        "Unit Value": "单位价值",
        "Coin": "铜币",
        "Heat": "热值",
        "Steam": "蒸汽",
        "Nutr": "肥力",
        "Conversion Cost": "总成本",
        "Retail Price   ": "零售价",
        "Wholesale Price": "批发价",
        "Cost Per Exp   ": "每经验成本",
        "Fuel Value": "燃料换算价值",
        "Fert Value": "肥料换算价值",

        "Production Chain": "生产链",
        "Recycle All": "全部回收",
        "Un-recycle All": "全部不回收",
        "Swap Recipe": "替换配方",
        "Input": "输入",
        "Output": "输出",
        "Yields": "产出",
        "Avail": "可用",
        "Used": "已用",
        "Raw Input": "原料输入",
        "External Input": "外部输入",

        "Recipe": "配方",
        "Base Time": "原始时间",
        "Speed Mult": "速度倍率",
        "Throughput": "单设备产量",
        "Internal Nutrient Module": "内部肥料模块",
        "Internal Heat Module": "内部燃料模块",

        "Common Nodes": "共同节点",

        "--- External Inputs ---": "--- 外部输入 ---",
        "Raw Material Cost": "原料成本",
        "Fuel Import": "燃料输入",
        "Fertilizer Import": "肥料输入",

        "--- BYPRODUCTS ---": "--- 副产物 ---",
        "None": "无",
        "recycled": "已回收",

        // --- 4. Construction List ---
        "Construction List": "建造清单",
        "Total Materials Required": "总计材料需求",
        "Total Slots": "总计格子数",

        // --- 5. Upgrades ---
        "Upgrades (Levels)": "升级",
        "Logistics Efficiency": "物流效率",
        "Factory Efficiency": "工厂效率",
        "Alchemy Skill": "炼金技术",
        "Fuel Efficiency": "燃料效率",
        "Fert Efficiency": "肥料效率",
        "Sales Ability": "销售能力",

        // --- 6. Save/Reset ---
        "Send to Planner": "传至规划器",
        "Save/Reset": "保存/重置",
        "Save Upgrades": "保存设置",
        "Reset Recipes": "重置配方数据",
        "Reset Translations": "重置翻译",
        "All Data Reset": "全部重置",

        // --- 7. Data Editor ---
        "Apply Changes": "应用更改",
        "Export to File": "导出到文件",

        // --- Cauldron ---
        "Settings & Candidates": "炼金原料设置",
        "Profile 1": "原料池1",
        "Profile 2": "原料池2",
        "Profile 3": "原料池3",
        "Filter Category": "筛选分类",
        "Select All": "全选",
        "Deselect All": "取消全选",
        "Sort by Value": "以炼金价值排序",
        "Real-time": "实时",
        "Filtered Results": "炼金配方匹配结果",
        "Number of matching recipes" : "符合条件的配方总数",
        "Calculate All": "计算全部",
        "Set Input": "指定原料",
        "2 Diff": "2件不同",
        "3 Diff": "3件不同",
        "2 Same": "2件相同",
        "3 Same": "3件相同",
        "Unattainable Targets": "无法达成的目标",
        "Saved Recipes": "已保存配方",
        "Import": "导入",
        "Export": "导出",
        "Sync DB": "同步数据库",
        "No saved recipes yet.": "暂无保存的配方。",
        "+ Add Cauldron Recipe": "+ 新增炼金锅配方",
        "Valid Range": "有效区间",
        "Target Value": "目标价值",
        "Distance to lower bound": "距下界",
        "Distance to upper bound": "距上界",
        "Current Product": "当前产物",
        "Current Value": "当前价值",

        // Modal
        "Adjust Ratio": "调整比例",
        "Output Rate (/min)": "产能 (/min)",
        "Belt Count": "传送带数",
        "Scaling Ratio": "缩放比",

        "Select Recipe": "选择配方",
        "Select Recipe for ": "切换配方 ",
        "Global": "全局",
        "This Node Only": "仅此节点",
        "Catalysts": "催化剂",
        "Charge Cost": "消耗充能",
        "🧪 Unstable": "🧪 不稳定",
        "🌿 Fertile": "🌿 丰饶",
        "✨ Resonant": "✨ 共振",
        "♾️ Eternal": "♾️ 永恒",

        "Select Input Item": "选择输入物品",
        "Please select an input item first.": "请先选择一个输入物品。",
        "Selected item is missing baseCost data.": "该物品缺少 baseCost 数据，暂无法使用。",
        "Cannot select the output item itself as input.": "不能选择产物本身作为输入。",

        "⚙ Manage Custom Costs": "⚙ 管理自订成本",
        "Manage Custom Costs": "管理自订成本",
        "No custom costs set.": "尚未设定任何自订成本。",
        "Add Item": "新增物品",

        // --- Help ---
        "Guides": "指南",
        "Items": "物品",
        "Machines": "机器",
        "Category": "类别",
        "Tier": "等级",
                
        "Properties": "属性",
        "Has Value": "有值",
        "Quick select (exact)": "快速选择",
        "Buy Price": "买入价格",
        "Sell Price": "卖出价格",
        "Wholesale Price": "批发价格",
        "Heat Value": "热值",
        "Nutrient Cost": "营养值消耗",
        "Nutrient Value": "营养值",
        "Max Fertility": "最大肥力",
        "Cauldron Cost": "炼金价值",
        "Cauldron Target": "炼金目标",
        "Charges": "充能数",
        "Max Stack": "最大堆叠",
        "Exp": "经验",

        "Production Recipes": "生产配方",
        "Used In": "使用于",
        "Build Cost": "建造材料",
        "Heat Cost": "热值消耗",
        "Slots Required": "占地(格子)",
        "Heat Cost (Self)": "自热消耗",
        "Max Slots": "占地(格子)",
        "Type": "类型",        
        "Fertilizer Device": "施肥设备",
        
        "No production recipes": "无生产配方",
        "Not used in any recipe": "未被任何配方使用",
        "No build materials": "无建造材料",
        "No recipes": "无配方",
        "Set as Preferred": "设为首选",
        "Remove Preferred": "取消首选",
        "Search items...": "搜索物品...",
        "Search machines...": "搜索机器...",
        "← Select an item": "← 选择一个物品",
        "← Select a machine": "← 选择一台机器",
        "Item data not found": "未找到物品数据",
        "Machine data not found": "未找到机器数据",

        "per machine (/min)": "每单位机器 (/min)",
        "Apply": "应用",

        // --- Planner ---
        "Planner": "规划器",
        "+ Add Node": "+ 新增节点",
        "▭ Select Mode": "▭ 框选模式",
        "↺ Undo": "↺ 撤销",
        "↻ Redo": "↻ 重做",
        "📦 Encapsulate": "📦 封裝模块",

        // --- Planner: Node ---        
        "Node Settings": "节点设置",
        "Link machine count changes": "链接机器数变化",
        "This item has no recipe and cannot be added as a Planner node.": "该物品没有生产配方，无法新增为节点。",
        "Auto-generate upstream": "自動生成上游节点",
        "Remove Node": "移除节点",
        "Load Module": "載入模块",
        "Port Balance": "端口平衡",
        "Graph Tools": "图表工具",
        "Select All Upstream": "选取所有上游节点",
        "Auto-Layout Upstream": "自动布局上游节点",
        "Populate All Upstream": "生成所有上游节点",
        "Clear All Upstream": "清空所有上游节点",
        "Error": "错误",
        "Module": "模块",
        "Invaild Module": "无效模块",
        "Missing Recipe": "配方缺失",
        "Missing Reference": "引用缺失",
        "Circular Reference": "循环引用",
        "No recipe selected": "尚未选择配方",
        "CONSUME": "消耗",
        "PRODUCE": "生产",

        // --- Planner: Edge ---
        "Source": "来源",
        "Target": "目标",
        "Current Flow": "当前流量",
        "Set Flow": "设置流量",
        "Link mode ON: also scales upstream/downstream nodes": "链接模式开启：同时缩放上游/下游节点",
        "Link mode OFF: only affects source and target nodes": "链接模式关闭：仅影响源节点和目标节点",
        "Delete Connection": "删除连接",
        

        // --- Planner: Plan Library ---
        "Manage Plans": "管理方案",
        "📁 Manage Plans": "📁 管理方案",        
        "Default Plan": "預設方案",
        "Imported Plan": "已匯入方案",
        "(Copy)": "(複製)",
        "Active": "使用中",
        "Delete this plan?": "確定要刪除此方案嗎?",
        "Failed to import plan: ": "匯入方案失敗: ",
        "Uses N modules": "使用了 N 个模组",
        "Used by N plans": "被 N 个方案引用",
        "Circular module reference": "模组循环引用",
        "Cycle": "循环",

        "just now": "剛剛",
        "min ago": "分鐘前",
        "hr ago": "小時前",
        "days ago": "天前",

        "▶ Load": "▶ 載入",
        "✎ Rename": "✎ 重新命名",
        "⧉ Duplicate": "⧉ 複製",
        "📦 Import as Module": "📦 导入为模块",
        "New Plan": "新方案",
        "🗑 Delete": "🗑 刪除",
        "⭳ Export": "⭳ 匯出",
        "⭱ Import": "⭱ 匯入"
    },
    "items": {
        // Game version: 0.4.3.4071
        // Group by meaning

        // --- RAW RESOURCES ---
        "Logs": "原木",
        "Limestone": "石灰石",
        "Iron Ore": "铁矿石",
        "Pyrite Ore": "硫铁矿",
        "Quartz Ore": "石英矿",
        "Rock Salt": "岩盐",
        "Coal Ore": "煤矿石",
        "Rotten Log": "腐烂原木",
        "Meteorite": "陨石",

        // --- SEEDS ---
        "Flax Seeds": "亚麻种子",
        "Sage Seeds": "鼠尾草种子",
        "Redcurrant Seeds": "红醋栗种子",
        "Lavender Seeds": "薰衣草种子",
        "Chamomile Seeds": "洋甘菊种子",
        "Gentian Seeds": "龙胆花种子",
        "World Tree Seed": "世界树种子",

        // --- HERBS ---
        "Flax": "亚麻",
        "Sage": "鼠尾草",
        "Redcurrant": "红醋栗",
        "Lavender": "薰衣草",
        "Chamomile": "洋甘菊",
        "Gentian": "龙胆花",
        "Gentian Nectar": "龙胆花蜜",
        "Gentian Mixture": "龙胆花混合",
        "World Tree Leaf": "世界树之叶",
        "World Tree Core": "世界树核心",
        "Gloom Fungus": "幽暗菇",

        // --- FUELS & FERTILIZERS---
        "Plank": "木材",
        "Charcoal": "木炭",
        "Charcoal Powder": "木炭粉",
        "Coke": "焦炭",
        "Coke Powder": "焦炭粉",
        "Coal": "煤炭",
        "Black Powder": "火药",
        "Basic Fertilizer": "初级肥料",
        "Advanced Fertilizer": "高级肥料",

        // --- SOLIDS & MATERIALS ---
        "Stone": "碎石",
        "Sand": "沙子",
        "Clay": "粘土",
        "Brick": "砖头",
        "Glass": "玻璃",
        "Sulfur": "硫磺",
        "Salt": "盐",

        // --- POWDERS & DUSTS ---
        "Flax Fiber": "亚麻纤维",
        "Sage Powder": "鼠尾草粉",
        "Plant Ash": "植物灰",
        "Quicklime": "生石灰",
        "Quicklime Powder": "石灰粉",
        "Clay Powder": "粘土粉",
        "Sulfur Powder": "硫磺粉",
        "Chamomile Powder": "洋甘菊粉",
        "Gentian Powder": "龙胆花粉",
        "Yeast Powder": "酵母粉",
        "Soap Powder": "肥皂粉",
        "Perfumed Soap Powder": "香皂粉",
        "Volcanic Ash": "火山灰",
        "Star Dust": "星之尘",
        "Fairy Dust": "精灵粉末",

        // --- METALS ---
        "Iron Sand": "铁砂",
        "Iron Ingot": "铁锭",
        "Steel Ingot": "钢锭",
        "Impure Copper Powder": "不纯的铜粉",
        "Bronze Ingot": "青铜锭",
        "Copper Powder": "铜粉",
        "Copper Ingot": "铜锭",
        "Crude Silver Powder": "粗劣的银粉",
        "Impure Silver Powder": "不纯的银粉",
        "Silver Powder": "银粉",
        "Silver Ingot": "银锭",
        "Crude Gold Dust": "粗劣的砂金",
        "Impure Gold Dust": "不纯的砂金",
        "Gold Dust": "砂金",
        "Pure Gold Dust": "纯净的砂金",
        "Gold Ingot": "金锭",

        // --- COMPONENTS ---
        "Linen Thread": "亚麻线",
        "Linen Rope": "麻绳",
        "Large Wooden Gear": "木制大齿轮",
        "Small Wooden Gear": "木制小齿轮",
        "Iron Nails": "铁钉",
        "Wooden Pulley": "木滑轮",
        "Steel Gear": "钢齿轮",
        "Copper Bearing": "铜轴承",
        "Bronze Rivet": "青铜铆钉",

        // --- GOODS & CURRENCY ---
        "Mortar": "研钵",
        "Linen": "麻布",
        "Bandage": "绷带",
        "Soap": "肥皂",
        "Perfumed Soap": "香皂",
        "Moonlit Soap": "月光皂",
        "Pocket Watch": "怀表",
        "Clockwork Bird": "发条鸟",
        "Silver Amulet": "银护身符",
        "Crown": "皇冠",
        "Copper Coin": "铜币",
        "Silver Coin": "银币",
        "Gold Coin": "金币",

        // --- LIQUIDS ---
        "Linseed Oil": "亚麻籽油",
        "Fruit Wine": "浆果酒",
        "Limewater": "石灰水",
        "Brine": "盐水",
        "Lavender Essential Oil": "薰衣草精油",
        "Brandy": "白兰地",
        "Sulfuric Acid": "硫酸",
        "Quicksilver": "水银",
        "Aqua Vitae": "生命之水",
        "Fairy Tear": "精灵之泪",
        "Moon Tear": "月之泪",
        "Steam": "蒸气",

        // --- POTIONS ---
        "Healing Potion": "治疗药水",
        "Vitality Potion": "活力药水",
        "Transformation Potion": "变形药水",
        "Blast Potion": "爆炸药水",
        "Growth Potion": "成长药水",
        "Panacea Potion": "万灵药",

        // --- CATALYSTS & MAGIC ---
        "Gloom Spores": "幽暗孢子",
        "Unstable Catalyst": "不稳定催化剂",
        "Fertile Catalyst": "丰饶催化剂",
        "Resonant Catalyst": "共振催化剂",
        "Eternal Catalyst": "永恒催化剂",
        "Oblivion Essence": "湮灭精华",
        "Vitality Essence": "生命精华",
        "Philosopherˈs Stone": "贤者之石",

        // --- GEMS & SHARDS ---
        "Crude Shard": "粗劣的晶片",
        "Broken Shard": "破碎的晶片",
        "Dull Shard": "暗淡的晶片",
        "Shattered Crystal": "碎裂的晶石",
        "Crude Crystal": "粗糙的晶石",
        "Polished Crystal": "抛光的晶石",
        "Adamant": "金刚石",
        "Diamond": "钻石",
        "Perfect Diamond": "完美的钻石",
        "Turquoise": "绿松石",
        "Malachite": "孔雀石",
        "Topaz": "黄玉",
        "Obsidian": "黑曜石",
        "Lapis Lazuli": "青金石",
        "Ruby": "红宝石",
        "Sapphire": "蓝宝石",
        "Emerald": "祖母绿",

        // --- RELICS ---
        "Jupiter": "木星",
        "Saturn": "土星",
        "Mars": "火星",
        "Venus": "金星",
        "Mercury": "水星",
        "Luna": "月曜",
        "Sol": "日耀",

        // --- SPECIAL ---
        "Portal Sigil": "传送门印章",
        "Gelatinous Gridlock": "格姆胶",
        "Automatic Cashier": "自动收银机"
    },
    "machines": {
        "Table Saw": "锯木机",
        "Stone Crusher": "碎石机",
        "Seed Plot": "种植地块",
        "Grinder": "研磨机",
        "Enhanced Grinder": "强化研磨机",
        "Extractor": "萃取机",
        "Thermal Extractor": "热能萃取机",
        "Stone Furnace": "石炉",
        "Blast Furnace": "高温炉",
        "Steam Heating Pad": "蒸气加热板",
        "Crucible": "坩埚",
        "Stackable Crucible": "可堆叠坩埚",
        "Paradox Crucible": "悖论坩埚",
        "Cauldron": "炼金锅",
        "Advanced Cauldron": "高级炼金锅",
        "Steam Boiler": "蒸气锅炉",
        "Kiln": "土窑",
        "Iron Smelter": "炼铁炉",
        "Refiner": "精炼机",
        "Processor": "加工机",
        "Arcane Processor": "奥术加工机",
        "Assembler": "组装机",
        "Advanced Assembler": "高级组装机",
        "Blender": "混合机",
        "Advanced Blender": "高级混合机",
        "Alembic": "蒸馏器",
        "Advanced Alembic": "高级蒸馏器",
        "Athanor": "炼金炉",
        "Advanced Athanor": "高级炼金炉",
        "Shaper": "雕刻机",
        "Advanced Shaper": "高级雕刻机",
        "Arcane Shaper": "奥术雕刻机",
        "Nursery": "育苗圃",
        "World Tree Nursery": "世界树育苗圃",
        "Knowledge Altar": "知识祭坛",
        "Purchasing Portal": "进货传送门",
        "Dispatch Portal": "发货传送门",
        "Bank Portal": "银行传送门"
    },
    "categories": {
        "Raw Materials": "原材料", "Seeds": "种子", "Herbs": "草药", "Bio-Based": "植物基", "Fuel": "燃料", "Fertilizer": "肥料", "Solid": "固体", "Crystal": "晶石", "Component": "建材", "Liquid": "液体",
        "Mash": "研磨物", "Metal": "金属", "Potion": "药水", "Catalyst": "催化剂", "Magic": "魔法", "Jewelry": "珠宝", "Relic": "圣物", "Currency": "货币", "Other": "其他",
        "[All]": "[ 全部 ]", "[Include]": "[ 选取 ]", "[Exclude]": "[ 排除 ]", "[Product]": "[ 产物 ]"
    }
};
