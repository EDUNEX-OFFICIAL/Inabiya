export default function CmsLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="gift" data-density="compact" className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
