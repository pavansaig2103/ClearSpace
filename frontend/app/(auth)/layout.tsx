export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative z-10 grid min-h-screen place-items-center px-4 py-8">
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}

