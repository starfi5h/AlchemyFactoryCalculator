[EN](README.md) | [简体中文](README.zh-CN.md)

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
| 🗺️ **Planner** | Free-form node-graph editor for designing factory layouts, with modules, auto-layout, and live flow resolution |
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
- Add as many target rows as needed; each is independent, and rows can be reordered by dragging the handle.
- Use **💾 Save List / 📂 Load List** to persist multi-target sets in the browser.
- Enable **Self-Fuel** or **Self-Fert** to automatically deduct factory consumption from the net output of the fuel/fertilizer item itself. The engine iterates to a stable equilibrium.
- **⚡ Fuel/Fert 1-Machine Quick Set** instantly fills the list with two rows (the selected fuel and fertilizer items), each set to a single fully-loaded machine's rate.

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
| **Manage Custom Costs** | Set a custom gold cost per item, used in place of buy price / to price external inputs that have no buy price |
| **Node Size** | Scale the production tree cards up or down |
| **Show Belt Count** | Display belt usage alongside each node's rate |
| **Show Machine Usage** | Display fuel/fertilizer consumption on each node |
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

Use **Recycle All / Un-recycle All** at the top of each production chain section to toggle all recyclers at once, and the **💠** icon to expand/collapse the whole first level at once.

Below the tree, a **Common Nodes** section lists any item+machine combination that appears more than once across the chain (e.g. shared intermediates), with links back to every occurrence, and a **Byproducts** section summarises unconsumed byproducts with links to their producers.

### Switching Recipes & Catalysts

Click **🔄** on any node to open the recipe selector:
- Choose an alternative recipe (e.g., Athanor vs. Advanced Athanor for Coke).
- For **Advanced Athanor** recipes, select one or more **catalysts** (Unstable / Fertile / Resonant / Eternal) to change output ratios or input requirements.
- For the **Paradox Crucible**'s custom-input recipe, pick which item to feed in via the Item Picker.
- Recipe overrides can be applied **Globally** or **This Node Only**, via the scope toggle at the top of the modal (only shown when switching a recipe on a specific tree node).
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
| **Unit Cost** | Coin, heat, and nutrient cost per output item (or, with exactly two multi-targets set to the fuel and fertilizer items, the solved gold-equivalent value of the fuel/fertilizer itself) |
| **Unit Value** | Conversion cost vs. Retail Price and Wholesale Price, as a ratio |

### Construction List

The right panel lists every machine type and count required. Click a machine name to expand and see the **total raw materials** needed to build all machines of that type. The **Total Materials Required** section at the bottom also shows estimated **inventory slot** counts based on max stack sizes.

### Send to Planner

