import type { ZodSchema } from 'zod'

export type SafeParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export function safeParseJson<T>(raw: string, schema: ZodSchema<T>): SafeParseResult<T> {
  try {
    const value = JSON.parse(raw) as unknown
    const parsed = schema.safeParse(value)

    if (parsed.success) {
      return { success: true, data: parsed.data }
    }

    return { success: false, error: parsed.error.message }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown JSON parsing error'

    return { success: false, error: message }
  }
}
