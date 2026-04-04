// =================================================================
// --- UPDATE LOG SYSTEM (Glassoring Design GLASS STYLE) ---
// =================================================================

const changeLogData = [
    {
        version: "3.5",
        date: "2026-04-04",
        title: "Zero Hardcoded Strings, 5-Slot Schedule, Fixed Export & Full Bug Sweep",
        badge: "MAJOR",
        description: "V3.5 is a comprehensive quality release that eliminates all hardcoded strings in both Czech and English, completely rewrites the export engine (PDF now always white-background with full supplement detail), adds an Intra-workout schedule slot, fixes synergy detection logic, hardens conflict rules, and resolves every translation gap introduced in V3.",
        changes: [
            {
                type: "fix",
                icon: "🛠",
                title: "Critical Bug Fixes",
                items: [
                    "<b>Export PDF:</b> Was rendering with dark-mode colors and only name+dosage. Now always white-background, includes dosage, timing, benefits, synergies, and conflicts per supplement — fully bilingual.",
                    "<b>Export TXT:</b> Now includes dosage, timing, benefits, synergies, and conflicts per supplement — structured in clear sections with Unicode borders.",
                    "<b>Intra-workout items lost:</b> EAA, Elektrolyty and all 'during workout' items were falling into the Evening bucket. Now correctly routed to a dedicated Intra-workout slot.",
                    "<b>Stack Score synergy detection fixed:</b> Was using name string matching which almost never matched. Now correctly checks the `contains` array of each supplement against synergy lists.",
                    "<b>TXT export toast not translated:</b> Was always showing English regardless of language. Fixed.",
                    "<b>compareList not cleaned on init:</b> Stale IDs could remain if supplements database changes. Now cleaned on every init.",
                    "<b>Remove button event binding race condition:</b> Replaced inline onclick with `addEventListener` + `once:true` to prevent double-firing on fast re-renders.",
                    "<b>loadSavedStack not updating weight/gender UI inputs:</b> Weight input and gender select now correctly update on stack load.",
                    "<b>modal opacity-0 applied before display:</b> Now uses requestAnimationFrame to ensure the transition runs correctly."
                ]
            },
            {
                type: "new",
                icon: "✨",
                title: "Translation & Localization (Zero Hardcoded Strings)",
                items: [
                    "<b>Gender select options</b> now switch between 'Muž/Žena' and 'Man/Woman' on language toggle.",
                    "<b>Preset button labels</b> now switch correctly between Czech and English.",
                    "<b>'Harmonogram' heading</b> in sidebar now translates to 'Schedule' in EN.",
                    "<b>'Uživatel / Aktivní'</b> profile labels now translate.",
                    "<b>'Kritické upozornění'</b> warnings title now translates to 'Critical Warnings'.",
                    "<b>'Ověřeno vědeckými daty'</b> modal footer note now translates to 'Science-backed data'.",
                    "<b>'Uložené profily'</b> saved stacks section title now translates.",
                    "<b>All confirm() / prompt() dialogs</b> now use translation strings with `{name}` interpolation — no more hardcoded Czech in JS.",
                    "New translation keys added: exportTitle, exportSubtitle, exportCancel, txtExportReady, pdfExportReady, exportMale, exportFemale, exportBenefits, exportTiming, warningTitle, harmonogram, userLabel, activeLabel, compareAddOne, compareMax, compareDosage, compareTiming, compareBenef, compareSyn, compareCon, compareEvid, modalFooterNote, savedProfilesTitle, and 12 more."
                ]
            },
            {
                type: "new",
                icon: "📅",
                title: "Intra-Workout Schedule Slot",
                items: [
                    "New 💧 Intra-workout slot in the sidebar schedule — separate from Evening.",
                    "Supplements with timing containing 'intra', 'during', or 'během' now correctly appear here.",
                    "Affects: EAA, Elektrolyty, and any future intra-workout supplements.",
                    "Schedule now has 5 slots: Morning → Pre-workout → Intra-workout → Post-workout → Evening."
                ]
            },
            {
                type: "design",
                icon: "🎨",
                title: "Export & UX Polish",
                items: [
                    "PDF export redesigned with clean two-column header, section cards with colored left borders, and full supplement detail rows including icon, name, dosage, timing, benefits, synergy, and conflicts.",
                    "TXT export uses Unicode box-drawing characters for a clean structured layout.",
                    "Export modal buttons now have hover-to-brand-blue styling for visual feedback.",
                    "Compare modal now has a brand-colored close button and overflow-x-auto for narrow screens.",
                    "Stack score calculation refined: max +32 for science-backed items, +21 for synergies, −33 for conflicts."
                ]
            }
        ]
    },
    {
        version: "3.0",
        date: "2026-03-31",
        title: "Stack Score, Presets, Compare & 6 New Supplements",
        badge: "MAJOR",
        description: "Version 3.0 is the biggest update yet — introducing a real-time Stack Score engine, goal-based preset stacks, a full side-by-side supplement comparison tool, confidence badges on every supplement card, expanded conflict detection with 7 new interaction rules, and 6 brand-new supplements including NMN, Berberine, Astaxanthin, Shilajit, Fadogia Agrestis, and Turkesterone.",
        changes: [
            {
                type: "new",
                icon: "🚀",
                title: "New Features",
                items: [
                    "<b>Stack Score (0–100):</b> A dynamic score computed from science-backed items, detected synergies, and active conflicts — displayed as an animated circular gauge in the sidebar.",
                    "<b>Goal Preset Stacks:</b> One-click presets for Sleep, Strength, Energy, Focus, and Health — each loading a curated set of 5 optimized supplements instantly.",
                    "<b>Supplement Comparison Tool:</b> Compare up to 3 supplements side-by-side in a rich modal — showing dosage, timing, benefits, synergies, conflicts, and evidence level.",
                    "<b>Compare Bar:</b> A persistent bottom bar tracks your comparison selection with live-updated names. Opens the compare modal when 2+ items are selected.",
                    "<b>6 New Supplements:</b> Astaxanthin (id:51), Berberine (id:52), NMN (id:53), Fadogia Agrestis (id:54), Shilajit (id:55), Turkesterone (id:56) — all with bilingual data and PubMed study links.",
                    "<b>Confidence Badges in Modal:</b> Every supplement detail modal now shows a color-coded evidence badge (Science-backed / Promising / Preliminary) based on the confidence field."
                ]
            },
            {
                type: "design",
                icon: "✨",
                title: "UI & UX Improvements",
                items: [
                    "Quick Start preset row above the supplement grid — horizontally scrollable, fully responsive.",
                    "Modal footer now has a Porovnat / Compare button inline with Add to Stack — no extra clicks needed.",
                    "Stack Score widget animates in smoothly using SVG stroke-dasharray transitions.",
                    "V3 badge added to the header logo and footer copyright.",
                    "Compare bar appears at the bottom of the viewport with contextual messaging based on selection count.",
                    "Warnings list items now render as flex rows with bullet alignment for improved readability."
                ]
            },
            {
                type: "fix",
                icon: "🛠",
                title: "Expanded Conflict Detection (7 New Rules)",
                items: [
                    "<b>Caffeine + Melatonin:</b> Evening antagonism warning.",
                    "<b>NAC + Alcohol:</b> Toxicity amplification warning.",
                    "<b>Iron + Calcium:</b> Absorption interference warning.",
                    "<b>Probiotics + Antibiotics:</b> Destruction conflict warning.",
                    "<b>Berberine + Diabetes meds:</b> Clinical amplification warning.",
                    "<b>Tryptophan + SSRIs:</b> Serotonin syndrome risk warning.",
                    "<b>Multiple caffeine sources:</b> Auto-detects stacked caffeine items and warns about overdose risk."
                ]
            }
        ]
    },
    {
        version: "2.3",
        date: "2026-02-27",
        title: "Mobile Stack Overlay & Smart Badge System",
        badge: "PATCH",
        description: "A focused mobile experience update introducing a full-screen stack overlay, automatic badge synchronization, and simplified interaction logic. This release improves performance, reduces code complexity, and delivers a cleaner mobile UX without altering the core desktop layout.",
        changes: [
            {
                type: "new",
                icon: "📱",
                title: "New Mobile Functionality",
                items: [
                    "<b>Full-Screen Mobile Stack Overlay:</b> \"My Stack\" is now hidden on mobile and opens as a dedicated full-screen experience via floating action button (FAB).",
                    "<b>Automatic Badge Counter:</b> The FAB now live-syncs with stack changes using MutationObserver — no manual update calls required.",
                    "<b>Smart Desktop Protection:</b> Overlay automatically disables on desktop breakpoints (≥1024px) to prevent layout conflicts."
                ]
            },
            {
                type: "design",
                icon: "✨",
                title: "UX & Interaction Improvements",
                items: [
                    "Added smooth open/close animation with scale + opacity transitions.",
                    "Scroll locking prevents background movement while overlay is active.",
                    "Improved mobile accessibility with ESC key close and backdrop click close.",
                    "Badge now auto-hides at 0 and supports smart limit display (99+)."
                ]
            },
            {
                type: "refactor",
                icon: "⚙️",
                title: "Code Simplification & Stability",
                items: [
                    "<b>Reduced mobile stack controller complexity by over 50%.</b>",
                    "Removed unnecessary public API exposure to prevent misuse.",
                    "Eliminated redundant state flags and simplified toggle logic.",
                    "Safer DOM cleanup to prevent duplicate renders.",
                    "Improved resize handling to auto-close overlay on desktop transition."
                ]
            }
        ]
    },
    {
        version: "2.2",
        date: "2026-02-05",
        title: "Stability, Stack Interaction & Rendering Fixes",
        badge: "PATCH",
        description: "A stability-focused update that fixes multiple rendering and state bugs, improves stack interaction, and restores consistent supplement loading. This release hardens core logic and improves usability without changing the visual design direction.",
        changes: [
            {
                type: "new",
                icon: "🚀",
                title: "New Functionality",
                items: [
                    "<b>Clickable Supplements in My Stack:</b> Each supplement in the \"My Stack\" timeline can now be clicked to open its full detail modal, including description, dosage, and timing.",
                    "<b>Consistent Active State Rendering:</b> Supplement cards now correctly reflect stack state (+ / ✓) based purely on application state.",
                    "<b>Improved Stack Interaction Flow:</b> Add/remove actions are immediately reflected across grid, timeline, and analysis without desync."
                ]
            },
            {
                type: "design",
                icon: "🎨",
                title: "UX & Interaction Improvements",
                items: [
                    "Fixed click behavior inside supplement cards so action buttons no longer trigger unintended modal opens.",
                    "Improved visual consistency of active (+ / ✓) buttons across light and dark modes.",
                    "Cleaner empty-state messaging when no supplements match active filters.",
                    "More predictable behavior when switching language or category while a stack is active."
                ]
            },
            {
                type: "fix",
                icon: "🛠",
                title: "Bug Fixes & Stability Improvements",
                items: [
                    "<b>Fixed supplements not fully loading due to persisted search filters.</b>",
                    "Fixed incorrect rendering caused by stale UI state restored from localStorage.",
                    "Fixed stack desynchronization caused by missing or invalid render calls.",
                    "Fixed broken add/remove behavior caused by calling non-existent functions.",
                    "Fixed supplement cards disappearing due to render loop interruption.",
                    "Fixed ID comparison issues by normalizing all supplement IDs to numbers.",
                    "Fixed saved stacks not updating UI correctly after load or delete.",
                    "Fixed event propagation issues inside dynamically rendered elements.",
                    "Fixed edge cases where state.stack was not an array, causing runtime errors.",
                    "Improved defensive rendering to prevent blank screens on unexpected data."
                ]
            }
        ]
    },


    {
        version: "2.1",
        date: "2026-01-17",
        title: "Stability & Pro Export Update",
        badge: "MAJOR",
        description: "A major stability and quality-of-life update focused on professional exports, sharing, persistence, and UI consistency. This release eliminates critical bugs and introduces a modern PDF engine.",
        changes: [
            {
                type: "new",
                icon: "🚀",
                title: "New Features",
                items: [
                    "<b>Modern PDF Engine:</b> Replaced legacy jsPDF with html2pdf for full UTF-8, emoji, and Czech language support.",
                    "<b>Professional PDF Layout:</b> New section-based formatting with clean spacing, typography, and visual hierarchy.",
                    "<b>Unified Export System:</b> TXT, PDF, and Clipboard now use the same structured format.",
                    "<b>Shareable Stack Links:</b> Generate links that load full stack profiles including weight and gender.",
                    "<b>Persistent Saved Stacks:</b> Saved stacks now persist correctly across reloads using localStorage.",
                    "<b>Inline Stack Editing:</b> Supplements can now be removed directly from the timeline."
                ]
            },
            {
                type: "design",
                icon: "🎨",
                title: "UI & UX Improvements",
                items: [
                    "Improved export modal layout with clearer hierarchy.",
                    "Cleaner PDF visual structure with proper section separation.",
                    "More readable spacing and typography in exported files.",
                    "Consistent formatting across TXT, PDF, and Clipboard exports.",
                    "Compact one-line supplement cards for better density.",
                    "Mobile-friendly delete action always visible.",
                    "Premium hover interactions on timeline items."
                ]
            },
            {
                type: "fix",
                icon: "🛠",
                title: "Critical Fixes",
                items: [
                    "Fixed broken Czech characters and emoji corruption in PDF exports.",
                    "Fixed stack not refreshing in the timeline after loading a saved profile.",
                    "Fixed incorrect init order causing race conditions.",
                    "Fixed saved stacks reappearing after deletion.",
                    "Fixed invalid stack IDs after product database updates.",
                    "Improved validation when loading stacks from shared URLs.",
                    "<b>Fixed supplement removal bug caused by string vs number ID mismatch.</b>",
                    "Fixed click handling inside dynamically rendered timeline elements.",
                    "Fixed mobile interaction issues with hover-dependent UI elements."
                ]
            }
        ]
    },

    {
        version: "2.0",
        date: "2025-01-12",
        title: "The Glass & Global Update",
        badge: "MAJOR",
        description: "A complete visual overhaul bringing the 'Glassoring Design' glassmorphism aesthetic, full bilingual support, and a smarter stack analysis engine.",
        changes: [
            {
                type: "new",
                icon: "✨",
                title: "New Features",
                items: [
                    "<b>Full Bilingual Support:</b> Instant switching between Czech and English for all content including descriptions.",
                    "<b>Smart Timeline:</b> The 'My Stack' panel now auto-generates a daily schedule based on your items.",
                    "<b>Expanded Database:</b> 50+ supplements with detailed synergy and conflict data."
                ]
            },
            {
                type: "design",
                icon: "🎨",
                title: "Visual & UX",
                items: [
                    "<b>Glassoring Design:</b> Deep glassmorphism (backdrop-blur-2xl), refined borders, and premium geometry.",
                    "<b>Better Sidebar:</b> Fixed-height independent scrolling - no more scrolling the whole page to see your stack.",
                    "<b>Compact Footer:</b> A clean, minimalist footer design that saves vertical space."
                ]
            },
            {
                type: "fix",
                icon: "🔧",
                title: "Fixes & Improvements",
                items: [
                    "Fixed translation duplication bugs in the UI.",
                    "Improved Dark Mode contrast for glass panels.",
                    "Removed the 'Trash' icon from the toolbar for a cleaner look."
                ]
            }
        ]
    }
];

