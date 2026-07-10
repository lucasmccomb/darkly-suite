/**
 * @darkly/build-tools — Third-Party License Collection
 *
 * Walks an extension package's production dependency tree (plain Node, no
 * external dependencies) and produces a deterministic THIRD-PARTY-LICENSES.txt
 * containing the name, version, license identifier, and full license text of
 * every bundled third-party package. First-party workspace packages
 * (@darkly/*) are traversed for their own production dependencies but are not
 * themselves attributed.
 *
 * MIT/BSD/ISC/Apache licenses require preserving copyright + license text in
 * distributions, so every extension zip must ship this file (#671).
 *
 * Usage (library):
 *   const { collectThirdPartyLicenses, ThirdPartyLicensesPlugin } = require('./collect-licenses');
 *
 * Usage (CLI, for inspection):
 *   node build-tools/collect-licenses.js packages/gmail-darkly
 */

const fs = require('fs');
const path = require('path');

/** Read and parse a JSON file. */
function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Resolve a dependency's real package directory using Node's node_modules
 * walk-up rule, starting from `fromDir`. Returns the realpath (following
 * pnpm's symlink store) or null if the package is not installed.
 */
function resolvePackageDir(name, fromDir) {
  let dir = fromDir;
  for (;;) {
    const candidate = path.join(dir, 'node_modules', ...name.split('/'));
    if (fs.existsSync(path.join(candidate, 'package.json'))) {
      return fs.realpathSync(candidate);
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * A package whose real path contains no node_modules segment is a workspace
 * package (pnpm symlinks workspace deps straight into packages/*).
 */
function isWorkspacePackage(realDir) {
  return !realDir.split(path.sep).includes('node_modules');
}

/** Normalize a package.json `license` field to a display string. */
function licenseIdentifier(pkg) {
  if (typeof pkg.license === 'string') return pkg.license;
  if (pkg.license && typeof pkg.license.type === 'string') return pkg.license.type;
  if (Array.isArray(pkg.licenses)) {
    return pkg.licenses.map((l) => l.type).filter(Boolean).join(' OR ') || 'UNKNOWN';
  }
  return 'UNKNOWN';
}

/** Find and read the LICENSE/LICENCE/NOTICE text shipped with a package. */
function findLicenseText(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return null;
  }
  const candidates = entries
    .filter((entry) => /^licen[cs]e(\.|$|-)/i.test(entry) || /^licen[cs]e$/i.test(entry))
    .sort();
  for (const candidate of candidates) {
    const filePath = path.join(dir, candidate);
    try {
      if (fs.statSync(filePath).isFile()) {
        return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n').trim();
      }
    } catch {
      // Unreadable candidate — try the next one
    }
  }
  return null;
}

/**
 * Collect third-party license info for every production dependency reachable
 * from `packageDir`. Deterministic: dependencies are visited in sorted order
 * and the result is sorted by name@version.
 *
 * @param {string} packageDir - Absolute path to the extension package
 * @returns {string} The full THIRD-PARTY-LICENSES.txt content
 */
function collectThirdPartyLicenses(packageDir) {
  const rootPkg = readJson(path.join(packageDir, 'package.json'));
  const visited = new Set();
  const collected = new Map();

  function visit(pkgDir) {
    const realDir = fs.realpathSync(pkgDir);
    if (visited.has(realDir)) return;
    visited.add(realDir);

    const pkg = readJson(path.join(realDir, 'package.json'));
    // peerDependencies matter too: e.g. kefir is a peer dep of kefir-cast,
    // installed by pnpm and bundled by webpack. Anything resolvable from the
    // package is a bundling candidate and must be attributed.
    const depNames = [
      ...new Set([
        ...Object.keys(pkg.dependencies || {}),
        ...Object.keys(pkg.peerDependencies || {}),
      ]),
    ].sort();

    for (const depName of depNames) {
      const depDir = resolvePackageDir(depName, realDir);
      if (!depDir) continue; // Not installed (optional peer) — nothing is bundled

      if (isWorkspacePackage(depDir)) {
        visit(depDir); // First-party: recurse, do not attribute
        continue;
      }

      const depPkg = readJson(path.join(depDir, 'package.json'));
      const key = `${depPkg.name}@${depPkg.version}`;
      if (!collected.has(key)) {
        collected.set(key, {
          name: depPkg.name,
          version: depPkg.version,
          license: licenseIdentifier(depPkg),
          homepage: depPkg.homepage || (depPkg.repository && depPkg.repository.url) || null,
          text: findLicenseText(depDir),
        });
      }
      visit(depDir);
    }
  }

  visit(packageDir);

  const divider = '-'.repeat(79);
  const sections = [...collected.keys()].sort().map((key) => {
    const entry = collected.get(key);
    const lines = [divider, `${entry.name}@${entry.version} (${entry.license})`];
    if (entry.homepage) lines.push(entry.homepage);
    lines.push(divider, '');
    lines.push(
      entry.text ||
        `License text was not distributed with this package. See the package's repository for the full ${entry.license} license text.`,
    );
    return lines.join('\n');
  });

  const header = [
    'THIRD-PARTY SOFTWARE LICENSES',
    '=============================',
    '',
    `This distribution of ${rootPkg.name} bundles the third-party open-source`,
    'packages listed below. Their copyright notices and license texts are',
    'reproduced here as required by their respective licenses.',
    '',
  ].join('\n');

  return `${header}\n${sections.join('\n\n')}\n`;
}

/**
 * Webpack 5 plugin that emits THIRD-PARTY-LICENSES.txt into the build output.
 * Uses the compiler's own webpack instance (compiler.webpack) so this file
 * needs no webpack dependency of its own.
 */
class ThirdPartyLicensesPlugin {
  /** @param {string} packageDir - Absolute path to the extension package */
  constructor(packageDir) {
    this.packageDir = packageDir;
    this._content = null;
  }

  apply(compiler) {
    const { Compilation, sources } = compiler.webpack;
    compiler.hooks.thisCompilation.tap('ThirdPartyLicensesPlugin', (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: 'ThirdPartyLicensesPlugin',
          stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
        },
        () => {
          // The dependency tree cannot change without a process restart —
          // compute once and reuse across watch-mode rebuilds.
          if (this._content === null) {
            this._content = collectThirdPartyLicenses(this.packageDir);
          }
          compilation.emitAsset('THIRD-PARTY-LICENSES.txt', new sources.RawSource(this._content));
        },
      );
    });
  }
}

module.exports = { collectThirdPartyLicenses, ThirdPartyLicensesPlugin };

if (require.main === module) {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: node build-tools/collect-licenses.js <package-dir>');
    process.exit(1);
  }
  process.stdout.write(collectThirdPartyLicenses(path.resolve(target)));
}
