import { Request, Response } from 'express';
import { getUserById } from './user.service';

export const getMeController = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await getUserById(userId);

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: 'Not Found',
      message: error.message || 'User not found',
    });
  }
};
