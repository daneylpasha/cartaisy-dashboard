import { create } from 'qrcode';
import { readInstallUrl } from './contract.ts';

/** Quiet zone in modules. Spec recommends four. */
const QUIET = 4;

export interface InstallQrGrid {
  /** Modules per side, including the quiet zone. */
  size: number;
  /** Row-major dark modules. The URL is not stored as text. */
  cells: boolean[];
}

/**
 * Client-side QR for a public https install URL.
 * Credentialed and token-shaped values return null. Does not call a QR host.
 */
export function installQrGrid(url: string): InstallQrGrid | null {
  const safe = readInstallUrl(url);
  if (!safe) return null;
  let symbol;
  try {
    symbol = create(safe, { errorCorrectionLevel: 'M' });
  } catch {
    return null;
  }
  const modules = symbol.modules.size;
  if (!Number.isInteger(modules) || modules < 21 || modules > 177) return null;
  const size = modules + QUIET * 2;
  const cells: boolean[] = new Array(size * size);
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const symbolRow = row - QUIET;
      const symbolCol = col - QUIET;
      const inside = symbolRow >= 0 && symbolCol >= 0 && symbolRow < modules && symbolCol < modules;
      cells[row * size + col] = inside && symbol.modules.get(symbolRow, symbolCol) === 1;
    }
  }
  return { size, cells };
}
