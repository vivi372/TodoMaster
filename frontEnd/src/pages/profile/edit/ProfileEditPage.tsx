import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useEffect } from 'react';
import { ArrowLeft, Save, Sparkles, Target, Trophy, Zap } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { appToast } from '@/shared/utils/appToast';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { ProfileImageUpload } from '@/shared/ui/ProfileImageUpload';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useProfileQuery } from '@/features/user/hooks/useProfileQuery';
import {
  profileEditSchema,
  type ProfileEditSchemaValues,
} from '@/features/user/schema/profileEditSchema';
import { useUpdateMyInfo } from '@/features/user/hooks/useUpdateMyInfo';
import { LoadingDots } from '@/shared/ui/loading/LoadingDots';

export default function ProfileEditPage() {
  const navigate = useNavigate();

  // 1. 현재 프로필 정보 가져오기
  const { data: userProfile, isLoading: isProfileLoading } = useProfileQuery();

  // 2. 프로필 수정 mutation 가져오기
  const { mutate, isPending: isPending } = useUpdateMyInfo();

  // 3. react-hook-form 설정
  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<ProfileEditSchemaValues>({
    resolver: zodResolver(profileEditSchema),
  });

  // 4. 프로필 정보 로딩 완료 시 폼 기본값 설정
  useEffect(() => {
    if (userProfile) {
      setValue('nickname', userProfile.nickname);
      setValue('profileImg', userProfile.profileImg || null);
    }
  }, [userProfile]);

  // 검증시 경고 출력을 위한 useEffect
  useEffect(() => {
    if (!isSubmitted) return;

    // errors 객체의 첫 번째 값(에러 객체)을 가져옵니다.
    const firstError = Object.values(errors)[0];

    // 에러 객체가 존재하고, message 속성이 있으며, 그 값이 문자열일 경우에만 토스트 출력
    if (firstError && 'message' in firstError && typeof firstError.message === 'string') {
      appToast.warning({ message: firstError.message });
    }
  }, [errors, isSubmitted]);

  // 5. 폼 제출 핸들러
  const onSubmit = (data: ProfileEditSchemaValues) => {
    console.log(data);
    mutate(data, {
      onSuccess: () => {
        appToast.success({ message: '프로필이 성공적으로 수정되었습니다!' });
        navigate('/profile');
      },
    });
  };

  if (isProfileLoading) {
    return <LoadingDots fullscreen={true} />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/profile">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">프로필 수정</h1>
          <p className="text-muted-foreground">회원 정보를 수정하세요</p>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-1">
          <Card className="p-6 space-y-6 h-full">
            {/* 프로필 이미지 */}
            <div className="flex flex-col items-center">
              <Controller
                name="profileImg"
                control={control}
                render={({ field }) => (
                  <ProfileImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    defaultPreview="/images/default-profile.png"
                    size="lg"
                  />
                )}
              />
              <p className="text-sm text-muted-foreground mt-3 text-center">
                클릭하여 프로필 이미지 변경
              </p>
            </div>

            <div className="space-y-4">
              {/* 이름 */}
              <div className="space-y-2">
                <Label htmlFor="nickname">
                  이름 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nickname"
                  {...register('nickname')}
                  placeholder="이름을 입력하세요"
                  required
                />
                {errors.nickname && (
                  <p className="text-xs text-destructive">{errors.nickname.message}</p>
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex flex-col gap-3 pt-4">
              <Button type="submit" className="w-full" disabled={isPending}>
                <Save className="w-4 h-4 mr-2" />
                {isPending ? '저장 중...' : '저장하기'}
              </Button>
              <Button type="button" variant="outline" asChild className="w-full bg-transparent">
                <Link to="/profile">취소</Link>
              </Button>
            </div>
          </Card>
        </form>

        <div className="lg:col-span-1 space-y-6">
          {/* 개인화 설정 */}
          <Card className="p-6">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              개인화 설정
            </h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">일일 목표 설정</p>
                    <p className="text-sm text-muted-foreground">
                      하루에 완료할 투두 개수를 설정하세요
                    </p>
                    <Input
                      type="number"
                      placeholder="5"
                      className="mt-2 w-24"
                      min="1"
                      max="50"
                      defaultValue="5"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-blue-500/10">
                    <Trophy className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">업적 시스템</p>
                    <p className="text-sm text-muted-foreground">
                      투두 완료 시 보상과 업적을 받으세요
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <input type="checkbox" id="achievements" defaultChecked />
                      <Label htmlFor="achievements" className="cursor-pointer">
                        업적 활성화
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-orange-500/10">
                    <Zap className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">집중 모드</p>
                    <p className="text-sm text-muted-foreground">작업 시작 시 알림을 차단합니다</p>
                    <div className="flex items-center gap-2 mt-2">
                      <input type="checkbox" id="focus-mode" />
                      <Label htmlFor="focus-mode" className="cursor-pointer">
                        집중 모드 활성화
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 통계 카드 */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-blue-500/10">
            <h3 className="font-bold text-lg mb-4">이번 주 성과</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-white/50">
                <p className="text-2xl font-bold text-primary">24</p>
                <p className="text-xs text-muted-foreground">완료한 투두</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/50">
                <p className="text-2xl font-bold text-green-600">92%</p>
                <p className="text-xs text-muted-foreground">완료율</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/50">
                <p className="text-2xl font-bold text-blue-600">6일</p>
                <p className="text-xs text-muted-foreground">연속 달성</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/50">
                <p className="text-2xl font-bold text-orange-600">18시간</p>
                <p className="text-xs text-muted-foreground">총 작업 시간</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
