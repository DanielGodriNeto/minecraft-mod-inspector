const CURSEFORGE_API_URL = "https://api.curseforge.com/v1/mods";
const CURSEFORGE_BATCH_SIZE = 50;

interface CurseForgeFile {
  id: number;
  displayName?: string;
  fileName?: string;
  fileDate?: string;
  gameVersions?: string[];
  modLoader?: number;
}

interface CurseForgeFileIndex {
  gameVersion: string;
  fileId: number;
  filename?: string;
  modLoader?: number;
}

interface CurseForgeApiMod {
  id: number;
  name?: string;
  latestFiles?: CurseForgeFile[];
  latestFilesIndexes?: CurseForgeFileIndex[];
}

interface CurseForgeApiResponse {
  data?: CurseForgeApiMod[];
}

interface CurseForgeFileResponse {
  data?: CurseForgeFile[];
}

export interface CurseForgeResolvedMod {
  projectId: string;
  fileId: string;
  displayName: string;
  installedVersion: string;
  latestVersion: string;
  latestFileId: string;
  updateAvailable: boolean;
}

const resolvedModsCache = new Map<string, Promise<Map<string, CurseForgeResolvedMod>>>();

export function resolveCurseForgeMods(
  mods: Array<{ id: string; fileId?: string | number }>,
  gameVersion: string,
  loader: string,
): Promise<Map<string, CurseForgeResolvedMod>> {
  const cacheKey = JSON.stringify([
    mods.map((mod) => [mod.id, mod.fileId]),
    gameVersion,
    loader.toLowerCase(),
  ]);
  const cached = resolvedModsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const request = fetchResolvedMods(mods, gameVersion, loader);
  resolvedModsCache.set(cacheKey, request);
  return request;
}

async function fetchResolvedMods(
  mods: Array<{ id: string; fileId?: string | number }>,
  gameVersion: string,
  loader: string,
): Promise<Map<string, CurseForgeResolvedMod>> {
  const fallback = new Map(
    mods.map((mod) => [
      mod.id,
      createFallbackMod(mod.id, String(mod.fileId ?? "unknown")),
    ]),
  );
  const apiKey = process.env.CURSEFORGE_API_KEY;

  if (!apiKey) {
    return fallback;
  }

  const resolved = new Map<string, CurseForgeResolvedMod>();
  for (let index = 0; index < mods.length; index += CURSEFORGE_BATCH_SIZE) {
    const batch = mods.slice(index, index + CURSEFORGE_BATCH_SIZE);
    const apiMods = await fetchBatch(
      batch.map((mod) => Number(mod.id)).filter(Number.isSafeInteger),
      apiKey,
    );
    const apiFiles = await fetchFileBatch(
      batch.map((mod) => Number(mod.fileId)).filter(Number.isSafeInteger),
      apiKey,
    );

    for (const mod of batch) {
      const apiMod = apiMods.get(Number(mod.id));
      const fileId = String(mod.fileId ?? "unknown");
      resolved.set(
        mod.id,
        apiMod
          ? formatResolvedMod(
              apiMod,
              fileId,
              apiFiles.get(Number(fileId)),
              gameVersion,
              loader,
            )
          : createFallbackMod(mod.id, fileId),
      );
    }
  }

  return resolved;
}

async function fetchBatch(
  modIds: number[],
  apiKey: string,
): Promise<Map<number, CurseForgeApiMod>> {
  if (modIds.length === 0) {
    return new Map();
  }

  try {
    const response = await fetch(CURSEFORGE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ modIds }),
    });

    if (!response.ok) {
      return new Map();
    }

    const body = (await response.json()) as CurseForgeApiResponse;
    return new Map((body.data ?? []).map((mod) => [mod.id, mod]));
  } catch {
    return new Map();
  }
}

async function fetchFileBatch(
  fileIds: number[],
  apiKey: string,
): Promise<Map<number, CurseForgeFile>> {
  if (fileIds.length === 0) {
    return new Map();
  }

  try {
    const response = await fetch(`${CURSEFORGE_API_URL}/files`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ fileIds }),
    });

    if (!response.ok) {
      return new Map();
    }

    const body = (await response.json()) as CurseForgeFileResponse;
    return new Map((body.data ?? []).map((file) => [file.id, file]));
  } catch {
    return new Map();
  }
}

function formatResolvedMod(
  mod: CurseForgeApiMod,
  installedFileId: string,
  installedFile: CurseForgeFile | undefined,
  gameVersion: string,
  loader: string,
): CurseForgeResolvedMod {
  const knownInstalledFile = installedFile ?? mod.latestFiles?.find(
    (file) => String(file.id) === installedFileId,
  );
  const compatibleFiles = (mod.latestFilesIndexes ?? [])
    .filter((file) => file.gameVersion === gameVersion)
    .filter((file) => isCompatibleLoader(file.modLoader, loader));
  const latestFileIndex = compatibleFiles
    .map((file) => ({
      index: file,
      details: mod.latestFiles?.find((candidate) => candidate.id === file.fileId),
    }))
    .sort((left, right) => {
      const leftDate = left.details?.fileDate ?? "";
      const rightDate = right.details?.fileDate ?? "";
      return rightDate.localeCompare(leftDate) || right.index.fileId - left.index.fileId;
    })[0]?.index;
  const latestFile = mod.latestFiles?.find(
    (file) => file.id === latestFileIndex?.fileId,
  ) ?? mod.latestFiles?.find((file) => file.gameVersions?.includes(gameVersion));
  const latestFileId = String(latestFileIndex?.fileId ?? latestFile?.id ?? installedFileId);
  const installedVersion = formatFile(knownInstalledFile, installedFileId);
  const latestVersion = latestFileIndex?.filename ?? formatFile(latestFile, latestFileId);

  return {
    projectId: String(mod.id),
    fileId: installedFileId,
    displayName: mod.name ?? `Mod ${mod.id}`,
    installedVersion,
    latestVersion,
    latestFileId,
    updateAvailable: latestFileId !== installedFileId,
  };
}

function createFallbackMod(projectId: string, fileId: string): CurseForgeResolvedMod {
  return {
    projectId,
    fileId,
    displayName: `Mod ${projectId}`,
    installedVersion: `Arquivo ${fileId}`,
    latestVersion: `Arquivo ${fileId}`,
    latestFileId: fileId,
    updateAvailable: false,
  };
}

function formatFile(file: CurseForgeFile | undefined, fallbackId: string): string {
  return file?.displayName ?? file?.fileName ?? `Arquivo ${fallbackId}`;
}

function isCompatibleLoader(modLoader: number | undefined, loader: string): boolean {
  if (modLoader === undefined) {
    return true;
  }

  const loaderIds: Record<string, number> = {
    forge: 1,
    fabric: 4,
    quilt: 5,
    neoforge: 6,
  };
  return modLoader === loaderIds[loader.toLowerCase()];
}