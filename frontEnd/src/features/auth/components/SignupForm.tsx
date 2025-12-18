'use client';

import type React from 'react';
import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Check, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Checkbox } from '@/shared/ui/checkbox';
import { Button } from '@/shared/ui/button';

export function SignupForm() {
  const navgate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const passwordRequirements = [
    { label: '8자 이상', met: formData.password.length >= 8 },
    { label: '영문 포함', met: /[a-zA-Z]/.test(formData.password) },
    { label: '숫자 포함', met: /[0-9]/.test(formData.password) },
    { label: '특수문자 포함', met: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
  ];

  const passwordsMatch =
    formData.password === formData.confirmPassword && formData.confirmPassword !== '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo, redirect to login
    navgate('/login');
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium">
          이름
        </Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="name"
            type="text"
            placeholder="홍길동"
            className="pl-10 h-12 bg-card border-border"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          이메일
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="hello@example.com"
            className="pl-10 h-12 bg-card border-border"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          비밀번호
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className="pl-10 pr-10 h-12 bg-card border-border"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {formData.password && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {passwordRequirements.map((req) => (
              <div
                key={req.label}
                className={`flex items-center gap-1.5 text-xs ${req.met ? 'text-green-600' : 'text-muted-foreground'}`}
              >
                {req.met ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                {req.label}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          비밀번호 확인
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            className={`pl-10 pr-10 h-12 bg-card border-border ${
              formData.confirmPassword && !passwordsMatch ? 'border-destructive' : ''
            }`}
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {formData.confirmPassword && !passwordsMatch && (
          <p className="text-xs text-destructive">비밀번호가 일치하지 않습니다</p>
        )}
      </div>

      <div className="flex items-start gap-2 pt-2">
        <Checkbox
          id="terms"
          checked={formData.agreeTerms}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, agreeTerms: checked as boolean })
          }
          className="mt-0.5"
        />
        <Label
          htmlFor="terms"
          className="text-sm text-muted-foreground cursor-pointer leading-relaxed"
        >
          <Link to="/terms" className="text-foreground font-medium hover:underline">
            이용약관
          </Link>{' '}
          및{' '}
          <Link to="/privacy" className="text-foreground font-medium hover:underline">
            개인정보처리방침
          </Link>
          에 동의합니다
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
        disabled={isLoading || !formData.agreeTerms}
      >
        {isLoading ? '가입 중...' : '회원가입'}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-muted-foreground">또는</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" className="h-12 bg-card hover:bg-accent">
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google
        </Button>
        <Button type="button" variant="outline" className="h-12 bg-card hover:bg-accent">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          GitHub
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="text-foreground font-semibold hover:underline">
          로그인
        </Link>
      </p>
    </form>
  );
}
