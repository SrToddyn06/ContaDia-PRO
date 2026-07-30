/**
 * Rounds a number to 2 decimal places to avoid floating point precision issues.
 */
export const roundMoney = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

/**
 * Formats a number as Brazilian Real (BRL).
 */
export const formatMoney = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
