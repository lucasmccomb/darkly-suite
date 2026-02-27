import fs from 'fs';
import path from 'path';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Layout } from './components/Layout';
import { SiteConfig } from './types';

// Import all site configs
import { gmailConfig } from './sites/gmail.config';

const SITES: SiteConfig[] = [gmailConfig];

const TOKENS_DIR = path.resolve(__dirname, 'tokens');
const PAGES_DIR = path.resolve(__dirname, '..', 'pages');

function readCSSFile(filename: string): string {
  return fs.readFileSync(path.join(TOKENS_DIR, filename), 'utf-8');
}

const RESET_CSS = `
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  html, body {
    height: 100%;
    width: 100%;
    overflow: hidden;
    font-family: Roboto, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  button {
    font-family: inherit;
  }
  ul, ol {
    list-style: none;
  }
`;

function buildPage(config: SiteConfig): string {
  // Read token CSS
  const sharedCSS = readCSSFile('shared.css');
  const siteCSS = readCSSFile(config.tokensPath);

  // Create content from config's contentComponent or a default placeholder
  const contentElement = config.contentComponent
    ? config.contentComponent()
    : React.createElement(
        'div',
        {
          style: {
            padding: '16px',
            color: 'var(--gw-color-on-surface-variant)',
            fontFamily: 'var(--gw-font-body)',
            fontSize: '14px',
          },
        },
        React.createElement(
          'p',
          null,
          `${config.name} content area - populated by site-specific mock issue`
        )
      );

  // Render Layout with header, sidebar, and content
  const layoutElement = React.createElement(
    Layout,
    {
      header: config.layout.header,
      sidebar: config.layout.sidebar,
      companion: config.layout.companion,
    },
    contentElement
  );

  const markup = ReactDOMServer.renderToStaticMarkup(layoutElement);

  return `<!DOCTYPE html>
<html lang="en" data-darkly-product="${config.id}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1280, initial-scale=1" />
  <title>${config.name} - Darkly Screenshot Mock</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@300;400;500;700&family=Roboto+Mono&display=swap" rel="stylesheet" />
  <style>
${RESET_CSS}
${sharedCSS}
${siteCSS}
  </style>
</head>
<body>
${markup}
</body>
</html>`;
}

function main() {
  // Ensure output directory exists
  if (!fs.existsSync(PAGES_DIR)) {
    fs.mkdirSync(PAGES_DIR, { recursive: true });
  }

  console.log('Building screenshot harness pages...\n');

  for (const config of SITES) {
    const html = buildPage(config);
    const filename = `${config.id}-inbox.html`;
    const outPath = path.join(PAGES_DIR, filename);
    fs.writeFileSync(outPath, html, 'utf-8');
    console.log(`  Built: ${filename}`);
  }

  console.log(`\nDone! ${SITES.length} page(s) written to pages/`);
}

main();
