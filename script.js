// =================================================================
// --- SUPPLEMENT GUIDE PRO: CORE LOGIC ENGINE (ULTRA SMOOTH) ---
// =================================================================

const state = {
    stack: [],
    weight: 80,
    gender: "male",
    search: "",
    category: "All",
    darkMode: localStorage.getItem('darkMode') === 'true',
    lang: "cs",
    savedStacks: {}
};

const grid = document.getElementById("catalog-grid");
const wInput = document.getElementById("user-weight");
const modal = document.getElementById("modal-backdrop");
let currentModalId = null;

// --- 1. INITIALIZATION ---
function init() {
    // Načtení stavu
    const saved = localStorage.getItem('supplementGuideState');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.assign(state, parsed);
        } catch (e) { console.error("Load Error", e); }
    }

    if (wInput) wInput.value = state.weight;
    const genderSel = document.getElementById("user-gender");
    if (genderSel) genderSel.value = state.gender;

    // Okamžitá aplikace tématu před vykreslením (smooth start)
    applyTheme(false);
    updateLanguageUI();
    render();
    analyze();
    setupEvents();
}

function setupEvents() {
    document.getElementById("search-input")?.addEventListener("input", (e) => {
        state.search = e.target.value;
        render();
    });

    wInput?.addEventListener("change", (e) => {
        state.weight = parseInt(e.target.value) || 80;
        save(); analyze();
    });

    document.getElementById("user-gender")?.addEventListener("change", (e) => {
        state.gender = e.target.value;
        save(); analyze();
    });

    document.getElementById("theme-toggle")?.addEventListener("click", toggleDarkMode);

    document.getElementById("lang-toggle")?.addEventListener("click", () => {
        state.lang = state.lang === "cs" ? "en" : "cs";
        save();
        updateLanguageUI();
        render();
        analyze();
        if (currentModalId) openModal(currentModalId);
        showToast(state.lang === "cs" ? "Jazyk: Čeština" : "Language: English");
    });

    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn").forEach(b => {
                b.classList.remove("active", "bg-slate-900", "text-white", "dark:bg-white", "dark:text-black");
                b.classList.add("bg-slate-100", "text-slate-600", "dark:bg-[#2C2C2E]", "dark:text-slate-300");
            });
            btn.classList.add("active", "bg-slate-900", "text-white", "dark:bg-white", "dark:text-black");
            btn.classList.remove("bg-slate-100", "dark:bg-[#2C2C2E]");
            state.category = btn.dataset.cat;
            render();
        });
    });

    if (modal) modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', e => { if (e.key === "Escape") closeModal(); });
}

// --- 2. THEME ENGINE (SMOOTH TRANSITION) ---
function toggleDarkMode() {
    state.darkMode = !state.darkMode;
    localStorage.setItem('darkMode', state.darkMode);
    applyTheme(true); // Zapne animovaný přechod
}

function applyTheme(animate = true) {
    const html = document.documentElement;
    const sunIcon = document.getElementById("theme-icon-sun");
    const moonIcon = document.getElementById("theme-icon-moon");

    // Pokud nechceme animaci (při loadu), dočasně ji vypneme
    if (!animate) html.style.transition = 'none';

    if (state.darkMode) {
        html.classList.add('dark');
        document.body.classList.add('dark');
        if (sunIcon) sunIcon.classList.add('hidden');
        if (moonIcon) moonIcon.classList.remove('hidden');
    } else {
        html.classList.remove('dark');
        document.body.classList.remove('dark');
        if (sunIcon) sunIcon.classList.remove('hidden');
        if (moonIcon) moonIcon.classList.add('hidden');
    }

    if (!animate) {
        // Vynutíme překreslení a vrátíme animace zpět
        window.getComputedStyle(html).opacity;
        html.style.transition = '';
    }
}

