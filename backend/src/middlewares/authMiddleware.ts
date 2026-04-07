import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const USER_JWT_SECRET = process.env.USER_JWT_SECRET as string;

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

interface CustomJwtPayload extends JwtPayload {
  id: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({
      message: "You are not signed in"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, USER_JWT_SECRET) as CustomJwtPayload;
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Invalid token"
    });
  }
}
