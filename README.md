# Minecraft Mod Inspector

Ferramenta Next.js para inspecionar modpacks de Minecraft, suas dependências e logs de validação.

## Criar o projeto do zero

Com Node.js 20.9 ou superior instalado:

```bash
npx create-next-app@latest minecraft-mod-inspector --ts --tailwind --eslint --app --src-dir --use-npm --import-alias '@/*'
cd minecraft-mod-inspector
npm install jszip @types/jszip
```

Para este repositório já criado, instale as dependências com:

```bash
npm install
```

## Desenvolvimento

```bash
npm run dev
```

A estrutura principal está em `src/`, com contratos em `src/types`, serviços e parsers em `src/lib`, componentes em `src/components` e rotas backend em `src/app/api`.