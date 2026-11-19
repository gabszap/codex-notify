const { readFileSync } = require('node:fs');
const { win32: path } = require('node:path');
const { notificationIdentity } = require('./windows-identity.cjs');

function permissionMessage(event) {
  const reason = event.tool_input?.description;
  if (typeof reason === 'string' && reason.trim()) {
    const text = [...reason.replace(/\s+/g, ' ').trim()];
    return text.length <= 160 ? text.join('') : `${text.slice(0, 159).join('')}…`;
  }

  const tool = event.tool_name;
  if (tool === 'Bash') return 'Executar um comando no terminal.';
  if (tool === 'apply_patch') return 'Alterar arquivos.';
  if (typeof tool === 'string' && tool.trim()) {
    const service = /^mcp__([^_].*?)__(.+)$/.exec(tool);
    if (service) {
      const [, server, name] = service;
      return `Usar a ferramenta ${name} no ${server === 'github' ? 'GitHub' : server}.`;
    }
    return `Usar a ferramenta ${tool}.`;
  }
  return 'O Codex aguarda sua aprovação.';
}

function getNotification(event) {
  const project = typeof event?.cwd === 'string' ? path.basename(event.cwd) : '';

  switch (event?.hook_event_name) {
    case 'PermissionRequest':
      return {
        title: project
          ? `Codex precisa da sua permissão · ${project}`
          : 'Codex precisa da sua permissão',
        message: permissionMessage(event),
      };
    case 'Stop':
      return {
        title: 'Codex terminou o turno',
        message: project ? `Veja a resposta em ${project}.` : 'Veja a resposta no Codex.',
      };
  }
}

function sendNotification(notification) {
  const notifier = require('node-notifier');
  const options = { ...notification, ...notificationIdentity() };
  return new Promise((resolve, reject) => {
    notifier.notify(options, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

async function run(input, { preview = false, send = sendNotification } = {}) {
  let event;
  try {
    event = JSON.parse(input);
  } catch {
    return {};
  }
  const notification = getNotification(event);
  if (notification) {
    if (preview) return notification;
    await send(notification);
  }
  return {};
}

async function main() {
  try {
    const result = await run(readFileSync(0, 'utf8'), {
      preview: process.argv.includes('--preview'),
    });
    console.log(JSON.stringify(result));
  } catch (error) {
    console.error(`codex-notify: ${error.message}`);
    console.log('{}');
  }
}

module.exports = { main, run };
if (require.main === module) void main();
