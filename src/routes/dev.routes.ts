// routes/dev.routes.ts (remove in production!)
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();

router.get('/login-dev', (req, res) => {
    const token = jwt.sign(
        { id: "30875658-8f2d-438a-99eb-c9c8366c5cf9", email: 'aryan.chauhan@pw.live', role: 'admin' },
        config.jwtSecret as string,
        { expiresIn: '1h' }
    );

    res.cookie('token', token, {
        httpOnly: true,
        secure: config.nodeEnv === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'strict',
    });

    return res.json({ success: true, message: 'Dev login successful', token });
});

export default router;