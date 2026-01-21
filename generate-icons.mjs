import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const input = 'public/icon-original.png';
const output192 = 'public/pwa-192x192.png';
const output512 = 'public/pwa-512x512.png';
const appleIcon = 'public/apple-touch-icon.png';
const favicon = 'public/favicon.ico';

async function generateIcons() {
    if (!fs.existsSync(input)) {
        console.error('Input file not found:', input);
        process.exit(1);
    }

    // Generate 192x192
    await sharp(input)
        .resize(192, 192)
        .toFile(output192);
    console.log('Generated:', output192);

    // Generate 512x512
    await sharp(input)
        .resize(512, 512)
        .toFile(output512);
    console.log('Generated:', output512);

    // Generate Apple Touch Icon (180x180 is standard, but usually just a square png works)
    await sharp(input)
        .resize(180, 180)
        .toFile(appleIcon);
    console.log('Generated:', appleIcon);

    // Generate Favicon (32x32)
    await sharp(input)
        .resize(32, 32)
        .toFile(favicon);
    console.log('Generated:', favicon);
}

generateIcons().catch(err => {
    console.error(err);
    process.exit(1);
});
