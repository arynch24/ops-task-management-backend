import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../config/jwt';
import { config } from "../config";

const router = Router();

/* Google OAuth Start */
router.get('/google', (req, res) => {
    const scope = [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
    ].join(' ');

    const url = 'https://accounts.google.com/o/oauth2/v2/auth?' +
        new URLSearchParams({
            client_id: config.googleClientId!,
            redirect_uri: config.googleRedirectUri!,
            response_type: 'code',
            scope,
            access_type: 'offline',
            prompt: 'consent',
        }).toString();

    res.redirect(url);
});

/** Google Callback */
router.get('/google/callback', AuthController.googleAuthCallback);

/** Get current user */
router.get('/me', authenticate, AuthController.me);

/** Logout user */
router.post('/logout', authenticate, AuthController.logout);

export default router;