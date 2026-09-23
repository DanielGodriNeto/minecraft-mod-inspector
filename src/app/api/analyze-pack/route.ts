import { NextResponse } from "next/server";
import type { InstalledMod } from "@/types";
import { analyzeModpack } from "@/lib/dependencyResolver";
import { parseModpackFile } from "@/lib/modpackParser";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileEntry = formData.get("file");

    if (!fileEntry || typeof fileEntry === "string") {
      return NextResponse.json(
        { error: "O campo 'file' é obrigatório e deve conter um arquivo." },
        { status: 400 },
      );
    }

    const packInfo = await parseModpackFile(await fileEntry.arrayBuffer());
    const gameVersion = getFormValue(formData, "gameVersion") ?? packInfo.gameVersion;
    const loader = getFormValue(formData, "loader") ?? packInfo.loader;
    const installedMods: InstalledMod[] = packInfo.mods.map((mod) => ({
      id: mod.id,
      currentVersion: mod.fileId === undefined ? "unknown" : String(mod.fileId),
    }));

    const reports = await analyzeModpack(installedMods, gameVersion, loader);

    return NextResponse.json(
      {
        packInfo,
        reports: Object.fromEntries(reports),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Falha ao analisar o modpack.",
      },
      { status: 500 },
    );
  }
}

function getFormValue(formData: FormData, fieldName: string): string | undefined {
  const value = formData.get(fieldName);
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
