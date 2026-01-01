import { parseAxiosError } from '../api/parseAxiosError';
import { handleServerError } from '../utils/handleServerError';

export const handleAxiosError = (error: unknown) => {
  const appError = parseAxiosError(error);
  handleServerError(appError);
};
