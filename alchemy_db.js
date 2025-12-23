window.ALCHEMY_DB = {
    "version": 18, 
    "items": {
        // --- 1. RAW RESOURCES ---
        "Logs": { "category": "Raw Materials", "buyPrice": 200, "heat": 2000 },
        "Limestone": { "category": "Raw Materials", "buyPrice": 600 },
        "Iron Ore": { "category": "Raw Materials", "buyPrice": 1200 },
        "Coal Ore": { "category": "Raw Materials", "buyPrice": 4800, "heat": 250 },
        "Pyrite Ore": { "category": "Raw Materials", "buyPrice": 11000 },
        "Quartz Ore": { "category": "Raw Materials", "buyPrice": 44000 },
        "Rock Salt": { "category": "Raw Materials", "buyPrice": 9000 },
        "Rotten Log": { "category": "Raw Materials", "buyPrice": 2000 },
        "Meteorite": { "category": "Raw Materials", "buyPrice": 2000000 },

        // --- 2. SEEDS ---
        "Flax Seed": { "category": "Seeds", "buyPrice": 280 },
        "Sage Seed": { "category": "Seeds", "buyPrice": 360 },
        "Red Currant Seed": { "category": "Seeds", "buyPrice": 1300 },
        "Lavender Seed": { "category": "Seeds", "buyPrice": 16000 },
        "Chamomile Seed": { "category": "Seeds", "buyPrice": 6000 },
        "Gentian Seed": { "category": "Seeds", "buyPrice": 64000 },
        "World Tree Seed": { "category": "Seeds", "buyPrice": 5000000 },

        // --- 3. HERBS ---
        "Flax": { "category": "Herbs", "nutrientCost": 24 },
        "Sage": { "category": "Herbs", "nutrientCost": 36 },
        "Redcurrant": { "category": "Herbs", "nutrientCost": 144 },
        "Lavender": { "category": "Herbs", "nutrientCost": 2160 },
        "Chamomile": { "category": "Herbs", "nutrientCost": 720 },
        "Gentian": { "category": "Herbs", "nutrientCost": 6000 },
		"Gloom Fungus": { "category": "Herbs" },
		"World Tree Leaf": { "category": "Herbs" },
        "World Tree Core": { "category": "Herbs", "buyPrice": 3000000},

        // --- 4. SOLIDS & MATERIALS ---
        "Plank": { "category": "Material", "heat": 20 },
        "Stone": { "category": "Material" },
        "Sand": { "category": "Material" },
        "Mortar": { "category": "Material" },
        "Clay": { "category": "Material" },
        "Brick": { "category": "Material" },
        "Glass": { "category": "Material" },
        "Sulfur": { "category": "Material" },
        "Salt": { "category": "Material" },
		"Adamant": { "category": "Material" },
        "Obsidian": { "category": "Material" },

        // --- 5. POWDERS & DUSTS ---
        "Flax Fiber": { "category": "Material" },
        "Sage Powder": { "category": "Material" },
        "Plant Ash": { "category": "Material" },
        "Quicklime": { "category": "Material" },
        "Quicklime Powder": { "category": "Material" },
        "Clay Powder": { "category": "Material" },
        "Iron Sand": { "category": "Material" },
        "Sulfur Powder": { "category": "Material" },
        "Chamomile Powder": { "category": "Material" },
        "Gentian Powder": { "category": "Material" },
        "Yeast Powder": { "category": "Material" },
        "Soap Powder": { "category": "Material" },
        "Perfumed Soap Powder": { "category": "Material" },
        "Gloom Spores": { "category": "Material" },
		"Volcanic Ash": { "category": "Material" },
        "Impure Copper Powder": { "category": "Material" },
        "Copper Powder": { "category": "Material"},
        "Crude Silver Powder": { "category": "Material"},
        "Impure Silver Powder": { "category": "Material" },
        "Silver Powder": { "category": "Material" },
        "Crude Gold Dust": { "category": "Material" },
        "Impure Gold Dust": { "category": "Material" },
        "Gold Dust": { "category": "Material" },
        "Pure Gold Dust": { "category": "Material" },
        "Star Dust": { "category": "Material" },
        "Fairy Dust": { "category": "Material" },

        // --- 6. FUELS ---
        "Charcoal": { "category": "Fuel", "heat": 40 },
        "Charcoal Powder": { "category": "Fuel", "heat": 48 },
        "Coal": { "category": "Fuel", "heat": 540 },
        "Coke": { "category": "Fuel", "heat": 600 },
        "Coke Powder": { "category": "Fuel", "heat": 660 },
        "Black Powder": { "category": "Fuel", "heat": 3000 },
        "Blast Potion": { "category": "Fuel", "heat": 24000 },
        "Panacea Potion": { "category": "Fuel", "heat": 320000 },

        // --- 7. METALS ---
        "Iron Ingot": { "category": "Material" },
        "Copper Ingot": { "category": "Material"},
        "Bronze Ingot": { "category": "Material" },
        "Silver Ingot": { "category": "Material" },
        "Gold Ingot": { "category": "Material" },
        "Steel Ingot": { "category": "Material" },

        // --- 8. COMPONENTS ---
        "Linen Thread": { "category": "Component" },
        "Linen Rope": { "category": "Component", "sellPrice": 36 },
        "Large Wooden Gear": { "category": "Component", "sellPrice": 5 },
        "Small Wooden Gear": { "category": "Component", "sellPrice": 8 },
        "Iron Nails": { "category": "Component", "sellPrice": 16 },
        "Wooden Pulley": { "category": "Component", "sellPrice": 44 },
        "Steel Gear": { "category": "Component", "sellPrice": 450 },
        "Copper Bearing": { "category": "Component", "sellPrice": 300 },
        "Bronze Rivet": { "category": "Component", "sellPrice": 120},

        // --- 9. GOODS & CURRENCY ---
        "Linen": { "category": "Goods", "sellPrice": 165 },
        "Bandage": { "category": "Goods", "sellPrice": 350 },
        "Soap": { "category": "Goods", "sellPrice": 60 },
        "Perfumed Soap": { "category": "Goods", "sellPrice": 2590 },
        "Moonlit Soap": { "category": "Goods", "sellPrice": 995280 },
        "Pocket Watch": { "category": "Goods", "sellPrice": 900000 },
        "Silver Amulet": { "category": "Goods", "sellPrice": 48000 },
        "Crown": { "category": "Goods", "sellPrice": 1600000 },
        "Copper Coin": { "category": "Currency", "sellPrice": 1 },
        "Silver Coin": { "category": "Currency", "sellPrice": 1000 },
        "Gold Coin": { "category": "Currency", "sellPrice": 100000 },

        // --- 10. LIQUIDS ---
        "Fruit Wine": { "category": "Liquid", "liquid": true },
        "Linseed Oil": { "category": "Liquid", "liquid": true },
        "Limewater": { "category": "Liquid", "liquid": true },
        "Brandy": { "category": "Liquid", "liquid": true },
        "Sulfuric Acid": { "category": "Liquid", "liquid": true },
        "Lavender Essential Oil": { "category": "Liquid", "liquid": true },
        "Gentian Nectar": { "category": "Liquid", "liquid": true },
        "Fairy Tear": { "category": "Liquid", "liquid": true },
        "Moon Tear": { "category": "Liquid", "liquid": true },
        "Quicksilver": { "category": "Liquid", "liquid": true },
        "Aqua Vitae": { "category": "Liquid", "liquid": true },
        "Salt Water": { "category": "Liquid", "liquid": true },

        // --- 11. POTIONS ---
        "Healing Potion": { "category": "Potion", "sellPrice": 85 },
        "Vitality Potion": { "category": "Potion", "sellPrice": 330 },
        "Transformation Potion": { "category": "Potion", "sellPrice": 620 },
        "Growth Potion": { "category": "Fertilizer", "sellPrice": 1224, "nutrientValue": 6480, "maxFertility": 2160 },
        
        // --- 12. FERTILIZERS & CATALYSTS ---
        "Basic Fertilizer": { "category": "Fertilizer", "nutrientValue": 144, "maxFertility": 12, "buyPrice": 14 },
        "Advanced Fertilizer": { "category": "Fertilizer", "nutrientValue": 720, "maxFertility": 144, "buyPrice": 60 },
        
        "Oblivion Essence": { "category": "Essence" },
        "Vitality Essence": { "category": "Essence" },
        "Unstable Catalyst": { "category": "Catalyst" },
        "Fertile Catalyst": { "category": "Catalyst", "nutrientValue": 24000, "maxFertility": 6000 },
        "Resonant Catalyst": { "category": "Catalyst" },
        "Eternal Catalyst": { "category": "Catalyst" },
        "Philosopher's Stone": { "category": "Catalyst" },

        // --- 13. GEMS & SHARDS ---
        "Crude Shard": { "category": "Gem" },
        "Broken Shard": { "category": "Gem" },
        "Dull Shard": { "category": "Gem" },
        "Shattered Crystal": { "category": "Gem" },
        "Crude Crystal": { "category": "Gem"},
        "Polished Crystal": { "category": "Gem" },
        "Adamant": { "category": "Material" },
        "Diamond": { "category": "Gem", "sellPrice": 100000 },
        "Perfect Diamond": { "category": "Gem" },
        "Turquoise": { "category": "Gem", "sellPrice": 290 },
        "Malachite": { "category": "Gem", "sellPrice": 1020 },
        "Topaz": { "category": "Gem", "sellPrice": 2800 },
        "Lapis Lazuli": { "category": "Gem", "sellPrice": 32000 },
        "Ruby": { "category": "Gem", "sellPrice": 250000 },
        "Sapphire": { "category": "Gem", "sellPrice": 480000 },
        "Emerald": { "category": "Gem", "sellPrice": 700000 },

        // --- 14. RELICS ---
        "Jupiter": { "category": "Relic", "sellPrice": 30000 },
        "Saturn": { "category": "Relic", "sellPrice": 150000 },
        "Mars": { "category": "Relic", "sellPrice": 280000 },
        "Venus": { "category": "Relic", "sellPrice": 1000000 },
        "Luna": { "category": "Relic", "sellPrice": 18500000 },
        "Mercury": { "category": "Relic", "sellPrice": 5200000 },
        "Sol": { "category": "Relic", "sellPrice": 42000000 }
    },
    
    "machines": {
        "Table Saw": { "heatCost": 0, "buildCost": { "Plank": 5 } },
        "Stone Crusher": { "heatCost": 0, "buildCost": { "Plank": 6, "Large Wooden Gear": 6 } },
        "Planting": { "heatCost": 0, "buildCost": { "Stone": 8 } },
        "Grinder": { "heatCost": 0, "buildCost": { "Plank": 8 } },
        "Extractor": { "heatCost": 0, "buildCost": { "Iron Ingot": 5, "Glass": 5 } },
        "Stone Furnace": { "heatSelf": 1, "slots": 9, "isGenerator": true, "buildCost": { "Stone": 20 } }, 
        "Blast Furnace": { "heatSelf": 4.0, "slots": 42, "isGenerator": true, "buildCost": { "Brick": 30 } }, 
        "Crucible": { "heatCost": 4.0, "parent": "Stone Furnace", "slotsRequired": 3, "buildCost": { "Stone": 4 } },
        "Kiln": { "heatCost": 15.0, "parent": "Stone Furnace", "slotsRequired": 6, "buildCost": { "Stone": 20, "Clay": 10 } },
        "Iron Smelter": { "heatCost": 9.0, "parent": "Stone Furnace", "slotsRequired": 9, "buildCost": { "Stone": 15 } },
        "Stackable Crucible": { "heatCost": 6.0, "parent": "Stone Furnace", "slotsRequired": 3, "buildCost": { "Clay": 10, "Iron Ingot": 2 } },
        "Thermal Extractor": { "heatCost": 80.0, "parent": "Stone Furnace", "slotsRequired": 6, "buildCost": { "Steel Ingot": 10, "Glass": 10 } },
        "Refiner": { "heatCost": 0, "buildCost": { "Iron Ingot": 10, "Glass": 5 } },
        "Processor": { "heatCost": 0, "buildCost": { "Plank": 12, "Large Wooden Gear": 3 } },
        "Assembler": { "heatCost": 0, "buildCost": { "Plank": 10, "Large Wooden Gear": 5, "Small Wooden Gear": 15 } },
        "Advanced Assembler": { "heatCost": 0, "buildCost": { "Steel Ingot": 12, "Steel Gear": 16, "Copper Bearing": 8 } },
        "Blender": { "heatCost": 0, "buildCost": { "Iron Ingot": 8, "Glass": 8 } },
        "Advanced Blender": { "heatCost": 0, "buildCost": { "Steel Ingot": 8, "Glass": 16, "Copper Bearing": 4 } },
        "Alembic": { "heatCost": 108.0, "parent": "Stone Furnace", "slotsRequired": 1, "buildCost": { "Steel Ingot": 4, "Copper Ingot": 4, "Glass": 8 } },
        "Advanced Alembic": { "heatCost": 270.0, "parent": "Stone Furnace", "slotsRequired": 6, "buildCost": { "Steel Ingot": 8, "Copper Bearing": 4, "Glass": 16 } },
        "Athanor": { "heatCost": 32.0, "parent": "Stone Furnace", "slotsRequired": 6, "buildCost": { "Iron Nails": 15, "Iron Ingot": 10 } },
        "Advanced Athanor": { "heatCost": 360.0, "parent": "Stone Furnace", "slotsRequired": 6, "buildCost": { "Steel Ingot": 20, "Gold Ingot": 5 } },
        "Shaper": { "heatCost": 0, "buildCost": { "Iron Ingot": 8, "Iron Ingot": 16 } },
        "Advanced Shaper": { "heatCost": 0, "buildCost": { "Steel Ingot": 8, "Steel Gear": 16 } },
        "Arcane Shaper": { "heatCost": 0, "buildCost": { "Gold Ingot": 12, "Copper Bearing": 18, "Steel Gear": 24 } },
        "Paradox Crucible": { "heatCost": 1200.0, "parent": "Stone Furnace", "slotsRequired": 9, "buildCost": { "Bronze Rivet": 16, "Copper Ingot": 8, "Steel Ingot": 8 } },
        "Cauldron": { "heatCost": 0, "buildCost": { "Bronze Ingot": 30 } },
        "Arcane Processor": { "heatCost": 0, "buildCost": { "Steel Ingot": 6, "Steel Gear": 12, "Lapis Lazuli": 2 } },
        "Enhanced Grinder": { "heatCost": 0, "buildCost": { "Plank": 12, "Steel Gear": 3 } },
        "Nursery": { "heatCost": 0, "fertility": true, "buildCost": { "Plank": 20, "Linen Rope": 20, "Iron Nails": 20 } },
        "World Tree Nursery": { "heatCost": 0, "buildCost": { "Adamant": 10, "World Tree Leaf": 5 } },
        "Knowledge Altar": { "heatCost": 0, "buildCost": { "Stone": 50, "Gold Ingot": 10 } }
    },
    
    "recipes": [
        // --- HERBS & SEEDS ---
        { "id": "Flax", "machine": "Planting", "inputs": { "Flax Seed": 1 }, "outputs": { "Flax": 200 }, "baseTime": 400.0 },
        { "id": "Sage", "machine": "Planting", "inputs": { "Sage Seed": 1 }, "outputs": { "Sage": 180 }, "baseTime": 540.0 },
        { "id": "Redcurrant", "machine": "Planting", "inputs": { "Red Currant Seed": 1 }, "outputs": { "Redcurrant": 150 }, "baseTime": 900.0 },
        { "id": "Lavender", "machine": "Planting", "inputs": { "Lavender Seed": 1 }, "outputs": { "Lavender": 120 }, "baseTime": 1440.0 },
        { "id": "Chamomile", "machine": "Planting", "inputs": { "Chamomile Seed": 1 }, "outputs": { "Chamomile": 140 }, "baseTime": 1120.0 },
        { "id": "Gentian", "machine": "Planting", "inputs": { "Gentian Seed": 1 }, "outputs": { "Gentian": 80, "Gentian Nectar": 80 }, "baseTime": 2160.0 },

        // --- BASICS ---
        { "id": "Plank", "machine": "Table Saw", "inputs": { "Logs": 1 }, "outputs": { "Plank": 200 }, "baseTime": 400.0 },
        { "id": "Stone", "machine": "Stone Crusher", "inputs": { "Limestone": 1 }, "outputs": { "Stone": 150 }, "baseTime": 450.0 },
        { "id": "Sand", "machine": "Grinder", "inputs": { "Stone": 1 }, "outputs": { "Sand": 1 }, "baseTime": 12.0 },
        { "id": "Mortar", "machine": "Processor", "inputs": { "Stone": 5 }, "outputs": { "Mortar": 1 }, "baseTime": 20.0 },
        { "id": "Quicklime", "machine": "Crucible", "inputs": { "Stone": 1 }, "outputs": { "Quicklime": 1 }, "baseTime": 9.0 },
        { "id": "Quicklime Powder", "machine": "Grinder", "inputs": { "Quicklime": 1 }, "outputs": { "Quicklime Powder": 1 }, "baseTime": 9.0 },
        { "id": "Clay", "machine": "Assembler", "inputs": { "Charcoal Powder": 2, "Sand": 4 }, "outputs": { "Clay": 1 }, "baseTime": 4.0 },
        { "id": "Clay Powder", "machine": "Grinder", "inputs": { "Clay": 1 }, "outputs": { "Clay Powder": 1 }, "baseTime": 4.0 },
        { "id": "Brick", "machine": "Kiln", "inputs": { "Clay": 1 }, "outputs": { "Brick": 1 }, "baseTime": 6.0 },
        { "id": "Glass", "machine": "Kiln", "inputs": { "Sand": 6 }, "outputs": { "Glass": 1 }, "baseTime": 6.0 },

        // --- POWDERS & EXTRACTS ---
        { "id": "Flax Fiber", "machine": "Grinder", "inputs": { "Flax": 1 }, "outputs": { "Flax Fiber": 1 }, "baseTime": 3.0 },
        { "id": "Sage Powder", "machine": "Grinder", "inputs": { "Sage": 1 }, "outputs": { "Sage Powder": 1 }, "baseTime": 3.0 },
        { "id": "Plant Ash", "machine": "Crucible", "inputs": { "Sage": 1 }, "outputs": { "Plant Ash": 1 }, "baseTime": 3.0 },
        { "id": "Chamomile Powder", "machine": "Grinder", "inputs": { "Chamomile": 1 }, "outputs": { "Chamomile Powder": 1 }, "baseTime": 3.0 },
        { "id": "Gentian Powder", "machine": "Grinder", "inputs": { "Gentian": 1 }, "outputs": { "Gentian Powder": 1 }, "baseTime": 3.0 },
        { "id": "Linseed Oil", "machine": "Extractor", "inputs": { "Flax": 1 }, "outputs": { "Linseed Oil": 50 }, "baseTime": 2.0 },
        { "id": "Fruit Wine", "machine": "Extractor", "inputs": { "Redcurrant": 1 }, "outputs": { "Fruit Wine": 10 }, "baseTime": 6.0 },
        { "id": "Limewater", "machine": "Extractor", "inputs": { "Quicklime Powder": 1 }, "outputs": { "Limewater": 30 }, "baseTime": 3.0 },
        { "id": "Soap", "machine": "Blender", "inputs": { "Plant Ash": 3, "Linseed Oil": 200 }, "outputs": { "Soap": 1 }, "baseTime": 3.0 },
        { "id": "Soap Powder", "machine": "Grinder", "inputs": { "Soap": 1 }, "outputs": { "Soap Powder": 1 }, "baseTime": 6.0 },
        { "id": "Perfumed Soap", "machine": "Blender", "inputs": { "Soap Powder": 4, "Lavender Essential Oil": 30 }, "outputs": { "Perfumed Soap": 1 }, "baseTime": 8.0 },
        { "id": "Perfumed Soap Powder", "machine": "Grinder", "inputs": { "Perfumed Soap": 1 }, "outputs": { "Perfumed Soap Powder": 1 }, "baseTime": 8.0 },
        { "id": "Yeast Powder", "machine": "Blender", "inputs": { "Soap Powder": 2, "Fruit Wine": 40 }, "outputs": { "Yeast Powder": 1 }, "baseTime": 4.0 },
        { "id": "Gloom Fungus", "machine": "Table Saw", "inputs": { "Rotten Log": 1 }, "outputs": { "Gloom Fungus": 40, "Plank": 160 }, "baseTime": 400.0 },
        { "id": "Gloom Spores", "machine": "Assembler", "inputs": { "Gloom Fungus": 2, "Yeast Powder": 1 }, "outputs": { "Gloom Spores": 1 }, "baseTime": 4.0 },

        // --- COMPONENTS ---
        { "id": "Linen Thread", "machine": "Processor", "inputs": { "Flax Fiber": 3 }, "outputs": { "Linen Thread": 1 }, "baseTime": 3.0 },
        { "id": "Linen Rope", "machine": "Processor", "inputs": { "Linen Thread": 2 }, "outputs": { "Linen Rope": 1 }, "baseTime": 6.0 },
        { "id": "Large Wooden Gear", "machine": "Grinder", "inputs": { "Plank": 1 }, "outputs": { "Large Wooden Gear": 1 }, "baseTime": 6.0 },
        { "id": "Small Wooden Gear", "machine": "Processor", "inputs": { "Large Wooden Gear": 1 }, "outputs": { "Small Wooden Gear": 3 }, "baseTime": 12.0 },
        { "id": "Wooden Pulley", "machine": "Assembler", "inputs": { "Plank": 2, "Linen Rope": 1 }, "outputs": { "Wooden Pulley": 1 }, "baseTime": 4.0 },
        { "id": "Iron Nails", "machine": "Processor", "inputs": { "Iron Ingot": 1 }, "outputs": { "Iron Nails": 3 }, "baseTime": 12.0 },
        { "id": "Steel Gear", "machine": "Processor", "inputs": { "Steel Ingot": 1 }, "outputs": { "Steel Gear": 1 }, "baseTime": 16.0 },
        { "id": "Copper Bearing", "machine": "Processor", "inputs": { "Copper Ingot": 1 }, "outputs": { "Copper Bearing": 2 }, "baseTime": 12.0 },
        { "id": "Bronze Rivet", "machine": "Processor", "inputs": { "Bronze Ingot": 1 }, "outputs": { "Bronze Rivet": 3 }, "baseTime": 12.0 },

        // --- GOODS ---
        { "id": "Linen", "machine": "Assembler", "inputs": { "Linen Thread": 10 }, "outputs": { "Linen": 1 }, "baseTime": 5.0 },
        { "id": "Bandage", "machine": "Assembler", "inputs": { "Linen": 1, "Healing Potion": 2 }, "outputs": { "Bandage": 1 }, "baseTime": 10.0 },
        { "id": "Silver Amulet", "machine": "Assembler", "inputs": { "Silver Ingot": 2, "Lapis Lazuli": 1 }, "outputs": { "Silver Amulet": 1 }, "baseTime": 10.0 },
        { "id": "Pocket Watch", "machine": "Advanced Assembler", "inputs": { "Steel Gear": 2, "Copper Bearing": 2, "Glass": 6 }, "outputs": { "Pocket Watch": 1 }, "baseTime": 12.0 },
        { "id": "Moonlit Soap", "machine": "Advanced Blender", "inputs": { "Perfumed Soap Powder": 2, "Moon Tear": 5 }, "outputs": { "Moonlit Soap": 1 }, "baseTime": 10.0 },
        { "id": "Crown", "machine": "Advanced Assembler", "inputs": { "Gold Ingot": 3, "Ruby": 1, "Sapphire": 1 }, "outputs": { "Crown": 1 }, "baseTime": 15.0 },

        // --- FUEL & ENERGY ---
        { "id": "Charcoal", "machine": "Crucible", "inputs": { "Plank": 1 }, "outputs": { "Charcoal": 1 }, "baseTime": 4.0 },
        { "id": "Charcoal Powder", "machine": "Grinder", "inputs": { "Charcoal": 1 }, "outputs": { "Charcoal Powder": 1 }, "baseTime": 4.0 },
        { "id": "Coal", "machine": "Stone Crusher", "inputs": { "Coal Ore": 1 }, "outputs": { "Coal": 120 }, "baseTime": 360.0 },
        // --- COKE BATCH (Converted from 50% fail rate) ---
        { 
            "id": "Coke", "machine": "Athanor", 
            "inputs": { "Charcoal Powder": 12 }, 
            "outputs": { "Coke": 1, "Charcoal": 2 }, 
            "baseTime": 6.0 
        },
        { "id": "Coke Powder", "machine": "Grinder", "inputs": { "Coke": 1 }, "outputs": { "Coke Powder": 1 }, "baseTime": 12.0 },
        
        // --- IRON / STEEL / SULFUR ---
        { "id": "Iron Ingot", "machine": "Iron Smelter", "inputs": { "Iron Ore": 1 }, "outputs": { "Iron Ingot": 100 }, "baseTime": 600.0 },
        { "id": "Iron Sand", "machine": "Grinder", "inputs": { "Iron Ingot": 1 }, "outputs": { "Iron Sand": 1 }, "baseTime": 30.0 },
        // --- STEEL BATCH (Converted from 25% fail rate) ---
        {
            "id": "Steel Ingot", "machine": "Athanor",
            "inputs": { "Iron Ingot": 4, "Coke Powder": 4 }, 
            "outputs": { "Steel Ingot": 1, "Iron Ingot": 3 },
            "baseTime": 16.0
        },
        { "id": "Sulfur", "machine": "Iron Smelter", "inputs": { "Pyrite Ore": 1 }, "outputs": { "Sulfur": 40, "Iron Ingot": 120 }, "baseTime": 960.0 },
        { "id": "Sulfur Powder", "machine": "Grinder", "inputs": { "Sulfur": 1 }, "outputs": { "Sulfur Powder": 1 }, "baseTime": 6.0 },
        { "id": "Black Powder", "machine": "Advanced Blender", "inputs": { "Sulfur Powder": 1, "Charcoal Powder": 12, "Limewater": 150 }, "outputs": { "Black Powder": 2 }, "baseTime": 12.0 },

        // --- COPPER / BRONZE ---
        // --- COPPER POWDER BATCH (50%) ---
        {
            "id": "Copper Powder", "machine": "Athanor",
            "inputs": { "Iron Sand": 12, "Soap Powder": 12 }, 
            "outputs": { "Copper Powder": 1, "Impure Copper Powder": 1 },
            "baseTime": 12.0
        },
        { "id": "Impure Copper Powder", "machine": "Refiner", "inputs": { "Iron Sand": 2 }, "outputs": { "Impure Copper Powder": 1 }, "baseTime": 6.0 }, 
        { "id": "Copper Ingot", "machine": "Crucible", "inputs": { "Copper Powder": 1 }, "outputs": { "Copper Ingot": 1 }, "baseTime": 12.0 },
        { "id": "Bronze Ingot", "machine": "Crucible", "inputs": { "Impure Copper Powder": 1 }, "outputs": { "Bronze Ingot": 1 }, "baseTime": 12.0 },
        { "id": "Copper Coin", "machine": "Processor", "inputs": { "Copper Ingot": 1 }, "outputs": { "Copper Coin": 300 }, "baseTime": 12.0 },

        // --- SILVER ---
        { "id": "Impure Silver Powder", "machine": "Refiner", "inputs": { "Crude Silver Powder": 2 }, "outputs": { "Impure Silver Powder": 1 }, "baseTime": 8.0 },
        // --- SILVER POWDER BATCH (20%) ---
        { 
            "id": "Silver Powder", "machine": "Advanced Athanor", 
            "inputs": { "Copper Powder": 10, "Unstable Catalyst": 10, "Black Powder": 10 }, 
            "outputs": { "Silver Powder": 1, "Impure Silver Powder": 4 }, 
            "baseTime": 32.0
        },
        { "id": "Silver Ingot", "machine": "Crucible", "inputs": { "Silver Powder": 1 }, "outputs": { "Silver Ingot": 1 }, "baseTime": 16.0 },
        { "id": "Silver Coin", "machine": "Processor", "inputs": { "Silver Ingot": 1 }, "outputs": { "Silver Coin": 5 }, "baseTime": 16.0 },

        // --- GOLD ---
        { "id": "Impure Gold Dust", "machine": "Refiner", "inputs": { "Crude Gold Dust": 2 }, "outputs": { "Impure Gold Dust": 1 }, "baseTime": 10.0 },

        // --- GOLD DUST BATCH (10%) ---
        { "id": "Gold Dust", "machine": "Advanced Athanor", "inputs": { "Silver Powder": 10, "Volcanic Ash": 10, "Fertile Catalyst": 10, "Quicksilver": 120 }, "outputs": { "Gold Dust": 1, "Crude Gold Dust": 4, "Impure Gold Dust": 5 }, "baseTime": 80.0 },
        { "id": "Pure Gold Dust", "machine": "Refiner", "inputs": { "Gold Dust": 2 }, "outputs": { "Pure Gold Dust": 1 }, "baseTime": 10.0 },
        { "id": "Gold Ingot", "machine": "Crucible", "inputs": { "Pure Gold Dust": 1 }, "outputs": { "Gold Ingot": 1 }, "baseTime": 40.0 },
        { "id": "Gold Coin", "machine": "Processor", "inputs": { "Gold Ingot": 1 }, "outputs": { "Gold Coin": 1 }, "baseTime": 40.0 },

        // --- SALT BATCH (33%) ---
        { "id": "Salt", "machine": "Athanor", "inputs": { "Charcoal Powder": 6, "Quicklime Powder": 12 }, "outputs": { "Salt": 1, "Sand": 12 }, "baseTime": 18.0 },
        { "id": "Salt_Rock", "machine": "Stone Crusher", "inputs": { "Rock Salt": 1 }, "outputs": { "Salt": 100, "Sand": 100 }, "baseTime": 600.0 },

		// --- LIQUIDS ---
        { "id": "Salt Water", "machine": "Extractor", "inputs": { "Salt": 1 }, "outputs": { "Salt Water": 20 }, "baseTime": 4.0 },
        { "id": "Lavender Essential Oil", "machine": "Alembic", "inputs": { "Lavender": 3, "Linseed Oil": 300 }, "outputs": { "Lavender Essential Oil": 15 }, "baseTime": 3.0 },
        { "id": "Brandy", "machine": "Alembic", "inputs": { "Coke Powder": 5, "Fruit Wine": 100 }, "outputs": { "Brandy": 40 }, "baseTime": 5.0 },
        { "id": "Sulfuric Acid", "machine": "Alembic", "inputs": { "Sulfur Powder": 1, "Salt Water": 60 }, "outputs": { "Sulfuric Acid": 20 }, "baseTime": 4.0 },
        { "id": "Quicksilver", "machine": "Advanced Alembic", "inputs": { "Crude Silver Powder": 1, "Vitality Essence": 1, "Sulfuric Acid": 80 }, "outputs": { "Quicksilver": 10 }, "baseTime": 8.0 },
        { "id": "Aqua Vitae", "machine": "Advanced Alembic", "inputs": { "Gentian Nectar": 1, "World Tree Leaf": 1, "Brandy": 200 }, "outputs": { "Aqua Vitae": 10 }, "baseTime": 8.0 },
        { "id": "Fairy Tear", "machine": "Extractor", "inputs": { "Fairy Dust": 1 }, "outputs": { "Fairy Tear": 1 }, "baseTime": 4.0 },
        { "id": "Moon Tear", "machine": "Advanced Blender", "inputs": { "Star Dust": 16, "Fairy Tear": 10 }, "outputs": { "Moon Tear": 1 }, "baseTime": 8.0 },

        // --- POTIONS ---
        { "id": "Healing Potion", "machine": "Assembler", "inputs": { "Sage Powder": 6, "Flax Fiber": 6 }, "outputs": { "Healing Potion": 1 }, "baseTime": 6.0 },
        { "id": "Vitality Potion", "machine": "Blender", "inputs": { "Quicklime Powder": 4, "Fruit Wine": 80 }, "outputs": { "Vitality Potion": 1 }, "baseTime": 8.0 },
        { "id": "Transformation Potion", "machine": "Assembler", "inputs": { "Coke Powder": 2, "Gloom Spores": 1 }, "outputs": { "Transformation Potion": 1 }, "baseTime": 6.0 },
        { "id": "Growth Potion", "machine": "Advanced Blender", "inputs": { "Chamomile Powder": 2, "Clay Powder": 6, "Salt Water": 80 }, "outputs": { "Growth Potion": 1 }, "baseTime": 6.0 },
        { "id": "Blast Potion", "machine": "Advanced Blender", "inputs": { "Oblivion Essence": 1, "Black Powder": 2, "Brandy": 40 }, "outputs": { "Blast Potion": 1 }, "baseTime": 6.0 },
        { "id": "Panacea Potion", "machine": "Advanced Blender", "inputs": { "Fertile Catalyst": 3, "Blast Potion": 3, "Aqua Vitae": 12 }, "outputs": { "Panacea Potion": 1 }, "baseTime": 6.0 },

        // --- ESSENCES & CATALYSTS ---
        { "id": "Basic Fertilizer", "machine": "Assembler", "inputs": { "Plant Ash": 1, "Quicklime Powder": 1 }, "outputs": { "Basic Fertilizer": 1 }, "baseTime": 4.0 },
        { "id": "Advanced Fertilizer", "machine": "Assembler", "inputs": { "Basic Fertilizer": 1, "Gloom Fungus": 1 }, "outputs": { "Advanced Fertilizer": 1 }, "baseTime": 4.0 },
		{ "id": "Fertile Catalyst", "machine": "Advanced Blender", "inputs": { "Unstable Catalyst": 1, "Vitality Essence": 1, "Lavender Essential Oil": 18 }, "outputs": { "Fertile Catalyst": 1 }, "baseTime": 8.0 },
        { "id": "Unstable Catalyst", "machine": "Advanced Assembler", "inputs": { "Chamomile Powder": 1, "Gloom Spores": 1, "Sulfur Powder": 1 }, "outputs": { "Unstable Catalyst": 1 }, "baseTime": 4.0 },
        { "id": "Oblivion Essence", "machine": "Paradox Crucible", "inputs": { "Sage Seed": 1 }, "outputs": { "Oblivion Essence": 1 }, "baseTime": 8.7 },
        { "id": "Vitality Essence", "machine": "Paradox Crucible", "inputs": { "Oblivion Essence": 1 }, "outputs": { "Vitality Essence": 1 }, "baseTime": 5.0 },
        { "id": "Resonant Catalyst", "machine": "Advanced Blender", "inputs": { "Fertile Catalyst": 1, "Volcanic Ash": 1, "Aqua Vitae": 12 }, "outputs": { "Resonant Catalyst": 1 }, "baseTime": 8.0 },
        { "id": "Eternal Catalyst", "machine": "Arcane Processor", "inputs": { "Resonant Catalyst": 15, "Philosopher's Stone": 1 }, "outputs": { "Eternal Catalyst": 1 }, "baseTime": 60.0 },
        { "id": "Philosopher's Stone", "machine": "Advanced Assembler", "inputs": { "Ruby": 1, "Sapphire": 1, "Emerald": 1 }, "outputs": { "Philosopher's Stone": 1 }, "baseTime": 60.0 },

        // --- SHARDS & GEMS CHAIN ---
        { "id": "Crude Shard", "machine": "Stone Crusher", "inputs": { "Quartz Ore": 1 }, "outputs": { "Crude Shard": 80 }, "baseTime": 480.0 },
        { "id": "Broken Shard", "machine": "Refiner", "inputs": { "Crude Shard": 2 }, "outputs": { "Broken Shard": 1 }, "baseTime": 3.0 },
        { "id": "Dull Shard", "machine": "Refiner", "inputs": { "Broken Shard": 2 }, "outputs": { "Dull Shard": 1 }, "baseTime": 3.0 },
        { "id": "Shattered Crystal", "machine": "Refiner", "inputs": { "Dull Shard": 2 }, "outputs": { "Shattered Crystal": 1 }, "baseTime": 3.0 },
        { "id": "Crude Crystal", "machine": "Refiner", "inputs": { "Shattered Crystal": 2 }, "outputs": { "Crude Crystal": 1 }, "baseTime": 3.0 },
        { "id": "Polished Crystal", "machine": "Refiner", "inputs": { "Crude Crystal": 2 }, "outputs": { "Polished Crystal": 1 }, "baseTime": 3.0 },
        { "id": "Adamant", "machine": "Refiner", "inputs": { "Polished Crystal": 2 }, "outputs": { "Adamant": 1 }, "baseTime": 3.0 },
        { "id": "Diamond", "machine": "Refiner", "inputs": { "Adamant": 2 }, "outputs": { "Diamond": 1 }, "baseTime": 3.0 },
        { "id": "Perfect Diamond", "machine": "Refiner", "inputs": { "Diamond": 2 }, "outputs": { "Perfect Diamond": 1 }, "baseTime": 3.0 },

        // --- GEM PRODUCTS ---
        { "id": "Turquoise", "machine": "Assembler", "inputs": { "Healing Potion": 2, "Sand": 12 }, "outputs": { "Turquoise": 1 }, "baseTime": 12.0 },
        // --- MALACHITE BATCH (50%) ---
        { 
            "id": "Malachite", "machine": "Athanor", 
            "inputs": { "Impure Copper Powder": 4, "Clay Powder": 12 }, 
            "outputs": { "Malachite": 1, "Crude Shard": 1 }, 
            "baseTime": 24.0
        },
        { "id": "Topaz", "machine": "Blender", "inputs": { "Crude Shard": 1, "Sulfuric Acid": 30 }, "outputs": { "Topaz": 1 }, "baseTime": 12.0 },
        // --- LAPIS BATCH (33%) ---
        { 
            "id": "Lapis Lazuli", "machine": "Advanced Athanor", 
            "inputs": { "Impure Silver Powder": 3, "Crude Shard": 12, "Gentian Powder": 12 }, 
            "outputs": { "Lapis Lazuli": 1, "Crude Shard": 1, "Shattered Crystal": 1 }, // Est: 0.5 shard + 0.5 crystal -> 1.5 fails?
            "baseTime": 36.0
        },
        // --- OBSIDIAN BATCH (50%) ---
        { 
            "id": "Obsidian", "machine": "Advanced Athanor", 
            "inputs": { "Oblivion Essence": 2, "Crude Crystal": 2, "Unstable Catalyst": 2 }, 
            "outputs": { "Obsidian": 1, "Volcanic Ash": 1 }, 
            "baseTime": 12.0
        },
        { "id": "Ruby", "machine": "Cauldron", "inputs": { "Diamond": 1, "Gold Dust": 1, "Resonant Catalyst": 1 }, "outputs": { "Ruby": 1 }, "baseTime": 30.9 },
        { "id": "Sapphire", "machine": "Cauldron", "inputs": { "Perfect Diamond": 1, "World Tree Core": 1, "Unstable Catalyst": 1 }, "outputs": { "Sapphire": 1 }, "baseTime": 38.2 },
        { "id": "Emerald", "machine": "Cauldron", "inputs": { "Moonlit Soap": 1, "Lapis Lazuli": 1, "Resonant Catalyst": 1 }, "outputs": { "Emerald": 1 }, "baseTime": 45.5 },

        // --- METEORITE MEGA-RECIPE ---
        { 
            "id": "Meteorite Processing", "machine": "Stone Crusher", 
            "inputs": { "Meteorite": 1 }, 
            "outputs": { 
                "Stone": 300, "Coal": 300, "Iron Sand": 300, 
                "Shattered Crystal": 60, "Obsidian": 30, "Adamant": 7,
                "Ruby": 1, "Sapphire": 1, "Emerald": 1 
            }, 
            "baseTime": 1200.0 
        },

        // --- RELICS ---
        { "id": "Jupiter", "machine": "Shaper", "inputs": { "Plank": 1200, "Small Wooden Gear": 1800, "Wooden Pulley": 600 }, "outputs": { "Jupiter": 1 }, "baseTime": 600.0 },
        { "id": "Saturn", "machine": "Shaper", "inputs": { "Salt": 600, "Brick": 600, "Glass": 600 }, "outputs": { "Saturn": 1 }, "baseTime": 300.0 },
        { "id": "Mars", "machine": "Shaper", "inputs": { "Iron Nails": 600, "Steel Gear": 300, "Bronze Rivet": 600, "Copper Bearing": 300 }, "outputs": { "Mars": 1 }, "baseTime": 300.0 },
        { "id": "Venus", "machine": "Advanced Shaper", "inputs": { "Healing Potion": 200, "Vitality Potion": 200, "Transformation Potion": 200, "Growth Potion": 200, "Blast Potion": 200, "Sulfuric Acid": 4000 }, "outputs": { "Venus": 1 }, "baseTime": 1200.0 },
        { "id": "Star Dust", "machine": "Arcane Processor", "inputs": { "Jupiter": 12, "Saturn": 4, "Mars": 3 }, "outputs": { "Star Dust": 2 }, "baseTime": 300.0 },
        { "id": "Fairy Dust", "machine": "Arcane Processor", "inputs": { "Chamomile Powder": 1, "Gentian Powder": 1, "World Tree Leaf": 1 }, "outputs": { "Fairy Dust": 1 }, "baseTime": 4.0 },
        { "id": "Luna", "machine": "Arcane Shaper", "inputs": { "Steel Ingot": 75, "Bronze Ingot": 75, "Copper Ingot": 75, "Silver Ingot": 75, "Gold Ingot": 75, "Moon Tear": 75 }, "outputs": { "Luna": 1 }, "baseTime": 600.0 },
        { "id": "Mercury", "machine": "Arcane Shaper", "inputs": { "Turquoise": 100, "Malachite": 100, "Topaz": 100, "Obsidian": 100, "Lapis Lazuli": 100, "Quicksilver": 1000 }, "outputs": { "Mercury": 1 }, "baseTime": 600.0 },
        { "id": "Sol", "machine": "Arcane Shaper", "inputs": { "Jupiter": 1, "Saturn": 1, "Mars": 1, "Venus": 1, "Mercury": 1, "Luna": 1, "Diamond": 25, "Eternal Catalyst": 5, "World Tree Core": 5 }, "outputs": { "Sol": 1 }, "baseTime": 300.0 },

        // --- 15. ALTERNATE RECIPES ---
        { 
            "id": "Coke_Alt", "machine": "Crucible", 
            "inputs": { "Coal": 1 }, "outputs": { "Coke": 1 }, 
            "baseTime": 6.0 
        },
        { 
            "id": "SilverPowder3_Alt", "machine": "Advanced Athanor", 
            "inputs": { "Impure Silver Powder": 2 }, "outputs": { "Silver Powder": 1 }, 
            "baseTime": 8.0 
        },
        { 
            "id": "GoldDust3_Alt", "machine": "Advanced Athanor", 
            "inputs": { "Impure Gold Dust": 2 }, "outputs": { "Gold Dust": 1 }, 
            "baseTime": 10.0 
        },
        // --- Reverse Crafting (Coins -> Ingots) ---
        { 
            "id": "CopperIngot_Alt", "machine": "Crucible", 
            "inputs": { "Copper Coin": 400 }, "outputs": { "Copper Ingot": 1 }, 
            "baseTime": 12.0 
        },
        { 
            "id": "SilverIngot_Alt", "machine": "Crucible", 
            "inputs": { "Silver Coin": 6 }, "outputs": { "Silver Ingot": 1 }, 
            "baseTime": 16.0 
        },
        { 
            "id": "GoldIngot_Alt", "machine": "Crucible", 
            "inputs": { "Gold Coin": 3 }, "outputs": { "Gold Ingot": 1 }, 
            "baseTime": 40.0 
        },
        // --- ENHANCED GRINDER ALTERNATE RECIPES ---
        // (Base times are halved to represent 2x Machine Speed)
        { "id": "Sand_Enhanced", "machine": "Enhanced Grinder", "inputs": { "Stone": 1 }, "outputs": { "Sand": 1 }, "baseTime": 6.0 },
        { "id": "Quicklime Powder_Enhanced", "machine": "Enhanced Grinder", "inputs": { "Quicklime": 1 }, "outputs": { "Quicklime Powder": 1 }, "baseTime": 4.5 },
        { "id": "Clay Powder_Enhanced", "machine": "Enhanced Grinder", "inputs": { "Clay": 1 }, "outputs": { "Clay Powder": 1 }, "baseTime": 2.0 },
        { "id": "Flax Fiber_Enhanced", "machine": "Enhanced Grinder", "inputs": { "Flax": 1 }, "outputs": { "Flax Fiber": 1 }, "baseTime": 1.5 },
        { "id": "Sage Powder_Enhanced", "machine": "Enhanced Grinder", "inputs": { "Sage": 1 }, "outputs": { "Sage Powder": 1 }, "baseTime": 1.5 },
        { "id": "Chamomile Powder_Enhanced", "machine": "Enhanced Grinder", "inputs": { "Chamomile": 1 }, "outputs": { "Chamomile Powder": 1 }, "baseTime": 1.5 },
        { "id": "Gentian Powder_Enhanced", "machine": "Enhanced Grinder", "inputs": { "Gentian": 1 }, "outputs": { "Gentian Powder": 1 }, "baseTime": 1.5 },
        { "id": "Soap Powder_Enhanced", "machine": "Enhanced Grinder", "inputs": { "Soap": 1 }, "outputs": { "Soap Powder": 1 }, "baseTime": 3.0 },
        { "id": "Perfumed Soap Powder_Enhanced", "machine": "Enhanced Grinder", "inputs": { "Perfumed Soap": 1 }, "outputs": { "Perfumed Soap Powder": 1 }, "baseTime": 4.0 },
        { "id": "Large Wooden Gear_Enhanced", "machine": "Enhanced Grinder", "inputs": { "Plank": 1 }, "outputs": { "Large Wooden Gear": 1 }, "baseTime": 3.0 },
        { "id": "Charcoal Powder_Enhanced", "machine": "Enhanced Grinder", "inputs": { "Charcoal": 1 }, "outputs": { "Charcoal Powder": 1 }, "baseTime": 2.0 },
        { "id": "Coke Powder_Enhanced", "machine": "Enhanced Grinder", "inputs": { "Coke": 1 }, "outputs": { "Coke Powder": 1 }, "baseTime": 6.0 },
        { "id": "Iron Sand_Enhanced", "machine": "Enhanced Grinder", "inputs": { "Iron Ingot": 1 }, "outputs": { "Iron Sand": 1 }, "baseTime": 15.0 },
        { "id": "Sulfur Powder_Enhanced", "machine": "Enhanced Grinder", "inputs": { "Sulfur": 1 }, "outputs": { "Sulfur Powder": 1 }, "baseTime": 3.0 }
    ],

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