import { Request, Response, NextFunction } from 'express';
import multer from 'multer';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'File too large. Maximum size is 10 MB.' });
      return;
    }
    res.status(400).json({ message: err.message });
    return;
  }
  if (err.message?.startsWith('Unsupported file type')) {
    res.status(400).json({ message: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
};
