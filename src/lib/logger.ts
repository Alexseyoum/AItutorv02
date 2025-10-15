export class Logger {
  static error(message: string, error?: Error, context?: Record<string, any>) {
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      context
    }));
  }
  
  static info(message: string, context?: Record<string, any>) {
    console.info(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      context
    }));
  }
  
  static warn(message: string, context?: Record<string, any>) {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      context
    }));
  }
}