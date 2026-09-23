# 🔍 Minecraft Modpack Inspector

Uma aplicação web de elevado desempenho desenvolvida para analisar *modpacks* de Minecraft, detetar conflitos ou atualizações em cascata nas dependências e diagnosticar registos de erro (*crash logs*) de servidores e clientes.

---

## 🚀 Funcionalidades

- **📥 Ingestão Flexível de Ficheiros:** Suporte *drag-and-drop* para ficheiros de *modpack* (`.zip`, `.mrpack`, `.json`) e registos de erro (`.log`, `.txt`).
- **🧩 Resolução de Dependências em Largura (BFS):** Motor de análise recursiva que identifica dependências em falta, versões incompatíveis e atualizações necessárias via API do Modrinth.
- **⚡ Cache em Memória Otimizada:** Redução drástica de chamadas de rede e prevenção de *rate limiting* na API do Modrinth durante a verificação de múltiplos *mods*.
- **🛠️ Diagnóstico Automático de Crash Logs:** Analisador baseado em *Regex* para identificar instantaneamente falhas de *Mixin*, dependências ausentes e incompatibilidades de versão do Java.
- **📊 Painel Interativo (Dashboard):** Visualização clara com *badges* de estado, filtros dinâmicos e rastreamento de dependências.
- **📦 Exportação de Modpacks:** Possibilidade de descarregar o manifesto atualizado com as correções de dependências aplicadas.

---

## 🛠️ Tecnologias Utilizadas

| Categoria | Tecnologia |
| :--- | :--- |
| **Framework Frontend** | [Next.js](https://nextjs.org/) (App Router, React 19) |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) |
| **Estilização** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Processamento de Ficheiros** | [JSZip](https://stuk.github.io/jszip/) |
| **Integração de APIs** | [Modrinth API v2](https://docs.modrinth.com/) |
| **Qualidade de Código** | ESLint & TypeScript `tsc` |

---

## 📋 Pré-requisitos

Esta aplicação requer o **Node.js 20.0.0 ou superior** devido aos vínculos nativos exigidos pelo Tailwind CSS v4 (`@tailwindcss/oxide`).

Se utiliza o **NVM** (*Node Version Manager*), ative a versão correta com:

```bash
nvm install 20
nvm use 20
```

---

## 🔧 Instalação e Execução Local

1. **Clonar o repositório:**
   ```bash
   git clone [https://github.com/YOUTBMAT/minecraft-mod-inspector.git](https://github.com/YOUTBMAT/minecraft-mod-inspector.git)
   cd minecraft-mod-inspector
   ```

2. **Instalar as dependências:**
   ```bash
   npm install
   ```

3. **Iniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Aceder no navegador:**
   Abra [http://localhost:3000](http://localhost:3000) para utilizar a aplicação.

---

## 📂 Estrutura do Projeto

```text
minecraft-mod-inspector/
├── src/
│   ├── app/                # Rotas do Next.js App Router e API handlers
│   │   ├── api/            # Endpoints (/api/analyze-pack, /api/analyze-log)
│   │   ├── globals.css     # Estilos globais do Tailwind CSS
│   │   └── page.tsx        # Página principal com os componentes
│   ├── components/         # Componentes React da interface
│   │   ├── Dashboard.tsx   # Painel de estatísticas e listagem de mods
│   │   └── FileUploader.tsx# Zona de arrastar e largar ficheiros
│   ├── lib/                # Módulos de lógica de negócio
│   │   ├── crashLogParser.ts  # Parser Regex para logs de erro
│   │   ├── dependencyResolver.ts # Algoritmo BFS para dependências
│   │   ├── modpackExporter.ts    # Gerador do manifesto atualizado
│   │   ├── modpackParser.ts      # Leitor de ficheiros ZIP/MRPACK
│   │   └── modrinthService.ts    # Cliente HTTP com cache da API Modrinth
│   └── types/              # Definições de tipos TypeScript
├── package.json
├── next.config.ts
└── tsconfig.json
```

---

## 📜 Licença

Este projeto está sob a licença [MIT](LICENSE).