/**
 * Insights Service (Phase 3: Insights) — rules-based, no LLM.
 *
 * Derives actionable insights from the business's data. Each rule is guarded so
 * a single failing query never breaks the endpoint: getInsights always resolves
 * to an array (possibly empty) and never throws.
 */

const prisma = require('../config/database');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysUntil(target, now = new Date()) {
  return Math.ceil((target.getTime() - now.getTime()) / MS_PER_DAY);
}

function periodLabel(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Filing due-date insights: GSTR-1 by 11th, GSTR-3B by 20th of the month after
 * the return period (the most recently completed month).
 */
function buildFilingDueInsights(now) {
  const insights = [];

  // The period being filed is the previous month.
  const periodMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const period = periodLabel(periodMonth);

  const gstr1Due = new Date(now.getFullYear(), now.getMonth(), 11);
  const gstr3bDue = new Date(now.getFullYear(), now.getMonth(), 20);

  const forReturn = (returnType, dueDate) => {
    const d = daysUntil(dueDate, now);
    let severity = 'info';
    let when;
    if (d < 0) {
      severity = 'critical';
      when = `was due ${Math.abs(d)} day(s) ago`;
    } else if (d <= 3) {
      severity = 'warning';
      when = d === 0 ? 'is due today' : `is due in ${d} day(s)`;
    } else {
      when = `is due in ${d} day(s)`;
    }
    return {
      id: `filing-${returnType.toLowerCase()}-${period}`,
      severity,
      category: 'compliance',
      title: `${returnType} for ${period}`,
      message: `${returnType} filing for ${period} ${when} (due ${dueDate.toISOString().slice(0, 10)}).`
    };
  };

  insights.push(forReturn('GSTR-1', gstr1Due));
  insights.push(forReturn('GSTR-3B', gstr3bDue));
  return insights;
}

/**
 * Get all insights for a business. Never throws.
 */
async function getInsights(businessId) {
  const now = new Date();
  const insights = [];

  // 1) Filing due dates (pure, always available).
  try {
    insights.push(...buildFilingDueInsights(now));
  } catch (e) {
    // ignore
  }

  // 2) Overdue / unpaid purchases (unpaid & older than 30 days).
  try {
    const cutoff = new Date(now.getTime() - 30 * MS_PER_DAY);
    const overdue = await prisma.purchase.count({
      where: { businessId, isActive: true, isPaid: false, supplierInvoiceDate: { lte: cutoff } }
    });
    if (overdue > 0) {
      insights.push({
        id: 'purchases-overdue',
        severity: 'warning',
        category: 'payables',
        title: 'Overdue supplier payments',
        message: `You have ${overdue} unpaid purchase bill(s) older than 30 days. Consider clearing them to maintain supplier relationships and ITC eligibility.`
      });
    }
  } catch (e) {
    // ignore
  }

  // 3) Low-stock products.
  try {
    const products = await prisma.product.findMany({
      where: { businessId, isActive: true },
      select: { id: true, name: true, stockQty: true, reorderLevel: true }
    });
    const low = products.filter((p) => Number(p.reorderLevel) > 0 && Number(p.stockQty) <= Number(p.reorderLevel));
    if (low.length > 0) {
      const names = low.slice(0, 3).map((p) => p.name).join(', ');
      insights.push({
        id: 'inventory-low-stock',
        severity: 'warning',
        category: 'inventory',
        title: 'Low stock alert',
        message: `${low.length} product(s) are at or below their reorder level${names ? `: ${names}${low.length > 3 ? '…' : ''}` : ''}. Consider restocking.`
      });
    }
  } catch (e) {
    // ignore
  }

  // 4) Month-over-month GST liability change (output tax).
  try {
    const startCurrent = new Date(now.getFullYear(), now.getMonth(), 1);
    const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [current, previous] = await Promise.all([
      prisma.invoice.aggregate({
        where: { businessId, isActive: true, invoiceDate: { gte: startCurrent } },
        _sum: { totalTaxAmount: true }
      }),
      prisma.invoice.aggregate({
        where: { businessId, isActive: true, invoiceDate: { gte: startPrev, lt: startCurrent } },
        _sum: { totalTaxAmount: true }
      })
    ]);

    const cur = Number(current._sum.totalTaxAmount || 0);
    const prev = Number(previous._sum.totalTaxAmount || 0);
    if (prev > 0) {
      const changePct = Math.round(((cur - prev) / prev) * 100);
      if (Math.abs(changePct) >= 20) {
        insights.push({
          id: 'gst-liability-change',
          severity: changePct > 0 ? 'info' : 'info',
          category: 'tax',
          title: 'GST liability trend',
          message: `Your output GST this month is ${changePct > 0 ? 'up' : 'down'} ${Math.abs(changePct)}% vs last month (₹${cur.toFixed(2)} vs ₹${prev.toFixed(2)}).`
        });
      }
    }
  } catch (e) {
    // ignore
  }

  // 5) Unmatched GSTR-2A/2B reconciliation entries.
  try {
    const unmatched = await prisma.gSTR2Reconciliation.count({
      where: { businessId, reconciliationStatus: { in: ['pending', 'unmatched', 'mismatched'] } }
    });
    if (unmatched > 0) {
      insights.push({
        id: 'gstr2-unmatched',
        severity: 'warning',
        category: 'reconciliation',
        title: 'Unreconciled GSTR-2A/2B entries',
        message: `${unmatched} supplier invoice(s) from GSTR-2A/2B are not yet reconciled with your purchase records. Reconcile to claim accurate ITC.`
      });
    }
  } catch (e) {
    // ignore
  }

  return { success: true, insights };
}

module.exports = {
  getInsights,
  buildFilingDueInsights
};
