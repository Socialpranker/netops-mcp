---
slug: netops-mcp-improvements
last_research_date: 2026-06-13
purpose: что отслеживать при будущих `update netops-mcp-improvements`
---

# Refresh targets — netops-mcp improvements

## Entities (отслеживать звёзды/активность/новые фичи)

| Entity | URL | На 2026-06-13 | Что мониторить |
|---|---|---|---|
| alpadalar/netops-mcp ⚠️ ТЁЗКА | github.com/alpadalar/netops-mcp | 11★, inactive 2.5мес | Ожил ли? Звёзды растут? Добавил WG/вердикты? Занял npm? |
| jsdelivr/globalping-mcp | github.com/jsdelivr/globalping-mcp-server | 58★, активен | Добавил local-режим? Вердикты? |
| labeveryday/network-mcp | github.com/labeveryday/network-mcp | 4★ | Ближайший local-first аналог — растёт? |
| npm-имя `netops-mcp` | registry.npmjs.org/netops-mcp | СВОБОДНО (404) | Занято ли? Кем? (Иваном надеюсь) |
| Socialpranker/netops-mcp | github.com/Socialpranker/netops-mcp | 0★, создан 2026-06-13 | Звёзды, листинги, релизы |

## Numbers (перепроверять)

- Масштаб экосистемы: ~17.8k репо topic:mcp-server, ~13.2k model-context-protocol (2026-06-13). Тренд?
- Builder:user ratio ~25:1 [S09] — обновился? Появились реальные usage-данные?
- Звёзды конкурентов из таблицы выше.

## Topic markers (каналы для re-discovery)

- GitHub: `gh search repos "network mcp"`, `--topic model-context-protocol --topic networking`, `gh search repos netops-mcp` (конфликт имён)
- Реестры: PulseMCP network-категория, glama.ai/mcp networking, awesome-mcp-servers секция Monitoring/Developer Tools
- HN Algolia: "MCP hype", "MCP vs bash", "MCP security" (Reddit был недоступен — попробовать снова)
- Anthropic: обновления MCP spec (транспорты, tool annotations SEP), MCPB-формат версии

## Hypotheses (финальный статус — пересматривать при update)

| H | Статус 2026-06-13 | Что изменит вывод |
|---|---|---|
| H1 discovery=барьер | ОСЛАБЛЕНА | Появление demand-данных в пользу/против |
| H2 19 tools норм, проблема описания | ПОДТВЕРЖДЕНА | Изменение рекомендаций Anthropic по tool-count |
| H3 stdio достаточно | ОПРОВЕРГНУТА (HTTP не нужен) | Новый remote-кейс или изменение спеки |
| H4 дифференциация=преимущество | ЧАСТИЧНА | Появление прямого конкурента ИЛИ доказательство спроса |

## Adversarial trigger watch

- Новые исследования про output-poisoning / indirect prompt injection в MCP (SAFE-MCP обновления)
- Изменился ли «зачем не bash» дебат (skills-over-MCP, Claude Code Bash-tool эволюция)
- Появились ли demand-side данные про local-first AI-диагностику (ломает несущую посылку D)
