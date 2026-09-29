import { installQrGrid } from '@/lib/build/installQr';

interface InstallQrMarkProps {
  url: string;
  title: string;
  pixelSize: number;
}

/** SVG drawn from the public install URL. No external QR image. */
export function InstallQrMark({ url, title, pixelSize }: InstallQrMarkProps) {
  const grid = installQrGrid(url);
  if (!grid) return null;
  const { size, cells } = grid;
  let path = '';
  for (let index = 0; index < cells.length; index += 1) {
    if (!cells[index]) continue;
    const x = index % size;
    const y = Math.floor(index / size);
    path += `M${x} ${y}h1v1h-1z`;
  }

  return (
    <svg
      data-install-qr=""
      role="img"
      aria-label={title}
      width={pixelSize}
      height={pixelSize}
      viewBox={`0 0 ${size} ${size}`}
      shapeRendering="crispEdges"
    >
      <title>{title}</title>
      <rect width={size} height={size} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  );
}
