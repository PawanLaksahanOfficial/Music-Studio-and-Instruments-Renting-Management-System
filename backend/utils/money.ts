/** Rounds a currency amount to 2 decimal places, avoiding binary floating point drift. */
export const roundMoney = (amount: number): number => Math.round((amount + Number.EPSILON) * 100) / 100;

export const sumMoney = (amounts: number[]): number => roundMoney(amounts.reduce((sum, a) => sum + a, 0));
