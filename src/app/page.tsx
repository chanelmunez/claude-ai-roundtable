import { RoundtableInterface } from '@/components/roundtable/roundtable-interface';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b border-border bg-primary/95 backdrop-blur supports-[backdrop-filter]:bg-primary/90">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <span className="text-white font-bold text-xl">AI</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">AI Roundtable</h1>
              <p className="text-primary-foreground/80 text-sm">
                Dynamic conversations between multiple AI models
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interface */}
      <main className="pt-6">
        <RoundtableInterface />
      </main>
    </div>
  );
}
