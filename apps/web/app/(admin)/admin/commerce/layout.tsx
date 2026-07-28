export default function CommerceAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="gift" data-density="compact">
      {children}
    </div>
  );
}
