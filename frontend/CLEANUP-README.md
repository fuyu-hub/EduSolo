# EduSolo – Limpeza de Códigos Depreciados e Não Utilizados

Este documento registra as alterações planejadas e executadas para organizar o projeto, removendo arquivos depreciados/não utilizados e pequenos itens de cruft.

## Escopo
- App: `frontend/` (Vite + React + TS)
- Alias TS: `@/*` → `src/*`
- Rotas definidas em `src/App.tsx`

## Resumo das decisões
- Manter páginas Mobile: são usadas via `MobileModuleWrapper` e importações diretas (ex.: Granulometria).
- Manter bibliotecas de exemplos `src/lib/exemplos-*.ts`: são referenciadas pelos diálogos de exemplos e páginas.
- Manter pastas `components/*` e `modules/*`: ambas possuem importações ativas.

## Itens a remover
1) `src/pages/Index.tsx`
- Motivo: não está roteada em `App.tsx` e não há referências.
- Impacto: nenhum (homepage é o `Dashboard`).

2) `bun.lockb` (na raiz do frontend)
- Motivo: o projeto usa npm (`package-lock.json`). O lock do Bun é cruft e pode confundir ambientes.
- Impacto: nenhum para o build atual.

3) `src/pages/modules/` (diretório vazio)
- Motivo: não utilizado.
- Impacto: nenhum.

Observação: Build artifacts em `frontend/dist/` devem permanecer ignorados pelo Git (já coberto no `.gitignore`). Caso existam arquivos rastreados por engano, recomenda-se removê-los do versionamento.

## Verificações pós-limpeza
- Lint: `npm run lint`
- Build: `npm run build`
- Smoke test (local): `npm run dev`

## Como reverter
- Se os arquivos foram removidos em um commit isolado, usar `git revert <commit>`.
- Ou restaurar diretamente: `git checkout -- <caminho/arquivo removido>`.

## Changelog (planejado)
- Removido `src/pages/Index.tsx` por não ser referenciado.
- Removido `bun.lockb` (lockfile de Bun) para padronizar com npm.
- Removido diretório vazio `src/pages/modules/`.

## Notas adicionais
- `.gitignore` já cobre `dist/` e `bun.lockb`. Nenhuma alteração necessária.
- Caso deseje, podemos integrar uma checagem automatizada de imports não utilizados (ex.: ts-prune) para futuras limpezas.