The **Send to Planner** button (in the Save/Reset panel) exports the current calculator production tree straight into the Planner tab as a node graph — see [Importing from the Calculator](#importing-from-the-calculator) below.

---

## 🗺️ Planner Tab

The Planner is a free-form, Satisfactory-Modeler-style node-graph editor: instead of a single recursive tree rooted at one target item, you place recipe nodes freely, wire their input/output ports together, and the tool resolves how much of each item actually flows across every connection.

### Plan Library

The Planner can hold multiple independent **plans**, each with its own set of nodes and connections.

- The dropdown in the toolbar switches between plans; **📁 Manage Plans** opens a modal listing every plan.
- In the manager you can **drag to reorder**, **rename in place** (double-click the name field that appears), **duplicate**, **delete**, or **export** a single plan as a `.json` file. **New Plan** creates a blank plan, and **⭱ Import** loads a previously exported `.json`.
- Every plan keeps its own **undo/redo history** and remembers the **viewport** (pan/zoom) you last left it at for the current browser session.

### Canvas Basics

- **+ Add Node** or **right-click** an empty area of the canvas opens the Item Picker; picking an item with a recipe drops a new node there.
- **Drag a node's header** to move it; drag empty canvas to pan the view.
- **▭ Select Mode** switches the canvas into box-select: drag a rectangle to select multiple nodes, then drag any selected node's header to move the whole group together, or press **Delete/Backspace** to remove them all at once.
- **Zoom** with the mouse wheel, pinch-to-zoom on touch devices, or the **+ / −** buttons; **⤢ Fit to View** (or the **F** key) frames all nodes.
- The **⊞ Grid Snap** button cycles node-dragging snap between three grid sizes and off.
- **↺ Undo / ↻ Redo** (or **Ctrl+Z / Ctrl+Y**) step through that plan's edit history.

### Nodes & Ports

Each node represents one recipe at a chosen **machine count** (which can be fractional) and shows its input ports on the left and output ports on the right:

- **Port dot colors** — gray: unconnected; green: connected and balanced; yellow (output): surplus beyond what's connected; red (input): still short of what's needed after connections.
- Hovering a node's header shows a tooltip with that recipe's full input/output/fuel/fertilizer rates **per single machine**.
- Drag from a port's dot to another compatible port (same item, opposite direction) to connect them; dragging onto empty canvas instead opens a small recipe picker (filtered to recipes that produce/consume that item) and creates a new connected node in one step.
- Clicking a connection's flow-rate label opens an **Edge Modal** showing source/target, current flow, and lets you type an exact target flow (which resizes the machine counts on both ends to match) or delete the connection.

### Node Settings (⚙)

Opens a modal with:
- The current recipe's full input/output breakdown, plus **catalyst toggles** for Advanced Athanor recipes or an **input-item picker** for the Paradox Crucible's custom recipe.
- A **recipe-switch list**, grouped by the node's main output item, to swap to any alternative recipe for that item.
- A **Port Balance** section (only shown when at least one connected port is unbalanced) with one-click buttons per item to adjust the node's machine count so a specific connected input/output exactly matches what its connections need.
- **Graph Tools**: Select All Upstream, Auto-Layout Upstream (tidies all upstream nodes into a tree layout), Populate All Upstream (recursively auto-generates missing upstream production, see below), and Clear All Upstream.

### Auto-Generating Upstream Production

The **⚡ button** on a node's machine-count row inspects that node's unmet input demand and auto-creates one upstream node per missing input (using its preferred recipe), sized and pre-connected to exactly cover the shortfall, laid out to the node's left. **Populate All Upstream** (in the Node Settings modal) repeats this recursively until the whole upstream chain has no more shortages, skipping recipes that would recurse into themselves.

### Linking Machine Counts

The chain-link button next to a node's machine-count input toggles **Link Mode**. While active, changing one node's machine count (or setting an exact flow value in the Edge Modal) proportionally scales the machine counts of every node connected to it, so an entire sub-chain can be resized together instead of one node at a time.

### Module Nodes

A node can also reference an entire other plan as a **module**: it exposes that plan's *net* unconnected inputs/outputs as its own ports (i.e. whatever that plan doesn't already produce/consume internally), plus its total fuel/fertilizer draw. Its Node Settings modal shows a **📦 Load Module** button that switches the Planner to that referenced plan. The tool detects circular module references and flags them as an error on the node instead of resolving them.

### Summary Panel

A collapsible floating panel (top-left of the canvas) totals the whole current plan into four sections: **Total Load** (gold/fuel/fertilizer consumption), **Output** (unconnected output surplus), **Input** (unmet input shortage), and **Machines** (machine counts by type). Each section can be collapsed independently, and the whole panel can be minimized to a small button.

### Importing from the Calculator

The Calculator tab's **Send to Planner** button converts its current production tree into a Planner node graph inside the active plan: recipe nodes are aggregated by recipe id (with machine counts summed), parent/child edges are created for the main flows, and any byproduct recycling in the calculator is translated into extra recycle edges. New nodes are laid out automatically (upstream tree layout) and the view is fit to show them; edges left with essentially zero flow after resolution are dropped.

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

