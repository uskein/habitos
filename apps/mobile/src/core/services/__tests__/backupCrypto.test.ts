import { AppError } from '@habitos/shared';
import {
  base64ToBytes,
  bytesToBase64,
  decryptJson,
  encryptJson,
} from '../backupCrypto';

describe('backupCrypto — roundtrip (HU-28)', () => {
  const payload = {
    version: 1,
    exportedAt: '2026-10-10T12:00:00.000Z',
    items: [1, 2, 3],
    nested: { emoji: '🚀', text: 'Ñandú' },
  };

  test('cifra y descifra con la misma contraseña', () => {
    const bytes = encryptJson(payload, 'secreta-123');
    expect(decryptJson(bytes, 'secreta-123')).toEqual(payload);
  });

  test('el binario no contiene el texto en claro', () => {
    const bytes = encryptJson(payload, 'secreta-123');
    const asText = Array.from(bytes.subarray(0, 400))
      .map((b) => String.fromCharCode(b))
      .join('');
    expect(asText).not.toContain('Ñandú');
    expect(asText).toContain('HABITOSBK1'); // magic legible
  });

  test('contraseña incorrecta → BACKUP_PASSWORD_INVALID', () => {
    const bytes = encryptJson(payload, 'correcta');
    try {
      decryptJson(bytes, 'otra');
      fail('debió lanzar');
    } catch (e) {
      expect(e).toBeInstanceOf(AppError);
      expect((e as AppError).code).toBe('BACKUP_PASSWORD_INVALID');
    }
  });

  test('header inválido → BACKUP_CORRUPT', () => {
    try {
      decryptJson(new Uint8Array(64).fill(7), 'x');
      fail('debió lanzar');
    } catch (e) {
      expect((e as AppError).code).toBe('BACKUP_CORRUPT');
    }
  });

  test('bytes demasiado cortos → BACKUP_CORRUPT', () => {
    try {
      decryptJson(new Uint8Array([1, 2, 3]), 'x');
      fail('debió lanzar');
    } catch (e) {
      expect((e as AppError).code).toBe('BACKUP_CORRUPT');
    }
  });
});

describe('base64', () => {
  test('roundtrip de longitudes variadas', () => {
    for (const len of [0, 1, 2, 3, 4, 5, 255, 256, 1024]) {
      const src = new Uint8Array(len);
      for (let i = 0; i < len; i++) src[i] = (i * 31 + 7) % 256;
      expect(base64ToBytes(bytesToBase64(src))).toEqual(src);
    }
  });

  test('bytes conocidos', () => {
    expect(bytesToBase64(new TextEncoder().encode('hola'))).toBe('aG9sYQ==');
    expect(new TextDecoder().decode(base64ToBytes('aG9sYQ=='))).toBe('hola');
  });
});
