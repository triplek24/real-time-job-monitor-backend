import { Request, Response } from 'express';
import { z } from 'zod';
import { login } from './auth.service';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await login(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid email or password format',
      });
    }

    res.status(401).json({
      success: false,
      error: 'Authentication Failed',
      message: error.message || 'Invalid credentials',
    });
  }
};
