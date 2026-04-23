(function () {
    const SG = window.SG = window.SG || {};

    function openModal(id) {
        SG.currentModalId = Number(id);
        const item = (window.supplements || []).find(function (entry) { return Number(entry.id) === Number(id); });
        if (!item) return;
        const lang = SG.state.lang;
        const t = window.uiTranslations[lang];
        const setText = function (idName, value) {
            const element = document.getElementById(idName);
            if (element) element.innerText = value;
        };
        setText('m-icon', item.icon || '💊');
        setText('m-title', (item.name && (item.name[lang] || item.name.cs)) || '');
        setText('m-desc', (item.description && (item.description[lang] || item.description.cs)) || '');
        setText('m-category', (t.cats && t.cats[item.category]) || item.category);
        setText('m-dosage', SG.helpers.getDosage(item, lang));
        setText('m-timing', (item.timing && (item.timing[lang] || item.timing.cs)) || '');

        const fitNote = document.getElementById('m-fit-note');
        if (fitNote) {
            const fitText = SG.helpers.buildFitNote(item, lang);
            fitNote.classList.toggle('hidden', !fitText);
            fitNote.innerText = fitText || '';
        }

        const confidence = document.getElementById('m-confidence');
        if (confidence) {
            const map = {
                high: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800',
                medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
                low: 'text-slate-500 bg-slate-50 dark:bg-slate-800/30 dark:text-slate-400 border-slate-200 dark:border-slate-700'
            };
            const klass = map[item.confidence] || map.low;
            confidence.innerHTML = '<span class="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border ' + klass + '">🔬 ' + SG.helpers.esc(t['confidence' + SG.helpers.capitalize(item.confidence)] || item.confidence) + '</span>';
        }

        const benefits = document.getElementById('m-benefits');
        if (benefits) {
            benefits.innerHTML = (((item.benefits && (item.benefits[lang] || item.benefits.cs)) || []).map(function (value) { return '<li>• ' + SG.helpers.esc(value) + '</li>'; })).join('');
        }

        const synergyEl = document.getElementById('m-synergy');
        const conflictEl = document.getElementById('m-conflict');
        if (synergyEl) {
            synergyEl.innerHTML = (item.synergy || []).length
                ? item.synergy.map(function (value) { return '<span class="bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-brand-100 dark:border-brand-800">' + SG.helpers.esc(value) + '</span>'; }).join('')
                : '<span class="text-slate-300 dark:text-slate-600 text-[10px]">—</span>';
        }
        if (conflictEl) {
            conflictEl.innerHTML = (item.conflict || []).length
                ? item.conflict.map(function (value) { return '<span class="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-red-100 dark:border-red-800">' + SG.helpers.esc(value) + '</span>'; }).join('')
                : '<span class="text-slate-300 dark:text-slate-600 text-[10px]">—</span>';
        }

        const studiesContainer = document.getElementById('m-studies-container');
        const studiesList = document.getElementById('m-studies');
        if (studiesContainer && studiesList) {
            if ((item.studies || []).length) {
                studiesContainer.classList.remove('hidden');
                studiesList.innerHTML = (item.studies || []).map(function (link, index) {
                    return '' +
                        '<a href="' + link + '" target="_blank" rel="noopener noreferrer" class="flex items-center justify-between group/study bg-white dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5 hover:border-brand-500 transition-all">' +
                            '<span class="text-xs font-bold text-slate-700 dark:text-slate-300">' + SG.helpers.esc(t.studyLabel) + ' #' + (index + 1) + '</span>' +
                            '<svg class="w-3 h-3 text-slate-400 group-hover/study:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" stroke-width="2.5"/></svg>' +
                        '</a>';
                }).join('');
            } else {
                studiesContainer.classList.add('hidden');
                studiesList.innerHTML = '';
            }
        }

        const compareBtn = document.getElementById('m-compare-btn');
        if (compareBtn) {
            const inCompare = (SG.state.compareList || []).includes(item.id);
            const full = (SG.state.compareList || []).length >= 3 && !inCompare;
            compareBtn.innerText = inCompare ? ('✓ ' + t.compareBtn) : t.compareBtn;
            compareBtn.className = 'text-xs font-black px-4 py-3.5 rounded-2xl transition active:scale-95 border ' + (inCompare
                ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800'
                : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 border-transparent hover:bg-brand-500 hover:text-white') + (full ? ' opacity-40 cursor-not-allowed' : '');
            compareBtn.onclick = full ? null : function () { SG.compare.toggleCompare(item.id); };
        }

        const toggleBtn = document.getElementById('m-toggle-btn');
        if (toggleBtn) {
            const active = (SG.state.stack || []).includes(item.id);
            toggleBtn.innerText = active ? t.removeStack : t.addStack;
            toggleBtn.onclick = function () {
                SG.actions.toggleItem(item.id);
                closeModal();
            };
        }

        const modal = SG.dom.modal || document.getElementById('modal-backdrop');
        if (!modal) return;
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(function () {
            modal.classList.remove('opacity-0');
            const content = document.getElementById('modal-content');
            if (content) content.classList.remove('scale-95');
        });
    }

    function closeModal() {
        const modal = SG.dom.modal || document.getElementById('modal-backdrop');
        if (!modal || modal.classList.contains('hidden')) return;
        modal.classList.add('opacity-0');
        const content = document.getElementById('modal-content');
        if (content) content.classList.add('scale-95');
        setTimeout(function () {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
            SG.currentModalId = null;
        }, 280);
    }

    SG.modal = {
        openModal: openModal,
        closeModal: closeModal
    };
})();
