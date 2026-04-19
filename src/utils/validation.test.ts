import { describe, it, expect } from 'vitest';
import {
  validatePassword,
  validateEmail,
  validatePhoneMaroc,
  sanitizeString,
  validateAmount,
  validateFutureDate,
  limitString,
  validateContactForm,
  detectSQLInjection,
  checkRateLimit,
  isSafeURL,
  encodeURLParams,
  maskSensitiveData,
  generateCSRFToken,
  validateBookingForm,
} from './validation';

// ─────────────────────────────────────────────
// validatePassword
// ─────────────────────────────────────────────
describe('validatePassword', () => {
  it('accepte un mot de passe fort', () => {
    const res = validatePassword('Ab1@secure');
    expect(res.isValid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('rejette un mot de passe trop court', () => {
    const res = validatePassword('Ab1@');
    expect(res.isValid).toBe(false);
    expect(res.errors).toContain('Le mot de passe doit contenir au moins 8 caractères');
  });

  it('rejette un mot de passe sans majuscule', () => {
    const res = validatePassword('ab1@secure');
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('majuscule'))).toBe(true);
  });

  it('rejette un mot de passe sans minuscule', () => {
    const res = validatePassword('AB1@SECURE');
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('minuscule'))).toBe(true);
  });

  it('rejette un mot de passe sans chiffre', () => {
    const res = validatePassword('Ab@secure');
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('chiffre'))).toBe(true);
  });

  it('rejette un mot de passe sans caractère spécial', () => {
    const res = validatePassword('Ab1secure');
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('spécial'))).toBe(true);
  });
});

