/**
 * Test coverage: Unit tests for encoding/decoding the guest favourites cookie value.
 */
import { describe, expect, it } from 'vitest';
import {
  decodeGuestFavouritesCookieValue,
  encodeGuestFavouritesCookieValue,
  GUEST_FAVOURITES_COOKIE_NAME,
} from '$lib/utils/guest-favourites';

describe('GUEST_FAVOURITES_COOKIE_NAME', () => {
  it('is a stable cookie name shared by client and server', () => {
    expect(GUEST_FAVOURITES_COOKIE_NAME).toBe('guest_favourites');
  });
});

describe('encodeGuestFavouritesCookieValue', () => {
  it('URI-encodes a comma-separated favourites value', () => {
    expect(encodeGuestFavouritesCookieValue('dataset-a,dataset-b')).toBe('dataset-a%2Cdataset-b');
  });

  it('encodes special characters that are unsafe in a cookie', () => {
    expect(encodeGuestFavouritesCookieValue('a b,c;d')).toBe(encodeURIComponent('a b,c;d'));
  });
});

describe('decodeGuestFavouritesCookieValue', () => {
  it('round-trips an encoded favourites value back to a normalized list', () => {
    const encoded = encodeGuestFavouritesCookieValue('dataset-a,dataset-b');
    expect(decodeGuestFavouritesCookieValue(encoded)).toEqual(['dataset-a', 'dataset-b']);
  });

  it('trims whitespace, drops empties, and dedupes', () => {
    const encoded = encodeGuestFavouritesCookieValue(' dataset-a , dataset-b ,, dataset-a');
    expect(decodeGuestFavouritesCookieValue(encoded)).toEqual(['dataset-a', 'dataset-b']);
  });

  it('returns an empty list for an empty cookie value', () => {
    expect(decodeGuestFavouritesCookieValue('')).toEqual([]);
  });

  it('falls back to the raw value when it is not URI-encoded', () => {
    // A literal "%" that is not part of a valid escape sequence throws in decodeURIComponent.
    expect(decodeGuestFavouritesCookieValue('dataset-a,50%off')).toEqual(['dataset-a', '50%off']);
  });
});
