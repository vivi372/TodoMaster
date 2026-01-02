import { z } from 'zod';

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().nonempty('현재 비밀번호를 입력해 주세요.'),
    newPassword: z
      .string()
      // 1. 8자 이상
      .min(8, '새 비밀번호는 최소 8자 이상이어야 합니다.')
      // 2. 영문 포함 (대소문자 구분 없음)
      .regex(/[a-zA-Z]/, '새 비밀번호에 영문(대소문자)이 포함되어야 합니다.')
      // 3. 숫자 포함
      .regex(/[0-9]/, '새 비밀번호에 숫자가 포함되어야 합니다.')
      // 4. 특수문자 포함
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        '새 비밀번호에 !@#$%^&*(),.?":{}|<> 중 하나의 특수문자가 포함되어야 합니다.',
      ),
    confirmNewPassword: z.string().min(8, '새 비밀번호 확인은 8자 이상이어야 합니다.'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: '새 비밀번호가 일치하지 않습니다.',
    path: ['confirmNewPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
    path: ['newPassword'],
  });

export type ChangePasswordSchemaValues = z.infer<typeof changePasswordSchema>;
