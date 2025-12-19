## v64 - Tooltips & Insight
* **UI:** **Hover Tooltips.** Hovering over machine counts (e.g., "24 Grinders") now displays a detailed tooltip showing the Recipe, Base Time, Speed Multiplier, and actual Items/Min throughput per machine.
* **UX:** Provides instant verification of *why* a certain number of machines is required without leaving the main view.

## v63 - Ranges & Exploration
* **Construction:** **Min/Max Logic.** The Construction List now displays a range (e.g., "Min 4, Max 5").
    * *Min:* Optimal layout (sharing capacity across lines).
    * *Max:* Siloed layout (building separate machines for every sub-chain).
    * *Cost:* Total Materials are calculated based on the *Minimum* (Optimal) count.
* **Navigation:** **Drill-Down.** Clicking an item name in the production tree now opens a **New Window** focused specifically on that item, preserving the original plan in the previous tab.
* **Analysis:** **Machine Capacity.** Added a "Show Machine Max Cap" toggle to the Logistics panel. When enabled, displays the theoretical max throughput of the built machines next to the count (e.g., `Cap: 15.0/m`).

## v62 - Precision Counting
* **Logic:** **Round-then-Sum.** Changed the Construction List logic to round up machine counts *per production step* before summing them.
* **Fix:** Resolves discrepancies where the Construction List (previously using "Sum-then-Round") would show fewer machines than visually depicted in the tree.
* **Accuracy:** The "Total Material Cost" now accurately reflects the cost of building every machine shown in the visual plan.

## v61 - Batch Logic
* **Logic:** **Deterministic Batches.** Completely replaced the "Probability/Failure" engine with **Batch Cycles** to match the game's actual mechanics.
    * *Example:* Coke is no longer "50% chance"; it is now "12 Powder -> 1 Coke + 2 Charcoal".
* **Database:** Updated to **v17**. Removed `probability` fields and converted uncertain recipes to fixed Batch inputs/outputs.
* **Byproducts:** Secondary outputs (e.g., Planks from Gloom Fungus, Charcoal from Coke) are now automatically detected and listed in the "Byproducts" section of the tree.
* **Refinement:** Fixed an issue where fuel ingredients (like Charcoal Powder for Coke) were hidden if they matched the global fuel source.

## v60 - Layout & Auto-Update
* **Layout:** Moved the **"Byproducts (Waste)"** section from the Construction List to the Main Tree (Column 2) for better visibility.
* **Data Safety:** Implemented **Auto-Update Logic.** The app now detects if the `alchemy_db.js` file version is newer than the browser cache and automatically upgrades the database.
* **Fix:** Restored missing modal functions that caused the Recipe Swap button to fail in v57-v59.
* **UX:** Smart Search arrow now transforms into a "Clear" (`✖`) button when text is entered.

## v59 - Byproducts & UX
* **Relocation:** Moved the **"Byproducts (Waste)"** section from the Construction List to the Main Tree (Column 2), directly below "External Inputs," for better visibility of the complete production flow.
* **UX:** **Smart Search Clear.** The search box arrow (`▼`) now transforms into a Clear button (`✖`) when text is entered, allowing for instant resetting of the search field.
* **Data Safety:** Implemented **Auto-Update Logic.** The calculator now detects if the `alchemy_db.js` file is newer than the cached browser data and automatically refreshes the database, preventing "No build data" errors after updates.

## v58 - Layout & Construction
* **UI Layout:** Transitioned to a compact **4-Column Layout** (Inputs | Tree | Construction | Upgrades).
* **Scale:** Reduced global UI scale (font size 13px) to support comfortable 100% zoom usage on standard 1080p monitors.
* **Construction List:**
    * **Grouping:** Machines are now grouped by type (e.g., "Assembler (8)").
    * **Expansion:** Clicking a machine group expands it to show the specific build costs (e.g., "16 Iron Ingot").
    * **Grand Total:** Added a **"Total Material Cost"** summary at the bottom, summing up every resource needed to build the entire factory plan.

