const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { mkdtempSync, readFileSync, rmSync, rmdirSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { PassThrough } = require('node:stream');
const test = require('node:test');

const root = '../plugins/codex-notify/';
const { run } = require(root + 'hooks/notify.cjs');
const { updateHooks } = require(root + 'antigravity/setup.cjs');
const { runStop } = require(root + 'antigravity/notify.cjs');
const { relayAcp } = require(root + 'antigravity/acp.cjs');

test('Antigravity Stop notifies after successful execution with no background work', async () => {
  const alerts = [];
  const input = { terminationReason: 'model_stop', fullyIdle: true, workspacePaths: ['C:/work/demo'] };
  const send = async (event) => alerts.push(event);

  assert.deepEqual(await runStop(JSON.stringify(input), { send }), { decision: 'stop' });
  for (const event of [
    { ...input, fullyIdle: false },
    { ...input, terminationReason: 'error' },
  ]) {
    assert.deepEqual(await runStop(JSON.stringify(event), { send }), { decision: 'stop' });
  }
  assert.deepEqual(await runStop(JSON.stringify(input), { send, managedByAcp: true }), { decision: 'stop' });
  assert.deepEqual(await runStop('invalid', { send }), { decision: 'stop' });
  assert.deepEqual(alerts, [{ hook_event_name: 'Stop', cwd: 'C:/work/demo' }]);
});

test('Antigravity CLI 1.5.12 Stop notifies for NO_TOOL_CALL', async () => {
  const alerts = [];
  const result = await runStop(JSON.stringify({
    hookEventName: 'Stop',
    terminationReason: 'NO_TOOL_CALL',
    fullyIdle: true,
    workspacePaths: ['C:/work/demo'],
  }), { send: async (event) => alerts.push(event) });

  assert.deepEqual(result, { decision: 'stop' });
  assert.deepEqual(alerts, [{ hook_event_name: 'Stop', cwd: 'C:/work/demo' }]);
});

test('Antigravity notifications reuse the Windows sounds and identify the agent', async () => {
  const completion = await run('{"hook_event_name":"Stop"}', { preview: true, agent: 'Antigravity' });
  const permission = await run('{"hook_event_name":"PermissionRequest"}', { preview: true, agent: 'Antigravity' });

  assert.deepEqual(completion, {
    title: 'Antigravity terminou o turno', message: 'Veja a resposta no Antigravity.', sound: 'Notification.Default',
  });
  assert.deepEqual(permission, {
    title: 'Antigravity precisa da sua permissão', message: 'O Antigravity aguarda sua aprovação.', sound: 'Notification.Reminder',
  });
});

test('hook setup preserves other hooks and can remove its own group', (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'codex-notify-agy-'));
  const file = path.join(directory, 'hooks.json');
  t.after(() => {
    rmSync(file, { force: true });
    rmdirSync(directory);
  });
  const custom = { lint: { enabled: false, Stop: [{ command: 'npm test' }] } };
  writeFileSync(file, JSON.stringify(custom));
  const read = () => JSON.parse(readFileSync(file, 'utf8'));

  updateHooks(file, 'install');
  const installed = read();
  assert.deepEqual(installed.lint, custom.lint);
  assert.deepEqual(Object.keys(installed['codex-notify-stop']), ['Stop']);
  assert.match(installed['codex-notify-stop'].Stop[0].command, /^node -e /);

  if (process.platform === 'win32') {
    const command = installed['codex-notify-stop'].Stop[0].command;
    const result = spawnSync(process.env.ComSpec, ['/d', '/s', '/c', `"${command}"`], {
      windowsVerbatimArguments: true,
      input: '{"terminationReason":"model_stop","fullyIdle":true}',
      encoding: 'utf8',
      env: { ...process.env, CODEX_NOTIFY_AGY_ACP: '1' },
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { decision: 'stop' });
  }

  installed['codex-notify-stop'].enabled = false;
  writeFileSync(file, JSON.stringify(installed));
  updateHooks(file, 'install');
  assert.equal(read()['codex-notify-stop'].enabled, false);
  updateHooks(file, 'uninstall');
  assert.deepEqual(read(), custom);
  writeFileSync(file, '{broken');
  assert.throws(() => updateHooks(file, 'install'), /JSON/);
  assert.equal(readFileSync(file, 'utf8'), '{broken');
});

test('ACP forwards requests and decisions unchanged and alerts for real approvals and completed prompts', () => {
  const clientInput = new PassThrough();
  const clientOutput = new PassThrough();
  const agentInput = new PassThrough();
  const agentOutput = new PassThrough();
  const alerts = [];
  const received = { client: '', agent: '' };
  clientOutput.on('data', (chunk) => { received.client += chunk; });
  agentInput.on('data', (chunk) => { received.agent += chunk; });
  relayAcp(clientInput, clientOutput, agentInput, agentOutput, (event) => alerts.push(event));

  const client = [
    { id: 1, method: 'session/new', params: { cwd: 'C:/work/demo' } },
    { id: '2', method: 'session/prompt', params: { sessionId: 'session-1' } },
    { id: '2', result: { outcome: { outcome: 'selected', optionId: 'reject-once' } } },
    { id: 3, method: 'session/prompt', params: { sessionId: 'session-1' } },
  ].map((message) => JSON.stringify({ jsonrpc: '2.0', ...message }) + '\r\n');
  const agent = [
    { id: 1, result: { sessionId: 'session-1' } },
    { method: 'session/update', params: { sessionId: 'session-1', update: {
      sessionUpdate: 'tool_call', toolCallId: 'install', title: 'Run npm install', kind: 'execute',
    } } },
    { id: '2', method: 'session/request_permission', params: { sessionId: 'session-1', toolCall: {
      toolCallId: 'install', rawInput: { token: 'secret' },
    }, options: [{ optionId: 'reject-once', kind: 'reject_once', name: 'Reject' }] } },
    { id: '2', result: { stopReason: 'end_turn' } },
    { id: 3, result: { stopReason: 'cancelled' } },
    { id: 999, result: { stopReason: 'end_turn' } },
  ].map((message) => JSON.stringify({ jsonrpc: '2.0', ...message }) + '\n');

  clientInput.write(client[0]);
  agentOutput.write(agent[0]);
  clientInput.write(client[1]);
  agentOutput.write(agent[1] + agent[2].slice(0, 30));
  agentOutput.write(agent[2].slice(30));
  assert.equal(alerts.length, 1);
  clientInput.write(client[2]);
  agentOutput.write(agent[3]);
  clientInput.write(client[3]);
  agentOutput.write(agent[4] + agent[5]);

  assert.deepEqual(received, { client: agent.join(''), agent: client.join('') });
  assert.deepEqual(alerts, [
    { hook_event_name: 'PermissionRequest', cwd: 'C:/work/demo', tool_name: 'execute', tool_input: { description: 'Run npm install' } },
    { hook_event_name: 'Stop', cwd: 'C:/work/demo' },
  ]);
  clientInput.end();
  agentOutput.end();
});
