import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/response';
import { config } from '../config';

export class AuthController {
  static async googleAuthCallback(req: Request, res: Response) {
    const { code } = req.query;

    if (!code) {
      return errorResponse(res, 400, 'Authorization code is required.');
    }

    try {
      const { token, user } = await AuthService.googleLogin(code as string);

      // Set JWT in HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'strict',
      });

      // Redirect or return success
      if (user.role === 'ADMIN') {
        res.redirect(`${config.clientUrl}/admin`);
      } else {
        res.redirect(`${config.clientUrl}/operation`);
      }
      return successResponse(res, 'Google Auth successful', { user });
    } catch (error: any) {
      console.error('Google Auth Error:', error);
      res.redirect(`${config.clientUrl}/unauthorized`);
      return errorResponse(res, 401, error.message || 'Authentication failed.');
    }
  }

  static async logout(req: Request, res: Response) {
    res.clearCookie('token');
    return successResponse(res, 'Logged out successfully', {});
  }

  static async me(req: Request, res: Response) {
    return successResponse(res, 'User retrieved successfully', { user: req.user });
  }
}