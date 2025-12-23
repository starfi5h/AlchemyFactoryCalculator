// Translation helper function
function t(text, category = 'ui') {
    if (!text) return "";
    const i18n = window.ALCHEMY_I18N;
	const translatedText = i18n?.[category]?.[text];
	if (!translatedText && category != 'ui') {
		console.warn(`[i18n][${category}] Missing: ${text}`);
	}	
    return translatedText ?? text;
}

function translateDatabase(db) {
    if (!window.ALCHEMY_I18N) return;
    const i18n = window.ALCHEMY_I18N;

    const itemMap = i18n.items || {};
    const invertedMap = new Map();
    for (let key in itemMap) { invertedMap.set(itemMap[key], key); }
    const missingKeys = new Set();

    const getT = (str, map) => {
        if (!map[str]) {
            if (!invertedMap.has(str)) missingKeys.add(str);
            return str;
        }
        return map[str];}

    // Destructive replace the item keys
    const newItems = {};
    for (let key in db.items) {
        const newKey = getT(key, itemMap);
        const itemData = db.items[key];
        newItems[newKey] = itemData;
    }
    db.items = newItems;   

    const newMachines = {};
    for (let key in db.machines) {
        const machineData = db.machines[key];        
        if (machineData.buildCost) {
            const newCost = {};
            for (let mat in machineData.buildCost) {
                newCost[getT(mat, itemMap)] = machineData.buildCost[mat];
            }
            machineData.buildCost = newCost;
        }
        newMachines[key] = machineData;
    }
    db.machines = newMachines;

    db.recipes.forEach(recipe => {        
        const newInputs = {};
        for (let inKey in recipe.inputs) {
            newInputs[getT(inKey, itemMap)] = recipe.inputs[inKey];
        }
        recipe.inputs = newInputs;

        const newOutputs = {};
        for (let outKey in recipe.outputs) {
            newOutputs[getT(outKey, itemMap)] = recipe.outputs[outKey];
        }
        recipe.outputs = newOutputs;
    });
    
    if (db.settings.defaultFuel) db.settings.defaultFuel = getT(db.settings.defaultFuel, itemMap);
    if (db.settings.defaultFert) db.settings.defaultFert = getT(db.settings.defaultFert, itemMap);
    
    const newPrefs = {};
    for (let itemKey in db.settings.preferredRecipes) {
        newPrefs[getT(itemKey, itemMap)] = db.settings.preferredRecipes[itemKey];
    }
    db.settings.preferredRecipes = newPrefs;

    if (missingKeys.size > 0) {
        console.warn(`DB Translate: Missing ${missingKeys.size} keys\n` + [...missingKeys]);
    }
    console.log("Database successfully translated.");
}


