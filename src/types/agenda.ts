export type HorarioDisponivel = {
  data: string; // dd/MM/yyyy
  dia: string;
  horario: string; // HH:mm
  status: "Disponível" | "Agendado" | "Bloqueado" | "Não agendado";
};

export type Agendamento = {
  dataConsulta: string;
  horario: string;
  nomeCompleto: string;
  cpf: string;
  dataNascimento: string;
  telefone: string;
  email: string;
  convenio: string;
  observacoes?: string;
  dataAgendamento?: string;
  status?: string;
  protocolo?: string;
};
