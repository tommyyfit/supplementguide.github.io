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
