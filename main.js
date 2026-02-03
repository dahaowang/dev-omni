const { app, BrowserWindow } = require('electron');
const path = require('path');

// Prevent garbage collection
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#18181b', // Matches new Zinc-900 Dark theme background
    show: false, // Don't show the window until content is ready
    // We use a custom title bar in the UI, so we hide the system one
    titleBarStyle: 'hidden', 
    titleBarOverlay: {
      color: '#09090b', // Matches new Sidebar Zinc-950
      symbolColor: '#a1a1aa', // Zinc-400
      height: 48 // Match the height of our header
    },
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple prototyping; use contextBridge in production
      webSecurity: false
    }
  });

  // Check if we are running in development mode
  const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

  if (isDev) {
    // Wait for Vite to start, then load the local URL
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools automatically in dev
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // In production, load the built html file
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Gracefully show window when ready to prevent "white flash"
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});