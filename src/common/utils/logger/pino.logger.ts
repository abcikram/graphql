export interface ILogger {
  info(message: string, meta?: Record<string, any>): void;
  error(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}

import pino from "pino";

const pinoInstance = pino({
  level: process.env.LOG_LEVEL || "info",
});

export class PinoLogger implements ILogger {
  info(message: string, meta?: Record<string, any>) {
    pinoInstance.info(meta || {}, message);
  }

  error(message: string, meta?: Record<string, any>) {
    pinoInstance.error(meta || {}, message);
  }

  warn(message: string, meta?: Record<string, any>) {
    pinoInstance.warn(meta || {}, message);
  }

  debug(message: string, meta?: Record<string, any>) {
    pinoInstance.debug(meta || {}, message);
  }
}
