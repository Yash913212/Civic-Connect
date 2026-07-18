import "./loading-keyframes.css";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />

      {/* Logo */}
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-[0_0_40px_rgba(var(--primary),0.3)] animate-pulse">
          <span className="text-2xl font-bold text-white">CC</span>
        </div>
      </div>

      {/* Animated dots */}
      <div className="flex items-center gap-2 mb-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2.5 h-2.5 rounded-full bg-primary"
            style={{
              animation: `loading-bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <p className="text-sm text-muted-foreground animate-pulse font-medium">
        Loading...
      </p>
    </div>
  );
}
