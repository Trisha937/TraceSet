/**
 * Button.jsx — Reusable button component
 * Variants: primary | secondary | danger | ghost
 * Sizes:    sm | md | lg
 */

const VARIANT_STYLES = {
  primary: [
    'bg-ts-cyan text-ts-base font-semibold',
    'hover:bg-[#00BFEB]',
    'active:bg-[#00AAD4]',
    'border border-transparent',
  ].join(' '),

  secondary: [
    'bg-transparent text-ts-secondary font-medium',
    'border border-ts-border',
    'hover:border-ts-border-active hover:text-ts-text',
    'active:bg-ts-elevated',
  ].join(' '),

  danger: [
    'bg-transparent text-ts-red font-medium',
    'border border-ts-red border-opacity-40',
    'hover:bg-[#E5484D11] hover:border-ts-red',
    'active:bg-[#E5484D22]',
  ].join(' '),

  ghost: [
    'bg-transparent text-ts-muted font-medium',
    'border border-transparent',
    'hover:text-ts-text hover:bg-ts-elevated',
  ].join(' '),
}

const SIZE_STYLES = {
  sm:  'h-7  px-3 text-xs2 rounded-ts-sm gap-1.5',
  md:  'h-9  px-4 text-sm2 rounded-ts   gap-2',
  lg:  'h-11 px-5 text-sm2 rounded-ts   gap-2',
}

export default function Button({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  iconRight,
  loading = false,
  disabled = false,
  children,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-sora',
        'transition-all duration-150',
        'select-none cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <span
          className="inline-block rounded-full border-2 border-current border-t-transparent animate-spin"
          style={{ width: 12, height: 12 }}
        />
      ) : (
        Icon && <Icon size={size === 'sm' ? 13 : 15} strokeWidth={1.75} />
      )}
      {children}
      {iconRight && !loading && (
        <iconRight size={size === 'sm' ? 13 : 15} strokeWidth={1.75} />
      )}
    </button>
  )
}
