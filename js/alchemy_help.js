/* ==========================================================================
   ALCHEMY HELP PAGE  (Items · Machines · Full Documentation)
   ========================================================================== */

function _tn(name, category = 'ui') { /* translate item/machine name via existing t() if available */
    return (typeof t === 'function') ? t(name, category) : name;
}

/* ─── 4. STYLE INJECTION ──────────────────────────────────────────────────── */
function _injectHelpStyles() {
    if (document.getElementById('help-styles')) return;
    var s = document.createElement('style');
    s.id = 'help-styles';
    s.textContent = `
        /* ── Outer shell: #help-inner owns the flex layout so
              #view-help can remain display:block for the tab system ── */
        #help-inner {
            display: flex; flex-direction: column;
            height: 100%; overflow: hidden;
        }
        .wiki-subnav {
            flex-shrink: 0; display: flex; gap: 6px;
            padding: 7px 12px; border-bottom: 1px solid var(--border, #333);
        }
        .wiki-tab-btn {
            padding: 3px 14px; border-radius: 4px;
            border: 1px solid var(--border, #333); background: transparent;
            color: var(--text-muted, #aaa); cursor: pointer;
            font-size: 1.0em; font-weight: 600;
        }
        .wiki-tab-btn:hover  { background: var(--hover-bg, #1e2a3a); color: var(--text, #eee); }
        .wiki-tab-btn.active { background: var(--accent-bg, #1e3a5f); border-color: var(--accent, #4af); color: var(--accent, #4af); }
        #wiki-area {
            flex: 1; min-height: 0; overflow-y: auto;
            display: flex;
        }

        /* ── Split layout ── */
        .wiki-split-area {
            display: flex; flex-direction: row;
            width: 100%; overflow: hidden;
        }
        .wiki-left-pane {
            box-sizing: border-box; flex: 3 1 75%; min-width: 50px;
            border-right: 1px solid var(--border, #333);
            display: flex; flex-direction: column; overflow: hidden;
        }
        .wiki-right-pane {
            box-sizing: border-box; flex: 1 1 25%; min-width: 270px;
            padding: 14px 18px; overflow-y: auto;
        }
        @media (max-width: 720px) {
            .wiki-split-area {
                flex-direction: column;
                height: 100%; /* 確保撐滿父容器 */
            }

            /* 預設（無選取）：左側佔滿全部空間 */
            .wiki-left-pane {
                flex: 1 1 100%;
                min-height: 0;
                max-height: 100%;
                border-right: none;
            }
            .wiki-right-pane {
                display: none;           /* 預設隱藏 */
                flex: 0 0 auto;
                border-top: 1px solid var(--border);
            }

            /* 有選取時：左側讓出部分空間給右側 */
            .wiki-split-area.has-selection .wiki-left-pane {
                flex: 0 0 40%;          /* 限制高度，保留空間給右側閱讀 */
                max-height: 40%;
                border-bottom: 1px solid var(--border);
                overflow-y: auto;
            }
            .wiki-split-area.has-selection .wiki-right-pane {
                display: flex;           /* 顯示右側 */
                flex-direction: column;
                flex: 1 1 60%;
                min-height: 0;
                overflow-y: auto;
            }
        }

        .wiki-search-bar { flex-shrink: 0; padding: 7px 8px; border-bottom: 1px solid var(--border, #333); }
        .wiki-search-input {
            width: 100%; box-sizing: border-box; padding: 5px 8px;
            background: var(--input-bg, #0d1a26); border: 1px solid var(--border, #333);
            border-radius: 4px; color: var(--text, #eee); font-size: 0.8em; outline: none;
        }
        .wiki-search-input:focus { border-color: var(--accent, #4af); }
        .wiki-placeholder { color: var(--text-muted, #555); font-size: 0.83em; padding-top: 48px; text-align: center; }

        /* ── Item grid ── */
        .wiki-item-grid {
            flex: 1; min-height: 0; overflow-y: auto;
            display: grid; grid-template-columns: repeat(auto-fill, minmax(74px, 1fr));
            gap: 2px; padding: 4px; align-content: start;
        }
        .wiki-tile {
            display: flex; flex-direction: column; align-items: center;
            padding: 6px 4px; border-radius: 4px; cursor: pointer;
            font-size: 0.8em; text-align: center; gap: 3px;
            color: var(--text, #ddd); border: 1px solid transparent; user-select: none;
        }
        .wiki-tile:hover    { background: var(--hover-bg, #1e2a3a); }
        .wiki-tile.selected { background: var(--accent-bg, #1a3050); border-color: var(--accent, #4af); }
        .wiki-tile span { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3; }
        .wiki-icon { display: block; flex-shrink: 0; }

        /* ── Machine list ── */
        .wiki-machine-list { flex: 1; min-height: 0; overflow-y: auto; padding: 4px; display: flex; flex-direction: column; gap: 2px; }
        .machine-tile { flex-direction: row; justify-content: flex-start; text-align: left; font-size: 0.8em; padding: 7px 10px; }

        /* ── Detail ── */
        .wiki-detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid var(--border, #333); }
        .wiki-detail-title-area { flex: 1; }
        .wiki-detail-name { margin: 0 0 5px; font-size: 1.05em; font-weight: 700; color: var(--text, #eee); }
        .wiki-detail-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; }
        .wiki-badge { font-size: 0.7em; padding: 2px 7px; border-radius: 10px; font-weight: 600; }
        .wiki-badge.category { background: rgba(100,120,180,0.15); color: #8ab; border: 1px solid rgba(100,120,180,0.35); }
        .wiki-stats-grid { display: grid; grid-template-columns: auto 1fr; gap: 3px 12px; font-size: 0.8em; }
        .wiki-stat-key { color: var(--text-muted, #888); }
        .wiki-stat-val { color: var(--text, #ddd); }
        .wiki-section { margin-top: 14px; }
        .wiki-section-title { font-size: 0.7em; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--text-muted, #777); border-bottom: 1px solid var(--border, #2a3a4a); padding-bottom: 4px; margin-bottom: 7px; }
        .wiki-empty { font-size: 0.78em; color: var(--text-muted, #555); margin: 4px 0; }

        /* ── Recipe rows ── */
        .wiki-recipe-row {
            display: flex; align-items: center; gap: 6px;
            padding: 4px 8px; border-radius: 4px; margin-bottom: 3px;
            border: 1px solid transparent; min-height: 30px;
        }
        .wiki-recipe-row:hover { background: var(--hover-bg, #1e2a3a); }
        .wiki-recipe-row.preferred { background: rgba(68,170,255,0.07); border-color: rgba(68,170,255,0.22); }
        .wiki-recipe-formula { flex: 1; display: flex; align-items: center; flex-wrap: wrap; gap: 3px; min-width: 0; }
        .wiki-items { display: flex; align-items: center; flex-wrap: wrap; gap: 2px; }
        .wiki-arrow { color: var(--text-muted, #555); font-size: 0.85em; margin: 0 2px; flex-shrink: 0; }
        .wiki-recipe-item { display: inline-flex; align-items: center; gap: 1px; cursor: pointer; }
        .wiki-item-qty { font-size: 0.7em; color: var(--accent, #7af); line-height: 1; }
        .wiki-recipe-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; font-size: 0.78em; }
        .wiki-recipe-machine { background: rgba(255,255,255,0.05); padding: 1px 5px; border-radius: 3px; cursor: pointer; }

        /* ── Star toggle ── */
        .wiki-star { flex-shrink: 0; background: none; border: none; color: #555; cursor: pointer; font-size: 0.95em; padding: 0 2px; line-height: 1; }
        .wiki-star:hover { color: #fa0; }
        .wiki-star.active { color: #fa0; }
        .wiki-star-ph { width: 18px; flex-shrink: 0; }

        /* ── Build cost ── */
        .wiki-build-cost { display: flex; flex-wrap: wrap; gap: 6px; }
        .wiki-build-item { display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: var(--panel-bg, #1a2535); border: 1px solid var(--border, #2a3a4a); border-radius: 4px; font-size: 0.78em; cursor: pointer; }
        .wiki-build-item:hover { border-color: var(--accent, #4af); }

        /* ── Chip filter bar ── */
        .wiki-chip-bar {
            flex-shrink: 0; display: flex; flex-wrap: wrap; gap: 5px;
            padding: 6px 8px; border-bottom: 1px solid var(--border, #333);
        }
        .wiki-chip-wrap { position: relative; }
        .wiki-filter-chip {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 3px 10px; border: 1px solid var(--border, #444); border-radius: 12px;
            background: transparent; color: var(--text-muted, #aaa);
            font-size: 0.9em; cursor: pointer; white-space: nowrap; user-select: none;
            transition: border-color 0.15s, color 0.15s, background 0.15s;
        }
        .wiki-filter-chip:hover  { border-color: #888; color: #eee; }
        .wiki-filter-chip.active { background: rgba(76,175,80,0.12); border-color: var(--accent,#4caf50); color: var(--accent,#4caf50); }
        .wiki-filter-chip.open   { border-color: #777; color: #ddd; background: rgba(255,255,255,0.04); }
        .chip-arrow { opacity: 0.5; font-size: 0.75em; }
        .chip-clear { opacity: 0.7; line-height: 1; }
        .chip-clear:hover { opacity: 1; }

        .wiki-chip-panel {
            position: absolute; top: calc(100% + 4px); left: 0; min-width: 160px;
            background: #252525; border: 1px solid #555; border-radius: 6px;
            padding: 6px; z-index: 300; box-shadow: 0 6px 18px rgba(0,0,0,0.55);
            display: flex; flex-wrap: wrap; gap: 4px;
        }
        .wiki-cat-btn {
            padding: 3px 8px; border: 1px solid #444; border-radius: 4px;
            background: transparent; color: #bbb; font-size: 0.8em;
            cursor: pointer; white-space: nowrap; transition: 0.15s;
        }
        .wiki-cat-btn:hover  { background: #333; color: #eee; border-color: #666; }
        .wiki-cat-btn.active { background: rgba(76,175,80,0.12); border-color: var(--accent,#4caf50); color: var(--accent,#4caf50); }

        .wiki-chip-panel-num { flex-direction: column; min-width: 140px; gap: 6px; }
        .chip-panel-row { display: flex; align-items: center; gap: 6px; font-size: 0.78em; color: #aaa; }
        .chip-num-input {
            flex: 1; padding: 3px 5px; background: #1a1a1a;
            border: 1px solid #555; border-radius: 3px; color: #eee;
            font-size: 0.85em; width: 70px; min-width: 30px;
            -moz-appearance: textfield; appearance: textfield;
        }
        .chip-num-input::-webkit-inner-spin-button,
        .chip-num-input::-webkit-outer-spin-button { -webkit-appearance: none; }
        .chip-num-input:focus { outline: none; border-color: var(--accent,#4caf50); }
        .chip-exist-btn {
            padding: 3px 8px; border: 1px solid #555; border-radius: 4px;
            background: transparent; color: #aaa; font-size: 0.78em; cursor: pointer; transition: 0.15s;
        }
        .chip-exist-btn:hover  { border-color: #888; color: #eee; }
        .chip-exist-btn.active { background: rgba(76,175,80,0.12); border-color: var(--accent,#4caf50); color: var(--accent,#4caf50); }

        .wiki-active-filter-bar {
            display: flex; flex-wrap: wrap; align-items: center; gap: 5px;
            padding: 5px 8px; border-bottom: 1px solid var(--border,#333);
            background: rgba(76,175,80,0.03);
        }
        .wiki-active-chip {
            display: inline-flex; align-items: center; gap: 3px;
            padding: 2px 8px; background: rgba(76,175,80,0.10);
            border: 1px solid rgba(76,175,80,0.35); border-radius: 10px;
            color: var(--accent,#4caf50); font-size: 0.74em;
        }
        .wiki-active-chip button {
            background: none; border: none; color: inherit; cursor: pointer;
            font-size: 0.9em; padding: 0 1px; opacity: 0.7; line-height: 1;
        }
        .wiki-active-chip button:hover { opacity: 1; }
        .chip-clear-all {
            margin-left: auto; background: transparent; border: 1px solid #555;
            border-radius: 4px; color: #888; font-size: 0.72em; cursor: pointer;
            padding: 2px 7px; transition: 0.15s;
        }
        .chip-clear-all:hover { border-color: #888; color: #eee; }
        .wiki-no-results {
            padding: 32px 16px; text-align: center;
            color: var(--text-muted,#666); font-size: 0.82em; font-style: italic;
        }

        /* ── README / 完整說明 ── */
        .wiki-readme-area-wrap { flex: 1; min-height: 0; overflow: hidden; }
        .wiki-readme-layout { display: flex; flex-direction: row; height: 100%; width: 100%; overflow: hidden; position: relative; }
        .wiki-readme-area { flex: 1; min-width: 0; overflow-y: auto; }
        .wiki-toc-sidebar {
            flex: 0 0 220px; width: 220px; overflow-y: auto;
            border-left: 1px solid var(--border, #333);
            padding: 16px 14px; box-sizing: border-box; background: var(--bg, #161616);
        }
        .wiki-toc-title {
            font-size: 0.72em; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
            color: var(--text-muted, #777); margin-bottom: 8px;
        }
        .wiki-toc-list { display: flex; flex-direction: column; gap: 2px; }
        .wiki-toc-link {
            display: block; padding: 4px 8px; border-radius: 4px;
            font-size: 0.82em; color: var(--text-muted, #999); text-decoration: none;
            border-left: 2px solid transparent; line-height: 1.4;
        }
        .wiki-toc-link:hover { color: var(--text, #eee); background: var(--hover-bg, #1e2a3a); }
        .wiki-toc-link.active { color: var(--accent, #4caf50); border-left-color: var(--accent, #4caf50); background: rgba(76,175,80,0.08); font-weight: 600; }
        .wiki-toc-level-3 { padding-left: 20px; font-size: 0.78em; }

        .wiki-toc-mobile-btn { display: none; }
        .wiki-toc-overlay { display: none; }

        @media (max-width: 720px) {
            .wiki-toc-sidebar {
                position: absolute; top: 0; right: 0; bottom: 0; z-index: 400;
                width: 240px; flex: none;
                box-shadow: -4px 0 14px rgba(0,0,0,0.4);
                transform: translateX(100%); transition: transform 0.25s ease;
            }
            .wiki-toc-sidebar.open { transform: translateX(0); }
            .wiki-toc-mobile-btn {
                display: flex; align-items: center; justify-content: center;
                position: absolute; right: 14px; bottom: 14px; z-index: 401;
                width: 42px; height: 42px; border-radius: 50%;
                background: var(--accent, #4caf50); color: #fff; border: none;
                font-size: 1.1em; cursor: pointer; box-shadow: 0 3px 10px rgba(0,0,0,0.4);
            }
            .wiki-toc-overlay {
                display: block; position: absolute; inset: 0; z-index: 399;
                background: rgba(0,0,0,0.5); opacity: 0; pointer-events: none; transition: opacity 0.2s;
            }
            .wiki-toc-overlay.open { opacity: 1; pointer-events: auto; }
        }

        .md-container { max-width: 900px; margin: 0 auto; padding: 20px 24px 60px; font-size: 0.86em; line-height: 1.7; color: var(--text, #ddd); }
        .md-container h1, .md-container h2, .md-container h3, .md-container h4 {
            color: var(--text, #eee); margin: 26px 0 12px; font-weight: 700;
        }
        .md-container h1 { font-size: 1.5em; border-bottom: 1px solid var(--border, #333); padding-bottom: 8px; }
        .md-container h2 { font-size: 1.25em; border-bottom: 1px solid var(--border, #333); padding-bottom: 6px; margin-top: 34px; }
        .md-container h3 { font-size: 1.08em; }
        .md-container h4 { font-size: 0.98em; color: var(--text-muted, #bbb); }
        .md-container p { margin: 10px 0; }
        .md-container a { color: var(--accent, #4af); text-decoration: none; }
        .md-container a:hover { text-decoration: underline; }
        .md-container code { background: rgba(0,0,0,0.3); padding: 2px 5px; border-radius: 3px; font-family: monospace; font-size: 0.92em; color: var(--accent, #7af); }
        .md-container pre { background: rgba(0,0,0,0.35); border: 1px solid var(--border, #2a3a4a); border-radius: 6px; padding: 10px 12px; overflow-x: auto; margin: 12px 0; }
        .md-container pre code { background: none; padding: 0; color: var(--text, #ddd); }
        .md-container ul, .md-container ol { margin: 8px 0; padding-left: 26px; }
        .md-container li { margin-bottom: 4px; }
        .md-container blockquote { border-left: 3px solid var(--accent, #4af); margin: 12px 0; padding: 4px 14px; color: var(--text-muted, #aaa); background: rgba(255,255,255,0.03); }
        .md-container hr { border: none; border-top: 1px solid var(--border, #333); margin: 24px 0; }
        .md-container table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 0.95em; }
        .md-container th, .md-container td { border: 1px solid var(--border, #2a3a4a); padding: 6px 10px; text-align: left; }
        .md-container th { background: var(--panel-bg, #1a2535); color: var(--text, #eee); }
        .md-container tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
        .md-loading, .md-error { padding: 40px 16px; text-align: center; color: var(--text-muted, #666); font-size: 0.9em; }
        .md-error { color: #e77; }
    `;
    document.head.appendChild(s);
}

