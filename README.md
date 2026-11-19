# Codex Notify

Plugin local para o Codex no Windows. Exibe uma notificação quando o Codex pede permissão e quando encerra um turno. O aviso de permissão mostra a justificativa enviada pelo Codex ou a ação que aguarda aprovação. O pedido é respondido no Codex.

## Instalar

Você precisa do Codex CLI, do npm e do Node.js no PATH do Codex. O `node-notifier` 12.1.0 requer Node.js 22.22.2+, 24.15.0+ ou 26+. [Requisitos do node-notifier](https://github.com/mikaelbr/node-notifier/blob/v12.1.0/package.json)

No PowerShell, a partir da pasta deste projeto, instale as dependências antes de adicionar o plugin.

```powershell
npm ci --prefix .\plugins\codex-notify --ignore-scripts
npm run register-notifications --prefix .\plugins\codex-notify
codex plugin marketplace add (Get-Location).Path
codex plugin add codex-notify@codex-notify-local
```

Reinicie o Codex e abra uma nova conversa local. No aplicativo, revise e habilite os dois hooks em **Configurações → Hooks**. No CLI, abra `/hooks` para fazer essa revisão. Se o aplicativo oferecer o marketplace **Codex Notify Local** no diretório de plugins, você também pode instalar o plugin por ali. [Instalação de plugins locais](https://developers.openai.com/plugins/build/plugins#install-a-local-plugin-manually) · [Revisão de hooks](https://learn.chatgpt.com/docs/hooks#review-and-trust-hooks)

## Atualizar o plugin

```powershell
npm ci --prefix .\plugins\codex-notify --ignore-scripts
npm run register-notifications --prefix .\plugins\codex-notify
codex plugin remove codex-notify@codex-notify-local
codex plugin add codex-notify@codex-notify-local
```

Reinicie o Codex e revise os dois hooks da nova versão.

## Testar

Da pasta do projeto, simule um pedido de permissão. Troque `PermissionRequest` por `Stop` para testar o segundo aviso.

```powershell
@{
  hook_event_name = 'PermissionRequest'
  cwd = (Get-Location).Path
  tool_name = 'Bash'
  tool_input = @{ description = 'Permitir acesso ao npm para instalar as dependências?' }
} |
  ConvertTo-Json -Compress |
  node .\plugins\codex-notify\hooks\notify.cjs
```

O comando `register-notifications` registra o nome **Codex Notify** e o ícone azul para seu usuário do Windows. Sem esse registro, o `node-notifier` usa o cabeçalho do SnoreToast. Os hooks rodam em segundo plano. Se a sessão do Codex for encerrada logo após o evento, o aviso pode ser interrompido. [Notificações do node-notifier no Windows](https://github.com/mikaelbr/node-notifier/blob/v12.1.0/README.md#windows-toaster-windows-8) · [Eventos e execução em segundo plano](https://learn.chatgpt.com/docs/hooks)

O PNG do aviso é o ícone do Codex fornecido pelo app da OpenAI para Windows.

## Desinstalar

```powershell
npm run unregister-notifications --prefix .\plugins\codex-notify
codex plugin remove codex-notify@codex-notify-local
codex plugin marketplace remove codex-notify-local
```
