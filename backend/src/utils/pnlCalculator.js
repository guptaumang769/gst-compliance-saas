/**
 * Profit & Loss / Financials Calculator (pure, DB-free)
 *
 * Pure aggregation math for the simplified P&L used by financialsService.
 * Revenue is the sum of invoice taxable amounts; purchases/COGS is the sum of
 * purchase taxable amounts. Kept DB-free so it can be unit-tested.
 */

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function sumField(rows, field) {
  return (rows || []).reduce((acc, r) => acc + Number(r[field] || 0), 0);
}

/**
 * Compute a simplified P&L.
 *
 * @param {Object} params
 * @param {Array<Object>} params.invoices - each with taxableAmount
 * @param {Array<Object>} params.purchases - each with taxableAmount
 * @param {Array<Object>} [params.otherExpenses] - each with { label, amount }
 * @returns {Object} { revenue, cogs, expenses, grossProfit, netProfit, margin, rows }
 */
function computePnl({ invoices = [], purchases = [], otherExpenses = [] } = {}) {
  const revenue = round2(sumField(invoices, 'taxableAmount'));
  const cogs = round2(sumField(purchases, 'taxableAmount'));
  const expenses = round2(sumField(otherExpenses, 'amount'));

  const grossProfit = round2(revenue - cogs);
  // Contract: netProfit = revenue - purchases (COGS). Other expenses are shown
  // as additional rows but the headline netProfit follows the contract.
  const netProfit = round2(revenue - cogs - expenses);

  // Guard divide-by-zero when computing margin.
  const margin = revenue > 0 ? round2((netProfit / revenue) * 100) : 0;

  const rows = [
    { label: 'Revenue (Sales)', amount: revenue },
    { label: 'Cost of Goods / Purchases', amount: cogs },
    { label: 'Gross Profit', amount: grossProfit }
  ];
  for (const e of otherExpenses) {
    rows.push({ label: e.label || 'Expense', amount: round2(Number(e.amount || 0)) });
  }
  rows.push({ label: 'Net Profit', amount: netProfit });

  return {
    revenue,
    cogs,
    expenses,
    grossProfit,
    netProfit,
    margin,
    rows
  };
}

/**
 * Compute a simplified balance sheet from precomputed aggregates.
 * Pure — the caller supplies the summed values.
 *
 * @param {Object} params
 * @param {number} params.receivables - unpaid invoice totals
 * @param {number} params.payables - unpaid purchase totals
 * @param {number} params.inventoryValue
 * @param {number} params.taxPayable
 * @param {number} [params.cash=0]
 * @returns {Object}
 */
function computeBalanceSheet({ receivables = 0, payables = 0, inventoryValue = 0, taxPayable = 0, cash = 0 } = {}) {
  const assets = {
    receivables: round2(receivables),
    inventoryValue: round2(inventoryValue),
    cash: round2(cash)
  };
  const liabilities = {
    payables: round2(payables),
    taxPayable: round2(taxPayable)
  };
  const totalAssets = round2(assets.receivables + assets.inventoryValue + assets.cash);
  const totalLiabilities = round2(liabilities.payables + liabilities.taxPayable);
  const equity = round2(totalAssets - totalLiabilities);

  return { assets, liabilities, totalAssets, totalLiabilities, equity };
}

module.exports = {
  computePnl,
  computeBalanceSheet,
  round2,
  sumField
};
