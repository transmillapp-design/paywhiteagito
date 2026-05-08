/**
 * Helper functions for balance calculations
 * Ensures consistent balance display across the entire application
 */

/**
 * Calculate total BRL balance (balance + cashback)
 * @param {Object} user - User object containing balance and cashback_balance
 * @returns {number} Total BRL balance
 */
export const getTotalBRLBalance = (user) => {
  if (!user) return 0;
  const balance = parseFloat(user.balance) || 0;
  const cashback = parseFloat(user.cashback_balance) || 0;
  return balance + cashback;
};

/**
 * Get USDT balance
 * @param {Object} user - User object containing usdt_balance
 * @returns {number} USDT balance
 */
export const getUSDTBalance = (user) => {
  if (!user) return 0;
  return parseFloat(user.usdt_balance) || 0;
};

/**
 * Format balance for display
 * @param {number} value - Balance value
 * @param {string} currency - Currency type ('BRL' or 'USDT')
 * @returns {string} Formatted balance string
 */
export const formatBalance = (value, currency = 'BRL') => {
  if (currency === 'BRL') {
    return `R$ ${value.toFixed(2)}`;
  } else if (currency === 'USDT') {
    return `${value.toFixed(6)} USDT`;
  }
  return value.toString();
};

/**
 * Get balance breakdown for display
 * @param {Object} user - User object
 * @returns {Object} Balance breakdown
 */
export const getBalanceBreakdown = (user) => {
  if (!user) {
    return {
      totalBRL: 0,
      balance: 0,
      cashback: 0,
      usdt: 0
    };
  }
  
  const balance = parseFloat(user.balance) || 0;
  const cashback = parseFloat(user.cashback_balance) || 0;
  const usdt = parseFloat(user.usdt_balance) || 0;
  
  return {
    totalBRL: balance + cashback,
    balance,
    cashback,
    usdt
  };
};
