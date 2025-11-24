/**
 * Generate Android launcher mipmap assets directly from the primary Icon-1.png.
 * This bypasses the Capacitor asset generator so the on-device icon exactly
 * matches the supplied artwork (no additional insets or masks applied).
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const sourceIcon = path.join(projectRoot, 'public', 'Icon-1.png');
const resDir = path.join(projectRoot, 'android', 'app', 'src', 'main', 'res');
const publicDir = path.join(projectRoot, 'public');

if (!fs.existsSync(sourceIcon)) {
  console.error(`Source icon not found at ${sourceIcon}`);
  process.exit(1);
}

const densities = [
  { dir: 'mipmap-ldpi', legacy: 36, adaptive: 81 },
  { dir: 'mipmap-mdpi', legacy: 48, adaptive: 108 },
  { dir: 'mipmap-hdpi', legacy: 72, adaptive: 162 },
  { dir: 'mipmap-xhdpi', legacy: 96, adaptive: 216 },
  { dir: 'mipmap-xxhdpi', legacy: 144, adaptive: 324 },
  { dir: 'mipmap-xxxhdpi', legacy: 192, adaptive: 432 }
];

async function generate() {
  for (const density of densities) {
    const targetDir = path.join(resDir, density.dir);
    if (!fs.existsSync(targetDir)) {
      console.warn(`Skipping ${density.dir} because the directory does not exist.`);
      continue;
    }

    const legacyTasks = ['ic_launcher.png', 'ic_launcher_round.png'].map((file) => {
      const target = path.join(targetDir, file);
      return sharp(sourceIcon)
        .resize(density.legacy, density.legacy, { fit: 'contain' })
        .png({ compressionLevel: 9 })
        .toFile(target);
    });

    const foregroundTarget = path.join(targetDir, 'ic_launcher_foreground.png');
    const foregroundTask = sharp(sourceIcon)
      .resize(density.adaptive, density.adaptive, { fit: 'contain' })
      .png({ compressionLevel: 9 })
      .toFile(foregroundTarget);

    await Promise.all([...legacyTasks, foregroundTask]);
    console.log(`Updated ${density.dir}`);
  }

  const pwaTargets = [
    { file: 'android-chrome-192x192.png', size: 192 },
    { file: 'android-chrome-512x512.png', size: 512 },
    { file: 'icon-16.png', size: 16 },
    { file: 'icon-32.png', size: 32 },
    { file: 'icon-192.png', size: 192 },
    { file: 'icon-512.png', size: 512 },
    { file: 'icon-5122.png', size: 512 },
    { file: 'apple-touch-icon.png', size: 180 },
    { file: path.join('favicon_io', 'android-chrome-192x192.png'), size: 192 },
    { file: path.join('favicon_io', 'android-chrome-512x512.png'), size: 512 },
    { file: path.join('favicon_io', 'apple-touch-icon.png'), size: 180 },
    { file: path.join('favicon_io', 'favicon-32x32.png'), size: 32 },
    { file: path.join('favicon_io', 'favicon-16x16.png'), size: 16 }
  ];

  await Promise.all(
    pwaTargets.map(async ({ file, size }) => {
      const target = path.join(publicDir, file);
      const directory = path.dirname(target);
      if (!fs.existsSync(directory)) {
        return;
      }
      await sharp(sourceIcon)
        .resize(size, size, { fit: 'contain' })
        .png({ compressionLevel: 9 })
        .toFile(target);
      console.log(`Updated public/${file}`);
    })
  );
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