/* ─── 5. WIKI STATE ───────────────────────────────────────────────────────── */
var _currentWikiView = 'items';
var _selectedItem    = null;
var _selectedMachine = null;
var _itemFilter      = '';
var _machineFilter   = '';
var _wikiIndex       = null;

/* ─── 5b. CHIP FILTER STATE ──────────────────────────────────────────────── */
var _itemChipFilters = {
    category:      null,    
    tier:          { active: false, min: '', max: '' },
    sell:          { active: false, min: '', max: '' },
    wholesale:     { active: false, min: '', max: '' },
    cauldronTarget:{ active: false, min: '', max: '' }
};
var _activeChip = null; // 'category' | 'sell' | 'wholesale' | 'cauldronTarget' | null
var _machineChipFilters = {
    tier:     { active: false, min: '', max: '' },
    heatCost: { active: false, min: '', max: '' }
};
var _activeMachineChip = null; // 'tier' | 'heatCost' | null

/* ─── 6. WIKI INDEX ───────────────────────────────────────────────────────── */
function _getWikiIndex() {
    if (_wikiIndex) return _wikiIndex;
    var rawDB = (typeof DB !== 'undefined') ? DB : {};
    var recipes = rawDB.recipes || [];
    var producedBy = {}, usedIn = {}, machineRecipes = {};
    for (var i = 0; i < recipes.length; i++) {
        var r = recipes[i];
        var m = r.machine || '';
        if (!machineRecipes[m]) machineRecipes[m] = [];
        machineRecipes[m].push(r);
        var outKeys = Object.keys(r.outputs || {});
        for (var j = 0; j < outKeys.length; j++) {
            var ok = outKeys[j];
            if (!producedBy[ok]) producedBy[ok] = [];
            producedBy[ok].push(r);
        }
        var inKeys = Object.keys(r.inputs || {});
        for (var k = 0; k < inKeys.length; k++) {
            var ik = inKeys[k];
            if (!usedIn[ik]) usedIn[ik] = [];
            usedIn[ik].push(r);
        }
    }
    _wikiIndex = { producedBy: producedBy, usedIn: usedIn, machineRecipes: machineRecipes };
    return _wikiIndex;
}

