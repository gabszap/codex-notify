const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

const pluginRoot = path.resolve(__dirname, '../plugins/codex-notify');
const { run } = require(path.join(pluginRoot, 'hooks/notify.cjs'));
const hooks = require(path.join(pluginRoot, 'hooks/hooks.json')).hooks;

test('sends the reason and project for a permission request with a neutral response', async () => {
  const sent = [];
  const result = await run(JSON.stringify({
    hook_event_name: 'PermissionRequest',
    cwd: 'C:\\work\\Projeto Açúcar\\',
    tool_name: 'Bash',
    tool_input: {
      description: ' Permitir acesso ao npm\npara instalar as dependências? ',
      command: 'private command',
    },
  }), { send: async (notification) => sent.push(notification) });

  assert.deepEqual(sent, [{
    title: 'Codex precisa da sua permissão · Projeto Açúcar',
    message: 'Permitir acesso ao npm para instalar as dependências?',
    sound: 'Notification.Reminder',
  }]);
  assert.deepEqual(result, {});
});

test('identifies the requested action when Codex has no reason', async () => {
  for (const [toolName, message] of [
    ['Bash', 'Executar um comando no terminal.'],
    ['apply_patch', 'Alterar arquivos.'],
    ['mcp__github__create_issue', 'Usar a ferramenta create_issue no GitHub.'],
  ]) {
    const result = await run(JSON.stringify({
      hook_event_name: 'PermissionRequest',
      tool_name: toolName,
      tool_input: { description: ' ', command: 'private command' },
    }), { preview: true });
    assert.equal(result.message, message);
  }
});

test('limits the reason shown in the banner', async () => {
  const result = await run(JSON.stringify({
    hook_event_name: 'PermissionRequest',
    tool_input: { description: '🚀'.repeat(200) },
  }), { preview: true });

  assert.equal([...result.message].length, 160);
  assert.equal(result.message, `${'🚀'.repeat(159)}…`);
});

test('sends a completion alert without including the assistant reply', async () => {
  const sent = [];
  const result = await run(JSON.stringify({
    hook_event_name: 'Stop',
    last_assistant_message: 'private answer',
  }), { send: async (notification) => sent.push(notification) });

  assert.deepEqual(sent, [{
    title: 'Codex terminou o turno',
    message: 'Veja a resposta no Codex.',
    sound: 'Notification.Default',
  }]);
  assert.deepEqual(result, {});
});

test('ignores malformed input and unrelated events', async () => {
  for (const input of ['not JSON', 'null', '{"hook_event_name":"Interrupt"}']) {
    const result = await run(input, { send: () => assert.fail('Unexpected notification') });
    assert.deepEqual(result, {});
  }
});

test('both configured Windows commands resolve the plugin entry point', {
  skip: process.platform !== 'win32',
}, () => {
  assert.deepEqual(Object.keys(hooks).sort(), ['PermissionRequest', 'Stop']);
  for (const hookEventName of Object.keys(hooks)) {
    const hook = hooks[hookEventName][0].hooks[0];
    assert.equal(hook.async, true);
    const command = `${hook.commandWindows} -- --preview`;
    const result = spawnSync(process.env.ComSpec, ['/d', '/s', '/c', `"${command}"`], {
      windowsVerbatimArguments: true,
      cwd: __dirname,
      input: JSON.stringify({ hook_event_name: hookEventName, cwd: 'C:\\work\\Local project' }),
      encoding: 'utf8',
      env: { ...process.env, PLUGIN_ROOT: pluginRoot },
    });

    assert.equal(result.status, 0, result.stderr);
    const notification = JSON.parse(result.stdout);
    assert.match(`${notification.title} ${notification.message}`, /Local project/);
  }
});
