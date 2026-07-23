const { checkURLSafety, BLOCKED_DOMAINS } = require('./validationService');

describe('validationService.checkURLSafety', () => {
  test('detecte un pattern suspect', () => {
    const res = checkURLSafety('http://example.com/paypal/verify');
    expect(res.isSafe).toBe(false);
    expect(res.isPhishing).toBe(true);
    expect(res.reason).toMatch(/Suspicious phishing pattern/i);
  });

  test('rejette un domaine bloqué', () => {
    const blocked = BLOCKED_DOMAINS[0];
    const res = checkURLSafety(`http://${blocked}/foo`);
    expect(res.isSafe).toBe(false);
    expect(res.reason).toMatch(/Blocked domain/i);
  });

  test('rejette un TLD suspect', () => {
    const res = checkURLSafety('http://example.tk/some');
    expect(res.isSafe).toBe(false);
    expect(res.reason).toMatch(/Suspicious top-level domain/i);
  });

  test('rejette une URL invalide', () => {
    const res = checkURLSafety('not-a-url');
    expect(res.isSafe).toBe(false);
    expect(res.reason).toMatch(/Invalid URL hostname/i);
  });

  test('accepte une URL propre', () => {
    const res = checkURLSafety('https://example.com/path');
    expect(res.isSafe).toBe(true);
    expect(res.isPhishing).toBe(false);
  });
});
