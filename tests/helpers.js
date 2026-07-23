const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HTML_PATH = path.join(__dirname, '..', 'Marts_System_Merged.html');

function extractFunctions(htmlContent) {
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let fullScript = '';

  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    fullScript += match[1] + '\n';
  }

  return fullScript;
}

function loadModule() {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const scriptContent = extractFunctions(html);

  const sandbox = {
    window: {},
    document: {
      getElementById: () => null,
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: () => ({ style: {} }),
      body: { appendChild: () => {} },
    },
    navigator: { userAgent: 'test-agent' },
    localStorage: global.localStorage,
    alert: jest.fn(),
    confirm: jest.fn(() => true),
    prompt: jest.fn(() => 'تصفير'),
    console,
    Date,
    Math,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Array,
    Object,
    String,
    Number,
    JSON,
    RegExp,
    Error,
    TypeError,
    RangeError,
    SyntaxError,
    Map,
    Set,
    Promise,
    setTimeout: (fn) => fn(),
    clearTimeout: () => {},
    setInterval: () => {},
    clearInterval: () => {},
    Intl: { NumberFormat: Intl.NumberFormat },
    btoa: (s) => Buffer.from(s).toString('base64'),
    atob: (s) => Buffer.from(s, 'base64').toString('utf8'),
    fetch: jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })),
    crypto: { getRandomValues: (arr) => arr.fill(42) },
    firebase: {
      initializeApp: () => ({}),
      firestore: () => ({
        collection: () => ({
          doc: () => ({
            set: jest.fn(() => Promise.resolve()),
            get: jest.fn(() => Promise.resolve({ exists: false, data: () => ({}) })),
          }),
        }),
      }),
      auth: () => ({
        signInAnonymously: jest.fn(() => Promise.resolve({ user: { uid: 'test' } })),
      }),
    },
    app: { firebase: {} },
  };

  sandbox.global = sandbox;
  sandbox.window = sandbox;

  const context = vm.createContext(sandbox);

  try {
    vm.runInContext(scriptContent, context, { timeout: 10000 });
  } catch (e) {
    console.warn('Script execution warning (expected for DOM-dependent code):', e.message);
  }

  return sandbox;
}

module.exports = { loadModule, extractFunctions, HTML_PATH };