// --- 3. UI & TRANSLATIONS ---
function updateLanguageUI() {
    const t = uiTranslations[state.lang]; // Bere data z translations.js
    document.getElementById("lang-toggle").innerText = state.lang.toUpperCase();

    const safeSetText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    safeSetText("btn-txt-save", t.save);
    safeSetText("btn-txt-export", t.export);
    safeSetText("btn-txt-copy", t.copy);
    safeSetText("btn-txt-share", t.share);
    safeSetText("ui-stack-title", t.stackTitle);
    safeSetText("ui-reset", t.reset);
    safeSetText("ui-empty", t.emptyStack);
    safeSetText("ui-morning", t.morning);
    safeSetText("ui-pre", t.preWorkout);
    safeSetText("ui-post", t.postWorkout);
    safeSetText("ui-evening", t.evening);
    safeSetText("ui-warning", t.warning);

    const searchInput = document.getElementById("search-input");
    if (searchInput) searchInput.placeholder = t.searchPlaceholder;

    document.querySelectorAll(".filter-btn").forEach(btn => {
        const catKey = btn.dataset.cat;
        if (t.cats[catKey]) btn.innerText = t.cats[catKey];
    });
}

// --- 4. RENDERING CATALOG ---
function render() {
    if (!grid) return;
    const l = state.lang;
    const t = uiTranslations[l];

    const filtered = supplements.filter(item => {
        const term = (state.search || "").toLowerCase();
        const iName = (item.name[l] || item.name.cs).toLowerCase();
        const catMatch = state.category === "All" || item.category === state.category;
        return catMatch && iName.includes(term);
    });

    if (filtered.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center text-slate-400 py-10 opacity-60 text-sm">${t.notFound}</div>`;
        return;
    }

    grid.innerHTML = filtered.map(item => {
        const active = state.stack.includes(item.id);
        return `
        <div class="card-hover p-5 flex flex-col relative card-fade-in bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 rounded-3xl" onclick="openModal(${item.id})">
            <div class="flex justify-between items-start mb-3">
                <div class="w-12 h-12 flex items-center justify-center rounded-2xl text-2xl icon-bg-${item.category}">${item.icon}</div>
                <span class="cat-badge-${item.category}">${t.cats[item.category] || item.category}</span>
            </div>
            <h3 class="font-bold text-slate-900 dark:text-white text-lg mb-1 leading-tight tracking-tight">${item.name[l]}</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 font-medium">${item.description[l]}</p>
            <div class="mt-auto pt-4 border-t border-slate-50 dark:border-white/5 flex justify-between items-center" onclick="event.stopPropagation()">
                <button onclick="openModal(${item.id})" class="text-xs font-black text-slate-400 hover:text-brand-500 uppercase tracking-widest transition">${t.detail}</button>
                <button onclick="toggleItem(${item.id})" class="w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all font-bold ${active ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-brand-500'}">
                    ${active ? '✓' : '+'}
                </button>
            </div>
        </div>`;
    }).join('');
}

// --- 5. MODAL LOGIC (INCLUDING STUDIES ACCORDION) ---
function openModal(id) {
    currentModalId = id;
    const item = supplements.find(s => s.id === id); // Bere data ze supplements.js
    if (!item) return;
    const l = state.lang;
    const t = uiTranslations[l];

    document.getElementById("m-icon").innerText = item.icon;
    document.getElementById("m-title").innerText = item.name[l];
    document.getElementById("m-desc").innerText = item.description[l];
    document.getElementById("m-category").innerText = t.cats[item.category];
    document.getElementById("m-dosage").innerText = getDosage(item, l);
    document.getElementById("m-timing").innerText = item.timing[l];

    const benefitsList = document.getElementById("m-benefits");
    benefitsList.innerHTML = (item.benefits[l] || item.benefits.cs).map(b => `<li>• ${b}</li>`).join('');

    const synEl = document.getElementById("m-synergy");
    const conEl = document.getElementById("m-conflict");
    synEl.innerHTML = item.synergy.length ? item.synergy.map(s => `<span class="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-brand-100 dark:border-brand-800">${s}</span>`).join('') : '<span class="text-slate-300 text-[10px]">--</span>';
    conEl.innerHTML = item.conflict.length ? item.conflict.map(c => `<span class="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-red-100 dark:border-red-800">${c}</span>`).join('') : '<span class="text-slate-300 text-[10px]">--</span>';

    const studiesContainer = document.getElementById("m-studies-container");
    const studiesList = document.getElementById("m-studies");
    if (item.studies && item.studies.length > 0) {
        studiesContainer.classList.remove("hidden");
        studiesList.innerHTML = item.studies.map((link, index) => `
            <a href="${link}" target="_blank" class="flex items-center justify-between group/study bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5 hover:border-brand-500 transition-all">
                <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Vědecká studie #${index + 1}</span>
                <svg class="w-3 h-3 text-slate-400 group-hover/study:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke-width="2.5"/></svg>
            </a>
        `).join('');
    } else {
        studiesContainer.classList.add("hidden");
    }

    const toggleBtn = document.getElementById("m-toggle-btn");
    const active = state.stack.includes(id);
    toggleBtn.innerText = active ? t.removeStack : t.addStack;
    toggleBtn.onclick = () => { toggleItem(id); closeModal(); };

    modal.classList.remove("hidden");
    setTimeout(() => modal.classList.remove("opacity-0"), 10);
    document.body.style.overflow = "hidden";
}

