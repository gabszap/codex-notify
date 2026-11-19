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
