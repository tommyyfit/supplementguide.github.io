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
            .concat([item.name && item.name.cs, item.name && item.name.en, item.description && item.description.cs, item.description && item.description.en])
            .concat(item.conflict || [])
            .concat(item.synergy || [])
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
