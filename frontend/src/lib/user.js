const DEFAULT_DISPLAY_NAME = 'Neighbor'

const sanitizeSeed = (value) => {
  if (!value) return 'neighbor'
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, '') || 'neighbor'
}

export const getUserDisplayName = (user) => {
  if (!user) return DEFAULT_DISPLAY_NAME
  if (user.name && user.name.trim()) return user.name.trim()
  if (user.username && user.username.trim()) return user.username.trim()
  if (user.email) return user.email.split('@')[0]
  return DEFAULT_DISPLAY_NAME
}

export const getUserInitials = (user) => {
  const name = getUserDisplayName(user)
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
  return initials.toUpperCase() || DEFAULT_DISPLAY_NAME.slice(0, 1)
}

export const getUserAvatarUrl = (user) => {
  if (!user) return `https://avatar.vercel.sh/${sanitizeSeed()}.png`
  if (user.avatar_url) return user.avatar_url
  const seed = sanitizeSeed(user.id || user.email || getUserDisplayName(user))
  return `https://avatar.vercel.sh/${seed}.png`
}
