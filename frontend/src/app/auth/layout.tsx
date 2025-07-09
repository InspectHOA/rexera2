export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-rexera-gradient relative overflow-hidden">
      {/* Noise Texture */}
      <div className="absolute inset-0 z-0 bg-noise-texture opacity-20"></div>

      <div className="max-w-md w-full space-y-8 z-10 px-4">
        {children}
      </div>
    </div>
  );
}