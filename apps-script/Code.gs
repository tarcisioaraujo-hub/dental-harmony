/**
 * OdontoAgenda — API REST em Google Apps Script + Google Sheets
 *
 * COMO REIMPLANTAR CORRETAMENTE
 * 1) Apps Script → substitua TODO o conteúdo de Code.gs por este arquivo.
 * 2) Clique em Salvar.
 * 3) Clique em Executar uma vez a função testeDiagnostico para autorizar o acesso às planilhas.
 * 4) Implantar → Gerenciar implantações → Editar (ícone de lápis).
 * 5) Selecione uma NOVA VERSÃO.
 * 6) Tipo: App da Web.
 * 7) Executar como: Eu.
 * 8) Quem pode acessar: Qualquer pessoa.
 * 9) Implantar e copie a URL terminada em /exec.
 *
 * TESTE NO NAVEGADOR:
 * https://script.google.com/macros/s/SEU_DEPLOY_ID/exec?action=diagnostico
 * https://script.google.com/macros/s/SEU_DEPLOY_ID/exec?action=horarios-disponiveis
 *
 * Resposta padrão do front:
 * { ok: true, data: ... }
 * { ok: false, error: "..." }
 */

const CONFIG = {
  SHEET_DISPONIBILIDADE_ID: '1Lgh4XOUnCnd4zC8CUeVcpyAwtGY11x1maTkudUSAF18',
  SHEET_AGENDAMENTOS_ID: '186CJBTfrvWJe28beSbn_ek1KN2IF44M_uF1Z77ZRLeE',

  // Se sua aba não for Página1, altere aqui exatamente como aparece no rodapé da planilha.
  ABA_DISPONIBILIDADE: 'Página1',
  ABA_AGENDAMENTOS: 'Página1',

  TIMEZONE: 'America/Sao_Paulo',
};

const COL_DISPONIBILIDADE = {
  DATA: 0,
  DIA: 1,
  HORARIO: 2,
  STATUS: 3,
};

const COL_AGENDAMENTOS = {
  DATA_CONSULTA: 0,
  HORARIO: 1,
  NOME_COMPLETO: 2,
  CPF: 3,
  DATA_NASCIMENTO: 4,
  TELEFONE: 5,
  EMAIL: 6,
  CONVENIO: 7,
  OBSERVACOES: 8,
  DATA_AGENDAMENTO: 9,
  STATUS: 10,
  PROTOCOLO: 11,
};

const STATUS = {
  DISPONIVEL: 'Disponível',
  NAO_AGENDADO: 'Não agendado',
  AGENDADO: 'Agendado',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  REAGENDADO: 'Reagendado',
  BLOQUEADO: 'Bloqueado',
};

function doGet(e) {
  const params = (e && e.parameter) || {};
  return handleRequest(params.action || '', params);
}

function doPost(e) {
  const body = parseBody(e);
  return handleRequest(body.action || '', body);
}

function handleRequest(action, payload) {
  try {
    switch (String(action || '').trim()) {
      case 'health':
        return json(ok({ status: 'online', timestamp: new Date().toISOString() }));

      case 'diagnostico':
        return json(ok(diagnostico()));

      case 'horarios-disponiveis':
        return json(ok(listarHorariosDisponiveis()));

      case 'buscar-consulta':
        return json(ok(buscarConsulta(payload)));

      case 'buscar-consultas':
        return json(ok(buscarConsultas(payload)));


      case 'agendar':
        return json(ok(agendar(payload)));

      case 'cancelar':
        return json(ok(cancelar(payload)));

      case 'reagendar':
        return json(ok(reagendar(payload)));

      default:
        return json(fail('Ação inválida ou ausente: ' + String(action || '(vazia)')));
    }
  } catch (error) {
    console.error(error);
    return json(fail(error && error.message ? error.message : String(error)));
  }
}