## v57 - Smart Search
* **UI Upgrade:** Replaced the "Target Item" dropdown with a **Smart Combobox**.
    * **Features:** Ghost Text Autofill, Hybrid Sorting (Starts-With priority), and Keyboard Navigation.
* **Option:** Added **1/3 Belt (~33%)** to the Belt Load preset dropdown.
* **Code:** Removed ~50 lines of redundant HTML generation logic, resulting in a cleaner, faster file despite the new features.

## v56 - Liquid Logic Fix
* **Fix:** **Liquid Flow.** Fluid outputs (e.g., Linseed Oil, Water) are no longer restricted by the Belt Speed cap.
* **Math:** High-volume fluid recipes now correctly calculate machine counts based on production speed alone, rather than artificially inflating the count due to belt bottlenecks.

## v55 - Belt Cap Logic
* **Logic:** **Belt Bottleneck.** Standard machines producing solid items now respect the current Belt Speed limit.
* **Math:** If a machine's theoretical output exceeds the belt speed (e.g., 540/m output on a 90/m belt), the calculator now caps the per-machine output at the belt limit and increases the required machine count accordingly.

## v54 - Logic Repair
* **Fix:** **Tree Pruning Logic.** Disabled the "Stop Recursion" rule when a node is handled by Self-Fuel/Self-Fert. 
    * *Impact:* Ingredient sub-chains (e.g., Sage for Basic Fertilizer) are now fully calculated and visible, ensuring the "Internal Module" at the bottom receives the correct demand load.

## v53 - Lean Architecture
* **Refactor:** Removed the massive embedded database string from `index.html`.
* **Logic:** The calculator now relies exclusively on the external `alchemy_db.js` file or Local Storage.
* **Editor:** The Database Editor tab now gracefully handles local file restrictions by showing a helpful message instead of crashing.

## v50-v52 - Data Integrity
* **Fix:** Restored missing HTML input elements that caused load crashes.
* **Fix:** Restored missing Alternate Recipes (Sand, Salt, etc.) to the offline database source.

## v49 - Database Overhaul (v14)
* **Crash Fix:** Removed `Mors_Alt` (Vitality Essence -> Oblivion Essence) to prevent infinite recursion loops.
* **Crash Fix:** Removed all "Ingot -> Powder" recycling recipes that caused "Maximum Stack Size" errors.
* **Correction:** `Oblivion Essence` is now correctly defined as a manufactured item (Sage Seeds -> Paradox Crucible), not a raw material.
* **Cleanup:** Organized database items into distinct categories (Herbs, Fuels, Relics, etc.) for easier maintenance.
* **Database:** **Complete Rewrite.** Replaced the entire database with validated data from the `faultyd3v` repository.
    * Updated all prices, crafting times, and yields.
    * Added `probability` (Failure Rate) and `failures` (Byproduct) data to recipes like Coke, Steel, and Silver/Gold Powders.
* **Logic:** **Average Cost Calculation.** The planner now scales input requirements based on recipe success probability (e.g., a 50% success rate requires 2x inputs).
* **Logic:** **Byproduct Tracking.** A new sidebar section lists "Waste" products generated by failures (e.g., Charcoal from failed Coke attempts).
* **UI:** **Split-Button Logistics.** Replaced the old checkbox/dropdown rows with a cleaner Split-Button layout (Toggle On/Off | Make Default).
* **UI:** Renamed "Self-Feed" to **"Self-Fuel"**.
* **UI:** Renamed "Bio" summary label to **"Nutr"** and updated units to **V/s** (Value per Second).
* **Cleanup:** Removed the redundant "Defaults" panel from the right column.

## v48 - Better Recipe Swap
* **UX:** The Recipe Swap modal now displays the **Input Ingredients** for each option, not just the machine name. (e.g., distinguishing "Sand from Stone" vs "Sand from Rock Salt").

## v47 - Offline Restoration
* **Code:** Restored the full 500+ line embedded database source string.
* **Fix:** Ensures the "Database Editor" tab functions correctly even when running the HTML file locally/offline (where browser security blocks reading external files).

## v46 - Internal Logic Prototype
* **Internal:** Initial implementation of Probability and Byproduct math (superseded by v49 UI updates).

