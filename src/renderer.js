const webview = document.getElementById('browserView');
const urlInput = document.getElementById('urlInput');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const reloadBtn = document.getElementById('reloadBtn');
const goBtn = document.getElementById('goBtn');
const ecoMode = document.getElementById('ecoMode');

const passwordManagerBtn = document.getElementById('passwordManagerBtn');
const passwordModal = document.getElementById('passwordModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const passwordList = document.getElementById('passwordList');
const passwordForm = document.getElementById('passwordForm');
const siteInput = document.getElementById('siteInput');
const userInput = document.getElementById('userInput');
const passInput = document.getElementById('passInput');
const importBtn = document.getElementById('importBtn');
const exportBtn = document.getElementById('exportBtn');

function renderPasswords(items) {
  passwordList.innerHTML = '';
  for (const item of items) {
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${item.site}</strong><br>
      ${item.username}<br>
      <code>${item.password}</code><br>
      <button data-id="${item.id}">Izbriši</button>
    `;
    passwordList.appendChild(li);
  }
}

async function refreshPasswords() {
  const all = await window.ecoApi.passwords.getAll();
  renderPasswords(all);
}

async function navigate(raw) {
  const target = await window.ecoApi.normalizeUrl(raw);
  webview.src = target;
}

goBtn.addEventListener('click', () => navigate(urlInput.value));
urlInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    navigate(urlInput.value);
  }
});

backBtn.addEventListener('click', () => {
  if (webview.canGoBack()) {
    webview.goBack();
  }
});

forwardBtn.addEventListener('click', () => {
  if (webview.canGoForward()) {
    webview.goForward();
  }
});

reloadBtn.addEventListener('click', () => webview.reload());

webview.addEventListener('did-navigate', () => {
  urlInput.value = webview.getURL();
});

passwordManagerBtn.addEventListener('click', async () => {
  passwordModal.classList.remove('hidden');
  await refreshPasswords();
});

closeModalBtn.addEventListener('click', () => {
  passwordModal.classList.add('hidden');
});

passwordForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  await window.ecoApi.passwords.add({
    site: siteInput.value,
    username: userInput.value,
    password: passInput.value
  });

  siteInput.value = '';
  userInput.value = '';
  passInput.value = '';

  await refreshPasswords();
});

passwordList.addEventListener('click', async (event) => {
  const target = event.target;
  if (target.tagName === 'BUTTON') {
    await window.ecoApi.passwords.remove(target.dataset.id);
    await refreshPasswords();
  }
});

importBtn.addEventListener('click', async () => {
  const result = await window.ecoApi.passwords.import();
  if (!result.canceled) {
    await refreshPasswords();
    alert(`Uvoženih vnosov: ${result.count}`);
  }
});

exportBtn.addEventListener('click', async () => {
  const result = await window.ecoApi.passwords.export();
  if (!result.canceled) {
    alert(`Izvoženih vnosov: ${result.count}`);
  }
});

ecoMode.addEventListener('change', async () => {
  const state = await window.ecoApi.energyToggle(ecoMode.checked);
  console.log('Eco mode changed:', state);
  webview.setAudioMuted(!ecoMode.checked);
});

window.addEventListener('DOMContentLoaded', async () => {
  urlInput.value = webview.getURL();
  await window.ecoApi.energyToggle(true);
});
