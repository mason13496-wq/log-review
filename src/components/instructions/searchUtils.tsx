import { Fragment } from 'react'
import type { ReactNode } from 'react'

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const getSearchTokens = (query: string): string[] => {
  const trimmed = query.trim()

  if (!trimmed) {
    return []
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean)
  const unique = new Set(tokens.map((token) => token.toLowerCase()))

  return Array.from(unique)
}

export const highlightMatches = (text: string, tokens: string[]): ReactNode => {
  if (!tokens.length) {
    return text
  }

  const pattern = tokens.map(escapeRegExp).join('|')

  if (!pattern) {
    return text
  }

  const regex = new RegExp(`(${pattern})`, 'gi')
  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (!part) {
      return <Fragment key={`empty-${index}`} />
    }

    const isMatch = tokens.some((token) => part.toLowerCase() === token)

    if (isMatch) {
      return (
        <mark key={`match-${index}`} className="search-highlight">
          {part}
        </mark>
      )
    }

    return <Fragment key={`text-${index}`}>{part}</Fragment>
  })
}
