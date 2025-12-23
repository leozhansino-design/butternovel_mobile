// scripts/optimize-images.mjs
// Compress all public images for better performance
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

async function optimizeImages() {
  console.log('🖼️  Optimizing images for web performance...\n');

  // Optimize logo.png - reduce from 1.3MB to ~50KB
  const logoPath = path.join(publicDir, 'logo.png');
  if (fs.existsSync(logoPath)) {
    const originalSize = fs.statSync(logoPath).size;
    console.log(`📦 logo.png: ${(originalSize / 1024).toFixed(0)}KB`);

    // Create optimized PNG (much smaller)
    await sharp(logoPath)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png({ quality: 80, compressionLevel: 9, effort: 10 })
      .toFile(path.join(publicDir, 'logo-optimized.png'));

    // Create WebP version (even smaller)
    await sharp(logoPath)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .webp({ quality: 85, effort: 6 })
      .toFile(path.join(publicDir, 'logo.webp'));

    // Replace original with optimized version
    fs.copyFileSync(path.join(publicDir, 'logo-optimized.png'), logoPath);
    fs.unlinkSync(path.join(publicDir, 'logo-optimized.png'));

    const newSize = fs.statSync(logoPath).size;
    console.log(`   ✅ Optimized: ${(newSize / 1024).toFixed(0)}KB (${((1 - newSize / originalSize) * 100).toFixed(0)}% reduction)`);
  }

  // Optimize og-image.png
  const ogPath = path.join(publicDir, 'og-image.png');
  if (fs.existsSync(ogPath)) {
    const originalSize = fs.statSync(ogPath).size;
    console.log(`📦 og-image.png: ${(originalSize / 1024).toFixed(0)}KB`);

    await sharp(ogPath)
      .resize(1200, 630, { fit: 'contain', background: { r: 255, g: 214, b: 107, alpha: 1 } })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(path.join(publicDir, 'og-image-optimized.png'));

    fs.copyFileSync(path.join(publicDir, 'og-image-optimized.png'), ogPath);
    fs.unlinkSync(path.join(publicDir, 'og-image-optimized.png'));

    const newSize = fs.statSync(ogPath).size;
    console.log(`   ✅ Optimized: ${(newSize / 1024).toFixed(0)}KB (${((1 - newSize / originalSize) * 100).toFixed(0)}% reduction)`);
  }

  // Optimize icon-512.png
  const icon512Path = path.join(publicDir, 'icon-512.png');
  if (fs.existsSync(icon512Path)) {
    const originalSize = fs.statSync(icon512Path).size;
    console.log(`📦 icon-512.png: ${(originalSize / 1024).toFixed(0)}KB`);

    await sharp(icon512Path)
      .resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(path.join(publicDir, 'icon-512-optimized.png'));

    fs.copyFileSync(path.join(publicDir, 'icon-512-optimized.png'), icon512Path);
    fs.unlinkSync(path.join(publicDir, 'icon-512-optimized.png'));

    const newSize = fs.statSync(icon512Path).size;
    console.log(`   ✅ Optimized: ${(newSize / 1024).toFixed(0)}KB (${((1 - newSize / originalSize) * 100).toFixed(0)}% reduction)`);
  }

  // Optimize icon-192.png
  const icon192Path = path.join(publicDir, 'icon-192.png');
  if (fs.existsSync(icon192Path)) {
    const originalSize = fs.statSync(icon192Path).size;
    console.log(`📦 icon-192.png: ${(originalSize / 1024).toFixed(0)}KB`);

    await sharp(icon192Path)
      .resize(192, 192, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(path.join(publicDir, 'icon-192-optimized.png'));

    fs.copyFileSync(path.join(publicDir, 'icon-192-optimized.png'), icon192Path);
    fs.unlinkSync(path.join(publicDir, 'icon-192-optimized.png'));

    const newSize = fs.statSync(icon192Path).size;
    console.log(`   ✅ Optimized: ${(newSize / 1024).toFixed(0)}KB (${((1 - newSize / originalSize) * 100).toFixed(0)}% reduction)`);
  }

  console.log('\n✅ Image optimization complete!');
}

optimizeImages().catch(console.error);
