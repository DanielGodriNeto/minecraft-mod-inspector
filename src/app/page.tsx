import { UploadPanel } from "@/components/uploads/upload-panel";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-10 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Minecraft Mod Inspector
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Verifique seu modpack antes de jogar.
        </h1>
        <p className="max-w-2xl text-lg text-slate-600">
          Envie um arquivo ZIP para analisar mods, dependências e informações de compatibilidade.
        </p>
      </header>
      <UploadPanel />
    </main>
  );
}
