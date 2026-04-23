(function () {
    const SG = window.SG = window.SG || {};

    function getItemPriority(item) {
        const helpers = SG.helpers;
        const confidenceScore = ({ high: 100, medium: 72, low: 48 })[item.confidence] || 48;
        let score = confidenceScore;
        const stackItems = helpers.getStackItems();
        const tokenBank = [item.name && item.name.cs, item.name && item.name.en].concat(item.contains || []).map(helpers.normalizeText).join(' ');
        const foundational = ['creatine', 'kreatin', 'omega', 'vitamin d', 'magnesium', 'protein', 'whey', 'zinek', 'zinc', 'electrolytes', 'elektrolyty', 'multivitamin', 'probiotic'];
        if (foundational.some(function (token) { return tokenBank.indexOf(token) > -1; })) score += 8;
        if (SG.state.category !== 'All' && item.category === SG.state.category) score += 7;
        if (stackItems.some(function (other) { return other.id !== item.id && helpers.hasSynergy(item, other); })) score += 10;
        if (stackItems.some(function (other) { return other.id !== item.id && helpers.hasConflict(item, other); })) score -= 16;
        if ((SG.state.stack || []).includes(item.id)) score -= 4;
        const overlapCount = stackItems.filter(function (other) { return other.id !== item.id && helpers.isLikelyOverlap(item, other); }).length;
        score -= Math.min(overlapCount * 5, 12);
        return score;
    }

    function sortItems(items) {
        const sorted = items.slice();
        const lang = SG.state.lang;
        if (SG.state.sort === 'az') {
            return sorted.sort(function (a, b) {
                return ((a.name && (a.name[lang] || a.name.cs)) || '').localeCompare((b.name && (b.name[lang] || b.name.cs)) || '', lang);
            });
        }
        if (SG.state.sort === 'evidence') {
            const rank = { high: 3, medium: 2, low: 1 };
            return sorted.sort(function (a, b) {
                return ((rank[b.confidence] || 0) - (rank[a.confidence] || 0)) || (getItemPriority(b) - getItemPriority(a));
            });
        }
        return sorted.sort(function (a, b) {
            return (getItemPriority(b) - getItemPriority(a)) || (((a.name && (a.name[lang] || a.name.cs)) || '').localeCompare((b.name && (b.name[lang] || b.name.cs)) || '', lang));
        });
    }

    function renderCatalog() {
        const grid = SG.dom.grid || document.getElementById('catalog-grid');
        if (!grid || !window.supplements || !window.uiTranslations) return;
        const lang = SG.state.lang;
        const t = window.uiTranslations[lang];
        const categoryLabels = t.cats || {};
        const term = SG.helpers.normalizeText(SG.state.search || '');
        const filtered = sortItems(window.supplements.filter(function (item) {
            const categoryOk = SG.state.category === 'All' || item.category === SG.state.category;
            if (!categoryOk) return false;
            if (!term) return true;
            const hay = []
                .concat([item.name && item.name[lang], item.name && item.name.cs, item.name && item.name.en])
                .concat([item.description && item.description[lang], item.description && item.description.cs, item.description && item.description.en])
                .concat((item.benefits && item.benefits[lang]) || [])
                .concat((item.benefits && item.benefits.cs) || [])
                .concat((item.benefits && item.benefits.en) || [])
                .concat(item.contains || [])
                .concat(item.category)
                .filter(Boolean)
                .map(SG.helpers.normalizeText)
                .join(' ');
            return hay.indexOf(term) > -1;
        }));

        if (!filtered.length) {
            grid.innerHTML = '<div class="col-span-full text-center text-slate-400 py-10 opacity-60 text-sm">' + SG.helpers.esc(t.notFound) + '</div>';
            return;
        }

        grid.innerHTML = filtered.map(function (item) {
            const active = (SG.state.stack || []).includes(item.id);
            const inCompare = (SG.state.compareList || []).includes(item.id);
            const nameText = (item.name && (item.name[lang] || item.name.cs)) || '';
            const descText = (item.description && (item.description[lang] || item.description.cs)) || '';
            const category = categoryLabels[item.category] || item.category || '';
            const subtleMeta = SG.state.sort === 'evidence' ? (t['confidence' + SG.helpers.capitalize(item.confidence)] || '') : '';
            return '' +
                '<div class="card-hover p-5 flex flex-col relative card-fade-in bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 rounded-3xl" onclick="openModal(' + item.id + ')">' +
                    '<div class="absolute top-4 right-4 flex items-center gap-2 z-10">' +
                        (inCompare ? '<span class="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">VS</span>' : '') +
                    '</div>' +
                    '<div class="flex justify-between items-start mb-3 pr-14">' +
                        '<div class="w-12 h-12 flex items-center justify-center rounded-2xl text-2xl icon-bg-' + item.category + '">' + (item.icon || '') + '</div>' +
                        '<span class="cat-badge-' + item.category + '">' + SG.helpers.esc(category) + '</span>' +
                    '</div>' +
                    '<h3 class="font-bold text-slate-900 dark:text-white text-lg mb-1 leading-tight tracking-tight">' + SG.helpers.esc(nameText) + '</h3>' +
                    '<p class="text-sm text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 font-medium">' + SG.helpers.esc(descText) + '</p>' +
                    (subtleMeta ? '<div class="mb-3 text-[10px] font-bold tracking-wide text-slate-400 dark:text-slate-500">' + SG.helpers.esc(subtleMeta) + '</div>' : '<div class="mb-1"></div>') +
                    '<div class="mt-auto pt-4 border-t border-slate-50 dark:border-white/5 flex justify-between items-center gap-3">' +
                        '<button type="button" onclick="event.stopPropagation();openModal(' + item.id + ')" class="text-xs font-black text-slate-400 hover:text-brand-500 uppercase tracking-widest transition">' + SG.helpers.esc(t.detail || 'Details') + '</button>' +
                        '<div class="flex items-center gap-2">' +
                            '<button type="button" onclick="event.stopPropagation();toggleCompare(' + item.id + ')" class="w-10 h-10 rounded-full flex items-center justify-center transition-all font-bold ' + (inCompare ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25' : 'bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-brand-500') + '" title="' + SG.helpers.esc(t.compareBtn) + '">⇄</button>' +
                            '<button type="button" onclick="event.stopPropagation();toggleItem(' + item.id + ')" class="w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all font-bold ' + (active ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-400 hover:text-brand-500') + '">' + (active ? '✓' : '+') + '</button>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }).join('');
    }

    function renderStackScore(count, conflicts, synergies, t, highConf, insights) {
        const element = document.getElementById('stack-score-widget');
        if (!element) return;
        if (!count) {
            element.classList.add('hidden');
            element.innerHTML = '';
            return;
        }
        element.classList.remove('hidden');
        highConf = highConf || 0;
        insights = insights || [];
        let score = 38;
        score += Math.min(highConf * 8, 32);
        score += Math.min(synergies * 6, 24);
        score -= Math.min(conflicts * 12, 36);
        score += insights.some(function (item) { return item.type === 'strong'; }) ? 4 : 0;
        score = SG.helpers.clamp(Math.round(score), 0, 100);

        let label;
        let color;
        let ring;
        if (score >= 80) { label = t.scoreExcellent; color = 'text-green-600 dark:text-green-400'; ring = '#22c55e'; }
        else if (score >= 62) { label = t.scoreGood; color = 'text-brand-600 dark:text-brand-400'; ring = '#3b82f6'; }
        else if (score >= 42) { label = t.scoreFair; color = 'text-yellow-600 dark:text-yellow-400'; ring = '#f59e0b'; }
        else { label = t.scoreWeak; color = 'text-red-500 dark:text-red-400'; ring = '#ef4444'; }

        const circumference = 2 * Math.PI * 20;
        const dash = ((score / 100) * circumference).toFixed(1);
        element.innerHTML = '' +
            '<div class="flex items-center gap-4">' +
                '<div class="relative w-14 h-14 shrink-0">' +
                    '<svg class="w-14 h-14 -rotate-90" viewBox="0 0 48 48">' +
                        '<circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" stroke-width="4" class="text-slate-100 dark:text-white/10"></circle>' +
                        '<circle cx="24" cy="24" r="20" fill="none" stroke="' + ring + '" stroke-width="4" stroke-dasharray="' + dash + ' ' + circumference.toFixed(1) + '" stroke-linecap="round" style="transition:stroke-dasharray .7s ease"></circle>' +
                    '</svg>' +
                    '<span class="absolute inset-0 flex items-center justify-center text-sm font-black ' + color + '">' + score + '</span>' +
                '</div>' +
                '<div class="min-w-0">' +
                    '<p class="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">' + SG.helpers.esc(t.stackScore) + '</p>' +
                    '<p class="text-sm font-black ' + color + '">' + SG.helpers.esc(label) + '</p>' +
                    '<p class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">' +
                        (synergies > 0 ? ('✅ ' + synergies + ' ' + SG.helpers.esc(t.scoreSynergy)) : '') +
                        (synergies > 0 && conflicts > 0 ? ' · ' : '') +
                        (conflicts > 0 ? ('⚠️ ' + conflicts + ' ' + SG.helpers.esc(t.scoreConflicts)) : '') +
                        (!synergies && !conflicts ? '—' : '') +
                    '</p>' +
                '</div>' +
            '</div>';
    }

    SG.getItemPriority = getItemPriority;
    SG.sortItems = sortItems;
    SG.renderCatalog = renderCatalog;
    SG.renderStackScore = renderStackScore;
})();
