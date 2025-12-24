'use client';

import { MarkdownRenderer } from '@/features/terms/components/MarkdownRenderer';
import { TermsLayout } from '@/features/terms/components/TermsLayout';
import { LoadingOverlay } from '@/shared/ui/loading/LoadingOverlay';
import { useState, useEffect } from 'react';

export default function PrivacyPage() {
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch('/docs/privacy-policy.md')
      .then((res) => res.text())
      .then((text) => setContent(text))
      .catch((err) => console.error('Failed to load privacy policy:', err));
  }, []);

  return (
    <TermsLayout title="개인정보처리방침" lastUpdated="2025년 12월 21일">
      {content ? <MarkdownRenderer content={content} /> : <LoadingOverlay />}
    </TermsLayout>
  );
}
