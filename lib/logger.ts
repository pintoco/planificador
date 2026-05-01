type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  event: string
  userId?: string
  timestamp: string
  metadata?: Record<string, unknown>
}

function log(level: LogLevel, event: string, extras?: Omit<LogEntry, 'level' | 'event' | 'timestamp'>) {
  const entry: LogEntry = { level, event, timestamp: new Date().toISOString(), ...extras }
  const line = JSON.stringify(entry)
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const logger = {
  info: (event: string, extras?: Omit<LogEntry, 'level' | 'event' | 'timestamp'>) =>
    log('info', event, extras),
  warn: (event: string, extras?: Omit<LogEntry, 'level' | 'event' | 'timestamp'>) =>
    log('warn', event, extras),
  error: (event: string, extras?: Omit<LogEntry, 'level' | 'event' | 'timestamp'>) =>
    log('error', event, extras),
}
