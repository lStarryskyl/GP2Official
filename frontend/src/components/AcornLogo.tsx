import { CSSProperties } from 'react';

type AcornLogoProps = {
  variant?: 'full' | 'mark';
  height?: number | string;
  width?: number | string;
  color?: string;
  style?: CSSProperties;
  className?: string;
  title?: string;
};

/**
 * Unified platform logo component.
 *
 * - `variant="full"` → logo image + "Acorn" wordmark side by side.
 * - `variant="mark"` → logo image only (icon-only contexts).
 *
 * The image is served from `/logo.png` in the public directory.
 */
export function AcornLogo({
  variant = 'full',
  height = 36,
  width,
  color,
  style,
  className,
  title = 'Acorn',
}: AcornLogoProps) {
  const isMark = variant === 'mark';
  const numericHeight = typeof height === 'number' ? height : undefined;

  if (isMark) {
    // Icon-only mode: just the logo image
    return (
      <img
        src="/logo.png"
        alt={title}
        className={className}
        draggable={false}
        style={{
          height,
          width: width ?? (numericHeight ? numericHeight : 'auto'),
          objectFit: 'contain',
          display: 'block',
          ...style,
        }}
      />
    );
  }

  // Full mode: logo image + wordmark
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: numericHeight ? Math.max(6, numericHeight * 0.2) : 8,
        height,
        ...style,
      }}
    >
      <img
        src="/logo.png"
        alt={title}
        draggable={false}
        style={{
          height: '100%',
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
      />
      <span
        style={{
          fontFamily: "'Syne', 'Inter', sans-serif",
          fontWeight: 700,
          fontSize: numericHeight ? Math.max(14, numericHeight * 0.55) : 20,
          letterSpacing: '-0.03em',
          color: color ?? '#E8EDF5',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        Acorn
      </span>
    </div>
  );
}

export default AcornLogo;
