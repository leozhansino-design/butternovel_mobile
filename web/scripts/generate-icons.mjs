// Script to generate all website icons from a source image
// Usage: node scripts/generate-icons.mjs <source-image-path>

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

async function generateIcons(sourcePath) {
  if (!sourcePath) {
    console.error('Usage: node scripts/generate-icons.mjs <source-image-path>');
    process.exit(1);
  }

  if (!fs.existsSync(sourcePath)) {
    console.error(`Source image not found: ${sourcePath}`);
    process.exit(1);
  }

  console.log(`Generating icons from: ${sourcePath}`);

  const sourceBuffer = fs.readFileSync(sourcePath);

  // Get source image dimensions
  const metadata = await sharp(sourceBuffer).metadata();
  const { width, height } = metadata;
  console.log(`Source image size: ${width}x${height}`);

  // Zoom in by 50% (crop center 67% of the image)
  // This makes the logo appear 1.5x larger in the final icons
  const cropSize = Math.min(width, height) * 0.67;
  const left = Math.round((width - cropSize) / 2);
  const top = Math.round((height - cropSize) / 2);

  console.log(`Cropping center ${Math.round(cropSize)}x${Math.round(cropSize)} pixels (50% zoom)...`);

  // Create zoomed/cropped version of the source
  const zoomedBuffer = await sharp(sourceBuffer)
    .extract({
      left,
      top,
      width: Math.round(cropSize),
      height: Math.round(cropSize)
    })
    .toBuffer();

  // Generate icon-512.png (512x512) for PWA
  console.log('Generating icon-512.png...');
  await sharp(zoomedBuffer)
    .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'public', 'icon-512.png'));

  // Generate icon-192.png (192x192) for PWA
  console.log('Generating icon-192.png...');
  await sharp(zoomedBuffer)
    .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'public', 'icon-192.png'));

  // Generate apple-touch-icon.png (180x180)
  console.log('Generating apple-touch-icon.png...');
  await sharp(zoomedBuffer)
    .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'public', 'apple-touch-icon.png'));

  // Generate 32x32 favicon.png (most common)
  console.log('Generating favicon.png (32x32)...');
  await sharp(zoomedBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'public', 'favicon.png'));

  // Generate favicon sizes
  console.log('Generating favicon-16.png...');
  await sharp(zoomedBuffer)
    .resize(16, 16, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'public', 'favicon-16.png'));

  console.log('Generating favicon-32.png...');
  await sharp(zoomedBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'public', 'favicon-32.png'));

  console.log('Generating favicon-48.png...');
  await sharp(zoomedBuffer)
    .resize(48, 48, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'public', 'favicon-48.png'));

  // Copy 32x32 as favicon.ico (browsers accept PNG in .ico extension)
  console.log('Generating favicon.ico...');
  await sharp(zoomedBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'src', 'app', 'favicon.ico'));

  // Also copy to public folder for direct access
  console.log('Generating public/favicon.ico...');
  await sharp(zoomedBuffer)
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toFile(path.join(projectRoot, 'public', 'favicon.ico'));

  // Generate OG image (1200x630) - Open Graph for social sharing
  // Use original (not zoomed) for OG image to show full logo
  console.log('Generating og-image.png (1200x630)...');
  await sharp(sourceBuffer)
    .resize(1200, 630, { fit: 'contain', background: { r: 255, g: 214, b: 107, alpha: 1 } }) // Butter yellow background
    .png()
    .toFile(path.join(projectRoot, 'public', 'og-image.png'));

  console.log('\n✅ All icons generated successfully!');
  console.log('\nGenerated files:');
  console.log('  - public/icon-512.png (PWA)');
  console.log('  - public/icon-192.png (PWA)');
  console.log('  - public/apple-touch-icon.png');
  console.log('  - public/favicon.ico');
  console.log('  - public/favicon.png');
  console.log('  - public/favicon-16.png');
  console.log('  - public/favicon-32.png');
  console.log('  - public/favicon-48.png');
  console.log('  - public/og-image.png (Social sharing)');
  console.log('  - src/app/favicon.ico');
}

const sourcePath = process.argv[2];
generateIcons(sourcePath).catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
