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
