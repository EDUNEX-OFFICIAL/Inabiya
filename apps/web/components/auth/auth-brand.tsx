import { BrandLogo } from '@/components/brand-logo';

type Surface = 'light' | 'dark';

type Props = {
  surface: Surface;
  /** `visual` = full lockup on the art panel. `form` = letter-b mark above the heading. */
  placement: 'visual' | 'form';
  href?: string | null;
};

/**
 * Inabiya lockup / mark for auth shells. Dark panels use the white artwork.
 */
export function AuthBrandLockup({ surface, placement, href = null }: Props) {
  const variant = surface === 'dark' ? 'onDark' : 'color';
  if (placement === 'visual') {
    return (
      <div className="auth-brand auth-brand--visual">
        <BrandLogo
          kind="wordmark"
          size="lg"
          variant={variant}
          href={href}
          className="auth-brand__art"
        />
      </div>
    );
  }
  return (
    <div className="auth-brand auth-brand--form">
      <BrandLogo
        kind="mark"
        size="md"
        variant={variant}
        href={href}
        priority
        className="auth-brand__art"
      />
    </div>
  );
}
