(function () {
    const SG = window.SG = window.SG || {};

    SG.constants = {
        STATE_KEY: 'supplementGuideStateV42',
        LEGACY_STATE_KEYS: ['supplementGuideStateV4', 'supplementGuideStateV41', 'supplementGuideState'],
        SAVED_KEY: 'supplement_saved_stacks_v42',
        LEGACY_SAVED_KEYS: ['supplement_saved_stacks_v4', 'supplement_saved_stacks_v3', 'supplement_saved_stacks_v2']
    };

    SG.state = {
        stack: [],
        weight: 80,
        gender: 'male',
        search: '',
        category: 'All',
        sort: 'recommended',
        darkMode: localStorage.getItem('darkMode') === 'true',
        lang: 'cs',
        savedStacks: {},
        compareList: []
    };

    SG.dom = {};
    SG.currentModalId = null;
    SG.exportModalEl = null;
    SG.dialogResolver = null;
    SG.mobileOverlay = null;
    SG.mobileInitialized = false;
    SG.eventsBound = false;
    SG.themeTimer = null;

    SG.cacheDom = function cacheDom() {
        SG.dom.grid = document.getElementById('catalog-grid');
        SG.dom.weightInput = document.getElementById('user-weight');
        SG.dom.modal = document.getElementById('modal-backdrop');
        SG.dom.compareBar = document.getElementById('compare-bar');
        SG.dom.searchInput = document.getElementById('search-input');
        SG.dom.sortSelect = document.getElementById('sort-select');
        SG.dom.genderSelect = document.getElementById('user-gender');
    };

    SG.hydrateState = function hydrateState() {
        const keys = [SG.constants.STATE_KEY].concat(SG.constants.LEGACY_STATE_KEYS);
        const raw = keys.map(key => localStorage.getItem(key)).find(Boolean);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') Object.assign(SG.state, parsed);
        } catch (error) {
            console.error('State load error', error);
        }
    };

    SG.sanitizeState = function sanitizeState() {
        const helpers = SG.helpers || {};
        const normalizeArray = Array.isArray;
        const validIds = new Set((window.supplements || []).map(item => Number(item.id)));
        SG.state.stack = (normalizeArray(SG.state.stack) ? SG.state.stack : []).map(Number).filter(id => validIds.has(id));
        SG.state.compareList = (normalizeArray(SG.state.compareList) ? SG.state.compareList : []).map(Number).filter(id => validIds.has(id));
        SG.state.savedStacks = SG.state.savedStacks && typeof SG.state.savedStacks === 'object' ? SG.state.savedStacks : {};
        SG.state.weight = Number(SG.state.weight) || 80;
        if (helpers.clamp) SG.state.weight = helpers.clamp(SG.state.weight, 35, 250);
        SG.state.gender = SG.state.gender === 'female' ? 'female' : 'male';
        SG.state.search = '';
        SG.state.category = 'All';
        SG.state.sort = ['recommended', 'evidence', 'az'].includes(SG.state.sort) ? SG.state.sort : 'recommended';
        SG.saveState();
    };

    SG.syncProfileInputs = function syncProfileInputs() {
        if (SG.dom.weightInput) SG.dom.weightInput.value = SG.state.weight;
        if (SG.dom.genderSelect) SG.dom.genderSelect.value = SG.state.gender;
        if (SG.dom.sortSelect) SG.dom.sortSelect.value = SG.state.sort;
    };

    SG.saveState = function saveState() {
        const persisted = Object.assign({}, SG.state);
        delete persisted.search;
        delete persisted.category;
        localStorage.setItem(SG.constants.STATE_KEY, JSON.stringify(persisted));
    };

    SG.syncUI = function syncUI() {
        SG.saveState();
        if (SG.renderCatalog) SG.renderCatalog();
        if (SG.analyze) SG.analyze();
        if (SG.renderCompareBar) SG.renderCompareBar();
        if (SG.renderSavedStacks) SG.renderSavedStacks();
    };

    SG.init = function init() {
        SG.cacheDom();
        SG.hydrateState();
        SG.sanitizeState();
        if (SG.loadSharedStack) SG.loadSharedStack();
        SG.syncProfileInputs();
        if (SG.applyTheme) SG.applyTheme(false);
        if (SG.initSavedStacks) SG.initSavedStacks();
        if (SG.updateLanguageUI) SG.updateLanguageUI();
        if (SG.setupEvents) SG.setupEvents();
        if (SG.renderCatalog) SG.renderCatalog();
        if (SG.analyze) SG.analyze();
        if (SG.renderCompareBar) SG.renderCompareBar();
        if (SG.initMobileStack) SG.initMobileStack();
    };
})();


