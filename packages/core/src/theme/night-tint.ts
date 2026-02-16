import type { ProductConfig } from '../config';

let activeConfig: ProductConfig | null = null;

function styleId(): string {
  const prefix = activeConfig?.prefix ?? 'darkly';
  return `${prefix}-night-tint-style`;
}

function svgId(): string {
  const prefix = activeConfig?.prefix ?? 'darkly';
  return `${prefix}-night-tint-svg`;
}

function filterId(): string {
  const prefix = activeConfig?.prefix ?? 'darkly';
  return `${prefix}-night-tint-filter`;
}

function tintAttr(): string {
  const prefix = activeConfig?.prefix ?? 'darkly';
  return `data-${prefix}-tint`;
}

function getOrCreateStyleElement(): HTMLStyleElement {
  let el = document.getElementById(styleId()) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = styleId();
    document.head.appendChild(el);
  }
  return el;
}

function getOrCreateSvgFilter(): SVGFEColorMatrixElement {
  const existing = document.getElementById(svgId());
  if (existing) {
    return existing.querySelector('feColorMatrix') as SVGFEColorMatrixElement;
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.id = svgId();
  svg.setAttribute('width', '0');
  svg.setAttribute('height', '0');
  svg.style.position = 'absolute';
  svg.innerHTML = `
    <filter id="${filterId()}">
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0"/>
    </filter>
  `;
  document.body.appendChild(svg);
  return svg.querySelector('feColorMatrix') as SVGFEColorMatrixElement;
}

function buildColorMatrix(intensity: number): string {
  const t = Math.max(0, Math.min(100, intensity)) / 100;

  const rr = 1 + t * 0.1;
  const gg = 1 - t * 0.25;
  const bb = 1 - t * 0.7;
  const dim = -t * 0.08;

  return [
    rr, 0, 0, 0, dim,
    0, gg, 0, 0, dim,
    0, 0, bb, 0, dim,
    0, 0, 0, 1, 0,
  ].map(v => v.toFixed(3)).join(' ');
}

export function init(config: ProductConfig): void {
  activeConfig = config;
}

export function enable(intensity: number): void {
  document.documentElement.setAttribute(tintAttr(), 'on');
  setIntensity(intensity);
}

export function disable(): void {
  document.documentElement.removeAttribute(tintAttr());
}

export function setIntensity(value: number): void {
  const matrix = getOrCreateSvgFilter();
  matrix.setAttribute('values', buildColorMatrix(value));

  const style = getOrCreateStyleElement();
  style.textContent = `[${tintAttr()}="on"] { filter: url(#${filterId()}); transition: filter 300ms ease; }`;
}
