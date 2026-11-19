const { execFileSync, spawnSync } = require('node:child_process');
const path = require('node:path');

const icon = path.resolve(__dirname, '../assets/codex.png');
const appID = 'CodexNotify.Desktop';
const appKey = `HKCU\\Software\\Classes\\AppUserModelId\\${appID}`;
const reg = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'reg.exe');

function hasRegistration(...args) {
  return spawnSync(reg, ['query', appKey, ...args], {
    stdio: 'ignore',
    windowsHide: true,
    timeout: 2000,
  }).status === 0;
}

function notificationIdentity() {
  return hasRegistration('/v', 'DisplayName') ? { icon, appID } : { icon };
}

function register() {
  for (const [name, value] of [['IconUri', icon], ['DisplayName', 'Codex Notify']]) {
    execFileSync(reg, ['add', appKey, '/v', name, '/t', 'REG_SZ', '/d', value, '/f'], {
      windowsHide: true,
    });
  }
}

function unregister() {
  if (hasRegistration()) {
    execFileSync(reg, ['delete', appKey, '/f'], { windowsHide: true });
  }
}

module.exports = { notificationIdentity };

if (require.main === module) {
  const action = process.argv[2];
  if (process.platform !== 'win32' || !['register', 'unregister'].includes(action)) {
    console.error('Uso no Windows: node windows-identity.cjs register|unregister');
    process.exitCode = 1;
  } else if (action === 'register') {
    register();
  } else {
    unregister();
  }
}
