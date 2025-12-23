
import { RentalSystem } from '../types';

/**
 * Logic:
 * Weekly: 
 * - Calculate total days from start to now.
 * - Units = totalDays / 7
 * - Remaining = totalDays % 7
 * - If Remaining > 2 days, add 1 whole week.
 * - Minimum 1 unit.
 * 
 * Monthly:
 * - Calculate total days.
 * - Units = totalDays / 30
 * - Remaining = totalDays % 30
 * - If Remaining > 5 days, add 1 whole month.
 * - Minimum 1 unit.
 */
export const calculateRentalUnits = (startDate: Date, endDate: Date, system: RentalSystem): number => {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (system === 'weekly') {
    const fullWeeks = Math.floor(diffDays / 7);
    const extraDays = diffDays % 7;
    let units = fullWeeks;
    if (extraDays > 2 || fullWeeks === 0) {
      units += 1;
    }
    return units;
  } else {
    const fullMonths = Math.floor(diffDays / 30);
    const extraDays = diffDays % 30;
    let units = fullMonths;
    if (extraDays > 5 || fullMonths === 0) {
      units += 1;
    }
    return units;
  }
};

export const getCurrencySymbol = (currency: string) => {
  return currency === 'SAR' ? 'ر.س' : 'ج.م';
};

export const formatCurrency = (amount: number, currency: string) => {
  // Use Math.round to ensure no decimals are shown and values are integer-consistent
  const roundedAmount = Math.round(amount);
  return `${roundedAmount.toLocaleString('ar-EG', { maximumFractionDigits: 0 })} ${getCurrencySymbol(currency)}`;
};
