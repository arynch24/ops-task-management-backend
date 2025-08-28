// routes/dev.routes.ts (remove in production!)
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();

router.get('/login-dev', (req, res) => {
    const token = jwt.sign(
        { id: "6518d872-6a53-40b5-8918-3b32522d6551", email: 'aryan.chauhan@pw.live', role: 'ADMIN' },
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