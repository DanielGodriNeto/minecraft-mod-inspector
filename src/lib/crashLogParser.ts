import type { CrashAnalysisResult } from "@/types";

const JAVA_CLASS_VERSIONS: Record<string, string> = {
  "52.0": "Java 8",
  "55.0": "Java 11",
  "61.0": "Java 17",
  "65.0": "Java 21",
};

export function parseCrashReport(logContent: string): CrashAnalysisResult {
  const javaMismatch = detectJavaVersionMismatch(logContent);
  if (javaMismatch) {
    return javaMismatch;
  }

  const missingDependency = detectMissingDependency(logContent);
  if (missingDependency) {
    return missingDependency;
  }

  const mixinConflict = detectMixinConflict(logContent);
  if (mixinConflict) {
    return mixinConflict;
  }

  return {
    type: "UNKNOWN",
    title: "Causa do crash não identificada",
    details: "O log não correspondeu aos padrões conhecidos de diagnóstico.",
    recommendation:
      'Procure pelas linhas que contêm "Caused by:" para encontrar a causa original do erro.',
  };
}

function detectJavaVersionMismatch(
  logContent: string,
): CrashAnalysisResult | null {
  if (!/UnsupportedClassVersionError/i.test(logContent)) {
    return null;
  }

  const versionMatch = logContent.match(
    /class file version\s+([\d.]+)[\s\S]*?(?:only recognizes class file versions up to|recognizes class file versions up to)\s+([\d.]+)/i,
  );

  if (!versionMatch) {
    return {
      type: "JAVA_VERSION_MISMATCH",
      title: "Versão do Java incompatível",
      details: "O Java em execução não consegue carregar uma classe compilada para uma versão mais recente.",
      recommendation:
        "Altere a versão do Java configurada no launcher para uma versão compatível com o modpack.",
    };
  }

  const requiredVersion = formatJavaVersion(versionMatch[1]);
  const currentVersion = formatJavaVersion(versionMatch[2]);

  return {
    type: "JAVA_VERSION_MISMATCH",
    title: "Versão do Java incompatível",
    details: `O modpack exige ${requiredVersion}, mas o launcher está usando ${currentVersion}.`,
    recommendation:
      `Configure o launcher para usar ${requiredVersion} ou uma versão posterior compatível com o modpack.`,
  };
}

function detectMissingDependency(
  logContent: string,
): CrashAnalysisResult | null {
  const fabricMatch = logContent.match(
    /Mod\s+'([^']+)'\s+requires\s+.+?\s+of\s+mod\s+'([^']+)',\s+which\s+is\s+missing!/i,
  );

  if (fabricMatch) {
    return createMissingDependencyResult(
      fabricMatch[1],
      fabricMatch[2],
      fabricMatch[0],
    );
  }

  const forgeMatch = logContent.match(
    /Mod\s+['"]?([\w.-]+)['"]?\s+requires\s+(?:version\s+)?(?:mod\s+)?([\w.-]+)\s+[\w.+-]+\s+or\s+above/i,
  );

  if (forgeMatch) {
    return createMissingDependencyResult(
      forgeMatch[1],
      forgeMatch[2],
      forgeMatch[0],
    );
  }

  return null;
}

function detectMixinConflict(logContent: string): CrashAnalysisResult | null {
  const mixinErrorMatch = logContent.match(
    /(?:MixinTransformationError|CriticalInjectionError)[\s\S]*/i,
  );

  if (!mixinErrorMatch) {
    return null;
  }

  const mixinFileMatch = logContent.match(
    /\[([\w.-]+)\.mixins\.json:/i,
  );
  const suspectedMod = mixinFileMatch?.[1];

  return {
    type: "MIXIN_CONFLICT",
    title: "Conflito de Mixin detectado",
    ...(suspectedMod ? { suspectedMod } : {}),
    details: getRelevantLine(mixinErrorMatch[0]),
    recommendation:
      "Verifique a compatibilidade do mod identificado com os demais mods e atualize, remova ou ajuste o mod conflitante.",
  };
}

function createMissingDependencyResult(
  requestingMod: string,
  missingMod: string,
  matchedMessage: string,
): CrashAnalysisResult {
  return {
    type: "MISSING_DEPENDENCY",
    title: "Dependência ausente",
    suspectedMod: missingMod,
    details: `${requestingMod} requer ${missingMod}. Mensagem detectada: ${matchedMessage}`,
    recommendation: `Instale ${missingMod} em uma versão compatível com ${requestingMod} e com o mod loader usado pelo modpack.`,
  };
}

function formatJavaVersion(classVersion: string): string {
  return JAVA_CLASS_VERSIONS[classVersion] ?? `Java (class file ${classVersion})`;
}

function getRelevantLine(text: string): string {
  return text.split(/\r?\n/, 1)[0].trim();
}
