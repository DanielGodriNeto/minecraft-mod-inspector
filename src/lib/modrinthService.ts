import type { ModrinthDependency } from "@/types";

interface ModrinthVersionResponse {
  id: string;
  project_id: string;
  version_number: string;
  game_versions: string[];
  loaders: string[];
  dependencies: ModrinthDependency[];
  date_published: string;
}

interface UpdateCheckResult {
  latestVersionId: string;
  latestVersionNumber: string;
  releaseDate: string;
  dependencies: {
    required: ModrinthDependency[];
    optional: ModrinthDependency[];
    incompatible: ModrinthDependency[];
  };
}

const MODRINTH_API_URL = "https://api.modrinth.com/v2/project";
const MODRINTH_USER_AGENT =
  "MinecraftModInspector/1.0.0 (suporte@modinspector.local)";

export async function checkModrinthUpdate(
  projectIdOrSlug: string,
  gameVersion: string,
  loader: string,
): Promise<UpdateCheckResult | null> {
  const url = new URL(
    `${MODRINTH_API_URL}/${encodeURIComponent(projectIdOrSlug)}/version`,
  );
  url.searchParams.set("game_versions", JSON.stringify([gameVersion]));
  url.searchParams.set("loaders", JSON.stringify([loader.toLowerCase()]));

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": MODRINTH_USER_AGENT,
      },
    });

    if (!response.ok) {
      return null;
    }

    const versions = (await response.json()) as ModrinthVersionResponse[];
    const latestVersion = versions[0];

    if (!latestVersion) {
      return null;
    }

    return {
      latestVersionId: latestVersion.id,
      latestVersionNumber: latestVersion.version_number,
      releaseDate: latestVersion.date_published,
      dependencies: {
        required: filterDependencies(latestVersion.dependencies, "required"),
        optional: filterDependencies(latestVersion.dependencies, "optional"),
        incompatible: filterDependencies(
          latestVersion.dependencies,
          "incompatible",
        ),
      },
    };
  } catch {
    return null;
  }
}

function filterDependencies(
  dependencies: ModrinthDependency[],
  dependencyType: ModrinthDependency["dependency_type"],
): ModrinthDependency[] {
  return dependencies.filter(
    (dependency) => dependency.dependency_type === dependencyType,
  );
}
