'use client';

import type React from 'react';
import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Check, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Checkbox } from '@/shared/ui/checkbox';
import { Button } from '@/shared/ui/button';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

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
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4"
      // 🟢 최상위 컨테이너 Variants 적용
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* 1. 이름 필드 블록 */}
      <motion.div className="space-y-2" variants={itemVariants}>
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
      </motion.div>

      {/* 2. 이메일 필드 블록 */}
      <motion.div className="space-y-2" variants={itemVariants}>
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
      </motion.div>

      {/* 3. 비밀번호 필드 및 유효성 검사 블록 */}
      <motion.div className="space-y-2" variants={itemVariants}>
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
        {/* 비밀번호 요구사항 목록에도 애니메이션 적용 가능 */}
        {formData.password && (
          <motion.div
            className="grid grid-cols-2 gap-2 mt-2"
            variants={itemVariants} // 같은 variants를 사용하여 부드럽게 나타남
          >
            {/* ... (요구사항 목록) */}
            {passwordRequirements.map((req) => (
              <div
                key={req.label}
                className={`flex items-center gap-1.5 text-xs ${req.met ? 'text-green-600' : 'text-muted-foreground'}`}
              >
                {req.met ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                {req.label}
              </div>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* 4. 비밀번호 확인 필드 블록 */}
      <motion.div className="space-y-2" variants={itemVariants}>
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
      </motion.div>

      {/* 5. 약관 동의 블록 */}
      <motion.div className="flex items-start gap-2 pt-2" variants={itemVariants}>
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
      </motion.div>

      {/* 6. 회원가입 버튼 블록 */}
      <motion.div variants={itemVariants}>
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground mt-4"
          disabled={isLoading || !formData.agreeTerms}
        >
          {isLoading ? '가입 중...' : '회원가입'}
        </Button>
      </motion.div>

      {/* 7. 구분선 (또는) 블록 */}
      <motion.div className="relative my-6" variants={itemVariants}>
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-background text-muted-foreground">또는</span>
        </div>
      </motion.div>

      {/* 8. 소셜 로그인 버튼 블록 */}
      <motion.div className="grid grid-cols-2 gap-3" variants={itemVariants}>
        {/* ... (Google 버튼) */}
        <Button type="button" variant="outline" className="h-12 bg-card hover:bg-accent">
          {/* ... (Google SVG) ... */}
          Google
        </Button>
        {/* ... (GitHub 버튼) */}
        <Button type="button" variant="outline" className="h-12 bg-card hover:bg-accent">
          {/* ... (GitHub SVG) ... */}
          GitHub
        </Button>
      </motion.div>

      {/* 9. 로그인 링크 블록 */}
      <motion.p className="text-center text-sm text-muted-foreground mt-6" variants={itemVariants}>
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="text-foreground font-semibold hover:underline">
          로그인
        </Link>
      </motion.p>
    </motion.form>
  );
}
