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
