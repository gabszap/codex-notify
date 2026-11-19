const { randomUUID } = require('node:crypto');
const { mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } = require('node:fs');
const { homedir } = require('node:os');
const path = require('node:path');

const group = 'codex-notify-stop';

function updateHooks(file, action) {
  let hooks = {};
  try {
    hooks = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`Não foi possível ler o JSON em ${file}: ${error.message}`);
  }
  if (!hooks || typeof hooks !== 'object' || Array.isArray(hooks)) {
    throw new Error(`O arquivo ${file} precisa conter um objeto JSON.`);
  }

  if (action === 'install') {
    // Encode the path so Windows shells see the same argument even in directories with spaces or shell metacharacters.
    const scriptPath = Buffer.from(path.join(__dirname, 'notify.cjs')).toString('base64');
    const command = `node -e "require(Buffer.from('${scriptPath}','base64').toString('utf8')).main()"`;
    hooks[group] = { ...hooks[group], Stop: [{ type: 'command', command, timeout: 5 }] };
  } else if (action === 'uninstall') {
    if (!Object.hasOwn(hooks, group)) return;
    delete hooks[group];
  } else {
    throw new Error('Use install ou uninstall.');
  }

  mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, `${JSON.stringify(hooks, null, 2)}\n`, { flag: 'wx' });
    renameSync(temporary, file);
  } finally {
    rmSync(temporary, { force: true });
  }
}

module.exports = { updateHooks };

if (require.main === module) {
  const file = path.join(homedir(), '.gemini', 'config', 'hooks.json');
  try {
    updateHooks(file, process.argv[2]);
    console.log(file);
  } catch (error) {
    console.error(`codex-notify: ${error.message}`);
    process.exitCode = 1;
  }
}
