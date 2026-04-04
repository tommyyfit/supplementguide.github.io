// =================================================================
// --- SUPPLEMENT GUIDE PRO: CORE LOGIC ENGINE V3.5 ---
// =================================================================

const state = {
    stack:       [],
    weight:      80,
    gender:      "male",
    search:      "",
    category:    "All",
    darkMode:    localStorage.getItem('darkMode') === 'true',
    lang:        "cs",
    savedStacks: {},
    compareList: []
};

const grid  = document.getElementById("catalog-grid");
const wInput = document.getElementById("user-weight");
const modal  = document.getElementById("modal-backdrop");
let currentModalId = null;

// =================================================================
// 1. INIT
// =================================================================
function init() {
    const saved = localStorage.getItem('supplementGuideState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(state, parsed);
        } catch (e) { console.error("Load Error", e); }
    }

    // Reset transient filters
    state.search   = '';
    state.category = 'All';

    // Sanitize stack IDs
    const validIds = new Set((supplements || []).map(s => Number(s.id)));
    state.stack = (Array.isArray(state.stack) ? state.stack : [])
        .map(Number)
        .filter(id => validIds.has(id));

    // Sanitize compareList
    state.compareList = (Array.isArray(state.compareList) ? state.compareList : [])
        .map(Number)
        .filter(id => validIds.has(id));

    save();

    const wEl = wInput || document.getElementById('weight-input');
    if (wEl) wEl.value = state.weight ?? 80;

    const genderSel = document.getElementById("user-gender");
    if (genderSel) genderSel.value = state.gender || 'male';

    applyTheme(false);
    updateLanguageUI();
    render();
    analyze();
    renderCompareBar();
    setupEvents();
}

// =================================================================
// 2. EVENTS
// =================================================================
function setupEvents() {
    if (setupEvents._done) return;
    setupEvents._done = true;

    const debounce = (fn, ms = 160) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

    document.getElementById("search-input")?.addEventListener("input", debounce(e => { state.search = e.target.value; render(); }));

    const wEl = wInput || document.getElementById('weight-input');
    wEl?.addEventListener("change", e => { state.weight = parseInt(e.target.value, 10) || 80; save(); analyze(); });

    document.getElementById("user-gender")?.addEventListener("change", e => { state.gender = e.target.value; save(); analyze(); });
    document.getElementById("theme-toggle")?.addEventListener("click", toggleDarkMode);

    document.getElementById("lang-toggle")?.addEventListener("click", () => {
        state.lang = state.lang === "cs" ? "en" : "cs";
        save();
        updateLanguageUI();
        render();
        analyze();
        renderCompareBar();
        if (currentModalId) openModal(currentModalId);
        showToast(state.lang === "cs" ? "Jazyk: Čeština" : "Language: English");
    });

    (document.getElementById("filters") || document).addEventListener("click", e => {
        const btn = e.target.closest?.(".filter-btn");
        if (!btn) return;
        document.querySelectorAll(".filter-btn").forEach(b => {
            b.classList.remove("active", "bg-slate-900", "text-white", "dark:bg-white", "dark:text-black");
            b.classList.add("bg-slate-100", "text-slate-600", "dark:bg-[#2C2C2E]", "dark:text-slate-300");
        });
        btn.classList.add("active", "bg-slate-900", "text-white", "dark:bg-white", "dark:text-black");
        btn.classList.remove("bg-slate-100", "dark:bg-[#2C2C2E]");
        state.category = btn.dataset.cat || "All";
        render();
    });

    modal?.addEventListener("click", e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === "Escape") { closeModal(); closeExportModal(); } });
}

// =================================================================
// 3. THEME
// =================================================================
function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    localStorage.setItem('darkMode', state.darkMode);
    applyTheme(true);
}

function applyTheme(animate = true) {
    const html = document.documentElement;
    if (!animate) html.style.transition = 'none';
    html.classList.toggle('dark', !!state.darkMode);
    document.body.classList.toggle('dark', !!state.darkMode);
    document.getElementById("theme-icon-sun")?.classList.toggle('hidden', !!state.darkMode);
    document.getElementById("theme-icon-moon")?.classList.toggle('hidden', !state.darkMode);
    if (!animate) { void html.offsetHeight; html.style.transition = ''; }
}

// =================================================================
// 4. TRANSLATIONS — ZERO HARDCODED STRINGS
// =================================================================
function updateLanguageUI() {
    const t  = uiTranslations[state.lang];
    const l  = state.lang;
    const ss = id => { const el = document.getElementById(id); if (el) el.innerText = t[id.replace(/-/g,'').replace('ui','').replace('btn-txt-','').replace('ui-','')]; };

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };

    // Lang button
    set("lang-toggle", t.langCode);

    // Header gender select
    const gSel = document.getElementById("user-gender");
    if (gSel) {
        const mOpt = gSel.querySelector('option[value="male"]');
        const fOpt = gSel.querySelector('option[value="female"]');
        if (mOpt) mOpt.textContent = t.genderMale;
        if (fOpt) fOpt.textContent = t.genderFemale;
    }

    // Sidebar
    set("ui-stack-title",   t.stackTitle);
    set("ui-reset",         t.reset);
    set("ui-empty",         t.emptyStack);
    set("ui-user-label",    t.userLabel);
    set("ui-active-label",  t.activeLabel);
    set("ui-harmonogram",   t.harmonogram);
    set("ui-warning-title", t.warningTitle);

    // Schedule slots
    set("ui-morning", t.morning);
    set("ui-pre",     t.preWorkout);
    set("ui-intra",   t.intraWorkout);
    set("ui-post",    t.postWorkout);
    set("ui-evening", t.evening);

    // Action buttons
    set("btn-txt-save",   t.save);
    set("btn-txt-export", t.export);
    set("btn-txt-copy",   t.copy);
    set("btn-txt-share",  t.share);

    // Preset section
    set("ui-preset-title",    t.presetTitle);
    set("preset-btn-sleep",   t.presetSleep);
    set("preset-btn-strength",t.presetStrength);
    set("preset-btn-energy",  t.presetEnergy);
    set("preset-btn-focus",   t.presetFocus);
    set("preset-btn-health",  t.presetHealth);

    // Modal footer note
    set("ui-modal-footer-note", t.modalFooterNote);

    // Search placeholder
    const si = document.getElementById("search-input");
    if (si) si.placeholder = t.searchPlaceholder;

    // Filter buttons
    document.querySelectorAll(".filter-btn").forEach(btn => {
        const key = btn.dataset.cat;
        if (key && t.cats[key]) btn.innerText = t.cats[key];
    });

    // Re-render saved stacks area title
    set("ui-saved-profiles-title", t.savedProfilesTitle);

    // Re-analyze to refresh score/warning labels
    analyze();
}

