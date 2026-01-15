import sharp from 'sharp';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const sourceIcon = join(rootDir, 'client', 'public', 'assets', 'icon.png');
const iconsDir = join(rootDir, 'build');

async function generateElectronIcons() {
  console.log('Generating Electron icons from:', sourceIcon);
  
  if (!existsSync(sourceIcon)) {
    throw new Error(`Icon not found at: ${sourceIcon}`);
  }

  // Create build directory if it doesn't exist
  if (!existsSync(iconsDir)) {
    mkdirSync(iconsDir, { recursive: true });
  }

  // Get source image metadata to check dimensions
  const sourceMetadata = await sharp(sourceIcon).metadata();
  console.log(`Source icon: ${sourceMetadata.width}x${sourceMetadata.height}`);

  // For Windows, electron-builder works best with a 256x256 PNG or ICO file
  // Create a properly sized 256x256 PNG icon
  const pngPath = join(iconsDir, 'icon.png');
  
  console.log('Generating 256x256 PNG icon for Windows...');
  
  // Resize to 256x256
  // Use 'contain' with a transparent background to preserve the full icon without cropping
  // This ensures the entire icon is visible, centered in a 256x256 square
  await sharp(sourceIcon)
    .resize(256, 256, { 
      fit: 'contain', // Preserve entire icon, no cropping
      background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
    })
    .png()
    .toFile(pngPath);

  console.log('✓ Electron icon generated!');
  console.log(`  PNG: ${pngPath} (256x256)`);
}

generateElectronIcons().catch(console.error);
