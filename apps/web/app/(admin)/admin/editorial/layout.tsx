export default function EditorialAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-theme="blog" data-density="compact">
      {children}
    </div>
  );
}