(function () {
    const SG = window.SG = window.SG || {};

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function capitalize(value) {
        return value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
    }

    function esc(value) {
        if (value == null) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeText(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function getStackItems() {
        return (SG.state.stack || []).map(id => (window.supplements || []).find(item => Number(item.id) === Number(id))).filter(Boolean);
    }

    function getDosage(item, lang) {
        if (Number(item.id) === 2) return Math.round((SG.state.weight || 80) * 0.35) + ' g';
        if (Number(item.id) === 13) return 'max 400 mg';
        return (item.dosage && item.dosage[lang]) || item.dosage || '';
    }

    function formatSavedDate(iso) {
        if (!iso) return '—';
        try {
            return new Date(iso).toLocaleDateString(SG.state.lang === 'cs' ? 'cs-CZ' : 'en-US', { day: '2-digit', month: 'short' });
        } catch (error) {
            return '—';
        }
    }

    function getFormattedDate() {
        return new Date().toLocaleDateString(SG.state.lang === 'cs' ? 'cs-CZ' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function getFileName(ext) {
        const slug = SG.state.lang === 'cs' ? 'suplement-guide-stack' : 'supplement-guide-stack';
        return slug + '-' + new Date().toISOString().slice(0, 10) + '.' + ext;
    }

    function downloadFile(filename, content, type) {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    }

    function fallbackCopy(text, onSuccess) {
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        try {
            document.execCommand('copy');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
        }
        area.remove();
    }

    function copyToClipboard(text, onSuccess) {
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(function () {
                if (onSuccess) onSuccess();
            }).catch(function () {
                fallbackCopy(text, onSuccess);
            });
            return;
        }
        fallbackCopy(text, onSuccess);
    }

    function showToast(message, type) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        const kind = type === 'warn' ? 'warn' : 'success';
        toast.className = 'toast flex items-center gap-2 border ' + (kind === 'warn' ? 'border-yellow-500/50' : 'border-brand-500/50');
        toast.innerHTML = '<span>' + (kind === 'warn' ? '⚠️' : '✅') + '</span><span>' + esc(message) + '</span>';
        container.appendChild(toast);
        setTimeout(function () {
            toast.style.opacity = '0';
            setTimeout(function () { toast.remove(); }, 300);
        }, 2500);
    }

    function itemHasToken(item, token) {
        const query = normalizeText(token);
        const hay = []
            .concat(item.contains || [])
            .concat([item.name && item.name.cs, item.name && item.name.en])
            .filter(Boolean)
            .map(normalizeText);
        return hay.some(function (part) { return part.indexOf(query) > -1; });
    }

    function hasSynergy(a, b) {
        return (a.synergy || []).some(function (value) { return itemHasToken(b, value); }) || (b.synergy || []).some(function (value) { return itemHasToken(a, value); });
    }

    function hasConflict(a, b) {
        return (a.conflict || []).some(function (value) { return itemHasToken(b, value); }) || (b.conflict || []).some(function (value) { return itemHasToken(a, value); });
    }

    function isLikelyOverlap(a, b) {
        const tokensA = [a.name && a.name.cs, a.name && a.name.en].concat(a.contains || []).filter(Boolean).map(normalizeText).join(' ');
        const tokensB = [b.name && b.name.cs, b.name && b.name.en].concat(b.contains || []).filter(Boolean).map(normalizeText).join(' ');
        const groups = [
            ['protein', 'whey', 'casein', 'eaa', 'amino'],
            ['kofein', 'caffeine', 'pre-workout', 'tyrosine'],
            ['magnesium'],
            ['zinek', 'zinc'],
            ['omega', 'fish oil'],
            ['probiotic', 'probiotics']
        ];
        return groups.some(function (group) {
            const inA = group.some(function (token) { return tokensA.indexOf(token) > -1; });
            const inB = group.some(function (token) { return tokensB.indexOf(token) > -1; });
            return inA && inB;
        });
    }

    function countSynergies(items) {
        let count = 0;
        const seen = new Set();
        items.forEach(function (item) {
            (item.synergy || []).forEach(function (synergyValue) {
                const query = normalizeText(synergyValue);
                const match = items.find(function (other) {
                    return other.id !== item.id && (itemHasToken(other, query) || normalizeText(other.name && other.name.cs).indexOf(query) > -1 || normalizeText(other.name && other.name.en).indexOf(query) > -1);
                });
                if (!match) return;
                const key = [item.id, match.id].sort(function (a, b) { return a - b; }).join('-');
                if (!seen.has(key)) {
                    seen.add(key);
                    count += 1;
                }
            });
        });
        return count;
    }

    function countLikelyOverlaps(items) {
        let count = 0;
        for (let i = 0; i < items.length; i += 1) {
            for (let j = i + 1; j < items.length; j += 1) {
                if (isLikelyOverlap(items[i], items[j])) count += 1;
            }
        }
        return count;
    }

    function inferTimingSlot(item) {
        const timing = normalizeText((item.timing && (item.timing.en || item.timing.cs)) || '');
        const name = normalizeText((item.name && (item.name.en || item.name.cs)) || '');
        const contains = (item.contains || []).map(normalizeText).join(' ');

        if (/intra|during|behem|během/.test(timing)) return 'intra';
        if (/post-workout|po treninku|po tréninku|after workout/.test(timing)) return 'post';
        if (/pre-workout|pred treninkem|před tréninkem|before workout/.test(timing)) return 'pre';
        if (/before bed|pred spanim|před spaním|vecer|večer|night/.test(timing)) return 'evening';
        if (/morning|rano|ráno|dopoledne/.test(timing)) return 'morning';
        if (/snack|svacina|svačina|anytime|kdykoliv|with food|with meals|s jidlem|s jídlem/.test(timing)) {
            if (/melatonin|tryptophan|casein|magnesium glycinate|glycin|glycine/.test(name + ' ' + contains)) return 'evening';
            if (/whey|protein|kreatin|creatine/.test(name + ' ' + contains)) return 'post';
            return 'morning';
        }
        if (/caffeine|kofein|citrulline|citrulin|beta-alanine|tyrosine/.test(name + ' ' + contains)) return 'pre';
        if (/omega|vitamin d|multivitamin|probiotic|probiotics|zinek|zinc|berberine|shilajit/.test(name + ' ' + contains)) return 'morning';
        if (/melatonin|magnesium|kasein|casein|glycine|glycin|ashwagandha|tryptophan/.test(name + ' ' + contains)) return 'evening';
        return 'morning';
    }

    function buildScheduleBadge(item, lang) {
        const name = (item.name && (item.name[lang] || item.name.cs)) || '';
        const dose = getDosage(item, lang);
        return '' +
            '<div class="group bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 px-3 py-2 rounded-2xl text-xs font-bold dark:text-white shadow-sm flex justify-between items-center gap-2 transition-all hover:border-brand-500 cursor-pointer" onclick="openModal(' + item.id + ')">' +
                '<span class="truncate">' + esc(name) + '</span>' +
                '<div class="flex items-center gap-2">' +
                    '<span class="text-brand-500 font-black whitespace-nowrap">' + esc(dose) + '</span>' +
                    '<button type="button" data-remove-id="' + item.id + '" onclick="event.stopPropagation()" class="ml-1 text-red-500 hover:text-red-600 transition-all text-[14px] leading-none p-1">✕</button>' +
                '</div>' +
            '</div>';
    }

    function buildFitNote(item, lang) {
        const stackItems = getStackItems().filter(function (other) { return Number(other.id) !== Number(item.id); });
        if (!stackItems.length) {
            return lang === 'cs'
                ? 'Čistý kandidát do stacku. Bez zjevného překryvu a dobře se hodí jako základ.'
                : 'A clean candidate for your stack. No obvious overlap and a solid foundational fit.';
        }
        const synergyMatch = stackItems.find(function (other) { return hasSynergy(item, other); });
        if (synergyMatch) {
            const partner = (synergyMatch.name && (synergyMatch.name[lang] || synergyMatch.name.cs)) || '';
            return lang === 'cs'
                ? 'Dobře zapadá k ' + partner + ' a dává v tomto stacku smysl.'
                : 'Pairs well with ' + partner + ' and makes sense in this stack.';
        }
        const conflictMatch = stackItems.find(function (other) { return hasConflict(item, other); });
        if (conflictMatch) {
            const partner = (conflictMatch.name && (conflictMatch.name[lang] || conflictMatch.name.cs)) || '';
            return lang === 'cs'
                ? 'Pozor na kombinaci s ' + partner + '. Tady už je dobré hlídat časování nebo dávku.'
                : 'Watch the combination with ' + partner + '. Timing or dose should be handled more carefully.';
        }
        const overlapMatch = stackItems.find(function (other) { return isLikelyOverlap(item, other); });
        if (overlapMatch) {
            const partner = (overlapMatch.name && (overlapMatch.name[lang] || overlapMatch.name.cs)) || '';
            return lang === 'cs'
                ? 'Může se překrývat s ' + partner + '. Zvaž, jestli oba produkty řeší jinou roli.'
                : 'May overlap with ' + partner + '. Consider whether both products really serve a different job.';
        }
        return lang === 'cs'
            ? 'Do současného stacku zapadá bez větších varování a působí jako rozumné doplnění.'
            : 'Fits into the current stack without major warnings and looks like a reasonable add-on.';
    }

    function encodeSharePayload(payload) {
        return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    }

    function decodeSharePayload(encoded) {
        return JSON.parse(decodeURIComponent(escape(atob(encoded))));
    }

    SG.helpers = {
        clamp: clamp,
        capitalize: capitalize,
        esc: esc,
        normalizeText: normalizeText,
        getStackItems: getStackItems,
        getDosage: getDosage,
        formatSavedDate: formatSavedDate,
        getFormattedDate: getFormattedDate,
        getFileName: getFileName,
        downloadFile: downloadFile,
        copyToClipboard: copyToClipboard,
        showToast: showToast,
        itemHasToken: itemHasToken,
        hasSynergy: hasSynergy,
        hasConflict: hasConflict,
        isLikelyOverlap: isLikelyOverlap,
        countSynergies: countSynergies,
        countLikelyOverlaps: countLikelyOverlaps,
        inferTimingSlot: inferTimingSlot,
        buildScheduleBadge: buildScheduleBadge,
        buildFitNote: buildFitNote,
        encodeSharePayload: encodeSharePayload,
        decodeSharePayload: decodeSharePayload
    };
})();


(function () {
    const SG = window.SG = window.SG || {};

    const categoryIcons = {
        All: '✨',
        Síla: '💪',
        Zdraví: '🛡️',
        Spánek: '💤',
        Energie: '⚡',
        Nootropika: '🧠'
    };

    function applyTheme(animate) {
        const html = document.documentElement;
        const body = document.body;
        const isDark = !!SG.state.darkMode;

        clearTimeout(SG.themeTimer);

        html.classList.remove('theme-changing');
        html.classList.add('theme-no-transition');
        void html.offsetWidth;

        html.classList.toggle('dark', isDark);
        if (body) body.classList.toggle('dark', isDark);

        const sun = document.getElementById('theme-icon-sun');
        const moon = document.getElementById('theme-icon-moon');
        if (sun) sun.classList.toggle('hidden', isDark);
        if (moon) moon.classList.toggle('hidden', !isDark);

        SG.themeTimer = setTimeout(function () {
            html.classList.remove('theme-no-transition');
        }, animate ? 80 : 0);
    }

    function toggleDarkMode() {
        SG.state.darkMode = !SG.state.darkMode;
        localStorage.setItem('darkMode', String(SG.state.darkMode));
        applyTheme(true);
    }

    function updateLanguageUI() {
        const t = window.uiTranslations && window.uiTranslations[SG.state.lang];
        if (!t) return;
        document.documentElement.lang = SG.state.lang;

        function setText(id, value) {
            const element = document.getElementById(id);
            if (element && value != null) element.innerText = value;
        }

        setText('lang-toggle', t.langCode);
        setText('ui-stack-title', t.stackTitle);
        setText('ui-empty', t.emptyStack);
        setText('ui-user-label', t.userLabel);
        setText('ui-active-label', t.activeLabel);
        setText('btn-txt-save', t.save);
        setText('btn-txt-export', t.export);
        setText('btn-txt-copy', t.copy);
        setText('btn-txt-share', t.share);
        setText('btn-txt-backup', t.backup);
        setText('btn-txt-import', t.import);
        setText('ui-preset-title', '⚡ ' + t.presetTitle);
        setText('ui-modal-footer-note', t.modalFooterNote);
        setText('ui-saved-profiles-title', t.savedProfilesTitle);
        setText('ui-insights-title', t.insightsTitle);
        setText('dialog-kicker', 'Supplement Guide');
        setText('dialog-cancel', t.dialogCancel);
        setText('dialog-confirm', t.dialogConfirm);
        setText('ui-warning-title', t.warningTitle);

        const harmonogramEl = document.getElementById('ui-harmonogram');
        if (harmonogramEl) {
            harmonogramEl.innerHTML = '<span class="w-1 h-1 bg-brand-500 rounded-full"></span> ' + SG.helpers.esc(t.harmonogram);
        }

        setText('ui-morning', t.morning);
        setText('ui-pre', t.preWorkout);
        setText('ui-intra', t.intraWorkout);
        setText('ui-post', t.postWorkout);
        setText('ui-evening', t.evening);

        const searchInput = document.getElementById('search-input');
        if (searchInput) searchInput.placeholder = '🔎 ' + t.searchPlaceholder;

        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            const options = sortSelect.options;
            if (options[0]) options[0].text = '⭐ ' + t.sortRecommended;
            if (options[1]) options[1].text = '🧬 ' + t.sortEvidence;
            if (options[2]) options[2].text = '🔠 ' + t.sortAZ;
            sortSelect.value = SG.state.sort;
        }

        const genderSelect = document.getElementById('user-gender');
        if (genderSelect) {
            const male = genderSelect.querySelector('option[value="male"]');
            const female = genderSelect.querySelector('option[value="female"]');
            if (male) male.textContent = t.genderMale;
            if (female) female.textContent = t.genderFemale;
        }

        const presetMap = {
            'preset-btn-sleep': t.presetSleep,
            'preset-btn-strength': t.presetStrength,
            'preset-btn-energy': t.presetEnergy,
            'preset-btn-focus': t.presetFocus,
            'preset-btn-health': t.presetHealth
        };
        Object.keys(presetMap).forEach(function (id) {
            setText(id, presetMap[id]);
        });

        document.querySelectorAll('.filter-btn').forEach(function (btn) {
            const key = btn.dataset.cat;
            if (!key || !t.cats[key]) return;
            const icon = categoryIcons[key] ? categoryIcons[key] + ' ' : '';
            btn.innerText = icon + t.cats[key];
        });
    }

    function toggleLanguage() {
        SG.state.lang = SG.state.lang === 'cs' ? 'en' : 'cs';
        SG.saveState();
        updateLanguageUI();
        if (SG.renderCatalog) SG.renderCatalog();
        if (SG.analyze) SG.analyze();
        if (SG.renderCompareBar) SG.renderCompareBar();
        if (SG.renderSavedStacks) SG.renderSavedStacks();
        if (SG.currentModalId && SG.modal && SG.modal.openModal) SG.modal.openModal(SG.currentModalId);
        SG.helpers.showToast(SG.state.lang === 'cs' ? 'Jazyk: Čeština' : 'Language: English');
    }

    SG.applyTheme = applyTheme;
    SG.toggleDarkMode = toggleDarkMode;
    SG.updateLanguageUI = updateLanguageUI;
    SG.toggleLanguage = toggleLanguage;
})();


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


(function () {
    const SG = window.SG = window.SG || {};

    function openDialog(config) {
        const t = window.uiTranslations[SG.state.lang];
        const options = config || {};
        const backdrop = document.getElementById('app-dialog-backdrop');
        const dialog = document.getElementById('app-dialog');
        const titleEl = document.getElementById('dialog-title');
        const messageEl = document.getElementById('dialog-message');
        const confirmBtn = document.getElementById('dialog-confirm');
        const cancelBtn = document.getElementById('dialog-cancel');
        const inputWrap = document.getElementById('dialog-input-wrap');
        const input = document.getElementById('dialog-input');
        if (!backdrop || !dialog || !titleEl || !messageEl || !confirmBtn || !cancelBtn || !inputWrap || !input) {
            return Promise.resolve(options.mode === 'prompt' ? '' : false);
        }
        titleEl.innerText = options.title || t.confirmTitle;
        messageEl.innerText = options.message || '';
        confirmBtn.innerText = options.confirmText || t.dialogConfirm;
        cancelBtn.innerText = t.dialogCancel;
        inputWrap.classList.toggle('hidden', options.mode !== 'prompt');
        input.placeholder = options.placeholder || t.dialogPlaceholder || '';
        input.value = '';
        backdrop.classList.remove('hidden');
        requestAnimationFrame(function () {
            backdrop.classList.remove('opacity-0');
            dialog.classList.remove('translate-y-4', 'scale-[0.98]');
        });
        return new Promise(function (resolve) {
            SG.dialogResolver = function (value) {
                const result = options.mode === 'prompt' ? (value ? input.value.trim() : '') : !!value;
                closeDialog();
                resolve(result);
            };
            if (options.mode === 'prompt') setTimeout(function () { input.focus(); }, 50);
        });
    }

    function closeDialog() {
        const backdrop = document.getElementById('app-dialog-backdrop');
        const dialog = document.getElementById('app-dialog');
        if (!backdrop || !dialog) return;
        backdrop.classList.add('opacity-0');
        dialog.classList.add('translate-y-4', 'scale-[0.98]');
        setTimeout(function () {
            backdrop.classList.add('hidden');
        }, 260);
        SG.dialogResolver = null;
    }

    function resolveDialog(value) {
        if (typeof SG.dialogResolver === 'function') SG.dialogResolver(value);
    }

    function showConfirm(options) {
        return openDialog({
            title: options.title,
            message: options.message,
            confirmText: options.confirmText,
            mode: 'confirm'
        });
    }

    function showPrompt(options) {
        return openDialog({
            title: options.title,
            message: options.message,
            confirmText: options.confirmText,
            placeholder: options.placeholder || '',
            mode: 'prompt'
        });
    }

    SG.dialogs = {
        openDialog: openDialog,
        closeDialog: closeDialog,
        resolveDialog: resolveDialog,
        showConfirm: showConfirm,
        showPrompt: showPrompt
    };
})();


(function () {
    const SG = window.SG = window.SG || {};

    function persistSavedStacks() {
        try {
            localStorage.setItem(SG.constants.SAVED_KEY, JSON.stringify(SG.state.savedStacks));
        } catch (error) {
            console.error(error);
        }
    }

    function cleanupSavedStacks() {
        const valid = new Set((window.supplements || []).map(function (item) { return Number(item.id); }));
        Object.keys(SG.state.savedStacks || {}).forEach(function (name) {
            const entry = SG.state.savedStacks[name];
            if (!entry || !Array.isArray(entry.stack)) {
                delete SG.state.savedStacks[name];
                return;
            }
            entry.stack = entry.stack.map(Number).filter(function (id) { return valid.has(id); });
            if (!entry.stack.length) delete SG.state.savedStacks[name];
        });
        persistSavedStacks();
    }

    function initSavedStacks() {
        try {
            const keys = [SG.constants.SAVED_KEY].concat(SG.constants.LEGACY_SAVED_KEYS);
            const raw = keys.map(function (key) { return localStorage.getItem(key); }).find(Boolean) || '{}';
            SG.state.savedStacks = JSON.parse(raw);
        } catch (error) {
            SG.state.savedStacks = {};
        }
        cleanupSavedStacks();
    }

    function renderSavedStacks() {
        const area = document.getElementById('saved-profiles-area');
        const list = document.getElementById('saved-profiles-list');
        if (!area || !list) return;
        const names = Object.keys(SG.state.savedStacks || {});
        list.innerHTML = '';
        if (!names.length) {
            area.classList.add('hidden');
            return;
        }
        area.classList.remove('hidden');
        names.sort(function (a, b) {
            return ((SG.state.savedStacks[b] && SG.state.savedStacks[b].date) || '').localeCompare((SG.state.savedStacks[a] && SG.state.savedStacks[a].date) || '');
        });
        names.forEach(function (name) {
            const row = document.createElement('div');
            row.className = 'flex items-center justify-between bg-slate-100 dark:bg-[#1C1C1E] px-3 py-2 rounded-xl text-xs gap-2';
            row.innerHTML = '' +
                '<button type="button" class="flex-1 min-w-0 text-left">' +
                    '<span class="block font-bold truncate">' + SG.helpers.esc(name) + '</span>' +
                    '<span class="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">' + SG.helpers.formatSavedDate(SG.state.savedStacks[name] && SG.state.savedStacks[name].date) + '</span>' +
                '</button>' +
                '<button type="button" class="text-red-400 hover:text-red-600 ml-2 font-bold">✕</button>';
            const buttons = row.querySelectorAll('button');
            buttons[0].onclick = function () { loadSavedStack(name); };
            buttons[1].onclick = function () { deleteSavedStack(name); };
            list.appendChild(row);
        });
    }

    async function saveStackProfile() {
        const t = window.uiTranslations[SG.state.lang];
        if (!(SG.state.stack || []).length) {
            SG.helpers.showToast(t.stackEmpty, 'warn');
            return;
        }
        let name = await SG.dialogs.showPrompt({
            title: t.promptTitle,
            message: t.saveStackPrompt,
            confirmText: t.promptConfirm,
            placeholder: t.dialogPlaceholder
        });
        if (!name || !name.trim()) return;
        name = name.trim();
        const exists = !!SG.state.savedStacks[name];
        if (exists) {
            const overwrite = await SG.dialogs.showConfirm({
                title: t.confirmOverwriteTitle,
                message: t.stackExists.replace('{name}', name),
                confirmText: t.dialogConfirm
            });
            if (!overwrite) return;
        }
        SG.state.savedStacks[name] = {
            stack: (SG.state.stack || []).slice(),
            weight: SG.state.weight,
            gender: SG.state.gender,
            date: new Date().toISOString()
        };
        persistSavedStacks();
        renderSavedStacks();
        SG.helpers.showToast(exists ? t.stackOverwritten : t.stackSaved);
    }

    async function loadSavedStack(name) {
        const t = window.uiTranslations[SG.state.lang];
        const data = SG.state.savedStacks[name];
        if (!data) return;
        const ok = await SG.dialogs.showConfirm({
            title: t.confirmLoadTitle,
            message: t.loadConfirm.replace('{name}', name),
            confirmText: t.dialogConfirm
        });
        if (!ok) return;
        const valid = new Set((window.supplements || []).map(function (item) { return Number(item.id); }));
        SG.state.stack = data.stack.map(Number).filter(function (id) { return valid.has(id); });
        SG.state.weight = Number(data.weight) || SG.state.weight;
        SG.state.gender = data.gender === 'female' ? 'female' : 'male';
        SG.syncProfileInputs();
        SG.syncUI();
        SG.helpers.showToast(t.stackLoaded);
    }

    async function deleteSavedStack(name) {
        const t = window.uiTranslations[SG.state.lang];
        const ok = await SG.dialogs.showConfirm({
            title: t.confirmDeleteTitle,
            message: t.deleteConfirm.replace('{name}', name),
            confirmText: t.dialogConfirm
        });
        if (!ok) return;
        delete SG.state.savedStacks[name];
        persistSavedStacks();
        renderSavedStacks();
        SG.helpers.showToast(t.stackDeleted);
    }

    function exportStackJSON() {
        const t = window.uiTranslations[SG.state.lang];
        if (!(SG.state.stack || []).length) {
            SG.helpers.showToast(t.stackEmpty, 'warn');
            return;
        }
        const payload = {
            app: 'Supplement Guide V4.2.1',
            createdAt: new Date().toISOString(),
            stack: SG.state.stack,
            weight: SG.state.weight,
            gender: SG.state.gender,
            lang: SG.state.lang
        };
        SG.helpers.downloadFile(SG.helpers.getFileName('json'), JSON.stringify(payload, null, 2), 'application/json');
        SG.helpers.showToast(t.backupReady);
    }

    function triggerImportJSON() {
        const input = document.getElementById('json-import-input');
        if (input) input.click();
    }

    async function handleImportJSON(event) {
        const file = event.target && event.target.files && event.target.files[0];
        const t = window.uiTranslations[SG.state.lang];
        if (!file) return;
        try {
            const text = await file.text();
            const parsed = JSON.parse(text);
            if (!Array.isArray(parsed.stack)) throw new Error('Invalid stack');
            const valid = new Set((window.supplements || []).map(function (item) { return Number(item.id); }));
            SG.state.stack = parsed.stack.map(Number).filter(function (id) { return valid.has(id); });
            SG.state.weight = SG.helpers.clamp(Number(parsed.weight) || SG.state.weight, 35, 250);
            SG.state.gender = parsed.gender === 'female' ? 'female' : 'male';
            SG.syncProfileInputs();
            SG.syncUI();
            SG.helpers.showToast(t.importReady);
        } catch (error) {
            console.error(error);
            SG.helpers.showToast(t.importInvalid, 'warn');
        } finally {
            event.target.value = '';
        }
    }

    function shareStack() {
        const t = window.uiTranslations[SG.state.lang];
        if (!(SG.state.stack || []).length) {
            SG.helpers.showToast(t.stackEmpty, 'warn');
            return;
        }
        try {
            const payload = {
                stack: SG.state.stack,
                weight: SG.state.weight,
                gender: SG.state.gender
            };
            const encoded = encodeURIComponent(SG.helpers.encodeSharePayload(payload));
            const base = location.protocol === 'file:'
                ? location.pathname.split('?')[0] + '?stack=' + encoded
                : location.origin + location.pathname + '?stack=' + encoded;
            SG.helpers.copyToClipboard(base, function () {
                SG.helpers.showToast(t.linkCopied);
            });
        } catch (error) {
            console.error(error);
            SG.helpers.showToast(SG.state.lang === 'cs' ? 'Sdílení se nepodařilo' : 'Share failed', 'warn');
        }
    }

    function loadSharedStack() {
        const encoded = new URLSearchParams(location.search).get('stack');
        if (!encoded) return;
        try {
            const data = SG.helpers.decodeSharePayload(decodeURIComponent(encoded));
            if (!Array.isArray(data.stack)) return;
            const valid = new Set((window.supplements || []).map(function (item) { return Number(item.id); }));
            SG.state.stack = data.stack.map(Number).filter(function (id) { return valid.has(id); });
            SG.state.weight = Number(data.weight) || SG.state.weight;
            SG.state.gender = data.gender === 'female' ? 'female' : 'male';
            SG.syncProfileInputs();
            SG.saveState();
            if (location.protocol !== 'file:' && window.history && history.replaceState) history.replaceState(null, '', location.pathname);
        } catch (error) {
            console.error(error);
            SG.helpers.showToast(window.uiTranslations[SG.state.lang].invalidLink, 'warn');
        }
    }

    SG.initSavedStacks = initSavedStacks;
    SG.renderSavedStacks = renderSavedStacks;
    SG.storage = {
        persistSavedStacks: persistSavedStacks,
        cleanupSavedStacks: cleanupSavedStacks,
        saveStackProfile: saveStackProfile,
        loadSavedStack: loadSavedStack,
        deleteSavedStack: deleteSavedStack,
        exportStackJSON: exportStackJSON,
        triggerImportJSON: triggerImportJSON,
        handleImportJSON: handleImportJSON,
        shareStack: shareStack,
        loadSharedStack: loadSharedStack
    };
})();


(function () {
    const SG = window.SG = window.SG || {};

    function groupStackByTiming() {
        const groups = { morning: [], pre: [], intra: [], post: [], evening: [] };
        SG.helpers.getStackItems().forEach(function (item) {
            groups[SG.helpers.inferTimingSlot(item)].push(item);
        });
        return groups;
    }

    function buildExportHeader(lang) {
        const t = window.uiTranslations[lang];
        return [
            '╔══════════════════════════════════════════════╗',
            '║ ' + t.exportTitle.toUpperCase() + ' ║',
            '╚══════════════════════════════════════════════╝',
            '',
            t.exportProfile + ': ' + (SG.state.gender === 'male' ? t.exportMale : t.exportFemale) + ', ' + SG.state.weight + ' kg',
            t.exportGenerated + ': ' + SG.helpers.getFormattedDate(),
            t.exportAuthor + ': tommyy.fit',
            ''
        ].join('\n');
    }

    function buildExportLines(lang) {
        const t = window.uiTranslations[lang];
        const groups = groupStackByTiming();
        const labels = {
            morning: t.morning,
            pre: t.preWorkout,
            intra: t.intraWorkout,
            post: t.postWorkout,
            evening: t.evening
        };
        const lines = [];
        Object.keys(groups).forEach(function (key) {
            const items = groups[key];
            if (!items.length) return;
            lines.push('━━ ' + labels[key] + ' ━━');
            items.forEach(function (item) {
                lines.push(item.icon + ' ' + ((item.name && (item.name[lang] || item.name.cs)) || ''));
                lines.push('   ' + t.compareDosage + ': ' + SG.helpers.getDosage(item, lang));
                lines.push('   ' + t.exportTiming + ': ' + ((item.timing && (item.timing[lang] || item.timing.cs)) || ''));
                lines.push('   ' + t.exportBenefits + ': ' + (((item.benefits && (item.benefits[lang] || item.benefits.cs)) || []).join(', ')));
                lines.push('');
            });
        });
        return lines;
    }

    function closeExportModal() {
        if (SG.exportModalEl) SG.exportModalEl.remove();
        SG.exportModalEl = null;
    }

    function openExportModal() {
        closeExportModal();
        const t = window.uiTranslations[SG.state.lang];
        const overlay = document.createElement('div');
        overlay.id = 'export-modal-overlay';
        overlay.className = 'fixed inset-0 bg-black/60 z-[250] flex items-center justify-center p-4 backdrop-blur-sm';
        overlay.innerHTML = '' +
            '<div class="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">' +
                '<div class="px-6 py-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/5">' +
                    '<h3 class="font-black text-slate-900 dark:text-white text-lg">' + SG.helpers.esc(t.exportTitle) + '</h3>' +
                    '<p class="text-sm text-slate-500 dark:text-slate-400 mt-1">' + SG.helpers.esc(t.exportSubtitle) + '</p>' +
                '</div>' +
                '<div class="p-5 grid grid-cols-2 gap-3">' +
                    '<button id="btn-export-txt" type="button" class="px-4 py-4 rounded-2xl bg-slate-100 dark:bg-[#2C2C2E] text-slate-800 dark:text-white font-black text-sm hover:bg-brand-500 hover:text-white transition-all">TXT</button>' +
                    '<button id="btn-export-pdf" type="button" class="px-4 py-4 rounded-2xl bg-slate-100 dark:bg-[#2C2C2E] text-slate-800 dark:text-white font-black text-sm hover:bg-brand-500 hover:text-white transition-all">PDF</button>' +
                '</div>' +
                '<div class="p-5 pt-0">' +
                    '<button id="btn-export-close" type="button" class="w-full px-4 py-3 rounded-2xl bg-slate-100 dark:bg-[#2C2C2E] text-slate-700 dark:text-slate-200 font-black text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-[#3A3A3C] transition-all">' + SG.helpers.esc(t.exportCancel) + '</button>' +
                '</div>' +
            '</div>';
        overlay.addEventListener('click', function (event) { if (event.target === overlay) closeExportModal(); });
        document.body.appendChild(overlay);
        SG.exportModalEl = overlay;
        overlay.querySelector('#btn-export-close').addEventListener('click', closeExportModal);
        overlay.querySelector('#btn-export-txt').addEventListener('click', doTXTExport);
        overlay.querySelector('#btn-export-pdf').addEventListener('click', doPDFExport);
    }

    function exportStackText() {
        const t = window.uiTranslations[SG.state.lang];
        if (!(SG.state.stack || []).length) {
            SG.helpers.showToast(t.exportEmpty, 'warn');
            return;
        }
        openExportModal();
    }

    function doTXTExport() {
        const lang = SG.state.lang;
        const content = buildExportHeader(lang) + buildExportLines(lang).join('\n');
        SG.helpers.downloadFile(SG.helpers.getFileName('txt'), content, 'text/plain;charset=utf-8');
        closeExportModal();
        SG.helpers.showToast(window.uiTranslations[lang].txtExportReady);
    }

    function doPDFExport() {
        const lang = SG.state.lang;
        const t = window.uiTranslations[lang];
        const wrapper = document.createElement('div');
        wrapper.style.padding = '32px';
        wrapper.style.fontFamily = 'Inter, Arial, sans-serif';
        wrapper.style.color = '#0f172a';
        wrapper.style.background = '#ffffff';
        const groups = groupStackByTiming();
        const labels = { morning: t.morning, pre: t.preWorkout, intra: t.intraWorkout, post: t.postWorkout, evening: t.evening };
        function renderSection(key) {
            const groupItems = groups[key];
            if (!groupItems.length) return '';
            return '' +
                '<div style="margin-top:20px;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;">' +
                    '<div style="padding:12px 16px;background:#f8fafc;font-weight:800;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">' + labels[key] + '</div>' +
                    groupItems.map(function (item) {
                        return '' +
                            '<div style="padding:16px;border-top:1px solid #eef2f7;">' +
                                '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
                                    '<div style="font-size:20px;">' + item.icon + '</div>' +
                                    '<div style="font-size:15px;font-weight:800;color:#0f172a;">' + SG.helpers.esc((item.name && (item.name[lang] || item.name.cs)) || '') + '</div>' +
                                '</div>' +
                                '<div style="font-size:11px;color:#475569;line-height:1.7;">' +
                                    '<div><strong>' + SG.helpers.esc(t.compareDosage) + ':</strong> ' + SG.helpers.esc(SG.helpers.getDosage(item, lang)) + '</div>' +
                                    '<div><strong>' + SG.helpers.esc(t.exportTiming) + ':</strong> ' + SG.helpers.esc((item.timing && (item.timing[lang] || item.timing.cs)) || '') + '</div>' +
                                    '<div><strong>' + SG.helpers.esc(t.exportBenefits) + ':</strong> ' + SG.helpers.esc((((item.benefits && (item.benefits[lang] || item.benefits.cs)) || []).join(' · '))) + '</div>' +
                                '</div>' +
                            '</div>';
                    }).join('') +
                '</div>';
        }
        wrapper.innerHTML = '' +
            '<div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;">' +
                '<div>' +
                    '<div style="font-size:28px;font-weight:900;color:#0f172a;line-height:1;">' + SG.helpers.esc(t.exportTitle) + '</div>' +
                    '<div style="font-size:12px;color:#64748b;margin-top:6px;">' + SG.helpers.esc(t.exportSubtitle) + '</div>' +
                '</div>' +
                '<div style="text-align:right;font-size:11px;color:#64748b;line-height:1.7;">' +
                    '<div><strong>' + SG.helpers.esc(t.exportProfile) + ':</strong> ' + (SG.state.gender === 'male' ? SG.helpers.esc(t.exportMale) : SG.helpers.esc(t.exportFemale)) + ', ' + SG.state.weight + ' kg</div>' +
                    '<div><strong>' + SG.helpers.esc(t.exportGenerated) + ':</strong> ' + SG.helpers.esc(SG.helpers.getFormattedDate()) + '</div>' +
                    '<div><strong>' + SG.helpers.esc(t.exportAuthor) + ':</strong> tommyy.fit</div>' +
                '</div>' +
            '</div>' +
            ['morning', 'pre', 'intra', 'post', 'evening'].map(renderSection).join('') +
            '<div style="margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;text-align:center;">' + SG.helpers.esc(t.disclaimer) + ' · Supplement Guide V4.2.1 · tommyy.fit</div>';

        if (typeof window.html2pdf !== 'function') {
            SG.helpers.showToast(SG.state.lang === 'cs' ? 'PDF export není dostupný offline.' : 'PDF export is not available offline.', 'warn');
            closeExportModal();
            return;
        }

        window.html2pdf().set({
            margin: 10,
            filename: SG.helpers.getFileName('pdf'),
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(wrapper).save().then(function () {
            SG.helpers.showToast(window.uiTranslations[lang].pdfExportReady);
        });
        closeExportModal();
    }

    function copyStackToClipboard() {
        const t = window.uiTranslations[SG.state.lang];
        if (!(SG.state.stack || []).length) {
            SG.helpers.showToast(t.stackEmpty, 'warn');
            return;
        }
        const lang = SG.state.lang;
        const content = buildExportHeader(lang) + buildExportLines(lang).join('\n');
        SG.helpers.copyToClipboard(content, function () {
            SG.helpers.showToast(t.copy + ' ✅');
        });
    }

    SG.exporter = {
        groupStackByTiming: groupStackByTiming,
        buildExportHeader: buildExportHeader,
        buildExportLines: buildExportLines,
        openExportModal: openExportModal,
        closeExportModal: closeExportModal,
        exportStackText: exportStackText,
        doTXTExport: doTXTExport,
        doPDFExport: doPDFExport,
        copyStackToClipboard: copyStackToClipboard
    };
})();


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


(function () {
    const SG = window.SG = window.SG || {};

    const presetStacks = {
        sleep: [24, 42, 47, 48, 41],
        strength: [1, 2, 4, 5, 10],
        energy: [13, 14, 15, 18, 36],
        focus: [13, 14, 15, 16, 18],
        health: [26, 27, 28, 24, 25]
    };

    function toggleItem(id) {
        id = Number(id);
        if (!Array.isArray(SG.state.stack)) SG.state.stack = [];
        const t = window.uiTranslations[SG.state.lang];
        const idx = SG.state.stack.indexOf(id);
        if (idx > -1) {
            SG.state.stack.splice(idx, 1);
            SG.helpers.showToast(t.toastRemoved);
        } else {
            SG.state.stack.push(id);
            SG.helpers.showToast(t.toastAdded);
        }
        SG.syncUI();
        if (SG.currentModalId) SG.modal.openModal(SG.currentModalId);
    }

    function removeFromStack(id) {
        SG.state.stack = (SG.state.stack || []).filter(function (value) { return Number(value) !== Number(id); });
        SG.helpers.showToast(window.uiTranslations[SG.state.lang].toastRemoved);
        SG.syncUI();
    }

    async function clearStack() {
        const t = window.uiTranslations[SG.state.lang];
        const ok = await SG.dialogs.showConfirm({
            title: t.confirmClearTitle,
            message: t.clearConfirm,
            confirmText: t.dialogConfirm
        });
        if (!ok) return;
        SG.state.stack = [];
        SG.syncUI();
    }

    function loadPreset(key) {
        const ids = presetStacks[key];
        if (!ids) return;
        const valid = new Set((window.supplements || []).map(function (item) { return Number(item.id); }));
        SG.state.stack = ids.filter(function (id) { return valid.has(Number(id)); });
        SG.syncUI();
        const t = window.uiTranslations[SG.state.lang];
        SG.helpers.showToast(t.presetLoaded + ': ' + t['preset' + SG.helpers.capitalize(key)]);
    }

    function setupEvents() {
        if (SG.eventsBound) return;
        SG.eventsBound = true;

        function debounce(fn, delay) {
            let timer = null;
            return function () {
                const args = arguments;
                clearTimeout(timer);
                timer = setTimeout(function () {
                    fn.apply(null, args);
                }, delay || 150);
            };
        }

        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', debounce(function (event) {
                SG.state.search = event.target.value || '';
                if (SG.renderCatalog) SG.renderCatalog();
            }, 120));
        }

        const weightInput = document.getElementById('user-weight');
        if (weightInput) {
            weightInput.addEventListener('change', function (event) {
                SG.state.weight = SG.helpers.clamp(Number(event.target.value) || 80, 35, 250);
                event.target.value = SG.state.weight;
                SG.saveState();
                if (SG.analyze) SG.analyze();
            });
        }

        const genderSelect = document.getElementById('user-gender');
        if (genderSelect) {
            genderSelect.addEventListener('change', function (event) {
                SG.state.gender = event.target.value === 'female' ? 'female' : 'male';
                SG.saveState();
                if (SG.analyze) SG.analyze();
            });
        }

        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', function (event) {
                SG.state.sort = event.target.value;
                SG.saveState();
                if (SG.renderCatalog) SG.renderCatalog();
            });
        }

        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.addEventListener('click', SG.toggleDarkMode);
        const langToggle = document.getElementById('lang-toggle');
        if (langToggle) langToggle.addEventListener('click', SG.toggleLanguage);

        document.addEventListener('click', function (event) {
            const button = event.target.closest && event.target.closest('.filter-btn');
            if (!button) return;
            document.querySelectorAll('.filter-btn').forEach(function (btn) {
                btn.classList.remove('active', 'bg-slate-900', 'text-white', 'dark:bg-white', 'dark:text-black');
                btn.classList.add('bg-slate-100', 'text-slate-600', 'dark:bg-[#2C2C2E]', 'dark:text-slate-300');
            });
            button.classList.add('active', 'bg-slate-900', 'text-white', 'dark:bg-white', 'dark:text-black');
            button.classList.remove('bg-slate-100', 'dark:bg-[#2C2C2E]');
            SG.state.category = button.dataset.cat || 'All';
            if (SG.renderCatalog) SG.renderCatalog();
        });

        const modal = document.getElementById('modal-backdrop');
        if (modal) {
            modal.addEventListener('click', function (event) {
                if (event.target === modal) SG.modal.closeModal();
            });
        }

        const jsonInput = document.getElementById('json-import-input');
        if (jsonInput) jsonInput.addEventListener('change', SG.storage.handleImportJSON);

        const dialogBackdrop = document.getElementById('app-dialog-backdrop');
        if (dialogBackdrop) {
            dialogBackdrop.addEventListener('click', function (event) {
                if (event.target === dialogBackdrop) SG.dialogs.resolveDialog(false);
            });
        }
        const cancelBtn = document.getElementById('dialog-cancel');
        if (cancelBtn) cancelBtn.addEventListener('click', function () { SG.dialogs.resolveDialog(false); });
        const confirmBtn = document.getElementById('dialog-confirm');
        if (confirmBtn) confirmBtn.addEventListener('click', function () { SG.dialogs.resolveDialog(true); });

        document.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') return;
            const backdrop = document.getElementById('app-dialog-backdrop');
            if (backdrop && !backdrop.classList.contains('hidden')) {
                SG.dialogs.resolveDialog(false);
                return;
            }
            SG.modal.closeModal();
            if (SG.exporter) SG.exporter.closeExportModal();
        });
    }

    SG.actions = {
        toggleItem: toggleItem,
        removeFromStack: removeFromStack,
        clearStack: clearStack,
        loadPreset: loadPreset
    };
    SG.setupEvents = setupEvents;
})();


