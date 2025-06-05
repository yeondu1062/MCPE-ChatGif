/* ____ _           _    ____ _  __ 
  / ___| |__   __ _| |_ / ___(_)/ _|
 | |   | '_ \ / _` | __| |  _| | |_ 
 | |___| | | | (_| | |_| |_| | |  _|
  \____|_| |_|\__,_|\__|\____|_|_|  
    written by @yeondu1062.
*/

import { BrowserWindow, Menu, app, dialog, ipcMain, nativeTheme } from 'electron';
import { isValidFolderName } from './utils';
import { executeWsserver } from './wsserver';
import { createAsciiGif } from './ascii';
import * as path from 'path';
import * as fs from 'fs';

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1000, height: 700,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });

  const menu = Menu.buildFromTemplate([
    {
      label: 'Load Gif', click: async () => {
        const res = await dialog.showOpenDialog(win, {
          properties: ['openFile'],
          filters: [{ name: 'GIFs', extensions: ['gif'] }],
        }); if (res.canceled) return;

        win.loadFile('html/submitGif.html');

        ipcMain.removeHandler('submit-default');
        ipcMain.handle('submit-default', () => ({
          name: path.basename(res.filePaths[0], '.gif'),
          width: 46, height: 23
        }));

        ipcMain.removeAllListeners('submit-chatgif');
        ipcMain.once('submit-chatgif', (_, { name, w, h }) => {
          win.loadFile('html/index.html');

          if (!isValidFolderName(name)) { dialog.showMessageBox(win, {
            type: 'warning', message: `The name ${name} is not available.`
          }); return; }

          const asciiPath = path.join(__dirname, '../asciis', name);

          if (fs.existsSync(asciiPath)) { dialog.showMessageBox(win, {
            type: 'warning', message: `The name ${name} is already in use.`
          }); return; }

          fs.mkdirSync(asciiPath);
          createAsciiGif(asciiPath, res.filePaths[0], win, w, h);
        });
      }
    },
    {
      label: 'Remove Gif', click: async () => {
        const asciis = fs.readdirSync(path.join(__dirname, '../asciis'));
        if (asciis.length === 0) { dialog.showMessageBox({
          type: 'info', message: 'There are no Gifs to remove.'
        }); return; }

        const { response: index } = await dialog.showMessageBox({
          type: 'question', buttons: asciis, cancelId: -1,
          message: 'Please select the Gif you want to remove.'
        }); if (index === -1) return;

        const { response: confirm } = await dialog.showMessageBox({
          type: 'question', buttons: ['yes', 'no'], cancelId: 1,
          message: `Are you sure you want to delete the ${asciis[index]} Gif?`,
        }); if (confirm === 1) return;

        fs.rmSync(path.join(__dirname, '../asciis', asciis[index]), { recursive: true });

        dialog.showMessageBox({
          type: 'info', message: asciis[index] + ' Gif removed.'
        });
      }
    },
    {
      label: 'Dark Mod', click: () => {
        nativeTheme.themeSource = nativeTheme.shouldUseDarkColors ? 'light' : 'dark';
      }
    },
    {
      label: 'Bug Report', click: () => {
        if (win.webContents.getURL().includes('github')) {
          win.loadFile('html/index.html');
        } else {
          win.loadURL('https://github.com/yeondu1062/MCPE-ChatGif/issues');
        }
      }
    }
  ]);

  Menu.setApplicationMenu(menu);
  win.loadFile('html/index.html');
  executeWsserver(win);
}

app.whenReady().then(createWindow);