/* ─── 7. PREFERRED RECIPE ─────────────────────────────────────────────────── */
function _getPreferred(itemName) {
    try {
        var db = (typeof DB !== 'undefined') ? DB : ALCHEMY_DB;
        return db && db.settings && db.settings.preferredRecipes && db.settings.preferredRecipes[itemName];
    } catch(e) { return null; }
}

function _togglePreferred(itemName, recipeId) {
    try {
        var db = (typeof DB !== 'undefined') ? DB : ALCHEMY_DB;
        if (!db.settings) db.settings = {};
        if (!db.settings.preferredRecipes) db.settings.preferredRecipes = {};
        if (db.settings.preferredRecipes[itemName] === recipeId) {
            delete db.settings.preferredRecipes[itemName];
        } else {
            db.settings.preferredRecipes[itemName] = recipeId;
        }
        if (typeof persist === 'function') persist();
    } catch(e) { console.warn('help: togglePreferred failed', e); }
    _renderItemDetail(itemName);
}

/* ─── 8. FORMAT HELPERS ───────────────────────────────────────────────────── */
function _itemIcon(id, size) {
    size = size || 32;
    return '<img src="img/item' + (id || 0) + '.png" width="' + size + '" height="' + size
        + '" loading="lazy" class="wiki-icon" onerror="this.style.opacity=\'0.15\'">';
}

