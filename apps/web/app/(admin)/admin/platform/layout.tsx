export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="gift" data-density="compact">
      {children}
    </div>
  );
}
