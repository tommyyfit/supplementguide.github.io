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
        if (!animate) html.style.transition = 'none';
        html.classList.toggle('dark', !!SG.state.darkMode);
        document.body.classList.toggle('dark', !!SG.state.darkMode);
        const sun = document.getElementById('theme-icon-sun');
        const moon = document.getElementById('theme-icon-moon');
        if (sun) sun.classList.toggle('hidden', !!SG.state.darkMode);
        if (moon) moon.classList.toggle('hidden', !SG.state.darkMode);
        if (!animate) {
            void html.offsetHeight;
            html.style.transition = '';
        }
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
