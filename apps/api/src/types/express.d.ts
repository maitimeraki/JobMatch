import "express";
import "express-serve-static-core";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: string;
    }
    interface Request {
      user?: User;
    }
  }
}

// @types/express@5 widens params values to string | string[].
// Override to match runtime where all route params are strings.
declare module "express" {
  interface Request {
    params: Record<string, string>;
  }
}
