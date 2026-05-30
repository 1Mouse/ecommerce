declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: string;
      };
      validatedQuery?: unknown;
    }
  }
}

export {};
