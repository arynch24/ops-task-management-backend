import { getGoogleUser } from '../utils/google_auth.utils';
import { UserService } from './user.service';
import { generateToken } from '../config/jwt';

export class AuthService {
  static async googleLogin(code: string) {
    try {
      const googleUser = await getGoogleUser(code);

      if (!googleUser.verified_email) {
        throw new Error('Email not verified with Google');
      }

      // Check if user exists in our DB
      const user = await UserService.findUserByEmail(googleUser.email);

      if (!user) {
        throw new Error('You are not authorized to access this application.');
      }

      // Generate JWT token
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });
      
      return { token, user };
    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }
}