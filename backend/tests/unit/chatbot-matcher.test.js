/**
 * Chatbot Matcher — Jest unit tests (pure, no DB, no LLM).
 */

const {
  matchQuery,
  KNOWLEDGE_BASE,
  scoreEntry
} = require('../../src/utils/chatbotMatcher');

describe('matchQuery', () => {
  test('matches GSTR-1 questions', () => {
    const r = matchQuery('What is GSTR-1?');
    expect(r.matched).toBe(true);
    expect(r.matchedId).toBe('gstr1');
    expect(r.answer).toMatch(/outward supplies/i);
  });

  test('matches e-way bill threshold questions', () => {
    const r = matchQuery('when is an e-way bill required?');
    expect(r.matched).toBe(true);
    expect(r.matchedId).toBe('eway');
    expect(r.answer).toMatch(/50,000/);
  });

  test('matches ITC questions', () => {
    const r = matchQuery('explain input tax credit');
    expect(r.matched).toBe(true);
    expect(r.matchedId).toBe('itc');
  });

  test('returns matched:false with suggestions for unknown questions', () => {
    const r = matchQuery('what is the weather today');
    expect(r.matched).toBe(false);
    expect(Array.isArray(r.suggestions)).toBe(true);
    expect(r.suggestions.length).toBeGreaterThan(0);
  });

  test('always returns suggestions array', () => {
    expect(Array.isArray(matchQuery('gstr-3b due date').suggestions)).toBe(true);
  });
});

describe('scoreEntry', () => {
  test('scores keyword overlap', () => {
    const entry = KNOWLEDGE_BASE.find((e) => e.id === 'composition');
    expect(scoreEntry('tell me about the composition scheme', entry)).toBeGreaterThan(0);
    expect(scoreEntry('nothing relevant here', entry)).toBe(0);
  });
});