## v45 - Source Editor
* **Feature:** **Raw Source Editing.** The Database Editor now attempts to load the raw `alchemy_db.js` text file to preserve comments and formatting (Notepad++ style).
* **Fallback:** If loading the file fails (local security), it falls back to the embedded v47+ source string.
* **Style:** Changed Editor font to Consolas/Monospace for better readability.

## v43 - GitHub Integration
* **UI:** Added a "GitHub Repo" link to the header.
* **UI:** The "View Changelog" link now directs to the full `CHANGELOG.md` history on GitHub.

## v41/42 - Logic & Format
* **Fix:** Fixed a critical logical bug where the Heat Module calculation ran before the Fertilizer Module.
* **Logic:** Fertilizer Module now calculates *first* so that its heat demand is correctly registered by the Heat Module.
* **Math:** Internal modules now correctly contribute to global summary statistics.

## v42 - Format Restoration
* **Code:** Restored fully expanded CSS formatting to ensure code readability and correct line counts.
* **Verification:** Re-verified module execution order to ensure complex recipes (e.g., Healing Potion) trigger fuel demands correctly.

## v41 - Module Ordering Fix
* **Fix:** Fixed a critical logical bug where the Heat Module calculation ran before the Fertilizer Module.
* **Logic:** Fertilizer Module now calculates *first* so that its heat demand is correctly registered by the Heat Module.
* **Math:** Internal modules now correctly contribute to global summary statistics.

## v40 - UI Cleanup
* **UI:** Removed the "Show External Chain" toggles and checkboxes.
* **Logic:** The "External Inputs" section now displays automatically whenever a resource is not set to Self-Feed/Fertilize.

## v39 - Recursion & Visual Fixes
* **Fix:** Fixed a bug where the production tree disappeared if the Target Item was the same as the Fuel/Fertilizer source.
* **UI:** Changed the color of "Gold Cost" in the summary to Yellow (matching the tree) instead of Red.
* **UI:** Restored "Gross vs Net" deduction text in the summary box.

## v38 - Tree Pruning (Blueprint Mode)
* **Feature:** **Tree Pruning.** The Main Production Tree now hides fuel/fertilizer sub-chains if "Self-Feed" is active, reducing visual clutter.
* **Logic:** The "Internal Modules" section at the bottom now renders the *full* gross production chain for fuel/fertilizer (including the recursive cost).
* **Code:** Restored readable CSS formatting.

## v37 - Blueprint Layout Pivot
* **Layout:** **Blueprint View.** Split the display into three distinct sections:
    1.  **Primary Chain:** The main product and its direct ingredients.
    2.  **Internal Modules:** Consolidated production chains for self-feeding Fuel and Fertilizer.
    3.  **External Inputs:** A "Shopping List" of raw resources, gold, and imported fuel/fertilizer.
* **Summary:** Added "Internal Load" vs "External Load" to the summary box.

## v36 - Unified Tagging
* **Feature:** **Smart Tags.** Replaced old text tags with standardized data.
    * *Consumption:* `Heat: 26.0 P/s, Needs 32.5/m Charcoal Powder`.
    * *Production:* `Output: 288.00 V/s` (Only appears on active Fuel/Fertilizer items).
* **Feature:** **Number Abbreviation.** Large numbers now auto-format (e.g., `17.28k`, `1.25m`).

## v35 - Visual Overhaul & Sorting
* **UI:** **Row Numbers.** Added blue sequential row identifiers (e.g., `1)`, `2)`) to the far left of the tree.
* **Logic:** **Smart Sorting.** Ingredients are now always rendered *above* support/fuel nodes in the tree hierarchy.
* **UI:** Renamed "Stone Furnace" in the sidebar to "Stone Furnace (Minimum)" to clarify it represents total heat capacity.

## v34 - Visual Prototype
* **Internal:** Initial implementation of Row IDs and Tagging (superseded by v35/v36 logic).

## v33 - Externalized History
* **Maintenance:** Moved full changelog history to `CHANGELOG.md` to reduce HTML file size and prevent code truncation errors.
* **UI:** Updated in-app modal to show only the most recent changes and link to this file.