(function () {
    const SG = window.SG = window.SG || {};

    function initMobileStack() {
        if (SG.mobileInitialized) return;
        SG.mobileInitialized = true;
        const BREAKPOINT = 1024;
        const fab = document.getElementById('mobile-stack-fab');
        const sidebar = document.getElementById('stack-sidebar');
        const stackCount = document.getElementById('stack-count');
        const badge = document.getElementById('fab-count');
        if (!fab || !sidebar) return;

        const overlay = document.createElement('div');
        overlay.id = 'mobile-stack-overlay';
        overlay.innerHTML = '<div class="stack-inner relative"><button type="button" class="stack-close-btn" aria-label="Close">✕</button></div>';
        document.body.appendChild(overlay);
        SG.mobileOverlay = overlay;

        const inner = overlay.querySelector('.stack-inner');
        const closeBtn = overlay.querySelector('.stack-close-btn');

        function openStack() {
            if (window.innerWidth >= BREAKPOINT) return;
            inner.querySelectorAll(':scope > *:not(.stack-close-btn)').forEach(function (node) { node.remove(); });
            const clone = sidebar.firstElementChild ? sidebar.firstElementChild.cloneNode(true) : null;
            if (clone) inner.appendChild(clone);
            overlay.classList.add('active');
            document.body.classList.add('stack-open');
            fab.setAttribute('aria-expanded', 'true');
        }

        function closeStack() {
            overlay.classList.remove('active');
            document.body.classList.remove('stack-open');
            fab.setAttribute('aria-expanded', 'false');
            setTimeout(function () {
                inner.querySelectorAll(':scope > *:not(.stack-close-btn)').forEach(function (node) { node.remove(); });
            }, 180);
        }

        fab.addEventListener('click', function () { overlay.classList.contains('active') ? closeStack() : openStack(); });
        closeBtn.addEventListener('click', closeStack);
        overlay.addEventListener('click', function (event) { if (event.target === overlay) closeStack(); });
        window.addEventListener('resize', function () { if (window.innerWidth >= BREAKPOINT) closeStack(); });

        if (stackCount && badge) {
            const updateBadge = function () {
                const count = parseInt(stackCount.textContent, 10) || 0;
                badge.textContent = count > 99 ? '99+' : String(count);
                badge.style.display = count ? 'flex' : 'none';
            };
            updateBadge();
            new MutationObserver(updateBadge).observe(stackCount, { childList: true, characterData: true, subtree: true });
        }
    }

    SG.initMobileStack = initMobileStack;
})();


