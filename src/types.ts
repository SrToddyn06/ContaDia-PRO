export interface WorkLog {
  id: number;
  date: string;
  type: 'half_day' | 'full_day';
  value: number;
}

export interface Expense {
  id: number;
  value: number;
  category: string;
  description?: string;
  date: string;
  paymentMethod: string;
  installments?: {
    count: number;
    value: number;
  };
  isBusiness: boolean;
}

export interface FixedExpense {
  id: number;
  label: string;
  value: number;
  isActive: boolean;
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
  user_name: string;
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
  "O salário entrou e saiu tão rápido que parecia investimento de curto prazo.",
  "Minha carteira pratica austeridade sem consultar ninguém.",
  "A inflação entrou no mercado e pediu aumento.",
  "Meu orçamento tem mais buracos que teoria mal explicada.",
  "Economista prevê tudo, menos o passado.",
  "O preço subiu tanto que pegou elevador VIP.",
  "Minha poupança está em estado vegetativo.",
  "O cartão de crédito me chama pelo primeiro nome.",
  "Meu dinheiro adora férias prolongadas.",
  "A planilha mentiu dizendo “vai dar certo”.",
  "Fui economizar energia e acendi uma vela premium.",
  "O cofrinho pediu recuperação judicial.",
  "Meu bolso está em recessão técnica.",
  "A promoção subiu de preço antes de começar.",
  "O mercado livre só o nome.",
  "Meu salário dura menos que notícia de internet.",
  "Tentei investir, o risco investiu em mim.",
  "O PIX virou mágica: some instantaneamente.",
  "Minha renda fixa só fixa problema.",
  "O banco sorriu. Fiquei preocupado.",
  "A inflação está tão alta que precisa de oxigênio.",
  "Meu extrato bancário parece filme de terror.",
  "O desconto veio tão pequeno que precisei de lupa.",
  "Minha meta financeira é sobreviver até sexta.",
  "O preço do café já vem acordado.",
  "A economia doméstica pediu terapia.",
  "Meu orçamento usa corda bamba.",
  "O dinheiro não traz felicidade, mas paga boleto triste.",
  "Promoção relâmpago: some antes de eu chegar.",
  "O troco virou espécie em extinção.",
  "Meu bolso está diversificado: vazio em várias moedas.",
  "A crise bateu aqui e entrou sem bater.",
  "O salário caiu na conta e tropeçou saindo.",
  "Meu planejamento financeiro é emocional.",
  "A inflação está correndo sem tênis.",
  "O banco oferece crédito como quem oferece sobremesa.",
  "Economizar comigo é esporte radical.",
  "Meu cartão conhece mais lugares que eu.",
  "O preço da gasolina já roda sozinho.",
  "Meu cofre cabe no bolso porque está vazio.",
  "O orçamento familiar virou ficção científica.",
  "Minha reserva de emergência está em emergência.",
  "O dinheiro some com disciplina admirável.",
  "O mercado chamou de ajuste, eu chamei de susto.",
  "O preço do tomate entrou na elite.",
  "Meu salário tem espírito aventureiro: desaparece cedo.",
  "A inflação nunca perde o timing.",
  "O banco me liga mais que meus amigos.",
  "Minha conta corrente está correndo de mim.",
  "O desconto era tão simbólico que parecia arte moderna.",
  "Tentei cortar gastos, eles cresceram ofendidos.",
  "Meu bolso faz eco em estéreo.",
  "A crise aqui já tem gaveta própria.",
  "Investi em paciência, rendeu espera.",
  "O preço subiu tanto que mandou cartão-postal.",
  "Meu dinheiro trabalha remoto: nunca aparece.",
  "A planilha travou de vergonha.",
  "Minha meta era poupar, a realidade riu.",
  "O banco aprovou limite e reprovou minha paz.",
  "A inflação é fitness: só sobe.",
  "Meu orçamento está enxuto demais: sumiu.",
  "O caixa eletrônico me conhece pelo drama.",
  "O salário passa por mim como cometa.",
  "Promoção boa é lenda urbana.",
  "Minha carteira entrou em modo avião.",
  "O preço do aluguel já cobra vista panorâmica.",
  "Meu bolso fez greve de fundos.",
  "O investimento prometeu lua e entregou poeira.",
  "A economia vai bem, só não disse de quem.",
  "Meu cartão parcelou até a ansiedade.",
  "O extrato bancário veio censurado.",
  "Minha renda variável varia para baixo.",
  "O dinheiro saiu para comprar cigarro e não voltou.",
  "O banco disse “sem tarifas”. Ri alto.",
  "Meu orçamento tem suspense semanal.",
  "O preço da carne agora vem com biografia.",
  "Minha poupança emagrece sem dieta.",
  "A crise é tão íntima que já chama pelo apelido.",
  "O salário caiu, quicou e sumiu.",
  "Meu cofrinho pediu vaquinha.",
  "A inflação coleciona recordes como atleta.",
  "O preço da cebola me fez chorar antes de cortar.",
  "Meu bolso virou área de preservação.",
  "O cartão quer relacionamento sério.",
  "O dinheiro anda sumido e nem manda mensagem.",
  "Minha meta financeira é não piorar.",
  "O banco chama de oportunidade, eu chamo de armadilha decorada.",
  "A promoção era metade do dobro.",
  "Meu salário é edição limitada.",
  "O preço subiu tanto que precisa declarar altitude.",
  "Minha carteira abriu e bocejou vazia.",
  "O orçamento doméstico já virou seriado longo.",
  "O troco agora vem em lembranças.",
  "A inflação entrou no elevador e apertou cobertura.",
  "Meu extrato bancário parece gráfico de filme desastre.",
  "Economizei tanto que quase encontrei dinheiro.",
  "O salário veio em formato teaser.",
  "Meu bolso está minimalista demais.",
  "O banco disse “confie”. Apertei a carteira.",
  "A única coisa estável na economia é meu espanto."
];
