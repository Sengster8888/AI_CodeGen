import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

// Raw SVG template for AI CodeGen brand icon
const getSvgIcon = (size, isMaskable = false) => {
  const padding = isMaskable ? size * 0.15 : 0;
  const contentSize = size - (padding * 2);
  const scale = contentSize / 512;
  const bgRadius = isMaskable ? 0 : size * 0.22;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${bgRadius}" fill="#0f172a"/>
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#a855f7"/>
        <stop offset="50%" stop-color="#6366f1"/>
        <stop offset="100%" stop-color="#3b82f6"/>
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#8b5cf6" flood-opacity="0.4"/>
      </filter>
    </defs>
    <g transform="translate(${padding}, ${padding}) scale(${scale})">
      <!-- Outer Hex/Shield outline -->
      <path d="M256 32 L448 142 V370 L256 480 L64 370 V142 Z" fill="url(#grad)" filter="url(#shadow)"/>
      <!-- Inner Code / Lightning Symbol -->
      <path d="M275 90 L160 270 H250 L235 422 L350 242 H260 Z" fill="#ffffff"/>
    </g>
  </svg>`;
};

// Write SVG fallbacks and icons
const svg192 = getSvgIcon(192);
const svg512 = getSvgIcon(512);
const svgMaskable = getSvgIcon(512, true);
const svgApple = getSvgIcon(180);

fs.writeFileSync(path.join(publicDir, 'pwa-192x192.svg'), svg192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.svg'), svg512);
fs.writeFileSync(path.join(publicDir, 'maskable-icon-512x512.svg'), svgMaskable);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), svgApple);

console.log('SVG PWA Icons generated successfully!');
