import { Request } from 'express';

export interface AuthenticatedUser {
  id: number;
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
      validatedBody?: any;
      validatedQuery?: any;
    }
  }
}

export {};
