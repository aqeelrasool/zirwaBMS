const { app, BrowserWindow } = require('electron');
const path = require('path');
const Store = require('electron-store');

// Initialize store
const store = new Store();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'TinyThreadsByZirwa Accounts',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      enableRemoteModule: true
    }
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    // In development, load from webpack dev server
    mainWindow.loadURL('http://localhost:3000');
    // Open DevTools
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load the built index.html
    const indexPath = path.join(__dirname, 'build', 'index.html');
    console.log('Loading production build from:', indexPath);
    
    // Try loading with file:// protocol
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Error loading file:', err);
      // Fallback to absolute path
      const absolutePath = path.resolve(indexPath);
      console.log('Trying absolute path:', absolutePath);
      mainWindow.loadURL(`file://${absolutePath}`);
    });
    
    // Open DevTools in production for debugging
    mainWindow.webContents.openDevTools();
  }

  // Handle navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Prevent navigation to external URLs
    if (!url.startsWith('file://')) {
      event.preventDefault();
    }
  });
}

// Handle any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

app.whenReady().then(() => {
  // Enable remote module
  require('@electron/remote/main').initialize();
  createWindow();
});

// Enable remote module for all windows
app.on('browser-window-created', (_, window) => {
  require('@electron/remote/main').enable(window.webContents);
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