function closeModal() {
    modal.classList.add("opacity-0");
    setTimeout(() => {
        modal.classList.add("hidden");
        document.body.style.overflow = "";
        currentModalId = null;
    }, 300);
}

// --- 6. STACK ANALYSIS & TIMELINE ---
function analyze() {
    const items = state.stack.map(id => supplements.find(s => s.id === id)).filter(Boolean);
    const l = state.lang;
    const t = uiTranslations[l];

    document.getElementById("stack-count").innerText = items.length;
    const profileDisplay = document.getElementById("profile-display");
    if (profileDisplay) profileDisplay.innerText = `${state.gender === 'male' ? t.man : t.woman}, ${state.weight}kg`;

    const empty = document.getElementById("stack-empty");
    const analysis = document.getElementById("stack-analysis");

    if (items.length === 0) {
        empty.classList.remove("hidden");
        analysis.classList.add("hidden");
        return;
    }

    empty.classList.add("hidden");
    analysis.classList.remove("hidden");

    const slots = { morning: [], pre: [], post: [], evening: [] };

    items.forEach(item => {
        const name = item.name[l];
        const timing = (item.timing.en || "").toLowerCase();
        const dose = getDosage(item, l);

        const badge = `
        <div class="group bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 px-3 py-2 rounded-2xl text-xs font-bold dark:text-white shadow-sm flex justify-between items-center gap-2 transition-all hover:border-red-500/20">
            <span class="truncate">${name}</span>

            <div class="flex items-center gap-2">
                <span class="text-brand-500 font-black">${dose}</span>

                <button
                    type="button"
                    data-remove-id="${item.id}"
                    class="ml-1 text-red-500 hover:text-red-600 transition-all text-[14px] leading-none p-1"
                    title="${l === 'cs' ? 'Odebrat' : 'Remove'}"
                >
                    ✕
                </button>
            </div>
        </div>`;

        if (timing.includes("morning")) slots.morning.push(badge);
        else if (timing.includes("pre-workout")) slots.pre.push(badge);
        else if (timing.includes("post-workout")) slots.post.push(badge);
        else slots.evening.push(badge);
    });

    document.getElementById("schedule-morning").innerHTML = slots.morning.join('') || '<span class="text-[10px] text-slate-400 italic pl-1">--</span>';
    document.getElementById("schedule-pre").innerHTML = slots.pre.join('') || '<span class="text-[10px] text-slate-400 italic pl-1">--</span>';
    document.getElementById("schedule-post").innerHTML = slots.post.join('') || '<span class="text-[10px] text-slate-400 italic pl-1">--</span>';
    document.getElementById("schedule-evening").innerHTML = slots.evening.join('') || '<span class="text-[10px] text-slate-400 italic pl-1">--</span>';

    // Bind remove buttons (CRITICAL FIX)
    document.querySelectorAll("[data-remove-id]").forEach(btn => {
        btn.onclick = (e) => {
            e.stopPropagation();
            const id = Number(btn.getAttribute("data-remove-id")); // ← FIX
            removeFromStack(id);
        };
    });

    // Warnings Logic
    const warns = [];
    if (items.some(i => i.contains?.includes("Zinek")) && items.some(i => i.name.cs.includes("Vápník"))) {
        warns.push(l === 'cs' ? "Vápník blokuje vstřebávání Zinku." : "Calcium blocks Zinc absorption.");
    }

    const wContainer = document.getElementById("warnings-container");
    const wList = document.getElementById("warnings-list");
    if (warns.length > 0) {
        wContainer.classList.remove("hidden");
        wList.innerHTML = warns.map(w => `<li>${w}</li>`).join("");
    } else {
        wContainer.classList.add("hidden");
    }
}

