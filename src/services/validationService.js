const BLOCKED_DOMAINS = [
  'malicious-site.com',
  'phishing-test.com',
];

const SUSPICIOUS_PATTERNS = [
  /paypal.*verify/i,
  /amazon.*account.*suspend/i,
  /banking.*login/i,
];

const SUSPICIOUS_TLDS = ['.tk', '.ga', '.ml'];

function checkURLSafety(url) {
  if (hasSuspiciousPattern(url)) {
    return {
      isSafe: false,
      isPhishing: true,
      reason: 'Suspicious phishing pattern detected',
    };
  }

  const hostname = getHostname(url);

  if (!hostname) {
    return {
      isSafe: false,
      isPhishing: true,
      reason: 'Invalid URL hostname',
    };
  }

  if (isDomainBlocked(hostname)) {
    return {
      isSafe: false,
      isPhishing: true,
      reason: 'Blocked domain',
    };
  }

  if (hasSuspiciousTld(hostname)) {
    return {
      isSafe: false,
      isPhishing: true,
      reason: 'Suspicious top-level domain',
    };
  }

  return {
    isSafe: true,
    isPhishing: false,
  };
}

function hasSuspiciousPattern(url) {
  return SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(url));
}

function getHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (error) {
    return null;
  }
}

function isDomainBlocked(hostname) {
  return BLOCKED_DOMAINS.some((blockedDomain) => {
    return hostname === blockedDomain || hostname.endsWith(`.${blockedDomain}`);
  });
}

function hasSuspiciousTld(hostname) {
  return SUSPICIOUS_TLDS.some((tld) => hostname.endsWith(tld));
}

module.exports = {
  BLOCKED_DOMAINS,
  checkURLSafety,
};
