export default function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-card rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow duration-300 group">
      <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-3 group-hover:bg-primary/30 transition-colors">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