function parseBody(e) {
  if (!e || !e.postData || !e.postData.contents) return {};

  const raw = String(e.postData.contents || '').trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (jsonError) {
    // Fallback para x-www-form-urlencoded, útil em testes manuais.
    const out = {};
    raw.split('&').forEach(function (part) {
      const pieces = part.split('=');
      if (!pieces[0]) return;
      out[decodeURIComponent(pieces[0])] = decodeURIComponent((pieces[1] || '').replace(/\+/g, ' '));
    });
    return out;
  }
}

function ok(data) {
  return { ok: true, data: data };
}

function fail(message) {
  return { ok: false, error: String(message || 'Erro desconhecido') };
}

function json(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function abrirAba(spreadsheetId, sheetName, label) {
  const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  const sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    const names = spreadsheet.getSheets().map(function (s) { return s.getName(); }).join(', ');
    throw new Error('Aba "' + sheetName + '" não encontrada em ' + label + '. Abas existentes: ' + names);
  }

  return sheet;
}

function abaDisponibilidade() {
  return abrirAba(CONFIG.SHEET_DISPONIBILIDADE_ID, CONFIG.ABA_DISPONIBILIDADE, 'Disponibilidade');
}

function abaAgendamentos() {
  return abrirAba(CONFIG.SHEET_AGENDAMENTOS_ID, CONFIG.ABA_AGENDAMENTOS, 'Agendamentos');
}

function normalizarTexto(value) {
  return String(value || '').trim();
}

function normalizarChave(value) {
  return normalizarTexto(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

function somenteDigitos(value) {
  return normalizarTexto(value).replace(/\D/g, '');
}

function formatarData(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, CONFIG.TIMEZONE, 'dd/MM/yyyy');
  }

  const text = normalizarTexto(value);
  if (!text) return '';

  // Se a planilha estiver como yyyy-mm-dd, converte para dd/MM/yyyy.
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[3] + '/' + iso[2] + '/' + iso[1];

  return text;
}

function formatarHorario(value) {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, CONFIG.TIMEZONE, 'HH:mm');
  }

  const text = normalizarTexto(value);
  if (!text) return '';

  const match = text.match(/(\d{1,2})[:hH](\d{2})/);
  if (match) return ('0' + Number(match[1])).slice(-2) + ':' + match[2];

  return text;
}

function statusEhDisponivel(status) {
  const key = normalizarChave(status);
  // Aceita os dois status usados no projeto/planilha para evitar lista vazia.
  return key === normalizarChave(STATUS.DISPONIVEL) || key === normalizarChave(STATUS.NAO_AGENDADO);
}

function getValores(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return [];
  return sheet.getRange(1, 1, lastRow, Math.max(lastColumn, 12)).getValues();
}

function diagnostico() {
  const disp = abaDisponibilidade();
  const agend = abaAgendamentos();
  const dispValues = getValores(disp);
  const agendValues = getValores(agend);

  return {
    api: 'OdontoAgenda GAS',
    status: 'online',
    disponibilidade: {
      planilhaId: CONFIG.SHEET_DISPONIBILIDADE_ID,
      aba: disp.getName(),
      linhasComCabecalho: dispValues.length,
      cabecalho: dispValues[0] || [],
      primeiraLinhaDados: dispValues[1] || [],
      horariosDisponiveis: contarDisponiveis(dispValues),
    },
    agendamentos: {
      planilhaId: CONFIG.SHEET_AGENDAMENTOS_ID,
      aba: agend.getName(),
      linhasComCabecalho: agendValues.length,
      cabecalho: agendValues[0] || [],
    },
  };
}

function contarDisponiveis(values) {
  let total = 0;
  for (let i = 1; i < values.length; i++) {
    if (statusEhDisponivel(values[i][COL_DISPONIBILIDADE.STATUS])) total++;
  }
  return total;
}

