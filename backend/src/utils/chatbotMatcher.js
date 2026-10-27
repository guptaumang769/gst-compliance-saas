/**
 * Chatbot FAQ Matcher (pure, DB-free, no LLM)
 *
 * A tiny rules/keyword based matcher over an in-file GST knowledge base.
 * Matches a user message to the best FAQ entry by keyword overlap. Kept
 * DB-free so the matching behaviour is unit-testable.
 */

/**
 * In-file knowledge base. Each entry has keywords and an answer.
 */
const KNOWLEDGE_BASE = [
  {
    id: 'gstr1',
    keywords: ['gstr-1', 'gstr1', 'gstr 1', 'outward', 'sales return'],
    answer:
      'GSTR-1 is the monthly/quarterly return of outward supplies (sales). It must be filed by the 11th of the following month for monthly filers (or by the 13th for QRMP quarterly filers).'
  },
  {
    id: 'gstr3b',
    keywords: ['gstr-3b', 'gstr3b', 'gstr 3b', 'summary return', '3b'],
    answer:
      'GSTR-3B is a monthly self-declared summary return of inward and outward supplies along with tax payment. It is normally due by the 20th of the following month.'
  },
  {
    id: 'due-dates',
    keywords: ['due date', 'due dates', 'deadline', 'last date', 'filing date'],
    answer:
      'Key GST due dates: GSTR-1 by the 11th of the next month, and GSTR-3B by the 20th of the next month (for monthly filers).'
  },
  {
    id: 'itc',
    keywords: ['itc', 'input tax credit', 'input credit', 'claim credit'],
    answer:
      'Input Tax Credit (ITC) lets you reduce the tax you pay on sales by the GST already paid on eligible business purchases. ITC can be claimed only if the supplier has reported the invoice and it reflects in your GSTR-2B.'
  },
  {
    id: 'eway',
    keywords: ['e-way', 'eway', 'e way bill', 'ewaybill', 'transport', 'goods movement'],
    answer:
      'An E-Way Bill is required for the movement of goods worth more than Rs. 50,000. Its validity depends on distance: 1 day per 200 km (minimum 1 day).'
  },
  {
    id: 'einvoice',
    keywords: ['e-invoice', 'einvoice', 'e invoice', 'irn', 'irp'],
    answer:
      'E-Invoicing requires reporting B2B invoices to the Invoice Registration Portal (IRP) to obtain an IRN and signed QR code. It is mandatory for businesses whose aggregate turnover exceeds Rs. 5 crore.'
  },
  {
    id: 'composition',
    keywords: ['composition', 'composition scheme', 'small taxpayer', 'quarterly tax'],
    answer:
      'The Composition Scheme lets small taxpayers (turnover up to Rs. 1.5 crore) pay GST at a low flat rate on turnover and file a simple quarterly statement (CMP-08), but they cannot claim ITC or charge GST separately.'
  },
  {
    id: 'reverse-charge',
    keywords: ['reverse charge', 'rcm', 'reverse-charge'],
    answer:
      'Under Reverse Charge Mechanism (RCM), the recipient of goods/services pays GST directly to the government instead of the supplier. It applies to specified supplies and to certain purchases from unregistered dealers.'
  },
  {
    id: 'hsn',
    keywords: ['hsn', 'sac', 'hsn code', 'sac code', 'classification'],
    answer:
      'HSN (goods) and SAC (services) codes classify what you sell so the correct GST rate applies. The number of HSN digits you must report depends on your turnover.'
  }
];

const DEFAULT_SUGGESTIONS = [
  'What is GSTR-1?',
  'What is the due date for GSTR-3B?',
  'What is Input Tax Credit (ITC)?',
  'When is an e-way bill required?',
  'What is the e-invoice threshold?'
];

/**
 * Tokenise a message into lowercase word tokens.
 */
function tokenize(message) {
  return String(message || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Score a knowledge-base entry against a message by keyword overlap.
 * A keyword phrase present as a substring of the message counts as a hit.
 */
function scoreEntry(message, entry) {
  const lower = String(message || '').toLowerCase();
  const tokens = new Set(tokenize(message));
  let score = 0;
  for (const kw of entry.keywords) {
    const k = kw.toLowerCase();
    if (k.includes(' ') || k.includes('-')) {
      // multi-word / hyphenated phrase: substring match
      if (lower.includes(k)) score += 2;
    } else if (tokens.has(k)) {
      score += 1;
    }
  }
  return score;
}

/**
 * Match a message to the best FAQ entry.
 *
 * @param {string} message
 * @param {Array<Object>} [kb=KNOWLEDGE_BASE]
 * @returns {Object} { answer, matched, matchedId, suggestions }
 */
function matchQuery(message, kb = KNOWLEDGE_BASE) {
  let best = null;
  let bestScore = 0;

  for (const entry of kb) {
    const score = scoreEntry(message, entry);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (best && bestScore > 0) {
    return {
      answer: best.answer,
      matched: true,
      matchedId: best.id,
      suggestions: DEFAULT_SUGGESTIONS
    };
  }

  return {
    answer:
      "I couldn't find an exact answer to that. I can help with GST topics like GSTR-1, GSTR-3B, due dates, Input Tax Credit (ITC), e-way bills, e-invoicing, the composition scheme and reverse charge. Try rephrasing your question.",
    matched: false,
    matchedId: null,
    suggestions: DEFAULT_SUGGESTIONS
  };
}

module.exports = {
  KNOWLEDGE_BASE,
  DEFAULT_SUGGESTIONS,
  matchQuery,
  tokenize,
  scoreEntry
};
