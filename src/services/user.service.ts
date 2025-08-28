import { prisma } from '../config/db';

export class UserService {
  static async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }
}