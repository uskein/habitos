import { buildCsv, escapeCsvField } from '../csv';

describe('escapeCsvField (M32 · RFC4180)', () => {
  it('campos simples van sin comillas', () => {
    expect(escapeCsvField('hola')).toBe('hola');
    expect(escapeCsvField('2026-10-13')).toBe('2026-10-13');
  });

  it('coma, comilla o salto ⇒ entrecomillado con comillas duplicadas', () => {
    expect(escapeCsvField('Beber agua, 2 L')).toBe('"Beber agua, 2 L"');
    expect(escapeCsvField('Diario "duro"')).toBe('"Diario ""duro"""');
    expect(escapeCsvField('línea1\nlínea2')).toBe('"línea1\nlínea2"');
  });
});

describe('buildCsv (M32 · construcción)', () => {
  it('une cabeceras y filas con CRLF, serializa tipos y añade BOM', () => {
    const csv = buildCsv(
      ['fecha', 'habito', 'completado'],
      [
        ['2026-10-13', 'Beber agua, 2 L', 1],
        ['2026-10-12', 'Leer', 0],
      ],
    );
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('fecha,habito,completado\r\n');
    expect(csv).toContain('2026-10-13,"Beber agua, 2 L",1\r\n');
    expect(csv).toContain('2026-10-12,Leer,0\r\n');
  });

  it('sin filas solo emite cabecera + BOM', () => {
    expect(buildCsv(['a'], [])).toBe('\uFEFFa\r\n');
  });
});