Use **Select All / Deselect All** to bulk-configure the active profile. The **🌿** button resets the pool to a herb-focused preset, and **💰** resets it to a gold/currency-focused preset.

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

### Multi-Step Optimization

Switch to **Multiple Steps** (next to **Single Step** at the top of the Cauldron tab) to search for cheaper *multi-stage* cauldron chains — recipes that themselves consume the output of an earlier cauldron combination — instead of a single combination search.

- The table shows one row per item and one column per optimization round (**Step 0** through **Step 4**). **Step 0** is the base cost of each candidate item; each subsequent step re-runs the cauldron search using the previous step's items as ingredients, keeping only combinations that are *cheaper* than what's already known for that item.
- Costs that didn't improve over the previous step are grayed out, so you can see at a glance which items actually benefited from another round of optimization.
- Click the **▲** button on any cell to highlight and filter the table down to just that item and its full upstream ingredient chain — every cell that was actually used to reach that result lights up. Click the same **▲** again to clear the filter.
- Click **★** on any cell to save that step's recipe to **Saved Recipes**, same as the Single Step results.
- Hover the cost number for a per-item **Ingredients Cost** / **Heat Cost** breakdown (in coins), and hover an ingredient icon to see its name and the cost value used in that calculation.
- **⚙ Cost Settings** lets you set the Heat-to-coin and Nutrient-to-coin conversion rates used to estimate costs throughout the Cauldron tab (also shown as an editable, searchable list of every item's estimated base cost).

---

## 📖 Wiki Tab

Three sub-views accessible from the top navigation:

| View | Description |
|---|---|
| **Guides** | Written documentation for all Calculator and Cauldron features |
| **Items** | Searchable icon grid of all items, with chip-based filters (Category, Tier, Sell Price, Wholesale Price, Cauldron Target); click any item for stats, production recipes, and usage |
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
├── index.html                      # Main HTML shell, tab layout, modals
├── style.css                       # All styles (CSS custom properties, dark theme)
├── js/
│   ├── alchemy_db.js              # Game data — items, machines, recipes
│   ├── alchemy_i18n.js            # Translation table (EN/ZH) + t() helper
│   ├── alchemy_state.js           # Global application state, default settings, persistence and localStorage
│   ├── alchemy_main.js            # Application entry point, initialization, URL state, module coordination
│   ├── alchemy_ui.js              # Shared UI logic: settings, combobox, item picker, slider, and modals
│   ├── alchemy_calc_engine.js     # Pure calculation engine (tree building, aggregation)
│   ├── alchemy_calc.js            # Calculator UI renderer (DOM, modals, tree nodes)
│   ├── alchemy_cauldron.js        # Cauldron simulation, favorites, sync
│   ├── alchemy_help.js            # Wiki (guides, item browser, machine browser)
│   ├── alchemy_planner.js         # Planner core: canvas, nodes, edges, plan library, view controls
│   ├── alchemy_planner_calc.js    # Planner flow-resolution engine, auto-layout, module/import logic
│   └── alchemy_planner_overlays.js # Planner overlays: plan manager, node settings, edge modal, summary panel
```

No build tools, bundlers, or external dependencies. Pure HTML + CSS + vanilla JavaScript.

---

## 🤝 Contributing & Customization

- **Fork freely.** All data and logic are in plain text files.
- To add a new item or recipe, edit `alchemy_db.js` (or use the Database Editor in the browser).
- To add or fix a translation, edit `alchemy_i18n.js` or use Database Editor → Translations.
- The calculation engine (`alchemy_calc_engine.js`) is fully decoupled from the UI and can be used independently.

---

*This calculator is a fork of the original [AlchemyFactoryCalculator](https://joejoesgit.github.io/AlchemyFactoryCalculator/) by JoeJoesGit, with added Chinese localization, the Cauldron Calculator, the Wiki, the Planner, incremental database update notifications, and various UI enhancements.*
