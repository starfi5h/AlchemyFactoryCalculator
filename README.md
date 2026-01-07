# ⚗️ 炼金工厂生产规划器 使用手册

这是一个 **《炼金工厂》(Alchemy Factory)** 的文字型生产规划工具。  
它可以帮你精确计算每分钟需要多少原料、多少台机器，以及产品利润。  
使用: [在线网页](https://starfi5h.github.io/AlchemyFactoryCalculator)。你也可以下载整个专案文件，在本地开启静态网页。  

## 🚀 核心功能
*   **动态树状图**：清晰展示从原始矿石到最终产物的每一级工序。
*   **智能负载计算**：自动考虑传送带速度上限（Belt Cap）和机器运行速度。
*   **循环物流算法**：支持“自供燃料”和“自供肥料”模式，自动平衡内部消耗。
*   **副产物管理**：一键开启副产物回收，减少原材料浪费。
*   **建设清单**：汇总所有需要的机器数量及建造所需的材料总计。

---

## 🛠️ 如何使用：基本操作步骤

### 1. 设定生产目标
*   **目标物品 (Target Item)**：在左侧输入框搜索你想生产的物品。支持中文搜索（如输入“铁锭”）。
*   **传送带负载 (Belt Load)**：选择你希望占用传送带的比例（如：1/2 带，即 50% 的运力）。
*   **生产速率**：你可以手动调整每分钟产出的具体数量。

### 2. 配置升级加成 (Upgrades)
在右侧的 **Upgrades** 面板输入你当前游戏中的升级加成：
*   **传送带速度**：直接影响每条带子的最大运力（Items/Min）。
*   **工厂速度 (Speed)**：提升机器的处理效率。
*   **炼金技术 (Alchemy)**：影响萃取机（Extractor）和蒸馏器（Alembic）的**产量**。
*   **燃料/肥料效率**：增加热值或营养值，降低生产过程中的燃料和肥料消耗。

### 3. 物流与能源设置 (Logistics)
*   **燃料来源 (Heat Source)**：选择你工厂使用的燃料类型（如：木材、煤炭、爆炸药水）。
*   **肥料来源 (Fertilizer Source)**：选择你工厂使用的肥料类型（如：高级肥料、生长药水）。
*   **自供燃料 (Self-Fuel)**：开启后，如果你的生产线产出该燃料，计算器会优先扣除工厂运行所需的燃料，只显示最终剩余的净产出。
*   **自供肥料 (Self-Fert)**：针对草药种植，开启后自动计算肥料的反哺消耗。

### 4. 优化生产线 (交互操作)
在中间生成的“生产树”中，你可以进行以下操作：
*   **切换配方**：点击机器名称旁的 **🔄 按钮**，可以切换该物品的不同合成方案（例如：用焦炭还是木炭炼钢）。
*   **副产物回收 (Recycle)**：如果某个工序产生了副产物（如生产硫磺时产生铁锭），且你的生产线其他地方需要铁锭，点击紫色按钮 **♻️可用**，计算器会自动将其填补到需求缺口中，并减少原材料的购入。
*   **查看详情**：将鼠标悬停在**机器标签**上，可以看到详细的循环时间、每台机器的具体产量和速度倍率。

---

## 📊 数据解读

### 顶部概览栏 (Summary Box)
*   **净产出 (Net Output)**：扣除自用部分后，你真正能拿去卖钱或进一步加工的数量。
*   **内部/外部负载**：显示你的工厂每秒消耗多少热值 (P/s) 和营养值 (V/s)。
*   **预计利润 (Projected Profit)**：根据买入原材料和卖出成品的差价，计算每分钟的产币量（绿色为盈利，黄色为成本）。
*   **传送带占用**：显示当前产量达到了传送带上限的百分之多少。

### 建造清单 (Construction List)
*   列出所需的所有机器。
*   点击机器名称可以展开查看**建造这些机器总共需要多少材料**（如需要多少木材、铁钉等）。

---

## 炼金锅模拟器 (Cauldron Calculator) 🧪

* 智能配方搜索:  
延迟加载 (Lazy-Loading): 仅在点开物品时渲染详细配方，极大提升大数据量下的性能。  

* 公式模拟:  
遵循公式：Total Value = (Cost1 + Cost2 + Cost3) * Ratio  
比例系数：全异 (1.0) / 两同 (0.65) / 三同 (0.5)  
基于 Cauldron Distance 最小化逻辑，自动匹配最接近的产出物品。  

* 过滤系统:  
可指定特定位置的物品。  
支持按配方类型（三相异/二同一异/三相同）过滤。  
多档位候选池（3 Profiles），方便在不同需求快速切换。  

* 收藏与同步 (Sync DB):  
点击配方旁的 ★ 一键收藏发现的优质配方。  
一键同步: 将收藏的炼金锅配方直接注入主生产计算器，自动应用线性插值计算的制作时间与热能消耗。  

* 数据便携性: 支持以 .txt 格式（物品1 + 物品2 + 物品3 = 产物）批量导入/导出配方。

---

## ⚙️ 高级功能

### 数据库编辑器 (Database Editor)
如果你发现游戏更新了数值，或者你想尝试自行改动数据：
1.  切换到 **编辑数据库(Database Editor)** 选项卡。
2.  你可以直接修改 JSON 代码中的数值（如 `baseTime` 基础时间, `heat` 热值），或加入新的配方。
3.  点击 **应用设置(Apply Changes)** 立即生效。
4.  你可以点击 **导出到文件(Export to File)** 保存你的自定义数据库。  
注意: 如果同步更新了远端的数据库版本，本地的数据库将被**覆写**。因此请做好备份  

---

## 💡 使用技巧
*   **红色提示**：如果产出速率超过了传送带上限，速率数字会变红，提醒你需要升级传送带或分流。
*   **无限循环警告**：如果你选择的配方导致了逻辑死循环（例如：A 需要 B，B 又需要 A），系统会弹出警告并阻止选择，防止计算器崩溃。
*   **保存设置**：点击**保存设置(Save Upgrades)**可以把当前的科技等级保存在浏览器缓存里，下次打开不用重填。
*   **恢复出厂设置**: 点击**恢复出厂设置(Factory Reset)**将会清空本地缓存，使用远端最新的数据。

---

## 与原版的改动 Difference from the original calculator

此计算器为原版作者JoeJoesGit分支出来的版本
有着以下的新功能
- 中文化介面和物品名称
- 支援自定义翻译, 在数据库或alchemy_i18n.js内可以修改
- 数据库更新时会在上方横幅先提醒，让玩家自行选择是否更新
- 炼金锅页面

This calculator is a fork from the version made by the original author JoeJoesGit, and includes the following new features:
- Chinese interface and item names
- Support for custom translations, which can be modified in the database editor or alchemy_i18n.js
- A banner at the top will notify players when the database is updated, allowing them to choose whether to update.

---

Original README:

# Alchemy Factory Calculator

Hi! This is a simple, browser-based calculator I built for the game **Alchemy Factory**.

I created this primarily as a personal project to solve the math problems I was running into while playing (e.g., figuring out exactly how many Crucibles I need to feed my main production line, or how much fertilizer my herb farm actually consumes). It was also a fun experiment to see how much of the coding I could do using AI assistance (specifically Google Gemini).

You can use the live version here:
**[Launch Planner](https://joejoesgit.github.io/AlchemyFactoryCalculator/)**

### Is this tool complete?
Nope!

### Is it perfect?
Nope!

### Is it always accurate?
Nope!

But it is **directionally correct**, and I've found it super helpful for planning out my factory layouts without having to constantly tear things down. I will likely update it as I notice issues or unlock new tiers in the game, for however long doing so interests me.

Feel free to fork the code and make versions of this for yourself!

---

## Features

* **Production Calculator:** Select any item (Potions, Relics, Alloys) and see exactly what machines and raw materials you need.
* **Integrated Loops:** Automatically calculates "Self-Feeding" loops (e.g., burning Charcoal to make Charcoal) and "Self-Fertilizing" loops.
* **Net Math:** Accounts for the energy/nutrients consumed by the production chain itself, so you don't under-build your support infrastructure.
* **Tiered Upgrades:** Input your current research levels (Belt Speed, Factory Efficiency, etc.) to get accurate rates.
* **Persistent Saves:** Your settings and upgrade levels are saved to your browser's local storage, so you don't have to re-enter them every time.
* **Database Editor:** Includes a built-in JSON editor if you want to manually tweak recipe values or machine speeds yourself.

## How to Run Locally

If you don't want to use the web version, you can run this on your own computer:

1.  Download the files (`index.html` and `alchemy_db.js`).
2.  Keep them in the same folder.
3.  Double-click `index.html` to open it in your browser.

That's it! No servers or installation required.
