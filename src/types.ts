export type WorkLogType = 'half_day' | 'full_day';

export interface WorkLog {
  id: number;
  date: string;
  type: WorkLogType;
  value: number;
}

export type PaymentMethod = 'Dinheiro' | 'Pix' | 'Cartão' | 'Débito' | 'Crédito';

export interface Expense {
  id: number;
  value: number;
  category: string;
  description?: string;
  date: string;
  paymentMethod: PaymentMethod | string;
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
  show_mock_banner?: boolean;
  notifications_enabled: boolean;
  notification_time: string; // HH:mm
}
