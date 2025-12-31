import { contextBridge, ipcRenderer } from 'electron';

// Expose storage API to renderer via contextBridge
contextBridge.exposeInMainWorld('electronAPI', {
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: any) =>
      ipcRenderer.invoke('store:set', key, value),
  },
});

// TypeScript declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI: {
      store: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<void>;
      };
    };
  }
}
