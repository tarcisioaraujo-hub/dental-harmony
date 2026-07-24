/**
 * OdontoAgenda — Google Apps Script (Web App / API REST)
 *
 * Deploy:
 *   1. Cole este arquivo em um projeto Apps Script (script.google.com).
 *   2. Ajuste SHEET_DISPONIBILIDADE_ID e SHEET_AGENDAMENTOS_ID.
 *   3. Deploy → Nova implantação → Tipo: App da Web
 *        - Executar como: Eu
 *        - Quem tem acesso: Qualquer pessoa
 *   4. Copie a URL /exec e salve como VITE_API_URL no front.
 *
 * Endpoints (roteamento por ?action= no GET e body.action no POST):
 *   GET  ?action=horarios-disponiveis
 *   GET  ?action=buscar-consulta&nomeCompleto=...&cpf=...
 *   POST { action: "agendar", ... }
 *   POST { action: "cancelar", nomeCompleto, cpf }
 *   POST { action: "reagendar", nomeCompleto, cpf, novaData, novoHorario }
 */

const SHEET_DISPONIBILIDADE_ID = '1Lgh4XOUnCnd4zC8CUeVcpyAwtGY11x1maTkudUSAF18';
const SHEET_AGENDAMENTOS_ID    = '186CJBTfrvWJe28beSbn_ek1KN2IF44M_uF1Z77ZRLeE';

const ABA_DISPONIBILIDADE = 'Página1'; // ajuste se necessário
const ABA_AGENDAMENTOS    = 'Página1';

// ---------- Roteador ----------
function doGet(e) {
  return handle(e, (e.parameter && e.parameter.action) || '', e.parameter || {});
}

function doPost(e) {
  var body = {};
  try { body = JSON.parse(e.postData.contents || '{}'); } catch (err) {}
  return handle(e, body.action || '', body);
}

function handle(e, action, payload) {
  try {
    switch (action) {
      case 'horarios-disponiveis': return json(ok(listarHorariosDisponiveis()));
      case 'buscar-consulta':      return json(ok(buscarConsulta(payload)));
      case 'agendar':              return json(ok(agendar(payload)));
      case 'cancelar':             return json(ok(cancelar(payload)));
      case 'reagendar':            return json(ok(reagendar(payload)));
      default: return json(err('Ação inválida: ' + action));
    }
  } catch (ex) {
    return json(err(ex && ex.message ? ex.message : String(ex)));
  }
}

function ok(data)   { return { ok: true,  data: data }; }
function err(msg)   { return { ok: false, error: msg }; }
function json(obj)  {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------- Helpers de planilha ----------
function abaDisp()   { return SpreadsheetApp.openById(SHEET_DISPONIBILIDADE_ID).getSheetByName(ABA_DISPONIBILIDADE); }
function abaAgend()  { return SpreadsheetApp.openById(SHEET_AGENDAMENTOS_ID).getSheetByName(ABA_AGENDAMENTOS); }

function formatDate(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'dd/MM/yyyy');
  return String(v || '').trim();
}
function formatHora(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), 'HH:mm');
  return String(v || '').trim();
}

// ---------- Regras ----------
function listarHorariosDisponiveis() {
  var sh = abaDisp();
  var values = sh.getDataRange().getValues();
  var out = [];
  // linha 0 = header (Data, Dia, Horário, Status)
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    var status = String(row[3] || '').trim();
    if (status !== 'Disponível') continue;
    out.push({
      data: formatDate(row[0]),
      dia: String(row[1] || ''),
      horario: formatHora(row[2]),
      status: status
    });
  }
  return out;
}

function findLinhaDisponibilidade(sh, data, horario) {
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (formatDate(values[i][0]) === data && formatHora(values[i][2]) === horario) {
      return { row: i + 1, status: String(values[i][3] || '').trim() };
    }
  }
  return null;
}