// --- REMOVE FROM STACK ---
function removeFromStack(id) {
    state.stack = state.stack.filter(x => x !== id);

    save();
    render();
    analyze();

    showToast(state.lang === 'cs' ? "Odebráno ze stacku" : "Removed from stack");
}

// --- 7. CORE LOGIC ---
function toggleItem(id) {
    if (state.stack.includes(id)) {
        state.stack = state.stack.filter(i => i !== id);
        showToast(uiTranslations[state.lang].toastRemoved, "warn");
    } else {
        state.stack.push(id);
        showToast(uiTranslations[state.lang].toastAdded);
    }
    save(); render(); analyze();
}

function getDosage(item, lang) {
    if (item.id === 2) return `${Math.round(state.weight * 0.35)}g`;
    if (item.id === 13) return `max 400 mg`;
    return item.dosage;
}

function save() { localStorage.setItem('supplementGuideState', JSON.stringify(state)); }
function clearStack() { if (confirm(state.lang === 'cs' ? "Opravdu smazat celý stack?" : "Clear entire stack?")) { state.stack = []; save(); render(); analyze(); } }

function showToast(msg, type = 'success') {
    const c = document.getElementById('toast-container');
    const t = document.createElement('div');
    t.className = `toast ${type === 'warn' ? 'border-yellow-500/50' : 'border-brand-500/50'}`;
    t.innerHTML = `<span>${type === 'success' ? '✅' : '⚠️'}</span> ${msg}`;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => c.removeChild(t), 300); }, 2500);
}

// --- PROFILE ACTIONS ---
// ===============================
// SAVED STACKS — STABLE FINAL
// ===============================

const SAVED_STACKS_KEY = "supplement_saved_stacks_v2";

// ---------- INIT ----------

function initSavedStacks() {
    try {
        const raw = localStorage.getItem(SAVED_STACKS_KEY);
        state.savedStacks = raw ? JSON.parse(raw) : {};
    } catch (e) {
        console.error("Failed to load saved stacks:", e);
        state.savedStacks = {};
    }

    cleanupSavedStacks();
    renderSavedStacks();
}

// ---------- CLEANUP INVALID IDS ----------

function cleanupSavedStacks() {
    if (!state.savedStacks) return;

    const validIds = new Set(supplements.map(s => s.id));

    Object.keys(state.savedStacks).forEach(name => {
        const entry = state.savedStacks[name];
        if (!entry || !Array.isArray(entry.stack)) {
            delete state.savedStacks[name];
            return;
        }

        entry.stack = entry.stack.filter(id => validIds.has(id));

        if (entry.stack.length === 0) {
            delete state.savedStacks[name];
        }
    });

    persistSavedStacks();
}

// ---------- PERSIST ----------

function persistSavedStacks() {
    try {
        localStorage.setItem(SAVED_STACKS_KEY, JSON.stringify(state.savedStacks));
    } catch (e) {
        console.error("Persist failed:", e);
    }
}

// ---------- SAVE STACK ----------

