import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { commonApi } from '@/shared/api/commonApi';
import { uploadToS3 } from '@/lib/utils/uploadToS3';

/**
 * useSignup 커스텀 훅:
 * 1. 선택적 프로필 이미지를 S3에 업로드 (Presigned URL 사용).
 * 2. 이미지 업로드가 성공하면, S3 경로(profileImageKey)를 포함하여 최종 회원가입 요청을 서버로 전송합니다.
 */
export function useSignup() {
  // TanStack Query의 useMutation을 사용하여 비동기 회원가입 프로세스를 관리합니다.
  const signupMutation = useMutation({
    /**
     * mutationFn: 회원가입 버튼 클릭 시 실제로 실행될 비동기 함수입니다.
     * @param form - 회원가입 폼 데이터 (이메일, 비밀번호, 닉네임, 선택적 프로필 이미지 File)
     */
    mutationFn: async (form: {
      email: string;
      password: string;
      nickname: string;
      profileImg?: File | null; // 프로필 이미지 파일 객체 (선택 사항)
    }) => {
      // S3에 업로드된 파일의 키(경로)를 저장할 변수 (백엔드에 전송할 값)
      let profileImageKey: string | null = null;

      // 1️⃣ 프로필 이미지 파일이 존재할 경우 (선택적 업로드)
      if (form.profileImg) {
        const presignedUrlPayload = {
          directory: 'temp/profile',
          contentType: form.profileImg.type,
        };
        // a. 백엔드에 Presigned URL 요청:
        //    S3에 직접 파일을 올릴 수 있는 임시 URL(uploadUrl)과 저장될 경로(objectKey)를 받아옵니다.
        const { uploadUrl, objectKey } = await commonApi.getPresignedUrl(presignedUrlPayload);

        console.log(uploadUrl);

        // b. S3에 파일 업로드:
        //    받아온 uploadUrl을 사용하여 프론트엔드에서 S3로 직접 파일을 PUT 요청합니다.
        await uploadToS3(uploadUrl, form.profileImg);

        // c. S3 경로 저장:
        //    성공적으로 업로드되었으므로, 최종 회원가입 요청에 사용할 objectKey를 저장합니다.
        profileImageKey = objectKey;
      }

      // 2️⃣ 최종 회원가입 요청을 백엔드 서버로 전송
      await authApi.signup({
        email: form.email,
        password: form.password,
        nickname: form.nickname,
        // profileImageKey가 있으면 경로를 전송하고, 없으면 undefined를 전송합니다.
        profileImg: profileImageKey,
      });
    },
    // onSuccess, onError 등의 콜백은 필요에 따라 여기에 추가할 수 있습니다.
  });

  // 4. 컴포넌트에서 사용할 기능과 상태를 반환합니다.
  return {
    // mutate 함수를 signup 이름으로 반환하여 컴포넌트에서 쉽게 호출할 수 있게 합니다.
    signup: signupMutation.mutateAsync,
    isLoading: signupMutation.isPending,
  };
}
