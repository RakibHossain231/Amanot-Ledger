/**
 * Currency utility for Bangladeshi Taka (৳)
 */

// Convert English digits to Bengali digits
export const toBengaliDigits = (num) => {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (w) => bengaliDigits[+w]);
};

/**
 * Format monetary amount with ৳ symbol and thousand separators
 * @param {number|string} amount
 * @param {string} lang - 'bn' | 'en'
 * @param {boolean} showSign - whether to prepend + or - explicitly
 */
export const formatCurrency = (amount, lang = 'bn', showSign = false) => {
  const num = Number(amount) || 0;
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  // Formatted with commas: e.g. 15,000.00 or 15,000
  const formattedAbs = absNum.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  const localizedNum = lang === 'bn' ? toBengaliDigits(formattedAbs) : formattedAbs;

  if (num === 0) {
    return `৳${localizedNum}`;
  }

  if (isNegative) {
    return `-৳${localizedNum}`;
  }

  if (showSign) {
    return `+৳${localizedNum}`;
  }

  return `৳${localizedNum}`;
};
