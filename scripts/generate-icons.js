#!/usr/bin/env node
/**
 * Generates proper PNG icons for the Chrome extension by
 * converting the source image using sips (macOS built-in).
 * Run: node scripts/generate-icons.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '../node_modules'); // placeholder – we use sips
const ICON_SRC = process.argv[2];
const OUT_DIR = path.resolve(__dirname, '../public/icons');

if (!ICON_SRC) {
    console.error('Usage: node scripts/generate-icons.js <path-to-source-image>');
    process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const sizes = [16, 48, 128];
for (const size of sizes) {
    const out = path.join(OUT_DIR, `icon${size}.png`);
    // -s format png ensures true PNG output regardless of source format
    execSync(
        `sips -s format png "${ICON_SRC}" --resampleHeightWidth ${size} ${size} --out "${out}"`,
        { stdio: 'inherit' }
    );
    // Verify it's a real PNG
    const buf = fs.readFileSync(out);
    const isPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    console.log(`icon${size}.png → ${isPng ? '✓ PNG' : '✗ NOT PNG'} (${buf.length} bytes)`);
}

console.log('Icons generated in', OUT_DIR);
