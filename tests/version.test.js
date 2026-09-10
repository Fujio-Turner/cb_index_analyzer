const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const pkg = require(path.join(root, 'package.json'));

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

describe('version sync (see guides/RELEASE.md)', () => {
  const v = pkg.version;

  test('package.json version is semver-ish', () => {
    expect(v).toMatch(/^\d+\.\d+\.\d+(-\d+)?$/);
  });

  test('index.html APP_VERSION matches package.json', () => {
    const html = read('index.html');
    expect(html).toMatch(new RegExp(`const APP_VERSION\\s*=\\s*['"]${v.replace(/\./g, '\\.')}['"]`));
  });

  test('index.html fallback badge text matches package.json', () => {
    const html = read('index.html');
    expect(html).toMatch(new RegExp(`id="app-version-badge"[^>]*>v${v.replace(/\./g, '\\.')}<`));
  });

  test('README Current Release matches package.json', () => {
    expect(read('README.md')).toMatch(new RegExp(`\\*\\*v${v.replace(/\./g, '\\.')}\\*\\*`));
  });

  test('release_notes.md latest heading matches package.json', () => {
    const notes = read('release_notes.md');
    const m = notes.match(/^## v([^\s(]+)/m);
    expect(m).not.toBeNull();
    expect(m[1]).toBe(v);
  });

  test('server.js reads version from package.json (no hardcoded copy)', () => {
    const src = read('server.js');
    expect(src).toMatch(/require\('\.\/package\.json'\)\.version/);
    expect(src).toMatch(/CB Index Analyzer v\$\{APP_VERSION\}/);
  });
});