// =================================================================
// 5. RENDER CATALOG
// =================================================================
function render() {
    if (!grid) return;
    const l    = state.lang;
    const t    = uiTranslations?.[l] || {};
    const cats = t.cats || {};

    try {
        const filtered = supplements.filter(item => {
            const term  = (state.search || "").toLowerCase();
            const iName = ((item.name?.[l] || item.name?.cs) || "").toLowerCase();
            const catOk = state.category === "All" || item.category === state.category;
            return catOk && iName.includes(term);
        });

        if (!filtered.length) {
            grid.innerHTML = `<div class="col-span-full text-center text-slate-400 py-10 opacity-60 text-sm">${t.notFound || 'No results'}</div>`;
            return;
        }

        const confColor = { high: '#22c55e', medium: '#f59e0b', low: '#94a3b8' };

        grid.innerHTML = filtered.map(item => {
            const active     = state.stack.includes(item.id);
            const nameText   = item.name?.[l] || item.name?.cs || '';
            const descText   = item.description?.[l] || item.description?.cs || '';
            const catLabel   = cats[item.category] || item.category || '';
            const dotColor   = confColor[item.confidence] || '#94a3b8';
            const confLabel  = t[`confidence${capitalize(item.confidence)}`] || '';

            return `
<div class="card-hover p-5 flex flex-col relative card-fade-in bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 rounded-3xl" onclick="openModal(${item.id})">
    <div class="flex justify-between items-start mb-3">
        <div class="w-12 h-12 flex items-center justify-center rounded-2xl text-2xl icon-bg-${item.category}">${item.icon || ''}</div>
        <span class="cat-badge-${item.category}">${catLabel}</span>
    </div>
    <h3 class="font-bold text-slate-900 dark:text-white text-lg mb-1 leading-tight tracking-tight">${esc(nameText)}</h3>
    <p class="text-sm text-slate-500 dark:text-slate-400 mb-1 line-clamp-2 font-medium">${esc(descText)}</p>
    <div class="card-conf-badge text-slate-400 dark:text-slate-500 mb-3">
        <span class="card-conf-dot" style="background:${dotColor}"></span>${esc(confLabel)}
    </div>
    <div class="mt-auto pt-4 border-t border-slate-50 dark:border-white/5 flex justify-between items-center">
        <button onclick="event.stopPropagation();openModal(${item.id})" class="text-xs font-black text-slate-400 hover:text-brand-500 uppercase tracking-widest transition">${t.detail || 'Details'}</button>
        <button onclick="event.stopPropagation();toggleItem(${item.id})" class="w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all font-bold ${active ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-brand-500'}">
            ${active ? '✓' : '+'}
        </button>
    </div>
</div>`;
        }).join('');

    } catch (err) {
        console.error('render error:', err);
        grid.innerHTML = `<div class="col-span-full text-center text-red-400 py-10">Rendering error — check console.</div>`;
    }
}

