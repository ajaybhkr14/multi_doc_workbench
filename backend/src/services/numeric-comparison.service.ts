import type { ExtractedFact } from '../types/document';

export interface MoneyValue {
  amount: number;
  currency: string;
  period: 'monthly' | 'annual' | 'unspecified';
}

export function parseMoney(fact: ExtractedFact, context: ExtractedFact[]): MoneyValue | null {
  const match = fact.value.trim().match(/^(?:(INR|Rs\.?|₹|USD|\$|EUR|€)\s*)?(-?\d[\d,]*(?:\.\d{1,2})?)\s*(lakhs?|lacs?|crores?|million|billion|thousand)?\s*(INR|USD|EUR)?\s*(?:(?:per|\/|p\.?\s*)\s*(month|mo|m|year|annum|a)|monthly|annually|yearly)?\.?$/i);
  if (!match) return null;
  if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d{1,2})?$/.test(match[2])) return null;
  const unit = match[3]?.toLowerCase() || '';
  const multiplier = /lakh|lac/.test(unit) ? 100_000 : /crore/.test(unit) ? 10_000_000
    : unit === 'million' ? 1_000_000 : unit === 'billion' ? 1_000_000_000 : unit === 'thousand' ? 1000 : 1;
  const amount = Number(match[2].replace(/,/g, '')) * multiplier;
  if (!Number.isFinite(amount) || !Number.isSafeInteger(Math.round(amount * 100))) return null;
  const raw = (match[1] || match[4] || context.find((item) => item.field === 'currency')?.value || 'UNSPECIFIED').toUpperCase();
  const currency = /^(RS\.?|₹|INR)$/.test(raw) ? 'INR' : /^(USD|\$)$/.test(raw) ? 'USD' : /^(EUR|€)$/.test(raw) ? 'EUR' : raw;
  const periodText = `${fact.sourceLabel} ${fact.value}`.toLowerCase();
  const period = /annual|year|annum|\bp\.?a\b/.test(periodText) ? 'annual'
    : /month|\bmo\b|\bp\.?m\b/.test(periodText) ? 'monthly' : 'unspecified';
  return { amount, currency, period };
}

export function calculateDifference(left: MoneyValue, right: MoneyValue) {
  // Use rounded minor units. Never ask an AI model to calculate differences.
  const normalizeToMonthly = left.period !== right.period && left.period !== 'unspecified' && right.period !== 'unspecified';
  const leftMinor = Math.round(left.amount * 100 / (normalizeToMonthly && left.period === 'annual' ? 12 : 1));
  const rightMinor = Math.round(right.amount * 100 / (normalizeToMonthly && right.period === 'annual' ? 12 : 1));
  const difference = (leftMinor - rightMinor) / 100;
  return {
    leftValue: leftMinor / 100, rightValue: rightMinor / 100, difference, absoluteDifference: Math.abs(difference),
    percentageDifference: rightMinor === 0 ? null : Math.round((leftMinor - rightMinor) / Math.abs(rightMinor) * 10_000) / 100,
    currency: left.currency, period: normalizeToMonthly ? 'monthly' : left.period,
  };
}
