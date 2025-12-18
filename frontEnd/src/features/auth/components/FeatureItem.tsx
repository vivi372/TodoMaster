import { CheckCircle2 } from 'lucide-react';

export default function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-primary/50 flex items-center justify-center">
        <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
      </div>
      <span className="text-foreground font-medium">{text}</span>
    </div>
  );
}