function _fmtItems(obj) {
    var rawDB = (typeof DB !== 'undefined') ? DB : {};
    return Object.entries(obj).map(function(e) {
        var name = e[0], qty = e[1];
        var def = rawDB.items && rawDB.items[name];
        var label = name.replace(/"/g, '&quot;');
        return '<span class="wiki-recipe-item" title="' + label + ' \xd7' + qty + '"' + _oc('wikiSwitchToItem', name) + '>'
            + _itemIcon(def ? def.id : 0, 22)
            + '<span class="wiki-item-qty">\xd7' + qty + '</span>'
            + '</span>';
    }).join('');
}

/* Safe onclick helpers */
function _oc(fn, arg) {
    return 'onclick="' + fn + '(decodeURIComponent(\'' + encodeURIComponent(arg) + '\'))"';
}
function _oc2(fn, a, b) {
    return 'onclick="' + fn + '(decodeURIComponent(\'' + encodeURIComponent(a)
        + '\'),decodeURIComponent(\'' + encodeURIComponent(b) + '\'))"';
}

/* ─── 9. CROSS-NAV ────────────────────────────────────────────────────────── */
function wikiSwitchToItem(name) {
    _selectedItem = name;
    _itemFilter   = '';
    wikiSwitchView('items');
    setTimeout(function() {
        var el = document.querySelector('#wiki-item-grid .wiki-tile.selected');
        if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 0);
}

function wikiSwitchToMachine(name) {
    _selectedMachine = name;
    _machineFilter   = '';
    wikiSwitchView('machines');
}

/* ─── 10. ITEM PAGE ───────────────────────────────────────────────────────── */

function _buildItemSplitHTML() {
    return '<div class="wiki-left-pane">'
        + '<div class="wiki-search-bar"><input type="text" class="wiki-search-input" id="wiki-item-search"'
        + ' placeholder="' + _tn('Search items...') + '" value="' + _itemFilter.replace(/"/g, '&quot;') + '"'
        + ' oninput="_itemFilter=this.value;_refreshItemGrid()"></div>'
        + '<div class="wiki-chip-bar" id="wiki-chip-bar">' + _buildChipBarInner() + '</div>'
        + '<div id="wiki-active-filters">' + _buildActiveFiltersHTML('item') + '</div>'
        + '<div class="wiki-item-grid" id="wiki-item-grid">' + _buildItemGridHTML() + '</div>'
        + '</div>'
        + '<div class="wiki-right-pane" id="wiki-right-pane"><div class="wiki-placeholder"></div></div>';
}

function _buildItemGridHTML() {
    var rawDB = (typeof DB !== 'undefined') ? DB : {};
    var entries = Object.entries(rawDB.items || {});

    // text filter
    if (_itemFilter) {
        var f = _itemFilter.toLowerCase();
        entries = entries.filter(function(e) { return e[0].toLowerCase().includes(f); });
    }
    // category chip
    if (_itemChipFilters.category) {
        var cat = _itemChipFilters.category;
        entries = entries.filter(function(e) { return e[1].category === cat; });
    }
    // numeric chips
    var PROP_MAP = { tier: 'tier', sell: 'sellPrice', wholesale: 'wholesalePrice', cauldronTarget: 'cauldronTarget' };
    ['tier', 'sell', 'wholesale', 'cauldronTarget'].forEach(function(key) {
        var fi = _itemChipFilters[key];
        if (!fi.active) return;
        var prop = PROP_MAP[key];
        entries = entries.filter(function(e) {
            var val = e[1][prop];
            if (val == null) return false;
            if (fi.min !== '' && val < parseFloat(fi.min)) return false;
            if (fi.max !== '' && val > parseFloat(fi.max)) return false;
            return true;
        });
    });

    entries.sort(function(a, b) { return (a[1].id || 0) - (b[1].id || 0); });

    if (!entries.length) {
        return '<div class="wiki-no-results">No items match the current filters.</div>';
    }

    return entries.map(function(e) {
        var name = e[0], def = e[1];
        var sel = name === _selectedItem ? ' selected' : '';
        return '<div class="wiki-tile' + sel + '" data-name="' + name.replace(/"/g, '&quot;') + '" '
            + _oc('wikiSelectItem', name) + '>'
            + _itemIcon(def.id, 32) + '<span>' + name + '</span></div>';
    }).join('');
}

function _refreshItemGrid() {
    var grid = document.getElementById('wiki-item-grid');
    if (grid) grid.innerHTML = _buildItemGridHTML();
}

/* ─── CHIP FILTER FUNCTIONS ─────────────────────────────────────────────── */

function _chipFiltersFor(target) { return target === 'machine' ? _machineChipFilters : _itemChipFilters; }
function _activeChipFor(target)  { return target === 'machine' ? _activeMachineChip : _activeChip; }
function _setActiveChipFor(target, key) { if (target === 'machine') _activeMachineChip = key; else _activeChip = key; }

function _toggleChip(target, key) {
    var cur = _activeChipFor(target);
    _setActiveChipFor(target, cur === key ? null : key);
    _refreshChipBar(target);
    event.stopPropagation();
}

function _onChipOutsideClick(e) {
    if (_activeChip && !e.target.closest('#wiki-chip-bar')) {
        _activeChip = null;
        _refreshChipBar('item');
    }
    if (_activeMachineChip && !e.target.closest('#wiki-machine-chip-bar')) {
        _activeMachineChip = null;
        _refreshChipBar('machine');
    }
}

function _refreshChipBar(target) {
    if (target === 'machine') {
        var bar = document.getElementById('wiki-machine-chip-bar');
        if (bar) bar.innerHTML = _buildMachineChipBarInner();
        var af = document.getElementById('wiki-machine-active-filters');
        if (af) af.innerHTML = _buildActiveFiltersHTML('machine');
        _refreshMachineList();
    } else {
        var bar = document.getElementById('wiki-chip-bar');
        if (bar) bar.innerHTML = _buildChipBarInner();
        var af = document.getElementById('wiki-active-filters');
        if (af) af.innerHTML = _buildActiveFiltersHTML('item');
        _refreshItemGrid();
    }
}

function _buildChipBarInner() {
    var rawDB = (typeof DB !== 'undefined') ? DB : {};
    var catSet = new Set();
    Object.values(rawDB.items || {}).forEach(function(d) { if (d.category) catSet.add(d.category); });
    var cats = ['[All]'].concat(Array.from(catSet).sort());

    var CHIPS = [
        {
            key: 'category',
            label: function() {
                return _itemChipFilters.category
                    ? _tn(_itemChipFilters.category, 'categories')
                    : _tn('Category', 'ui');
            }
        },
        { key: 'tier',          label: function() { return _tn('Tier', 'ui');            } },
        { key: 'sell',          label: function() { return _tn('Sell Price', 'ui');      } },
        { key: 'wholesale',     label: function() { return _tn('Wholesale Price', 'ui'); } },
        { key: 'cauldronTarget',label: function() { return _tn('Cauldron Target', 'ui'); } }
    ];

    return CHIPS.map(function(c) {
        var isNumeric = c.key !== 'category';
        var f         = isNumeric ? _itemChipFilters[c.key] : null;
        var isActive  = isNumeric ? f.active : !!_itemChipFilters.category;
        var isOpen    = _activeChip === c.key;

        // suffix: active → clear ✕ button; else → chevron
        var suffix = isActive
            ? ` <span class="chip-clear" onclick="event.stopPropagation();_clearChip('item', '${c.key}')">✕</span>`
            : ' <span class="chip-arrow">' + (isOpen ? '▲' : '▾') + '</span>';

        return '<div class="wiki-chip-wrap">'
            + '<button class="wiki-filter-chip'
            + (isActive ? ' active' : '') + (isOpen && !isActive ? ' open' : '')
            + `" onclick="_toggleChip('item','` + c.key + `')">`
            + c.label() + suffix
            + '</button>'
            + (isOpen ? _buildChipPanelHTML('item', c.key, cats) : '')
            + '</div>';
    }).join('');
}

function _buildMachineChipBarInner() {
    var CHIPS = [
        { key: 'tier',     label: function() { return _tn('Tier', 'ui'); } },
        { key: 'heatCost', label: function() { return _tn('Heat Cost', 'ui'); } }
    ];
    return CHIPS.map(function(c) {
        var f        = _machineChipFilters[c.key];
        var isActive = f.active;
        var isOpen   = _activeMachineChip === c.key;
        var suffix = isActive
            ? ' <span class="chip-clear" onclick="event.stopPropagation();_clearChip(\'machine\',\'' + c.key + '\')">✕</span>'
            : ' <span class="chip-arrow">' + (isOpen ? '▲' : '▾') + '</span>';
        return '<div class="wiki-chip-wrap">'
            + '<button class="wiki-filter-chip' + (isActive ? ' active' : '') + (isOpen && !isActive ? ' open' : '')
            + '" onclick="_toggleChip(\'machine\',\'' + c.key + '\')">' + c.label() + suffix + '</button>'
            + (isOpen ? _buildChipPanelHTML('machine', c.key) : '')
            + '</div>';
    }).join('');
}

function _buildChipPanelHTML(target, key, cats) {
    if (key === 'category') {
        return '<div class="wiki-chip-panel">'
            + cats.map(function(cat) {
                var sel = (_itemChipFilters.category || '[All]') === cat;
                return '<button class="wiki-cat-btn' + (sel ? ' active' : '') + '" '
                    + _oc('_selectCategory', cat) + '>' + _tn(cat, 'categories') + '</button>';
            }).join('')
            + '</div>';
    }
    if (key === 'tier') {
        var f = _chipFiltersFor(target)[key];
        var tierBtns = '';
        for (var t = 1; t <= 9; t++) {
            var inRange = f.active
                && (f.min === '' || t >= parseInt(f.min))
                && (f.max === '' || t <= parseInt(f.max));
            tierBtns += '<button class="wiki-cat-btn' + (inRange ? ' active' : '') + '" style="width:30px; height:30px;"'
                + 'onclick="_setTierQuick(\'' + target + '\',' + t + ')">' + t + '</button>';
        }
        return '<div class="wiki-chip-panel" style="min-width:190px;">'
            + '<div style="width:100%; font-size:0.72em; color:#777; margin-bottom:2px;">' + _tn('Quick select (exact)') + '</div>'
            + tierBtns
            + '<div style="width:100%; height:1px; background:#333; margin:4px 0;"></div>'
            + '<label class="chip-panel-row"><span>Min</span>'
            + '<input type="number" class="chip-num-input" value="' + (f.min || '') + '" placeholder="1" min="1" max="9" style="width:30px; height:30px;"'
            + 'oninput="_onChipNum(\'' + target + '\',\'tier\',\'min\',this.value)"></label>'
            + '<label class="chip-panel-row"><span>Max</span>'
            + '<input type="number" class="chip-num-input" value="' + (f.max || '') + '" placeholder="9" min="1" max="9" style="width:30px; height:30px;"'
            + 'oninput="_onChipNum(\'' + target + '\',\'tier\',\'max\',this.value)"></label>'
            + '</div>';
    }

    // Numeric panel (sell / wholesale / cauldronTarget / heatCost)
    var f = _chipFiltersFor(target)[key];
    var isExistOnly = f.active && f.min === '' && f.max === '';
    return '<div class="wiki-chip-panel wiki-chip-panel-num">'
        + '<button class="chip-exist-btn' + (isExistOnly ? ' active' : '')
        + '" onclick="_toggleExistFilter(\'' + target + '\',\'' + key + '\')" title="Match items that have this property">' + _tn('Has Value') + '</button>'
        + '<label class="chip-panel-row"><span>Min</span>'
        + '<input type="number" class="chip-num-input" value="' + (f.min || '') + '" placeholder="—" '
        + 'oninput="_onChipNum(\'' + target + '\',\'' + key + '\',\'min\',this.value)"></label>'
        + '<label class="chip-panel-row"><span>Max</span>'
        + '<input type="number" class="chip-num-input" value="' + (f.max || '') + '" placeholder="—" '
        + 'oninput="_onChipNum(\'' + target + '\',\'' + key + '\',\'max\',this.value)"></label>'
        + '</div>';
}

function _buildActiveFiltersHTML(target) {
    if (target === 'machine') {
        var LABELS = { tier: _tn('Tier', 'ui'), heatCost: _tn('Heat Cost', 'ui') };
        var chips = [];
        ['tier', 'heatCost'].forEach(function(key) {
            var f = _machineChipFilters[key];
            if (!f.active) return;
            var range = (f.min !== '' || f.max !== '') ? (f.min || '*') + ' ~ ' + (f.max || '*') : '✓';
            chips.push('<span class="wiki-active-chip">' + LABELS[key] + ': ' + range
                + ' <button onclick="_clearChip(\'machine\',\'' + key + '\')">✕</button></span>');
        });
        if (!chips.length) return '';
        return '<div class="wiki-active-filter-bar">' + chips.join('')
            + '<button class="chip-clear-all" onclick="_clearAllChips(\'machine\')">Clear All</button></div>';
    }

    // target === 'item' (原本邏輯不變，僅按鈕改呼叫帶 'item')
    var LABELS = {
        tier: _tn('Tier', 'ui'), sell: _tn('Sell Price', 'ui'),
        wholesale: _tn('Wholesale Price', 'ui'), cauldronTarget: _tn('Cauldron Target', 'ui')
    };
    var chips = [];
    if (_itemChipFilters.category) {
        chips.push('<span class="wiki-active-chip">' + _tn(_itemChipFilters.category, 'categories')
            + ' <button onclick="_clearChip(\'item\',\'category\')">✕</button></span>');
    }
    ['tier', 'sell', 'wholesale', 'cauldronTarget'].forEach(function(key) {
        var f = _itemChipFilters[key];
        if (!f.active) return;
        var range = (f.min !== '' || f.max !== '') ? (f.min || '*') + ' ~ ' + (f.max || '*') : '✓';
        chips.push('<span class="wiki-active-chip">' + LABELS[key] + ': ' + range
            + ' <button onclick="_clearChip(\'item\',\'' + key + '\')">✕</button></span>');
    });
    if (!chips.length) return '';
    return '<div class="wiki-active-filter-bar">' + chips.join('')
        + '<button class="chip-clear-all" onclick="_clearAllChips(\'item\')">Clear All</button></div>';
}

function _selectCategory(cat) {
    _itemChipFilters.category = (cat === '[All]') ? null : cat;
    _activeChip = null;
    _refreshChipBar();
    event.stopPropagation();
}

function _onChipNum(target, key, field, val) {
    _chipFiltersFor(target)[key][field] = val;
    _chipFiltersFor(target)[key].active = true;
    var af = document.getElementById(target === 'machine' ? 'wiki-machine-active-filters' : 'wiki-active-filters');
    if (af) af.innerHTML = _buildActiveFiltersHTML(target);
    if (target === 'machine') _refreshMachineList(); else _refreshItemGrid();
    event.stopPropagation();
}

function _toggleExistFilter(target, key) {
    var f = _chipFiltersFor(target)[key];
    if (f.active && f.min === '' && f.max === '') {
        f.active = false;
    } else {
        f.active = true; f.min = ''; f.max = '';
    }
    _refreshChipBar(target);
    event.stopPropagation();
}

function _setTierQuick(target, t) {
    var tStr = String(t);
    _chipFiltersFor(target).tier = { active: true, min: tStr, max: tStr };
    _refreshChipBar(target);
}

function _clearChip(target, key) {
    if (target === 'item' && key === 'category') {
        _itemChipFilters.category = null;
    } else {
        _chipFiltersFor(target)[key] = { active: false, min: '', max: '' };
    }
    if (_activeChipFor(target) === key) _setActiveChipFor(target, null);
    _refreshChipBar(target);
    event.stopPropagation();
}

function _clearAllChips(target) {
    if (target === 'machine') {
        _machineChipFilters = {
            tier:     { active: false, min: '', max: '' },
            heatCost: { active: false, min: '', max: '' }
        };
        _activeMachineChip = null;
    } else {
        _itemChipFilters = {
            category: null,
            tier:          { active: false, min: '', max: '' },
            sell:          { active: false, min: '', max: '' },
            wholesale:     { active: false, min: '', max: '' },
            cauldronTarget:{ active: false, min: '', max: '' }
        };
        _activeChip = null;
    }
    _refreshChipBar(target);
    event.stopPropagation();
}

/* ─── 11. ITEM DETAIL ─────────────────────────────────────────────────────── */
function wikiSelectItem(name) {
    if (name === _selectedItem) {
        // 點擊相同項目 → 取消選取
        _selectedItem = null;
        // 移除所有高亮
        document.querySelectorAll('#wiki-item-grid .wiki-tile').forEach(el => el.classList.remove('selected'));
        // 清空右側詳細內容
        const pane = document.getElementById('wiki-right-pane');
        if (pane) pane.innerHTML = ''; 
        // 更新版面狀態（窄螢幕下將隱藏右側）
        _updateLayoutState();
        return;
    }
    // 正常選取流程
    _selectedItem = name;
    document.querySelectorAll('#wiki-item-grid .wiki-tile').forEach(el => {
        el.classList.toggle('selected', el.dataset.name === name);
    });
    _renderItemDetail(name);
    _updateLayoutState();
}

function _updateLayoutState() {
    var area = document.querySelector('.wiki-split-area');
    if (!area) return;
    var hasSelection = (_currentWikiView === 'items' && _selectedItem !== null) || (_currentWikiView === 'machines' && _selectedMachine !== null);
    area.classList.toggle('has-selection', hasSelection);
}

function _renderItemDetail(itemName) {
    var pane = document.getElementById('wiki-right-pane');
    if (!pane) return;
    var rawDB = (typeof DB !== 'undefined') ? DB : {};
    var def   = rawDB.items && rawDB.items[itemName];
    if (!def) { pane.innerHTML = '<div class="wiki-placeholder">' + _tn('Item data not found') + '</div>'; return; }

    var idx       = _getWikiIndex();
    var producers = idx.producedBy[itemName] || [];
    var consumers = idx.usedIn[itemName]     || [];
    var preferred = _getPreferred(itemName);

    /* Stats */
    var stats = [];
    if (def.tier           != null) stats.push([_tn('Tier'),            def.tier]);
    if (def.maxStack       != null) stats.push([_tn('Max Stack'),       def.maxStack]);
    if (def.buyPrice       != null) stats.push([_tn('Buy Price'),       def.buyPrice.toLocaleString()       + ' c']);
    if (def.sellPrice      != null) stats.push([_tn('Sell Price'),      def.sellPrice.toLocaleString()      + ' c']);
    if (def.wholesalePrice != null) stats.push([_tn('Wholesale Price'), def.wholesalePrice.toLocaleString() + ' c']);
    if (def.heat           != null) stats.push([_tn('Heat Value'),      def.heat          + ' P']);
    if (def.nutrientCost   != null) stats.push([_tn('Nutrient Cost'),   def.nutrientCost  + ' V/min']);
    if (def.nutrientValue  != null) stats.push([_tn('Nutrient Value'),  def.nutrientValue + ' V']);
    if (def.maxFertility   != null) stats.push([_tn('Max Fertility'),   def.maxFertility]);
    if (def.cauldronCost   != null) stats.push([_tn('Cauldron Cost'),   def.cauldronCost]);
    if (def.cauldronTarget != null) stats.push([_tn('Cauldron Target'), def.cauldronTarget]);
    var exp = def.exp || AlchemyCalcEngine.computeDecomposeExp(rawDB, itemName);
    if (exp && !def.exp && def.maxStack < 0) exp *= -def.maxStack;
    if (exp != null) stats.push([_tn('Decompose Exp'), Number(exp.toFixed(4))]);
    var decomposeTime = AlchemyCalcEngine.computeDecomposeTime(rawDB, itemName);
    if (decomposeTime && def.maxStack < 0) decomposeTime *= -def.maxStack;
    if (decomposeTime != null) stats.push([_tn('Decompose Time'), decomposeTime.toFixed(2) + ' s']);    
    if (def.charges        != null) stats.push([_tn('Charges'),         def.charges]);

    var statsHTML = stats.length
        ? '<div class="wiki-stats-grid">' + stats.map(function(s) {
            return '<span class="wiki-stat-key">' + s[0] + '</span><span class="wiki-stat-val">' + s[1] + '</span>';
          }).join('') + '</div>'
        : '';

    /* Produced by */
    var producersHTML = producers.length === 0
        ? '<p class="wiki-empty">' + _tn('No production recipes') + '</p>'
        : producers.map(function(recipe) {
            var isPreferred = preferred === recipe.id;
            var starHTML = '<button class="wiki-star' + (isPreferred ? ' active' : '') + '" title="'
                         + (isPreferred ? _tn('Remove Preferred') : _tn('Set as Preferred')) + '" '
                         + _oc2('_togglePreferred', itemName, recipe.id) + '>' + (isPreferred ? '★' : '☆') + '</button>';
            var hasIn   = Object.keys(recipe.inputs  || {}).length > 0;
            var inHTML  = hasIn ? _fmtItems(recipe.inputs) : '<em style="font-size:0.78em;color:#666">—</em>';
            var outHTML = _fmtItems(recipe.outputs || {});
            return '<div class="wiki-recipe-row' + (isPreferred ? ' preferred' : '') + '">'
                + starHTML
                + '<div class="wiki-recipe-formula">'
                + '<span class="wiki-items">' + inHTML  + '</span>'
                + '<span class="wiki-arrow">→</span>'
                + '<span class="wiki-items">' + outHTML + '</span>'
                + '</div>'
                + '<div class="wiki-recipe-right">'
                + '<span class="wiki-recipe-machine" ' + _oc('wikiSwitchToMachine', recipe.machine) + '>' + _tn(recipe.machine, 'machines') + '</span>'
                + (recipe.baseTime != null ? '<span>' + recipe.baseTime + 's</span>' : '')
                + '</div></div>';
          }).join('');

    /* Used in */
    var consumersHTML = consumers.length === 0
        ? '<p class="wiki-empty">' + _tn('Not used in any recipe') + '</p>'
        : consumers.map(function(recipe) {
            var inHTML  = _fmtItems(recipe.inputs  || {});
            var outHTML = _fmtItems(recipe.outputs || {});
            return '<div class="wiki-recipe-row">'
                + '<span class="wiki-star-ph"></span>'
                + '<div class="wiki-recipe-formula">'
                + '<span class="wiki-items">' + inHTML  + '</span>'
                + '<span class="wiki-arrow">→</span>'
                + '<span class="wiki-items">' + outHTML + '</span>'
                + '</div>'
                + '<div class="wiki-recipe-right">'
                + '<span class="wiki-recipe-machine" ' + _oc('wikiSwitchToMachine', recipe.machine) + '>' + _tn(recipe.machine, 'machines') + '</span>'
                + (recipe.baseTime != null ? '<span>' + recipe.baseTime + 's</span>' : '')
                + '</div></div>';
          }).join('');

    pane.innerHTML =
        '<div class="wiki-detail-header">'
        + _itemIcon(def.id, 32)
        + '<div class="wiki-detail-title-area">'
        + '<h2 class="wiki-detail-name">' + itemName + '</h2>'
        + '<div class="wiki-detail-meta"><span class="wiki-badge category">' + (_tn(def.category, 'categories') || '—') + '</span></div>'
        + '</div></div>'
        + (statsHTML ? '<div class="wiki-section"><div class="wiki-section-title">' + _tn('Properties') + '</div>' + statsHTML + '</div>' : '')
        + '<div class="wiki-section"><div class="wiki-section-title">' + _tn('Production Recipes') + ' (' + producers.length + ')</div>' + producersHTML + '</div>'
        + '<div class="wiki-section"><div class="wiki-section-title">' + _tn('Used In') + ' (' + consumers.length + ')</div>' + consumersHTML + '</div>';
}

/* ─── 12. MACHINE PAGE ────────────────────────────────────────────────────── */
function _buildMachineListHTML() {
    var rawDB    = (typeof DB !== 'undefined') ? DB : {};
    var machines = rawDB.machines || {};
    var entries  = Object.entries(machines);
    if (_machineFilter) {
        var f = _machineFilter.toLowerCase();
        entries = entries.filter(function(e) {
            return e[0].toLowerCase().includes(f) || _tn(e[0], 'machines').toLowerCase().includes(f);
        });
    }
    var tierF = _machineChipFilters.tier;
    if (tierF.active) {
        entries = entries.filter(function(e) {
            var val = e[1].tier;
            if (val == null) return false;
            if (tierF.min !== '' && val < parseInt(tierF.min)) return false;
            if (tierF.max !== '' && val > parseInt(tierF.max)) return false;
            return true;
        });
    }
    var heatF = _machineChipFilters.heatCost;
    if (heatF.active) {
        entries = entries.filter(function(e) {
            var val = e[1].heatCost;
            if (val == null) return false;
            if (heatF.min !== '' && val < parseFloat(heatF.min)) return false;
            if (heatF.max !== '' && val > parseFloat(heatF.max)) return false;
            return true;
        });
    }
    return entries.map(function(e) {
        var name = e[0];
        var sel  = name === _selectedMachine ? ' selected' : '';
        var machine = machines[name] || {};
        let badges = ' ';
        if(machine.heatCost || machine.isGenerator) badges += '🔥';
        if(machine.fertility) badges += '🌱';
        if(_tn("Glass", 'items') in machine["buildCost"]) badges += '💧';        
        const machineIcon = `<img src="img/machines/${name.toLowerCase().replaceAll(' ', '-')}.png" width="16" height="16" loading="lazy" onerror="this.style.opacity='0'">`;
        return '<div class="wiki-tile machine-tile' + sel + '" data-name="' + name.replace(/"/g, '&quot;') + '" '
            + _oc('wikiSelectMachine', name) + '>'
            + '<span>' + machineIcon + ' ' + _tn(name, 'machines') + badges + '</span></div>';
    }).join('');
}

function _buildMachineSplitHTML() {
    return '<div class="wiki-left-pane">'
        + '<div class="wiki-search-bar"><input type="text" class="wiki-search-input" id="wiki-machine-search"'
        + ' placeholder="' + _tn('Search machines...') + '" value="' + _machineFilter.replace(/"/g, '&quot;') + '"'
        + ' oninput="_machineFilter=this.value;_refreshMachineList()"></div>'
        + '<div class="wiki-chip-bar" id="wiki-machine-chip-bar">' + _buildMachineChipBarInner() + '</div>'
        + '<div id="wiki-machine-active-filters">' + _buildActiveFiltersHTML('machine') + '</div>'
        + '<div class="wiki-machine-list" id="wiki-machine-grid">' + _buildMachineListHTML() + '</div>'
        + '</div>'
        + '<div class="wiki-right-pane" id="wiki-right-pane"><div class="wiki-placeholder"></div></div>';
}

function _refreshMachineList() {
    var grid = document.getElementById('wiki-machine-grid');
    if (grid) grid.innerHTML = _buildMachineListHTML();
}

function wikiSelectMachine(name) {
    // 【切換邏輯】如果點擊的是當前選取的機器 → 取消選取
    if (name === _selectedMachine) {
        _selectedMachine = null;
        // 移除所有高亮樣式
        document.querySelectorAll('#wiki-machine-grid .wiki-tile').forEach(function(el) {
            el.classList.remove('selected');
        });
        // 清空右側詳細內容
        var pane = document.getElementById('wiki-right-pane');
        if (pane) pane.innerHTML = '';
        // 更新版面狀態（窄螢幕下將收回右側面板）
        _updateLayoutState();
        return;
    }

    // 【正常選取流程】
    _selectedMachine = name;
    document.querySelectorAll('#wiki-machine-grid .wiki-tile').forEach(function(el) {
        el.classList.toggle('selected', el.dataset.name === name);
    });
    _renderMachineDetail(name);
    _updateLayoutState();
}

function _renderMachineDetail(machineName) {
    var pane = document.getElementById('wiki-right-pane');
    if (!pane) return;
    var rawDB   = (typeof DB !== 'undefined') ? DB : {};
    var def     = rawDB.machines && rawDB.machines[machineName];
    if (!def) { pane.innerHTML = '<div class="wiki-placeholder">' + _tn('Machine data not found') + '</div>'; return; }
    var idx     = _getWikiIndex();
    var recipes = idx.machineRecipes[machineName] || [];

    /* Properties */
    var props = [];
    if (def.tier != null)                      props.push([_tn('Tier'),             def.tier]);
    if (def.isGenerator)                       props.push([_tn('Type'),             _tn('Heating Device')]);
    if (def.fertility)                         props.push([_tn('Type'),             _tn('Fertilizer Device')]);
    if (def.heatCost != null && def.heatCost > 0) props.push([_tn('Heat Cost'),     def.heatCost + ' P/s']);
    if (def.heatSelf != null)                  props.push([_tn('Heat Cost (Self)'), def.heatSelf + ' P/s']);
    if (def.slotsRequired != null)             props.push([_tn('Slots Required'),   def.slotsRequired]);
    if (def.slots != null)                     props.push([_tn('Max Slots'),        def.slots]);
    var propsHTML = props.length
        ? '<div class="wiki-stats-grid">' + props.map(function(p) {
            return '<span class="wiki-stat-key">' + p[0] + '</span><span class="wiki-stat-val">' + p[1] + '</span>';
          }).join('') + '</div>'
        : '';

    /* Build cost */
    var buildCost = def.buildCost || {};
    var buildCostHTML = Object.keys(buildCost).length > 0
        ? '<div class="wiki-build-cost">' + Object.entries(buildCost).map(function(e) {
            var item = e[0], qty = e[1];
            var itemDef = rawDB.items && rawDB.items[item];
            return '<div class="wiki-build-item" ' + _oc('wikiSwitchToItem', item) + '>'
                + _itemIcon(itemDef ? itemDef.id : 0, 22)
                + '<span>' + item + ' \xd7' + qty + '</span></div>';
          }).join('') + '</div>'
        : '<p class="wiki-empty">' + _tn('No build materials') + '</p>';

    /* Recipes */
    var recipesHTML = recipes.length === 0
        ? '<p class="wiki-empty">' + _tn('No recipes') + '</p>'
        : recipes.map(function(recipe) {
            var inHTML = Object.keys(recipe.inputs || {}).length > 0
                ? _fmtItems(recipe.inputs)
                : '<em style="font-size:0.78em;color:#666">—</em>';
            var outHTML = _fmtItems(recipe.outputs || {});
            return '<div class="wiki-recipe-row">'
                + '<span class="wiki-star-ph"></span>'
                + '<div class="wiki-recipe-formula">'
                + '<span class="wiki-items">' + inHTML  + '</span>'
                + '<span class="wiki-arrow">→</span>'
                + '<span class="wiki-items">' + outHTML + '</span>'
                + '</div>'
                + '<div class="wiki-recipe-right">'
                + (recipe.baseTime != null ? '<span>' + recipe.baseTime + 's</span>' : '')
                + '</div></div>';
          }).join('');

    pane.innerHTML =
        '<div class="wiki-detail-header">'
        + `<img src="img/machines/${machineName.toLowerCase().replaceAll(' ', '-')}.png" width="32" height="32" loading="lazy" class="wiki-icon" onerror="this.style.opacity='0'">`
        + '<div class="wiki-detail-title-area">'
        + '<h2 class="wiki-detail-name">' + _tn(machineName, 'machines') + '</h2>'
        + '</div></div>'
        + (propsHTML ? '<div class="wiki-section"><div class="wiki-section-title">' + _tn('Properties') + '</div>' + propsHTML + '</div>' : '')
        + '<div class="wiki-section"><div class="wiki-section-title">' + _tn('Build Cost') + '</div>' + buildCostHTML + '</div>'
        + '<div class="wiki-section"><div class="wiki-section-title">' + _tn('Production Recipes') + ' (' + recipes.length + ')</div>' + recipesHTML + '</div>';
}

/* ─── 12b. README / 完整說明 ───────────────────────────────────────────────── */
var _readmeCache = { en: null, zh: null };
var _readmeScrollContainer = null;
var _readmeScrollHandler = null;

function _currentReadmeLang() {
    return (window.ALCHEMY_I18N && window.ALCHEMY_I18N.enabled === false) ? 'en' : 'zh';
}

function _readmeUrlForLang(lang) {
    return lang === 'zh' ? 'README.zh-CN.md' : 'README.md';
}

function _buildReadmeAreaHTML() {
    return '<div class="wiki-readme-layout" id="wiki-readme-layout">'
        + '<div class="wiki-readme-area" id="wiki-readme-area">'
        + '<div class="md-container" id="wiki-readme-content"><div class="md-loading">' + _tn('Loading...') + '</div></div>'
        + '</div>'
        + '<div class="wiki-toc-sidebar" id="wiki-toc-sidebar">'
        + '<div class="wiki-toc-title">' + _tn('Table of Contents') + '</div>'
        + '<div class="wiki-toc-list" id="wiki-toc-list"></div>'
        + '</div>'
        + '<button class="wiki-toc-mobile-btn" id="wiki-toc-mobile-btn" onclick="_toggleReadmeTocDrawer()" title="' + _tn('Table of Contents') + '">☰</button>'
        + '<div class="wiki-toc-overlay" id="wiki-toc-overlay" onclick="_toggleReadmeTocDrawer(false)"></div>'
        + '</div>';
}

function _loadReadmeView() {
    var lang = _currentReadmeLang();
    var contentEl = document.getElementById('wiki-readme-content');
    if (!contentEl) return;

    if (_readmeCache[lang]) {
        _renderReadmeContent(_readmeCache[lang]);
        return;
    }

    // 優先使用內嵌的 README 內容 (js/alchemy_readme.js)，這樣本地 file:// 開啟也能正常顯示
    var embedded = window.ALCHEMY_README && window.ALCHEMY_README[lang];
    if (embedded) {
        var result = _mdToHtml(embedded);
        _readmeCache[lang] = result;
        _renderReadmeContent(result);
        return;
    }

    // Fallback：內嵌內容不存在時才嘗試 fetch (例如未載入 alchemy_readme.js)
    contentEl.innerHTML = '<div class="md-loading">' + _tn('Loading...') + '</div>';
    fetch(_readmeUrlForLang(lang))
        .then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
        })
        .then(function(text) {
            var result = _mdToHtml(text);
            _readmeCache[lang] = result;
            _renderReadmeContent(result);
        })
        .catch(function(err) {
            var liveEl = document.getElementById('wiki-readme-content');
            if (liveEl) {
                liveEl.innerHTML = '<div class="md-error">Failed to load ' + _readmeUrlForLang(lang)
                    + ' (' + err.message + ').<br>If you opened this file directly (file://), '
                    + 'your browser may block local fetches — try running it via a local server or the hosted version.</div>';
            }
        });
}

/** 將轉換結果 {html, toc} 灌入內容區與側邊欄，並重新綁定 scroll-spy */
function _renderReadmeContent(result) {
    var contentEl = document.getElementById('wiki-readme-content');
    if (contentEl) contentEl.innerHTML = result.html;
    _renderReadmeToc(result.toc);
    _attachReadmeScrollSpy();
}

/* ─── README TOC: render / scroll-spy / mobile drawer ─── */

function _renderReadmeToc(toc) {
    var listEl = document.getElementById('wiki-toc-list');
    if (!listEl) return;
    if (!toc || toc.length === 0) { listEl.innerHTML = ''; return; }
    listEl.innerHTML = toc.map(function(item) {
        return '<a href="#" class="wiki-toc-link wiki-toc-level-' + item.level + '" data-target="' + item.id + '" '
            + 'onclick="_onReadmeTocClick(event, \'' + item.id + '\')">' + _mdInline(item.text) + '</a>';
    }).join('');
}

function _onReadmeTocClick(e, id) {
    e.preventDefault();
    var target = document.getElementById(id);
    var container = document.getElementById('wiki-readme-area');
    if (target && container) {
        container.scrollTo({ top: target.offsetTop - 10, behavior: 'smooth' });
    }
    _setActiveTocLink(id);
    _toggleReadmeTocDrawer(false); // 桌面版本呼叫此函式為 no-op (沒有 .open class 可移除)
}

function _setActiveTocLink(id) {
    document.querySelectorAll('.wiki-toc-link').forEach(function(el) {
        el.classList.toggle('active', el.dataset.target === id);
    });
}

/** 用 scrollTop 與各標題 offsetTop 比對，滾動時高亮「目前捲動位置對應的最後一個標題」 */
function _attachReadmeScrollSpy() {
    if (_readmeScrollContainer && _readmeScrollHandler) {
        _readmeScrollContainer.removeEventListener('scroll', _readmeScrollHandler);
    }
    _readmeScrollContainer = null;
    _readmeScrollHandler = null;

    var container = document.getElementById('wiki-readme-area');
    var content = document.getElementById('wiki-readme-content');
    if (!container || !content) return;

    var headings = Array.prototype.slice.call(content.querySelectorAll('h2[id], h3[id]'));
    if (headings.length === 0) return;

    var TOC_SCROLL_BUFFER = 20; // 與 _onReadmeTocClick 的捲動偏移量 (-10) 搭配，避免剛好卡在邊界誤判

    function updateActive() {
        var scrollTop = container.scrollTop;
        var activeId = headings[0].id;
        for (var i = 0; i < headings.length; i++) {
            if (headings[i].offsetTop - TOC_SCROLL_BUFFER <= scrollTop) {
                activeId = headings[i].id;
            } else {
                break;
            }
        }
        _setActiveTocLink(activeId);
    }

    _readmeScrollContainer = container;
    _readmeScrollHandler = updateActive;
    container.addEventListener('scroll', _readmeScrollHandler, { passive: true });
    updateActive(); // 立即計算一次初始狀態
}

/** 手機版抽屜開關；force 為 true/false 時強制設定狀態，省略則切換目前狀態 */
function _toggleReadmeTocDrawer(force) {
    var sidebar = document.getElementById('wiki-toc-sidebar');
    var overlay = document.getElementById('wiki-toc-overlay');
    if (!sidebar || !overlay) return;
    var show = (typeof force === 'boolean') ? force : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', show);
    overlay.classList.toggle('open', show);
}

/* ─── Slugify heading text → stable, deduped anchor id ─── */
var _readmeSlugCounts = {};
function _slugify(rawText) {
    var s = rawText
        .replace(/[`*[\]()]/g, '')
        .trim().toLowerCase()
        .replace(/[^\w\u4e00-\u9fff]+/g, '-')
        .replace(/^-+|-+$/g, '');
    if (!s) s = 'section';
    var count = _readmeSlugCounts[s] || 0;
    _readmeSlugCounts[s] = count + 1;
    return count > 0 ? (s + '-' + count) : s;
}

/* ─── Simple hand-written Markdown → HTML converter (subset, tuned for this repo's README) ─── */

function _mdInline(text) {
    // Escape HTML first
    text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Inline code (before other inline rules so code content isn't touched further)
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic (single * not part of **, keep simple)
    text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    // Links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return text;
}

function _mdToHtml(md) {
    var lines = md.replace(/\r\n/g, '\n').split('\n');
    var html = [];
    var toc = [];
    _readmeSlugCounts = {}; // 每次重新轉換都重置，避免跨語言/重載時 id 累加
    var i = 0;
    var inList = null; // 'ul' | 'ol' | null
    var inCode = false;
    var codeBuf = [];

    function closeList() {
        if (inList) { html.push('</' + inList + '>'); inList = null; }
    }

    while (i < lines.length) {
        var line = lines[i];

        // Fenced code block
        if (/^```/.test(line)) {
            if (!inCode) {
                inCode = true; codeBuf = []; i++;
                continue;
            } else {
                inCode = false;
                html.push('<pre><code>' + codeBuf.join('\n')
                    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</code></pre>');
                i++;
                continue;
            }
        }
        if (inCode) { codeBuf.push(line); i++; continue; }

        // Blank line
        if (/^\s*$/.test(line)) { closeList(); i++; continue; }

        // Horizontal rule
        if (/^\s*---+\s*$/.test(line) && html.length > 0) { closeList(); html.push('<hr>'); i++; continue; }

        // Headings
        var hMatch = line.match(/^(#{1,4})\s+(.*)$/);
        if (hMatch) {
            closeList();
            var level = hMatch[1].length;
            var rawText = hMatch[2].trim();
            var headingId = null;
            if (level === 2 || level === 3) {
                headingId = _slugify(rawText);
                toc.push({ level: level, text: rawText, id: headingId });
            }
            html.push('<h' + level + (headingId ? ' id="' + headingId + '"' : '') + '>' + _mdInline(rawText) + '</h' + level + '>');
            i++;
            continue;
        }

        // Table (header line + separator line)
        if (/^\|.*\|\s*$/.test(line) && lines[i + 1] && /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
            closeList();
            var headerCells = line.trim().replace(/^\||\|$/g, '').split('|').map(function(c) { return c.trim(); });
            var rows = [];
            i += 2;
            while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) {
                var rowCells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map(function(c) { return c.trim(); });
                rows.push(rowCells);
                i++;
            }
            var t = '<table><thead><tr>' + headerCells.map(function(c) { return '<th>' + _mdInline(c) + '</th>'; }).join('') + '</tr></thead>';
            t += '<tbody>' + rows.map(function(r) {
                return '<tr>' + r.map(function(c) { return '<td>' + _mdInline(c) + '</td>'; }).join('') + '</tr>';
            }).join('') + '</tbody></table>';
            html.push(t);
            continue;
        }

        // Blockquote
        if (/^>\s?/.test(line)) {
            closeList();
            var quoteLines = [];
            while (i < lines.length && /^>\s?/.test(lines[i])) {
                quoteLines.push(lines[i].replace(/^>\s?/, ''));
                i++;
            }
            html.push('<blockquote>' + quoteLines.map(_mdInline).join('<br>') + '</blockquote>');
            continue;
        }

        // Unordered list
        var ulMatch = line.match(/^\s*[-*]\s+(.*)$/);
        if (ulMatch) {
            if (inList !== 'ul') { closeList(); html.push('<ul>'); inList = 'ul'; }
            html.push('<li>' + _mdInline(ulMatch[1]) + '</li>');
            i++;
            continue;
        }

        // Ordered list
        var olMatch = line.match(/^\s*\d+\.\s+(.*)$/);
        if (olMatch) {
            if (inList !== 'ol') { closeList(); html.push('<ol>'); inList = 'ol'; }
            html.push('<li>' + _mdInline(olMatch[1]) + '</li>');
            i++;
            continue;
        }

        // Paragraph (merge consecutive plain lines)
        closeList();
        var paraLines = [line];
        i++;
        while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,4})\s+/.test(lines[i])
               && !/^```/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^\s*\d+\.\s+/.test(lines[i])
               && !/^\|.*\|\s*$/.test(lines[i]) && !/^>\s?/.test(lines[i]) && !/^\s*---+\s*$/.test(lines[i])) {
            paraLines.push(lines[i]);
            i++;
        }
        html.push('<p>' + paraLines.map(_mdInline).join('<br>') + '</p>');
    }
    closeList();
    return { html: html.join('\n'), toc: toc };
}

/* ─── 13. GUIDES INNER HTML ───────────────────────────────────────────────── */

/* ─── 14. SUB-NAV SWITCHER ────────────────────────────────────────────────── */
function wikiSwitchView(view) {
    if (_readmeScrollContainer && _readmeScrollHandler) {
        _readmeScrollContainer.removeEventListener('scroll', _readmeScrollHandler);
        _readmeScrollContainer = null;
        _readmeScrollHandler = null;
    }
    _currentWikiView = view;
    document.querySelectorAll('.wiki-tab-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.dataset.view === view);
    });

    // Always remove the outside-click listener; re-add only when entering items view
    document.removeEventListener('click', _onChipOutsideClick);

    var area = document.getElementById('wiki-area');
    if (!area) return;

    if (view === 'items') {
        area.className = 'wiki-split-area';
        area.innerHTML = _buildItemSplitHTML();
        document.addEventListener('click', _onChipOutsideClick);
        if (_selectedItem) _renderItemDetail(_selectedItem);
    } else if (view === 'machines') {
        area.className = 'wiki-split-area';
        area.innerHTML = _buildMachineSplitHTML();
        document.addEventListener('click', _onChipOutsideClick);
        if (_selectedMachine) _renderMachineDetail(_selectedMachine);
    } else if (view === 'readme') {
        area.className = 'wiki-readme-area-wrap';
        area.innerHTML = _buildReadmeAreaHTML();
        _loadReadmeView();
    }
    _updateLayoutState();
}

/* ─── 15. ENTRY POINTS ────────────────────────────────────────────────────── */
function initHelpPage() {
    _injectHelpStyles();
    renderHelpPage();
}

function renderHelpPage() {
    var container = document.getElementById('view-help');
    if (!container) return;
    container.innerHTML =
        '<div id="help-inner">'
        + '<div class="wiki-subnav">'        
        + '<button class="wiki-tab-btn" data-view="items"    ' + _oc('wikiSwitchView', 'items')    + '>' + _tn('Items')    + '</button>'
        + '<button class="wiki-tab-btn" data-view="machines" ' + _oc('wikiSwitchView', 'machines') + '>' + _tn('Machines') + '</button>'
        + '<button class="wiki-tab-btn" data-view="readme"   ' + _oc('wikiSwitchView', 'readme')   + '>' + _tn('Full Documentation') + '</button>'
        + '</div>'
        + '<div id="wiki-area"></div>'
        + '</div>';
    wikiSwitchView(_currentWikiView);
}
