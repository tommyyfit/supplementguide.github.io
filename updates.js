// =================================================================
// --- UPDATE LOG SYSTEM (Glassoring Design GLASS STYLE) ---
// =================================================================

const changeLogData = [
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