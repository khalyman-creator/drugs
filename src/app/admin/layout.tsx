export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="border-b border-gray-800 bg-gray-900 px-4 py-2 text-center text-xs font-medium uppercase tracking-wide text-gray-400">
        Admin Panel — Not part of the public store
      </div>
      {children}
    </div>
  );
}
