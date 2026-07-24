# OdontoAgenda

Sistema de agendamento online para consultórios odontológicos.

- **Front-end**: React 19 + TanStack Start + TypeScript + Tailwind CSS
- **Estado/dados**: TanStack Query + Axios + React Hook Form + Zod
- **Backend**: Google Apps Script (Web App) — arquivo em `apps-script/Code.gs`
- **Banco**: Google Sheets (2 planilhas: Disponibilidade e Agendamentos)

O front nunca acessa Sheets diretamente — toda comunicação passa pela camada `src/services/*` que consome a URL do Apps Script.

## Estrutura

```
src/
  components/ui/     shadcn/ui
  layouts/           AppShell (header + bottom nav)
  lib/api.ts         Axios + helpers apiGet/apiPost (JSON via text/plain — evita preflight CORS)
  services/          agendaService.ts (única camada que fala com a API)
  types/             tipos compartilhados
  routes/            index, agendar, consulta, cancelar
apps-script/Code.gs  backend completo (GET/POST + LockService + envio de e-mail)
```

## Variáveis de ambiente

Crie `.env.local` (ou configure no painel do Lovable/Vercel):

```
VITE_API_URL=https://script.google.com/macros/s/SEU_SCRIPT_ID/exec
```

Modelo em `.env.example`.

## Deploy do Apps Script

1. Abra <https://script.google.com> → **Novo projeto**.
2. Cole `apps-script/Code.gs`.
3. Ajuste `SHEET_DISPONIBILIDADE_ID` e `SHEET_AGENDAMENTOS_ID` (já preenchidos com os IDs informados).
4. Verifique o nome da aba (`ABA_DISPONIBILIDADE` / `ABA_AGENDAMENTOS`) — padrão `Página1`.
5. **Deploy → Nova implantação → App da Web**
   - Executar como: **Eu**
   - Quem tem acesso: **Qualquer pessoa**
6. Copie a URL terminada em `/exec` → coloque em `VITE_API_URL`.

## API

| Método | Ação | Descrição |
|--------|------|-----------|
| GET  | `?action=horarios-disponiveis`                                | lista slots com Status=Disponível |
| GET  | `?action=buscar-consulta&nomeCompleto=&cpf=`                   | busca agendamento |
| POST | `{action:"agendar", ...}`                                      | cria agendamento (LockService + protocolo + e-mail) |
| POST | `{action:"cancelar", nomeCompleto, cpf}`                       | cancela e libera horário |
| POST | `{action:"reagendar", nomeCompleto, cpf, novaData, novoHorario}` | reagenda |

Resposta padrão: `{ ok: true, data: ... }` ou `{ ok: false, error: "..." }`.

Concorrência: `LockService.getScriptLock()` garante que apenas o primeiro pedido reserva o horário.

## Estrutura das planilhas (não alterar)

**Disponibilidade** — colunas: `Data | Dia | Horário | Status`
Valores de Status: `Disponível`, `Agendado`, `Bloqueado`, `Não agendado`.

**Agendamentos** — colunas: `Data da consulta | Horário | Nome completo | CPF | Data de nascimento | Telefone | E-mail | Convênio | Observações | Data do agendamento | Status`.

## Checklist de integração

- [ ] Web App publicado com "Qualquer pessoa"
- [ ] URL colada em `VITE_API_URL`
- [ ] GET `horarios-disponiveis` retorna JSON
- [ ] POST `agendar` cria linha em Agendamentos e muda Status para "Agendado"
- [ ] Cancelar reverte para "Disponível"
- [ ] Front consome sem erro de CORS (POST usa `text/plain` para evitar preflight)

## Scripts

```
bun install
bun run dev       # ambiente local
bun run build     # produção
```
