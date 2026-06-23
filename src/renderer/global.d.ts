export {};

declare global {
  interface Window {
    electron: {
      fileOpen: () => Promise<{ filePath: string; content: string } | null>;
      fileSave: (filePath: string, content: string) => Promise<boolean>;
      fileSaveAs: (content: string, defaultPath?: string) => Promise<{ filePath: string } | null>;
      fileRead: (filePath: string) => Promise<string>;
      
      storeGet: (key: string) => Promise<any>;
      storeSet: (key: string, value: any) => Promise<void>;
      storeGetStore: () => Promise<any>;
      
      newWindow: () => void;
      closeWindow: () => void;
      setTitle: (title: string) => void;
      toggleMaximize: () => void;
      openExternal: (url: string) => Promise<void>;
      exportPDF: (content: string, title: string) => Promise<boolean>;
      
      onWindowCloseRequest: (callback: () => void) => () => void;
      onMenuAction: (callback: (action: string) => void) => () => void;
    };
  }
}
