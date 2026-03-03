import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret';

const signupSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6)
});

export const signup = async (req: Request, res: Response) => {
    try {
        const { email, password } = signupSchema.parse(req.body);

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) return res.status(400).json({ error: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Fetch or create FREE plan
        let freePlan = await prisma.plan.findUnique({ where: { name: 'FREE' } });
        if (!freePlan) {
            freePlan = await prisma.plan.create({
                data: {
                    name: 'FREE',
                    maxChannels: 1,
                    maxPlatforms: 1,
                    maxClipsPerMonth: 5
                }
            });
        }

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                planId: freePlan.id
            }
        });

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};

export const signin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
};
