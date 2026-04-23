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
