import { prisma } from '../config/db';

export class UserService {
  
  static async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  static async getMe(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId }
    });
  }

  static async getAllMembers() {
    return prisma.user.findMany({
      where: { role: 'MEMBER' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });
  }
}

