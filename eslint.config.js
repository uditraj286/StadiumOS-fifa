/* ESLint flat config — StadiumOS AI.
   Two runtimes, one repo: browser globals for the no-build frontend, Node for
   the server / serverless API / tests. Rules focus on correctness (bugs) over
   style; formatting is Prettier's job (see .prettierrc). */
const js = require('@eslint/js');

/** Globals the browser scripts rely on (classic scripts sharing one scope). */
const browserGlobals = {
  window: 'readonly', document: 'readonly', navigator: 'readonly',
  fetch: 'readonly', console: 'readonly', setTimeout: 'readonly',
  setInterval: 'readonly', clearTimeout: 'readonly', clearInterval: 'readonly',
  performance: 'readonly', localStorage: 'readonly', sessionStorage: 'readonly',
  CustomEvent: 'readonly', Event: 'readonly', PointerEvent: 'readonly',
  TextDecoder: 'readonly', speechSynthesis: 'readonly',
  SpeechSynthesisUtterance: 'readonly', webkitSpeechRecognition: 'readonly',
  innerWidth: 'readonly', innerHeight: 'readonly', location: 'readonly',
  requestAnimationFrame: 'readonly', getComputedStyle: 'readonly',
  IntersectionObserver: 'readonly', URL: 'readonly',
};

const nodeGlobals = {
  require: 'readonly', module: 'writable', process: 'readonly',
  __dirname: 'readonly', console: 'readonly', Buffer: 'readonly',
  setTimeout: 'readonly', setInterval: 'readonly', clearTimeout: 'readonly',
  fetch: 'readonly', URL: 'readonly',
};

/* Correctness-first rule set. Stylistic rules are intentionally off — the
   codebase is compact, hand-tuned vanilla JS; Prettier handles formatting. */
const rules = {
  ...js.configs.recommended.rules,
  'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }],
  'no-empty': ['error', { allowEmptyCatch: true }],   // deliberate: graceful-degradation catches
  // False positive on the `let x = null; try { x = init() } … export { x }` pattern.
  'no-useless-assignment': 'off',
  'no-undef': 'error',
  eqeqeq: ['warn', 'smart'],
  'no-var': 'error',
  'prefer-const': 'warn',
};

module.exports = [
  { ignores: ['node_modules/**', '.vercel/**'] },
  {
    // Browser: classic scripts share one global scope (config.js → gemini.js → app.js).
    files: ['app.js', 'gemini.js', 'config.js'],
    languageOptions: {
      ecmaVersion: 2024, sourceType: 'script',
      globals: {
        ...browserGlobals,
        // Cross-file globals defined by the classic-script chain:
        STADIUM_CONFIG: 'readonly', AI: 'writable', S: 'writable',
        toast: 'readonly', stadiumContext: 'readonly',
      },
    },
    rules: {
      ...rules,
      'no-unused-vars': 'off',  // view templates reference functions across files
      // gemini.js legitimately DEFINES the AI/stadiumContext globals it shares.
      'no-redeclare': ['error', { builtinGlobals: false }],
    },
  },
  {
    // Browser ES modules (Firestore layer).
    files: ['firebase/**/*.js'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'module', globals: browserGlobals },
    rules,
  },
  {
    // Node: server, serverless functions, scripts, tests.
    files: ['server.js', 'api/**/*.js', 'scripts/**/*.js', 'tests/**/*.js', 'eslint.config.js'],
    languageOptions: { ecmaVersion: 2024, sourceType: 'commonjs', globals: nodeGlobals },
    rules,
  },
];
