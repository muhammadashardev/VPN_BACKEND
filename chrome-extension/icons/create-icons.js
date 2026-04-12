/**
 * Run this script to generate extension icons:
 *   node chrome-extension/icons/create-icons.js
 *
 * Creates minimal valid PNG files for icon16.png, icon48.png, icon128.png
 */

const fs = require('fs');
const path = require('path');

// Creates a simple valid PNG with a colored shield-like shape
function createPNG(size) {
    // PNG file structure
    const width = size;
    const height = size;

    // Raw pixel data (RGBA)
    const pixels = Buffer.alloc(width * height * 4, 0);

    const cx = width / 2;
    const cy = height / 2;
    const radius = width * 0.4;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;

            // Distance from center
            const dx = x - cx;
            const dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Shield shape: circle with pointed bottom
            const shieldTop = cy - radius;
            const shieldBottom = cy + radius * 1.2;
            const shieldWidth = radius * 0.85;

            let inside = false;

            if (y >= shieldTop && y <= cy + radius * 0.3) {
                // Upper rectangle part
                const halfW = shieldWidth * (1 - (y - shieldTop) / (shieldBottom - shieldTop) * 0.3);
                if (Math.abs(dx) <= halfW) inside = true;
            } else if (y > cy + radius * 0.3 && y <= shieldBottom) {
                // Lower triangle part
                const progress = (y - (cy + radius * 0.3)) / (shieldBottom - (cy + radius * 0.3));
                const halfW = shieldWidth * 0.7 * (1 - progress);
                if (Math.abs(dx) <= halfW) inside = true;
            }

            if (inside) {
                // Cyan color: #06b6d4
                pixels[idx] = 6;       // R
                pixels[idx + 1] = 182; // G
                pixels[idx + 2] = 212; // B
                pixels[idx + 3] = 255; // A
            } else if (dist <= radius * 1.3) {
                // Dark background circle
                pixels[idx] = 10;      // R
                pixels[idx + 1] = 10;  // G
                pixels[idx + 2] = 15;  // B
                pixels[idx + 3] = Math.max(0, Math.round(255 * (1 - dist / (radius * 1.3))));
            }
        }
    }

    // Build PNG file
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

    // IHDR chunk
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 6;  // color type (RGBA)
    ihdr[10] = 0; // compression
    ihdr[11] = 0; // filter
    ihdr[12] = 0; // interlace

    const ihdrChunk = createChunk('IHDR', ihdr);

    // IDAT chunk - raw pixel data with zlib
    const zlib = require('zlib');

    // Add filter byte (0 = None) before each row
    const rawData = Buffer.alloc(height * (1 + width * 4));
    for (let y = 0; y < height; y++) {
        rawData[y * (1 + width * 4)] = 0; // filter byte
        pixels.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
    }

    const compressed = zlib.deflateSync(rawData);
    const idatChunk = createChunk('IDAT', compressed);

    // IEND chunk
    const iendChunk = createChunk('IEND', Buffer.alloc(0));

    return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length);

    const typeBuffer = Buffer.from(type, 'ascii');
    const crcData = Buffer.concat([typeBuffer, data]);

    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcData));

    return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc ^= buf[i];
        for (let j = 0; j < 8; j++) {
            crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
        }
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Generate icons
const dir = path.dirname(__filename);

[16, 48, 128].forEach(size => {
    const png = createPNG(size);
    const filePath = path.join(dir, `icon${size}.png`);
    fs.writeFileSync(filePath, png);
    console.log(`Created: icon${size}.png (${png.length} bytes)`);
});

console.log('\nAll icons generated successfully!');
