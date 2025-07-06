//Build a custom morgan logger for the auth service

import morgan from 'morgan';
import { logger } from './logger';

export const requestLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message) => {
        logger.info(message.trim());
      },
    },
  }
);
