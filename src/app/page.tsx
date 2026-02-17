export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">L10N Tracker</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Localization Management Application
        </p>
        <div className="flex flex-col gap-4">
          <div className="p-6 border rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">✅ Setup Complete</h2>
            <p className="text-muted-foreground">
              Next.js + Prisma + SQLite is ready to use
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Next step: Implement Dashboard and API Routes</p>
          </div>
        </div>
      </div>
    </main>
  );
}
