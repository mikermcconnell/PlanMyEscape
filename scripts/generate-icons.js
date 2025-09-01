const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputFile = path.join(__dirname, '..', 'public', 'icon-original.png');
const publicDir = path.join(__dirname, '..', 'public');

const sizes = [
  { width: 16, height: 16, name: 'icon-16.png' },
  { width: 32, height: 32, name: 'icon-32.png' },
  { width: 192, height: 192, name: 'icon-192.png' },
  { width: 512, height: 512, name: 'icon-512.png' },
  { width: 192, height: 192, name: 'android-chrome-192x192.png' },
  { width: 512, height: 512, name: 'android-chrome-512x512.png' },
  { width: 180, height: 180, name: 'apple-touch-icon.png' },
  { width: 16, height: 16, name: 'favicon-16x16.png' },
  { width: 32, height: 32, name: 'favicon-32x32.png' }
];

async function generateIcons() {
  try {
    // Check if input file exists
    if (!fs.existsSync(inputFile)) {
      console.error('Input file not found:', inputFile);
      process.exit(1);
    }

    console.log('Generating icons from:', inputFile);

    for (const size of sizes) {
      const outputFile = path.join(publicDir, size.name);
      
      await sharp(inputFile)
        .resize(size.width, size.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .toFile(outputFile);
      
      console.log(`✓ Generated ${size.name} (${size.width}x${size.height})`);
    }

    // Generate favicon.ico (multi-size)
    await sharp(inputFile)
      .resize(32, 32)
      .toFile(path.join(publicDir, 'favicon.ico'));
    
    console.log('✓ Generated favicon.ico');
    console.log('\nAll icons generated successfully!');

  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();