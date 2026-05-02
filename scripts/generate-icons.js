'use strict';
// generate-icons.js — generates PNG icons using only Node.js built-ins
// No external dependencies: only zlib, fs, path

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// CRC32 (standard polynomial 0xEDB88320, reflected)
// ---------------------------------------------------------------------------
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ---------------------------------------------------------------------------
// PNG chunk builder
// ---------------------------------------------------------------------------
function makeChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcInput = Buffer.concat([typeBytes, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

// ---------------------------------------------------------------------------
// Draw a lowercase "n" as pixel art into a pixel grid
// Returns a Set of [row, col] keys that should be white
// ---------------------------------------------------------------------------
function drawLetterN(size) {
  // We'll work in a normalized grid then scale up
  // The "n" occupies about 55% of the icon width
  const letterW = Math.round(size * 0.55);
  const letterH = Math.round(size * 0.55);

  // Pixel art template for "n" at a base grid size
  // We define strokes relative to letter bounding box
  // n = left vertical bar + arch + right vertical bar
  // Template (7-wide, 9-tall) — "n" style
  const template = [
    // row 0: top of arch (no top bar for lowercase n)
    [0,0,0,0,0,0,0],
    // row 1: start arch
    [1,1,0,1,1,0,0],
    // row 2: arch curve
    [1,0,0,0,0,1,0],
    // row 3: body
    [1,0,0,0,0,1,0],
    // row 4: body
    [1,0,0,0,0,1,0],
    // row 5: body
    [1,0,0,0,0,1,0],
    // row 6: body
    [1,0,0,0,0,1,0],
    // row 7: feet
    [1,0,0,0,0,1,0],
    // row 8: bottom
    [0,0,0,0,0,0,0],
  ];

  // Better "n" shape — more recognizable
  // Using 9 cols x 12 rows template
  const tCols = 9;
  const tRows = 12;
  const nTemplate = [
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
    [1,1,0,1,1,1,0,0,0],
    [1,1,0,0,0,0,1,1,0],
    [1,1,0,0,0,0,1,1,0],
    [1,1,0,0,0,0,1,1,0],
    [1,1,0,0,0,0,1,1,0],
    [1,1,0,0,0,0,1,1,0],
    [1,1,0,0,0,0,1,1,0],
    [0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0],
  ];

  const white = new Set();

  // Scale template to letterW x letterH
  const scaleX = letterW / tCols;
  const scaleY = letterH / tRows;

  // Center the letter in the icon
  const offsetX = Math.round((size - letterW) / 2);
  const offsetY = Math.round((size - letterH) / 2);

  for (let tr = 0; tr < tRows; tr++) {
    for (let tc = 0; tc < tCols; tc++) {
      if (nTemplate[tr][tc] === 1) {
        // Map template cell to pixel region
        const px0 = Math.round(tc * scaleX);
        const px1 = Math.round((tc + 1) * scaleX);
        const py0 = Math.round(tr * scaleY);
        const py1 = Math.round((tr + 1) * scaleY);
        for (let py = py0; py < py1; py++) {
          for (let px = px0; px < px1; px++) {
            const row = offsetY + py;
            const col = offsetX + px;
            if (row >= 0 && row < size && col >= 0 && col < size) {
              white.add(row * size + col);
            }
          }
        }
      }
    }
  }

  return white;
}

// ---------------------------------------------------------------------------
// Rounded rectangle mask
// Returns true if pixel (x, y) is inside the rounded rect
// ---------------------------------------------------------------------------
function inRoundedRect(x, y, size, radius) {
  // Corners: check distance from corner center
  const r = Math.min(radius, size / 2);
  const cx1 = r;
  const cx2 = size - 1 - r;
  const cy1 = r;
  const cy2 = size - 1 - r;

  // Inside the non-corner rectangles
  if (x >= cx1 && x <= cx2) return true;            // horizontal band
  if (y >= cy1 && y <= cy2) return true;            // vertical band
  // Corner circles
  const corners = [[cx1, cy1], [cx2, cy1], [cx1, cy2], [cx2, cy2]];
  for (const [cx, cy] of corners) {
    const dx = x - cx;
    const dy = y - cy;
    if (Math.sqrt(dx * dx + dy * dy) <= r) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Build raw RGBA pixel data for one icon
// ---------------------------------------------------------------------------
function buildPixels(size) {
  const radius = Math.round(size * 0.22);  // ~22% corner radius
  const bg = [29, 158, 117];               // #1D9E75
  const white = [255, 255, 255];
  const transparent = [0, 0, 0, 0];

  const whitePixels = drawLetterN(size);
  const pixels = new Uint8Array(size * size * 4);

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const idx = (row * size + col) * 4;
      const inside = inRoundedRect(col, row, size, radius);
      if (!inside) {
        // Transparent outside rounded rect
        pixels[idx]     = 0;
        pixels[idx + 1] = 0;
        pixels[idx + 2] = 0;
        pixels[idx + 3] = 0;
      } else if (whitePixels.has(row * size + col)) {
        pixels[idx]     = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
        pixels[idx + 3] = 255;
      } else {
        pixels[idx]     = bg[0];
        pixels[idx + 1] = bg[1];
        pixels[idx + 2] = bg[2];
        pixels[idx + 3] = 255;
      }
    }
  }
  return pixels;
}

// ---------------------------------------------------------------------------
// Encode RGBA pixels as PNG (RGBA, 8-bit)
// ---------------------------------------------------------------------------
function encodePNG(size, pixels) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);       // width
  ihdrData.writeUInt32BE(size, 4);       // height
  ihdrData.writeUInt8(8, 8);             // bit depth
  ihdrData.writeUInt8(6, 9);             // color type: RGBA
  ihdrData.writeUInt8(0, 10);            // compression method
  ihdrData.writeUInt8(0, 11);            // filter method
  ihdrData.writeUInt8(0, 12);            // interlace method
  const ihdr = makeChunk('IHDR', ihdrData);

  // Build raw scanlines with filter byte 0 (None) at the start of each row
  const rowBytes = size * 4;
  const rawData = Buffer.alloc((1 + rowBytes) * size);
  for (let row = 0; row < size; row++) {
    const destBase = row * (1 + rowBytes);
    rawData[destBase] = 0; // filter type None
    const srcBase = row * rowBytes;
    for (let i = 0; i < rowBytes; i++) {
      rawData[destBase + 1 + i] = pixels[srcBase + i];
    }
  }

  // Compress with zlib (deflate)
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idat = makeChunk('IDAT', compressed);

  // IEND
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

// ---------------------------------------------------------------------------
// Main: generate icons for each size
// ---------------------------------------------------------------------------
const SIZES = [72, 96, 128, 192, 512];
const outDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

for (const size of SIZES) {
  const pixels = buildPixels(size);
  const png = encodePNG(size, pixels);
  const outPath = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`Created ${outPath} (${png.length} bytes)`);
}

console.log('Done.');
