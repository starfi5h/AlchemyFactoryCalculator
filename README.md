[EN](#alchemy-factory-calculator)/[中文](#炼金工厂计算器)


# Alchemy Factory Calculator

A browser-based production planning tool for the game **Alchemy Factory**.  
Precisely calculates raw material consumption, machine counts, heat/nutrient loads, and profitability for any production chain.

**Live version:** [https://starfi5h.github.io/AlchemyFactoryCalculator](https://starfi5h.github.io/AlchemyFactoryCalculator)

---

## ✨ Features at a Glance

| Feature | Description |
|---|---|
| 🌲 **Production Tree** | Recursive tree from raw ore to finished product, with per-node machine counts and rates |
| 🔄 **Recipe Switching** | Swap between alternative recipes per node; Advanced Athanor catalyst selection |
| ♻️ **Byproduct Recycling** | Route byproducts back into the chain to reduce imports |
| 📦 **Multi-target Mode** | Plan multiple production goals simultaneously with shared infrastructure |
| ⚗️ **Cauldron Calculator** | Brute-force cauldron combination search with favorites and DB sync |
| 📖 **Wiki** | Built-in item and machine database browser with recipe cross-references |
| 🛠️ **Database Editor** | Edit recipes, items, and translations directly in the browser |
| 💾 **Persistent Storage** | All settings, recipes, and lists auto-saved to browser `localStorage` |
| 🌐 **Bilingual UI** | Toggle between English and Simplified Chinese; fully customizable translations |
| 🔗 **Shareable URLs** | Current item and rate are reflected in the URL for easy sharing |

---

## 🚀 Getting Started

### Online
Open [https://starfi5h.github.io/AlchemyFactoryCalculator](https://starfi5h.github.io/AlchemyFactoryCalculator) in any modern browser. No installation required.

### Local
1. Download or clone this repository.
2. Open `index.html` directly in your browser.
3. No server, build step, or dependencies required.

---

## 📐 Calculator Tab

### Setting a Target

Type an item name into the search box (supports partial match) or click **☰** to open the **Item Picker**, which lets you browse by category.

**Single-target mode** (default):
- Use the **Belt Load Fraction** slider to set the target as a fraction of belt capacity (1/12 to Full).
- Or enter a precise **Rate (Items/Min)** directly.
- Toggle **Set by Machine Count** to reverse the calculation — enter a number of machines and the rate is computed for you.

**Multi-target mode** (enable via the **MULTI** toggle):
- Add as many target rows as needed; each is independent.
- Use **💾 Save List / 📂 Load List** to persist multi-target sets in the browser.
- Enable **Self-Fuel** or **Self-Fert** to automatically deduct factory consumption from the net output of the fuel/fertilizer item itself. The engine iterates to a stable equilibrium.

### Upgrades

Enter your current research levels in the **Upgrades** panel on the right:

| Field | Effect |
|---|---|
| **Logistics Efficiency** | Increases belt speed (items/min per belt) |
| **Factory Efficiency** | Multiplies all machine processing speeds |
| **Alchemy Skill** | Increases yield on Extractors, Alembics, and Thermal Extractors |
| **Fuel Efficiency** | Increases the heat value of fuel |
| **Fert Efficiency** | Increases the nutrient value of fertilizer |
| **Sales Ability** | Increases sell price used in profitability calculations |

Click **Save Upgrades** to persist settings to the browser.

### Logistics

| Setting | Description |
|---|---|
| **Heating Device** | Choose the furnace type (Stone Furnace / Blast Furnace / Steam Heating Pad); affects slot sharing and heat output |
| **Fuel Source** | The item used as fuel; also used to express total heat load as item counts |
| **Fertilizer Source** | The item used as fertilizer; used for nursery calculations |
| **Cost (/item)** | Optional per-item gold cost for fuel/fert, included in Unit Cost and profitability |
| **Show Belt Count** | Display belt usage alongside each node's rate |
| **Show Machine Max Cap** | Show maximum capacity of the ceiled machine count |
| **Show Machine Heat & Nutr** | Show per-machine heat (P/s) and nutrient (V/s) on each node |

### Reading the Production Tree

Each node shows:
- **Rate** (items/min) — click this number to open the **Scale Modal**
- **Belt count** (if enabled)
- **Machine count** (ceiled) with a tooltip showing cycle time, throughput, and speed multiplier
- **Byproducts** in purple
- **Heat** and **Nutrient** costs in their respective colors
- **Gold cost** for purchased raw materials

Rate numbers shown in **red** mean belt capacity is exceeded.

**Controls on each node:**
- **▼/▶ arrow** — collapse/expand the subtree (state is remembered)
- **🔄 button** — open the recipe selector to switch production methods
- **♻️ button** — enable byproduct recycling for that node (appears when a byproduct is consumed elsewhere in the chain)
- **☐ checkbox** — mark demand as **External Input**; the node will not be produced internally and appears in the External Inputs summary instead

Use **Recycle All / Un-recycle All** at the top of each production chain section to toggle all recyclers at once.

### Switching Recipes & Catalysts

Click **🔄** on any node to open the recipe selector:
- Choose an alternative recipe (e.g., Athanor vs. Advanced Athanor for Coke).
- For **Advanced Athanor** recipes, select one or more **catalysts** (Unstable / Fertile / Resonant / Eternal) to change output ratios or input requirements.
- If a chosen recipe would create an **infinite loop**, it is highlighted in red and cannot be applied.
- Items with a `cauldronTarget` also show an **+ Add Cauldron Recipe** button to open the [Cauldron Recipe Modal](#cauldron-recipe-modal).

### Scale Modal

Click any **rate number** to open the Scale Modal. Three linked fields update each other in real time:
- **Output Rate (/min)**
- **Belt Count** — at current belt speed
- **Machine Count**

Edit any field; the **Scaling Ratio** updates automatically. Click **Apply** to rescale the entire production tree proportionally.

### Summary Box

The bar above the tree shows four blocks:

| Block | Content |
|---|---|
| **Gross Output** | Total production rate before internal consumption |
| **Total Load** | Factory heat (P/min) and nutrient (V/min) demand, plus fuel/fert item equivalents |
| **Unit Cost** | Coin, heat, and nutrient cost per output item |
| **Unit Value** | Conversion cost vs. Retail Price and Wholesale Price, as a ratio |

### Construction List

The right panel lists every machine type and count required. Click a machine name to expand and see the **total raw materials** needed to build all machines of that type. The **Total Materials Required** section at the bottom also shows estimated **inventory slot** counts based on max stack sizes.

---

## ⚗️ Cauldron Tab

### Cauldron Types

- **Standard Cauldron (3-slot):** `T = (Cost₁ + Cost₂ + Cost₃) × Ratio`
  - All different → ×1.0, Two same → ×0.65, All same → ×0.5
  - Output is the item whose `cauldronTarget` is nearest to T.
- **Advanced Cauldron (2-slot):**
  - Same + Same → `T = Cost₁`, searches **upward** for the nearest product.
  - A + B (different) → `T = |Cost₁ − Cost₂|`, searches for the nearest product whose target value is less than the maximum of the two cauldron costs.

Switch type with the **Cauldron / Advanced Cauldron** toggle at the top.

### Candidate Pool & Profiles

The left panel lists all items eligible as cauldron ingredients (must have a `cauldronCost` and not be a liquid). Check or uncheck items to include them in the search.

Three independent **Profiles** let you store different candidate sets:
- **Profile 1** — All valid ingredients (default)
- **Profile 2** — Herb-chain items (auto-generated from herbal production chains)
- **Profile 3** — Gold/currency-based items

Use **Select All / Deselect All** to bulk-configure the active profile. The **🌿** button resets the pool to a herb-focused preset.

Sort the pool by cauldron cost with **Sort by Value** and toggle ascending/descending with **🔼/🔽**.

### Slot Filters & Search

Lock up to three **Set Input** slots to restrict the search to combinations containing a specific item at a fixed position. Use the **+/−** arrows below each slot to cycle through items in cost order.

Filter by ratio type with the checkboxes: **2 Diff, 3 Diff, 2 Same, 3 Same**.

Enable **Real-time** to recalculate automatically when anything changes, or click **Calculate All** manually for large pools.

### Results & Favorites

Results are grouped by output item and collapsed by default. Click an item to expand its compatible ingredient combinations. Items that cannot be produced by any combination appear in the **Unattainable Targets** section.

Click **★** on any recipe row to save it to **Saved Recipes** (right panel). From there:
- **Export** — save all favorites as a `.txt` file (format: `Item1 + Item2 (+ Item3) = Product`)
- **Import** — load a `.txt` file to bulk-import recipes
- **Sync DB** — inject all saved cauldron recipes into the main production database so the Calculator can include cauldron steps in full production chains

### Cauldron Recipe Modal

From the Calculator's recipe selector, items with a `cauldronTarget` show a shortcut button to open the **Cauldron Recipe Modal**. Here you can:
- Pick ingredients for each slot with the Item Picker or cycle with **+/−** arrows.
- See the computed T value, valid range `[lower, upper]`, and distance to each bound in real time.
- Green = combination hits the target; Red = it does not.
- Click **★** to save to favorites, or **Apply** (only enabled on a hit) to instantly register the recipe in the Calculator and set it as preferred.

---

## 📖 Wiki Tab

Three sub-views accessible from the top navigation:

| View | Description |
|---|---|
| **Guides** | Written documentation for all Calculator and Cauldron features |
| **Items** | Searchable icon grid of all items; click any item for stats, production recipes, and usage |
| **Machines** | Searchable machine list; click any machine for properties, build cost, and all associated recipes |

In the Items view, click **★** next to any recipe to set it as the preferred recipe for that item (synced with the Calculator).  
Click any item in a recipe row to navigate directly to its detail page.

---

## 🛠️ Database Editor Tab

Select a target from the dropdown:
- **Database** — full item, machine, and recipe data
- **Translations** — the `ALCHEMY_I18N` object controlling all UI strings and item/machine names
- **Settings** — current user preferences as JSON
- **(\*BACKUP)** variants — previous versions automatically saved before each apply

Edit the JSON directly in the textarea, then click **Apply Changes** to reload immediately. Use **Export to File** to save a copy.

> **Warning:** Applying a new Database reloads the page and overwrites the local copy. Keep backups via Export before applying.

---

## 🌐 Language & Localization

Click **🌐 EN/中文** in the header to toggle between English and Simplified Chinese.

The translation layer (`alchemy_i18n.js`) maps every item name, machine name, category, and UI string. You can customize it in the **Database Editor → Translations**. Changes persist in `localStorage`.

---

## 🔗 URL Parameters

The URL reflects the current state and can be bookmarked or shared:

| Parameter | Description | Example |
|---|---|---|
| `item` | Target item name | `?item=Steel%20Ingot` |
| `rate` | Production rate (items/min) | `&rate=60` |
| `tab` | Active tab on load | `&tab=cauldron` |
| `lang` | Force language (`en` to force English) | `&lang=en` |
| `fuel` | Override fuel source | `&fuel=Coke` |
| `fert` | Override fertilizer source | `&fert=Basic%20Fertilizer` |
| `setupgrades` | Comma-separated upgrade levels (indices 0–9) | `&setupgrades=5,0,3,2,1,1,0,0,0,0` |

> The `setupgrades` indices map to: `[0]` Logistics, `[1]` (unused), `[2]` Factory Efficiency, `[3]` Alchemy Skill, `[4]` Fuel Efficiency, `[5]` Fert Efficiency, `[6]` Sales Ability, `[7–9]` (unused).

---

## ⚙️ Reset Options

| Button | Effect |
|---|---|
| **Save Upgrades** | Persist current upgrade levels and logistics settings |
| **Reset Recipes** | Clear the local database, restoring the bundled version (backup saved automatically) |
| **Reset Translations** | Clear local translation overrides (backup saved automatically) |
| **All Data Reset** | Clear all `localStorage` entries and reload with defaults |

When the bundled database (`alchemy_db.js`) has a newer version than your local copy, an **update banner** appears at the top. You can choose to **Update Now** (overwrites local data but preserves your settings) or **Skip Update**.

---

## 🏗️ Project Structure

```
AlchemyFactoryCalculator/
├── index.html              # Main HTML shell, tab layout, modals
├── style.css               # All styles (CSS custom properties, dark theme)
├── alchemy_db.js           # Game data — items, machines, recipes
├── alchemy_i18n.js         # Translation table (EN/ZH) + t() helper
├── alchemy_constants.js    # Belt fraction definitions and helpers
├── alchemy_calc_engine.js  # Pure calculation engine (tree building, aggregation)
├── alchemy_calc.js         # Calculator UI renderer (DOM, modals, tree nodes)
├── alchemy_ui.js           # Global init, settings, combobox, item picker, URL state
├── alchemy_cauldron.js     # Cauldron simulation, favorites, sync
├── alchemy_help.js         # Wiki (guides, item browser, machine browser)
├── alchemy_recipe.js       # Recipe Explorer (currently hidden; available in code)
└── alchemy_itemvalue.js    # Item Value table (currently hidden; available in code)
```

No build tools, bundlers, or external dependencies. Pure HTML + CSS + vanilla JavaScript.

---

## 🤝 Contributing & Customization

- **Fork freely.** All data and logic are in plain text files.
- To add a new item or recipe, edit `alchemy_db.js` (or use the Database Editor in the browser).
- To add or fix a translation, edit `alchemy_i18n.js` or use Database Editor → Translations.
- The calculation engine (`alchemy_calc_engine.js`) is fully decoupled from the UI and can be used independently.

---

*This calculator is a fork of the original [AlchemyFactoryCalculator](https://joejoesgit.github.io/AlchemyFactoryCalculator/) by JoeJoesGit, with added Chinese localization, the Cauldron Calculator, the Wiki, incremental database update notifications, and various UI enhancements.*

---
---

# 炼金工厂计算器

专为游戏 **《炼金工厂》(Alchemy Factory)** 打造的浏览器端生产规划工具。  
可精确计算任意生产链的原料消耗、机器数量、热值/肥力负载与利润。

**在线使用：** [https://starfi5h.github.io/AlchemyFactoryCalculator](https://starfi5h.github.io/AlchemyFactoryCalculator)

---

## ✨ 功能一览

| 功能 | 说明 |
|---|---|
| 🌲 **生产树** | 从原矿到成品的完整递归树，每个节点显示机器数与速率 |
| 🔄 **配方切换** | 按节点切换备选配方；高级炼金炉支持催化剂选择 |
| ♻️ **副产物回收** | 将副产物导回生产链，减少外部输入 |
| 📦 **多目标模式** | 同时规划多个生产目标，共享底层基础设施 |
| ⚗️ **炼金锅计算器** | 暴力搜索炼金锅配方组合，支持收藏与同步到计算器 |
| 📖 **百科** | 内置物品与机器数据库，支持配方交叉查询 |
| 🛠️ **数据库编辑器** | 在浏览器中直接编辑配方、物品和翻译 |
| 💾 **持久化存储** | 所有设置、配方和列表自动保存至浏览器 `localStorage` |
| 🌐 **双语界面** | 中英文一键切换，翻译内容完全可自定义 |
| 🔗 **可分享链接** | 当前物品和速率反映在 URL 中，方便分享 |

---

## 🚀 快速开始

### 在线使用
在任意现代浏览器中打开 [https://starfi5h.github.io/AlchemyFactoryCalculator](https://starfi5h.github.io/AlchemyFactoryCalculator)，无需安装。

### 本地使用
1. 下载或克隆本仓库。
2. 直接用浏览器打开 `index.html`。
3. 无需服务器、构建步骤或任何依赖。

---

## 📐 计算器页面

### 设定生产目标

在搜索框中输入物品名称（支持模糊匹配），或点击 **☰** 打开**物品选择器**（可按分类浏览）。

**单目标模式**（默认）：
- 拖动**传送带负载比例**滑块，设定为传送带运力的某个分数（1/12 至 Full）。
- 或直接输入精确的**速率（个/分钟）**。
- 开启**按机器数量设置**可反向计算——输入机器台数，自动推算产出速率。

**多目标模式**（点击 **MULTI** 开关启用）：
- 可添加任意数量的目标行，每行独立设置。
- 使用 **💾 保存列表 / 📂 加载列表** 将多目标方案持久化到浏览器。
- 开启**自供燃料**或**自供肥料**后，引擎会自动迭代至稳定平衡，将工厂自身消耗从净产出中扣除。

### 升级等级

在右侧 **升级** 面板填入当前游戏中的研究等级：

| 字段 | 效果 |
|---|---|
| **物流效率** | 提升传送带速度（个/分钟） |
| **工厂效率** | 提升所有机器的处理速度 |
| **炼金技术** | 提升萃取机、蒸馏器和热能萃取机的产量 |
| **燃料效率** | 提升燃料的热值 |
| **肥料效率** | 提升肥料的营养值 |
| **销售能力** | 提升上架商品卖出价格 |

点击**保存设置**将科技等级保存。

### 物流设置

| 设置 | 说明 |
|---|---|
| **加热装置** | 选择热源类型（石炉 / 高温炉 / 蒸气加热板），影响自热消耗 |
| **燃料来源** | 用作燃料的物品；热值负载也会换算为该物品的消耗量 |
| **肥料来源** | 用作肥料的物品；育苗圃的产出速率也和所用肥料有关 |
| **成本（每个）** | 可选的燃料/肥料单价（金币），纳入单位成本和利润计算 |
| **显示传送带需求** | 在每个节点旁显示传送带占用数 |
| **显示机器产能上限** | 显示取整后机器数的最大产能 |
| **显示机器热值&肥力用量** | 在每个节点显示每台机器的热值（P/s）和肥力（V/s）消耗 |

### 解读生产树

每个节点显示：
- **速率**（个/分钟）——点击该数字打开**比例缩放窗口**
- **传送带占用数**（开启后）
- **机器数量**（取整后），悬停可查看循环时间、单台机器产量和速度倍率
- 紫色的**副产品**
- 对应颜色的**热值**和**肥力**消耗
- 购买原材料的**金币成本**

速率数字显示为**红色**表示已超过传送带上限。

**每个节点的操作：**
- **▼/▶ 箭头** — 折叠/展开子树（折叠状态会被记住）
- **🔄 按钮** — 打开配方选择器，切换生产方式
- **♻️ 按钮** — 开启该节点的副产物回收（当副产物在生产链其他地方被生产时出现）
- **☐ 复选框** — 标记为**外部输入**；该节点将不会被内部生产，汇总到"外部输入"区域

使用每条生产链顶部的**全部回收 / 全部不回收**按钮，一次性切换所有回收器状态。

### 切换配方与催化剂

点击任意节点上的 **🔄** 打开配方选择器：
- 选择备用配方（例如：用炼金炉还是高级炼金炉生产焦炭）。
- 对于**高级炼金炉**配方，可选择一个或多个**催化剂**（不稳定 / 丰饶 / 共振 / 永恒），改变输出比例或输入原料。
- 若所选配方会产生**无限循环**，将以红色高亮显示并无法应用。
- 可炼金的物品还会显示 **+ 新增炼金锅配方** 按钮，用于打开[炼金锅配方编辑窗](#炼金锅配方快捷编辑窗)。

### 比例缩放窗口

点击任意节点的**速率数字**，打开比例缩放窗口。三个字段实时联动：
- **产能（/分钟）**
- **传送带数**（按当前传送带速度换算）
- **机器数量**

修改任一字段，**缩放比**自动更新。点击**应用**后，整棵生产树按此比例等比缩放。

### 概览栏

生产树顶部显示四个数据块：

| 数据块 | 内容 |
|---|---|
| **总产出** | 扣除内部自耗前的总生产速率 |
| **总负载** | 工厂热值（P/min）和肥力（V/min）消耗，并换算为燃料/肥料物品用量 |
| **单位成本** | 每个产出物品所需的铜币、热值和肥力成本 |
| **单位价值** | 总成本与零售价/批发价的对比，显示为百分比 |

### 建造清单

右侧面板列出当前方案所需的全部机器种类及数量。点击机器名称可展开，查看建造这些机器所需的**原材料总计**。底部的**总计材料需求**区域还会根据堆叠上限估算所需的**库存格数**。

---

## ⚗️ 炼金锅页面

### 炼金锅类型

- **普通炼金锅（3格）：** `T = (Cost₁ + Cost₂ + Cost₃) × Ratio`
  - 全不同 → ×1.0，两同 → ×0.65，三同 → ×0.5
  - 输出为 `cauldronTarget` 最接近 T 值的物品。
- **高级炼金锅（2格）：**
  - 相同 + 相同 → `T = Cost₁`，**向上**匹配最近的产物。
  - A + B（不同）→ `T = |Cost₁ − Cost₂|`，匹配最近的产物(且其目标值小于两者中的最大炼金价值)。

在顶部的**炼金锅 / 高级炼金锅**切换按钮之间切换类型。

### 候选池与 Profile

左侧面板列出所有可作为炼金原料的物品（必须有 `cauldronCost` 且非液体）。勾选/取消勾选物品以决定是否纳入搜索。

三个独立的 **Profile** 可储存不同的候选集合：
- **Profile 1** — 全部有效原料（默认）
- **Profile 2** — 草药链物品（从草药生产链自动生成）
- **Profile 3** — 金币/货币基底物品

使用**全选 / 取消全选**批量配置。**🌿** 按钮将候选池重置为草药导向预设。

开启**以炼金价值排序**，用 **🔼/🔽** 切换升序/降序。

### 格位过滤与搜索

锁定最多三个**指定原料**格位，将搜索限定为特定物品在固定位置的组合。每个格位旁的 **+/−** 箭头按成本顺序循环切换物品。

用复选框按配方类型过滤：**2件不同、3件不同、2件相同、3件相同**。

开启**实时**可在任何变动时自动重算，或对大型候选池点击**计算全部**手动触发。

### 结果与收藏

结果按产出物品分组，默认折叠。点击物品行展开查看所有相容的原料组合。无法被任何组合产出的物品出现在**无法达成的目标**区域。

点击任意配方行的 **★** 将其保存到**已保存配方**（右侧面板）。在该面板中：
- **导出** — 将全部收藏保存为 `.txt` 文件（格式：`物品1 + 物品2 (+ 物品3) = 产物`）
- **导入** — 加载 `.txt` 文件批量导入配方
- **同步数据库** — 将所有收藏的炼金锅配方注入主生产数据库，计算器即可规划包含炼金锅工序的完整生产链

### 炼金锅配方快捷编辑窗

在计算器的配方选择器中，有 `cauldronTarget` 的物品会显示快捷按钮，可打开**炼金锅配方快捷编辑窗**：
- 通过物品选择器或 **+/−** 箭头为每个格位指定原料。
- 实时显示 T 值、有效区间 `[下界, 上界]` 以及与每个界的距离。
- 绿色 = 命中目标；红色 = 未命中。
- 点击 **★** 加入收藏，或点击**应用**（仅在命中时可用）将配方直接写入计算器并设为首选。

---

## 📖 百科页面

顶部导航提供三个子视图：

| 视图 | 说明 |
|---|---|
| **指南** | 计算器与炼金锅全功能的文字说明文档 |
| **物品** | 可搜索的物品图标网格；点击任意物品查看属性、生产配方和使用情况 |
| **机器** | 可搜索的机器列表；点击任意机器查看属性、建造材料和所有相关配方 |

在物品视图中，点击配方旁的 **★** 可将其设为该物品的首选配方（与计算器同步）。  
点击配方行中的任意物品，可直接跳转到该物品的详情页。

---

## 🛠️ 数据库编辑器页面

从下拉菜单选择编辑对象：
- **Database** — 完整的物品、机器、配方数据
- **Translations** — 控制所有界面字符串及物品/机器名称的 `ALCHEMY_I18N` 对象
- **Settings** — 当前用户偏好（JSON 格式）
- **(\*BACKUP)** 变体 — 每次应用前自动保存的上一个版本

在文本区直接编辑 JSON，点击**应用更改**立即重载。使用**导出到文件**保存副本。

> **注意：** 应用新数据库会重新加载页面并覆盖本地副本。应用前请先通过导出做好备份。

---

## 🌐 语言与本地化

点击页头的 **🌐 EN/中文** 在英文和简体中文之间切换。

翻译层（`alchemy_i18n.js`）映射了所有物品名称、机器名称、分类和界面字符串。可通过**数据库编辑器 → Translations** 自定义，修改结果持久化到 `localStorage`。

---

## 🔗 URL 参数

URL 反映当前状态，可收藏或分享：

| 参数 | 说明 | 示例 |
|---|---|---|
| `item` | 目标物品名称 | `?item=Steel%20Ingot` |
| `rate` | 生产速率（个/分钟） | `&rate=60` |
| `tab` | 加载时的激活标签页 | `&tab=cauldron` |
| `lang` | 强制语言（`en` 强制英文） | `&lang=en` |
| `fuel` | 覆盖燃料来源 | `&fuel=Coke` |
| `fert` | 覆盖肥料来源 | `&fert=Basic%20Fertilizer` |
| `setupgrades` | 逗号分隔的升级等级（索引 0–9） | `&setupgrades=5,0,3,2,1,1,0,0,0,0` |

> `setupgrades` 索引对应：`[0]` 物流效率，`[1]`（未用），`[2]` 工厂效率，`[3]` 炼金技术，`[4]` 燃料效率，`[5]` 肥料效率，`[6]` 销售能力，`[7–9]`（未用）。

---

## ⚙️ 重置选项

| 按钮 | 效果 |
|---|---|
| **保存设置** | 持久化当前升级等级和物流设置 |
| **重置配方数据** | 清除本地数据库，还原为内置版本（自动备份当前版本） |
| **重置翻译** | 清除本地翻译覆写（自动备份当前版本） |
| **全部重置** | 清除所有 `localStorage` 数据并以默认值重新加载 |

当内置数据库（`alchemy_db.js`）版本比本地版本更新时，页面顶部会显示**更新横幅**。选择**立即更新**（覆盖本地数据，但保留用户设置）或**略过更新**。

---

## 🏗️ 项目结构

```
AlchemyFactoryCalculator/
├── index.html              # 主 HTML 框架、标签页布局、模态框
├── style.css               # 所有样式（CSS 自定义属性、暗色主题）
├── alchemy_db.js           # 游戏数据——物品、机器、配方
├── alchemy_i18n.js         # 翻译表（英文/中文）及 t() 辅助函数
├── alchemy_constants.js    # 传送带分数定义和辅助函数
├── alchemy_calc_engine.js  # 纯计算引擎（树构建、聚合计算）
├── alchemy_calc.js         # 计算器 UI 渲染（DOM、模态框、树节点）
├── alchemy_ui.js           # 全局初始化、设置、下拉框、物品选择器、URL 状态
├── alchemy_cauldron.js     # 炼金锅模拟、收藏管理、数据库同步
├── alchemy_help.js         # 百科（指南、物品浏览器、机器浏览器）
├── alchemy_recipe.js       # 配方探索器（代码已就绪，页面入口暂未开放）
└── alchemy_itemvalue.js    # 物品价值表（代码已就绪，页面入口暂未开放）
```

无构建工具、打包器或外部依赖。纯 HTML + CSS + 原生 JavaScript。

---

## 🤝 贡献与自定义

- **欢迎 Fork。** 所有数据和逻辑均为纯文本文件。
- 新增物品或配方：编辑 `alchemy_db.js`，或在浏览器中使用数据库编辑器。
- 修正翻译：编辑 `alchemy_i18n.js`，或使用数据库编辑器 → Translations。
- 计算引擎（`alchemy_calc_engine.js`）与 UI 完全解耦，可单独使用。

---

*本计算器 Fork 自原作者 JoeJoesGit 的 [AlchemyFactoryCalculator](https://joejoesgit.github.io/AlchemyFactoryCalculator/)，新增了中文本地化、炼金锅计算器、百科、数据库版本更新提醒以及多项界面改进。*
