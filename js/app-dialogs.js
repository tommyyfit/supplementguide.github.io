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
