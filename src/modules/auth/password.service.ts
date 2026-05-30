import bcrypt from "bcryptjs";

import { env } from "../../config/env.ts";

export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, env.passwordHashRounds);
  }

  async verifyPassword(password: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}
