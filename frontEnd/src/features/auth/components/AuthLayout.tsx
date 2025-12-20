import type React from 'react';
import { CalendarDays, ListChecks, KanbanSquare, Zap } from 'lucide-react';
import FeatureItem from './FeatureItem';
import FeatureCard from './FeatureCard';
import HaruLog from '@/shared/ui/HaruLog';
import { motion, type Variants } from 'framer-motion';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}
// Right Side 애니메이션 Variants 정의
const formVariants: Variants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
};

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex overflow-x-hidden">
      {/* Left side - Branding (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-primary/30 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/40 rounded-full blur-3xl" />
        <div className="absolute bottom-32 left-10 w-48 h-48 bg-accent/50 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-card/30 rounded-full blur-xl" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <HaruLog />
            </div>
            <span className="text-3xl font-bold text-foreground">하루로그</span>
          </div>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-bold text-foreground leading-tight text-balance">
              할 일을 더 쉽고,
              <br />더 즐겁게 관리하세요
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-md">
              깔끔한 인터페이스로 일정을 한눈에 파악하고, 카테고리별로 체계적으로 관리해보세요.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <FeatureItem text="드래그 앤 드롭으로 쉬운 일정 관리" />
            <FeatureItem text="캘린더 뷰로 한눈에 보는 일정" />
            <FeatureItem text="팀원과 함께하는 협업 기능" />
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4">
          <FeatureCard icon={CalendarDays} title="스마트 캘린더" description="일정을 한눈에" />
          <FeatureCard icon={ListChecks} title="할 일 관리" description="날짜별로 정리" />
          <FeatureCard icon={KanbanSquare} title="진행 상태 관리" description="한눈에 파악" />
          <FeatureCard icon={Zap} title="빠른 시작" description="간편한 접근" />
        </div>
      </div>

      {/* Right side - Form (motion.div 적용) */}
      <motion.div
        className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12"
        // 애니메이션 Variants 적용
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <HaruLog />
            </div>
            <span className="text-2xl font-bold text-foreground">하루로그</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
            <p className="text-muted-foreground mt-2">{subtitle}</p>
          </div>

          {children}
        </div>
      </motion.div>
    </div>
  );
}
