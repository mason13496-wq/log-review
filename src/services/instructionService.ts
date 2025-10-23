import { z } from 'zod'

import {
  INSTRUCTION_CATEGORY_COLORS,
  getInstructionActionMetadata,
} from '@/constants/instructions'
import type { InstructionLogEntry, InstructionLogParseError } from '@/types/instruction'

const payloadSchema = z.object({
  revision: z.number(),
  summary: z.string(),
  steps: z.array(z.string()).min(1, 'Payload.steps must include at least one step'),
  ownerNotes: z.string().optional(),
})

const categorySchema = z.enum(['quality', 'compliance', 'safety', 'efficiency'] as const)
const statusSchema = z.enum(['pending', 'in_review', 'approved', 'rejected'] as const)

const baseInstructionSchema = z.object({
  id: z.string().min(1, 'id is required'),
  title: z.string().min(1, 'title is required').optional(),
  category: categorySchema.optional(),
  status: statusSchema,
  createdAt: z
    .string()
    .min(1, 'createdAt is required')
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: 'createdAt must be a valid ISO date string',
    }),
  owner: z.string().min(1, 'owner is required'),
  payload: payloadSchema,
})

const instructionRecordSchema = baseInstructionSchema
  .extend({
    action: z.string().min(1, 'action is required').optional(),
    actionCode: z.string().min(1, 'actionCode is required').optional(),
    action_code: z.string().min(1, 'action_code is required').optional(),
  })
  .superRefine((value, ctx) => {
    const resolvedAction = value.action ?? value.actionCode ?? value.action_code
    if (!resolvedAction || resolvedAction.trim().length === 0) {
      ctx.addIssue({
        path: ['action'],
        code: z.ZodIssueCode.custom,
        message: 'action is required',
      })
    }
  })
  .transform((value) => {
    const { action, actionCode, action_code, ...rest } = value
    const resolvedAction = (action ?? actionCode ?? action_code ?? '').trim()
    return {
      ...rest,
      action: resolvedAction,
    }
  })

export type InstructionRecord = z.infer<typeof instructionRecordSchema>

export interface InstructionLogParseResult {
  entries: InstructionLogEntry[]
  errors: InstructionLogParseError[]
}

export const isInstructionRecord = (value: unknown): value is InstructionRecord =>
  instructionRecordSchema.safeParse(value).success

const formatValidationErrors = (issues: z.ZodIssue[]): string =>
  issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'record'
      return `${path}: ${issue.message}`
    })
    .join('; ')

export const parseInstructionLogLines = (raw: string): InstructionLogParseResult => {
  const entries: InstructionLogEntry[] = []
  const errors: InstructionLogParseError[] = []

  raw.split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1
    const trimmed = line.trim()

    if (!trimmed) {
      return
    }

    let parsedJson: unknown

    try {
      parsedJson = JSON.parse(trimmed) as unknown
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON'
      errors.push({ line: lineNumber, message, raw: trimmed })
      return
    }

    const parsedRecord = instructionRecordSchema.safeParse(parsedJson)

    if (!parsedRecord.success) {
      errors.push({
        line: lineNumber,
        message: formatValidationErrors(parsedRecord.error.issues),
        raw: trimmed,
      })
      return
    }

    const record = parsedRecord.data

    const actionMetadata = getInstructionActionMetadata(record.action)
    const category = record.category ?? actionMetadata.category
    const action =
      category === actionMetadata.category
        ? actionMetadata
        : {
            ...actionMetadata,
            category,
            color: INSTRUCTION_CATEGORY_COLORS[category],
          }
    const title = record.title ?? action.name

    entries.push({
      id: record.id,
      title,
      category,
      status: record.status,
      createdAt: record.createdAt,
      owner: record.owner,
      payload: record.payload,
      action,
    })
  })

  entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return { entries, errors }
}