## v32 - Restored Features
* **Fix:** Restored the detailed Belt Load presets that were accidentally dropped in v30/v31.
* **Options:** Users can now select 1/32, 1/16, 1/8, 1/4, 1/2, 2/3, and Full Belt loads again.

## v31 - Critical Stability Fixes
* **Fix:** Fixed a "Calculation Error: targetItemDef is not defined" crash that occurred when calculating profit.
* **Fix:** Fixed "Cannot read property 'checked' of null" error by restoring missing IDs to the "Show External Chain" checkboxes.
* **Code:** Added null-checks to document.getElementById calls to prevent future crashes if UI elements are modified.

## v30 - Logic Rebuild
* **Refactor:** Rolled back core calculation logic to the stable v24 base to eliminate "GrossRate" errors.
* **Feature:** Re-integrated the "Recipe Swapping" logic and "Chunky Spinners" on top of the stable base.
* **Safety:** Added order-of-operation sanitization to ensure variables are defined before use.

## v29 - UI Hotfix
* **Fix:** Restored missing HTML elements for external chain toggles that caused immediate crashes on load in v27/v28.

## v28 - Code Restoration
* **Fix:** Addressed an issue where the code generator truncated ~150 lines of code, breaking the recursive calculation engine.
* **Fix:** Manually merged v26 features with v27 safety checks.

## v27 - Safe Mode & Auto-Repair
* **Feature:** Added "Auto-Repair" logic on startup. If the app detects old save data (missing IDs from v24/v25), it attempts to migrate settings rather than crashing.
* **UX:** Added `try/catch` blocks around the main calculator to show helpful alert messages instead of a blank screen on error.

## v26 - UX Overhaul & Alternate Recipes
* **Feature:** **Recipe Swapping.** Added a cycle icon (🔄) next to items in the tree. Clicking it opens a modal to select alternate recipes (e.g., making Sand from Stone vs. Salt).
* **Feature:** **Chunky Spinners.** Replaced standard browser input arrows with large, touch-friendly `[ - ]` and `[ + ]` buttons spanning the full height of input boxes.
* **Database:** Updated logic to handle preferred recipe IDs in local storage.

## v25 - GitHub Polish
* **UI:** Cleaned up "Export to File" button text.
* **UI:** Made the version number in the header clickable to open the internal Changelog modal.
* **Data:** Verified fertilizer and fuel values against the game Codex.

## v24 - Persistence
* **Feature:** **Local Storage.** The app now automatically saves your upgrade levels, default settings, and preferences to the browser.
* **Feature:** Added "Factory Reset" button to wipe local data and reload defaults from `alchemy_db.js`.

## v23 - Default Logistics
* **Feature:** Added a "Defaults" panel in the right column.
* **Logic:** Users can set a Global Default Fuel and Fertilizer that auto-populates the logistics dropdowns on page load.

## v22 - Layout & Tiers
* **UI:** Moved to a **3-Column Layout** (Inputs | Tree | Upgrades) for better use of screen real estate.
* **Logic:** Implemented tiered upgrade logic (diminishing returns or step-functions) for Belt Speed and Factory Efficiency.
* **Logic:** Added specific machine boosts (e.g., Alchemy Skill affecting Alembics/Extractors specifically).

## v21 - Belt Presets
* **Feature:** Added a "Belt Load" dropdown.
* **Logic:** Users can select a percentage of a max belt (based on current belt level) rather than typing items/min manually.

## v20 - Rendering Fixes
* **Fix:** Resolved a recursion display bug where internal support nodes (injecting into the main tree) were not rendering visible children.

## v19 - Net Logistics
* **Math:** Implemented "Net Energy" and "Net Nutrient" math.
* **Logic:** The calculator now accounts for the fuel consumed by the fuel production chain itself (the "Self-Feeding Tax").

## v18 - In-Line Injection
* **UI:** Support chains (Fuel/Fertilizer) now inject directly into the main tree hierarchy under the specific machines consuming them, rather than only appearing as separate isolated trees.

## v17 - Construction List
* **Feature:** Added a "Construction List" sidebar.
* **Logic:** Sums total machine counts across all active chains and calculates required parent furnaces.