// =================================================================
// 6. MODAL
// =================================================================
function openModal(id) {
    currentModalId = id;
    const item = supplements.find(s => s.id === id);
    if (!item) return;
    const l = state.lang;
    const t = uiTranslations[l];

    document.getElementById("m-icon").innerText   = item.icon;
    document.getElementById("m-title").innerText  = item.name[l] || item.name.cs;
    document.getElementById("m-desc").innerText   = item.description[l] || item.description.cs;
    document.getElementById("m-category").innerText = t.cats[item.category] || item.category;
    document.getElementById("m-dosage").innerText = getDosage(item, l);
    document.getElementById("m-timing").innerText = item.timing[l] || item.timing.cs;

    // Confidence badge
    const confEl = document.getElementById("m-confidence");
    if (confEl) {
        const confMap = {
            high:   { color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800' },
            medium: { color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
            low:    { color: 'text-slate-500 bg-slate-50 dark:bg-slate-800/30 dark:text-slate-400 border-slate-200 dark:border-slate-700' }
        };
        const conf  = confMap[item.confidence] || confMap.low;
        const label = t[`confidence${capitalize(item.confidence)}`] || item.confidence;
        confEl.innerHTML = `<span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ${conf.color}">🔬 ${label}</span>`;
    }

    // Benefits
    document.getElementById("m-benefits").innerHTML =
        (item.benefits[l] || item.benefits.cs).map(b => `<li>• ${b}</li>`).join('');

    // Synergy & conflict
    const synEl = document.getElementById("m-synergy");
    const conEl = document.getElementById("m-conflict");
    synEl.innerHTML = item.synergy.length
        ? item.synergy.map(s => `<span class="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-brand-100 dark:border-brand-800">${s}</span>`).join('')
        : '<span class="text-slate-300 dark:text-slate-600 text-[10px]">—</span>';
    conEl.innerHTML = item.conflict.length
        ? item.conflict.map(c => `<span class="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-red-100 dark:border-red-800">${c}</span>`).join('')
        : '<span class="text-slate-300 dark:text-slate-600 text-[10px]">—</span>';

    // Studies
    const studiesContainer = document.getElementById("m-studies-container");
    const studiesList      = document.getElementById("m-studies");
    if (item.studies?.length) {
        studiesContainer.classList.remove("hidden");
        studiesList.innerHTML = item.studies.map((link, i) => `
            <a href="${link}" target="_blank" rel="noopener" class="flex items-center justify-between group/study bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5 hover:border-brand-500 transition-all">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${t.studyLabel} #${i + 1}</span>
                <svg class="w-3 h-3 text-slate-400 group-hover/study:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke-width="2.5"/></svg>
            </a>`).join('');
    } else {
        studiesContainer.classList.add("hidden");
    }

    // Compare button
    const cmpBtn = document.getElementById("m-compare-btn");
    if (cmpBtn) {
        const inList = state.compareList.includes(id);
        const full   = state.compareList.length >= 3 && !inList;
        cmpBtn.innerText  = inList ? `✓ ${t.compareBtn}` : t.compareBtn;
        cmpBtn.className  = `text-xs font-black px-4 py-3.5 rounded-2xl transition active:scale-95 border ${inList ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-transparent hover:bg-brand-500 hover:text-white'} ${full ? 'opacity-40 cursor-not-allowed' : ''}`;
        cmpBtn.onclick     = full ? null : () => toggleCompare(id);
    }

    // Add / Remove toggle
    const toggleBtn = document.getElementById("m-toggle-btn");
    const active    = state.stack.includes(id);
    toggleBtn.innerText = active ? t.removeStack : t.addStack;
    toggleBtn.onclick   = () => { toggleItem(id); closeModal(); };

    modal.classList.remove("hidden");
    requestAnimationFrame(() => modal.classList.remove("opacity-0"));
    document.body.style.overflow = "hidden";
}

function closeModal() {
    if (!modal) return;
    modal.classList.add("opacity-0");
    setTimeout(() => {
        modal.classList.add("hidden");
        document.body.style.overflow = "";
        currentModalId = null;
    }, 300);
}

// =================================================================
// 7. ANALYZE — SCHEDULE + CONFLICTS + STACK SCORE
// =================================================================
function analyze() {
    const items = state.stack.map(id => supplements.find(s => s.id === id)).filter(Boolean);
    const l = state.lang;
    const t = uiTranslations[l];

    document.getElementById("stack-count").innerText = items.length;
    const pd = document.getElementById("profile-display");
    if (pd) pd.innerText = `${state.gender === 'male' ? t.man : t.woman}, ${state.weight} kg`;

    const emptyEl    = document.getElementById("stack-empty");
    const analysisEl = document.getElementById("stack-analysis");

    if (!items.length) {
        emptyEl?.classList.remove("hidden");
        analysisEl?.classList.add("hidden");
        renderStackScore(0, 0, 0, t, 0);
        return;
    }

    emptyEl?.classList.add("hidden");
    analysisEl?.classList.remove("hidden");

    // Group into 5 timing slots
    const slots = { morning: [], pre: [], intra: [], post: [], evening: [] };
    items.forEach(item => {
        const timing = ((item.timing?.en || item.timing?.cs) || "").toLowerCase();
        const name   = item.name[l] || item.name.cs;
        const dose   = getDosage(item, l);
        const badge  = `
<div class="group bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 px-3 py-2 rounded-2xl text-xs font-bold dark:text-white shadow-sm flex justify-between items-center gap-2 transition-all hover:border-brand-500 cursor-pointer" onclick="openModal(${item.id})">
    <span class="truncate">${name}</span>
    <div class="flex items-center gap-2">
        <span class="text-brand-500 font-black">${dose}</span>
        <button type="button" data-remove-id="${item.id}" onclick="event.stopPropagation()" class="ml-1 text-red-500 hover:text-red-600 transition-all text-[14px] leading-none p-1">✕</button>
    </div>
</div>`;

        if (timing.includes("morning") || timing.includes("ráno") || timing.includes("dopoledne"))
            slots.morning.push(badge);
        else if (timing.includes("pre-workout") || timing.includes("před trénink"))
            slots.pre.push(badge);
        else if (timing.includes("intra") || timing.includes("during") || timing.includes("během"))
            slots.intra.push(badge);
        else if (timing.includes("post-workout") || timing.includes("po tréninku"))
            slots.post.push(badge);
        else
            slots.evening.push(badge);
    });

    const empty = `<span class="text-[10px] text-slate-400 italic pl-1">—</span>`;
    document.getElementById("schedule-morning").innerHTML = slots.morning.join('') || empty;
    document.getElementById("schedule-pre").innerHTML     = slots.pre.join('')    || empty;
    document.getElementById("schedule-intra").innerHTML   = slots.intra.join('')  || empty;
    document.getElementById("schedule-post").innerHTML    = slots.post.join('')   || empty;
    document.getElementById("schedule-evening").innerHTML = slots.evening.join('') || empty;

    // Bind remove buttons
    document.querySelectorAll("[data-remove-id]").forEach(btn => {
        btn.addEventListener("click", e => {
            e.stopPropagation();
            removeFromStack(Number(btn.dataset.removeId));
        }, { once: true });
    });

    // ── CONFLICT DETECTION ──────────────────────────────────────
    const warns = [];
    const has    = (name)  => items.some(i => i.contains?.some(c => c.toLowerCase().includes(name.toLowerCase())));
    const hasId  = (id)    => items.some(i => i.id === Number(id));
    const names  = (list)  => list.map(i => i.name[l] || i.name.cs).join(", ");

    if (has("zinek") && has("vápník"))
        warns.push(l === 'cs' ? "Vápník blokuje vstřebávání Zinku — užívej odděleně." : "Calcium blocks Zinc absorption — take separately.");

    if ((has("kofein") || has("caffeine")) && (has("melatonin") || hasId(41)))
        warns.push(l === 'cs' ? "Kofein a Melatonin jsou antagonisté — nekombinuj ve večerní rutině." : "Caffeine and Melatonin conflict — don't combine in evening.");

    if (has("NAC") && has("alkohol"))
        warns.push(l === 'cs' ? "NAC zvyšuje toxicitu při kombinaci s alkoholem." : "NAC + alcohol increases liver toxicity.");

    if (has("železo") && has("vápník"))
        warns.push(l === 'cs' ? "Vápník snižuje vstřebávání Železa — oddělit časování." : "Calcium reduces Iron absorption — separate timing.");

    if (has("probiotika") && has("antibiotika"))
        warns.push(l === 'cs' ? "Antibiotika ničí probiotika — užívej s 2h odstupem." : "Antibiotics destroy probiotics — take 2 hours apart.");

    if (hasId(52))  // Berberine
        warns.push(l === 'cs' ? "Berberin: konzultuj s lékařem při souběžné medikaci na diabetes." : "Berberine may amplify diabetes medications — consult a doctor.");

    if (has("tryptofan") && items.some(i => i.conflict?.some(c => c.toLowerCase().includes("ssri"))))
        warns.push(l === 'cs' ? "L-Tryptofan + SSRI: riziko serotoninového syndromu." : "L-Tryptophan + SSRI: serotonin syndrome risk.");

    const caffItems = items.filter(i => i.contains?.some(c => c.toLowerCase().includes("kofein") || c.toLowerCase().includes("caffeine")));
    if (caffItems.length >= 2)
        warns.push(l === 'cs'
            ? `Více zdrojů kofeinu: ${names(caffItems)} — pozor na předávkování (max ~400 mg/den).`
            : `Multiple caffeine sources: ${names(caffItems)} — watch for overdose (max ~400 mg/day).`);

    const wContainer = document.getElementById("warnings-container");
    const wList      = document.getElementById("warnings-list");
    if (warns.length) {
        wContainer?.classList.remove("hidden");
        wList.innerHTML = warns.map(w => `<li class="flex gap-2 items-start"><span class="shrink-0 mt-0.5">•</span><span>${w}</span></li>`).join("");
    } else {
        wContainer?.classList.add("hidden");
    }

    // ── STACK SCORE ──────────────────────────────────────────────
    // Synergy: check if any two items in the stack share a "contains" match with another item's synergy list
    let synergyCount = 0;
    items.forEach(item => {
        item.synergy.forEach(syn => {
            const synLower = syn.toLowerCase();
            const matched  = items.some(other =>
                other.id !== item.id &&
                (other.contains?.some(c => c.toLowerCase().includes(synLower)) ||
                 (other.name?.cs || '').toLowerCase().includes(synLower) ||
                 (other.name?.en || '').toLowerCase().includes(synLower))
            );
            if (matched) synergyCount++;
        });
    });

    const highConf = items.filter(i => i.confidence === 'high').length;
    renderStackScore(items.length, warns.length, synergyCount, t, highConf);
}

// ── STACK SCORE RENDERER ─────────────────────────────────────────
function renderStackScore(count, conflicts, synergies, t, highConf = 0) {
    const el = document.getElementById("stack-score-widget");
    if (!el) return;
    if (!count) { el.classList.add("hidden"); return; }
    el.classList.remove("hidden");

    let score = 40;
    score += Math.min(highConf * 8, 32);
    score += Math.min(synergies * 7, 21);
    score -= Math.min(conflicts * 13, 33);
    score  = Math.max(0, Math.min(100, Math.round(score)));

    let label, color, ring;
    if (score >= 80) { label = t.scoreExcellent; color = 'text-green-600 dark:text-green-400';  ring = '#22c55e'; }
    else if (score >= 60) { label = t.scoreGood;  color = 'text-brand-600 dark:text-brand-400'; ring = '#3b82f6'; }
    else if (score >= 40) { label = t.scoreFair;  color = 'text-yellow-600 dark:text-yellow-400'; ring = '#f59e0b'; }
    else                  { label = t.scoreWeak;  color = 'text-red-500 dark:text-red-400';     ring = '#ef4444'; }

    const C = 2 * Math.PI * 20;
    const d = ((score / 100) * C).toFixed(1);

    el.innerHTML = `
<div class="flex items-center gap-4">
    <div class="relative w-14 h-14 shrink-0">
        <svg class="w-14 h-14 -rotate-90" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="4" class="text-slate-100 dark:text-white/10"/>
            <circle cx="24" cy="24" r="20" fill="none" stroke="${ring}" stroke-width="4"
                stroke-dasharray="${d} ${C.toFixed(1)}" stroke-linecap="round"
                style="transition:stroke-dasharray .7s ease"/>
        </svg>
        <span class="absolute inset-0 flex items-center justify-center text-sm font-black ${color}">${score}</span>
    </div>
    <div class="min-w-0">
        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">${t.stackScore}</p>
        <p class="text-sm font-black ${color}">${label}</p>
        <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
            ${synergies > 0 ? `✅ ${synergies} ${t.scoreSynergy}` : ''}
            ${synergies > 0 && conflicts > 0 ? ' · ' : ''}
            ${conflicts > 0 ? `⚠️ ${conflicts} ${t.scoreConflicts}` : ''}
            ${!synergies && !conflicts ? '—' : ''}
        </p>
    </div>
</div>`;
}

// =================================================================
// 8. CORE ACTIONS
// =================================================================
function toggleItem(id) {
    id = Number(id);
    if (!Array.isArray(state.stack)) state.stack = [];
    const t   = uiTranslations[state.lang];
    const idx = state.stack.indexOf(id);
    if (idx > -1) { state.stack.splice(idx, 1); showToast(t.toastRemoved); }
    else           { state.stack.push(id);       showToast(t.toastAdded); }
    syncUI();
}

function removeFromStack(id) {
    state.stack = state.stack.filter(x => x !== Number(id));
    showToast(uiTranslations[state.lang].toastRemoved);
    syncUI();
}

function clearStack() {
    const t = uiTranslations[state.lang];
    if (!confirm(t.clearConfirm)) return;
    state.stack = [];
    syncUI();
}

function syncUI() { save(); render(); analyze(); }

function getDosage(item, lang) {
    if (item.id === 2)  return `${Math.round(state.weight * 0.35)} g`;
    if (item.id === 13) return `max 400 mg`;
    return item.dosage?.[lang] || item.dosage || '';
}

function save() {
    const { search, category, compareList, ...persisted } = state;
    localStorage.setItem('supplementGuideState', JSON.stringify(persisted));
}

// =================================================================
// 9. TOAST
// =================================================================
function showToast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const el = document.createElement('div');
    el.className = `toast flex items-center gap-2 border ${type === 'warn' ? 'border-yellow-500/50' : 'border-brand-500/50'}`;
    el.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span><span>${msg}</span>`;
    c.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 2500);
}

// =================================================================
// 10. SAVED STACKS
// =================================================================
const SAVED_KEY = "supplement_saved_stacks_v2";

function initSavedStacks() {
    try { state.savedStacks = JSON.parse(localStorage.getItem(SAVED_KEY) || '{}'); }
    catch { state.savedStacks = {}; }
    cleanupSavedStacks();
    renderSavedStacks();
}

function cleanupSavedStacks() {
    const valid = new Set(supplements.map(s => s.id));
    Object.keys(state.savedStacks).forEach(name => {
        const e = state.savedStacks[name];
        if (!e || !Array.isArray(e.stack)) { delete state.savedStacks[name]; return; }
        e.stack = e.stack.filter(id => valid.has(id));
        if (!e.stack.length) delete state.savedStacks[name];
    });
    persistSavedStacks();
}

function persistSavedStacks() {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(state.savedStacks)); } catch {}
}

function saveStackProfile() {
    const t = uiTranslations[state.lang];
    if (!state.savedStacks) state.savedStacks = {};
    let name = prompt(t.saveStackPrompt);
    if (!name?.trim()) return;
    name = name.trim();
    const exists = !!state.savedStacks[name];
    if (exists && !confirm(t.stackExists.replace('{name}', name))) return;
    state.savedStacks[name] = { stack: [...state.stack], weight: state.weight, gender: state.gender, date: new Date().toISOString() };
    persistSavedStacks();
    renderSavedStacks();
    showToast(exists ? t.stackOverwritten : t.stackSaved);
}

function loadSavedStack(name) {
    const t = uiTranslations[state.lang];
    const data = state.savedStacks[name];
    if (!data) return;
    if (!confirm(t.loadConfirm.replace('{name}', name))) return;
    const valid = new Set(supplements.map(s => s.id));
    state.stack  = data.stack.filter(id => valid.has(id));
    state.weight = data.weight;
    state.gender = data.gender;
    const wEl = wInput || document.getElementById('weight-input');
    if (wEl) wEl.value = state.weight;
    const gEl = document.getElementById("user-gender");
    if (gEl) gEl.value = state.gender;
    syncUI();
    showToast(t.stackLoaded);
}

function deleteSavedStack(name) {
    const t = uiTranslations[state.lang];
    if (!confirm(t.deleteConfirm.replace('{name}', name))) return;
    delete state.savedStacks[name];
    persistSavedStacks();
    renderSavedStacks();
    showToast(t.stackDeleted);
}

function renderSavedStacks() {
    const area = document.getElementById("saved-profiles-area");
    const list = document.getElementById("saved-profiles-list");
    if (!area || !list) return;
    const names = Object.keys(state.savedStacks || {});
    list.innerHTML = "";
    if (!names.length) { area.classList.add("hidden"); return; }
    area.classList.remove("hidden");
    names.forEach(name => {
        const row = document.createElement("div");
        row.className = "flex items-center justify-between bg-slate-100 dark:bg-[#1C1C1E] px-3 py-2 rounded-xl text-xs gap-2";
        const loadBtn = document.createElement("button");
        loadBtn.className = "flex-1 text-left font-bold truncate";
        loadBtn.textContent = name;
        loadBtn.onclick = () => loadSavedStack(name);
        const delBtn = document.createElement("button");
        delBtn.className = "text-red-400 hover:text-red-600 ml-2 font-bold";
        delBtn.textContent = "✕";
        delBtn.onclick = () => deleteSavedStack(name);
        row.appendChild(loadBtn);
        row.appendChild(delBtn);
        list.appendChild(row);
    });
}

// =================================================================
// 11. MOBILE STACK FAB
// =================================================================
document.addEventListener("DOMContentLoaded", () => {
    const BREAK = 1024;
    const fab      = document.getElementById("mobile-stack-fab");
    const sidebar  = document.getElementById("stack-sidebar");
    const stackCnt = document.getElementById("stack-count");
    const badge    = document.getElementById("fab-count");
    if (!fab || !sidebar) return;

    const overlay = document.createElement("div");
    overlay.id    = "mobile-stack-overlay";
    overlay.innerHTML = `<div class="stack-inner relative"><button class="stack-close-btn" aria-label="Zavřít">✕</button></div>`;
    document.body.appendChild(overlay);

    const inner    = overlay.querySelector(".stack-inner");
    const closeBtn = overlay.querySelector(".stack-close-btn");

    function openStack() {
        if (window.innerWidth >= BREAK) return;
        const clone = sidebar.firstElementChild?.cloneNode(true);
        if (clone) inner.appendChild(clone);
        overlay.classList.add("active");
        document.body.classList.add("stack-open");
        fab.setAttribute("aria-expanded", "true");
    }
    function closeStack() {
        overlay.classList.remove("active");
        document.body.classList.remove("stack-open");
        fab.setAttribute("aria-expanded", "false");
        setTimeout(() => inner.querySelectorAll(":scope > *:not(.stack-close-btn)").forEach(el => el.remove()), 200);
    }

    fab.addEventListener("click", () => overlay.classList.contains("active") ? closeStack() : openStack());
    closeBtn.addEventListener("click", closeStack);
    overlay.addEventListener("click", e => { if (e.target === overlay) closeStack(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeStack(); });
    window.addEventListener("resize", () => { if (window.innerWidth >= BREAK) closeStack(); });

    if (stackCnt && badge) {
        const updateBadge = () => {
            const n = parseInt(stackCnt.textContent) || 0;
            badge.textContent = n > 99 ? "99+" : n;
            badge.style.display = n > 0 ? "flex" : "none";
            badge.classList.add("badge-pop");
            setTimeout(() => badge.classList.remove("badge-pop"), 200);
        };
        updateBadge();
        new MutationObserver(updateBadge).observe(stackCnt, { childList: true, subtree: true });
    }
});

// =================================================================
// 12. EXPORT SYSTEM — V3.5 FULLY FIXED
// =================================================================

function exportStackText() {
    const t = uiTranslations[state.lang];
    if (!state.stack.length) { showToast(t.exportEmpty, 'warn'); return; }
    openExportModal();
}

function getFormattedDate() {
    const d  = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}.${mm}.${d.getFullYear()}`;
}

function getFileName(ext) {
    return `Supplement-Guide-STACK-${getFormattedDate().replaceAll('.', '-')}.${ext}`;
}

// Group all stack items into 5 timing buckets
function groupStackByTiming() {
    const groups = { morning: [], pre: [], intra: [], post: [], evening: [] };
    state.stack.forEach(id => {
        const s = supplements.find(x => x.id === Number(id));
        if (!s) return;
        const ti = ((s.timing?.en || s.timing?.cs) || '').toLowerCase();
        if      (ti.includes('morning') || ti.includes('ráno') || ti.includes('dopoledne')) groups.morning.push(s);
        else if (ti.includes('pre-workout') || ti.includes('před trénink'))                  groups.pre.push(s);
        else if (ti.includes('intra') || ti.includes('during') || ti.includes('během'))      groups.intra.push(s);
        else if (ti.includes('post-workout') || ti.includes('po tréninku'))                  groups.post.push(s);
        else                                                                                  groups.evening.push(s);
    });
    return groups;
}

// Build rich export lines for TXT
function buildExportLines(l) {
    const t      = uiTranslations[l];
    const groups = groupStackByTiming();
    const lines  = [];

    const section = (title, emoji, items) => {
        if (!items.length) return;
        lines.push(`─────────────────────────`);
        lines.push(`${emoji}  ${title}`);
        lines.push(`─────────────────────────`);
        items.forEach(s => {
            lines.push(`  ${s.icon}  ${s.name[l] || s.name.cs}`);
            lines.push(`     ${t.dose} ${getDosage(s, l)}`);
            lines.push(`     ${t.timing} ${s.timing[l] || s.timing.cs}`);
            const ben = (s.benefits[l] || s.benefits.cs).join(', ');
            lines.push(`     ${t.exportBenefits}: ${ben}`);
            if (s.synergy.length) lines.push(`     🤝 ${t.synergy}: ${s.synergy.join(', ')}`);
            if (s.conflict.length) lines.push(`     ⚠️ ${t.conflicts}: ${s.conflict.join(', ')}`);
            lines.push('');
        });
    };

    const sl = l === 'cs'
        ? { morning: 'Ráno', pre: 'Před tréninkem', intra: 'Během tréninku', post: 'Po tréninku', evening: 'Večer' }
        : { morning: 'Morning', pre: 'Pre-workout', intra: 'Intra-workout', post: 'Post-workout', evening: 'Evening' };

    section(sl.morning,  '🌅', groups.morning);
    section(sl.pre,      '🔥', groups.pre);
    section(sl.intra,    '💧', groups.intra);
    section(sl.post,     '💪', groups.post);
    section(sl.evening,  '🌙', groups.evening);

    return lines;
}

function buildExportHeader(l) {
    const t    = uiTranslations[l];
    const date = getFormattedDate();
    const prof = `${state.gender === 'male' ? t.exportMale : t.exportFemale}, ${state.weight} kg`;
    return [
        `╔══════════════════════════════╗`,
        `║   📦  SUPPLEMENT GUIDE V3.5  ║`,
        `╚══════════════════════════════╝`,
        `${t.exportAuthor}: tommyy.fit`,
        `${t.exportGenerated}: ${date}`,
        `${t.exportProfile}: ${prof}`,
        `${t.exportSectionHdr} (${state.stack.length})`,
        '',
    ].join('\n');
}

function openExportModal() {
    closeExportModal();
    const t       = uiTranslations[state.lang];
    const overlay = document.createElement("div");
    overlay.id    = "export-modal-overlay";
    overlay.className = "fixed inset-0 bg-black/60 z-[270] flex items-center justify-center";

    const box = document.createElement("div");
    box.className = "bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 w-[320px] shadow-2xl border dark:border-white/10";
    box.innerHTML = `
        <h3 class="text-lg font-black mb-1 text-slate-900 dark:text-white">${t.exportTitle}</h3>
        <p class="text-xs opacity-60 mb-5 text-slate-600 dark:text-slate-400">${t.exportSubtitle}</p>
        <div class="space-y-3">
            <button id="export-txt" class="w-full p-3.5 rounded-2xl bg-slate-100 dark:bg-white/10 font-bold text-slate-800 dark:text-white hover:bg-brand-500 hover:text-white transition active:scale-95 text-sm">📄 TXT</button>
            <button id="export-pdf" class="w-full p-3.5 rounded-2xl bg-slate-100 dark:bg-white/10 font-bold text-slate-800 dark:text-white hover:bg-brand-500 hover:text-white transition active:scale-95 text-sm">📑 PDF</button>
        </div>
        <button id="export-cancel" class="mt-5 w-full text-xs opacity-60 hover:opacity-100 transition font-bold text-slate-600 dark:text-slate-400">${t.exportCancel}</button>`;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById("export-txt").onclick    = () => { doTXTExport(); closeExportModal(); };
    document.getElementById("export-pdf").onclick    = () => { doPDFExport(); closeExportModal(); };
    document.getElementById("export-cancel").onclick = closeExportModal;
    overlay.addEventListener("click", e => { if (e.target === overlay) closeExportModal(); });
}

function closeExportModal() {
    document.getElementById("export-modal-overlay")?.remove();
}

// ── TXT EXPORT ───────────────────────────────────────────────────
function doTXTExport() {
    const l       = state.lang;
    const content = buildExportHeader(l) + buildExportLines(l).join("\n");
    const blob    = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url     = URL.createObjectURL(blob);
    const a       = Object.assign(document.createElement("a"), { href: url, download: getFileName("txt") });
    a.click();
    URL.revokeObjectURL(url);
    showToast(uiTranslations[state.lang].txtExportReady);
}

// ── PDF EXPORT — ALWAYS WHITE, FULL DETAILS ──────────────────────
function doPDFExport() {
    const l      = state.lang;
    const t      = uiTranslations[l];
    const groups = groupStackByTiming();
    const date   = getFormattedDate();
    const prof   = `${state.gender === 'male' ? t.exportMale : t.exportFemale}, ${state.weight} kg`;

    const slotLabels = l === 'cs'
        ? { morning: 'Ráno', pre: 'Před tréninkem', intra: 'Během tréninku', post: 'Po tréninku', evening: 'Večer' }
        : { morning: 'Morning', pre: 'Pre-workout', intra: 'Intra-workout', post: 'Post-workout', evening: 'Evening' };
    const slotEmoji  = { morning: '🌅', pre: '🔥', intra: '💧', post: '💪', evening: '🌙' };

    const renderSupp = s => {
        const ben = (s.benefits[l] || s.benefits.cs).join(' · ');
        const syn = s.synergy.length ? `<span style="color:#6b7280;font-size:11px;">🤝 ${s.synergy.join(', ')}</span>` : '';
        const con = s.conflict.length ? `<span style="color:#ef4444;font-size:11px;">⚠️ ${s.conflict.join(', ')}</span>` : '';
        return `
            <div style="display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid #f1f5f9;">
                <div style="font-size:28px;line-height:1;width:36px;text-align:center;">${s.icon}</div>
                <div style="flex:1;">
                    <div style="font-size:14px;font-weight:800;color:#111827;margin-bottom:4px;">${s.name[l] || s.name.cs}</div>
                    <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:4px;">
                        <span style="font-size:12px;color:#374151;"><b>${t.dose}</b> ${getDosage(s, l)}</span>
                        <span style="font-size:12px;color:#374151;"><b>${t.timing}</b> ${s.timing[l] || s.timing.cs}</span>
                    </div>
                    <div style="font-size:11px;color:#6b7280;margin-bottom:3px;">${ben}</div>
                    <div style="display:flex;gap:12px;flex-wrap:wrap;">${syn}${con}</div>
                </div>
            </div>`;
    };

    const renderSection = (key) => {
        const items = groups[key];
        if (!items.length) return '';
        return `
            <div style="margin-bottom:28px;">
                <div style="background:#f8fafc;border-left:4px solid #3b82f6;padding:10px 16px;border-radius:0 8px 8px 0;margin-bottom:4px;">
                    <span style="font-size:16px;font-weight:900;color:#1e40af;">${slotEmoji[key]} ${slotLabels[key]}</span>
                </div>
                ${items.map(renderSupp).join('')}
            </div>`;
    };

    const wrapper = document.createElement("div");
    wrapper.style.cssText = "padding:48px;font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;color:#111827;background:#ffffff;width:794px;line-height:1.6;";

    wrapper.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:20px;margin-bottom:28px;border-bottom:2px solid #e5e7eb;">
            <div>
                <h1 style="font-size:28px;font-weight:900;color:#111827;margin:0;">📦 Supplement Guide <span style="color:#3b82f6;">V3.5</span></h1>
                <div style="font-size:12px;color:#9ca3af;margin-top:4px;">tommyy.fit · ${date}</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:12px;color:#6b7280;font-weight:600;">${t.exportProfile}</div>
                <div style="font-size:14px;font-weight:800;color:#111827;">${prof}</div>
                <div style="font-size:11px;color:#9ca3af;margin-top:2px;">${state.stack.length} ${l === 'cs' ? 'doplňků' : 'supplements'}</div>
            </div>
        </div>
        ${renderSection('morning')}
        ${renderSection('pre')}
        ${renderSection('intra')}
        ${renderSection('post')}
        ${renderSection('evening')}
        <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center;">
            ${t.disclaimer} · Supplement Guide V3.5 · tommyy.fit
        </div>`;

    const opt = {
        margin:     10,
        filename:   getFileName("pdf"),
        image:      { type: 'jpeg', quality: 0.98 },
        html2canvas:{ scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF:      { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(wrapper).save().then(() => {
        showToast(uiTranslations[state.lang].pdfExportReady);
    });
}

// =================================================================
// 13. COPY & SHARE
// =================================================================
function copyStackToClipboard() {
    const t = uiTranslations[state.lang];
    if (!state.stack.length) { showToast(t.stackEmpty, 'warn'); return; }
    const l       = state.lang;
    const content = buildExportHeader(l) + buildExportLines(l).join("\n");
    copyToClipboard(content, () => showToast(`${t.copy} ✅`));
}

function shareStack() {
    const t = uiTranslations[state.lang];
    if (!state.stack.length) { showToast(t.stackEmpty, 'warn'); return; }
    try {
        const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify({ stack: state.stack, weight: state.weight, gender: state.gender })))));
        copyToClipboard(`${location.origin}${location.pathname}?stack=${encoded}`, () => showToast(t.linkCopied));
    } catch (e) { showToast("Share failed", 'warn'); }
}

function loadStackFromURL() {
    const encoded = new URLSearchParams(location.search).get("stack");
    if (!encoded) return;
    try {
        const data = JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(encoded)))));
        if (!data.stack || !Array.isArray(data.stack)) return;
        const valid   = new Set(supplements.map(s => s.id));
        state.stack   = data.stack.filter(id => valid.has(id));
        state.weight  = data.weight  || state.weight;
        state.gender  = data.gender  || state.gender;
        save();
        showToast(uiTranslations[state.lang].stackImported);
        history.replaceState(null, "", location.pathname);
    } catch { showToast(uiTranslations[state.lang].invalidLink, 'warn'); }
}

function copyToClipboard(text, onSuccess) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallbackCopy(text, onSuccess));
    } else { fallbackCopy(text, onSuccess); }
}
function fallbackCopy(text, onSuccess) {
    const ta = Object.assign(document.createElement("textarea"), { value: text, style: "position:fixed;opacity:0" });
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); onSuccess?.(); } catch {}
    ta.remove();
}

// =================================================================
// 14. PRESET STACKS
// =================================================================
const presetStacks = {
    sleep:    [41, 42, 43, 24, 47],
    strength: [1,  2,  4,  5,  10],
    energy:   [13, 14, 15, 18, 20],
    focus:    [16, 17, 21, 22, 14],
    health:   [26, 27, 28, 24, 35]
};

function loadPreset(key) {
    const ids = presetStacks[key];
    if (!ids) return;
    const t     = uiTranslations[state.lang];
    const valid = new Set(supplements.map(s => s.id));
    state.stack = ids.filter(id => valid.has(id));
    syncUI();
    showToast(`${t.presetLoaded}: ${t['preset' + capitalize(key)]}`);
}

// =================================================================
// 15. COMPARE
// =================================================================
function toggleCompare(id) {
    id = Number(id);
    const t   = uiTranslations[state.lang];
    const idx = state.compareList.indexOf(id);
    if (idx > -1) { state.compareList.splice(idx, 1); }
    else {
        if (state.compareList.length >= 3) { showToast(t.compareMax, 'warn'); return; }
        state.compareList.push(id);
    }
    renderCompareBar();
    if (currentModalId) openModal(currentModalId);
}

function clearCompare() {
    state.compareList = [];
    renderCompareBar();
    if (currentModalId) openModal(currentModalId);
}

function renderCompareBar() {
    const bar = document.getElementById("compare-bar");
    if (!bar) return;
    const l = state.lang;
    const t = uiTranslations[l];

    if (!state.compareList.length) { bar.classList.add("hidden"); return; }
    bar.classList.remove("hidden");

    const chips = state.compareList
        .map(id => supplements.find(s => s.id === id)).filter(Boolean)
        .map(s => `<span class="bg-white/20 text-white px-2.5 py-1 rounded-xl text-xs font-bold">${s.icon} ${s.name[l] || s.name.cs}</span>`)
        .join('');

    bar.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-2 flex-wrap">
                <span class="text-[10px] font-black uppercase tracking-widest text-white/70">${t.compareTitle}</span>
                ${chips}
            </div>
            <div class="flex items-center gap-3">
                ${state.compareList.length >= 2
                    ? `<button onclick="openCompareModal()" class="bg-white text-brand-700 text-xs font-black px-4 py-2 rounded-xl transition hover:bg-brand-50 active:scale-95">${t.compareTitle}</button>`
                    : `<span class="text-[10px] text-white/60 font-medium">${t.compareAddOne}</span>`}
                <button onclick="clearCompare()" class="text-[10px] text-white/60 hover:text-white font-bold transition">${t.compareClear}</button>
            </div>
        </div>`;
}

function openCompareModal() {
    const l     = state.lang;
    const t     = uiTranslations[l];
    const items = state.compareList.map(id => supplements.find(s => s.id === id)).filter(Boolean);
    if (items.length < 2) return;

    document.getElementById("compare-modal-overlay")?.remove();

    const overlay = document.createElement("div");
    overlay.id        = "compare-modal-overlay";
    overlay.className = "fixed inset-0 bg-black/60 z-[260] flex items-start justify-center p-4 overflow-y-auto backdrop-blur-sm";

    const colH = items.map(s => `
        <div class="flex-1 min-w-0 text-center p-4 border-r last:border-r-0 border-slate-100 dark:border-white/5">
            <div class="text-3xl mb-2">${s.icon}</div>
            <div class="font-black text-sm text-slate-900 dark:text-white">${s.name[l] || s.name.cs}</div>
            <div class="text-[9px] uppercase tracking-widest text-slate-400 mt-1">${t.cats[s.category] || s.category}</div>
        </div>`).join('');

    const row = (label, fn) => {
        const cells = items.map(s => `<div class="flex-1 min-w-0 p-3 border-r last:border-r-0 border-slate-100 dark:border-white/5 text-xs font-medium text-slate-700 dark:text-slate-300">${fn(s)}</div>`).join('');
        return `<div>
            <div class="px-4 py-2 bg-slate-50/80 dark:bg-white/5 border-y border-slate-100 dark:border-white/5">
                <span class="text-[9px] font-black uppercase tracking-widest text-slate-400">${label}</span>
            </div>
            <div class="flex">${cells}</div>
        </div>`;
    };

    overlay.innerHTML = `
        <div class="w-full max-w-2xl bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden my-8">
            <div class="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                <h3 class="font-black text-slate-900 dark:text-white text-lg">${t.compareTitle}</h3>
                <button onclick="document.getElementById('compare-modal-overlay').remove()" class="p-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>
            <div class="overflow-x-auto">
                <div class="flex border-b border-slate-100 dark:border-white/5 min-w-0">${colH}</div>
                ${row(t.compareDosage, s => getDosage(s, l))}
                ${row(t.compareTiming, s => s.timing[l] || s.timing.cs)}
                ${row(t.compareBenef,  s => (s.benefits[l] || s.benefits.cs).join(', '))}
                ${row(t.compareSyn,    s => s.synergy.length ? s.synergy.join(', ') : '—')}
                ${row(t.compareCon,    s => s.conflict.length ? s.conflict.join(', ') : '—')}
                ${row(t.compareEvid,   s => t[`confidence${capitalize(s.confidence)}`] || s.confidence)}
            </div>
            <div class="p-4 border-t border-slate-100 dark:border-white/5">
                <button onclick="document.getElementById('compare-modal-overlay').remove()" class="w-full py-3 rounded-2xl bg-brand-600 text-white font-black text-sm transition hover:bg-brand-500 active:scale-95">${t.compareClose}</button>
            </div>
        </div>`;

    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
}

// =================================================================
// 16. HELPERS
// =================================================================
function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function esc(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// =================================================================
// LAUNCH
// =================================================================
loadStackFromURL();
init();
initSavedStacks();
