(function () {
    const SG = window.SG = window.SG || {};

    const presetStacks = {
        sleep: [41, 42, 43, 24, 47],
        strength: [1, 2, 4, 5, 10],
        energy: [13, 14, 15, 18, 20],
        focus: [16, 17, 21, 22, 14],
        health: [26, 27, 28, 24, 35]
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
