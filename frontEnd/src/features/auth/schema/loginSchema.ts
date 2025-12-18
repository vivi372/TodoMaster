import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().nonempty('이메일을 입력해 주세요.').email('이메일 형식이 올바르지 않습니다.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