function saveStackProfile() {
    if (!state.savedStacks) state.savedStacks = {};

    let name = prompt(state.lang === 'cs' ? "Zadej název stacku:" : "Enter stack name:");
    if (!name) return;

    name = name.trim();
    if (!name) return;

    const exists = !!state.savedStacks[name];

    if (exists) {
        const ok = confirm(
            state.lang === 'cs'
                ? `Stack "${name}" už existuje. Přepsat?`
                : `Stack "${name}" already exists. Overwrite?`
        );
        if (!ok) return;
    }

    state.savedStacks[name] = {
        stack: [...state.stack],
        weight: state.weight,
        gender: state.gender,
        date: new Date().toISOString()
    };

    persistSavedStacks();
    renderSavedStacks();

    showToast(
        state.lang === 'cs'
            ? exists ? "Stack přepsán" : "Stack uložen"
            : exists ? "Stack overwritten" : "Stack saved"
    );
}

// ---------- RENDER ----------

function renderSavedStacks() {
    const area = document.getElementById("saved-profiles-area");
    const list = document.getElementById("saved-profiles-list");

    if (!area || !list) return;

    list.innerHTML = "";

    const names = Object.keys(state.savedStacks || {});
    if (names.length === 0) {
        area.classList.add("hidden");
        return;
    }

    area.classList.remove("hidden");

    names.forEach(name => {
        const row = document.createElement("div");
        row.className = "flex items-center justify-between bg-slate-100 dark:bg-[#1C1C1E] px-3 py-2 rounded-xl text-xs";

        row.innerHTML = `
            <button class="flex-1 text-left font-bold truncate">${name}</button>
            <button class="text-red-400 hover:text-red-600 ml-2">✕</button>
        `;

        const loadBtn = row.children[0];
        const deleteBtn = row.children[1];

        loadBtn.onclick = () => loadSavedStack(name);
        deleteBtn.onclick = () => deleteSavedStack(name);

        list.appendChild(row);
    });
}

// ---------- LOAD ----------

function loadSavedStack(name) {
    const data = state.savedStacks[name];
    if (!data) return;

    const ok = confirm(
        state.lang === 'cs'
            ? `Načíst stack "${name}"? Přepíše aktuální stack.`
            : `Load stack "${name}"? This will replace current stack.`
    );

    if (!ok) return;

    const validIds = new Set(supplements.map(s => s.id));
    state.stack = data.stack.filter(id => validIds.has(id));

    state.weight = data.weight;
    state.gender = data.gender;

    if (typeof save === "function") save();
    if (typeof render === "function") render();
    analyze(); // ← KRITICKÁ OPRAVA

    showToast(state.lang === 'cs' ? "Stack načten" : "Stack loaded");
}

// ---------- DELETE ----------

function deleteSavedStack(name) {
    const ok = confirm(
        state.lang === 'cs'
            ? `Smazat stack "${name}"?`
            : `Delete stack "${name}"?`
    );

    if (!ok) return;

    delete state.savedStacks[name];
    persistSavedStacks();
    renderSavedStacks();

    showToast(state.lang === 'cs' ? "Stack smazán" : "Stack deleted");
}

// ===============================

function exportStackText() {
    if (state.stack.length === 0) {
        showToast(state.lang === 'cs' ? "Stack je prázdný" : "Stack is empty", "warn");
        return;
    }
    openExportModal();
}

// ===============================
// EXPORT SYSTEM — FINAL MODERN
// ===============================

// ---------- HELPERS ----------

