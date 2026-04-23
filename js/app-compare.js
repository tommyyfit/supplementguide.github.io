(function () {
    const SG = window.SG = window.SG || {};

    function toggleCompare(id) {
        id = Number(id);
        const t = window.uiTranslations[SG.state.lang];
        const idx = SG.state.compareList.indexOf(id);
        if (idx > -1) {
            SG.state.compareList.splice(idx, 1);
        } else {
            if (SG.state.compareList.length >= 3) {
                SG.helpers.showToast(t.compareMax, 'warn');
                return;
            }
            SG.state.compareList.push(id);
        }
        SG.saveState();
        if (SG.renderCatalog) SG.renderCatalog();
        renderCompareBar();
        if (SG.currentModalId && SG.modal && SG.modal.openModal) SG.modal.openModal(SG.currentModalId);
    }

    function clearCompare() {
        SG.state.compareList = [];
        SG.saveState();
        if (SG.renderCatalog) SG.renderCatalog();
        renderCompareBar();
        if (SG.currentModalId && SG.modal && SG.modal.openModal) SG.modal.openModal(SG.currentModalId);
    }

    function renderCompareBar() {
        const bar = document.getElementById('compare-bar');
        if (!bar) return;
        const lang = SG.state.lang;
        const t = window.uiTranslations[lang];
        if (!(SG.state.compareList || []).length) {
            bar.classList.add('hidden');
            bar.innerHTML = '';
            return;
        }
        bar.classList.remove('hidden');
        const chips = SG.state.compareList.map(function (id) {
            return (window.supplements || []).find(function (item) { return Number(item.id) === Number(id); });
        }).filter(Boolean).map(function (item) {
            return '<span class="bg-white/20 text-white px-2.5 py-1 rounded-xl text-xs font-bold">' + item.icon + ' ' + SG.helpers.esc((item.name && (item.name[lang] || item.name.cs)) || '') + '</span>';
        }).join('');
        bar.innerHTML = '' +
            '<div class="max-w-7xl mx-auto px-4 flex items-center justify-between gap-3 flex-wrap">' +
                '<div class="flex items-center gap-2 flex-wrap">' +
                    '<span class="text-[10px] font-black uppercase tracking-widest text-white/70">' + SG.helpers.esc(t.compareTitle) + '</span>' + chips +
                '</div>' +
                '<div class="flex items-center gap-3">' +
                    (SG.state.compareList.length >= 2
                        ? '<button type="button" onclick="openCompareModal()" class="bg-white text-brand-700 text-xs font-black px-4 py-2 rounded-xl transition hover:bg-brand-50 active:scale-95">' + SG.helpers.esc(t.compareTitle) + '</button>'
                        : '<span class="text-[10px] text-white/60 font-medium">' + SG.helpers.esc(t.compareAddOne) + '</span>') +
                    '<button type="button" onclick="clearCompare()" class="text-[10px] text-white/60 hover:text-white font-bold transition">' + SG.helpers.esc(t.compareClear) + '</button>' +
                '</div>' +
            '</div>';
    }

    function openCompareModal() {
        const lang = SG.state.lang;
        const t = window.uiTranslations[lang];
        const items = SG.state.compareList.map(function (id) {
            return (window.supplements || []).find(function (item) { return Number(item.id) === Number(id); });
        }).filter(Boolean);
        if (items.length < 2) return;
        const old = document.getElementById('compare-modal-overlay');
        if (old) old.remove();
        const overlay = document.createElement('div');
        overlay.id = 'compare-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/60 z-[260] flex items-start justify-center p-4 overflow-y-auto backdrop-blur-sm';
        const headers = items.map(function (item) {
            return '' +
                '<div class="flex-1 min-w-[180px] text-center p-4 border-r last:border-r-0 border-slate-100 dark:border-white/5">' +
                    '<div class="text-3xl mb-2">' + item.icon + '</div>' +
                    '<div class="font-black text-sm text-slate-900 dark:text-white">' + SG.helpers.esc((item.name && (item.name[lang] || item.name.cs)) || '') + '</div>' +
                    '<div class="text-[9px] uppercase tracking-widest text-slate-400 mt-1">' + SG.helpers.esc((t.cats && t.cats[item.category]) || item.category) + '</div>' +
                '</div>';
        }).join('');
        function row(label, renderer) {
            const cells = items.map(function (item) {
                return '<div class="flex-1 min-w-[180px] p-3 border-r last:border-r-0 border-slate-100 dark:border-white/5 text-xs font-medium text-slate-700 dark:text-slate-300">' + renderer(item) + '</div>';
            }).join('');
            return '<div><div class="px-4 py-2 bg-slate-50/80 dark:bg-white/5 border-y border-slate-100 dark:border-white/5"><span class="text-[9px] font-black uppercase tracking-widest text-slate-400">' + SG.helpers.esc(label) + '</span></div><div class="flex">' + cells + '</div></div>';
        }
        overlay.innerHTML = '' +
            '<div class="w-full max-w-4xl bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden my-8">' +
                '<div class="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">' +
                    '<h3 class="font-black text-slate-900 dark:text-white text-lg">' + SG.helpers.esc(t.compareTitle) + '</h3>' +
                    '<button type="button" onclick="document.getElementById(\'compare-modal-overlay\').remove()" class="p-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white transition">' +
                        '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>' +
                    '</button>' +
                '</div>' +
                '<div class="overflow-x-auto">' +
                    '<div class="flex border-b border-slate-100 dark:border-white/5 min-w-max">' + headers + '</div>' +
                    row(t.compareDosage, function (item) { return SG.helpers.esc(SG.helpers.getDosage(item, lang)); }) +
                    row(t.compareTiming, function (item) { return SG.helpers.esc((item.timing && (item.timing[lang] || item.timing.cs)) || '—'); }) +
                    row(t.compareBenef, function (item) { return SG.helpers.esc((((item.benefits && (item.benefits[lang] || item.benefits.cs)) || []).join(', ')) || '—'); }) +
                    row(t.compareSyn, function (item) { return SG.helpers.esc((item.synergy || []).length ? item.synergy.join(', ') : '—'); }) +
                    row(t.compareCon, function (item) { return SG.helpers.esc((item.conflict || []).length ? item.conflict.join(', ') : '—'); }) +
                    row(t.compareEvid, function (item) { return SG.helpers.esc(t['confidence' + SG.helpers.capitalize(item.confidence)] || item.confidence); }) +
                '</div>' +
                '<div class="p-4 border-t border-slate-100 dark:border-white/5">' +
                    '<button type="button" onclick="document.getElementById(\'compare-modal-overlay\').remove()" class="w-full py-3 rounded-2xl bg-brand-600 text-white font-black text-sm transition hover:bg-brand-500 active:scale-95">' + SG.helpers.esc(t.compareClose) + '</button>' +
                '</div>' +
            '</div>';
        overlay.addEventListener('click', function (event) { if (event.target === overlay) overlay.remove(); });
        document.body.appendChild(overlay);
    }

    SG.compare = {
        toggleCompare: toggleCompare,
        clearCompare: clearCompare,
        renderCompareBar: renderCompareBar,
        openCompareModal: openCompareModal
    };
    SG.renderCompareBar = renderCompareBar;
})();
