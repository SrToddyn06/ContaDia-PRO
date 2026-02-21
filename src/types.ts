export interface WorkLog {
  id: number;
  date: string;
  type: 'half_day' | 'full_day';
  value: number;
}

export interface Employee {
  id: number;
  name: string;
  total_to_pay: number;
  logs: WorkLog[];
}

export interface AppSettings {
  half_day_value: number;
  full_day_value: number;
  show_jokes: boolean;
  show_tips: boolean;
  theme: 'light' | 'dark' | 'vibrant';
  weekly_goal: number;
  monthly_goal: number;
  last_reset_date: string;
}

export const MOTIVATIONAL_PHRASES = [
  "Dia pago é dia conquistado!",
  "Mais um clique = mais uma grana 💸",
  "Bateu a meta? Respira. Depois clica no botão.",
  "O trabalho dignifica o homem, mas o pagamento alegra a alma!",
  "Foco no objetivo, o café a gente toma depois.",
  "Cada centavo conta na jornada do sucesso!",
  "Você é o seu melhor investimento.",
  "Trabalhe enquanto eles dormem... mentira, durma também que faz bem.",
  "A persistência é o caminho do êxito.",
  "Hoje é um ótimo dia para ganhar dinheiro!"
];

export const JOKES = [
  "Por que o freelancer atravessou a rua? Para cobrar o cliente do outro lado.",
  "O que o café disse para o freelancer? 'Sem mim você não é nada'.",
  "Status: Esperando o cliente aprovar o orçamento.",
  "Freelancer não tira férias, tira 'período sabático não remunerado'.",
  "Minha meta é ser tão rico que não vou precisar de metas.",
  "O boleto vence, mas a minha vontade de trabalhar... também.",
  "Café: o combustível oficial de quem não tem FGTS.",
  "Trabalhar em casa é ótimo, você pode chorar no chuveiro a qualquer hora.",
  "O cliente pediu 'só um ajustezinho'. Já se passaram 3 dias.",
  "Eu não sou preguiçoso, estou apenas em modo de economia de energia."
];
