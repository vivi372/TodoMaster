import type React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Link } from 'react-router-dom';

interface TermsLayoutProps {
  children: React.ReactNode;
  title: string;
  lastUpdated?: string;
  backLink?: string;
}

export function TermsLayout({
  children,
  title,
  lastUpdated,
  backLink = '/signup',
}: TermsLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-background to-accent/20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to={backLink}>
            <Button variant="ghost" className="mb-4 -ml-4 hover:bg-primary/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              뒤로 가기
            </Button>
          </Link>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border-2 border-primary/20">
            <h1 className="text-4xl font-bold text-foreground mb-2">{title}</h1>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">
                최종 업데이트: <span className="font-medium">{lastUpdated}</span>
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 md:p-12 border-2 border-primary/20">
          <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:text-gray-700 prose-p:leading-relaxed prose-li:text-gray-700 prose-strong:text-gray-900 prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            문의사항이 있으시면{' '}
            <a
              href="mailto:support@todori.com"
              className="text-primary font-medium hover:underline"
            >
              support@todori.com
            </a>
            으로 연락주세요.
          </p>
        </div>
      </div>
    </div>
  );
}
