import { z } from 'zod'

import type { InstructionLogEntry, InstructionPayload } from '@/types/instruction'
import { safeParseJson } from '@/utils/json'

const payloadSchema = z.object({
  revision: z.number(),
  summary: z.string(),
  steps: z.array(z.string()),
  ownerNotes: z.string().optional(),
})

const categorySchema = z.enum(['quality', 'compliance', 'safety', 'efficiency'] as const)
const statusSchema = z.enum(['pending', 'in_review', 'approved', 'rejected'] as const)

const instructionSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: categorySchema,
  status: statusSchema,
  createdAt: z.string(),
  owner: z.string(),
  payload: z.string(),
})

const instructionResponseSchema = z.array(instructionSchema)

const RAW_INSTRUCTION_RESPONSE = JSON.stringify(
  [
    {
      id: 'LOG-1001',
      title: 'Verify calibration parameters',
      category: 'quality',
      status: 'pending',
      createdAt: '2024-07-18T09:15:00Z',
      owner: 'Alex Smith',
      payload: JSON.stringify({
        revision: 4,
        summary: 'Confirm that all calibration values align with the v4 baseline.',
        steps: [
          'Compare calibration snapshot with baseline profile.',
          'Document any deviations greater than 2%.',
          'Escalate discrepancies to the quality lead.',
        ],
      } satisfies InstructionPayload),
    },
    {
      id: 'LOG-1002',
      title: 'Audit operator acknowledgment flow',
      category: 'compliance',
      status: 'in_review',
      createdAt: '2024-07-19T12:00:00Z',
      owner: 'Priya Patel',
      payload: JSON.stringify({
        revision: 2,
        summary: 'Ensure operator acknowledgements are stored and timestamped.',
        steps: [
          'Sample 15 acknowledgement entries for completeness.',
          'Confirm timestamp precision to the second.',
          'Capture system screenshot for evidence.',
        ],
        ownerNotes: 'Focus on the July 12 deployment cohort.',
      } satisfies InstructionPayload),
    },
    {
      id: 'LOG-1003',
      title: 'Validate emergency-stop drill logs',
      category: 'safety',
      status: 'approved',
      createdAt: '2024-07-17T15:30:00Z',
      owner: 'Jordan Lee',
      payload: JSON.stringify({
        revision: 3,
        summary: 'Cross-check drill completion entries with safety officer notes.',
        steps: [
          'Verify drill duration against the standard operating window.',
          'Ensure all participating teams signed off.',
          'Archive evidence within the safety share.',
        ],
      } satisfies InstructionPayload),
    },
    {
      id: 'LOG-1004',
      title: 'Optimize packaging throughput plan',
      category: 'efficiency',
      status: 'pending',
      createdAt: '2024-07-16T08:45:00Z',
      owner: 'Marina Costa',
      payload: JSON.stringify({
        revision: 1,
        summary: 'Analyse throughput data to identify packaging slowdowns.',
        steps: [
          'Aggregate hourly throughput metrics for the last 30 days.',
          'Flag stations operating under 85% efficiency.',
          'Propose a mitigation plan for critical stations.',
        ],
      } satisfies InstructionPayload),
    },
  ],
  null,
  2,
)

export async function fetchInstructionLogs(): Promise<InstructionLogEntry[]> {
  const parsed = safeParseJson(RAW_INSTRUCTION_RESPONSE, instructionResponseSchema)

  if (!parsed.success) {
    return []
  }

  const entries = parsed.data.reduce<InstructionLogEntry[]>((accumulator, item) => {
    const payload = safeParseJson(item.payload, payloadSchema)

    if (!payload.success) {
      return accumulator
    }

    accumulator.push({
      id: item.id,
      title: item.title,
      category: item.category,
      status: item.status,
      createdAt: item.createdAt,
      owner: item.owner,
      payload: payload.data,
    })

    return accumulator
  }, [])

  return entries.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}
