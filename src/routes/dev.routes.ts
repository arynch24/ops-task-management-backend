// routes/dev.routes.ts (remove in production!)
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

const router = Router();

router.get('/login-dev-admin', (req, res) => {
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

router.get('/login-dev-user', (req, res) => {
    const token = jwt.sign(
        { id: "f14400cc-b0d1-4fa4-9231-3fa8542bf271", email: 'aryan.sot010025@pwioi.com', role: 'MEMBER' },
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