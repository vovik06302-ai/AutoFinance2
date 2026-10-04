export function formatCurrency(val: number): string {
  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0
  }).format(Math.round(val || 0));
  return `${formatted} ₽`;
}

export const MONTH_NAMES_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь'
];
