(function () {
    const SG = window.SG = window.SG || {};

    function buildWarnings(items, lang) {
        const warnings = [];
        const helpers = SG.helpers;
        function hasToken(token) {
            return items.some(function (item) { return helpers.itemHasToken(item, token); });
        }
        function names(list) {
            return list.map(function (item) { return (item.name && (item.name[lang] || item.name.cs)) || ''; }).join(', ');
        }
        if (hasToken('zinek') && hasToken('vápník')) warnings.push(lang === 'cs' ? 'Vápník blokuje vstřebávání zinku — ber je odděleně.' : 'Calcium blocks zinc absorption — separate them.');
        if (hasToken('železo') && hasToken('vápník')) warnings.push(lang === 'cs' ? 'Vápník snižuje vstřebávání železa — dej mezi ně odstup.' : 'Calcium reduces iron absorption — space them apart.');
        if ((hasToken('kofein') || hasToken('caffeine')) && (hasToken('melatonin') || items.some(function (item) { return Number(item.id) === 41; }))) {
            warnings.push(lang === 'cs' ? 'Kofein a melatonin jdou proti sobě — nepatří do stejné večerní rutiny.' : 'Caffeine and melatonin work against each other — do not use them in the same evening routine.');
        }
        const caffeineItems = items.filter(function (item) { return helpers.itemHasToken(item, 'kofein') || helpers.itemHasToken(item, 'caffeine'); });
        if (caffeineItems.length >= 2) warnings.push(lang === 'cs' ? ('Více zdrojů kofeinu: ' + names(caffeineItems) + ' — hlídej celkový denní příjem.') : ('Multiple caffeine sources: ' + names(caffeineItems) + ' — watch total daily intake.'));
        const sleepItems = items.filter(function (item) { return helpers.inferTimingSlot(item) === 'evening'; });
        const stimItems = items.filter(function (item) {
            return helpers.inferTimingSlot(item) === 'pre' && (helpers.itemHasToken(item, 'kofein') || helpers.itemHasToken(item, 'tyrosine') || helpers.itemHasToken(item, 'citrulin') || helpers.itemHasToken(item, 'caffeine'));
        });
        if (sleepItems.length && stimItems.length) warnings.push(lang === 'cs' ? 'Máš mix stimulačních a sleep doplňků. Drž je časově oddělené, jinak stack ztrácí čistotu.' : 'You have both stimulants and sleep items. Keep them well separated to avoid a messy routine.');
        const proteinLike = items.filter(function (item) { return ['protein', 'bílkoviny', 'aminokyseliny'].some(function (token) { return helpers.itemHasToken(item, token); }); });
        if (proteinLike.length >= 3) warnings.push(lang === 'cs' ? 'Více proteinových/aminokyselinových produktů najednou může být zbytečný overlap.' : 'Several protein/amino products together may be unnecessary overlap.');
        if (items.some(function (item) { return Number(item.id) === 52; })) warnings.push(lang === 'cs' ? 'Berberin: při lécích na cukr nebo citlivém trávení je lepší opatrnost.' : 'Berberine: be careful with diabetes medication or sensitive digestion.');
        if (hasToken('tryptofan') && items.some(function (item) { return (item.conflict || []).some(function (value) { return helpers.normalizeText(value).indexOf('ssri') > -1; }); })) warnings.push(lang === 'cs' ? 'L-Tryptofan + SSRI: tohle už je kombinace na konzultaci s lékařem.' : 'L-Tryptophan + SSRI: that combination should be checked with a clinician.');
        return Array.from(new Set(warnings));
    }

    function buildInsights(items, warnings, lang) {
        const t = window.uiTranslations[lang];
        const insights = [];
        const synergyCount = SG.helpers.countSynergies(items);
        const highConf = items.filter(function (item) { return item.confidence === 'high'; }).length;
        const overlapPairs = SG.helpers.countLikelyOverlaps(items);
        if (warnings.length) insights.push({ type: 'caution', text: t.insightConflict });
        if (highConf >= Math.max(2, Math.ceil(items.length / 2))) insights.push({ type: 'strong', text: t.insightCore });
        if (synergyCount >= 1) insights.push({ type: 'balanced', text: t.insightSynergy });
        if (!warnings.length && overlapPairs === 0 && items.length >= 2) insights.push({ type: 'balanced', text: t.insightTiming });
        if (items.length <= 2) insights.push({ type: 'balanced', text: t.insightMinimal });
        if (overlapPairs > 0) insights.push({ type: 'caution', text: t.insightValue });
        return insights.slice(0, 2);
    }

    function renderWarnings(warnings) {
        const container = document.getElementById('warnings-container');
        const list = document.getElementById('warnings-list');
        if (!container || !list) return;
        if (!warnings.length) {
            container.classList.add('hidden');
            list.innerHTML = '';
            return;
        }
        container.classList.remove('hidden');
        list.innerHTML = warnings.map(function (warning) {
            return '<li class="flex gap-2 items-start"><span class="shrink-0 mt-0.5">•</span><span>' + SG.helpers.esc(warning) + '</span></li>';
        }).join('');
    }

    function renderInsights(insights, t) {
        const wrap = document.getElementById('stack-insights');
        const list = document.getElementById('insights-list');
        const pill = document.getElementById('insight-pill');
        if (!wrap || !list || !pill) return;
        if (!insights.length) {
            wrap.classList.add('hidden');
            list.innerHTML = '';
            return;
        }
        wrap.classList.remove('hidden');
        list.innerHTML = insights.map(function (insight) {
            const icon = insight.type === 'strong' ? '✅' : insight.type === 'caution' ? '⚠️' : '💡';
            return '<li class="flex gap-2 items-start"><span class="shrink-0 mt-0.5">' + icon + '</span><span>' + SG.helpers.esc(insight.text) + '</span></li>';
        }).join('');
        if (insights.some(function (item) { return item.type === 'caution'; })) {
            pill.className = 'text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
            pill.innerText = t.insightCaution;
            return;
        }
        if (insights.some(function (item) { return item.type === 'strong'; })) {
            pill.className = 'text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20';
            pill.innerText = t.insightStrong;
            return;
        }
        pill.className = 'text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20';
        pill.innerText = t.insightBalanced;
    }

    function analyze() {
        const items = SG.helpers.getStackItems();
        const lang = SG.state.lang;
        const t = window.uiTranslations[lang];
        const countEl = document.getElementById('stack-count');
        if (countEl) countEl.innerText = String(items.length);
        const profile = document.getElementById('profile-display');
        if (profile) profile.innerText = (SG.state.gender === 'male' ? t.man : t.woman) + ', ' + SG.state.weight + ' kg';
        const emptyEl = document.getElementById('stack-empty');
        const analysisEl = document.getElementById('stack-analysis');
        if (!items.length) {
            if (emptyEl) emptyEl.classList.remove('hidden');
            if (analysisEl) analysisEl.classList.add('hidden');
            if (SG.renderStackScore) SG.renderStackScore(0, 0, 0, t, 0, []);
            renderInsights([], t);
            return;
        }
        if (emptyEl) emptyEl.classList.add('hidden');
        if (analysisEl) analysisEl.classList.remove('hidden');

        const slots = { morning: [], pre: [], intra: [], post: [], evening: [] };
        items.forEach(function (item) {
            slots[SG.helpers.inferTimingSlot(item)].push(SG.helpers.buildScheduleBadge(item, lang));
        });
        const empty = '<span class="text-[10px] text-slate-400 italic pl-1">—</span>';
        ['morning', 'pre', 'intra', 'post', 'evening'].forEach(function (slot) {
            const target = document.getElementById('schedule-' + slot);
            if (target) target.innerHTML = slots[slot].join('') || empty;
        });

        document.querySelectorAll('[data-remove-id]').forEach(function (button) {
            button.addEventListener('click', function (event) {
                event.stopPropagation();
                SG.actions.removeFromStack(Number(button.dataset.removeId));
            }, { once: true });
        });

        const warnings = buildWarnings(items, lang);
        const insights = buildInsights(items, warnings, lang);
        const synergies = SG.helpers.countSynergies(items);
        const highConf = items.filter(function (item) { return item.confidence === 'high'; }).length;
        renderWarnings(warnings);
        renderInsights(insights, t);
        if (SG.renderStackScore) SG.renderStackScore(items.length, warnings.length, synergies, t, highConf, insights);
    }

    SG.buildWarnings = buildWarnings;
    SG.buildInsights = buildInsights;
    SG.renderWarnings = renderWarnings;
    SG.renderInsights = renderInsights;
    SG.analyze = analyze;
})();
