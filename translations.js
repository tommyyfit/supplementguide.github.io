// =================================================================
// --- UI TRANSLATIONS — V3.5 (COMPLETE, ZERO HARDCODED STRINGS) ---
// =================================================================

const uiTranslations = {
  cs: {
    // Header / profile
    genderMale:    "Muž 👨",
    genderFemale:  "Žena 👩",
    langCode:      "CZ",

    // Sidebar titles
    stackTitle:    "Můj stack",
    reset:         "Reset",
    emptyStack:    "Zatím prázdné",
    emptyHint:     "Přidej položky kliknutím na +",
    profile:       "Profil:",
    userLabel:     "Uživatel",
    activeLabel:   "Aktivní",
    harmonogram:   "Harmonogram",

    // Stack score
    stackScore:     "Skóre stacku",
    scoreExcellent: "Výborný",
    scoreGood:      "Dobrý",
    scoreFair:      "Průměrný",
    scoreWeak:      "Slabý",
    scoreConflicts: "konflikty",
    scoreSynergy:   "synergie",

    // Warnings
    warningTitle:  "⚠️ Kritické upozornění",
    warning:       "⚠️ Upozornění",
    tip:           "💡 Tip",

    // Schedule slots
    dailyPlan:     "Denní plán",
    morning:       "Ráno",
    preWorkout:    "Před tréninkem",
    intraWorkout:  "Během tréninku",
    postWorkout:   "Po tréninku",
    evening:       "Večer",
    anytime:       "Kdykoliv",

    // Action buttons
    save:          "Uložit",
    export:        "Exportovat",
    copy:          "Kopírovat",
    share:         "Sdílet",
    compareBtn:    "Porovnat",
    backup:        "Backup",
    import:        "Import",

    // Export
    exportTitle:      "Export stacku",
    exportSubtitle:   "Supplement Guide · tommyy.fit",
    exportCancel:     "Zrušit",
    txtExportReady:   "✅ TXT export připraven",
    pdfExportReady:   "✅ PDF export připraven",
    exportEmpty:      "Stack je prázdný",
    exportSectionHdr: "Přehled stacku",
    exportProfile:    "Profil",
    exportGenerated:  "Vygenerováno",
    exportAuthor:     "Autor",
    exportMale:       "Muž",
    exportFemale:     "Žena",
    exportBenefits:   "Přínosy",
    exportTiming:     "Časování",

    // Search & filters
    searchPlaceholder: "Hledat (např. kreatin)",
    notFound:          "Nenalezeny žádné výsledky",
    cats: {
      All:       "Vše",
      Síla:      "Síla",
      Zdraví:    "Zdraví",
      Spánek:    "Spánek",
      Energie:   "Energie",
      Nootropika:"Nootropika"
    },

    // Modal detail
    benefits:    "✅ Přínosy",
    usage:       "ℹ️ Jak užívat",
    dose:        "Dávkování:",
    timing:      "Kdy užívat:",
    synergy:     "Synergie",
    conflicts:   "Konflikty",
    studies:     "Studie",
    studyLabel:  "Vědecká studie",
    addStack:    "Přidat do stacku",
    removeStack: "Odebrat ze stacku",
    detail:      "Detail",
    modalFooterNote: "Ověřeno vědeckými daty",

    // Confidence
    confidenceHigh:   "Ověřeno vědou",
    confidenceMedium: "Slibné důkazy",
    confidenceLow:    "Předběžné důkazy",

    // Profile
    man:   "Muž",
    woman: "Žena",

    // Toast
    toastAdded:   "Přidáno do stacku",
    toastRemoved: "Odebráno ze stacku",

    // Misc
    disclaimer: "Nenahrazuje odbornou lékařskou péči.",

    // Preset stacks
    presetTitle:    "Rychlý start",
    presetSleep:    "💤 Spánek",
    presetStrength: "💪 Síla",
    presetEnergy:   "⚡ Energie",
    presetFocus:    "🧠 Focus",
    presetHealth:   "🛡️ Zdraví",
    presetLoaded:   "Preset načten",

    // Compare
    compareTitle:  "Porovnání doplňků",
    compareClose:  "Zavřít",
    compareClear:  "Vymazat",
    compareHint:   "Klikni Detail a přidej do porovnání (max 3)",
    compareAddOne: "Přidej alespoň 1 další",
    compareMax:    "Max 3 doplňky k porovnání",
    compareDosage: "Dávkování",
    compareTiming: "Časování",
    compareBenef:  "Přínosy",
    compareSyn:    "Synergie",
    compareCon:    "Konflikty",
    compareEvid:   "Vědecká podpora",

    // Saved stacks
    savedProfilesTitle: "Uložené profily",
    saveStackPrompt:    "Zadej název stacku:",
    stackExists:        "Stack \"{name}\" již existuje. Přepsat?",
    stackSaved:         "Stack uložen",
    stackOverwritten:   "Stack přepsán",
    stackLoaded:        "Stack načten",
    stackDeleted:       "Stack smazán",
    deleteConfirm:      "Smazat stack \"{name}\"?",
    loadConfirm:        "Načíst stack \"{name}\"? Přepíše aktuální stack.",
    clearConfirm:       "Opravdu smazat celý stack?",
    stackImported:      "Stack importován",
    invalidLink:        "Neplatný odkaz",
    linkCopied:         "Odkaz zkopírován",
    stackEmpty:         "Stack je prázdný",
    shareStack:         "Sdílet stack",
    copyOk:             "Kopírováno",
    sortRecommended:    "Nejvhodnější",
    sortEvidence:       "Síla důkazů",
    sortAZ:             "A–Z",
    insightsTitle:      "Přehled stacku",
    insightStrong:      "Silný základ",
    insightBalanced:    "Vyvážené",
    insightCaution:     "Pozor",
    insightCore:        "Stack má dobrý základ z kvalitních doplňků.",
    insightSynergy:     "Některé položky se navzájem dobře doplňují.",
    insightConflict:    "Jsou tu překryvy nebo konflikty, které stojí za úpravu.",
    insightTiming:      "Časování vypadá rozumně a dá se ještě jemně doladit.",
    insightMinimal:     "Na začátek je to čisté a přehledné.",
    insightSleep:       "Večerní a stimulační položky drž časově odděleně.",
    insightValue:       "Když dvě věci řeší stejný cíl, nech si tu lepší nebo jednodušší.",
    promptTitle:        "Uložit stack",
    promptConfirm:      "Uložit",
    confirmTitle:       "Potvrzení",
    confirmClearTitle:  "Vymazat stack",
    confirmDeleteTitle: "Smazat profil",
    confirmLoadTitle:   "Načíst profil",
    confirmOverwriteTitle: "Přepsat profil",
    dialogCancel:       "Zrušit",
    dialogConfirm:      "Potvrdit",
    dialogPlaceholder:  "Např. Night Recovery",
    backupReady:        "JSON záloha připravena",
    importReady:        "Stack importován z JSON",
    importInvalid:      "Soubor se nepodařilo načíst",
  },

  en: {
    // Header / profile
    genderMale:    "Man 👨",
    genderFemale:  "Woman 👩",
    langCode:      "EN",

    // Sidebar titles
    stackTitle:    "My Stack",
    reset:         "Reset",
    emptyStack:    "Nothing here yet",
    emptyHint:     "Add items by clicking +",
    profile:       "Profile:",
    userLabel:     "User",
    activeLabel:   "Active",
    harmonogram:   "Schedule",

    // Stack score
    stackScore:     "Stack Score",
    scoreExcellent: "Excellent",
    scoreGood:      "Good",
    scoreFair:      "Fair",
    scoreWeak:      "Weak",
    scoreConflicts: "conflicts",
    scoreSynergy:   "synergies",

    // Warnings
    warningTitle:  "⚠️ Critical Warnings",
    warning:       "⚠️ Notice",
    tip:           "💡 Tip",

    // Schedule slots
    dailyPlan:    "Daily Plan",
    morning:      "Morning",
    preWorkout:   "Pre-workout",
    intraWorkout: "Intra-workout",
    postWorkout:  "Post-workout",
    evening:      "Evening",
    anytime:      "Anytime",

    // Action buttons
    save:         "Save",
    export:       "Export",
    copy:         "Copy",
    share:        "Share",
    compareBtn:   "Compare",
    backup:       "Backup",
    import:       "Import",

    // Export
    exportTitle:      "Export stack",
    exportSubtitle:   "Supplement Guide · tommyy.fit",
    exportCancel:     "Cancel",
    txtExportReady:   "✅ TXT export ready",
    pdfExportReady:   "✅ PDF export ready",
    exportEmpty:      "Stack is empty",
    exportSectionHdr: "Stack overview",
    exportProfile:    "Profile",
    exportGenerated:  "Generated",
    exportAuthor:     "Author",
    exportMale:       "Male",
    exportFemale:     "Female",
    exportBenefits:   "Benefits",
    exportTiming:     "Timing",

    // Search & filters
    searchPlaceholder: "Search (e.g. creatine)",
    notFound:          "No results found",
    cats: {
      All:       "All",
      Síla:      "Strength",
      Zdraví:    "Health",
      Spánek:    "Sleep",
      Energie:   "Energy",
      Nootropika:"Nootropics"
    },

    // Modal detail
    benefits:    "✅ Benefits",
    usage:       "ℹ️ How to use",
    dose:        "Dosage:",
    timing:      "Timing:",
    synergy:     "Synergy",
    conflicts:   "Conflicts",
    studies:     "Studies",
    studyLabel:  "Study",
    addStack:    "Add to stack",
    removeStack: "Remove from stack",
    detail:      "Details",
    modalFooterNote: "Science-backed data",

    // Confidence
    confidenceHigh:   "Science-backed",
    confidenceMedium: "Promising evidence",
    confidenceLow:    "Preliminary evidence",

    // Profile
    man:   "Man",
    woman: "Woman",

    // Toast
    toastAdded:   "Added to stack",
    toastRemoved: "Removed from stack",

    // Misc
    disclaimer: "Not a substitute for medical advice.",

    // Preset stacks
    presetTitle:    "Quick Start",
    presetSleep:    "💤 Sleep",
    presetStrength: "💪 Strength",
    presetEnergy:   "⚡ Energy",
    presetFocus:    "🧠 Focus",
    presetHealth:   "🛡️ Health",
    presetLoaded:   "Preset loaded",

    // Compare
    compareTitle:  "Compare Supplements",
    compareClose:  "Close",
    compareClear:  "Clear",
    compareHint:   "Click Details and add to compare (max 3)",
    compareAddOne: "Add at least 1 more",
    compareMax:    "Max 3 supplements to compare",
    compareDosage: "Dosage",
    compareTiming: "Timing",
    compareBenef:  "Benefits",
    compareSyn:    "Synergy",
    compareCon:    "Conflicts",
    compareEvid:   "Evidence",

    // Saved stacks
    savedProfilesTitle: "Saved profiles",
    saveStackPrompt:    "Enter stack name:",
    stackExists:        "Stack \"{name}\" already exists. Overwrite?",
    stackSaved:         "Stack saved",
    stackOverwritten:   "Stack overwritten",
    stackLoaded:        "Stack loaded",
    stackDeleted:       "Stack deleted",
    deleteConfirm:      "Delete stack \"{name}\"?",
    loadConfirm:        "Load stack \"{name}\"? This will replace current stack.",
    clearConfirm:       "Clear entire stack?",
    stackImported:      "Stack imported",
    invalidLink:        "Invalid link",
    linkCopied:         "Link copied",
    stackEmpty:         "Stack is empty",
    shareStack:         "Share stack",
    copyOk:             "Copied",
    sortRecommended:    "Best fit",
    sortEvidence:       "Evidence",
    sortAZ:             "A–Z",
    insightsTitle:      "Stack overview",
    insightStrong:      "Strong base",
    insightBalanced:    "Balanced",
    insightCaution:     "Attention",
    insightCore:        "Your stack has a solid base of useful items.",
    insightSynergy:     "Some items complement each other well.",
    insightConflict:    "There are overlaps or conflicts worth cleaning up.",
    insightTiming:      "Timing looks reasonable and can still be refined.",
    insightMinimal:     "A clean start without unnecessary clutter.",
    insightSleep:       "Keep evening and stimulant items separated in time.",
    insightValue:       "If two items solve the same job, keep the better or simpler one.",
    promptTitle:        "Save stack",
    promptConfirm:      "Save",
    confirmTitle:       "Confirmation",
    confirmClearTitle:  "Clear stack",
    confirmDeleteTitle: "Delete profile",
    confirmLoadTitle:   "Load profile",
    confirmOverwriteTitle: "Overwrite profile",
    dialogCancel:       "Cancel",
    dialogConfirm:      "Confirm",
    dialogPlaceholder:  "E.g. Night Recovery",
    backupReady:        "JSON backup ready",
    importReady:        "Stack imported from JSON",
    importInvalid:      "Could not read the file",
  }
};


window.uiTranslations = uiTranslations;
