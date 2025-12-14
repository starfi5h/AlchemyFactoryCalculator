window.ALCHEMY_DB = {
    "items": {
        // --- Raw Materials ---
        "Logs": { "category": "Raw Materials", "buyPrice": 200, "heat": 2000 },
        "Limestone": { "category": "Raw Materials", "buyPrice": 600 },
        "Iron Ore": { "category": "Raw Materials", "buyPrice": 1200 },
        "Coal Ore": { "category": "Raw Materials", "buyPrice": 1500 },
        "Pyrite Ore": { "category": "Raw Materials" },
        "Quartz Ore": { "category": "Raw Materials" },
        "Meteorite": { "category": "Raw Materials" },
        "Rock Salt": { "category": "Raw Materials" },
        "Volcanic Ash": { "category": "Raw Materials" },
        "Gloom Fungus": { "category": "Raw Materials" }, // Assumed raw/drop for now

        // --- Seeds ---
        "Flax Seed": { "category": "Seeds", "buyPrice": 280 },
        "Sage Seed": { "category": "Seeds", "buyPrice": 360 },
        "Red Currant Seed": { "category": "Seeds", "buyPrice": 1300 },
        "Lavender Seed": { "category": "Seeds" },
        "Gentian Seed": { "category": "Seeds" },
        "Chamomile Seed": { "category": "Seeds" },

        // --- Herbs ---
        "Flax": { "category": "Herbs", "nutrientCost": 24 },
        "Sage": { "category": "Herbs", "nutrientCost": 36 },
        "Red Currant": { "category": "Herbs", "nutrientCost": 144 },
        "Lavender": { "category": "Herbs" },
        "Gentian": { "category": "Herbs" },
        "Chamomile": { "category": "Herbs" },

        // --- Currency ---
        "Copper Coin": { "category": "Currency" },
        "Silver Coin": { "category": "Currency" },
        "Gold Coin": { "category": "Currency" },

        // --- Fuel ---
        "Plank": { "category": "Fuel", "heat": 20 },
        "Charcoal": { "category": "Fuel", "heat": 40 },
        "Charcoal Powder": { "category": "Fuel", "heat": 48 },
        "Coal": { "category": "Fuel", "heat": 540 },
        "Coke": { "category": "Fuel", "heat": 600 },
        "Coke Powder": { "category": "Fuel", "heat": 660 },
        
        // --- High Tier Fuels (Potions that burn) ---
        "Black Powder": { "category": "Potions", "heat": 3000 }, 
        "Blast Potion": { "category": "Potions", "heat": 24000 },
        "Panacea Potion": { "category": "Potions", "heat": 320000 },

        // --- Mash / Powders ---
        "Sage Powder": { "category": "Mash" },
        "Flax Fiber": { "category": "Mash" },
        "Plant Ash": { "category": "Mash" },
        "Iron Sand": { "category": "Mash" },
        "Clay Powder": { "category": "Mash" },
        "Sand": { "category": "Mash" },
        "Quicklime Powder": { "category": "Mash" },
        "Sulfur Powder": { "category": "Mash" },
        "Impure Copper Powder": { "category": "Mash" },
        "Copper Powder": { "category": "Mash" },
        "Silver Powder": { "category": "Mash" },
        "Impure Silver Powder": { "category": "Mash" },
        "Pure Gold Dust": { "category": "Mash" },
        "Chamomile Powder": { "category": "Mash" },
        "Yeast Powder": { "category": "Mash" },
        "Gentian Powder": { "category": "Mash" },

        // --- Solid / Ingots / Minerals ---
        "Stone": { "category": "Solid" },
        "Quicklime": { "category": "Solid" },
        "Clay": { "category": "Solid" },
        "Iron Ingot": { "category": "Solid" },
        "Steel Ingot": { "category": "Solid" },
        "Bronze Ingot": { "category": "Solid" },
        "Copper Ingot": { "category": "Solid" },
        "Silver Ingot": { "category": "Solid" },
        "Gold Ingot": { "category": "Solid" },
        "Sulfur": { "category": "Solid" },
        "Salt": { "category": "Solid" },
        "Obsidian": { "category": "Solid" },
        "Adamant": { "category": "Solid" },

        // --- Gems ---
        "Crude Shard": { "category": "Gems" },
        "Broken Shard": { "category": "Gems" },
        "Crude Crystal": { "category": "Gems" },
        "Polished Crystal": { "category": "Gems" },
        "Shattered Crystal": { "category": "Gems" },
        "Diamond": { "category": "Gems" },
        "Perfect Diamond": { "category": "Gems" },
        "Ruby": { "category": "Gems" },
        "Sapphire": { "category": "Gems" },
        "Emerald": { "category": "Gems" },
        "Topaz": { "category": "Gems" },
        "Turquoise": { "category": "Gems" },
        "Lapis Lazuli": { "category": "Gems" },
        "Malachite": { "category": "Gems" },

        // --- Components ---
        "Linen Thread": { "category": "Components" },
        "Large Wooden Gear": { "category": "Components" },
        "Small Wooden Gear": { "category": "Components" },
        "Steel Gear": { "category": "Components" },
        "Copper Bearing": { "category": "Components" },
        "Bronze Rivet": { "category": "Components" },

        // --- Misc (Parts & Goods) ---
        "Brick": { "category": "Misc", "sellPrice": 70 },
        "Glass": { "category": "Misc", "sellPrice": 75 },
        "Linen Rope": { "category": "Misc", "sellPrice": 36 },
        "Wooden Pulley": { "category": "Misc", "sellPrice": 44 },
        "Iron Nails": { "category": "Misc", "sellPrice": 16 },
        "Mortar": { "category": "Misc", "sellPrice": 48 },
        "Linen": { "category": "Misc", "sellPrice": 165 },
        "Bandage": { "category": "Misc", "sellPrice": 350 },
        "Soap": { "category": "Misc" },
        "Pocket Watch": { "category": "Misc" },
        "Silver Amulet": { "category": "Misc" },
        "Crown": { "category": "Misc" },

        // --- Potions ---
        "Healing Potion": { "category": "Potions", "sellPrice": 85 },
        "Simple Potion": { "category": "Potions" },
        "Oblivion Essence": { "category": "Potions" },
        "Vitality Essence": { "category": "Potions" },
        "Vitality Potion": { "category": "Potions" },
        "Transformation Potion": { "category": "Potions" },
        "Growth Potion": { "category": "Fertilizer", "nutrientValue": 6480, "maxFertility": 2160 }, // Also acts as fert

        // --- Catalysts ---
        "Fertile Catalyst": { "category": "Fertilizer", "nutrientValue": 24000, "maxFertility": 6000 },
        "Resonant Catalyst": { "category": "Catalyst" },
        "Unstable Catalyst": { "category": "Catalyst" },
        "World Tree Core": { "category": "Catalyst" },

        // --- Fertilizer ---
        "Basic Fertilizer": { "category": "Fertilizer", "nutrientValue": 144, "maxFertility": 12 },
        "Advanced Fertilizer": { "category": "Fertilizer", "nutrientValue": 720, "maxFertility": 144 },

        // --- Liquids ---
        "Linseed Oil": { "category": "Liquid" },
        "Fruit Wine": { "category": "Liquid" },
        "Limewater": { "category": "Liquid" },
        "Brandy": { "category": "Liquid" },
        "Aqua Vitae": { "category": "Liquid" },
        "Sulfuric Acid": { "category": "Liquid" },
        "Lavender Essential Oil": { "category": "Liquid" },

        // --- Relics ---
        "Jupiter": { "category": "Relic" },
        "Saturn": { "category": "Relic" },
        "Mars": { "category": "Relic" },
        "Venus": { "category": "Relic" }
    },
    
    "machines": {
        "Stone Furnace": { "heatSelf": 1.0, "isGenerator": true, "slots": 3 },
        "Blast Furnace": { "heatSelf": 4.0, "isGenerator": true, "slots": 3 }, 
        
        "Crucible": { "heatCost": 4.0, "parent": "Stone Furnace", "slotsRequired": 1, "parentSlots": 3 }, 
        "Kiln": { "heatCost": 15.0, "parent": "Stone Furnace", "slotsRequired": 1, "parentSlots": 1 }, 
        "Iron Smelter": { "heatCost": 9.0, "parent": "Stone Furnace", "slotsRequired": 1, "parentSlots": 1 },
        "Athanor": { "heatCost": 32.0, "parent": "Stone Furnace", "slotsRequired": 1, "parentSlots": 1 },
        "Advanced Athanor": { "heatCost": 360.0, "parent": "Stone Furnace", "slotsRequired": 1, "parentSlots": 1 },
        "Alembic": { "heatCost": 108.0, "parent": "Stone Furnace", "slotsRequired": 1, "parentSlots": 1 },
        "Advanced Alembic": { "heatCost": 270.0, "parent": "Stone Furnace", "slotsRequired": 1, "parentSlots": 1 },
        "Paradox Crucible": { "heatCost": 1200.0, "parent": "Stone Furnace", "slotsRequired": 1, "parentSlots": 1 },
        "Stackable Crucible": { "heatCost": 6.0, "parent": "Stone Furnace", "slotsRequired": 1, "parentSlots": 3 },
        "Thermal Extractor": { "heatCost": 80.0, "parent": "Stone Furnace", "slotsRequired": 1, "parentSlots": 1 },

        "Grinder": { "heatCost": 0 },
        "Enhanced Grinder": { "heatCost": 0 },
        "Table Saw": { "heatCost": 0 },
        "Stone Crusher": { "heatCost": 0 },
        "Assembler": { "heatCost": 0 },
        "Advanced Assembler": { "heatCost": 0 },
        "Processor": { "heatCost": 0 },
        "Nursery": { "heatCost": 0 }, 
        "Seed Plot": { "heatCost": 0 },
        "Extractor": { "heatCost": 0 },
        "Blender": { "heatCost": 0 },
        "Advanced Blender": { "heatCost": 0 },
        "Refiner": { "heatCost": 0 },
        "Cauldron": { "heatCost": 0 },
        "Shaper": { "heatCost": 0 },
        "Advanced Shaper": { "heatCost": 0 },
        "Knowledge Altar": { "heatCost": 0 },
        "World Tree Nursery": { "heatCost": 0 }
    },
    
    "recipes": [
        // --- RAW CONVERSIONS ---
        { "id": "log_plank", "outputs": { "Plank": 200 }, "inputs": { "Logs": 1 }, "machine": "Table Saw", "baseTime": 400.0 },
        { "id": "rock_stone", "outputs": { "Stone": 150 }, "inputs": { "Limestone": 1 }, "machine": "Stone Crusher", "baseTime": 450.0 },
        { "id": "ore_iron", "outputs": { "Iron Ingot": 100 }, "inputs": { "Iron Ore": 1 }, "machine": "Iron Smelter", "baseTime": 600.0 },
        { "id": "ore_coal", "outputs": { "Coal": 120 }, "inputs": { "Coal Ore": 1 }, "machine": "Stone Crusher", "baseTime": 360.0 },
        { "id": "ore_quartz", "outputs": { "Crude Shard": 1 }, "inputs": { "Quartz Ore": 1 }, "machine": "Stone Crusher", "baseTime": 480.0 },
        { "id": "ore_salt", "outputs": { "Salt": 100, "Sand": 100 }, "inputs": { "Rock Salt": 1 }, "machine": "Stone Crusher", "baseTime": 600.0 },
        { "id": "meteorite", "outputs": { "Stone": 300, "Coal": 300, "Iron Sand": 300, "Shattered Crystal": 60, "Obsidian": 30, "Adamant": 7, "Ruby": 1, "Sapphire": 1, "Emerald": 1 }, "inputs": { "Meteorite": 1 }, "machine": "Stone Crusher", "baseTime": 1200.0 },

        // --- FUEL CHAIN ---
        { "id": "plank_charcoal", "outputs": { "Charcoal": 1 }, "inputs": { "Plank": 1 }, "machine": "Crucible", "baseTime": 4.0 },
        { "id": "charcoal_powder", "outputs": { "Charcoal Powder": 1 }, "inputs": { "Charcoal": 1 }, "machine": "Grinder", "baseTime": 4.0 },
        { "id": "coal_coke", "outputs": { "Coke": 1 }, "inputs": { "Coal": 1 }, "machine": "Crucible", "baseTime": 6.0 },
        { "id": "coke_powder", "outputs": { "Coke Powder": 1 }, "inputs": { "Coke": 1 }, "machine": "Grinder", "baseTime": 8.0 },
        { "id": "coke_recycle", "outputs": { "Coke": 1, "Charcoal": 2 }, "inputs": { "Charcoal Powder": 6 }, "machine": "Athanor", "baseTime": 3.0 },

        // --- ALLOYS & METALS ---
        { "id": "steel_alloy", "outputs": { "Steel Ingot": 1, "Iron Ingot": 1 }, "inputs": { "Iron Ingot": 1, "Coke Powder": 1 }, "machine": "Athanor", "baseTime": 4.0 },
        { "id": "bronze_ingot", "outputs": { "Bronze Ingot": 1 }, "inputs": { "Impure Copper Powder": 1 }, "machine": "Crucible", "baseTime": 12.0 },
        { "id": "copper_ingot", "outputs": { "Copper Ingot": 1 }, "inputs": { "Copper Powder": 1 }, "machine": "Crucible", "baseTime": 12.0 },
        { "id": "silver_ingot", "outputs": { "Silver Ingot": 1 }, "inputs": { "Silver Powder": 1 }, "machine": "Crucible", "baseTime": 16.0 },
        { "id": "gold_ingot", "outputs": { "Gold Ingot": 1 }, "inputs": { "Pure Gold Dust": 1 }, "machine": "Crucible", "baseTime": 40.0 },
        { "id": "sulfur_iron", "outputs": { "Sulfur": 40, "Iron Ingot": 120 }, "inputs": { "Pyrite Ore": 1 }, "machine": "Iron Smelter", "baseTime": 960.0 },

        // --- GEMS & CRYSTALS ---
        { "id": "polished_crystal", "outputs": { "Polished Crystal": 1 }, "inputs": { "Crude Crystal": 2 }, "machine": "Refiner", "baseTime": 3.0 },
        { "id": "adamant", "outputs": { "Adamant": 1 }, "inputs": { "Polished Crystal": 2 }, "machine": "Refiner", "baseTime": 3.0 },
        { "id": "diamond", "outputs": { "Diamond": 1 }, "inputs": { "Adamant": 2 }, "machine": "Refiner", "baseTime": 3.0 },
        { "id": "perfect_diamond", "outputs": { "Perfect Diamond": 1 }, "inputs": { "Diamond": 2 }, "machine": "Refiner", "baseTime": 3.0 },
        { "id": "ruby", "outputs": { "Ruby": 1 }, "inputs": { "Diamond": 1, "Pure Gold Dust": 1, "Resonant Catalyst": 1 }, "machine": "Cauldron", "baseTime": 30.9 },
        { "id": "sapphire", "outputs": { "Sapphire": 1 }, "inputs": { "Perfect Diamond": 1, "World Tree Core": 1, "Unstable Catalyst": 1 }, "machine": "Cauldron", "baseTime": 38.2 },
        { "id": "lapis_mix", "outputs": { "Lapis Lazuli": 1, "Shattered Crystal": 1, "Crude Shard": 1 }, "inputs": { "Impure Silver Powder": 1, "Crude Shard": 4, "Gentian Powder": 4 }, "machine": "Advanced Athanor", "baseTime": 12.0 },
        { "id": "malachite_shard", "outputs": { "Malachite": 1, "Crude Shard": 1 }, "inputs": { "Impure Copper Powder": 2, "Clay Powder": 6 }, "machine": "Athanor", "baseTime": 12.0 },

        // --- HERB & MASH ---
        { "id": "sage_powder", "outputs": { "Sage Powder": 1 }, "inputs": { "Sage": 1 }, "machine": "Grinder", "baseTime": 3.0 },
        { "id": "flax_fiber", "outputs": { "Flax Fiber": 1 }, "inputs": { "Flax": 1 }, "machine": "Grinder", "baseTime": 3.0 },
        { "id": "plant_ash", "outputs": { "Plant Ash": 1 }, "inputs": { "Sage": 1 }, "machine": "Crucible", "baseTime": 3.0 },
        
        // --- STONE / SAND / CLAY ---
        { "id": "stone_sand", "outputs": { "Sand": 1 }, "inputs": { "Stone": 1 }, "machine": "Grinder", "baseTime": 12.0 },
        { "id": "stone_quicklime", "outputs": { "Quicklime": 1 }, "inputs": { "Stone": 1 }, "machine": "Crucible", "baseTime": 9.0 },
        { "id": "quicklime_powder", "outputs": { "Quicklime Powder": 1 }, "inputs": { "Quicklime": 1 }, "machine": "Grinder", "baseTime": 9.0 },
        { "id": "mortar", "outputs": { "Mortar": 1 }, "inputs": { "Stone": 5 }, "machine": "Processor", "baseTime": 20.0 },
        { "id": "clay", "outputs": { "Clay": 1 }, "inputs": { "Charcoal Powder": 2, "Sand": 4 }, "machine": "Assembler", "baseTime": 4.0 },
        { "id": "clay_powder", "outputs": { "Clay Powder": 1 }, "inputs": { "Clay": 1 }, "machine": "Grinder", "baseTime": 4.0 },

        // --- IRON RECYCLING ---
        { "id": "iron_sand", "outputs": { "Iron Sand": 1 }, "inputs": { "Iron Ingot": 1 }, "machine": "Grinder", "baseTime": 30.0 },
        { "id": "iron_recycle", "outputs": { "Iron Ingot": 1 }, "inputs": { "Iron Sand": 1 }, "machine": "Crucible", "baseTime": 6.0 },

        // --- PARTS & MISC ---
        { "id": "iron_nails", "outputs": { "Iron Nails": 3 }, "inputs": { "Iron Ingot": 1 }, "machine": "Processor", "baseTime": 12.0 },
        { "id": "linen_thread", "outputs": { "Linen Thread": 1 }, "inputs": { "Flax Fiber": 3 }, "machine": "Processor", "baseTime": 3.0 },
        { "id": "linen_rope", "outputs": { "Linen Rope": 1 }, "inputs": { "Linen Thread": 2 }, "machine": "Processor", "baseTime": 6.0 },
        { "id": "linen", "outputs": { "Linen": 1 }, "inputs": { "Linen Thread": 10 }, "machine": "Assembler", "baseTime": 5.0 },
        { "id": "wooden_gear", "outputs": { "Large Wooden Gear": 1 }, "inputs": { "Plank": 1 }, "machine": "Grinder", "baseTime": 6.0 },
        { "id": "small_gear", "outputs": { "Small Wooden Gear": 3 }, "inputs": { "Large Wooden Gear": 1 }, "machine": "Processor", "baseTime": 12.0 },
        { "id": "wooden_pulley", "outputs": { "Wooden Pulley": 1 }, "inputs": { "Plank": 2, "Linen Rope": 1 }, "machine": "Assembler", "baseTime": 4.0 },
        { "id": "steel_gear", "outputs": { "Steel Gear": 1 }, "inputs": { "Steel Ingot": 1 }, "machine": "Processor", "baseTime": 15.0 },
        { "id": "bronze_rivet", "outputs": { "Bronze Rivet": 3 }, "inputs": { "Bronze Ingot": 1 }, "machine": "Processor", "baseTime": 12.0 },
        { "id": "copper_bearing", "outputs": { "Copper Bearing": 2 }, "inputs": { "Copper Ingot": 1 }, "machine": "Processor", "baseTime": 12.0 },
        { "id": "pocket_watch", "outputs": { "Pocket Watch": 1 }, "inputs": { "Steel Gear": 2, "Copper Bearing": 2, "Glass": 6 }, "machine": "Advanced Assembler", "baseTime": 12.0 },
        { "id": "silver_amulet", "outputs": { "Silver Amulet": 1 }, "inputs": { "Silver Ingot": 2, "Lapis Lazuli": 1 }, "machine": "Assembler", "baseTime": 10.0 },

        // --- GOODS ---
        { "id": "brick", "outputs": { "Brick": 1 }, "inputs": { "Clay": 1 }, "machine": "Kiln", "baseTime": 6.0 },
        { "id": "glass", "outputs": { "Glass": 1 }, "inputs": { "Sand": 6 }, "machine": "Kiln", "baseTime": 6.0 },
        { "id": "soap", "outputs": { "Soap": 1 }, "inputs": { "Plant Ash": 3, "Linseed Oil": 200 }, "machine": "Blender", "baseTime": 3.0 },
        { "id": "healing_potion", "outputs": { "Healing Potion": 1 }, "inputs": { "Sage Powder": 6, "Flax Fiber": 6 }, "machine": "Assembler", "baseTime": 6.0 },
        { "id": "bandage", "outputs": { "Bandage": 1 }, "inputs": { "Linen": 2, "Healing Potion": 2 }, "machine": "Assembler", "baseTime": 10.0 },
        { "id": "blast_potion", "outputs": { "Blast Potion": 1 }, "inputs": { "Oblivion Essence": 1, "Black Powder": 2, "Brandy": 40 }, "machine": "Advanced Blender", "baseTime": 6.0 },
        { "id": "panacea_potion", "outputs": { "Panacea Potion": 1 }, "inputs": { "Fertile Catalyst": 3, "Blast Potion": 3, "Aqua Vitae": 12 }, "machine": "Advanced Blender", "baseTime": 6.0 },
        { "id": "turquoise", "outputs": { "Turquoise": 1 }, "inputs": { "Healing Potion": 2, "Sand": 12 }, "machine": "Assembler", "baseTime": 12.0 },
        { "id": "topaz", "outputs": { "Topaz": 1 }, "inputs": { "Chamomile Powder": 3, "Yeast Powder": 3, "Sulfuric Acid": 80 }, "machine": "Advanced Blender", "baseTime": 12.0 },

        // --- FERTILIZER / FARMING ---
        { "id": "basic_fertilizer", "outputs": { "Basic Fertilizer": 1 }, "inputs": { "Plant Ash": 1, "Quicklime Powder": 1 }, "machine": "Assembler", "baseTime": 4.0 },
        { "id": "advanced_fertilizer", "outputs": { "Advanced Fertilizer": 1 }, "inputs": { "Basic Fertilizer": 1, "Gloom Fungus": 1 }, "machine": "Assembler", "baseTime": 4.0 },
        { "id": "fertile_catalyst", "outputs": { "Fertile Catalyst": 1 }, "inputs": { "Unstable Catalyst": 1, "Vitality Essence": 1, "Lavender Essential Oil": 18 }, "machine": "Advanced Blender", "baseTime": 8.0 },
        { "id": "resonant_catalyst", "outputs": { "Resonant Catalyst": 1 }, "inputs": { "Fertile Catalyst": 1, "Volcanic Ash": 1, "Aqua Vitae": 1 }, "machine": "Advanced Blender", "baseTime": 8.0 },

        // --- LIQUIDS & CHEMICALS ---
        { "id": "flax_oil", "outputs": { "Linseed Oil": 50 }, "inputs": { "Flax": 1 }, "machine": "Extractor", "baseTime": 2.0 },
        { "id": "currant_wine", "outputs": { "Fruit Wine": 10 }, "inputs": { "Red Currant": 1 }, "machine": "Extractor", "baseTime": 6.0 },
        { "id": "limewater", "outputs": { "Limewater": 30 }, "inputs": { "Quicklime Powder": 1 }, "machine": "Extractor", "baseTime": 3.0 },
        { "id": "black_powder", "outputs": { "Black Powder": 2 }, "inputs": { "Sulfur Powder": 1, "Charcoal Powder": 12, "Limewater": 150 }, "machine": "Advanced Blender", "baseTime": 12.0 },

        // --- RELICS ---
        { "id": "jupiter", "outputs": { "Jupiter": 1 }, "inputs": { "Plank": 1200, "Small Wooden Gear": 1800, "Wooden Pulley": 600 }, "machine": "Shaper", "baseTime": 600.0 },
        { "id": "saturn", "outputs": { "Saturn": 1 }, "inputs": { "Salt": 600, "Brick": 600, "Glass": 600 }, "machine": "Shaper", "baseTime": 300.0 },
        { "id": "mars", "outputs": { "Mars": 1 }, "inputs": { "Iron Nails": 600, "Steel Gear": 300, "Bronze Rivet": 600, "Copper Bearing": 300 }, "machine": "Shaper", "baseTime": 300.0 },
        { "id": "venus", "outputs": { "Venus": 1 }, "inputs": { "Healing Potion": 200, "Vitality Potion": 200, "Transformation Potion": 200, "Growth Potion": 200 }, "machine": "Shaper", "baseTime": 300.0 }
    ],

    // --- SAVE DATA ---
    "settings": {
        "beltLevel": 0,
        "speedLevel": 0,
        "alchemyLevel": 0,
        "fuelLevel": 0,
        "fertLevel": 0,
		"defaultFuel": "Plank",
        "defaultFert": "Basic Fertilizer"
    }
};