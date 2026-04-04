import { ILogger, PinoLogger } from "./pino.logger";


export class LoggerFactory {
  static create(): ILogger {
    return new PinoLogger();
  }
}
