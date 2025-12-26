import { z } from 'zod';

export const forgotPasswordSchema = z.object({
  email: z.string().nonempty('이메일을 입력해 주세요.').email('이메일 형식이 올바르지 않습니다.'),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
