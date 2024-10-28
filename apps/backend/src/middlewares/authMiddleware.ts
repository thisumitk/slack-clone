/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

  const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded as AuthRequest['user'];
    next();
  } catch (error) {
      res.status(401).json({ message: 'Unauthorized' });
      return
  }
};

export default authMiddleware;