import { app, BrowserWindow, ipcMain, dialog, shell, Menu, MenuItem, nativeTheme, session, MenuItemConstructorOptions } from 'electron';
import path from 'path';
import fs from 'fs';
import Store from 'electron-store';

// Set application name globally (shows in Dock tooltip, About panel, etc.)
app.setName('Notepad by Flo');

const store: any = new Store();
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const forceClose = new Set<number>();

// Initialize default store settings
if (!store.has('theme')) store.set('theme', 'system');
if (!store.has('fontFamily')) store.set('fontFamily', 'SF Mono');
if (!store.has('fontSize')) store.set('fontSize', 14);
if (!store.has('zoomLevel')) store.set('zoomLevel', 100);
if (!store.has('wordWrap')) store.set('wordWrap', true);
if (!store.has('statusBarVisible')) store.set('statusBarVisible', true);
if (!store.has('spellCheck')) store.set('spellCheck', true);
if (!store.has('spellCheckLanguages')) store.set('spellCheckLanguages', ['ro', 'en-US']);

function createNewWindow() {
  const savedBounds = store.get('windowBounds') as any;
  let x = savedBounds?.x;
  let y = savedBounds?.y;
  const width = savedBounds?.width || 900;
  const height = savedBounds?.height || 650;

  // Offset new windows slightly if there are already active windows
  const windows = BrowserWindow.getAllWindows();
  if (windows.length > 0) {
    const activeWin = windows[windows.length - 1];
    const [ax, ay] = activeWin.getPosition();
    x = ax + 30;
    y = ay + 30;
  }

  const appRoot = app.getAppPath();

  const isMac = process.platform === 'darwin';

  const win = new BrowserWindow({
    x,
    y,
    width,
    height,
    minWidth: 400,
    minHeight: 300,
    icon: path.join(appRoot, 'notepad.png'),
    // macOS: hidden title bar with custom drag region + traffic lights
    // Windows/Linux: native frame with OS-provided window controls
    titleBarStyle: isMac ? 'hidden' : 'default',
    ...(isMac ? { trafficLightPosition: { x: 16, y: 16 } } : {}),
    webPreferences: {
      preload: path.join(appRoot, 'dist-main', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Track window bounds on close
  win.on('close', (e) => {
    if (forceClose.has(win.id)) {
      // Save bounds of last active window
      try {
        const bounds = win.getBounds();
        store.set('windowBounds', bounds);
      } catch (err) {
        console.error(err);
      }
      return;
    }

    // Cancel close and request confirmation from React renderer
    e.preventDefault();
    win.webContents.send('window-close-request');
  });

  if (isDev) {
    const devUrl = 'http://localhost:5173';
    win.loadURL(devUrl).catch(() => {
      setTimeout(() => {
        win.loadURL(devUrl);
      }, 500);
    });
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../../dist/renderer/index.html'));
  }

  // Handle Spellchecker Language on runtime startup
  const spellCheckEnabled = store.get('spellCheck') !== false;
  win.webContents.session.setSpellCheckerEnabled(spellCheckEnabled);
  win.webContents.session.setSpellCheckerLanguages(store.get('spellCheckLanguages') as string[]);

  // Register Native Context Menu for textareas/inputs
  win.webContents.on('context-menu', (event, params) => {
    const menu = new Menu();

    // Spell Check suggestions
    if (params.dictionarySuggestions && params.dictionarySuggestions.length > 0) {
      for (const suggestion of params.dictionarySuggestions) {
        menu.append(new MenuItem({
          label: suggestion,
          click: () => win.webContents.replaceMisspelling(suggestion)
        }));
      }
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // macOS dictionary lookup
    if (params.selectionText && process.platform === 'darwin') {
      const truncated = params.selectionText.trim().substring(0, 15);
      menu.append(new MenuItem({
        label: `Look Up "${truncated}${params.selectionText.length > 15 ? '...' : ''}"`,
        click: () => win.webContents.showDefinitionForSelection()
      }));
      menu.append(new MenuItem({ type: 'separator' }));
    }

    // Standard edit commands
    menu.append(new MenuItem({ label: 'Cut', role: 'cut', enabled: params.editFlags.canCut }));
    menu.append(new MenuItem({ label: 'Copy', role: 'copy', enabled: params.editFlags.canCopy }));
    menu.append(new MenuItem({ label: 'Paste', role: 'paste', enabled: params.editFlags.canPaste }));
    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({ label: 'Select All', role: 'selectAll' }));

    // Spellcheck Language selection context helper
    const availableLangs = [
      { code: 'en-US', label: 'English (US)' },
      { code: 'ro', label: 'Romanian' },
      { code: 'fr', label: 'French' },
      { code: 'de', label: 'German' },
      { code: 'es', label: 'Spanish' }
    ];

    const currentLangs = store.get('spellCheckLanguages') as string[];

    const langSubmenu = availableLangs.map(lang => {
      const isChecked = currentLangs.includes(lang.code);
      return {
        label: lang.label,
        type: 'checkbox' as const,
        checked: isChecked,
        click: () => {
          let updatedLangs: string[];
          if (isChecked) {
            updatedLangs = currentLangs.filter(c => c !== lang.code);
          } else {
            updatedLangs = [...currentLangs, lang.code];
          }
          if (updatedLangs.length === 0) updatedLangs = ['en-US']; // fallback
          store.set('spellCheckLanguages', updatedLangs);
          win.webContents.session.setSpellCheckerLanguages(updatedLangs);
        }
      };
    });

    menu.append(new MenuItem({ type: 'separator' }));
    menu.append(new MenuItem({
      label: 'Spelling Languages',
      submenu: langSubmenu
    }));

    menu.popup();
  });
}

// Global Menu
function rebuildMenu() {
  const spellCheckEnabled = store.get('spellCheck') !== false;
  const currentTheme = store.get('theme') as string;
  const wordWrapEnabled = store.get('wordWrap') !== false;
  const statusBarVisible = store.get('statusBarVisible') !== false;

  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Notepad by Flo',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'File',
      submenu: [
        { label: 'New Tab', accelerator: 'CmdOrCtrl+T', click: (item, win) => (win as any)?.webContents.send('menu-action', 'new-tab') },
        { label: 'New Window', accelerator: 'CmdOrCtrl+Shift+N', click: () => createNewWindow() },
        { label: 'Open...', accelerator: 'CmdOrCtrl+O', click: (item, win) => (win as any)?.webContents.send('menu-action', 'open-file') },
        { label: 'Save', accelerator: 'CmdOrCtrl+S', click: (item, win) => (win as any)?.webContents.send('menu-action', 'save-file') },
        { label: 'Save As...', accelerator: 'CmdOrCtrl+Shift+S', click: (item, win) => (win as any)?.webContents.send('menu-action', 'save-as-file') },
        { label: 'Close Tab', accelerator: 'CmdOrCtrl+W', click: (item, win) => (win as any)?.webContents.send('menu-action', 'close-tab') },
        { type: 'separator' },
        { role: 'close', label: 'Close Window' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        // Use native Electron roles for system clipboard/edit operations so they
        // work natively in any focused input/textarea without IPC round-trips.
        { label: 'Undo', role: 'undo' },
        { label: 'Redo', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', role: 'cut' },
        { label: 'Copy', role: 'copy' },
        { label: 'Paste', role: 'paste' },
        { label: 'Select All', role: 'selectAll' },
        { type: 'separator' },
        { label: 'Find...', accelerator: 'CmdOrCtrl+F', click: (item, win) => (win as any)?.webContents.send('menu-action', 'find') },
        { label: 'Replace...', accelerator: 'CmdOrCtrl+H', click: (item, win) => (win as any)?.webContents.send('menu-action', 'replace') },
        { label: 'Go To...', accelerator: 'CmdOrCtrl+G', click: (item, win) => (win as any)?.webContents.send('menu-action', 'go-to-line') },
        { type: 'separator' },
        {
          label: 'Spell Check',
          type: 'checkbox',
          checked: spellCheckEnabled,
          click: (item, win) => {
            const val = item.checked;
            store.set('spellCheck', val);
            session.defaultSession.setSpellCheckerEnabled(val);
            BrowserWindow.getAllWindows().forEach(w => {
              (w as any).webContents.session.setSpellCheckerEnabled(val);
              (w as any).webContents.send('menu-action', val ? 'spellcheck-on' : 'spellcheck-off');
            });
          }
        }
      ]
    },
    {
      label: 'Format',
      submenu: [
        {
          label: 'Word Wrap',
          type: 'checkbox',
          checked: wordWrapEnabled,
          click: (item, win) => {
            (win as any)?.webContents.send('menu-action', 'toggle-word-wrap');
          }
        },
        {
          label: 'Font...',
          click: (item, win) => (win as any)?.webContents.send('menu-action', 'show-font-dialog')
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Equal', click: (item, win) => (win as any)?.webContents.send('menu-action', 'zoom-in') },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: (item, win) => (win as any)?.webContents.send('menu-action', 'zoom-out') },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: (item, win) => (win as any)?.webContents.send('menu-action', 'zoom-reset') },
        { type: 'separator' },
        {
          label: 'Status Bar',
          type: 'checkbox',
          checked: statusBarVisible,
          click: (item, win) => {
            (win as any)?.webContents.send('menu-action', 'toggle-status-bar');
          }
        },
        { type: 'separator' },
        {
          label: 'Theme',
          submenu: [
            {
              label: 'Light',
              type: 'radio',
              checked: currentTheme === 'light',
              click: () => setTheme('light')
            },
            {
              label: 'Dark',
              type: 'radio',
              checked: currentTheme === 'dark',
              click: () => setTheme('dark')
            },
            {
              label: 'System Theme',
              type: 'radio',
              checked: currentTheme === 'system',
              click: () => setTheme('system')
            }
          ]
        }
      ]
    },
    {
      role: 'window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function setTheme(theme: 'light' | 'dark' | 'system') {
  store.set('theme', theme);
  nativeTheme.themeSource = theme;
  BrowserWindow.getAllWindows().forEach(w => {
    (w as any).webContents.send('menu-action', `theme-${theme}`);
  });
  rebuildMenu();
}

app.whenReady().then(() => {
  // Sync electron native theme at startup
  const initialTheme = store.get('theme') as any;
  nativeTheme.themeSource = initialTheme;

  // Explicitly set the dock icon for macOS if available
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(path.join(app.getAppPath(), 'notepad.png'));
  }

  rebuildMenu();
  createNewWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createNewWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

// IPC File System Handlers
ipcMain.handle('file:open', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;

  const result = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'log', 'md', 'json', 'js', 'ts', 'css', 'html'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const filePath = result.filePaths[0];
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { filePath, content };
  } catch (err: any) {
    dialog.showErrorBox('Error reading file', err.message || String(err));
    return null;
  }
});

ipcMain.handle('file:read', async (_, filePath: string) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err: any) {
    console.error('Error reading file directly:', err);
    return null;
  }
});

ipcMain.handle('file:save', async (_, filePath: string, content: string) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (err: any) {
    dialog.showErrorBox('Error saving file', err.message || String(err));
    return false;
  }
});

ipcMain.handle('file:saveAs', async (event, content: string, defaultPath?: string) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return null;

  const result = await dialog.showSaveDialog(win, {
    defaultPath: defaultPath || 'Untitled.txt',
    filters: [
      { name: 'Text Files', extensions: ['txt', 'log', 'md', 'json'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  try {
    fs.writeFileSync(result.filePath, content, 'utf8');
    return { filePath: result.filePath };
  } catch (err: any) {
    dialog.showErrorBox('Error saving file', err.message || String(err));
    return null;
  }
});

// IPC Config Store Handlers
ipcMain.handle('store:get', (_, key: string) => {
  return store.get(key);
});

ipcMain.handle('store:set', (_, key: string, value: any) => {
  store.set(key, value);
  // Rebuild application menu if relevant flags change in renderer
  if (['theme', 'statusBarVisible', 'wordWrap', 'spellCheck'].includes(key)) {
    rebuildMenu();
  }
});

ipcMain.handle('store:getStore', () => {
  return store.store;
});

// IPC Window Control Handlers
ipcMain.on('window:new', () => {
  createNewWindow();
});

ipcMain.on('window:close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    forceClose.add(win.id);
    win.close();
  }
});

ipcMain.on('window:setTitle', (event, title: string) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setTitle(title);
  }
});

ipcMain.handle('shell:openExternal', async (_, url: string) => {
  await shell.openExternal(url);
});

ipcMain.handle('file:exportPDF', async (event, content: string, title: string) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return false;

  const result = await dialog.showSaveDialog(win, {
    defaultPath: `${title.replace(/\.[^/.]+$/, "") || 'Untitled'}.pdf`,
    filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
  });

  if (result.canceled || !result.filePath) {
    return false;
  }

  const tempWin = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page {
          margin: 40px;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          padding: 0;
          margin: 0;
          background: white;
          color: black;
          line-height: 1.6;
          font-size: 14px;
        }
        h1, h2, h3, h4, h5, h6 {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-weight: bold;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
          color: #111;
        }
        h1 { font-size: 22px; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; margin-top: 0; }
        h2 { font-size: 18px; }
        h3 { font-size: 15px; }
        p { margin: 0 0 1em 0; }
        ul, ol { margin: 0 0 1em 0; padding-left: 20px; }
        li { margin-bottom: 0.25em; }
        code {
          font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
          background-color: #F3F4F6;
          padding: 2px 4px;
          border-radius: 4px;
          font-size: 85%;
        }
        pre {
          background-color: #F3F4F6;
          padding: 12px;
          border-radius: 6px;
          overflow-x: auto;
          margin: 0 0 1em 0;
        }
        pre code {
          background-color: transparent;
          padding: 0;
          border-radius: 0;
          font-size: 12px;
        }
        blockquote {
          border-left: 4px solid #E5E7EB;
          margin: 0 0 1em 0;
          padding-left: 12px;
          color: #4B5563;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1em;
        }
        table th, table td {
          border: 1px solid #E5E7EB;
          padding: 6px 10px;
          text-align: left;
        }
        table th {
          background-color: #F9FAFB;
        }
        hr {
          border: 0;
          border-top: 1px solid #E5E7EB;
          margin: 1.5em 0;
        }
        input[type="checkbox"] {
          margin-right: 6px;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div>${content}</div>
    </body>
    </html>
  `;

  await tempWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

  try {
    const data = await tempWin.webContents.printToPDF({
      margins: {
        top: 40,
        bottom: 40,
        left: 40,
        right: 40
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: '<div style="font-size: 9px; width: 100%; text-align: center; color: #9CA3AF; font-family: sans-serif;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
    });
    fs.writeFileSync(result.filePath, data);
    tempWin.destroy();
    return true;
  } catch (err: any) {
    console.error('printToPDF failed:', err);
    tempWin.destroy();
    return false;
  }
});

// IPC Window Maximize Toggle (Feature 1: double-click title bar)
ipcMain.on('window:toggleMaximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});