function getFormattedDate() {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

function getFileName(ext) {
    return `Supplement-Guide-STACK-${getFormattedDate().replaceAll('.', '-')}.${ext}`;
}

function buildExportHeader() {
    const date = getFormattedDate();
    return state.lang === 'cs'
        ? `📦 SUPPLEMENT GUIDE\nAutor: tommyy.fit\nVygenerováno: ${date}\nProfil: ${state.gender === 'male' ? 'Muž' : 'Žena'}, ${state.weight} kg\n\n`
        : `📦 SUPPLEMENT GUIDE\nAuthor: tommyy.fit\nGenerated: ${date}\nProfile: ${state.gender === 'male' ? 'Male' : 'Female'}, ${state.weight} kg\n\n`;
}

function groupStackByTiming() {
    const groups = { morning: [], pre: [], post: [], evening: [] };

    state.stack.forEach(id => {
        const s = supplements.find(x => x.id === id);
        if (!s) return;
        const timing = (s.timing?.en || "").toLowerCase();
        if (timing.includes("morning")) groups.morning.push(s);
        else if (timing.includes("pre")) groups.pre.push(s);
        else if (timing.includes("post")) groups.post.push(s);
        else groups.evening.push(s);
    });

    return groups;
}

function buildExportLines() {
    const groups = groupStackByTiming();
    const lines = [];

    const section = (title, emoji, items) => {
        if (!items.length) return;
        lines.push(`${emoji} ${title}`);
        items.forEach(s => {
            lines.push(`• ${s.name[state.lang]} — ${getDosage(s, state.lang)}`);
        });
        lines.push("");
    };

    if (state.lang === 'cs') {
        section("Ráno", "🌅", groups.morning);
        section("Před tréninkem", "🔥", groups.pre);
        section("Po tréninku", "💪", groups.post);
        section("Večer", "🌙", groups.evening);
    } else {
        section("Morning", "🌅", groups.morning);
        section("Pre-workout", "🔥", groups.pre);
        section("Post-workout", "💪", groups.post);
        section("Evening", "🌙", groups.evening);
    }

    return lines;
}

// ===============================
// MODAL
// ===============================

function openExportModal() {
    closeExportModal();

    const overlay = document.createElement("div");
    overlay.id = "export-modal-overlay";
    overlay.className = "fixed inset-0 bg-black/60 z-50 flex items-center justify-center";

    const modal = document.createElement("div");
    modal.className = "bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 w-[320px] shadow-2xl border dark:border-white/10";

    modal.innerHTML = `
        <h3 class="text-lg font-black mb-1">${state.lang === 'cs' ? 'Export stacku' : 'Export stack'}</h3>
        <p class="text-xs opacity-60 mb-4">Supplement Guide · tommyy.fit</p>

        <div class="space-y-3">
            <button id="export-txt" class="w-full p-3 rounded-xl bg-slate-100 dark:bg-white/10 font-bold">📄 TXT</button>
            <button id="export-pdf" class="w-full p-3 rounded-xl bg-slate-100 dark:bg-white/10 font-bold">📑 PDF</button>
        </div>

        <button id="export-cancel" class="mt-4 w-full text-xs opacity-60">${state.lang === 'cs' ? 'Zrušit' : 'Cancel'}</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    document.getElementById("export-txt").onclick = () => { doTXTExport(); closeExportModal(); };
    document.getElementById("export-pdf").onclick = () => { doPDFExport(); closeExportModal(); };
    document.getElementById("export-cancel").onclick = closeExportModal;

    overlay.addEventListener("click", e => { if (e.target === overlay) closeExportModal(); });
}

function closeExportModal() {
    const el = document.getElementById("export-modal-overlay");
    if (el) el.remove();
}

// ===============================
// TXT EXPORT
// ===============================

function doTXTExport() {
    const content = buildExportHeader() + buildExportLines().join("\n");

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = getFileName("txt");
    a.click();

    URL.revokeObjectURL(url);
    showToast("TXT export ready");
}

// ===============================
// PDF EXPORT — MODERN
// ===============================

function doPDFExport() {
    const groups = groupStackByTiming();

    const wrapper = document.createElement("div");
    wrapper.style.padding = "48px";
    wrapper.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, sans-serif";
    wrapper.style.color = state.darkMode ? "#ffffff" : "#111111";
    wrapper.style.background = state.darkMode ? "#0b0b0b" : "#ffffff";
    wrapper.style.width = "800px";
    wrapper.style.lineHeight = "1.7";

    const header = buildExportHeader();

    const renderSection = (title, emoji, items) => {
        if (!items.length) return "";
        return `
            <div style="margin-bottom:24px;">
                <h2 style="font-size:18px; margin-bottom:8px;">${emoji} ${title}</h2>
                <div style="padding-left:12px;">
                    ${items.map(s => `<div style="margin-bottom:6px;">• ${s.name[state.lang]} — ${getDosage(s, state.lang)}</div>`).join("")}
                </div>
            </div>
        `;
    };

    wrapper.innerHTML = `
        <div style="border-bottom:1px solid ${state.darkMode ? "#333" : "#ddd"}; padding-bottom:16px; margin-bottom:24px;">
            <h1 style="font-size:30px; margin:0;">📦 Supplement Guide</h1>
            <div style="font-size:12px; opacity:0.6;">tommyy.fit</div>
        </div>

        <pre style="font-size:13px; white-space:pre-wrap; margin-bottom:24px;">${header}</pre>

        ${state.lang === 'cs' ? renderSection("Ráno", "🌅", groups.morning) : renderSection("Morning", "🌅", groups.morning)}
        ${state.lang === 'cs' ? renderSection("Před tréninkem", "🔥", groups.pre) : renderSection("Pre-workout", "🔥", groups.pre)}
        ${state.lang === 'cs' ? renderSection("Po tréninku", "💪", groups.post) : renderSection("Post-workout", "💪", groups.post)}
        ${state.lang === 'cs' ? renderSection("Večer", "🌙", groups.evening) : renderSection("Evening", "🌙", groups.evening)}
    `;

    const opt = {
        margin: 10,
        filename: getFileName("pdf"),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(wrapper).save();
}

// ===============================

// ===============================
// COPY STACK
// ===============================

function copyStackToClipboard() {
    if (state.stack.length === 0) {
        showToast(state.lang === 'cs' ? "Stack je prázdný" : "Stack is empty", "warn");
        return;
    }

    const content = buildExportHeader() + buildExportLines().join("\n");

    copyToClipboard(content, () => {
        showToast(uiTranslations[state.lang].copy + " OK");
    });
}

// ===============================
// SHARE STACK
// ===============================

function shareStack() {
    if (state.stack.length === 0) {
        showToast(state.lang === 'cs' ? "Stack je prázdný" : "Stack is empty", "warn");
        return;
    }

    const data = {
        stack: state.stack,
        weight: state.weight,
        gender: state.gender
    };

    try {
        const json = JSON.stringify(data);
        const encoded = encodeURIComponent(btoa(unescape(encodeURIComponent(json))));
        const url = `${location.origin}${location.pathname}?stack=${encoded}`;

        copyToClipboard(url, () => {
            showToast(state.lang === 'cs' ? "Odkaz zkopírován" : "Link copied");
        });
    } catch (e) {
        console.error("Share failed:", e);
        showToast("Share failed", "warn");
    }
}

// ===============================
// IMPORT STACK FROM URL (POVINNÉ)
// ===============================

function loadStackFromURL() {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("stack");

    if (!encoded) return;

    try {
        const json = decodeURIComponent(escape(atob(decodeURIComponent(encoded))));
        const data = JSON.parse(json);

        if (!data.stack || !Array.isArray(data.stack)) return;

        // Validace ID
        const validIds = data.stack.filter(id =>
            supplements.some(s => s.id === id)
        );

        state.stack = validIds;
        state.weight = data.weight || state.weight;
        state.gender = data.gender || state.gender;

        save();

        // Tohle musíš mít ve své appce – render / refresh UI
        if (typeof render === "function") render();
        if (typeof updateUI === "function") updateUI();

        showToast(state.lang === 'cs' ? "Stack importován" : "Stack imported");

        // Očistíme URL
        history.replaceState(null, "", location.pathname);
    } catch (e) {
        console.error("Import failed:", e);
        showToast("Invalid link", "warn");
    }
}

// ===============================
// CLIPBOARD HELPERS
// ===============================

function copyToClipboard(text, onSuccess) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => onSuccess && onSuccess())
            .catch(() => fallbackCopy(text, onSuccess));
    } else {
        fallbackCopy(text, onSuccess);
    }
}

function fallbackCopy(text, onSuccess) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    try {
        document.execCommand("copy");
        onSuccess && onSuccess();
    } catch (err) {
        alert("Copy failed");
    }

    document.body.removeChild(textarea);
}
// ===============================

// Launch
loadStackFromURL();
init();
initSavedStacks();