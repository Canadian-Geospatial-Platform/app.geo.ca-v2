/**
 * Test coverage: Unit tests for app-language normalization and path-based language detection.
 */
import { describe, expect, it } from 'vitest';
import { getAppLanguage, getLangFromPath, isAppLanguage, isFrench, pickByLanguage } from '$lib/utils/language';

describe('getAppLanguage', () => {
  it('normalizes short codes to full app codes', () => {
    expect(getAppLanguage('en')).toBe('en-ca');
    expect(getAppLanguage('fr')).toBe('fr-ca');
  });

  it('accepts full app codes case-insensitively', () => {
    expect(getAppLanguage('EN-CA')).toBe('en-ca');
    expect(getAppLanguage('Fr-Ca')).toBe('fr-ca');
  });

  it('falls back to en-ca for missing or unsupported input', () => {
    expect(getAppLanguage(null)).toBe('en-ca');
    expect(getAppLanguage(undefined)).toBe('en-ca');
    expect(getAppLanguage('')).toBe('en-ca');
    expect(getAppLanguage('de-de')).toBe('en-ca');
  });
});

describe('isAppLanguage', () => {
  it('accepts only the two supported app language codes', () => {
    expect(isAppLanguage('en-ca')).toBe(true);
    expect(isAppLanguage('fr-ca')).toBe(true);
  });

  it('rejects missing values and unsupported codes', () => {
    expect(isAppLanguage(null)).toBe(false);
    expect(isAppLanguage(undefined)).toBe(false);
    expect(isAppLanguage('')).toBe(false);
    expect(isAppLanguage('en')).toBe(false);
  });
});

describe('isFrench', () => {
  it('is true only for fr-ca', () => {
    expect(isFrench('fr-ca')).toBe(true);
    expect(isFrench('en-ca')).toBe(false);
  });
});

describe('pickByLanguage', () => {
  it('picks the French value for fr-ca and the English value otherwise', () => {
    expect(pickByLanguage('fr-ca', 'Sign in', 'Se connecter')).toBe('Se connecter');
    expect(pickByLanguage('en-ca', 'Sign in', 'Se connecter')).toBe('Sign in');
  });
});

describe('getLangFromPath', () => {
  it('extracts the language segment from a relative path', () => {
    expect(getLangFromPath('/fr-ca/map-browser')).toBe('fr-ca');
    expect(getLangFromPath('/en-ca/favourites')).toBe('en-ca');
  });

  it('extracts the language segment from an absolute URL', () => {
    expect(getLangFromPath('https://example.test/fr-ca/map-browser?x=1')).toBe('fr-ca');
  });

  it('falls back to en-ca when no language segment is present', () => {
    expect(getLangFromPath('/map-browser')).toBe('en-ca');
    expect(getLangFromPath('https://example.test/map-browser')).toBe('en-ca');
  });

  it('falls back to en-ca for missing input', () => {
    expect(getLangFromPath(null)).toBe('en-ca');
    expect(getLangFromPath(undefined)).toBe('en-ca');
    expect(getLangFromPath('')).toBe('en-ca');
  });
});
