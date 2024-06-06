import winston from 'winston';

const date = new Date().toISOString().slice(0, 10);
const customFilename = `logs/sonatural-${date}.log`;

export default {
  transports: [
    new winston.transports.Console({
      level: 'http',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.printf(info => `[${info.timestamp}] [${info.level}]: ${info.message}`)
      )
    }),
    // new winston.transports.Console({
    //   level: 'info',
    //   format: winston.format.combine(
    //     winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    //     winston.format.printf(info => `[${info.timestamp}] [${info.level}]: ${info.message}`)
    //   )
    // }),
    // new winston.transports.Console({
    //   level: 'debug',
    //   format: winston.format.combine(
    //     winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    //     winston.format.printf(info => `[${info.timestamp}] [${info.level}]: ${info.message}`)
    //   )
    // }),
    // new winston.transports.Console({
    //   level: 'error',
    //   format: winston.format.combine(
    //     winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    //     winston.format.printf(info => `[${info.timestamp}] [${info.level}]: ${info.message}`)
    //   )
    // }),
    new winston.transports.File({
      filename: customFilename,
      zippedArchive: true,
      maxsize: 20 * 1024 * 1024, // 20MB in bytes
      maxFiles: 14,
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.printf(info => `[${info.timestamp}] [${info.level}]: ${info.message}`)
      )
    })
  ]
};
