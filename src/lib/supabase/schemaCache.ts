const ORIGIN_KEYS = ['origin', 'reimbursement_status'] as const

let originColumnsAvailable = true

export function isMissingOriginColumnError(
  error: { code?: string; message?: string } | null
): boolean {
  if (!error) return false
  const message = error.message || ''
  return (
    error.code === 'PGRST204' ||
    message.includes('schema cache') ||
    (message.includes("'origin'") && message.toLowerCase().includes('column'))
  )
}

export function canUseOriginColumns() {
  return originColumnsAvailable
}

export function markOriginColumnsUnavailable() {
  originColumnsAvailable = false
}

export function omitOriginFields<T extends Record<string, unknown>>(row: T): T {
  const next = { ...row }
  for (const key of ORIGIN_KEYS) {
    delete next[key]
  }
  return next
}

export function withOriginFieldsIfSupported<T extends Record<string, unknown>>(row: T): T {
  return originColumnsAvailable ? row : omitOriginFields(row)
}
