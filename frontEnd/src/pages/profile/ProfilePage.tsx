import { Edit, Mail, Calendar, Shield, LogOut, Trash2 } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Link } from 'react-router-dom';
import { Separator } from '@radix-ui/react-dropdown-menu';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useModal, type BaseModalData } from '@/shared/store/modalStore';
import { useDeleteAccount } from '@/features/user/hooks/useDeleteAccount';
import { useProfileQuery } from '@/features/user/hooks/useProfileQuery';
import { LoadingDots } from '@/shared/ui/loading/LoadingDots';
import { formatDate } from '@/shared/lib/utils/date';

export default function ProfilePage() {
  // useAuth 훅에서 로그아웃 함수 가져오기
  const { logout } = useAuth();
  // useModal 훅에서 confirm 모달 가져오기
  const { confirm, alert } = useModal();
  // useDeleteAccount 훅에서 회원탈퇴 함수 가져오기
  const { mutate: deleteAccount } = useDeleteAccount();
  // useProfileQuery 통해서 유저 프로필 가져오기
  const { data: profile, isLoading } = useProfileQuery();

  // deleteAccount시 onSuccess 콜백
  const handleSuccess = async () => {
    // 1. 서버에서 회원 데이터 제거 후 성공 모달 띄우기(alert)
    const modalProps: BaseModalData = {
      title: '탈퇴 완료',
      description: '회원 탈퇴가 완료되었습니다. 하루로그를 이용해 주셔서 감사합니다.',
      variant: 'success',
    };
    await alert(modalProps);
    // 2. 회원 탈퇴 완료 후 로그아웃 처리(서버에서 회원 정보가 이미 사라졌기 때문에 token만 삭제)
    logout();
  };

  // 회원 탈퇴 버튼 핸들러
  const handleDeleteAccount = async () => {
    // 1. confirm 모달로 경고 출력
    const modalProps: BaseModalData = {
      title: '정말 탈퇴하시겠습니까?',
      description: '모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.',
      variant: 'error',
      confirmText: '탈퇴하기',
    };
    const confirmed = await confirm(modalProps);
    // 2. 모달로 수락 했을 경우 회원탈퇴
    if (confirmed) {
      deleteAccount(undefined, {
        // 두 번째 인자로 onSuccess 콜백을 전달하여 UI 로직 실행
        onSuccess: handleSuccess,
      });
    }
  };

  if (isLoading) return <LoadingDots fullscreen={true} />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 이미지 상태가 FAILED이거나 CONFIRM일때만 경고 고지 */}
      {(profile?.profileImageStatus == 'FAILED' || profile?.profileImageStatus == 'CONFIRM') && (
        <div className="p-3 bg-red-100 text-yellow-800 border border-red-300 rounded-md mb-4 text-sm font-medium text-center">
          고객님의 현재 프로필 이미지 파일이 서버에 임시로만 저장된 상태입니다. <br />
          영구 저장에 실패하여, 며칠 내로 해당 임시 파일이 자동 삭제될 위험이 있습니다. 프로필
          변경을 시도해 주세요.
        </div>
      )}
      {/* 프로필 헤더 */}
      <Card className="p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* 프로필 이미지 */}
          <div className="relative">
            <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 border-primary/20">
              <img
                src={profile?.profileImg ?? '/images/default-profile.png'}
                alt={profile?.nickname}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* 사용자 정보 */}
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{profile?.nickname}</h1>
              <p className="text-muted-foreground flex items-center justify-center lg:justify-start gap-2 mt-2">
                <Mail className="w-4 h-4" />
                {profile?.email ?? '이메일을 등록하고 알림을 받아보세요'}
              </p>
              <p className="text-muted-foreground flex items-center justify-center lg:justify-start gap-2 mt-2">
                <Calendar className="w-4 h-4" />
                가입일: {profile?.createdAt ? formatDate(profile?.createdAt) : ''}
              </p>
            </div>

            {/* 통계 */}
            <div className="flex gap-6 justify-center lg:justify-start">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{profile?.totalTodos}</p>
                <p className="text-sm text-muted-foreground">전체 투두</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{profile?.completedTodos}</p>
                <p className="text-sm text-muted-foreground">완료</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{profile?.categories}</p>
                <p className="text-sm text-muted-foreground">카테고리</p>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex lg:flex-col gap-3 w-full lg:w-auto">
            <Button asChild className="flex-1 lg:flex-initial">
              <Link to="/profile/edit">
                <Edit className="w-4 h-4 mr-2" />
                프로필 수정
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => logout()}
              className="flex-1 lg:flex-initial bg-transparent"
            >
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>
        </div>
      </Card>

      {/* | 항목      | LOCAL     | KAKAO | GOOGLE |
          | ------- | --------- | ----- | ------------ |
          | 닉네임 변경  | O         | O     | O            |
          | 프로필 이미지 | O         | O     | O            |
          | 비밀번호 변경 | O         | ❌ 숨김  | ❌ 숨김         |
          | 이메일 표시  | O (읽기 전용) | O(존재 할때만)  | O (읽기 전용)    | 
          | 이메일 변경  | O         | O     | ❌            | // 카카오로 이메일 변경할때는 카카오 재인증 통해 2단계 인증 진행
          | 회원 탈퇴   | O         | O     | O            |
      */}

      {/* 계정 설정 */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          계정 설정
        </h2>
        <div className="space-y-4">
          {profile?.provider != 'google' && (
            <>
              <div className="flex items-center justify-between py-3 hover:bg-accent/50 px-4 rounded-lg transition-colors">
                <div>
                  <p className="font-medium">이메일 변경</p>
                  <p className="text-sm text-muted-foreground">
                    보안을 위해 2단계 인증이 필요합니다
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/profile/changeEmail">변경</Link>
                </Button>
              </div>

              <Separator />
            </>
          )}

          {profile?.provider == null && (
            <>
              <div className="flex items-center justify-between py-3 hover:bg-accent/50 px-4 rounded-lg transition-colors">
                <div>
                  <p className="font-medium">비밀번호 변경</p>
                  <p className="text-sm text-muted-foreground">
                    계정 보안을 위해 정기적으로 변경하세요
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to="/profile/change-password">변경</Link>
                </Button>
              </div>

              <Separator />
            </>
          )}

          <div className="flex items-center justify-between py-3 hover:bg-accent/50 px-4 rounded-lg transition-colors">
            <div>
              <p className="font-medium">알림 설정</p>
              <p className="text-sm text-muted-foreground">이메일 및 푸시 알림 관리</p>
            </div>
            <Button variant="outline" size="sm">
              설정
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between py-3 hover:bg-destructive/5 px-4 rounded-lg transition-colors">
            <div>
              <p className="font-medium text-destructive">회원 탈퇴</p>
              <p className="text-sm text-muted-foreground">계정을 영구적으로 삭제합니다</p>
            </div>
            <Button variant="destructive" size="sm" onClick={handleDeleteAccount}>
              <Trash2 className="w-4 h-4 mr-2" />
              탈퇴
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