function listarHorariosDisponiveis() {
  const sheet = abaDisponibilidade();
  const values = getValores(sheet);
  const horarios = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const data = formatarData(row[COL_DISPONIBILIDADE.DATA]);
    const horario = formatarHorario(row[COL_DISPONIBILIDADE.HORARIO]);
    const status = normalizarTexto(row[COL_DISPONIBILIDADE.STATUS]);

    if (!data || !horario || !statusEhDisponivel(status)) continue;

    horarios.push({
      data: data,
      dia: normalizarTexto(row[COL_DISPONIBILIDADE.DIA]),
      horario: horario,
      status: STATUS.DISPONIVEL,
    });
  }

  return horarios;
}

function encontrarLinhaDisponibilidade(sheet, data, horario) {
  const values = getValores(sheet);
  const dataBusca = formatarData(data);
  const horarioBusca = formatarHorario(horario);

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (
      formatarData(row[COL_DISPONIBILIDADE.DATA]) === dataBusca &&
      formatarHorario(row[COL_DISPONIBILIDADE.HORARIO]) === horarioBusca
    ) {
      return {
        rowNumber: i + 1,
        values: row,
        status: normalizarTexto(row[COL_DISPONIBILIDADE.STATUS]),
      };
    }
  }

  return null;
}

function agendar(payload) {
  exigirCampos(payload, ['nomeCompleto', 'cpf', 'dataNascimento', 'telefone', 'email', 'convenio', 'dataConsulta', 'horario']);

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const sheetDisponibilidade = abaDisponibilidade();
    const slot = encontrarLinhaDisponibilidade(sheetDisponibilidade, payload.dataConsulta, payload.horario);

    if (!slot) throw new Error('Horário não encontrado na planilha de disponibilidade.');
    if (!statusEhDisponivel(slot.status)) throw new Error('Este horário não está mais disponível. Escolha outro.');

    const protocolo = gerarProtocolo();
    const agora = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm');

    sheetDisponibilidade.getRange(slot.rowNumber, COL_DISPONIBILIDADE.STATUS + 1).setValue(STATUS.AGENDADO);

    const row = [];
    row[COL_AGENDAMENTOS.DATA_CONSULTA] = formatarData(payload.dataConsulta);
    row[COL_AGENDAMENTOS.HORARIO] = formatarHorario(payload.horario);
    // REGRA: dados do paciente sempre gravados em MAIÚSCULAS
    row[COL_AGENDAMENTOS.NOME_COMPLETO] = maiusculas(payload.nomeCompleto);
    row[COL_AGENDAMENTOS.CPF] = maiusculas(payload.cpf);
    row[COL_AGENDAMENTOS.DATA_NASCIMENTO] = maiusculas(payload.dataNascimento);
    row[COL_AGENDAMENTOS.TELEFONE] = maiusculas(payload.telefone);
    row[COL_AGENDAMENTOS.EMAIL] = maiusculas(payload.email);
    row[COL_AGENDAMENTOS.CONVENIO] = maiusculas(payload.convenio);
    row[COL_AGENDAMENTOS.OBSERVACOES] = maiusculas(payload.observacoes);
    row[COL_AGENDAMENTOS.DATA_AGENDAMENTO] = agora;
    row[COL_AGENDAMENTOS.STATUS] = STATUS.CONFIRMADO;
    row[COL_AGENDAMENTOS.PROTOCOLO] = maiusculas(protocolo);


    abaAgendamentos().appendRow(row);

    enviarEmailConfirmacao(payload, protocolo);

    return montarAgendamento({
      dataConsulta: row[COL_AGENDAMENTOS.DATA_CONSULTA],
      horario: row[COL_AGENDAMENTOS.HORARIO],
      nomeCompleto: row[COL_AGENDAMENTOS.NOME_COMPLETO],
      cpf: row[COL_AGENDAMENTOS.CPF],
      dataNascimento: row[COL_AGENDAMENTOS.DATA_NASCIMENTO],
      telefone: row[COL_AGENDAMENTOS.TELEFONE],
      email: row[COL_AGENDAMENTOS.EMAIL],
      convenio: row[COL_AGENDAMENTOS.CONVENIO],
      observacoes: row[COL_AGENDAMENTOS.OBSERVACOES],
      dataAgendamento: agora,
      status: STATUS.CONFIRMADO,
      protocolo: protocolo,
    });
  } finally {
    lock.releaseLock();
  }
}

