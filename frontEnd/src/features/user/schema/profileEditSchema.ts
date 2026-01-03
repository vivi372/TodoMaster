import { z } from 'zod';
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const profileEditSchema = z.object({
  nickname: z
    .string()
    .min(2, '닉네임은 2자 이상이어야 합니다.')
    .max(10, '닉네임은 10자를 초과할 수 없습니다.'),
  profileImg: z
    .any()
    .optional()
    .nullable()
    .refine((file) => {
      // file이 없거나 (null, undefined), file 객체인데 type 속성이 없는 경우도 통과
      if (!file || !file.type) {
        return true;
      }
      // file.type이 존재하면 (File 객체로 간주) 타입 검증 실행
      return ACCEPTED_IMAGE_TYPES.includes(file.type);
    }, '지원되지 않는 이미지 형식입니다 (JPG, JPEG, PNG, WEBP).'),
});

export type ProfileEditSchemaValues = z.infer<typeof profileEditSchema>;
