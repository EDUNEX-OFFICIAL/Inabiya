export default function CreatorAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="creator" data-density="compact">
      {children}
    </div>
  );
}