function buscarConsulta(payload) {
  exigirCampos(payload, ['nomeCompleto', 'cpf']);
  const encontrado = localizarAgendamento(payload.nomeCompleto, payload.cpf);
  if (!encontrado) throw new Error('Consulta não encontrada.');
  return agendamentoDaLinha(encontrado.values);
}

function cancelar(payload) {
  exigirCampos(payload, ['nomeCompleto', 'cpf']);

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const encontrado = localizarAgendamento(payload.nomeCompleto, payload.cpf);
    if (!encontrado) throw new Error('Consulta não encontrada.');

    const sheetAgendamentos = abaAgendamentos();
    sheetAgendamentos.getRange(encontrado.rowNumber, COL_AGENDAMENTOS.STATUS + 1).setValue(STATUS.CANCELADO);

    const sheetDisponibilidade = abaDisponibilidade();
    const slot = encontrarLinhaDisponibilidade(
      sheetDisponibilidade,
      encontrado.values[COL_AGENDAMENTOS.DATA_CONSULTA],
      encontrado.values[COL_AGENDAMENTOS.HORARIO]
    );
    if (slot) {
      sheetDisponibilidade.getRange(slot.rowNumber, COL_DISPONIBILIDADE.STATUS + 1).setValue(STATUS.DISPONIVEL);
    }

    return { cancelado: true };
  } finally {
    lock.releaseLock();
  }
}

function reagendar(payload) {
  exigirCampos(payload, ['nomeCompleto', 'cpf', 'novaData', 'novoHorario']);

  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    const encontrado = localizarAgendamento(payload.nomeCompleto, payload.cpf);
    if (!encontrado) throw new Error('Consulta não encontrada.');

    const sheetDisponibilidade = abaDisponibilidade();
    const novoSlot = encontrarLinhaDisponibilidade(sheetDisponibilidade, payload.novaData, payload.novoHorario);

    if (!novoSlot) throw new Error('Novo horário não encontrado na planilha de disponibilidade.');
    if (!statusEhDisponivel(novoSlot.status)) throw new Error('Novo horário indisponível.');

    const slotAntigo = encontrarLinhaDisponibilidade(
      sheetDisponibilidade,
      encontrado.values[COL_AGENDAMENTOS.DATA_CONSULTA],
      encontrado.values[COL_AGENDAMENTOS.HORARIO]
    );

    if (slotAntigo) {
      sheetDisponibilidade.getRange(slotAntigo.rowNumber, COL_DISPONIBILIDADE.STATUS + 1).setValue(STATUS.DISPONIVEL);
    }

    sheetDisponibilidade.getRange(novoSlot.rowNumber, COL_DISPONIBILIDADE.STATUS + 1).setValue(STATUS.AGENDADO);

    const sheetAgendamentos = abaAgendamentos();
    sheetAgendamentos.getRange(encontrado.rowNumber, COL_AGENDAMENTOS.DATA_CONSULTA + 1).setValue(formatarData(payload.novaData));
    sheetAgendamentos.getRange(encontrado.rowNumber, COL_AGENDAMENTOS.HORARIO + 1).setValue(formatarHorario(payload.novoHorario));
    sheetAgendamentos.getRange(encontrado.rowNumber, COL_AGENDAMENTOS.STATUS + 1).setValue(STATUS.REAGENDADO);

    const atualizado = encontrado.values.slice();
    atualizado[COL_AGENDAMENTOS.DATA_CONSULTA] = formatarData(payload.novaData);
    atualizado[COL_AGENDAMENTOS.HORARIO] = formatarHorario(payload.novoHorario);
    atualizado[COL_AGENDAMENTOS.STATUS] = STATUS.REAGENDADO;

    return agendamentoDaLinha(atualizado);
  } finally {
    lock.releaseLock();
  }
}

