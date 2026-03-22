const { app, BrowserWindow, ipcMain, safeStorage, powerSaveBlocker, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_DATA_DIR = path.join(app.getPath('userData'), 'eco-browser');
const PASSWORD_STORE_PATH = path.join(APP_DATA_DIR, 'passwords.enc');

let mainWindow;
let blockerId = -1;

function ensureAppDataDir() {
  fs.mkdirSync(APP_DATA_DIR, { recursive: true });
}

function encryptPayload(payload) {
  const raw = Buffer.from(JSON.stringify(payload), 'utf8');
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(raw.toString('utf8'));
  }
  return raw;
}

function decryptPayload(buffer) {
  if (!buffer || buffer.length === 0) {
    return [];
  }
  const json = safeStorage.isEncryptionAvailable()
    ? safeStorage.decryptString(buffer)
    : buffer.toString('utf8');
  return JSON.parse(json);
}

function loadPasswords() {
  ensureAppDataDir();
  if (!fs.existsSync(PASSWORD_STORE_PATH)) {
    return [];
  }
  const encrypted = fs.readFileSync(PASSWORD_STORE_PATH);
  return decryptPayload(encrypted);
}

function savePasswords(data) {
  ensureAppDataDir();
  const encrypted = encryptPayload(data);
  fs.writeFileSync(PASSWORD_STORE_PATH, encrypted);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    title: 'Eco Chromium Browser',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

function normalizeUrl(input) {
  if (!input) {
    return 'https://www.google.com';
  }
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }
  if (input.includes(' ') || input.includes('?')) {
    return `https://www.google.com/search?q=${encodeURIComponent(input)}`;
  }
  return `https://${input}`;
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('browser:normalize-url', (_, value) => normalizeUrl(value));

ipcMain.handle('passwords:getAll', () => loadPasswords());

ipcMain.handle('passwords:add', (_, entry) => {
  const list = loadPasswords();
  const normalized = {
    id: entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    site: entry.site,
    username: entry.username,
    password: entry.password,
    createdAt: entry.createdAt || new Date().toISOString()
  };
  list.push(normalized);
  savePasswords(list);
  return list;
});

ipcMain.handle('passwords:remove', (_, id) => {
  const list = loadPasswords().filter((item) => item.id !== id);
  savePasswords(list);
  return list;
});

ipcMain.handle('passwords:import', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Uvozi gesla',
    properties: ['openFile'],
    filters: [{ name: 'JSON or CSV', extensions: ['json', 'csv'] }]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true, count: 0 };
  }

  const filePath = result.filePaths[0];
  const raw = fs.readFileSync(filePath, 'utf8');
  let imported = [];

  if (filePath.endsWith('.json')) {
    const json = JSON.parse(raw);
    imported = Array.isArray(json) ? json : [];
  } else {
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const [, ...rows] = lines;
    imported = rows.map((line) => {
      const [site, username, password] = line.split(',');
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        site: (site || '').trim(),
        username: (username || '').trim(),
        password: (password || '').trim(),
        createdAt: new Date().toISOString()
      };
    });
  }

  const existing = loadPasswords();
  const merged = [...existing, ...imported.filter((item) => item.site && item.username && item.password)];
  savePasswords(merged);

  return { canceled: false, count: imported.length, total: merged.length };
});

ipcMain.handle('passwords:export', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Izvozi gesla',
    defaultPath: 'passwords-export.json',
    filters: [{ name: 'JSON', extensions: ['json'] }]
  });

  if (result.canceled || !result.filePath) {
    return { canceled: true };
  }

  const data = loadPasswords();
  fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf8');
  return { canceled: false, count: data.length };
});

ipcMain.handle('energy:toggle', (_, enabled) => {
  if (enabled) {
    if (blockerId === -1) {
      blockerId = powerSaveBlocker.start('prevent-app-suspension');
    }
  } else if (blockerId !== -1) {
    powerSaveBlocker.stop(blockerId);
    blockerId = -1;
  }

  return {
    enabled,
    blockerActive: blockerId !== -1,
    cpuHint: enabled ? 'normal' : 'reduced-timer-mode'
  };
});
