const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const relativeFormatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' })

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
const MONTH = 30 * DAY
const YEAR = 365 * DAY

const isValidDate = (date: Date) => !Number.isNaN(date.getTime())

export const formatAbsoluteDateTime = (iso: string, fallback = '—'): string => {
  const date = new Date(iso)

  if (!isValidDate(date)) {
    return fallback
  }

  return dateFormatter.format(date)
}

const getRelativeLabel = (date: Date, now: Date): string => {
  const diffMs = date.getTime() - now.getTime()
  const absMs = Math.abs(diffMs)

  if (absMs < 45 * 1000) {
    return 'just now'
  }

  const diffMinutes = Math.round(diffMs / MINUTE)

  if (Math.abs(diffMinutes) < 60) {
    return relativeFormatter.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMs / HOUR)

  if (Math.abs(diffHours) < 24) {
    return relativeFormatter.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffMs / DAY)

  if (Math.abs(diffDays) < 7) {
    return relativeFormatter.format(diffDays, 'day')
  }

  const diffWeeks = Math.round(diffMs / WEEK)

  if (Math.abs(diffWeeks) < 5) {
    return relativeFormatter.format(diffWeeks, 'week')
  }

  const diffMonths = Math.round(diffMs / MONTH)

  if (Math.abs(diffMonths) < 12) {
    return relativeFormatter.format(
      diffMonths === 0 ? Math.sign(diffMs) || 0 : diffMonths,
      'month',
    )
  }

  const diffYears = Math.round(diffMs / YEAR)

  return relativeFormatter.format(
    diffYears === 0 ? Math.sign(diffMs) || 0 : diffYears,
    'year',
  )
}

export const formatRelativeDateTime = (iso: string, now = new Date()): string => {
  const date = new Date(iso)

  if (!isValidDate(date)) {
    return ''
  }

  return getRelativeLabel(date, now)
}

export const formatInstructionTimestamp = (iso: string): string => {
  const absolute = formatAbsoluteDateTime(iso)
  const relative = formatRelativeDateTime(iso)

  if (!relative) {
    return absolute
  }

  return `${absolute} (${relative})`
}