function localizarAgendamento(nomeCompleto, cpf) {
  const values = getValores(abaAgendamentos());
  const nomeBusca = normalizarChave(nomeCompleto);
  const cpfBusca = somenteDigitos(cpf);

  for (let i = values.length - 1; i >= 1; i--) {
    const row = values[i];
    const status = normalizarChave(row[COL_AGENDAMENTOS.STATUS]);

    if (status === normalizarChave(STATUS.CANCELADO)) continue;

    const mesmoNome = normalizarChave(row[COL_AGENDAMENTOS.NOME_COMPLETO]) === nomeBusca;
    const mesmoCpf = somenteDigitos(row[COL_AGENDAMENTOS.CPF]) === cpfBusca;

    if (mesmoNome && mesmoCpf) {
      return { rowNumber: i + 1, values: row };
    }
  }

  return null;
}

function agendamentoDaLinha(row) {
  return montarAgendamento({
    dataConsulta: formatarData(row[COL_AGENDAMENTOS.DATA_CONSULTA]),
    horario: formatarHorario(row[COL_AGENDAMENTOS.HORARIO]),
    nomeCompleto: normalizarTexto(row[COL_AGENDAMENTOS.NOME_COMPLETO]),
    cpf: normalizarTexto(row[COL_AGENDAMENTOS.CPF]),
    dataNascimento: formatarData(row[COL_AGENDAMENTOS.DATA_NASCIMENTO]),
    telefone: normalizarTexto(row[COL_AGENDAMENTOS.TELEFONE]),
    email: normalizarTexto(row[COL_AGENDAMENTOS.EMAIL]),
    convenio: normalizarTexto(row[COL_AGENDAMENTOS.CONVENIO]),
    observacoes: normalizarTexto(row[COL_AGENDAMENTOS.OBSERVACOES]),
    dataAgendamento: normalizarTexto(row[COL_AGENDAMENTOS.DATA_AGENDAMENTO]),
    status: normalizarTexto(row[COL_AGENDAMENTOS.STATUS]),
    protocolo: normalizarTexto(row[COL_AGENDAMENTOS.PROTOCOLO]),
  });
}

function montarAgendamento(data) {
  return {
    dataConsulta: data.dataConsulta || '',
    horario: data.horario || '',
    nomeCompleto: data.nomeCompleto || '',
    cpf: data.cpf || '',
    dataNascimento: data.dataNascimento || '',
    telefone: data.telefone || '',
    email: data.email || '',
    convenio: data.convenio || '',
    observacoes: data.observacoes || '',
    dataAgendamento: data.dataAgendamento || '',
    status: data.status || '',
    protocolo: data.protocolo || '',
  };
}

function exigirCampos(payload, campos) {
  payload = payload || {};
  campos.forEach(function (campo) {
    if (!normalizarTexto(payload[campo])) {
      throw new Error('Campo obrigatório: ' + campo);
    }
  });
}

function gerarProtocolo() {
  return 'ODT-' + Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyyMMddHHmmss') + '-' + Math.floor(Math.random() * 1000);
}

function enviarEmailConfirmacao(payload, protocolo) {
  try {
    const email = normalizarTexto(payload.email);
    if (!email) return;

    MailApp.sendEmail({
      to: email,
      subject: 'Consulta confirmada — OdontoAgenda',
      body:
        'Olá ' + normalizarTexto(payload.nomeCompleto) + ',\n\n' +
        'Sua consulta foi confirmada para ' + formatarData(payload.dataConsulta) +
        ' às ' + formatarHorario(payload.horario) + '.\n' +
        'Protocolo: ' + protocolo + '\n\n' +
        'Obrigado!',
    });
  } catch (error) {
    // Não bloqueia o agendamento se o envio de e-mail falhar.
    console.warn('Falha ao enviar e-mail de confirmação:', error);
  }
}

/**
 * Execute manualmente no Apps Script após colar o código para autorizar e validar.
 */
function testeDiagnostico() {
  Logger.log(JSON.stringify(diagnostico(), null, 2));
}
