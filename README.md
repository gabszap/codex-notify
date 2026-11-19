# Codex Notify

[English](#english) · [Português](#português)

## English

Get Windows notifications when Codex needs your approval or finishes a turn. Both alerts use the blue Codex icon and a Windows system sound.

| Event | What you see | Sound |
| --- | --- | --- |
| Approval request | The reason Codex gives, or the action that needs approval | Windows reminder |
| Turn complete | The project folder | Windows default notification |

Approve or deny requests in Codex. The plugin listens to hooks in local sessions. [Codex hooks][hooks]

### Install

You need Windows, the Codex CLI, and npm. Make sure Codex can find `node` on its PATH. Use Node.js 22.22.2 or later on 22.x, 24.15.0 or later on 24.x, or 26 and later. [Node.js requirements][node-notifier]

Run these commands in PowerShell from the repository root.

```powershell
npm ci --prefix .\plugins\codex-notify --ignore-scripts
npm run register-notifications --prefix .\plugins\codex-notify
codex plugin marketplace add (Get-Location).Path
codex plugin add codex-notify@codex-notify-local
```

Restart Codex, open a new local conversation, and trust both hooks in **Settings → Hooks** or **`/hooks`** in the CLI. The registration command sets the sender name to **Codex Notify** for your Windows account. [Local plugin installation][plugins] · [Hook review][trust]

### Update

```powershell
npm ci --prefix .\plugins\codex-notify --ignore-scripts
codex plugin remove codex-notify@codex-notify-local
codex plugin add codex-notify@codex-notify-local
```

Restart Codex and review the hooks again.

### Test and troubleshoot

Ask Codex to reply with just “OK” to send a completion alert. You can also trigger either alert directly from the repository root by running one of these commands.

```powershell
'{"hook_event_name":"Stop"}' | node .\plugins\codex-notify\hooks\notify.cjs
'{"hook_event_name":"PermissionRequest","tool_name":"Bash","tool_input":{"description":"May I access npm to install dependencies?"}}' |
  node .\plugins\codex-notify\hooks\notify.cjs
```

- **No banner or sound.** Check **Windows Settings → System → Notifications → Codex Notify** and enable banners and sound. Use **Win+N** to see alerts delivered to Notification Center. [Windows notification settings][windows]
- **The sender says SnoreToast.** Run the registration command from the installation steps.
- **Manual tests work but Codex sends nothing.** Verify that both hooks are trusted and enabled. Keep your local session open while the hook runs in the background. [Codex hooks][hooks]

### Antigravity CLI on Windows

Use the same Windows notifications with `agy`. Run `npm ci` and `register-notifications` from the installation steps if you are setting up Codex Notify for the first time.

- **Regular `agy` terminal.** Run the command below and restart `agy`. Open `/hooks`, select **Stop**, and check that **codex-notify-stop** is enabled. This adds a completion alert. Run `npm run unregister-antigravity --prefix .\plugins\codex-notify` to remove that hook from your global Antigravity settings. [Antigravity hooks][agy-hooks]
- **ACP client or editor.** Start the proxy below as your ACP server to get both completion alerts and real approval alerts. Approve or deny requests in the client as usual. [Antigravity via ACP][agy-acp]

```powershell
npm run register-antigravity --prefix .\plugins\codex-notify
```

Example custom ACP agent in Zed. Replace the path with the absolute path to your checkout. The proxy uses `agy` from PATH or the full executable path set in `AGY_EXECUTABLE`.

```json
{
  "agent_servers": {
    "Antigravity with notifications": {
      "type": "custom",
      "command": "node",
      "args": ["C:/path/to/codex-notify/plugins/codex-notify/antigravity/acp.cjs"]
    }
  }
}
```

The sender stays **Codex Notify**. The notification title identifies Antigravity. Your usual Antigravity sign-in applies to ACP sessions.

### Uninstall

```powershell
npm run unregister-notifications --prefix .\plugins\codex-notify
codex plugin remove codex-notify@codex-notify-local
codex plugin marketplace remove codex-notify-local
```

## Português

Receba avisos no Windows quando o Codex precisar da sua aprovação ou terminar um turno. Os dois avisos usam o ícone azul do Codex e um som do Windows.

| Evento | O que aparece | Som |
| --- | --- | --- |
| Pedido de permissão | A justificativa do Codex ou a ação que precisa de aprovação | Lembrete do Windows |
| Fim de turno | A pasta do projeto | Notificação padrão do Windows |

Aprove ou negue os pedidos no Codex. O plugin usa os hooks do Codex em conversas locais. [Hooks do Codex][hooks]

### Instalação

Você precisa do Windows, do Codex CLI e do npm. Deixe o `node` no PATH do Codex. Use Node.js 22.22.2 ou posterior na série 22.x, 24.15.0 ou posterior na série 24.x, ou 26 em diante. [Requisitos do Node.js][node-notifier]

Abra o PowerShell na raiz do repositório e rode os comandos abaixo.

```powershell
npm ci --prefix .\plugins\codex-notify --ignore-scripts
npm run register-notifications --prefix .\plugins\codex-notify
codex plugin marketplace add (Get-Location).Path
codex plugin add codex-notify@codex-notify-local
```

Reinicie o Codex, abra uma nova conversa local e marque os dois hooks como confiáveis em **Configurações → Hooks** ou em **`/hooks`** no terminal. O comando de registro define **Codex Notify** como remetente para a sua conta do Windows. [Instalação de plugins locais][plugins] · [Revisão de hooks][trust]

### Atualização

```powershell
npm ci --prefix .\plugins\codex-notify --ignore-scripts
codex plugin remove codex-notify@codex-notify-local
codex plugin add codex-notify@codex-notify-local
```

Reinicie o Codex e revise os hooks da nova versão.

### Testes e solução de problemas

Peça ao Codex para responder só com “OK” e teste o aviso de conclusão. Para disparar um dos avisos direto da raiz do repositório, rode um dos comandos abaixo.

```powershell
'{"hook_event_name":"Stop"}' | node .\plugins\codex-notify\hooks\notify.cjs
'{"hook_event_name":"PermissionRequest","tool_name":"Bash","tool_input":{"description":"Posso acessar o npm para instalar os pacotes?"}}' |
  node .\plugins\codex-notify\hooks\notify.cjs
```

- **Sem banner ou som.** Confira **Configurações do Windows → Sistema → Notificações → Codex Notify** e habilite os banners e o som. Use **Win+N** para ver os avisos entregues à Central de Notificações. [Configurações de notificações do Windows][windows]
- **O remetente aparece como SnoreToast.** Rode o comando de registro da instalação.
- **O teste manual funciona, mas o Codex não avisa.** Confira se os dois hooks estão ativos e confiáveis. Deixe a conversa local aberta enquanto o hook roda em segundo plano. [Hooks do Codex][hooks]

### Antigravity CLI no Windows

Use os mesmos avisos do Windows com o `agy`. Se for a primeira instalação do Codex Notify, rode o `npm ci` e o registro de notificações da seção de instalação.

- **Terminal normal do `agy`.** Rode o comando abaixo e reinicie o `agy`. Abra `/hooks`, selecione **Stop** e confira se **codex-notify-stop** está ativo. Isso adiciona o aviso de conclusão. Para remover o hook da configuração global do Antigravity, rode `npm run unregister-antigravity --prefix .\plugins\codex-notify`. [Hooks do Antigravity][agy-hooks]
- **Cliente ACP ou editor.** Configure o proxy como servidor ACP para receber os avisos de conclusão e de pedidos reais de permissão. Aprove ou negue na interface do cliente. [Antigravity via ACP][agy-acp]

```powershell
npm run register-antigravity --prefix .\plugins\codex-notify
```

Configure o cliente com `node` como comando e o caminho absoluto para `plugins/codex-notify/antigravity/acp.cjs` como argumento, conforme o [exemplo do Zed](#antigravity-cli-on-windows). O proxy usa o `agy` do PATH ou o caminho indicado em `AGY_EXECUTABLE`.

O remetente é **Codex Notify** e o título do aviso identifica o Antigravity. A sessão ACP usa o login do Antigravity.

### Desinstalação

```powershell
npm run unregister-notifications --prefix .\plugins\codex-notify
codex plugin remove codex-notify@codex-notify-local
codex plugin marketplace remove codex-notify-local
```

---

The blue Codex icon comes from OpenAI's Windows app. · O ícone azul do Codex vem do aplicativo da OpenAI para Windows.

[hooks]: https://learn.chatgpt.com/docs/hooks
[node-notifier]: https://github.com/mikaelbr/node-notifier/blob/v12.1.0/package.json
[plugins]: https://developers.openai.com/plugins/build/plugins#install-a-local-plugin-manually
[trust]: https://learn.chatgpt.com/docs/hooks#review-and-trust-hooks
[windows]: https://support.microsoft.com/en-gb/windows/experience/notifications-and-do-not-disturb-in-windows
[agy-hooks]: https://antigravity.google/docs/hooks#managing-hooks-in-antigravity-cli
[agy-acp]: https://antigravity.google/docs/ide/extensions/acp
