import { prisma } from '../config/db';

export class UserService {
  static async findUserByEmail(email: string) {
    return prisma.users.findUnique({ where: { email } });
  }
}