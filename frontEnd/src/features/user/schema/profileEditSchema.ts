import { z } from 'zod';

export const profileEditSchema = z.object({
  profileImg: z.instanceof(File).nullable().optional(),
  nickname: z.string().nonempty('이름을 입력해 주세요.'),
  email: z.string().nonempty('이메일을 입력해 주세요.').email('이메일 형식이 올바르지 않습니다.'),
});

export type profileEditSchemaValues = z.infer<typeof profileEditSchema>;
