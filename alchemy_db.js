window.ALCHEMY_DB = {
    "version": 45,
    "date": "2026.07.05",
    "gameVersion": "0.5.4539",
    "items": {
        // --- 1. RAW RESOURCES ---
        "Logs": { "id": 1, "category": "Raw Materials", "buyPrice": 200, "maxStack": -200, "heat": 2000, "baseCost": 1, "cauldronCost": 0.8, "paradoxTime": 9.375, "tier": 1 },
        "Limestone": { "id": 2, "category": "Raw Materials", "buyPrice": 600, "maxStack": -150, "baseCost": 4, "cauldronCost": 3, "paradoxTime": 3.333, "tier": 2 },
        "Iron Ore": { "id": 3, "category": "Raw Materials", "buyPrice": 1200, "maxStack": -100, "baseCost": 12, "cauldronCost": 11, "paradoxTime": 1.364, "tier": 3 },
        "Pyrite Ore": { "id": 23, "category": "Raw Materials", "buyPrice": 11000, "maxStack": -160, "baseCost": 70, "cauldronCost": 45, "paradoxTime": 0.208, "tier": 6 },
        "Rock Salt": { "id": 22, "category": "Raw Materials", "buyPrice": 9000, "maxStack": -200, "baseCost": 45, "cauldronCost": 35, "paradoxTime": 0.214, "tier": 6 },
        "Coal Ore": { "id": 21, "category": "Raw Materials", "buyPrice": 4800, "maxStack": -120, "heat": 30000, "baseCost": 40, "cauldronCost": 37, "paradoxTime": 0.338, "tier": 5 },
        "Rotten Log": { "id": 20, "category": "Raw Materials", "buyPrice": 2000, "maxStack": -200, "baseCost": 10, "cauldronCost": 6.5, "paradoxTime": 1.154, "tier": 5 },
        // temp move Quartz Ore id from 25 to 24
        "Quartz Ore": { "id": 24, "category": "Raw Materials", "buyPrice": 44000, "maxStack": -80, "baseCost": 550, "cauldronCost": 230, "paradoxTime": 0.082, "tier": 7 },
        "Meteorite": { "id": 26, "category": "Raw Materials", "buyPrice": 2000000, "maxStack": -1000, "baseCost": 2000, "cauldronCost": 800, "paradoxTime": 0.002, "tier": 9 },

        // --- 2. SEEDS ---
        "Flax Seeds": { "id":4, "category": "Seeds", "buyPrice": 280, "maxStack": 20, "baseCost": 280, "cauldronCost": 115, "paradoxTime": 13.043, "tier": 2 },
        "Sage Seeds": {  "id":7, "category": "Seeds", "buyPrice": 360, "maxStack": 20, "baseCost": 360, "cauldronCost": 175, "paradoxTime": 8.571, "tier": 3 },
        "Redcurrant Seeds": { "id":12, "category": "Seeds", "buyPrice": 1300, "maxStack": 20, "baseCost": 1300, "cauldronCost": 650, "paradoxTime": 2.308, "tier": 4 },
        "Chamomile Seeds": { "id":16, "category": "Seeds", "buyPrice": 6000, "maxStack": 20, "baseCost": 6000, "cauldronCost": 2300, "paradoxTime": 0.652, "tier": 6 },
        "Lavender Seeds": { "id":14, "category": "Seeds", "buyPrice": 16000, "maxStack": 20, "baseCost": 16000, "cauldronCost": 6000, "paradoxTime": 0.250, "tier": 7 },
        "Gentian Seeds": { "id":19, "category": "Seeds", "buyPrice": 64000, "maxStack": 20, "baseCost": 64000, "cauldronCost": 29000, "paradoxTime": 0.052, "tier": 8 },
        "World Tree Seed": { "id":29, "category": "Seeds", "buyPrice": 5000000, "maxStack": 20, "baseCost": 5000000, "cauldronCost": 5000000, "paradoxTime": 0.0003, "tier": 8 },

        // --- 3. HERBS ---
        "Flax": { "id": 5, "category": "Herbs", "nutrientCost": 24, "baseCost": 2, "cauldronCost": 2, "paradoxTime": 750, "tier": 2 },
        "Sage": { "id": 6, "category": "Herbs", "nutrientCost": 36, "baseCost": 3, "cauldronCost": 3, "paradoxTime": 500, "tier": 3 },
        "Redcurrant": { "id": 11, "category": "Herbs", "nutrientCost": 144, "baseCost": 12, "cauldronCost": 12, "paradoxTime": 125, "tier": 4 },
        "Chamomile": { "id": 15, "category": "Herbs", "nutrientCost": 720, "baseCost": 60, "cauldronCost": 55, "paradoxTime": 27.273, "tier": 6 },
        "Lavender": { "id": 13, "category": "Herbs", "nutrientCost": 2160, "baseCost": 180, "cauldronCost": 180, "paradoxTime": 8.333, "tier": 7 },
        "Gentian": { "id": 17, "category": "Herbs", "nutrientCost": 6000, "baseCost": 500, "cauldronCost": 400, "paradoxTime": 3.750, "tier": 8 },
        "Gentian Nectar": { "id": 802, "category": "Herbs", "nutrientCost": 6000, "baseCost": 500, "cauldronCost": 420, "paradoxTime": 3.571, "tier": 8 },
        "World Tree Leaf": { "id": 27, "category": "Herbs", "nutrientCost": 30000, "baseCost": 2500, "cauldronCost": 2500, "paradoxTime": 0.6, "tier": 8 },
        "World Tree Core": { "id": 28, "category": "Herbs", "nutrientCost": 3000000, "baseCost": 250000, "cauldronCost": 250000, "paradoxTime": 0.006, "tier": 8 },
        
        // --- 4. FUELS ---
        "Plank": { "id": 101, "category": "Fuel", "heat": 20, "maxStack": 600, "baseCost": 1, "cauldronCost": 1, "cauldronMulti": 1, "cauldronTarget": 0.1, "tier": 1 },
        "Charcoal": { "id": 403, "category": "Fuel", "heat": 40, "baseCost": 2, "cauldronCost": 2, "cauldronMulti": 1, "cauldronTarget": 2, "tier": 3 },
        "Charcoal Powder": { "id": 404, "category": "Fuel", "heat": 48, "baseCost": 2, "cauldronCost": 2.5, "tier": 3 },
        "Coke": { "id": 503, "category": "Fuel", "heat": 600, "baseCost": 30, "cauldronCost": 29, "cauldronMulti": 1, "cauldronTarget": 30, "tier": 5 },
        "Coke Powder": { "id": 504, "category": "Fuel", "heat": 660, "baseCost": 30, "cauldronCost": 31, "tier": 5 },
        "Coal": { "id": 604, "category": "Fuel", "heat": 540, "baseCost": 40, "cauldronCost": 40, "cauldronMulti": 1, "cauldronTarget": 40, "tier": 5 },
        "Black Powder": { "id": 614, "category": "Fuel", "heat": 6000, "sellPrice": 660, "baseCost": 300, "cauldronCost": 300, "cauldronMulti": 1, "cauldronTarget": 300, "tier": 6 },

        // --- 5. FERTILIZERS ---
        "Basic Fertilizer": { "id": 416, "category": "Fertilizer", "nutrientValue": 144, "maxFertility": 12, "baseCost": 10, "cauldronCost": 10, "tier": 4 },
        "Advanced Fertilizer": { "id": 511, "category": "Fertilizer", "nutrientValue": 720, "maxFertility": 144, "baseCost": 56, "cauldronCost": 56, "tier": 5 },

        // --- 6. POTIONS ---
        "Healing Potion": { "id": 306, "category": "Potion", "sellPrice": 85, "baseCost": 30, "cauldronCost": 30, "tier": 3 },
        "Vitality Potion": { "id": 415, "category": "Potion", "sellPrice": 330, "baseCost": 120, "cauldronCost": 125, "tier": 4 },
        "Transformation Potion": { "id": 508, "category": "Potion", "sellPrice": 620, "baseCost": 240, "cauldronCost": 240, "tier": 5 },
        "Growth Potion": { "id": 615, "category": "Potion", "sellPrice": 1224, "nutrientValue": 6480, "maxFertility": 2160, "baseCost": 500, "cauldronCost": 500, "tier": 6 },
        "Blast Potion": { "id": 705, "category": "Potion", "heat": 24000, "sellPrice": 2557, "baseCost": 1197, "cauldronCost": 1197, "tier": 7 },
        "Panacea Potion": { "id": 816, "category": "Potion", "nutrientValue": 200000, "maxFertility": 20000, "heat": 320000, "sellPrice": 30000, "baseCost": 15288.12, "cauldronCost": 15288.12, "tier": 8 },

        // --- 7. SOLIDS ---        
        "Stone": { "id": 201, "category": "Solid", "maxStack": 600, "cauldronCost": 4, "cauldronMulti": 1, "cauldronTarget": 4, "tier": 2 },
        "Iron Ingot": { "id": 301, "category": "Solid", "maxStack": 200, "cauldronCost": 15, "tier": 3 },
        "Quicklime": { "id": 401, "category": "Solid", "cauldronCost": 6, "cauldronMulti": 1, "cauldronTarget": 6, "tier": 3 },
        "Clay": { "id": 406, "category": "Solid", "maxStack": 200, "cauldronCost": 21, "cauldronMulti": 1, "cauldronTarget": 20, "tier": 4 },
        "Brick": { "id": 408, "category": "Misc", "maxStack": 200, "cauldronCost": 25, "tier": 4 },
        "Glass": { "id": 412, "category": "Misc", "sellPrice": 75, "maxStack": 200, "cauldronCost": 27, "tier": 4 },
        "Steel Ingot": { "id": 505, "category": "Solid", "maxStack": 200, "cauldronCost": 161, "tier": 5 },
        "Sulfur": { "id": 602, "category": "Solid", "cauldronCost": 166, "cauldronMulti": 1, "cauldronTarget": 246, "tier": 6 },
        "Bronze Ingot": { "id": 609, "category": "Solid", "maxStack": 200, "cauldronCost": 155, "tier": 6 },
        "Copper Ingot": { "id": 610, "category": "Solid", "maxStack": 200, "cauldronCost": 293, "tier": 6 },           
        "Silver Ingot": { "id": 808, "category": "Solid", "maxStack": 100, "cauldronCost": 4516, "tier": 8 },
        "Gold Ingot": { "id": 905, "category": "Solid", "maxStack": 100, "cauldronCost": 88181.6, "tier": 9 },


        // --- Crystal ---
        "Crude Shard": { "id": 627, "category": "Crystal", "baseCost": 512, "cauldronCost": 272, "cauldronMulti": 1, "cauldronTarget": 512, "tier": 6 },
        "Broken Shard": { "id": 628, "category": "Crystal", "baseCost": 1024, "cauldronCost": 824, "cauldronMulti": 1, "cauldronTarget": 1024, "tier": 6 },
        "Dull Shard": { "id": 629, "category": "Crystal", "baseCost": 2048, "cauldronCost": 1548, "cauldronMulti": 1, "cauldronTarget": 2048, "tier": 6 },
        "Shattered Crystal": { "id": 630, "category": "Crystal", "baseCost": 4096, "cauldronCost": 3496, "cauldronMulti": 1, "cauldronTarget": 4096, "tier": 6 },
        "Crude Crystal": { "id": 631, "category": "Crystal", "baseCost": 8192, "cauldronCost": 6692, "cauldronMulti": 1, "cauldronTarget": 8192, "tier": 6 },
        "Polished Crystal": { "id": 632, "category": "Crystal", "baseCost": 16384, "cauldronCost": 14384, "cauldronMulti": 1, "cauldronTarget": 16384, "tier": 6 },
        "Adamant": { "id": 633, "category": "Crystal", "baseCost": 32768, "cauldronCost": 30768, "cauldronMulti": 1, "cauldronTarget": 32768, "tier": 6 },
        "Diamond": { "id": 634, "category": "Crystal", "baseCost": 65536, "sellPrice": 100000, "cauldronCost": 65536, "cauldronMulti": 1, "cauldronTarget": 65536, "tier": 6 },
        "Perfect Diamond": { "id": 635, "category": "Crystal", "baseCost": 131072, "cauldronCost": 131072, "cauldronMulti": 1, "cauldronTarget": 131072, "tier": 6 },

        // --- 9. COMPONENTS ---
        "Linen Thread": { "id": 205, "category": "Component", "maxStack": 200, "cauldronCost": 9, "tier": 2 },
        "Linen Rope": { "id": 206, "category": "Component", "sellPrice": 36, "maxStack": 200, "cauldronCost": 13, "tier": 2 },
        "Large Wooden Gear": { "id": 102, "category": "Component", "sellPrice": 5, "maxStack": 100, "cauldronCost": 1.5, "tier": 1 },
        "Small Wooden Gear": { "id": 207, "category": "Component", "sellPrice": 8, "maxStack": 200, "cauldronCost": 0.3333333333, "tier": 2 },
        "Iron Nails": { "id": 302, "category": "Component", "sellPrice": 16, "maxStack": 600, "cauldronCost": 5, "tier": 3 },
        "Wooden Pulley": { "id": 405, "category": "Component", "sellPrice": 44, "maxStack": 50, "cauldronCost": 14, "tier": 4 },
        "Steel Gear": { "id": 506, "category": "Component", "sellPrice": 450, "maxStack": 200, "cauldronCost": 170, "tier": 5 },
        "Copper Bearing": { "id": 612, "category": "Component", "sellPrice": 300, "maxStack": 200, "cauldronCost": 136.5, "tier": 6 },
        "Bronze Rivet": { "id": 613, "category": "Component", "sellPrice": 120, "maxStack": 200, "cauldronCost": 51, "tier": 6 },

        // --- 10. LIQUIDS ---
        "Linseed Oil": { "id": 409, "category": "Liquid", "liquid": true, "cauldronCost": 0.04, "tier": 4 },
        "Fruit Wine": { "id": 410, "category": "Liquid", "liquid": true, "cauldronCost": 1.2, "tier": 4 },
        "Limewater": { "id": 411, "category": "Liquid", "liquid": true, "cauldronCost": 0.2, "tier": 4 },
        "Brine": { "id": 606, "category": "Liquid", "liquid": true, "cauldronCost": 3.25, "tier": 6 },
        "Lavender Essential Oil": { "id": 701, "category": "Liquid", "liquid": true, "cauldronCost": 37.88, "tier": 7 },
        "Brandy": { "id": 702, "category": "Liquid", "liquid": true, "cauldronCost": 7.425, "tier": 7 },
        "Sulfuric Acid": { "id": 703, "category": "Liquid", "liquid": true, "cauldronCost": 23.13, "tier": 7 },
        "Quicksilver": { "id": 811, "category": "Liquid", "liquid": true, "cauldronCost": 407.44, "tier": 8 },
        "Aqua Vitae": { "id": 812, "category": "Liquid", "liquid": true, "cauldronCost": 459.3, "tier": 8 },
        "Fairy Tear": { "id": 911, "category": "Liquid", "liquid": true, "cauldronCost": 3060, "tier": 9 },
        "Moon Tear": { "id": 912, "category": "Liquid", "liquid": true, "cauldronCost": 96678, "tier": 9 },

        // --- MASH ---
        "Sand": { "id": 202, "category": "Mash", "cauldronCost": 4.5, "tier": 2 },
        "Flax Fiber": { "id": 204, "category": "Mash", "cauldronCost": 2.5, "tier": 2 },        
        "Plant Ash": { "id": 304, "category": "Mash", "cauldronCost": 4, "tier": 3 },
        "Sage Powder": { "id": 305, "category": "Mash", "cauldronCost": 3.5, "tier": 3 },
        "Quicklime Powder": { "id": 402, "category": "Mash", "cauldronCost": 7, "tier": 3 },
        "Clay Powder": { "id": 407, "category": "Mash", "cauldronCost": 22, "tier": 4 },
        "Soap Powder": { "id": 414, "category": "Mash", "cauldronCost": 24, "tier": 4 },
        "Yeast Powder": { "id": 507, "category": "Mash", "cauldronCost": 88, "cauldronMulti": 1, "cauldronTarget": 88, "tier": 5 },
        "Gloom Spores": { "id": 510, "category": "Mash", "cauldronCost": 220, "wholesalePrice": 360, "cauldronMulti": 1, "cauldronTarget": 280, "tier": 5 },
        "Chamomile Powder": { "id": 601, "category": "Mash", "cauldronCost": 57, "tier": 6 },
        "Sulfur Powder": { "id": 603, "category": "Mash", "cauldronCost": 200, "tier": 6 },        
        "Perfumed Soap Powder": { "id": 708, "category": "Mash", "cauldronCost": 1216.4, "tier": 8 },
        "Gentian Powder": { "id": 801, "category": "Mash", "cauldronCost": 430, "tier": 8 },        
        // temp move Volcanic Ash id from 29 to 807
        "Volcanic Ash": { "id": 807, "category": "Mash", "cauldronCost": 5404, "tier": 8 },

        // --- METAL MASH ---
        "Iron Sand": { "id": 303, "category": "Metal Mash", "cauldronCost": 15.5, "cauldronMulti": 1, "cauldronTarget": 15, "tier": 3 },
        "Impure Copper Powder": { "id": 607, "category": "Metal Mash", "cauldronCost": 150, "cauldronMulti": 1, "cauldronTarget": 180, "tier": 6 },
        "Copper Powder": { "id": 608, "category": "Metal Mash", "cauldronCost": 290, "cauldronMulti": 1, "cauldronTarget": 350, "tier": 6 },
        "Crude Silver Powder": { "id": 803, "category": "Metal Mash", "cauldronCost": 1216.0, "cauldronMulti": 1, "cauldronTarget": 1416.0, "tier": 8 },
        "Impure Silver Powder": { "id": 804, "category": "Metal Mash", "cauldronCost": 2432.0, "cauldronMulti": 1, "cauldronTarget": 3232.0, "tier": 8 },
        "Silver Powder": { "id": 805, "category": "Metal Mash", "cauldronCost": 4512.0, "cauldronMulti": 1, "cauldronTarget": 4512.0, "tier": 8 },
        "Crude Gold Dust": { "id": 901, "category": "Metal Mash", "cauldronCost": 10925.2, "cauldronMulti": 1, "cauldronTarget": 12925.2, "tier": 9 },
        "Impure Gold Dust": { "id": 902, "category": "Metal Mash", "cauldronCost": 21850.4, "cauldronMulti": 1, "cauldronTarget": 22850.4, "tier": 9 },
        "Gold Dust": { "id": 903, "category": "Metal Mash", "cauldronCost": 42836.8, "cauldronMulti": 1, "cauldronTarget": 52836.8, "tier": 9 },
        "Pure Gold Dust": { "id": 904, "category": "Metal Mash", "cauldronCost": 85673.6, "cauldronMulti": 1, "cauldronTarget": 100673.6, "tier": 9 },

        // --- 11. CATALYSTS ---		
        "Unstable Catalyst": { "id": 616, "category": "Catalyst", "charges": 180, "baseCost": 480, "cauldronCost": 740, "cauldronMulti": 1, "cauldronTarget": 740, "tier": 6 },
        "Fertile Catalyst": { "id": 706, "category": "Catalyst", "charges": 240, "nutrientValue": 24000, "maxFertility": 6000, "wholesalePrice": 3000, "baseCost": 2061.84, "cauldronCost": 4061.84, "cauldronMulti": 1, "cauldronTarget": 3561.84, "tier": 7 },
        "Resonant Catalyst": { "id": 815, "category": "Catalyst", "charges": 1500, "baseCost": 12977.44, "cauldronCost": 23977.44, "cauldronMulti": 1, "cauldronTarget": 27977.44, "tier": 8 },
        "Eternal Catalyst": { "id": 908, "category": "Catalyst", "charges": 99999, "baseCost": 1194661.6, "cauldronCost": 1194661.6, "tier": 9 },

        // --- 12. Magic ---
        "Philosopherˈs Stone": { "id": 33, "category": "Magic", "cauldronCost": 1000000, "cauldronMulti": 1, "cauldronTarget": 1000000, "tier": 9 },
        "Oblivion Essence": { "id": 25, "category": "Magic", "cauldronCost": 600, "cauldronMulti": 1, "cauldronTarget": 600, "tier": 7 },
        "Vitality Essence": { "id": 709, "category": "Magic", "cauldronCost": 900, "cauldronMulti": 1, "cauldronTarget": 900, "tier": 7 },
        "Star Dust": { "id": 909, "category": "Magic", "cauldronCost": 41490, "cauldronMulti": 1, "cauldronTarget": 81490, "tier": 9 },
        "Fairy Dust": { "id": 910, "category": "Magic", "cauldronCost": 3060, "cauldronMulti": 1, "cauldronTarget": 3760, "tier": 9 },

        // -------

        // --- 13. GOODS & CURRENCY ---
        "Copper Coin": { "id": 611, "category": "Currency", "sellPrice": 1, "baseCost": 0.9766666667, "cauldronCost": 0.6766666667, "paradoxTime": 2216.75, "tier": 6 },
        "Silver Coin": { "id": 809, "category": "Currency", "sellPrice": 1000, "baseCost": 903.2, "cauldronCost": 903.2, "paradoxTime": 1.6608, "tier": 8 },
        "Gold Coin": { "id": 906, "category": "Currency", "sellPrice": 100000, "baseCost": 85681.6, "cauldronCost": 90681.6, "paradoxTime": 0.0165, "tier": 9 },
        
        "Gloom Fungus": { "id": 509, "category": "Misc", "cauldronCost": 26, "tier": 5 },
        "Mortar": { "id": 203, "category": "Misc", "sellPrice": 48, "cauldronCost": 18, "tier": 2 },
        "Salt": { "id": 605, "category": "Misc", "sellPrice": 100, "cauldronCost": 65, "cauldronMulti": 1, "cauldronTarget": 65, "tier": 6 },
        "Linen": { "id": 307, "category": "Misc", "sellPrice": 165, "cauldronCost": 60, "tier": 3 },
        "Bandage": { "id": 308, "category": "Misc", "sellPrice": 350, "wholesalePrice": 240, "cauldronCost": 120, "tier": 3 },
        "Soap": { "id": 413, "category": "Misc", "sellPrice": 60, "cauldronCost": 23, "tier": 4 },
        "Perfumed Soap": { "id": 707, "category": "Misc", "sellPrice": 2590, "cauldronCost": 1216.4, "tier": 7 },
        "Moonlit Soap": { "id": 913, "category": "Misc", "sellPrice": 995280, "wholesalePrice": 600000, "cauldronCost": 485822.8, "tier": 9 },

        // --- 14. Jewelry ---
        "Ruby": { "id": 30, "category": "Jewelry", "sellPrice": 250000, "cauldronCost": 200000, "cauldronMulti": 1, "cauldronTarget": 200000, "tier": 9 },
        "Sapphire": { "id": 31, "category": "Jewelry", "sellPrice": 480000, "cauldronCost": 400000, "cauldronMulti": 1, "cauldronTarget": 400000, "tier": 9 },
        "Emerald": { "id": 32, "category": "Jewelry", "sellPrice": 700000, "cauldronCost": 600000, "cauldronMulti": 1, "cauldronTarget": 600000, "tier": 9 },
        "Turquoise": { "id": 501, "category": "Jewelry", "sellPrice": 290, "cauldronCost": 108, "cauldronMulti": 1, "cauldronTarget": 108, "tier": 5 },
        "Pocket Watch": { "id": 617, "category": "Jewelry", "sellPrice": 1950, "wholesalePrice": 1300, "cauldronCost": 789, "tier": 6 },
        "Malachite": { "id": 618, "category": "Jewelry", "sellPrice": 1020, "cauldronCost": 367, "cauldronMulti": 1, "cauldronTarget": 427, "tier": 6 },
        "Clockwork Bird": { "id": 621, "category": "Jewelry", "sellPrice": 5000, "cauldronCost": 2022, "tier": 6 },
        "Topaz": { "id": 704, "category": "Jewelry", "sellPrice": 2800, "cauldronCost": 1205.9, "cauldronMulti": 1, "cauldronTarget": 1705.9, "tier": 7 },
        "Obsidian": { "id": 806, "category": "Jewelry", "sellPrice": 11000, "cauldronCost": 5404.0, "cauldronMulti": 1, "cauldronTarget": 6404.0, "tier": 8 },
        "Silver Amulet": { "id": 810, "category": "Jewelry", "sellPrice": 51000, "wholesalePrice": 34000, "cauldronCost": 24656, "tier": 8 },
        "Lapis Lazuli": { "id": 813, "category": "Jewelry", "sellPrice": 32000, "maxStack": 50, "cauldronCost": 15624, "cauldronMulti": 1, "cauldronTarget": 40624, "tier": 8 },
        "Crown": { "id": 907, "category": "Jewelry", "sellPrice": 1600000, "cauldronCost": 854167.8, "tier": 9 },

        // --- 15. RELICS ---
        "Jupiter": { "id": 502, "category": "Relic", "sellPrice": 30000, "maxStack": -300, "cauldronCost": 34, "tier": 5 },
        "Saturn": { "id": 619, "category": "Relic", "sellPrice": 150000, "maxStack": -100, "cauldronCost": 714, "tier": 6 },
        "Mars": { "id": 620, "category": "Relic", "sellPrice": 280000, "maxStack": -75, "cauldronCost": 1678, "tier": 6 },
        "Venus": { "id": 710, "category": "Relic", "sellPrice": 1000000, "maxStack": -200, "cauldronCost": 2549.6, "tier": 7 },
        "Mercury": { "id": 814, "category": "Relic", "sellPrice": 5200000, "maxStack": -100, "cauldronCost": 26783.3, "tier": 8 },
        "Luna": { "id": 914, "category": "Relic", "sellPrice": 18500000, "maxStack": -75, "cauldronCost": 187482.6, "tier": 9 },
        "Sol": { "id": 1001, "category": "Relic", "sellPrice": 42000000, "maxStack": -5, "cauldronCost": 5591400.6, "tier": 9 },

        // --- 16. OTHER ---
        "Portal Sigil": { "id": 2001, "category": "Other", "buyPrice": 1500, "baseCost": 1500, "cauldronCost": 750, "paradoxTime": 2, "tier": 4 },
        "Gelatinous Gridlock": { "id": 2002, "category": "Other", "buyPrice": 100, "baseCost": 100, "cauldronCost": 100, "paradoxTime": 15, "tier": 1 },
        //"Automatic Cashier": { "id": 2003, "category": "Other", "buyPrice": 3000, "cauldronCost": 1400 }
    },
    
    "machines": {
        // --- Automated Processing ---
        "Grinder": { "buildCost": { "Plank": 8 }, "tier": 1 },
        "Enhanced Grinder": { "buildCost": { "Plank": 12, "Steel Gear": 3 }, "tier": 5 },
        "Crucible": { "heatCost": 4.0, "slotsRequired": 3, "buildCost": { "Stone": 4 }, "tier": 4 },
        "Stackable Crucible": { "heatCost": 6.0, "slotsRequired": 3, "buildCost": { "Stone": 6, "Steel Ingot": 2, "Bronze Rivet": 2 }, "tier": 6 },
        "Extractor": { "buildCost": { "Iron Ingot": 5, "Glass": 5 }, "tier": 4 },

        "Thermal Extractor": { "heatCost": 80.0,  "slotsRequired": 1, "buildCost": { "Steel Ingot": 5, "Glass": 5 }, "tier": 7 },
        "Refiner": { "buildCost": { "Plank": 8, "Steel Gear": 4 }, "tier": 6 },
        "Knowledge Altar": { "buildCost": { "Stone": 24 }, "tier": 5 },
        "Paradox Crucible": { "heatCost": 1200.0, "slotsRequired": 9, "buildCost": { "Steel Ingot": 8, "Copper Ingot": 8, "Bronze Rivet": 16 }, "tier": 7 },
        // Cauldron heatCost is depend on the recipe. Use a non-zero value as placeholder here
        "Cauldron": { "heatCost": -1,  "buildCost": { "Bronze Ingot": 20 }, "tier": 6 },
        "Advanced Cauldron": { "heatCost": -1,  "buildCost": { "Silver Ingot": 20 }, "tier": 8 },

        // --- Advanced Crafting ---
        "Processor": { "buildCost": { "Plank": 12, "Large Wooden Gear": 3 }, "tier": 2 },
        "Kiln": { "heatCost": 15.0, "slotsRequired": 6, "buildCost": { "Stone": 20, "Clay": 10 }, "tier": 4 },
        "Blender": { "buildCost": { "Iron Ingot": 8, "Glass": 8 }, "tier": 4 },
        "Assembler": { "buildCost": { "Plank": 10, "Large Wooden Gear": 5, "Small Wooden Gear": 15 }, "tier": 3 },
        "Alembic": { "heatCost": 108.0, "slotsRequired": 3, "buildCost": { "Steel Ingot": 4, "Copper Ingot": 4, "Glass": 8 }, "tier": 7 },

        "Athanor": { "heatCost": 32.0, "slotsRequired": 6, "buildCost": { "Iron Nails": 15, "Iron Ingot": 10 }, "tier": 5 },
        "Advanced Blender": { "buildCost": { "Steel Ingot": 8, "Glass": 16, "Copper Bearing": 4 }, "tier": 6 },
        "Advanced Alembic": { "heatCost": 270.0, "slotsRequired": 6, "buildCost": { "Steel Ingot": 8, "Glass": 16, "Copper Bearing": 4  }, "tier": 8 },
        "Advanced Assembler": { "buildCost": { "Steel Ingot": 12, "Steel Gear": 16, "Copper Bearing": 8 }, "tier": 6 },
        "Advanced Athanor": { "heatCost": 360.0, "slotsRequired": 9, "buildCost": { "Steel Ingot": 12, "Copper Ingot": 12 }, "tier": 8 },

        "Shaper": { "buildCost": { "Iron Ingot": 8, "Iron Nails": 16 }, "tier": 5 },
        "Advanced Shaper": { "buildCost": { "Steel Ingot": 8, "Steel Gear": 16 }, "tier": 7 },
        "Arcane Shaper": { "buildCost": { "Gold Ingot": 12, "Steel Gear": 24, "Copper Bearing": 18 }, "tier": 9 },
        "Arcane Processor": { "buildCost": { "Steel Ingot": 6, "Steel Gear": 12, "Lapis Lazuli": 2 }, "tier": 9 },

        // --- Heating ---
        "Stone Furnace": { "heatSelf": 1, "slots": 9, "isGenerator": true, "buildCost": { "Stone": 20 }, "tier": 3 }, 
        "Blast Furnace": { "heatSelf": 4, "slots": 42, "isGenerator": true, "buildCost": { "Brick": 30 }, "tier": 4 }, 
        "Steam Heating Pad": { "heatSelf": 12, "slots": 9, "isGenerator": true, "buildCost": { "Steel Ingot": 3, "Copper Ingot": 3 }, "tier": 6 }, 

        // --- Raw Material Production ---
        "Table Saw": { "buildCost": { "Plank": 5 }, "tier": 1 },
        "Stone Crusher": { "buildCost": { "Plank": 6, "Large Wooden Gear": 6 }, "tier": 2 },
        "Seed Plot": { "buildCost": { "Stone": 8 }, "tier": 2 },
        "Iron Smelter": { "heatCost": 9.0, "slotsRequired": 9, "buildCost": { "Stone": 15 }, "tier": 3 },
        "Nursery": { "fertility": true, "buildCost": { "Iron Ingot": 8, "Clay": 4 }, "tier": 4 },

        "World Tree Nursery": { "fertility": true, "buildCost": { "Iron Ingot": 100, "Clay": 100  }, "tier": 8 },
        "Purchasing Portal": { "buildCost": { "Portal Sigil": 1, "Plank": 5 }, "tier": 4 },
        "Bank Portal": { "buildCost": { "Portal Sigil": 1, "Iron Ingot": 5 }, "tier": 4 },
        "Dispatch Portal": { "buildCost": { "Portal Sigil": 1, "Iron Ingot": 5 }, "tier": 4 }
    },
    
    "recipes": [
        // --- HERBS ---
        { "id": "Flax", "machine": "Nursery", "buildCost": "Flax Seeds", "inputs": {}, "outputs": { "Flax": 1 }, "nutrientCost": 24},
        { "id": "Sage", "machine": "Nursery", "buildCost": "Sage Seeds", "inputs": {}, "outputs": { "Sage": 1 }, "nutrientCost": 36},
        { "id": "Redcurrant", "machine": "Nursery", "buildCost": "Redcurrant Seeds", "inputs": {}, "outputs": { "Redcurrant": 1 }, "nutrientCost": 144},        
        { "id": "Chamomile", "machine": "Nursery", "buildCost": "Chamomile Seeds", "inputs": {}, "outputs": { "Chamomile": 1 }, "nutrientCost": 720 },
        { "id": "Lavender", "machine": "Nursery", "buildCost": "Lavender Seeds", "inputs": {}, "outputs": { "Lavender": 1 }, "nutrientCost": 2160},
        { "id": "Gentian_Dual", "machine": "Nursery", "buildCost": "Gentian Seeds", "inputs": {}, "outputs": { "Gentian": 1, "Gentian Nectar": 1 }, "nutrientCost": 12000, "sharedOutputs": 2},
        { "id": "World Tree_Dual", "machine": "World Tree Nursery", "buildCost": "World Tree Seed", "inputs": {}, "outputs": { "World Tree Leaf": 99, "World Tree Core":1 }, "baseTime": 300.0, "nutrientCost": 5970000},

        // --- CURRENCY ---
        { "id": "Bank_Copper", "machine": "Bank Portal", "inputs": {}, "outputs": { "Copper Coin": 50 }, "baseTime": 1.0 },
        { "id": "Bank_Silver", "machine": "Bank Portal", "inputs": {}, "outputs": { "Silver Coin": 50 }, "baseTime": 1.0 },
        { "id": "Bank_Gold", "machine": "Bank Portal", "inputs": {}, "outputs": { "Gold Coin": 50 }, "baseTime": 1.0 },

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
        { "id": "Clockwork Bird", "machine": "Advanced Assembler", "inputs": { "Steel Ingot": 6, "Steel Gear": 2, "Malachite": 2 }, "outputs": { "Clockwork Bird": 1 }, "baseTime": 12.0 },
        { "id": "Moonlit Soap", "machine": "Advanced Blender", "inputs": { "Perfumed Soap Powder": 2, "Moon Tear": 5 }, "outputs": { "Moonlit Soap": 1 }, "baseTime": 10.0 },
        { "id": "Crown", "machine": "Advanced Assembler", "inputs": { "Gold Ingot": 3, "Ruby": 1, "Sapphire": 1 }, "outputs": { "Crown": 1 }, "baseTime": 15.0 },

        // --- FUEL & ENERGY ---
        { "id": "Charcoal", "machine": "Crucible", "inputs": { "Plank": 1 }, "outputs": { "Charcoal": 1 }, "baseTime": 4.0 },
        { "id": "Charcoal Powder", "machine": "Grinder", "inputs": { "Charcoal": 1 }, "outputs": { "Charcoal Powder": 1 }, "baseTime": 4.0 },
        { "id": "Coal", "machine": "Stone Crusher", "inputs": { "Coal Ore": 1 }, "outputs": { "Coal": 120 }, "baseTime": 360.0 },
        { 
            "id": "Coke_Alt", "machine": "Crucible", 
            "inputs": { "Coal": 1 }, "outputs": { "Coke": 1 }, 
            "baseTime": 6.0 
        },
        // --- COKE BATCH (50%) 2 RUNS---
        { 
            "id": "Coke", "machine": "Athanor", 
            "inputs": { "Charcoal Powder": 12 }, 
            "outputs": { "Coke": 1, "Charcoal": 2 }, 
            "baseTime": 6.0 
        },
        // --- COKE BATCH (50%) 8 RUNS ---
        { 
            "id": "Coke Advanced Athanor", "machine": "Advanced Athanor", "ChargeCost": 8,
            "inputs": { "Charcoal Powder": 48 }, 
            "outputs": { "Coke": 4, "Charcoal": 8 }, 
            "unstableOutputs": { "Coke": 6, "Charcoal": 4 },
            "resonantOutputs": { "Coke": 8, "Charcoal": 16 },
            "baseTime": 24.0 
        },
        { "id": "Coke Powder", "machine": "Grinder", "inputs": { "Coke": 1 }, "outputs": { "Coke Powder": 1 }, "baseTime": 12.0 },
        
        // --- IRON / STEEL / SULFUR ---
        { "id": "Iron Ingot", "machine": "Iron Smelter", "inputs": { "Iron Ore": 1 }, "outputs": { "Iron Ingot": 100 }, "baseTime": 600.0 },
        { "id": "Iron Ingot 2", "machine": "Crucible", "inputs": { "Iron Sand": 1 }, "outputs": { "Iron Ingot": 1 }, "baseTime": 6.0 },
        { "id": "Iron Sand", "machine": "Grinder", "inputs": { "Iron Ingot": 1 }, "outputs": { "Iron Sand": 1 }, "baseTime": 30.0 },
        // --- STEEL BATCH (25%) 4 RUNS ---
        {
            "id": "Steel Ingot", "machine": "Athanor",
            "inputs": { "Iron Ingot": 4, "Coke Powder": 4 }, 
            "outputs": { "Steel Ingot": 1, "Iron Ingot": 3 },
            "baseTime": 16.0
        },
        {
            "id": "Steel Ingot Advanced Athanor", "machine": "Advanced Athanor", "ChargeCost": 16,
            "inputs": { "Iron Ingot": 4, "Coke Powder": 4 }, 
            "outputs": { "Steel Ingot": 1, "Iron Ingot": 3 },
            "unstableOutputs": { "Steel Ingot": 2, "Iron Ingot": 2 },
            "resonantOutputs": { "Steel Ingot": 4, "Iron Ingot": 4 },
            "baseTime": 16.0
        },
        { "id": "Sulfur", "machine": "Iron Smelter", "inputs": { "Pyrite Ore": 1 }, "outputs": { "Sulfur": 40, "Iron Ingot": 120 }, "baseTime": 960.0 },
        { "id": "Sulfur Powder", "machine": "Grinder", "inputs": { "Sulfur": 1 }, "outputs": { "Sulfur Powder": 1 }, "baseTime": 6.0 },
        { "id": "Black Powder", "machine": "Advanced Blender", "inputs": { "Sulfur Powder": 1, "Charcoal Powder": 12, "Limewater": 150 }, "outputs": { "Black Powder": 1 }, "baseTime": 12.0 },

        // --- COPPER / BRONZE ---
        // --- COPPER POWDER BATCH (50%) 2 RUNS ---
        {
            "id": "Copper Powder", "machine": "Athanor",
            "inputs": { "Iron Sand": 12, "Soap Powder": 12 }, 
            "outputs": { "Copper Powder": 1, "Impure Copper Powder": 1 },
            "baseTime": 12.0
        },
        {
            "id": "Copper Powder Advanced Athanor", "machine": "Advanced Athanor", "ChargeCost": 36,
            "inputs": { "Iron Sand": 12, "Soap Powder": 12 }, 
            "outputs": { "Copper Powder": 1, "Impure Copper Powder": 1 },
            "unstableOutputs": { "Impure Copper Powder": 2 },
            "resonantOutputs": { "Copper Powder": 2, "Impure Copper Powder": 2 },
            "baseTime": 12.0
        },
        { "id": "Copper Powder 2", "machine": "Grinder", "inputs": { "Copper Ingot": 1 }, "outputs": { "Copper Powder": 1 }, "baseTime": 12.0 },
        { "id": "Copper Ingot", "machine": "Crucible", "inputs": { "Copper Powder": 1 }, "outputs": { "Copper Ingot": 1 }, "baseTime": 12.0 },
        { "id": "Bronze Ingot", "machine": "Crucible", "inputs": { "Impure Copper Powder": 1 }, "outputs": { "Bronze Ingot": 1 }, "baseTime": 12.0 },
        { "id": "Copper Coin", "machine": "Processor", "inputs": { "Copper Ingot": 1 }, "outputs": { "Copper Coin": 300 }, "baseTime": 12.0 },

        // --- SILVER ---
        { "id": "Impure Silver Powder", "machine": "Refiner", "inputs": { "Crude Silver Powder": 2 }, "outputs": { "Impure Silver Powder": 1 }, "baseTime": 8.0 },
        // --- SILVER POWDER BATCH (20%) 10 RUNS ---
        { 
            "id": "Silver Powder", "machine": "Advanced Athanor", "ChargeCost": 1500,
            "inputs": { "Copper Powder": 40, "Black Powder": 20 }, 
            "outputs": { "Silver Powder": 2, "Crude Silver Powder": 8 }, 
            "unstableOutputs": { "Silver Powder": 5, "Crude Silver Powder": 5 },
            "resonantOutputs": { "Silver Powder": 10, "Crude Silver Powder": 10 },
            "baseTime": 64.0,
        },
        { "id": "Silver Ingot", "machine": "Crucible", "inputs": { "Silver Powder": 1 }, "outputs": { "Silver Ingot": 1 }, "baseTime": 16.0 },
        { "id": "Silver Coin", "machine": "Processor", "inputs": { "Silver Ingot": 1 }, "outputs": { "Silver Coin": 5 }, "baseTime": 16.0 },
        { "id": "Silver Powder 2", "machine": "Grinder", "inputs": { "Silver Ingot": 1 }, "outputs": { "Silver Powder": 1 }, "baseTime": 16.0 },

        // --- GOLD ---
        { "id": "Impure Gold Dust", "machine": "Refiner", "inputs": { "Crude Gold Dust": 2 }, "outputs": { "Impure Gold Dust": 1 }, "baseTime": 10.0 },

        // --- GOLD DUST BATCH (10%) 10 RUNS ---
        { 
            "id": "Gold Dust", "machine": "Advanced Athanor", "ChargeCost": 10000,
            "inputs": { "Silver Powder": 10, "Volcanic Ash": 10, "Quicksilver": 180 },
            "outputs": { "Gold Dust": 1, "Impure Gold Dust": 3, "Crude Gold Dust": 6 },
            "unstableOutputs": { "Gold Dust": 2, "Impure Gold Dust": 8 },
            "resonantOutputs": { "Gold Dust": 10, "Impure Gold Dust": 10, "Crude Gold Dust": 10 },
            "baseTime": 80.0 
        },
        { "id": "Pure Gold Dust", "machine": "Refiner", "inputs": { "Gold Dust": 2 }, "outputs": { "Pure Gold Dust": 1 }, "baseTime": 10.0 },
        { "id": "Pure Gold Dust 2", "machine": "Grinder", "inputs": { "Gold Ingot": 1 }, "outputs": { "Pure Gold Dust": 1 }, "baseTime": 40.0 },
        { "id": "Gold Ingot", "machine": "Crucible", "inputs": { "Pure Gold Dust": 1 }, "outputs": { "Gold Ingot": 1 }, "baseTime": 40.0 },
        { "id": "Gold Coin", "machine": "Processor", "inputs": { "Gold Ingot": 1 }, "outputs": { "Gold Coin": 1 }, "baseTime": 40.0 },

        // --- SALT BATCH (33%) 3 RUNS ---
        { "id": "Salt_Rock", "machine": "Stone Crusher", "inputs": { "Rock Salt": 1 }, "outputs": { "Salt": 100, "Sand": 100 }, "baseTime": 600.0 },
        { 
          "id": "Salt", "machine": "Athanor",
          "inputs": { "Charcoal Powder": 6, "Quicklime Powder": 12 },
          "outputs": { "Salt": 1, "Sand": 12 },
          "baseTime": 18.0
        },
        { 
          "id": "Salt Advanced Athanor", "machine": "Advanced Athanor", "ChargeCost": 6,
          "inputs": { "Charcoal Powder": 6, "Quicklime Powder": 12 },
          "outputs": { "Salt": 1, "Sand": 12 },
          "unstableOutputs": { "Salt": 2, "Sand": 6 },
          "resonantOutputs": { "Salt": 3, "Sand": 18 },
          "baseTime": 18.0
        },

        // --- LIQUIDS ---
        { "id": "Brine", "machine": "Extractor", "inputs": { "Salt": 1 }, "outputs": { "Brine": 20 }, "baseTime": 4.0 },
        { "id": "Lavender Essential Oil", "machine": "Alembic", "inputs": { "Lavender": 3, "Linseed Oil": 300 }, "outputs": { "Lavender Essential Oil": 15 }, "baseTime": 3.0 },
        { "id": "Brandy", "machine": "Alembic", "inputs": { "Coke Powder": 5, "Fruit Wine": 100 }, "outputs": { "Brandy": 40 }, "baseTime": 5.0 },
        { "id": "Sulfuric Acid", "machine": "Alembic", "inputs": { "Sulfur Powder": 1, "Brine": 60 }, "outputs": { "Sulfuric Acid": 20 }, "baseTime": 4.0 },
        { "id": "Quicksilver", "machine": "Advanced Alembic", "inputs": { "Crude Silver Powder": 1, "Vitality Essence": 1, "Sulfuric Acid": 80 }, "outputs": { "Quicksilver": 10 }, "baseTime": 8.0 },
        { "id": "Aqua Vitae", "machine": "Advanced Alembic", "inputs": { "Gentian Nectar": 1, "World Tree Leaf": 1, "Brandy": 200 }, "outputs": { "Aqua Vitae": 10 }, "baseTime": 8.0 },
        { "id": "Fairy Tear", "machine": "Extractor", "inputs": { "Fairy Dust": 1 }, "outputs": { "Fairy Tear": 1 }, "baseTime": 4.0 },
        { "id": "Moon Tear", "machine": "Advanced Alembic", "inputs": { "Star Dust": 1, "Fairy Tear": 18 }, "outputs": { "Moon Tear": 1 }, "baseTime": 8.0 },

        // --- POTIONS ---
        { "id": "Healing Potion", "machine": "Assembler", "inputs": { "Sage Powder": 6, "Flax Fiber": 6 }, "outputs": { "Healing Potion": 1 }, "baseTime": 6.0 },
        { "id": "Vitality Potion", "machine": "Blender", "inputs": { "Quicklime Powder": 4, "Fruit Wine": 80 }, "outputs": { "Vitality Potion": 1 }, "baseTime": 8.0 },
        { "id": "Transformation Potion", "machine": "Assembler", "inputs": { "Coke Powder": 2, "Gloom Spores": 1 }, "outputs": { "Transformation Potion": 1 }, "baseTime": 6.0 },
        { "id": "Growth Potion", "machine": "Advanced Blender", "inputs": { "Chamomile Powder": 2, "Clay Powder": 6, "Brine": 80 }, "outputs": { "Growth Potion": 1 }, "baseTime": 6.0 },
        { "id": "Blast Potion", "machine": "Advanced Blender", "inputs": { "Oblivion Essence": 1, "Black Powder": 1, "Brandy": 40 }, "outputs": { "Blast Potion": 1 }, "baseTime": 6.0 },
        { "id": "Panacea Potion", "machine": "Advanced Blender", "inputs": { "Fertile Catalyst": 3, "Blast Potion": 3, "Aqua Vitae": 12 }, "outputs": { "Panacea Potion": 1 }, "baseTime": 6.0 },

        // --- ESSENCES & CATALYSTS ---
        { "id": "Basic Fertilizer", "machine": "Assembler", "inputs": { "Plant Ash": 1, "Quicklime Powder": 1 }, "outputs": { "Basic Fertilizer": 1 }, "baseTime": 4.0 },
        { "id": "Advanced Fertilizer", "machine": "Assembler", "inputs": { "Basic Fertilizer": 1, "Gloom Fungus": 1 }, "outputs": { "Advanced Fertilizer": 1 }, "baseTime": 4.0 },
        { "id": "Fertile Catalyst", "machine": "Advanced Blender", "inputs": { "Unstable Catalyst": 1, "Vitality Essence": 1, "Lavender Essential Oil": 18 }, "outputs": { "Fertile Catalyst": 1 }, "baseTime": 8.0 },
        { "id": "Unstable Catalyst", "machine": "Assembler", "inputs": { "Chamomile Powder": 2, "Gloom Spores": 2 }, "outputs": { "Unstable Catalyst": 1 }, "baseTime": 4.0 },
        { "id": "Resonant Catalyst", "machine": "Advanced Blender", "inputs": { "Fertile Catalyst": 1, "Volcanic Ash": 1, "Aqua Vitae": 12 }, "outputs": { "Resonant Catalyst": 1 }, "baseTime": 8.0 },
        { "id": "Eternal Catalyst", "machine": "Arcane Processor", "inputs": { "Resonant Catalyst": 15, "Philosopherˈs Stone": 1 }, "outputs": { "Eternal Catalyst": 1 }, "baseTime": 60.0 },
        // Note: ˈ is U+02C8, not ASCII 39
        { "id": "Philosopherˈs Stone", "machine": "Cauldron", "inputs": { "Ruby": 1, "Sapphire": 1, "Emerald": 1 }, "outputs": { "Philosopherˈs Stone": 1 }, "baseTime": 60.0, "heatCost": 10000.0 },

        // --- Paradox Crucible ---
        { "id": "Oblivion Essence (Silver Coin x2)", "machine": "Paradox Crucible", "inputs": { "Silver Coin": 2 }, "outputs": { "Oblivion Essence": 1 }, "baseTime": 0.79 },
        // 自訂輸入配方：inputs 為空，實際內容由 DB.settings.recipeModifiers[id].customInput 動態決定
        { "id": "Oblivion Essence (Custom)", "machine": "Paradox Crucible", "inputs": {}, "outputs": { "Oblivion Essence": 1 }, "baseTime": 1, "customInputSlot": true },
        { "id": "Vitality Essence", "machine": "Paradox Crucible", "inputs": { "Oblivion Essence": 1 }, "outputs": { "Vitality Essence": 1 }, "baseTime": 5.0 },

        // --- SHARDS & GEMS CHAIN ---
        // Sand refine 7 times to become Crude Shard. Assume 127 machines to skip the Refined Sand steps, time = 127 * 3
        { "id": "Refined Sand", "machine": "Refiner", "inputs": { "Sand": 128 }, outputs: { "Crude Shard": 1 }, "baseTime": 381 },
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
        // --- MALACHITE BATCH (50%) 2 RUNS ---
        { 
            "id": "Malachite_Alt", "machine": "Advanced Athanor", "ChargeCost": 72,
            "inputs": { "Impure Copper Powder": 4, "Clay Powder": 12 }, 
            "outputs": { "Malachite": 1, "Crude Shard": 1 },
            "unstableOutputs": { "Malachite": 2 },
            "resonantOutputs": { "Malachite": 2, "Crude Shard": 2 },
            "baseTime": 24.0
        },
        { "id": "Topaz", "machine": "Blender", "inputs": { "Crude Shard": 1, "Sulfuric Acid": 30 }, "outputs": { "Topaz": 1 }, "baseTime": 12.0 },
        // --- LAPIS BATCH (33%) 6 RUNS ---
        { 
            "id": "Lapis Lazuli", "machine": "Advanced Athanor", "ChargeCost": 3300,
            "inputs": { "Impure Silver Powder": 6, "Shattered Crystal": 6 }, 
            "outputs": { "Lapis Lazuli": 2, "Shattered Crystal": 2, "Crude Shard": 2 },
            "unstableOutputs": { "Lapis Lazuli": 3, "Shattered Crystal": 3 },
            "resonantOutputs": { "Lapis Lazuli": 6, "Shattered Crystal": 6, "Crude Shard": 6 },
            "baseTime": 72.0
        },
        // --- OBSIDIAN BATCH (50%) 2 RUNS ---
        { 
            "id": "Obsidian", "machine": "Advanced Athanor", "ChargeCost": 840,
            "inputs": { "Oblivion Essence": 4, "Shattered Crystal": 2 }, 
            "outputs": { "Obsidian": 1, "Volcanic Ash": 1 },
            "unstableOutputs": { "Volcanic Ash": 2 },
            "resonantOutputs": { "Obsidian": 2, "Volcanic Ash": 2 },
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
            "baseTime": 3000.0 
        },

        // --- RELICS ---
        { "id": "Jupiter", "machine": "Shaper", "inputs": { "Plank": 1200, "Small Wooden Gear": 1800, "Wooden Pulley": 600 }, "outputs": { "Jupiter": 1 }, "baseTime": 600.0 },
        { "id": "Saturn", "machine": "Shaper", "inputs": { "Salt": 600, "Brick": 600, "Glass": 600 }, "outputs": { "Saturn": 1 }, "baseTime": 300.0 },
        { "id": "Mars", "machine": "Shaper", "inputs": { "Iron Nails": 600, "Steel Gear": 300, "Bronze Rivet": 600, "Copper Bearing": 300 }, "outputs": { "Mars": 1 }, "baseTime": 300.0 },
        { "id": "Venus", "machine": "Advanced Shaper", "inputs": { "Healing Potion": 200, "Vitality Potion": 200, "Transformation Potion": 200, "Growth Potion": 200, "Blast Potion": 200, "Sulfuric Acid": 4000 }, "outputs": { "Venus": 1 }, "baseTime": 1200.0 },
        { "id": "Star Dust", "machine": "Arcane Processor", "inputs": { "Jupiter": 1, "Saturn": 1, "Mars": 1 }, "outputs": { "Star Dust": 5 }, "baseTime": 300.0 },
        { "id": "Fairy Dust", "machine": "Arcane Processor", "inputs": { "Chamomile Powder": 1, "Gentian Powder": 1, "World Tree Leaf": 1 }, "outputs": { "Fairy Dust": 1 }, "baseTime": 4.0 },
        { "id": "Luna", "machine": "Advanced Shaper", "inputs": { "Steel Ingot": 75, "Bronze Ingot": 75, "Copper Ingot": 75, "Silver Ingot": 75, "Gold Ingot": 75, "Moon Tear": 75 }, "outputs": { "Luna": 1 }, "baseTime": 600.0 },
        { "id": "Mercury", "machine": "Advanced Shaper", "inputs": { "Turquoise": 100, "Malachite": 100, "Topaz": 100, "Obsidian": 100, "Lapis Lazuli": 100, "Quicksilver": 1000 }, "outputs": { "Mercury": 1 }, "baseTime": 600.0 },
        { "id": "Sol", "machine": "Arcane Shaper", "inputs": { "Jupiter": 1, "Saturn": 1, "Mars": 1, "Venus": 1, "Mercury": 1, "Luna": 1, "Perfect Diamond": 25, "Eternal Catalyst": 5, "World Tree Core": 5 }, "outputs": { "Sol": 1 }, "baseTime": 300.0 },

        // --- 15. ALTERNATE RECIPES ---
        { 
            "id": "VolcanicAsh_Alt", "machine": "Grinder", 
            "inputs": { "Obsidian": 1 }, "outputs": { "Volcanic Ash": 1 }, 
            "baseTime": 24.0 
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
            "id": "CopperIngot_Alt", "machine": "Kiln", 
            "inputs": { "Copper Coin": 400 }, "outputs": { "Copper Ingot": 1 }, 
            "baseTime": 12.0 
        },
        { 
            "id": "SilverIngot_Alt", "machine": "Kiln", 
            "inputs": { "Silver Coin": 6 }, "outputs": { "Silver Ingot": 1 }, 
            "baseTime": 16.0 
        },
        { 
            "id": "GoldIngot_Alt", "machine": "Kiln", 
            "inputs": { "Gold Coin": 3 }, "outputs": { "Gold Ingot": 2 }, 
            "baseTime": 40.0 
        },

        // --- ENHANCED GRINDER ALTERNATE RECIPES ---
        // (Base times are halved to represent 2x Machine Speed)
        { "id": "Sand (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Stone": 1 }, "outputs": { "Sand": 1 }, "baseTime": 6.0 },
        { "id": "Quicklime Powder (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Quicklime": 1 }, "outputs": { "Quicklime Powder": 1 }, "baseTime": 4.5 },
        { "id": "Clay Powder (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Clay": 1 }, "outputs": { "Clay Powder": 1 }, "baseTime": 2.0 },
        { "id": "Flax Fiber (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Flax": 1 }, "outputs": { "Flax Fiber": 1 }, "baseTime": 1.5 },
        { "id": "Sage Powder (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Sage": 1 }, "outputs": { "Sage Powder": 1 }, "baseTime": 1.5 },
        { "id": "Chamomile Powder (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Chamomile": 1 }, "outputs": { "Chamomile Powder": 1 }, "baseTime": 1.5 },
        { "id": "Gentian Powder (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Gentian": 1 }, "outputs": { "Gentian Powder": 1 }, "baseTime": 1.5 },
        { "id": "Soap Powder (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Soap": 1 }, "outputs": { "Soap Powder": 1 }, "baseTime": 3.0 },
        { "id": "Perfumed Soap Powder (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Perfumed Soap": 1 }, "outputs": { "Perfumed Soap Powder": 1 }, "baseTime": 4.0 },
        { "id": "Large Wooden Gear (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Plank": 1 }, "outputs": { "Large Wooden Gear": 1 }, "baseTime": 3.0 },
        { "id": "Charcoal Powder (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Charcoal": 1 }, "outputs": { "Charcoal Powder": 1 }, "baseTime": 2.0 },
        { "id": "Coke Powder (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Coke": 1 }, "outputs": { "Coke Powder": 1 }, "baseTime": 6.0 },
        { "id": "Iron Sand (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Iron Ingot": 1 }, "outputs": { "Iron Sand": 1 }, "baseTime": 15.0 },
        { "id": "Sulfur Powder (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Sulfur": 1 }, "outputs": { "Sulfur Powder": 1 }, "baseTime": 3.0 },
        { "id": "Copper Powder 2 (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Copper Ingot": 1 }, "outputs": { "Copper Powder": 1 }, "baseTime": 6.0 },
        { "id": "Silver Powder 2 (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Silver Ingot": 1 }, "outputs": { "Silver Powder": 1 }, "baseTime": 8.0 },
        { "id": "Pure Gold Dust 2 (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Gold Ingot": 1 }, "outputs": { "Pure Gold Dust": 1 }, "baseTime": 20.0 },
        { "id": "Volcanic Ash (Enhanced)", "machine": "Enhanced Grinder", "inputs": { "Obsidian": 1 }, "outputs": { "Volcanic Ash": 1 }, "baseTime": 12.0 },


        // --- THERMAL EXTRACTOR ALTERNATE RECIPES ---
        // (Production Bonus + 200% when build on height >256)
        { "id": "Linseed Oil_Thermal", "machine": "Thermal Extractor", "inputs": { "Flax": 1 }, "outputs": { "Linseed Oil": 50 }, "baseTime": 2.0 },
        { "id": "Fruit Wine_Thermal", "machine": "Thermal Extractor", "inputs": { "Redcurrant": 1 }, "outputs": { "Fruit Wine": 10 }, "baseTime": 6.0 },
        { "id": "Limewater_Thermal", "machine": "Thermal Extractor", "inputs": { "Quicklime Powder": 1 }, "outputs": { "Limewater": 30 }, "baseTime": 3.0 },
        { "id": "Brine_Thermal", "machine": "Thermal Extractor", "inputs": { "Salt": 1 }, "outputs": { "Brine": 20 }, "baseTime": 4.0 },
        { "id": "Fairy Tear_Thermal", "machine": "Thermal Extractor", "inputs": { "Fairy Dust": 1 }, "outputs": { "Fairy Tear": 1 }, "baseTime": 4.0 }
    ]
};