function agendar(p) {
  requireFields(p, ['nomeCompleto','cpf','dataNascimento','telefone','email','convenio','dataConsulta','horario']);
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sd = abaDisp();
    var found = findLinhaDisponibilidade(sd, p.dataConsulta, p.horario);
    if (!found) throw new Error('Horário não encontrado.');
    if (found.status !== 'Disponível') {
      throw new Error('Este horário acabou de ser reservado. Escolha outro.');
    }
    sd.getRange(found.row, 4).setValue('Agendado');

    var protocolo = 'ODT-' + new Date().getTime().toString(36).toUpperCase();
    var agora = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');

    abaAgend().appendRow([
      p.dataConsulta, p.horario, p.nomeCompleto, p.cpf, p.dataNascimento,
      p.telefone, p.email, p.convenio, p.observacoes || '', agora, 'Confirmado'
    ]);

    try {
      if (p.email) {
        MailApp.sendEmail(p.email, 'Consulta confirmada — OdontoAgenda',
          'Olá ' + p.nomeCompleto + ',\n\nSua consulta foi confirmada para ' + p.dataConsulta +
          ' às ' + p.horario + '.\nProtocolo: ' + protocolo + '\n\nObrigado!');
      }
    } catch (mailErr) {}

    return {
      dataConsulta: p.dataConsulta, horario: p.horario, nomeCompleto: p.nomeCompleto,
      cpf: p.cpf, dataNascimento: p.dataNascimento, telefone: p.telefone, email: p.email,
      convenio: p.convenio, observacoes: p.observacoes || '', dataAgendamento: agora,
      status: 'Confirmado', protocolo: protocolo
    };
  } finally {
    lock.releaseLock();
  }
}

function localizarAgendamento(sh, nome, cpf) {
  var values = sh.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    var st = String(values[i][10] || '').trim();
    if (String(values[i][2]).trim() === nome.trim() &&
        String(values[i][3]).trim() === cpf.trim() &&
        st !== 'Cancelado') {
      return { row: i + 1, values: values[i] };
    }
  }
  return null;
}

function cancelar(p) {
  requireFields(p, ['nomeCompleto','cpf']);
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sa = abaAgend();
    var found = localizarAgendamento(sa, p.nomeCompleto, p.cpf);
    if (!found) throw new Error('Consulta não encontrada.');
    sa.getRange(found.row, 11).setValue('Cancelado');

    var sd = abaDisp();
    var slot = findLinhaDisponibilidade(sd, formatDate(found.values[0]), formatHora(found.values[1]));
    if (slot) sd.getRange(slot.row, 4).setValue('Disponível');
    return { cancelado: true };
  } finally { lock.releaseLock(); }
}

function reagendar(p) {
  requireFields(p, ['nomeCompleto','cpf','novaData','novoHorario']);
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var sa = abaAgend();
    var found = localizarAgendamento(sa, p.nomeCompleto, p.cpf);
    if (!found) throw new Error('Consulta não encontrada.');

    var sd = abaDisp();
    var novo = findLinhaDisponibilidade(sd, p.novaData, p.novoHorario);
    if (!novo || novo.status !== 'Disponível') {
      throw new Error('Novo horário indisponível.');
    }
    // libera antigo
    var antigo = findLinhaDisponibilidade(sd, formatDate(found.values[0]), formatHora(found.values[1]));
    if (antigo) sd.getRange(antigo.row, 4).setValue('Disponível');
    // reserva novo
    sd.getRange(novo.row, 4).setValue('Agendado');
    // atualiza linha do agendamento
    sa.getRange(found.row, 1).setValue(p.novaData);
    sa.getRange(found.row, 2).setValue(p.novoHorario);
    sa.getRange(found.row, 11).setValue('Reagendado');

    return {
      dataConsulta: p.novaData, horario: p.novoHorario,
      nomeCompleto: p.nomeCompleto, cpf: p.cpf,
      dataNascimento: String(found.values[4] || ''),
      telefone: String(found.values[5] || ''),
      email: String(found.values[6] || ''),
      convenio: String(found.values[7] || ''),
      observacoes: String(found.values[8] || ''),
      status: 'Reagendado'
    };
  } finally { lock.releaseLock(); }
}

function buscarConsulta(p) {
  requireFields(p, ['nomeCompleto','cpf']);
  var sa = abaAgend();
  var found = localizarAgendamento(sa, p.nomeCompleto, p.cpf);
  if (!found) throw new Error('Consulta não encontrada.');
  var r = found.values;
  return {
    dataConsulta: formatDate(r[0]), horario: formatHora(r[1]),
    nomeCompleto: String(r[2]), cpf: String(r[3]),
    dataNascimento: String(r[4]), telefone: String(r[5]),
    email: String(r[6]), convenio: String(r[7]),
    observacoes: String(r[8] || ''), dataAgendamento: String(r[9] || ''),
    status: String(r[10] || '')
  };
}

function requireFields(p, fields) {
  for (var i = 0; i < fields.length; i++) {
    if (!p[fields[i]]) throw new Error('Campo obrigatório: ' + fields[i]);
  }
}