(function () {
    const SG = window.SG = window.SG || {};

    window.openModal = function (id) { return SG.modal.openModal(id); };
    window.closeModal = function () { return SG.modal.closeModal(); };
    window.toggleItem = function (id) { return SG.actions.toggleItem(id); };
    window.removeFromStack = function (id) { return SG.actions.removeFromStack(id); };
    window.clearStack = function () { return SG.actions.clearStack(); };
    window.loadPreset = function (key) { return SG.actions.loadPreset(key); };
    window.toggleCompare = function (id) { return SG.compare.toggleCompare(id); };
    window.clearCompare = function () { return SG.compare.clearCompare(); };
    window.openCompareModal = function () { return SG.compare.openCompareModal(); };
    window.saveStackProfile = function () { return SG.storage.saveStackProfile(); };
    window.exportStackText = function () { return SG.exporter.exportStackText(); };
    window.copyStackToClipboard = function () { return SG.exporter.copyStackToClipboard(); };
    window.shareStack = function () { return SG.storage.shareStack(); };
    window.exportStackJSON = function () { return SG.storage.exportStackJSON(); };
    window.triggerImportJSON = function () { return SG.storage.triggerImportJSON(); };

    function boot() {
        if (!window.supplements && typeof supplements !== 'undefined') window.supplements = supplements;
        if (!window.uiTranslations && typeof uiTranslations !== 'undefined') window.uiTranslations = uiTranslations;
        if (!window.changeLogData && typeof changeLogData !== 'undefined') window.changeLogData = changeLogData;

        if (!window.supplements || !window.uiTranslations) {
            console.error('Supplement Guide boot failed: base data missing.');
            return;
        }
        SG.init();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
