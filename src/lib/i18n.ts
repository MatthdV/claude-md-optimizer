export type Language = 'en' | 'fr';

export const translations = {
  en: {
    // Phase 1
    heroTitle: 'CLAUDE.md Generator & Optimizer',
    heroSubtitle: 'Describe your project. AI will ask the right questions, then generate a production-ready CLAUDE.md.',
    inputPlaceholder: 'Describe your project (e.g. "React dashboard with Supabase and Tailwind")',
    generateButton: 'Next →',
    examplesTitle: 'Try an example:',

    // Phase 1.5 (Questions)
    questionsTitle: 'Your project:',
    questionsSubtitle: 'A few questions to make your CLAUDE.md as specific as possible:',
    skipButton: 'Skip & use templates',
    generateClaude: 'Generate →',
    generating: 'Generating your CLAUDE.md with',

    // Phase 2 (Editor)
    lines: 'lines',
    placeholdersToFill: 'placeholders to fill',
    copy: 'Copy',
    copied: 'Copied!',
    download: 'Download',
    newProject: '← New project',
    realtime: 'Real-time',

    // Phase 3 (Optimizer)
    analyzeButton: 'Analyze',
    analyzing: 'Analyzing...',
    overallScore: 'Overall Score',
    recommendations: 'Recommendations',
    addSection: 'Add section',
    applyFix: 'Apply fix',
    bestPractices: 'Anthropic best practices',

    // Model selector
    modelLabel: 'Model',
    languageLabel: 'Language',

    // Errors / fallback
    llmUnavailable: 'LLM unavailable — using template mode',
    promptTooShort: 'Please describe your project in more detail',
    errorGenerating: 'Error generating content. Falling back to templates.',
  },

  fr: {
    heroTitle: 'Générateur & Optimiseur CLAUDE.md',
    heroSubtitle: "Décris ton projet. L'IA posera les bonnes questions, puis générera un CLAUDE.md prêt pour la production.",
    inputPlaceholder: 'Décris ton projet (ex: "Dashboard React avec Supabase et Tailwind")',
    generateButton: 'Suivant →',
    examplesTitle: 'Essaie un exemple :',

    questionsTitle: 'Ton projet :',
    questionsSubtitle: 'Quelques questions pour rendre ton CLAUDE.md le plus spécifique possible :',
    skipButton: 'Passer & utiliser les templates',
    generateClaude: 'Générer →',
    generating: 'Génération de ton CLAUDE.md avec',

    lines: 'lignes',
    placeholdersToFill: 'placeholders à remplir',
    copy: 'Copier',
    copied: 'Copié !',
    download: 'Télécharger',
    newProject: '← Nouveau projet',
    realtime: 'Temps réel',

    analyzeButton: 'Analyser',
    analyzing: 'Analyse en cours...',
    overallScore: 'Score global',
    recommendations: 'Recommandations',
    addSection: 'Ajouter la section',
    applyFix: 'Appliquer le fix',
    bestPractices: 'Bonnes pratiques Anthropic',

    modelLabel: 'Modèle',
    languageLabel: 'Langue',

    llmUnavailable: 'LLM indisponible — mode templates activé',
    promptTooShort: 'Décris ton projet plus en détail',
    errorGenerating: 'Erreur de génération. Retour au mode templates.',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang][key] || translations.en[key];
}
