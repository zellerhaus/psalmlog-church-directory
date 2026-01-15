import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = './public';
const QUALITY = 80; // JPEG/WebP quality (0-100)
const PNG_COMPRESSION = 9; // PNG compression level (0-9)

async function compressImage(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const stats = fs.statSync(inputPath);
  const originalSize = stats.size;

  try {
    let result;

    if (ext === '.png') {
      // Compress PNG
      result = await sharp(inputPath)
        .png({ compressionLevel: PNG_COMPRESSION, quality: QUALITY })
        .toBuffer();
    } else if (ext === '.jpg' || ext === '.jpeg') {
      // Compress JPEG
      result = await sharp(inputPath)
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer();
    } else {
      return { skipped: true };
    }

    const newSize = result.length;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);

    // Only save if we actually reduced the size
    if (newSize < originalSize) {
      fs.writeFileSync(inputPath, result);
      return { originalSize, newSize, savings };
    } else {
      return { skipped: true, reason: 'No size reduction' };
    }
  } catch (error) {
    return { error: error.message };
  }
}

async function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let totalOriginal = 0;
  let totalNew = 0;
  let processed = 0;
  let skipped = 0;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      const subResult = await processDirectory(fullPath);
      totalOriginal += subResult.totalOriginal;
      totalNew += subResult.totalNew;
      processed += subResult.processed;
      skipped += subResult.skipped;
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        const result = await compressImage(fullPath);

        if (result.error) {
          console.log(`❌ ${fullPath}: ${result.error}`);
        } else if (result.skipped) {
          console.log(`⏭️  ${fullPath}: ${result.reason || 'Skipped'}`);
          skipped++;
        } else {
          console.log(`✅ ${fullPath}: ${formatBytes(result.originalSize)} → ${formatBytes(result.newSize)} (-${result.savings}%)`);
          totalOriginal += result.originalSize;
          totalNew += result.newSize;
          processed++;
        }
      }
    }
  }

  return { totalOriginal, totalNew, processed, skipped };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

async function main() {
  console.log('🖼️  Compressing images in public directory...\n');

  const result = await processDirectory(PUBLIC_DIR);

  console.log('\n📊 Summary:');
  console.log(`   Processed: ${result.processed} images`);
  console.log(`   Skipped: ${result.skipped} images`);

  if (result.totalOriginal > 0) {
    const totalSavings = ((result.totalOriginal - result.totalNew) / result.totalOriginal * 100).toFixed(1);
    console.log(`   Original: ${formatBytes(result.totalOriginal)}`);
    console.log(`   Compressed: ${formatBytes(result.totalNew)}`);
    console.log(`   Saved: ${formatBytes(result.totalOriginal - result.totalNew)} (${totalSavings}%)`);
  }
}

main().catch(console.error);
