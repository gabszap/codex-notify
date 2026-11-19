const { spawn } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const completedReasons = new Set(['model_stop', 'NO_TOOL_CALL']);

function sendNotification(event) {
  if (process.platform !== 'win32') return Promise.resolve();

  // SnoreToast can wait for the banner to be dismissed. Keep that wait outside agy.
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, '../hooks/notify.cjs');
    const child = spawn(process.execPath, [script, '--antigravity'], {
      detached: true,
      windowsHide: true,
      stdio: ['pipe', 'ignore', 'ignore'],
    });
    child.once('error', reject);
    child.stdin.once('error', reject);
    child.stdin.end(JSON.stringify(event), () => {
      child.unref();
      resolve();
    });
  });
}

async function runStop(input, {
  send = sendNotification,
  managedByAcp = process.env.CODEX_NOTIFY_AGY_ACP === '1',
} = {}) {
  let event;
  try {
    event = JSON.parse(input);
  } catch {
    return { decision: 'stop' };
  }

  if (!managedByAcp && event?.fullyIdle === true && completedReasons.has(event.terminationReason)) {
    const cwd = Array.isArray(event.workspacePaths) ? event.workspacePaths[0] : undefined;
    await send({ hook_event_name: 'Stop', cwd });
  }
  return { decision: 'stop' };
}

async function main() {
  try {
    const result = await runStop(readFileSync(0, 'utf8'));
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(`codex-notify: ${error.message}`);
    console.log('{"decision":"stop"}');
  }
}

module.exports = { main, runStop, sendNotification };
if (require.main === module) void main();
