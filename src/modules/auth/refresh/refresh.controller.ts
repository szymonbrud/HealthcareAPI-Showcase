import { NextFunction, Request, Response } from 'express';
import { ROUTES } from '../../../constants/routes';
import { AppError } from '../../../utils/AppError';
import { refreshService } from './refresh.service';
import { validateDTOs } from '../../../utils/validateDTOs';
import { RefreshSuccessResponseDto } from './refreshResponse.dto';

export const refreshController = async (req: Request, res: Response, next: NextFunction) => {
  const { jwt } = req.cookies;

  if (!jwt) {
    next(new AppError('Brak autoryzacji', 401));
    return;
  }

  try {
    const { refreshToken, accessToken } = await refreshService(jwt);

    const successResponseData: RefreshSuccessResponseDto = {
      accessToken,
    };

    const validatedSuccessResponseData = await validateDTOs(
      RefreshSuccessResponseDto,
      successResponseData,
    );

    // zwracamy refresh_token w ciasteczku
    res.cookie('jwt', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000,
      path: `/api${ROUTES.BASE_AUTH}${ROUTES.AUTH.REFRESH}`,
    });

    res.json(validatedSuccessResponseData);
  } catch (err) {
    next(err);
  }
};
