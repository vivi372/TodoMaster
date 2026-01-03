import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import { commonApi } from '@/shared/api/commonApi';
import { uploadToS3 } from '@/shared/lib/utils/uploadToS3';
import type { ProfileEditSchemaValues } from '../schema/profileEditSchema';
import { QUERY_KEYS } from '@/shared/const/queryKeys';

export function useUpdateMyInfo() {
  const queryClient = useQueryClient();

  const updateMyInfoMutation = useMutation({
    mutationFn: async (form: ProfileEditSchemaValues) => {
      /**
       * 변경된 프로필 이미지의 S3 Object Key를 저장할 변수.
       * - 새로운 파일 업로드 시: S3 Object Key 문자열
       * - 이미지 삭제 요청 시: null
       * - 이미지 변경 없이 닉네임만 변경 시 (기존 URL): undefined (백엔드에서 무시됨)
       */
      let profileImageKey: string | null = null;

      // 1. [새 파일 업로드 요청] 사용자가 새로운 프로필 이미지 파일을 선택했는지 확인
      if (form.profileImg instanceof File) {
        // S3에 업로드하기 위한 Pre-signed URL 생성 요청에 필요한 페이로드 준비
        const presignedUrlPayload = {
          directory: 'temp/profile', // S3 업로드 경로 지정 (임시 폴더)
          contentType: form.profileImg.type, // 파일의 MIME 타입 (ex: image/jpeg)
        };

        // 2. [Pre-signed URL 발급] 백엔드 API를 호출하여 S3 업로드 권한을 가진 URL과 Object Key를 받음
        const { uploadUrl, objectKey } = await commonApi.getPresignedUrl(presignedUrlPayload);

        // 3. [S3 직접 업로드] 발급받은 URL을 사용하여 클라이언트에서 S3로 파일을 직접 업로드
        await uploadToS3(uploadUrl, form.profileImg);

        // 4. [Object Key 저장] 업로드 성공 후, 백엔드 DB에 저장할 최종 Object Key를 설정
        profileImageKey = objectKey;
      } else if (form.profileImg === null) {
        // 5. [이미지 삭제 요청] 사용자가 프로필 이미지 삭제 버튼을 눌렀을 경우
        // 백엔드에 이미지 필드를 null로 업데이트하도록 요청하기 위해 profileImageKey를 null로 설정
        profileImageKey = null;
      } else if (typeof form.profileImg === 'string' && form.profileImg.length > 0) {
        profileImageKey = form.profileImg;
      }
      // 6. [기존 이미지 유지] form.profileImg가 문자열(기존 URL)인 경우
      //   (사용자가 이미지를 변경하거나 삭제하지 않고 닉네임만 수정한 경우)
      //   profileImageKey는 초기값인 기존 URL 상태로 유지됩니다.
      //   백엔드에서는 기존과 동일 값을 받으면 해당 필드(프로필 이미지)는 업데이트하지 않습니다.

      // 7. [사용자 정보 업데이트] 최종적으로 닉네임과 처리된 프로필 이미지 키(혹은 null)를 백엔드에 전송
      await userApi.updateMyInfo({
        nickname: form.nickname,
        // profileImageKey가 기존과 동일하면(null이 아니고 form에서 파일로 안 왔을때) 백엔드에서 이미지 업데이트를 무시함 (기존 이미지 유지)
        // profileImageKey가 null이면 백엔드에서 이미지 필드를 null로 업데이트함 (이미지 삭제)
        // profileImageKey가 문자열이면 백엔드에서 새로운 키로 업데이트함 (새 이미지 적용)
        profileImg: profileImageKey,
      });
    },
    onSuccess: () => {
      // Invalidate and refetch the profile data to see the changes
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_PROFILE] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_SUMMARY_PROFILE] });
    },
  });

  return {
    mutate: updateMyInfoMutation.mutate,
    isPending: updateMyInfoMutation.isPending,
  };
}
