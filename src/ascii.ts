import { BrowserWindow } from 'electron';
import { gifFrames } from 'gif-frames';
import { Jimp } from 'jimp';
import fs from 'fs';
import path from 'path';

const ASCII_CHARS = [' ', '..', '::', '||'];

export async function createAsciiGif(asciiPath: string, gifPath: string, win: BrowserWindow, w: number, h: number): Promise<void> {
  win.loadFile('html/loading.html');
  
  const frames = await gifFrames({
    url: gifPath, frames: 'all',
    outputType: 'png', cumulative: true,
  });

  for (let i = 0; i < frames.length; i++) {
    const pngPath = path.join(asciiPath, `frame-${i}.png`);
    const txtPath = path.join(asciiPath, `frame-${i}.txt`);

    await new Promise<void>(resolve => {
      const stream = fs.createWriteStream(pngPath);
      stream.on('finish', resolve);
      frames[i].getImage().pipe(stream);
    });

    const image = await Jimp.read(pngPath);
    image.resize(w, h).grayscale();

    let ascii = '';

    for (let y = 0; y < image.bitmap.height; y++) {
      for (let x = 0; x < image.bitmap.width; x++) {
        const pixel = Jimp.intToRGBA(image.getPixelColor(x, y));
        ascii += ASCII_CHARS[Math.floor((pixel.r / 256) * 4)];
      }
      ascii += '\n';
    }

    fs.writeFileSync(txtPath, ascii);
    fs.unlinkSync(pngPath);

    win.webContents.send('loading-data', { value: i + 1, total: frames.length });
  }

  win.loadFile('html/index.html');
}