// --- RENDER LOGIC ---

document.addEventListener('DOMContentLoaded', () => {
    initUpdatesModal();
});

function initUpdatesModal() {
    // 1. Create Modal HTML Structure if it doesn't exist
    if (!document.getElementById('updates-modal')) {
        const modalHTML = `
        <div id="updates-modal" class="fixed inset-0 z-[250] hidden">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity opacity-0" id="updates-backdrop"></div>
            
            <div class="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
                <div id="updates-content" class="w-full max-w-lg bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl border border-white/50 dark:border-white/10 flex flex-col max-h-[85vh] transform scale-95 opacity-0 transition-all duration-300 pointer-events-auto overflow-hidden">
                    
                    <div class="px-6 py-5 border-b border-slate-200/50 dark:border-white/10 flex justify-between items-center bg-white/50 dark:bg-[#2C2C2E]/50 shrink-0">
                        <h2 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span class="text-xl">🚀</span> What's New
                        </h2>
                        <button id="updates-close" class="p-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <div class="overflow-y-auto p-6 custom-scrollbar space-y-8" id="updates-body">
                        </div>

                    <div class="p-5 border-t border-slate-200/50 dark:border-white/10 bg-slate-50/80 dark:bg-[#2C2C2E]/80 shrink-0">
                        <button id="updates-ok-btn" class="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-lg shadow-brand-500/30 transition transform active:scale-95">
                            Awesome!
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 2. Event Listeners
    const toggleBtn = document.getElementById('updates-toggle');
    const modal = document.getElementById('updates-modal');
    const backdrop = document.getElementById('updates-backdrop');
    const content = document.getElementById('updates-content');
    const closeBtn = document.getElementById('updates-close');
    const okBtn = document.getElementById('updates-ok-btn');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => openUpdates(modal, backdrop, content));
    }

    [closeBtn, okBtn, backdrop].forEach(el => {
        if (el) el.addEventListener('click', () => closeUpdates(modal, backdrop, content));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeUpdates(modal, backdrop, content);
        }
    });
}

function openUpdates(modal, backdrop, content) {
    renderUpdatesContent();
    modal.classList.remove('hidden');
    // Animation frame for transition
    requestAnimationFrame(() => {
        backdrop.classList.remove('opacity-0');
        content.classList.remove('scale-95', 'opacity-0');
        content.classList.add('scale-100', 'opacity-100');
    });
    document.body.style.overflow = 'hidden';
}

function closeUpdates(modal, backdrop, content) {
    backdrop.classList.add('opacity-0');
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');

    setTimeout(() => {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }, 300);
}

function renderUpdatesContent() {
    const container = document.getElementById('updates-body');
    if (!container) return;

    container.innerHTML = changeLogData.map(log => `
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs font-bold px-2 py-0.5 rounded text-brand-700 bg-brand-100 dark:text-brand-300 dark:bg-brand-900/40 border border-brand-200 dark:border-brand-800">v${log.version}</span>
                        <span class="text-xs text-slate-400 font-medium">${log.date}</span>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 dark:text-white">${log.title}</h3>
                </div>
                ${log.badge ? `<span class="text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded bg-slate-900 text-white dark:bg-white dark:text-black">${log.badge}</span>` : ''}
            </div>
            
            <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-100 dark:bg-white/5 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                ${log.description}
            </p>

            <div class="space-y-4 pt-2">
                ${log.changes.map(section => `
                    <div>
                        <h4 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <span>${section.icon}</span> ${section.title}
                        </h4>
                        <ul class="space-y-2">
                            ${section.items.map(item => `
                                <li class="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2.5">
                                    <span class="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mt-2 shrink-0"></span>
                                    <span class="leading-relaxed">${item}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('<div class="w-full h-px bg-slate-200 dark:bg-white/10 my-6"></div>');
}