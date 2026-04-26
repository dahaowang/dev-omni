const { app, BrowserWindow, protocol } = require('electron');
const fs = require('fs');
const path = require('path');

// Prevent garbage collection
let mainWindow;

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true
    }
  }
]);

const MIME_TYPES = {
  '.css': 'text/css',
  '.gz': 'application/gzip',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm'
};

function registerAppProtocol() {
  protocol.handle('app', async (request) => {
    const distRoot = path.join(__dirname, 'dist');
    const url = new URL(request.url);
    const requestedPath = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const filePath = path.normalize(path.join(distRoot, requestedPath));

    if (!filePath.startsWith(distRoot + path.sep)) {
      return new Response('Not found', { status: 404 });
    }

    try {
      const data = await fs.promises.readFile(filePath);
      const contentType = MIME_TYPES[path.extname(filePath)] || 'application/octet-stream';
      return new Response(data, {
        headers: {
          'Content-Type': contentType
        }
      });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#ffffff', // Default to white for the new light theme preference
    show: false, // Don't show the window until content is ready
    titleBarStyle: 'hidden', 
    titleBarOverlay: {
      color: '#00000000', // Transparent overlay, letting the Sidebar background show through
      symbolColor: '#64748b', // Slate-500 for traffic lights
      height: 40 // Height of the drag region
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
    mainWindow.loadURL('app://devomni/index.html');
  }

  // Gracefully show window when ready to prevent "white flash"
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  registerAppProtocol();
  createWindow();
});

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
