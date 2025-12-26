import { z } from 'zod';

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      // 1. 8자 이상
      .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
      // 2. 영문 포함 (대소문자 구분 없음)
      .regex(/[a-zA-Z]/, '비밀번호에 영문(대소문자)이 포함되어야 합니다.')
      // 3. 숫자 포함
      .regex(/[0-9]/, '비밀번호에 숫자가 포함되어야 합니다.')
      // 4. 특수문자 포함
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        '비밀번호에 !@#$%^&*(),.?":{}|<> 중 하나의 특수문자가 포함되어야 합니다.',
      ),
    confirmPassword: z.string().min(8, '비밀번호 확인은 8자 이상이어야 합니다.'),
    resetToken: z.string(),
  }) // 3. refine()을 사용하여 두 필드 값 비교
  .refine((data) => data.password === data.confirmPassword, {
    // 검증 실패 시 출력할 메시지와 필드 경로 지정
    message: '비밀번호가 일치하지 않습니다.', // 사용자에게 보여줄 에러 메시지
    path: ['confirmPassword'], // 에러를 'confirmPassword' 필드에 연결
  });

export type ResetPasswordSchemaValues = z.infer<typeof ResetPasswordSchema>;
