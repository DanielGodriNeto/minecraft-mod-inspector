import JSZip from "jszip";
import type { ModAnalysisReport, UnifiedModpack } from "@/types";

interface ExportMod {
  id: string;
  version: string;
  fileId?: string | number;
}

export async function exportUpdatedModpack(
  originalPack: UnifiedModpack,
  reports: Record<string, ModAnalysisReport>,
): Promise<void> {
  try {
    const mods = collectUpdatedMods(originalPack, reports);
    const manifest =
      originalPack.format === "modrinth"
        ? createModrinthManifest(originalPack, mods)
        : createCurseForgeManifest(originalPack, mods);
    const manifestName =
      originalPack.format === "modrinth"
        ? "modrinth.index.json"
        : "manifest.json";
    const filename =
      originalPack.format === "modrinth"
        ? "modpack-atualizado.mrpack"
        : "modpack-atualizado.zip";

    const archive = new JSZip();
    archive.file(manifestName, JSON.stringify(manifest, null, 2));
    const blob = await archive.generateAsync({ type: "blob" });

    triggerDownload(blob, filename);
  } catch (error) {
    console.error("Falha ao exportar o modpack atualizado:", error);
    throw new Error("Não foi possível exportar o modpack atualizado.", {
      cause: error,
    });
  }
}

function collectUpdatedMods(
  originalPack: UnifiedModpack,
  reports: Record<string, ModAnalysisReport>,
): ExportMod[] {
  const mods = originalPack.mods.map((mod) => {
    const report = reports[mod.id];
    const shouldUpdate =
      report?.status === "SAFE_UPDATE" ||
      report?.status === "CASCADING_REQUIRED";

    return {
      id: mod.id,
      version: shouldUpdate ? report.latestVersion : String(mod.fileId ?? "unknown"),
      fileId: mod.fileId,
    };
  });

  const existingIds = new Set(mods.map((mod) => mod.id));
  for (const report of Object.values(reports)) {
    if (report.status !== "MISSING_DEPENDENCY") {
      continue;
    }

    for (const requiredModId of report.requiredNewMods) {
      if (!existingIds.has(requiredModId)) {
        mods.push({ id: requiredModId, version: "unknown" });
        existingIds.add(requiredModId);
      }
    }
  }

  return mods;
}

function createModrinthManifest(
  originalPack: UnifiedModpack,
  mods: ExportMod[],
) {
  const loaderKey = {
    fabric: "fabric-loader",
    forge: "forge",
    neoforge: "neoforge",
    quilt: "quilt-loader",
  }[originalPack.loader];

  return {
    name: originalPack.name,
    versionId: `${originalPack.name}-updated`,
    dependencies: {
      minecraft: originalPack.gameVersion,
      [loaderKey]: originalPack.loaderVersion,
    },
    files: mods.map((mod) => ({
      path: `mods/${mod.id}-${mod.version}.jar`,
      downloads: [],
    })),
  };
}

function createCurseForgeManifest(
  originalPack: UnifiedModpack,
  mods: ExportMod[],
) {
  return {
    manifestType: "minecraftModpack",
    manifestVersion: 1,
    name: originalPack.name,
    version: "updated",
    minecraft: {
      version: originalPack.gameVersion,
      modLoaders: [
        {
          id: `${originalPack.loader}-${originalPack.loaderVersion}`,
          primary: true,
        },
      ],
    },
    files: mods.map((mod) => ({
      projectID: toNumericId(mod.id),
      fileID: toNumericId(mod.version, mod.fileId),
      required: true,
    })),
  };
}

function toNumericId(value: string, fallback?: string | number): number {
  const parsedValue = Number(value);
  if (Number.isSafeInteger(parsedValue) && parsedValue >= 0) {
    return parsedValue;
  }

  const parsedFallback = Number(fallback);
  return Number.isSafeInteger(parsedFallback) && parsedFallback >= 0
    ? parsedFallback
    : 0;
}

function triggerDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
