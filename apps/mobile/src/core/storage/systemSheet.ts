/**
 * Exención de auto-lock R4 durante sheets nativos del sistema
 * (galería, selector de documentos, hoja de compartir).
 *
 * Al abrirlos la app pasa a `background`; sin esta bandera SessionGate
 * armaría el lock inmediato, desmontando el formulario activo del usuario.
 * El lock real no se evade: solo se difiere mientras el sheet está abierto,
 * y `run()` libera la bandera en `finally` (resultado, cancel o error).
 */

let depth = 0;

export const systemSheet = {
  run<T>(fn: () => Promise<T>): Promise<T> {
    depth++;
    return fn().finally(() => {
      depth = Math.max(0, depth - 1);
    });
  },
  get active(): boolean {
    return depth > 0;
  },
};
