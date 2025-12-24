import { MarkdownRenderer } from '@/features/terms/components/MarkdownRenderer';
import { TermsLayout } from '@/features/terms/components/TermsLayout';
import { LoadingOverlay } from '@/shared/ui/loading/LoadingOverlay';
import { useEffect, useState } from 'react';

export default function TermsPage() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/docs/terms.md')
      .then((res) => res.text())
      .then(setContent);
  }, []);

  return (
    <TermsLayout title="이용약관" lastUpdated="2025년 12월 21일">
      {content ? <MarkdownRenderer content={content} /> : <LoadingOverlay />}
    </TermsLayout>
  );
}
