/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';

// Initialize electron-store (ESM module) with defaults
let store: any;
(async () => {
  const module = await import('electron-store');
  const Store = module.default;
  store = new Store({
    defaults: {
      volume: 0.5,
      maxVolume: 0.5,
      activeSong: 0,
    },
  });
})();

// IPC handlers for storage
ipcMain.handle('store:get', (_event, key: string) => {
  return store?.get(key);
});

ipcMain.handle('store:set', (_event, key: string, value: any) => {
  store?.set(key, value);
});

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  // DevTools disabled - uncomment to enable
  // require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  console.log('Creating window...');
  // Disabled extension installation to avoid errors
  // if (
  //   process.env.NODE_ENV === 'development' ||
  //   process.env.DEBUG_PROD === 'true'
  // ) {
  //   await installExtensions();
  // }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 220,
    height: 220,
    transparent: true,
    frame: false,
    icon: getAssetPath('logo.png'),
    fullscreenable: false,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load from Vite dev server in development, or from file in production
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    const rendererUrl = process.env.ELECTRON_RENDERER_URL;
    console.log('Loading renderer from URL:', rendererUrl);

    if (rendererUrl) {
      mainWindow.loadURL(rendererUrl);
      mainWindow.webContents.openDevTools(); // Open DevTools automatically
    } else {
      mainWindow.loadURL('http://localhost:5173');
    }
  } else {
    const filePath = path.join(__dirname, '../renderer/index.html');
    console.log('Loading renderer from file:', filePath);
    mainWindow.loadFile(filePath);
  }

  // Add error handling for failed loads
  mainWindow.webContents.on(
    'did-fail-load',
    (event, errorCode, errorDescription) => {
      console.error('Failed to load:', errorCode, errorDescription);
    }
  );

  mainWindow.on('ready-to-show', () => {
    console.log('Window ready to show');
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Web contents did finish load');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(createWindow).catch(console.log);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});
