const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');
const { sendNotification } = require('./notify.cjs');

function observeMessages(input, output, observe) {
  const lines = createInterface({ input, crlfDelay: Infinity });
  lines.on('line', (line) => {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    if (message?.jsonrpc === '2.0') observe(message);
  });
  input.pipe(output);
  return () => {
    input.unpipe(output);
    lines.close();
    input.pause();
  };
}

function relayAcp(clientInput, clientOutput, agentInput, agentOutput, notify) {
  const requests = new Map();
  const workspaces = new Map();
  const toolCallsBySession = new Map();
  const sessionMethods = ['session/new', 'session/load', 'session/resume', 'session/close'];

  const stopClient = observeMessages(clientInput, agentInput, ({ id, method, params }) => {
    if (id == null || (method !== 'session/prompt' && !sessionMethods.includes(method))) return;
    requests.set(id, { method, sessionId: params?.sessionId, cwd: params?.cwd });
  });

  const stopAgent = observeMessages(agentOutput, clientOutput, ({ id, method, params, result, error }) => {
    const sessionId = params?.sessionId;
    if (method === 'session/update') {
      const update = params?.update;
      if (typeof sessionId !== 'string' || typeof update?.toolCallId !== 'string') return;
      const calls = toolCallsBySession.get(sessionId) ?? new Map();
      if (update.status === 'completed' || update.status === 'failed') {
        calls.delete(update.toolCallId);
      } else {
        const previous = calls.get(update.toolCallId);
        calls.set(update.toolCallId, {
          title: update.title ?? previous?.title,
          kind: update.kind ?? previous?.kind,
        });
      }
      toolCallsBySession.set(sessionId, calls);
      return;
    }
    if (method === 'session/request_permission' && id != null) {
      const tool = params?.toolCall;
      const previous = toolCallsBySession.get(sessionId)?.get(tool?.toolCallId);
      notify({
        hook_event_name: 'PermissionRequest',
        cwd: workspaces.get(sessionId),
        tool_name: tool?.kind ?? previous?.kind,
        tool_input: { description: tool?.title ?? previous?.title },
      });
      return;
    }
    if (method !== undefined || !requests.has(id)) return;

    const request = requests.get(id);
    requests.delete(id);
    if (request.method === 'session/prompt') toolCallsBySession.delete(request.sessionId);
    if (error) return;

    if (request.method === 'session/prompt') {
      if (result?.stopReason === 'end_turn') {
        notify({ hook_event_name: 'Stop', cwd: workspaces.get(request.sessionId) });
      }
    } else if (request.method === 'session/close') {
      workspaces.delete(request.sessionId);
      toolCallsBySession.delete(request.sessionId);
    } else {
      const openedSession = result?.sessionId ?? request.sessionId;
      if (typeof openedSession === 'string' && typeof request.cwd === 'string') {
        workspaces.set(openedSession, request.cwd);
      }
    }
  });

  return () => {
    stopClient();
    stopAgent();
  };
}

function main() {
  const executable = process.env.AGY_EXECUTABLE || (process.platform === 'win32' ? 'agy.exe' : 'agy');
  const agent = spawn(executable, ['acp', ...process.argv.slice(2)], {
    env: { ...process.env, CODEX_NOTIFY_AGY_ACP: '1' },
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  const reportError = (error) => console.error(`codex-notify: ${error.message}`);
  const close = relayAcp(process.stdin, process.stdout, agent.stdin, agent.stdout, (event) => {
    void sendNotification(event).catch(reportError);
  });

  agent.once('error', reportError);
  agent.stdin.on('error', (error) => {
    if (error.code !== 'EPIPE') reportError(error);
  });
  process.stdout.once('error', () => agent.kill());
  agent.once('close', (code) => {
    close();
    process.exitCode = code ?? 1;
  });
}

module.exports = { relayAcp };
if (require.main === module) main();
