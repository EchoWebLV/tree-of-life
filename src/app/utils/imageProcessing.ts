import sharp from 'sharp';

export async function resizeImage(buffer: ArrayBuffer): Promise<Buffer> {
  return sharp(Buffer.from(buffer))
    .resize(800, 800, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .toBuffer();
} 