// ─────────────────────────────────────────────
// validateEmail
// ─────────────────────────────────────────────
describe('validateEmail', () => {
  it('accepte un email valide', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('rejette un email sans @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('rejette un email sans domaine', () => {
    expect(validateEmail('user@')).toBe(false);
  });

  it('rejette une chaîne vide', () => {
    expect(validateEmail('')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// validatePhoneMaroc
// ─────────────────────────────────────────────
describe('validatePhoneMaroc', () => {
  it('accepte un numéro +212', () => {
    expect(validatePhoneMaroc('+212612345678')).toBe(true);
  });

  it('accepte un numéro commençant par 06', () => {
    expect(validatePhoneMaroc('0612345678')).toBe(true);
  });

  it('accepte un numéro avec espaces', () => {
    expect(validatePhoneMaroc('06 12 34 56 78')).toBe(true);
  });

  it('rejette un numéro trop court', () => {
    expect(validatePhoneMaroc('061234')).toBe(false);
  });

  it('rejette un numéro sans préfixe valide', () => {
    expect(validatePhoneMaroc('0912345678')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// sanitizeString
// ─────────────────────────────────────────────
describe('sanitizeString', () => {
  it('échappe les balises HTML', () => {
    expect(sanitizeString('<script>')).toBe('&lt;script&gt;');
  });

  it('échappe les guillemets doubles', () => {
    expect(sanitizeString('"test"')).toBe('&quot;test&quot;');
  });

  it('échappe les apostrophes', () => {
    expect(sanitizeString("it's")).toBe('it&#x27;s');
  });

  it('ne modifie pas une chaîne sûre', () => {
    expect(sanitizeString('Bonjour le monde')).toBe('Bonjour le monde');
  });
});

// ─────────────────────────────────────────────
// validateAmount
// ─────────────────────────────────────────────
describe('validateAmount', () => {
  it('accepte un montant valide', () => {
    expect(validateAmount(500)).toBe(true);
  });

  it('rejette zéro', () => {
    expect(validateAmount(0)).toBe(false);
  });

  it('rejette un montant négatif', () => {
    expect(validateAmount(-100)).toBe(false);
  });

  it('rejette un montant dépasse 1 000 000', () => {
    expect(validateAmount(1_000_001)).toBe(false);
  });

  it('rejette NaN', () => {
    expect(validateAmount(NaN)).toBe(false);
  });
});

// ─────────────────────────────────────────────
// validateFutureDate
// ─────────────────────────────────────────────
describe('validateFutureDate', () => {
  it('accepte la date du jour', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(validateFutureDate(today)).toBe(true);
  });

  it('accepte une date future', () => {
    const future = new Date(Date.now() + 7 * 86400 * 1000).toISOString().split('T')[0];
    expect(validateFutureDate(future)).toBe(true);
  });

  it('rejette une date passée', () => {
    expect(validateFutureDate('2020-01-01')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// limitString
// ─────────────────────────────────────────────
describe('limitString', () => {
  it('tronque les chaînes trop longues', () => {
    expect(limitString('abcdef', 3)).toBe('abc');
  });

  it('retourne la chaîne entière si elle est dans la limite', () => {
    expect(limitString('ab', 5)).toBe('ab');
  });
});

// ─────────────────────────────────────────────
// detectSQLInjection
// ─────────────────────────────────────────────
describe('detectSQLInjection', () => {
  it('détecte une injection SELECT', () => {
    expect(detectSQLInjection("'; SELECT * FROM users --")).toBe(true);
  });

  it('détecte un DROP TABLE', () => {
    expect(detectSQLInjection('DROP TABLE users')).toBe(true);
  });

  it('ne détecte rien dans un texte normal', () => {
    expect(detectSQLInjection('Bonjour, je voudrais réserver.')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// checkRateLimit
// ─────────────────────────────────────────────
describe('checkRateLimit', () => {
  it('autorise les premières tentatives', () => {
    const key = `rl-test-${Date.now()}`;
    expect(checkRateLimit(key, 3, 60000)).toBe(true);
    expect(checkRateLimit(key, 3, 60000)).toBe(true);
    expect(checkRateLimit(key, 3, 60000)).toBe(true);
  });

  it('bloque après le maximum de tentatives', () => {
    const key = `rl-block-${Date.now()}`;
    checkRateLimit(key, 2, 60000);
    checkRateLimit(key, 2, 60000);
    expect(checkRateLimit(key, 2, 60000)).toBe(false);
  });
});

// ─────────────────────────────────────────────
// isSafeURL
// ─────────────────────────────────────────────
describe('isSafeURL', () => {
  it('autorise https://', () => {
    expect(isSafeURL('https://marocsoleil.ma')).toBe(true);
  });

  it('bloque javascript:', () => {
    expect(isSafeURL('javascript:alert(1)')).toBe(false);
  });

  it('bloque data:', () => {
    expect(isSafeURL('data:text/html,<h1>x</h1>')).toBe(false);
  });
});

// ─────────────────────────────────────────────
// encodeURLParams
// ─────────────────────────────────────────────
describe('encodeURLParams', () => {
  it('encode les paramètres correctement', () => {
    const result = encodeURLParams({ page: 1, q: 'marrakech holiday' });
    expect(result).toBe('page=1&q=marrakech%20holiday');
  });
});

// ─────────────────────────────────────────────
// maskSensitiveData
// ─────────────────────────────────────────────
describe('maskSensitiveData', () => {
  it('masque les mots de passe', () => {
    const result = maskSensitiveData({ username: 'ali', password: 'secret123' });
    expect(result.password).toBe('***MASKED***');
    expect(result.username).toBe('ali');
  });

  it('masque les tokens', () => {
    const result = maskSensitiveData({ auth_token: 'abc123' });
    expect(result.auth_token).toBe('***MASKED***');
  });
});

// ─────────────────────────────────────────────
// generateCSRFToken
// ─────────────────────────────────────────────
describe('generateCSRFToken', () => {
  it('génère un token non vide', () => {
    const token = generateCSRFToken();
    expect(token.length).toBeGreaterThan(0);
  });

  it('génère des tokens uniques', () => {
    const t1 = generateCSRFToken();
    const t2 = generateCSRFToken();
    expect(t1).not.toBe(t2);
  });
});

// ─────────────────────────────────────────────
// validateContactForm
// ─────────────────────────────────────────────
describe('validateContactForm', () => {
  const validData = {
    name: 'Ali Benali',
    email: 'ali@example.com',
    message: 'Je voudrais avoir des informations sur vos services touristiques.',
  };

  it('valide un formulaire correct', () => {
    expect(validateContactForm(validData).isValid).toBe(true);
  });

  it('rejette un nom trop court', () => {
    const res = validateContactForm({ ...validData, name: 'A' });
    expect(res.isValid).toBe(false);
  });

  it('rejette un email invalide', () => {
    const res = validateContactForm({ ...validData, email: 'invalid' });
    expect(res.isValid).toBe(false);
  });

  it('rejette un message trop court', () => {
    const res = validateContactForm({ ...validData, message: 'Bonjour' });
    expect(res.isValid).toBe(false);
  });

  it('rejette un message dépassant 1000 caractères', () => {
    const res = validateContactForm({ ...validData, message: 'a'.repeat(1001) });
    expect(res.isValid).toBe(false);
  });

  it('rejette un contenu suspect (SQL injection)', () => {
    const res = validateContactForm({ ...validData, message: "'; DROP TABLE messages; --" });
    expect(res.isValid).toBe(false);
  });
});

// ─────────────────────────────────────────────
// validateBookingForm
// ─────────────────────────────────────────────
describe('validateBookingForm', () => {
  const tomorrow = new Date(Date.now() + 86400 * 1000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 2 * 86400 * 1000).toISOString().split('T')[0];

  const validData = {
    startDate: tomorrow,
    endDate: dayAfter,
    guests: 2,
    fullName: 'Fatima Zahra',
    email: 'fatima@example.com',
    phone: '0612345678',
  };

  it('valide un formulaire de réservation correct', () => {
    expect(validateBookingForm(validData).isValid).toBe(true);
  });

  it('rejette si startDate manquante', () => {
    const res = validateBookingForm({ ...validData, startDate: '' });
    expect(res.isValid).toBe(false);
    expect(res.errors.startDate).toBeDefined();
  });

  it('rejette si endDate <= startDate', () => {
    const res = validateBookingForm({ ...validData, endDate: tomorrow });
    expect(res.isValid).toBe(false);
    expect(res.errors.endDate).toBeDefined();
  });

  it('rejette 0 personnes', () => {
    const res = validateBookingForm({ ...validData, guests: 0 });
    expect(res.isValid).toBe(false);
    expect(res.errors.guests).toBeDefined();
  });

  it('rejette plus de 20 personnes', () => {
    const res = validateBookingForm({ ...validData, guests: 21 });
    expect(res.isValid).toBe(false);
  });

  it('rejette un numéro de téléphone invalide', () => {
    const res = validateBookingForm({ ...validData, phone: '0812345678' });
    expect(res.isValid).toBe(false);
    expect(res.errors.phone).toBeDefined();
  });
});
