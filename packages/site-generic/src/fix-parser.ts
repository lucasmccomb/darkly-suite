/**
 * Parse Browse Darkly site-fix directives.
 *
 * Fix format (one directive per line):
 *   CSS <selector> { <property>: <value>; ... }
 *   HIDE <selector>
 *   INVERT <selector>
 *   VAR <custom-property> <value>
 *   SKIP  (skip this domain entirely — it's already dark)
 *
 * Lines starting with # are comments.
 * Empty lines are ignored.
 */

export type FixDirectiveType = 'css' | 'hide' | 'invert' | 'var' | 'skip';

export interface CssDirective {
  type: 'css';
  selector: string;
  css: string; // raw CSS declarations
}

export interface HideDirective {
  type: 'hide';
  selector: string;
}

export interface InvertDirective {
  type: 'invert';
  selector: string;
}

export interface VarDirective {
  type: 'var';
  property: string;
  value: string;
}

export interface SkipDirective {
  type: 'skip';
}

export type FixDirective =
  | CssDirective
  | HideDirective
  | InvertDirective
  | VarDirective
  | SkipDirective;

export interface SiteFix {
  domain: string;
  directives: FixDirective[];
}

export function parseFixDirectives(input: string): FixDirective[] {
  const directives: FixDirective[] = [];
  const lines = input.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;

    if (line === 'SKIP') {
      directives.push({ type: 'skip' });
      continue;
    }

    if (line.startsWith('HIDE ')) {
      directives.push({ type: 'hide', selector: line.slice(5).trim() });
      continue;
    }

    if (line.startsWith('INVERT ')) {
      directives.push({ type: 'invert', selector: line.slice(7).trim() });
      continue;
    }

    if (line.startsWith('VAR ')) {
      const rest = line.slice(4).trim();
      const spaceIdx = rest.indexOf(' ');
      if (spaceIdx > 0) {
        directives.push({
          type: 'var',
          property: rest.slice(0, spaceIdx),
          value: rest.slice(spaceIdx + 1).trim(),
        });
      }
      continue;
    }

    if (line.startsWith('CSS ')) {
      // CSS <selector> { declarations }
      const rest = line.slice(4).trim();
      const braceStart = rest.indexOf('{');
      const braceEnd = rest.lastIndexOf('}');
      if (braceStart > 0 && braceEnd > braceStart) {
        directives.push({
          type: 'css',
          selector: rest.slice(0, braceStart).trim(),
          css: rest.slice(braceStart + 1, braceEnd).trim(),
        });
      }
      continue;
    }
  }

  return directives;
}

/** Parse a multi-site fix bundle (domain blocks separated by @domain lines). */
export function parseFixBundle(input: string): SiteFix[] {
  const fixes: SiteFix[] = [];
  let currentDomain: string | null = null;
  let currentLines: string[] = [];

  for (const line of input.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('@') && !trimmed.startsWith('@media')) {
      // Save previous block
      if (currentDomain && currentLines.length > 0) {
        fixes.push({
          domain: currentDomain,
          directives: parseFixDirectives(currentLines.join('\n')),
        });
      }
      currentDomain = trimmed.slice(1).trim();
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }

  // Save last block
  if (currentDomain && currentLines.length > 0) {
    fixes.push({
      domain: currentDomain,
      directives: parseFixDirectives(currentLines.join('\n')),
    });
  }

  return fixes;
}
