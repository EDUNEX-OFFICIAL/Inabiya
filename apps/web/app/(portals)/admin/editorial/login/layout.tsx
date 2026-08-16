export default function EditorialLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="blog" data-density="compact" className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
