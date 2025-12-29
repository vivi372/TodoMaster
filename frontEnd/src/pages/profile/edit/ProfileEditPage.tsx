'use client';

import type React from 'react';

import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Link } from 'react-router-dom';
import { Card } from '@/shared/ui/card';
import { ProfileImageUpload } from '@/shared/ui/ProfileImageUpload';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

export default function ProfileEditPage() {
  // 샘플 사용자 데이터
  const [formData, setFormData] = useState({
    name: '김투두',
    email: 'user@example.com',
    bio: '할 일 관리를 사랑하는 사람입니다.',
    phone: '010-1234-5678',
    profileImage: '/abstract-profile.png',
  });

  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileImageChange = (file: File | null, preview: string | null) => {
    setProfileImage(file);
    if (preview) {
      setFormData({
        ...formData,
        profileImage: preview,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
  };

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

      {/* 수정 폼 */}
      <form onSubmit={handleSubmit}>
        <Card className="p-6 space-y-6">
          {/* 프로필 이미지 */}
          <div className="flex flex-col items-center">
            {/* <ProfileImageUpload
              value={formData.profileImage}
              onChange={handleProfileImageChange}
              size="lg"
            /> */}
          </div>

          <div className="grid gap-6">
            {/* 이름 */}
            <div className="space-y-2">
              <Label htmlFor="name">
                이름 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="이름을 입력하세요"
                required
              />
            </div>

            {/* 이메일 */}
            <div className="space-y-2">
              <Label htmlFor="email">
                이메일 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="이메일을 입력하세요"
                required
              />
            </div>

            {/* 전화번호 */}
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="010-0000-0000"
              />
            </div>

            {/* 소개 */}
            <div className="space-y-2">
              <Label htmlFor="bio">소개</Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="자기소개를 입력하세요"
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? '저장 중...' : '저장하기'}
            </Button>
            <Button type="button" variant="outline" asChild className="flex-1 bg-transparent">
              <Link to="/profile">취소</Link>
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}
