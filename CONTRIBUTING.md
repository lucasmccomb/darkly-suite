# Contributing to Darkly Suite

Thanks for considering a contribution.

## Setup

```bash
pnpm install
pnpm -r build
```

Then load any extension's `dist/` directory in Chrome via `chrome://extensions` (Developer mode → Load unpacked).

## Development

Each extension has a dev mode that disables the paywall and runs webpack in watch mode:

```bash
pnpm dev:gmail
pnpm dev:sheets
pnpm dev:docs
pnpm dev:suite
```

## Tests

```bash
pnpm -r test
```

Tests live in `packages/core/src/**/__tests__/` and `packages/landing-shared/functions/__tests__/`.

## Pull Requests

- One concern per PR
- Include a brief test plan in the description
- Make sure `pnpm -r lint && pnpm -r type-check && pnpm -r test && pnpm -r build` all pass before pushing
- Reference an issue number in the commit message: `#123: Brief description`

## Code style

The repo uses ESLint and TypeScript strict mode. Lint and type-check must be clean.
