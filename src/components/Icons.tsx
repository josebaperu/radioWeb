type IconProps = { size?: number }

export function IconPlay({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M8 5.1v13.8c0 .8.9 1.3 1.6.8l10.2-6.9c.6-.4.6-1.3 0-1.7L9.6 4.3C8.9 3.8 8 4.3 8 5.1Z" />
    </svg>
  )
}

export function IconPause({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M7 5h3.2c.4 0 .8.4.8.8v12.4c0 .4-.4.8-.8.8H7c-.4 0-.8-.4-.8-.8V5.8c0-.4.4-.8.8-.8Zm6.8 0H17c.4 0 .8.4.8.8v12.4c0 .4-.4.8-.8.8h-3.2c-.4 0-.8-.4-.8-.8V5.8c0-.4.4-.8.8-.8Z" />
    </svg>
  )
}

export function IconPrev({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M6.2 5.2h1.8v13.6H6.2V5.2Zm11.7.2v13.2L9.2 12l8.7-6.6Z" />
    </svg>
  )
}

export function IconNext({ size = 24 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M16 5.2h1.8v13.6H16V5.2ZM6.1 5.4 14.8 12l-8.7 6.6V5.4Z" />
    </svg>
  )
}

export function IconHeart({ size = 22, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.8}
        d="M12 20s-7-4.4-7-9.1C5 8 6.8 6.2 9 6.2c1.3 0 2.4.6 3 1.6.6-1 1.7-1.6 3-1.6 2.2 0 4 1.8 4 4.7C19 15.6 12 20 12 20Z"
      />
    </svg>
  )
}

export function IconSearch({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16.2 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function IconClose({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function IconSort({ size = 20 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h10M4 12h7M4 17h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M17 6v12m0 0-3-3m3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function IconSun({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function IconMoon({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M14.5 3.2a8.2 8.2 0 1 0 6.3 12.8A7.2 7.2 0 0 1 14.5 3.2Z" />
    </svg>
  )
}

export function IconEq({ size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 4v16M12 4v16M18 4v16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="6" cy="9" r="2.1" fill="currentColor" />
      <circle cx="12" cy="14" r="2.1" fill="currentColor" />
      <circle cx="18" cy="8" r="2.1" fill="currentColor" />
    </svg>
  )
}