window.ALCHEMY_I18N = {
    "version": 1,
    "ui": {
        // --- 0. Title ---
        "Alchemy Factory Planner": "炼金工厂計算器",
        "Calculator": "計算器",
        "Database Editor": "编辑数据库",
        "New database version available": "发现新版本数据库",
        "Current local version:": "您的本地版本为:",
        "Update Now": "立即更新",
        "Skip Update": "略过更新",
        "Reset All Database?": "是否重置所有数据库?",

        // --- 1. Production Goal ---
        "Production Goal": "生产目标",
        "Target Item": "目标物品",
        "Select or Type...": "选择或输入...",
        "Belt Load Fraction": "传送带负载比例",
        "Belt": "带",
        "Custom Rate": "自定义速率",
        "Rate (Items/Min)": "速率 (个/分钟)",

        // --- 2. Logistics ---
        "Logistics": "物流设置",
        "Heat Source": "燃料来源",
        "Fertilizer Source": "肥料来源",
        "Self-Fuel: OFF": "自供燃料: 关",
        "Self-Fuel: ON": "自供燃料: 开",
        "Self-Fert: OFF": "自供肥料: 关",
        "Self-Fert: ON": "自供肥料: 开",
        "Make Default": "设为默认",
        "Current Default": "当前默认",
        "Show Machine Max Cap": "显示机器产能上限",

        // --- 3. Tree & Nodes ---
        "Net Output": "净产出",
        "Internal Load": "内部负载",
        "External Load": "外部负载",
        "Projected Profit": "预计利润",
        "Total Raw Cost": "原料总成本",
        "Belt Usage (Net)": "带宽占用",
        "Heat": "热值",
        "Nutr": "肥力",
        "Cap": "上限",

        "Primary Production Chain": "主生产链",
        "Select Recipe": "选择配方",
        "Select Recipe for ": "切换配方 ",
        "Input": "输入",
        "Yields": "产出",
        "Avail": "可用",
        "Used": "已用",
        "Raw Input": "原料输入",

        "Internal Nutrient Module": "内部肥料模块",
        "Internal Heat Module": "内部燃料模块",

        "--- External Inputs ---": "--- 外部输入 ---",
        "Raw Material Cost": "原料成本",
        "Fuel Import": "燃料输入",
        "Fertilizer Import": "肥料输入",

        "--- BYPRODUCTS ---": "--- 副产物 ---",
        "None": "无",
        "recycled": "已回收",

        // --- 4. Construction List ---
        "Construction List": "建造清单",
        "Total Materials Required (Minimum)": "总计材料需求 (最小值)",

        // --- 5. Upgrades ---
        "Upgrades (Levels)": "升级",
        "Belt Speed": "传送带速度",
        "Factory Speed": "工厂速度",
        "Alchemy Skill": "炼金技术",
        "Fuel Efficiency": "燃料效率",
        "Fert Efficiency": "肥料效率",

        // --- 6. Save/Reset ---
        "Save/Reset": "保存/重置",
        "Save Upgrades": "保存设置",
        "Factory Reset": "恢复出厂设置",

        // --- 7. Data Editor ---
        "Apply Changes": "应用更改",
        "Export to File": "导出到文件"        
    },
    "items": {
        // Order by in-game codex

        // --- 1. RAW RESOURCES ---
        "Logs": "原木",
        "Limestone": "石灰石",
        "Iron Ore": "铁矿石",
        "Coal Ore": "煤矿石",
        "Pyrite Ore": "硫铁矿",
        "Quartz Ore": "石英矿",
        "Rock Salt": "岩盐",
        "Rotten Log": "腐烂原木",
        "Meteorite": "陨石",

        // --- 2. SEEDS ---
        "Flax Seed": "亚麻种子",
        "Sage Seed": "鼠尾草种子",
        "Red Currant Seed": "紅醋栗种子",
        "Lavender Seed": "薰衣草种子",
        "Chamomile Seed": "洋甘菊种子",
        "Gentian Seed": "龙胆花种子",
        "World Tree Seed": "世界树种子",

        // --- 3. HERBS ---
        "Flax": "亚麻",
        "Sage": "鼠尾草",
        "Redcurrant": "紅醋栗",
        "Lavender": "薰衣草",
        "Chamomile": "洋甘菊",
        "Gentian": "龙胆花",
        "Gentian Nectar": "龙胆花蜜",
        "Gloom Fungus": "幽暗菇",
        "World Tree Leaf": "世界树之叶",
        "World Tree Core": "世界树核心",

        // --- 4. FUELS ---
        "Plank": "木材",
        "Charcoal": "木炭",
        "Charcoal Powder": "木炭粉",
        "Coal": "煤炭",
        "Coke": "焦炭",
        "Coke Powder": "焦炭粉",
        "Black Powder": "火药",
        "Blast Potion": "爆炸药水",
        "Panacea Potion": "万灵药",

        // --- 5. SOLIDS & MATERIALS ---        
        "Stone": "碎石",
        "Sand": "沙子",
        "Clay": "粘土",
        "Brick": "砖头",
        "Glass": "玻璃",
        "Sulfur": "硫磺",
        "Salt": "盐",
        "Adamant": "金刚石",
        "Obsidian": "黑曜石",

        // --- 6. POWDERS & DUSTS ---
        "Flax Fiber": "亚麻纤维",
        "Sage Powder": "鼠尾草粉",
        "Plant Ash": "植物灰",
        "Quicklime": "生石灰",
        "Quicklime Powder": "石灰粉",
        "Clay Powder": "粘土粉",
        "Iron Sand": "铁砂",
        "Sulfur Powder": "硫磺粉",
        "Chamomile Powder": "洋甘菊粉",
        "Gentian Powder": "龙胆花粉",        
        "Yeast Powder": "酵母粉",
        "Soap Powder": "肥皂粉",
        "Perfumed Soap Powder": "香皂粉",
        "Gloom Spores": "幽暗孢子",
        "Volcanic Ash": "火山灰",
        "Impure Copper Powder": "不纯的铜粉",
        "Copper Powder": "铜粉",
        "Crude Silver Powder": "粗劣的银粉",
        "Impure Silver Powder": "不纯的银粉",
        "Silver Powder": "银粉",
        "Crude Gold Dust": "粗劣的砂金",
        "Impure Gold Dust": "不纯的砂金",
        "Gold Dust": "砂金",
        "Pure Gold Dust": "纯净的砂金",
        "Star Dust": "星尘",
        "Fairy Dust": "精灵尘",

        // --- 7. METALS ---
        "Iron Ingot": "铁锭",        
        "Steel Ingot": "钢锭",
        "Bronze Ingot": "青铜锭",
        "Copper Ingot": "铜锭",        
        "Silver Ingot": "银锭",
        "Gold Ingot": "金锭",

        // --- 8. COMPONENTS ---
        "Linen Thread": "亚麻线",
        "Linen Rope": "麻绳",
        "Large Wooden Gear": "木制大齿轮",
        "Small Wooden Gear": "木制小齿轮",
        "Iron Nails": "铁钉",
        "Wooden Pulley": "木滑轮",
        "Steel Gear": "钢齿轮",
        "Copper Bearing": "铜轴承",
        "Bronze Rivet": "青铜铆钉",

        // --- 9. GOODS & CURRENCY ---        
        "Mortar": "研钵",
        "Linen": "麻布",
        "Bandage": "绷带",
        "Soap": "肥皂",
        "Perfumed Soap": "香皂",
        "Moonlit Soap": "月光皂",
        "Pocket Watch": "怀表",
        "Silver Amulet": "银护身符",
        "Crown": "皇冠",
        "Copper Coin": "铜币",
        "Silver Coin": "银币",
        "Gold Coin": "金币",

        // --- 10. LIQUIDS ---
        "Linseed Oil": "亚麻籽油",
        "Fruit Wine": "浆果酒",        
        "Limewater": "石灰水",        
        "Salt Water": "盐水",
        "Lavender Essential Oil": "薰衣草精油",
        "Brandy": "白兰地",
        "Sulfuric Acid": "硫酸",
        "Quicksilver": "水银",
        "Aqua Vitae": "生命之水",
        "Fairy Tear": "精灵之泪",
        "Moon Tear": "月之泪",        

        // --- 11. POTIONS ---
        "Healing Potion": "治疗药水",
        "Vitality Potion": "活力药水",
        "Transformation Potion": "变形药水",
        "Growth Potion": "成長藥水",

        // --- 12. FERTILIZERS & CATALYSTS ---
        "Basic Fertilizer": "初级肥料",
        "Advanced Fertilizer": "高级肥料",
        "Oblivion Essence": "湮灭精华",
        "Vitality Essence": "生命精华",
        "Unstable Catalyst": "不稳定催化剂",
        "Fertile Catalyst": "丰饶催化剂",
        "Resonant Catalyst": "共振催化剂",
        "Eternal Catalyst": "永恒催化剂",
        "Philosopher's Stone": "贤者之石",

        // --- 13. GEMS & SHARDS ---
        "Crude Shard": "粗劣的晶片",
        "Broken Shard": "破碎的晶片",
        "Dull Shard": "暗淡的晶片",
        "Shattered Crystal": "碎裂的晶石",
        "Crude Crystal": "粗糙的晶石",
        "Polished Crystal": "抛光的晶石",
        "Diamond": "钻石",
        "Perfect Diamond": "完美的钻石",
        "Turquoise": "绿松石",
        "Malachite": "孔雀石",
        "Topaz": "黄玉",
        "Lapis Lazuli": "青金石",
        "Ruby": "红宝石",
        "Sapphire": "蓝宝石",
        "Emerald": "祖母绿",

        // --- 14. RELICS ---
        "Jupiter": "木星",
        "Saturn": "土星",
        "Mars": "火星",
        "Venus": "金星",
        "Luna": "月曜",
        "Mercury": "水星",
        "Sol": "日耀",

        // --- 15. SPECIAL / UNGROUPED ---
        "Portal Sigil": "传送门印章",
        "Gelatinous Gridlock": "格姆胶",
        "Automatic Cashier": "自动收銀機"
    },
    "machines": {
        "Table Saw": "锯木机",
        "Stone Crusher": "碎石机",
        "Planting": "种植地块",
        "Grinder": "研磨机",
        "Enhanced Grinder": "强化研磨机",
        "Extractor": "萃取机",        
        "Thermal Extractor": "热能萃取机",
        "Stone Furnace": "石炉",
        "Blast Furnace": "高温炉",
        "Crucible": "坩埚",
        "Stackable Crucible": "可堆叠坩埚",
        "Paradox Crucible": "悖论坩埚",
        "Cauldron": "炼金锅",  
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
        "Knowledge Altar": "知识祭坛"
    },
    "categories": {
        "Raw Materials": "原材料", "Seeds": "种子", "Herbs": "草药", "Fuel": "燃料", "Material": "材料", "Goods": "商品", "Currency": "货币", "Component": "零件",
        "Liquid": "液体", "Potion": "药水", "Catalyst": "催化剂", "Essence": "精华", "Fertilizer": "肥料", "Gem": "宝石", "Relic": "圣物", "Other" : "其他"
    }
};
