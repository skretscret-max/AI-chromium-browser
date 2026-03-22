const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ecoApi', {
  normalizeUrl: (value) => ipcRenderer.invoke('browser:normalize-url', value),
  passwords: {
    getAll: () => ipcRenderer.invoke('passwords:getAll'),
    add: (entry) => ipcRenderer.invoke('passwords:add', entry),
    remove: (id) => ipcRenderer.invoke('passwords:remove', id),
    import: () => ipcRenderer.invoke('passwords:import'),
    export: () => ipcRenderer.invoke('passwords:export')
  },
  energyToggle: (enabled) => ipcRenderer.invoke('energy:toggle', enabled)
});
