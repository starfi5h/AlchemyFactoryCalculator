window.ALCHEMY_DB = {
    "version": 22,
    "date": "2025.01.05",
    "gameVersion": "0.4.1.3800",
    "items": {
        // --- 1. RAW RESOURCES ---
        "Logs": { "id": 1, "category": "Raw Materials", "buyPrice": 200, "maxStack": -200, "heat": 2000, "cauldronCost": 0.8 },
        "Limestone": { "id": 2, "category": "Raw Materials", "buyPrice": 600, "maxStack": -150, "cauldronCost": 3 },
        "Iron Ore": { "id": 3, "category": "Raw Materials", "buyPrice": 1200, "maxStack": -100, "cauldronCost": 10 },
        "Pyrite Ore": { "id": 23, "category": "Raw Materials", "buyPrice": 11000, "maxStack": -160, "cauldronCost": 45 },
        "Rock Salt": { "id": 22, "category": "Raw Materials", "buyPrice": 9000, "maxStack": -200, "cauldronCost": 35 },
        "Coal Ore": { "id": 21, "category": "Raw Materials", "buyPrice": 4800, "maxStack": -120, "heat": 30000, "cauldronCost": 37 },
        "Rotten Log": { "id": 20, "category": "Raw Materials", "buyPrice": 2000, "maxStack": -200, "cauldronCost": 6.5 },
        "Quartz Ore": { "id": 25, "category": "Raw Materials", "buyPrice": 44000, "maxStack": -80, "cauldronCost": 230 },
        "Meteorite": { "id": 26, "category": "Raw Materials", "buyPrice": 2000000, "maxStack": -1000, "cauldronCost": 800 },

        // --- 2. SEEDS ---
        "Flax Seeds": { "id":4, "category": "Seeds", "buyPrice": 280, "maxStack": 20, "cauldronCost": 115 },
        "Sage Seeds": {  "id":7, "category": "Seeds", "buyPrice": 360, "maxStack": 20, "cauldronCost": 175 },
        "Redcurrant Seeds": { "id":12, "category": "Seeds", "buyPrice": 1300, "maxStack": 20, "cauldronCost": 650 },
        "Lavender Seeds": { "id":14, "category": "Seeds", "buyPrice": 16000, "maxStack": 20, "cauldronCost": 6000 },
        "Chamomile Seeds": { "id":16, "category": "Seeds", "buyPrice": 6000, "maxStack": 20, "cauldronCost": 2300 },
        "Gentian Seeds": { "id":19, "category": "Seeds", "buyPrice": 64000, "maxStack": 20, "cauldronCost": 29000},
        "World Tree Seed": { "id":29, "category": "Seeds", "buyPrice": 5000000, "maxStack": 20, "cauldronCost": 5000000 },

        // --- 3. HERBS ---
        "Flax": { "id": 5, "category": "Herbs", "nutrientCost": 24, "cauldronCost": 2 },
        "Sage": { "id": 6, "category": "Herbs", "nutrientCost": 36, "cauldronCost": 3 },
        "Redcurrant": { "id": 11, "category": "Herbs", "nutrientCost": 144, "cauldronCost": 12 },
        "Lavender": { "id": 13, "category": "Herbs", "nutrientCost": 2160, "cauldronCost": 180 },
        "Chamomile": { "id": 15, "category": "Herbs", "nutrientCost": 720, "cauldronCost": 55 },
        "Gentian": { "id": 17, "category": "Herbs", "nutrientCost": 6000, "cauldronCost": 400 },
        "Gentian Nectar": { "id": 802, "category": "Herbs", "nutrientCost": 6000, "cauldronCost": 420 },
        "World Tree Leaf": { "id": 27, "category": "Herbs", "nutrientCost": 30000, "cauldronCost": 2500 },
        "World Tree Core": { "id": 28, "category": "Herbs", "nutrientCost": 3000000, "cauldronCost": 250000 },
        "Gloom Fungus": { "id": 509, "category": "Misc", "cauldronCost": 26 },

        // --- 4. FUELS ---
        "Plank": { "id": 101, "category": "Fuel", "heat": 20, "maxStack": 200, "cauldronCost": 1, "cauldronMulti": 1, "cauldronTarget": 0.1 },
        "Charcoal": { "id": 403, "category": "Fuel", "heat": 40, "cauldronCost": 2, "cauldronMulti": 1, "cauldronTarget": 2 },
        "Charcoal Powder": { "id": 404, "category": "Fuel", "heat": 48, "cauldronCost": 2.5 },
        "Coke": { "id": 503, "category": "Fuel", "heat": 600, "cauldronCost": 29, "cauldronMulti": 1, "cauldronTarget": 30 },
        "Coke Powder": { "id": 504, "category": "Fuel", "heat": 660, "cauldronCost": 31 },
        "Coal": { "id": 604, "category": "Fuel", "heat": 540, "cauldronCost": 40, "cauldronMulti": 1, "cauldronTarget": 40 },
        "Black Powder": { "id": 614, "category": "Fuel", "heat": 3000, "sellPrice": 330, "cauldronCost": 145, "cauldronMulti": 1, "cauldronTarget": 150 },
        "Blast Potion": { "id": 705, "category": "Fuel", "heat": 24000, "sellPrice": 2557, "cauldronCost": 1197 },

        // --- 5. FERTILIZERS ---
        "Basic Fertilizer": { "id": 416, "category": "Fertilizer", "nutrientValue": 144, "maxFertility": 12, "cauldronCost": 14 },
        "Advanced Fertilizer": { "id": 511, "category": "Fertilizer", "nutrientValue": 720, "maxFertility": 144, "cauldronCost": 62 },        
        "Growth Potion": { "id": 615, "category": "Fertilizer", "sellPrice": 1224, "nutrientValue": 6480, "maxFertility": 2160, "cauldronCost": 500 },
        "Fertile Catalyst": { "id": 706, "category": "Fertilizer", "nutrientValue": 24000, "maxFertility": 6000, "cauldronCost": 4067.84, "cauldronMulti": 0.5, "cauldronTarget": 3567.84 },

        // --- 6. POTIONS ---
        "Healing Potion": { "id": 306, "category": "Potion", "sellPrice": 85, "cauldronCost": 30 },
        "Vitality Potion": { "id": 415, "category": "Potion", "sellPrice": 330, "cauldronCost": 125 },
        "Transformation Potion": { "id": 508, "category": "Potion", "sellPrice": 620, "cauldronCost": 240 },
        "Panacea Potion": { "id": 816, "category": "Potion", "nutrientValue": 200000, "maxFertility": 20000, "heat": 320000, "sellPrice": 30000, "cauldronCost": 15306.12 },

        // --- 7. SOLIDS ---        
        "Stone": { "id": 201, "category": "Solid", "maxStack": 200, "cauldronCost": 4, "cauldronMulti": 1, "cauldronTarget": 4 },
        "Iron Ingot": { "id": 301, "category": "Solid", "maxStack": 200, "cauldronCost": 15 },
        "Quicklime": { "id": 401, "category": "Solid", "cauldronCost": 6, "cauldronMulti": 1, "cauldronTarget": 6 },
        "Clay": { "id": 406, "category": "Solid", "maxStack": 200, "cauldronCost": 21, "cauldronMulti": 1, "cauldronTarget": 20 },
        "Brick": { "id": 408, "category": "Misc", "maxStack": 200, "cauldronCost": 25 },
        "Glass": { "id": 412, "category": "Misc", "sellPrice": 75, "maxStack": 200, "cauldronCost": 27 },
        "Steel Ingot": { "id": 505, "category": "Solid", "maxStack": 200, "cauldronCost": 161 },
        "Sulfur": { "id": 602, "category": "Solid", "cauldronCost": 166, "cauldronMulti": 1, "cauldronTarget": 246 },
        "Bronze Ingot": { "id": 609, "category": "Solid", "maxStack": 100, "cauldronCost": 155 },
        "Copper Ingot": { "id": 610, "category": "Solid", "maxStack": 200, "cauldronCost": 300 },           
        "Silver Ingot": { "id": 808, "category": "Solid", "maxStack": 100, "cauldronCost": 4746 },
        "Gold Ingot": { "id": 905, "category": "Solid", "maxStack": 100, "cauldronCost": 87222.6 },
        "Crude Shard": { "id": 627, "category": "Solid", "cauldronCost": 272, "cauldronMulti": 1, "cauldronTarget": 512 },
        "Broken Shard": { "id": 628, "category": "Solid", "cauldronCost": 824, "cauldronMulti": 1, "cauldronTarget": 1024 },
        "Dull Shard": { "id": 629, "category": "Solid", "cauldronCost": 1548, "cauldronMulti": 1, "cauldronTarget": 2048 },
        "Shattered Crystal": { "id": 630, "category": "Solid", "cauldronCost": 3496, "cauldronMulti": 1, "cauldronTarget": 4096 },
        "Crude Crystal": { "id": 631, "category": "Solid", "cauldronCost": 6692, "cauldronMulti": 1, "cauldronTarget": 8192 },
        "Polished Crystal": { "id": 632, "category": "Solid", "cauldronCost": 14384, "cauldronMulti": 1, "cauldronTarget": 16384 },
        "Adamant": { "id": 633, "category": "Solid", "cauldronCost": 30768, "cauldronMulti": 1, "cauldronTarget": 32768 },
        "Diamond": { "id": 634, "category": "Solid", "sellPrice": 100000, "cauldronCost": 65536, "cauldronMulti": 1, "cauldronTarget": 65536 },
        "Perfect Diamond": { "id": 635, "category": "Solid", "cauldronCost": 131072, "cauldronMulti": 1, "cauldronTarget": 131072 },

        // --- 8. MASH ---
        "Sand": { "id": 202, "category": "Mash", "cauldronCost": 4.5 },
        "Flax Fiber": { "id": 204, "category": "Mash", "cauldronCost": 2.5 },
        "Iron Sand": { "id": 303, "category": "Mash", "cauldronCost": 15.5, "cauldronMulti": 1, "cauldronTarget": 15 },
        "Plant Ash": { "id": 304, "category": "Mash", "cauldronCost": 4 },
        "Sage Powder": { "id": 305, "category": "Mash", "cauldronCost": 3.5 },
        "Quicklime Powder": { "id": 402, "category": "Mash", "cauldronCost": 7 },
        "Clay Powder": { "id": 407, "category": "Mash", "cauldronCost": 22 },
        "Soap Powder": { "id": 414, "category": "Mash", "cauldronCost": 24 },
        "Chamomile Powder": { "id": 601, "category": "Mash", "cauldronCost": 57 },
        "Sulfur Powder": { "id": 603, "category": "Mash", "cauldronCost": 200 },
        "Impure Copper Powder": { "id": 607, "category": "Mash", "cauldronCost": 150, "cauldronMulti": 1, "cauldronTarget": 180 },
        "Copper Powder": { "id": 608, "category": "Mash", "cauldronCost": 290, "cauldronMulti": 1, "cauldronTarget": 350 },
        "Perfumed Soap Powder": { "id": 708, "category": "Mash", "cauldronCost": 1216.4 },
        "Gentian Powder": { "id": 801, "category": "Mash", "cauldronCost": 430 },
        "Crude Silver Powder": { "id": 803, "category": "Mash", "cauldronCost": 1273.5, "cauldronMulti": 0.7, "cauldronTarget": 1673.5 },
        "Impure Silver Powder": { "id": 804, "category": "Mash", "cauldronCost": 2547, "cauldronMulti": 0.7, "cauldronTarget": 3347 },
        "Silver Powder": { "id": 805, "category": "Mash", "cauldronCost": 4742, "cauldronMulti": 0.7, "cauldronTarget": 4742 },
        "Volcanic Ash": { "id": 29, "category": "Mash", "cauldronCost": 5290 },
        "Crude Gold Dust": { "id": 901, "category": "Mash", "cauldronCost": 10805.325, "cauldronMulti": 0.5, "cauldronTarget": 13805.325 },
        "Impure Gold Dust": { "id": 902, "category": "Mash", "cauldronCost": 21610.65, "cauldronMulti": 0.5, "cauldronTarget": 27610.65 },
        "Gold Dust": { "id": 903, "category": "Mash", "cauldronCost": 42357.3, "cauldronMulti": 0.5, "cauldronTarget": 52357.3 },
        "Pure Gold Dust": { "id": 904, "category": "Mash", "cauldronCost": 84714.6, "cauldronMulti": 0.5, "cauldronTarget": 99714.6 },

        // --- 9. COMPONENTS ---
        "Linen Thread": { "id": 205, "category": "Component", "maxStack": 200, "cauldronCost": 9 },
        "Linen Rope": { "id": 206, "category": "Component", "sellPrice": 36, "maxStack": 200, "cauldronCost": 13 },
        "Large Wooden Gear": { "id": 102, "category": "Component", "sellPrice": 5, "maxStack": 100, "cauldronCost": 1.5 },
        "Small Wooden Gear": { "id": 207, "category": "Component", "sellPrice": 8, "maxStack": 200, "cauldronCost": 0.3333333333 },
        "Iron Nails": { "id": 302, "category": "Component", "sellPrice": 16, "maxStack": 200, "cauldronCost": 5 },
        "Wooden Pulley": { "id": 405, "category": "Component", "sellPrice": 44, "maxStack": 50, "cauldronCost": 14 },
        "Steel Gear": { "id": 506, "category": "Component", "sellPrice": 450, "maxStack": 200, "cauldronCost": 170 },
        "Copper Bearing": { "id": 612, "category": "Component", "sellPrice": 300, "maxStack": 200, "cauldronCost": 136.5 },
        "Bronze Rivet": { "id": 613, "category": "Component", "sellPrice": 120, "maxStack": 200, "cauldronCost": 51 },

        // --- 10. LIQUIDS ---
        "Linseed Oil": { "id": 409, "category": "Liquid", "liquid": true, "cauldronCost": 0.04 },
        "Fruit Wine": { "id": 410, "category": "Liquid", "liquid": true, "cauldronCost": 1.2 },
        "Limewater": { "id": 411, "category": "Liquid", "liquid": true, "cauldronCost": 0.2 },
        "Salt Water": { "id": 606, "category": "Liquid", "liquid": true, "cauldronCost": 3.25 },
        "Lavender Essential Oil": { "id": 701, "category": "Liquid", "liquid": true, "cauldronCost": 37.88 },
        "Brandy": { "id": 702, "category": "Liquid", "liquid": true, "cauldronCost": 7.425 },
        "Sulfuric Acid": { "id": 703, "category": "Liquid", "liquid": true, "cauldronCost": 23.13 },
        "Quicksilver": { "id": 811, "category": "Liquid", "liquid": true, "cauldronCost": 413.19 },
        "Aqua Vitae": { "id": 812, "category": "Liquid", "liquid": true, "cauldronCost": 459.3 },
        "Fairy Tear": { "id": 911, "category": "Liquid", "liquid": true, "cauldronCost": 3060 },
        "Moon Tear": { "id": 912, "category": "Liquid", "liquid": true, "cauldronCost": 97092 },

	// --- 11. CATALYSTS ---		
        "Yeast Powder": { "id": 507, "category": "Catalyst", "cauldronCost": 88, "cauldronMulti": 1, "cauldronTarget": 88 },
        "Gloom Spores": { "id": 510, "category": "Catalyst", "cauldronCost": 220, "cauldronMulti": 0.9, "cauldronTarget": 280 },
        "Unstable Catalyst": { "id": 616, "category": "Catalyst", "cauldronCost": 746, "cauldronMulti": 0.7, "cauldronTarget": 746 },
        "Resonant Catalyst": { "id": 815, "category": "Catalyst", "cauldronCost": 23869.44, "cauldronMulti": 0.3, "cauldronTarget": 22869.44 },
        "Eternal Catalyst": { "id": 908, "category": "Catalyst", "cauldronCost": 1193041.6 },

	// --- 12. Magic ---
        "Philosopherˈs Stone": { "id": 33, "category": "Magic", "cauldronCost": 1000000, "cauldronMulti": 1, "cauldronTarget": 1000000 },
        "Oblivion Essence": { "id": 25, "category": "Magic", "cauldronCost": 600, "cauldronMulti": 1, "cauldronTarget": 600 },
        "Vitality Essence": { "id": 709, "category": "Magic", "cauldronCost": 900, "cauldronMulti": 1, "cauldronTarget": 900 },
        "Star Dust": { "id": 909, "category": "Magic", "cauldronCost": 4149, "cauldronMulti": 1, "cauldronTarget": 6149 },
        "Fairy Dust": { "id": 910, "category": "Magic", "cauldronCost": 3060, "cauldronMulti": 1, "cauldronTarget": 3760 },

        // -------

        // --- 13. GOODS & CURRENCY ---
        "Copper Coin": { "id": 611, "category": "Currency", "sellPrice": 1, "cauldronCost": 0.6766666667 },
        "Silver Coin": { "id": 809, "category": "Currency", "sellPrice": 1000, "cauldronCost": 949.2 },
        "Gold Coin": { "id": 906, "category": "Currency", "sellPrice": 100000, "cauldronCost": 89722.6 },
        "Mortar": { "id": 203, "category": "Misc", "sellPrice": 48, "cauldronCost": 18 },
        "Salt": { "id": 605, "category": "Misc", "sellPrice": 100, "cauldronCost": 65, "cauldronMulti": 1, "cauldronTarget": 65 },
        "Linen": { "id": 307, "category": "Misc", "sellPrice": 165, "cauldronCost": 60 },
        "Bandage": { "id": 308, "category": "Misc", "sellPrice": 350, "cauldronCost": 120 },
        "Soap": { "id": 413, "category": "Misc", "sellPrice": 60, "cauldronCost": 23 },
        "Perfumed Soap": { "id": 707, "category": "Misc", "sellPrice": 2590, "cauldronCost": 1216.4 },
        "Moonlit Soap": { "id": 913, "category": "Misc", "sellPrice": 995280, "cauldronCost": 487892.8 },

        // --- 14. Jewelry ---
        "Ruby": { "id": 30, "category": "Jewelry", "sellPrice": 250000, "cauldronCost": 200000, "cauldronMulti": 1, "cauldronTarget": 200000 },
        "Sapphire": { "id": 31, "category": "Jewelry", "sellPrice": 480000, "cauldronCost": 400000, "cauldronMulti": 1, "cauldronTarget": 400000 },
        "Emerald": { "id": 32, "category": "Jewelry", "sellPrice": 700000, "cauldronCost": 600000, "cauldronMulti": 1, "cauldronTarget": 600000 },
        "Turquoise": { "id": 501, "category": "Jewelry", "sellPrice": 290, "cauldronCost": 108, "cauldronMulti": 1, "cauldronTarget": 108 },
        "Pocket Watch": { "id": 617, "category": "Jewelry", "sellPrice": 900000, "cauldronCost": 789 },
        "Malachite": { "id": 618, "category": "Jewelry", "sellPrice": 1020, "cauldronCost": 367, "cauldronMulti": 1, "cauldronTarget": 427 },        
        "Topaz": { "id": 704, "category": "Jewelry", "sellPrice": 2800, "cauldronCost": 1205.9, "cauldronMulti": 1, "cauldronTarget": 1405.9 },       
        "Obsidian": { "id": 806, "category": "Jewelry", "sellPrice": 11000, "cauldronCost": 5290, "cauldronMulti": 1, "cauldronTarget": 5290 },
        "Silver Amulet": { "id": 810, "category": "Jewelry", "sellPrice": 48000, "cauldronCost": 25317 },
        "Lapis Lazuli": { "id": 813, "category": "Jewelry", "sellPrice": 32000, "maxStack": 50, "cauldronCost": 15825, "cauldronMulti": 1, "cauldronTarget": 18825 },
        "Crown": { "id": 907, "category": "Jewelry", "sellPrice": 1600000, "cauldronCost": 854167.8 },

        // --- 15. RELICS ---
        "Jupiter": { "id": 502, "category": "Relic", "sellPrice": 30000, "maxStack": -300, "cauldronCost": 34 },
        "Saturn": { "id": 619, "category": "Relic", "sellPrice": 150000, "maxStack": -100, "cauldronCost": 714 },
        "Mars": { "id": 620, "category": "Relic", "sellPrice": 280000, "maxStack": -75, "cauldronCost": 1678 },
        "Venus": { "id": 710, "category": "Relic", "sellPrice": 1000000, "maxStack": -200, "cauldronCost": 2549.6 },
        "Mercury": { "id": 814, "category": "Relic", "sellPrice": 5200000, "maxStack": -100, "cauldronCost": 26927.8 },
        "Luna": { "id": 914, "category": "Relic", "sellPrice": 18500000, "maxStack": -75, "cauldronCost": 187167.6 },
        "Sol": { "id": 1001, "category": "Relic", "sellPrice": 42000000, "maxStack": -5, "cauldronCost": 5587945.6 },

        // --- 16. OTHER ---
        "Portal Sigil": { "id": 2001, "category": "Other", "buyPrice": 1500, "cauldronCost": 750 },
        "Gelatinous Gridlock": { "id": 2002, "category": "Other", "buyPrice": 100, "cauldronCost": 100 },
        //"Automatic Cashier": { "id": 2003, "category": "Other", "buyPrice": 3000, "cauldronCost": 1400 }
    },
    
    "machines": {
        "Table Saw": { "buildCost": { "Plank": 5 } },
        "Stone Crusher": { "buildCost": { "Plank": 6, "Large Wooden Gear": 6 } },
        "Planting": { "buildCost": { "Stone": 8 } },
        "Grinder": { "buildCost": { "Plank": 8 } },
        "Extractor": { "buildCost": { "Iron Ingot": 5, "Glass": 5 } },
        "Stone Furnace": { "heatSelf": 1, "slots": 9, "isGenerator": true, "buildCost": { "Stone": 20 } }, 
        "Blast Furnace": { "heatSelf": 4.0, "slots": 42, "isGenerator": true, "buildCost": { "Brick": 30 } }, 
        "Crucible": { "heatCost": 4.0, "parent": "Stone Furnace", "slotsRequired": 3, "buildCost": { "Stone": 4 } },
        "Kiln": { "heatCost": 15.0, "parent": "Stone Furnace", "slotsRequired": 6, "buildCost": { "Stone": 20, "Clay": 10 } },
        "Iron Smelter": { "heatCost": 9.0, "parent": "Stone Furnace", "slotsRequired": 9, "buildCost": { "Stone": 15 } },
        "Stackable Crucible": { "heatCost": 6.0, "parent": "Stone Furnace", "slotsRequired": 3, "buildCost": { "Stone": 6, "Steel Ingot": 2, "Bronze Rivet": 4 } },
        "Thermal Extractor": { "heatCost": 80.0, "parent": "Stone Furnace", "slotsRequired": 6, "buildCost": { "Steel Ingot": 5, "Glass": 5 } },
        "Refiner": { "buildCost": { "Plank": 8, "Steel Gear": 5 } },
        "Processor": { "buildCost": { "Plank": 12, "Large Wooden Gear": 3 } },
        "Assembler": { "buildCost": { "Plank": 10, "Large Wooden Gear": 5, "Small Wooden Gear": 15 } },
        "Advanced Assembler": { "buildCost": { "Steel Ingot": 12, "Steel Gear": 16, "Copper Bearing": 8 } },
        "Blender": { "buildCost": { "Iron Ingot": 8, "Glass": 8 } },
        "Advanced Blender": { "buildCost": { "Steel Ingot": 8, "Glass": 16, "Copper Bearing": 4 } },
        "Alembic": { "heatCost": 108.0, "parent": "Stone Furnace", "slotsRequired": 1, "buildCost": { "Steel Ingot": 4, "Copper Ingot": 4, "Glass": 8 } },
        "Advanced Alembic": { "heatCost": 270.0, "parent": "Stone Furnace", "slotsRequired": 6, "buildCost": { "Steel Ingot": 8, "Copper Bearing": 4, "Glass": 16 } },
        "Athanor": { "heatCost": 32.0, "parent": "Stone Furnace", "slotsRequired": 6, "buildCost": { "Iron Nails": 15, "Iron Ingot": 10 } },
        "Advanced Athanor": { "heatCost": 360.0, "parent": "Stone Furnace", "slotsRequired": 6, "buildCost": { "Steel Ingot": 12, "Gold Ingot": 12 } },
        "Shaper": { "buildCost": { "Iron Ingot": 8, "Iron Nails": 16 } },
        "Advanced Shaper": { "buildCost": { "Steel Ingot": 8, "Steel Gear": 16 } },
        "Arcane Shaper": { "buildCost": { "Gold Ingot": 12, "Copper Bearing": 18, "Steel Gear": 24 } },
        "Paradox Crucible": { "heatCost": 1200.0, "parent": "Stone Furnace", "slotsRequired": 9, "buildCost": { "Bronze Rivet": 16, "Copper Ingot": 8, "Steel Ingot": 8 } },
        // Cauldron heatCost is depend on the recipe. Use a non-zero value as placeholder here
        "Cauldron": { "heatCost": -1, "parent": "Stone Furnace", "buildCost": { "Bronze Ingot": 30 } },
        "Arcane Processor": { "buildCost": { "Steel Ingot": 6, "Steel Gear": 12, "Lapis Lazuli": 2 } },
        "Enhanced Grinder": { "buildCost": { "Plank": 12, "Steel Gear": 3 } },
        "Nursery": { "fertility": true, "buildCost": { "Iron Ingot": 12, "Clay": 6 } },
        "World Tree Nursery": { "fertility": true, "buildCost": { "Iron Ingot": 100, "Clay": 100  } },
        "Knowledge Altar": { "buildCost": { "Stone": 24 } }
    },
    
    "recipes": [
        // --- HERBS & SEEDS ---
        { "id": "Flax", "machine": "Planting", "inputs": { "Flax Seeds": 1 }, "outputs": { "Flax": 200 }, "baseTime": 400.0 },
        { "id": "Sage", "machine": "Planting", "inputs": { "Sage Seeds": 1 }, "outputs": { "Sage": 180 }, "baseTime": 540.0 },
        { "id": "Redcurrant", "machine": "Planting", "inputs": { "Redcurrant Seeds": 1 }, "outputs": { "Redcurrant": 150 }, "baseTime": 720.0 },
        { "id": "Lavender", "machine": "Planting", "inputs": { "Lavender Seeds": 1 }, "outputs": { "Lavender": 120 }, "baseTime": 1440.0 },
        { "id": "Chamomile", "machine": "Planting", "inputs": { "Chamomile Seeds": 1 }, "outputs": { "Chamomile": 140 }, "baseTime": 1120.0 },
        { "id": "Gentian", "machine": "Planting", "inputs": { "Gentian Seeds": 1 }, "outputs": { "Gentian": 80, "Gentian Nectar": 80 }, "baseTime": 2160.0 },

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
        { "id": "Copper Ingot", "machine": "Crucible", "inputs": { "Copper Powder": 1 }, "outputs": { "Copper Ingot": 1 }, "baseTime": 12.0 },
        { "id": "Bronze Ingot", "machine": "Crucible", "inputs": { "Impure Copper Powder": 1 }, "outputs": { "Bronze Ingot": 1 }, "baseTime": 12.0 },
        { "id": "Copper Coin", "machine": "Processor", "inputs": { "Copper Ingot": 1 }, "outputs": { "Copper Coin": 300 }, "baseTime": 12.0 },

        // --- SILVER ---
        { "id": "Impure Silver Powder", "machine": "Refiner", "inputs": { "Crude Silver Powder": 2 }, "outputs": { "Impure Silver Powder": 1 }, "baseTime": 8.0 },
        // --- SILVER POWDER BATCH (20%) ---
        { 
            "id": "Silver Powder", "machine": "Advanced Athanor", 
            "inputs": { "Copper Powder": 10, "Unstable Catalyst": 10, "Black Powder": 10 }, 
            "outputs": { "Silver Powder": 1, "Crude Silver Powder": 4 }, 
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
        { "id": "Oblivion Essence Limestone", "machine": "Paradox Crucible", "inputs": { "Limestone": 1 }, "outputs": { "Oblivion Essence": 1 }, "baseTime": 3.3 },
        { "id": "Oblivion Essence Gentian Nectar", "machine": "Paradox Crucible", "inputs": { "Gentian Nectar": 1 }, "outputs": { "Oblivion Essence": 1 }, "baseTime": 3.6 },
        { "id": "Vitality Essence", "machine": "Paradox Crucible", "inputs": { "Oblivion Essence": 1 }, "outputs": { "Vitality Essence": 1 }, "baseTime": 5.0 },
        { "id": "Resonant Catalyst", "machine": "Advanced Blender", "inputs": { "Fertile Catalyst": 1, "Volcanic Ash": 1, "Aqua Vitae": 12 }, "outputs": { "Resonant Catalyst": 1 }, "baseTime": 8.0 },
        { "id": "Eternal Catalyst", "machine": "Arcane Processor", "inputs": { "Resonant Catalyst": 15, "Philosopherˈs Stone": 1 }, "outputs": { "Eternal Catalyst": 1 }, "baseTime": 60.0 },
        // Note: ˈ is U+02C8, not ASCII 39
        { "id": "Philosopherˈs Stone", "machine": "Advanced Assembler", "inputs": { "Ruby": 1, "Sapphire": 1, "Emerald": 1 }, "outputs": { "Philosopherˈs Stone": 1 }, "baseTime": 60.0 },

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
        { "id": "Ruby", "machine": "Cauldron", "inputs": { "Diamond": 1, "Gold Dust": 1, "Resonant Catalyst": 1 }, "outputs": { "Ruby": 1 }, "baseTime": 30.9, "heatCost": 3131.3 },
        { "id": "Sapphire", "machine": "Cauldron", "inputs": { "Perfect Diamond": 1, "World Tree Core": 1, "Unstable Catalyst": 1 }, "outputs": { "Sapphire": 1 }, "baseTime": 38.2, "heatCost": 4848.5  },
        { "id": "Emerald", "machine": "Cauldron", "inputs": { "Moonlit Soap": 1, "Lapis Lazuli": 1, "Resonant Catalyst": 1 }, "outputs": { "Emerald": 1 }, "baseTime": 45.5, "heatCost": 6565.7 },

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
        { "id": "Star Dust", "machine": "Arcane Processor", "inputs": { "Jupiter": 1, "Saturn": 1, "Mars": 1 }, "outputs": { "Star Dust": 50 }, "baseTime": 300.0 },
        { "id": "Fairy Dust", "machine": "Arcane Processor", "inputs": { "Chamomile Powder": 1, "Gentian Powder": 1, "World Tree Leaf": 1 }, "outputs": { "Fairy Dust": 1 }, "baseTime": 4.0 },
        { "id": "Luna", "machine": "Arcane Shaper", "inputs": { "Steel Ingot": 75, "Bronze Ingot": 75, "Copper Ingot": 75, "Silver Ingot": 75, "Gold Ingot": 75, "Moon Tear": 75 }, "outputs": { "Luna": 1 }, "baseTime": 600.0 },
        { "id": "Mercury", "machine": "Arcane Shaper", "inputs": { "Turquoise": 100, "Malachite": 100, "Topaz": 100, "Obsidian": 100, "Lapis Lazuli": 100, "Quicksilver": 1000 }, "outputs": { "Mercury": 1 }, "baseTime": 600.0 },
        { "id": "Sol", "machine": "Arcane Shaper", "inputs": { "Jupiter": 1, "Saturn": 1, "Mars": 1, "Venus": 1, "Mercury": 1, "Luna": 1, "Perfect Diamond": 25, "Eternal Catalyst": 5, "World Tree Core": 5 }, "outputs": { "Sol": 1 }, "baseTime": 300.0 },

        // --- 15. ALTERNATE RECIPES ---
        { 
            "id": "VolcanicAsh_Alt", "machine": "Refiner", 
            "inputs": { "Obsidian": 1 }, "outputs": { "Volcanic Ash": 1 }, 
            "baseTime": 24.0 
        },
        { 
            "id": "Coke_Alt", "machine": "Crucible", 
            "inputs": { "Coal": 1 }, "outputs": { "Coke": 1 }, 
            "baseTime": 6.0 
        },
        { 
            "id": "CopperPowder2_Alt", "machine": "Refiner", 
            "inputs": { "Impure Copper Powder": 2 }, "outputs": { "Copper Powder": 1 }, 
            "baseTime": 6.0 
        },
        { 
            "id": "SilverPowder3_Alt", "machine": "Refiner", 
            "inputs": { "Impure Silver Powder": 2 }, "outputs": { "Silver Powder": 1 }, 
            "baseTime": 8.0 
        },
        { 
            "id": "GoldDust3_Alt", "machine": "Refiner", 
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
    ]
};