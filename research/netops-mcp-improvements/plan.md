---
slug: netops-mcp-improvements
created: 2026-06-13
updated: 2026-06-13
depth: deep
report_type: landscape
blocks: [tldr, scope, claim, mental-model, landscape-map, profile-card, white-spaces, evidence-for-against, data-table, prioritization, counter-arguments, open-questions, next-research, sources, metadata]
status: completed
version: initial
parent: null
time_box_target: ~3 hours
time_box_hard: 5 hours
---

# Plan — Как улучшить netops-mcp и сделать его удобнее

## 0. User context

- **Кто спрашивает / для кого:** Иван — автор netops-mcp, только что опубликовал v0.1 публично на GitHub (github.com/Socialpranker/netops-mcp). Опытный разработчик.
- **Зачем (мотив):** проект молодой, хочет понять куда вкладывать развитие — adoption + удобство для пользователей AI-ассистентов и разработчиков.
- **Что уже знает:** глубоко знает свой код (19 инструментов, stdio, TS/Node). MCP-экосистему и tool-design best practices — частично.
- **Как будет использовать отчёт:** приоритизированный роадмап на v0.2+, решения что делать дальше.
- **Constraints на отчёт:** русский. Приоритизация обязательна (пользователь явно просил «расставь приоритеты»). Анти-слоп: без generic-советов «добавьте тесты/доки».

## 1. Time-box

- **Target completion:** ~3 часа (deep)
- **Hard deadline:** 5 часов от старта
- **Если превысили:** синтезировать с тем что есть, пометить confidence: low по нерешённым

---

# SCOPE

## 2. Главный вопрос

Куда вложить следующие итерации разработки netops-mcp (local-first network diagnostics & WireGuard/proxy MCP-сервер, 19 инструментов, stdio, TS/Node), чтобы максимально повысить: (a) adoption — находимость и удержание; (b) LLM-UX — точность и эффективность вызова инструментов ассистентом; (c) capability — закрытие реальных диагностических нужд. С расстановкой приоритетов.

## 3. Решение, которое поддерживает

- **Что решаем:** приоритизированный роадмап улучшений v0.2+.
- **Что меняется от ответа:** какие фичи/изменения брать первыми, что отложить, что не делать вообще.
- **Если ничего не меняется:** N/A — решение реальное, влияет на план работ.

## 4. Acceptance criteria

- [ ] `2026-06-13_landscape.md` содержит все блоки жанра
- [ ] H1-H4 получили status (confirmed / contradicted / partial / insufficient)
- [ ] Карта 4+ конкурирующих/смежных network-MCP с profile cards (H4)
- [ ] Свод MCP tool-design best practices применительно к 19 инструментам netops (H2)
- [ ] Разбор adoption-механики MCP: реестры, discovery, onboarding (H1)
- [ ] Приоритизированный список улучшений (impact × effort), 3 тира
- [ ] Counter-arguments ≥3
- [ ] Adversarial pass пройден
- [ ] Все sources/NN.md имеют channel + access

## 5. Discovered existing

**Существующие research-папки:** нет — ресёрч initial.
**Memory entries:** проектного memory у netops-mcp нет (отдельный от Sidius проект).
**CLAUDE.md project context:** проектного CLAUDE.md нет.
**Решение:** initial research.

## 6. Глоссарий ресёрча

- **MCP** — Model Context Protocol (Anthropic), протокол подключения инструментов/данных к LLM-ассистентам.
- **Tool** — в смысле MCP: именованная функция со схемой входа, которую вызывает LLM. У netops 19 штук.
- **stdio transport** — MCP-сервер общается через stdin/stdout локального процесса (vs HTTP/SSE для удалённого).
- **Local-first** — диагностика запускается с машины пользователя/внутри его сети, не с удалённого probe. Ключевое позиционирование netops.
- **Tool-selection** — задача LLM выбрать правильный инструмент из набора; деградирует при слишком большом/нечётком наборе.
- **MCP registry** — каталог MCP-серверов для discovery (официальный реестр Anthropic, glama.ai, smithery, mcp.so, awesome-mcp-servers и т.п.). НЕ путать с npm.
- **Adoption** — находимость + установка + удержание пользователей.

---

# STRUCTURE

## 7. Жанр отчёта

**landscape** (с элементами decision/prioritization) — почему: вопрос = «карта возможностей улучшения + что делать первым». Нужны profile-cards конкурентов, white-spaces (чего нет), и явная приоритизация. Не чистый decision (не «X или Y»), не чистый qa.

## 8. Блоки отчёта с rationale

| Порядок | Блок | Зачем здесь |
|---|---|---|
| 1 | tldr [F1] | всегда |
| 2 | scope [F3] | границы: что считаем улучшением, на какой версии |
| 3 | claim [F5] | главный тезис-рекомендация |
| 4 | mental-model [E1] | как устроена adoption-воронка MCP-сервера (discovery→install→first-run→retention) |
| 5 | landscape-map [M1] | карта поля network/devops MCP-серверов |
| 6 | profile-card [M2] ×N | конкуренты/смежные: что делают, чем отличаются (H4) |
| 7 | white-spaces [M5] | чего нет ни у кого / чего нет у netops (H3, capability gaps) |
| 8 | evidence-for-against [V2] | по каждой гипотезе FOR/AGAINST |
| 9 | data-table [A1] | tool-design: 19 инструментов × оценка (консолидировать? H2) |
| 10 | prioritization [A-custom] | impact×effort матрица улучшений, 3 тира |
| 11 | counter-arguments [Z1] | всегда deep, ≥3 |
| 12 | open-questions [Z2] | что осталось неясным |
| 13 | next-research [Z3] | 2-3 следующих |
| 14 | sources [Z5] | карта источников |
| 15 | metadata [F8] | служебное |

## 9. Гипотезы

- **H1:** Главный барьер adoption — discovery + первый запуск (отсутствие в MCP-реестрах, npx cold-start, нет «работает за 60 секунд»), а не нехватка фич.
- **H2:** 19 инструментов — близко к/выше порога, где LLM-tool-selection деградирует; выигрыш от консолидации + лучших описаний больше, чем от новых инструментов.
- **H3:** Для реального использования stdio-only — узкое место; HTTP/SSE transport важнее новых диагностик. (Может быть опровергнута: для local-first remote может быть не нужен.)
- **H4:** netops-mcp дифференцирован слабо относительно существующих network/devops MCP; без чёткого позиционирования adoption страдает сильнее, чем от нехватки фич.

## 10. Risk register

| ID | Risk | Prob | Impact | Mitigation |
|---|---|---|---|---|
| R1 | MCP best-practices ещё формируются, мало авторитетных источников | medium | high | опереться на офиц. доки Anthropic/MCP + сильные практические репо, признать там где consensus слабый |
| R2 | Конкурентов-network-MCP мало/трудно найти → H4 insufficient | medium | medium | искать в реестрах (glama/smithery/mcp.so), GitHub topics, awesome-mcp; смежные (shell/devops MCP) считать тоже |
| R3 | Тема быстро меняется (MCP молодой) → recency критична | high | medium | приоритет источникам 2025-2026, date filters |
| R4 | Соблазн generic-советов вместо специфичных netops | medium | high | каждый вывод привязывать к конкретике netops (19 tools, stdio, local-first) |

---

# EXECUTION

## 11. Подтемы ↔ Блоки mapping

| Subtopic | Под блоки | Кому |
|---|---|---|
| ST1: MCP adoption-механика (реестры, discovery, distribution, onboarding, что отпугивает) | E1, M1, A-prioritization | Explore #1 (Haiku) |
| ST2: MCP tool-design best practices (кол-во инструментов, описания, схемы, вывод для LLM, error-handling) | A1, V2(H2), white-spaces | Explore #2 (Sonnet — глубокие доки) |
| ST3: Конкуренты — network/devops/infra MCP-серверы (что есть, чем отличаются, gaps) | M1, M2×N, M5 | Explore #3 (Haiku — веер по реестрам) |
| ST4: Транспорты MCP + DX-тренды (stdio vs HTTP/SSE, packaging, DXT/desktop extensions, конфигурация) | V2(H3), white-spaces | Explore #4 (Sonnet) |
| ST5: netops-специфичные capability gaps (mtr, IPv6, eBPF, cloud, observability) vs реальные network-диагностич. нужды | M5, A-prioritization | main thread + Explore #3 overflow |

## 12. Information sourcing strategy

(заполняется на Phase 4.0 Source Dispatch)

## 13. Critical opposition queries

- "too many MCP tools" / "MCP tool overload" / "LLM tool selection degradation many tools"
- "MCP server adoption problems" / "why MCP servers fail" / "MCP criticism"
- "MCP local server security risks" / "stdio MCP limitations"
- "network diagnostics MCP" competitors — целевой поиск что уже существует
- "do users actually use MCP servers" / MCP hype vs reality

## 14. Stop-criteria

- H1-H4 покрыты ≥3 разнотипными источниками каждая
- ≥4 типа источников (офиц. доки / awesome-репо+код / отраслевые медиа+блоги / форумы+обсуждения)
- ≥3 канала
- Целевой поиск оппозиции выполнен
- Нет роста новой информации в последних 3-5 источниках

---

# TRACKING

## 15. Notes during research

- 2026-06-13 старт — план записан, иду в Phase 3.5 capability discovery + 4.0 dispatch.
- 2026-06-13 — 4 агента собрали 61 источник (S01-S89). H1-H4 покрыты ≥3 разнотипными.
- 2026-06-13 — Reddit блокировал API во всех 4 агентах → запущен 5-й агент на opposition (HN/блоги) + верификация. Opposition собран (7 контр-аргументов).
- 2026-06-13 ⚠️ КРИТИЧНО: найден тёзка alpadalar/netops-mcp (11★, ~80% overlap, remote-Docker, inactive 2.5мес). Конфликт имён на discovery-слое. [S87]
- 2026-06-13 — adversarial pass на Opus (читал РЕАЛЬНЫЙ код tools.ts/guard.ts) развернул H1/H4, усилил H2. Score рамки 2.5/5 → главная уязвимость: спрос не валидирован, «зачем не bash» не отвечен для голых проб.
- 2026-06-13 ✅ верифицировано: npm-имя `netops-mcp` СВОБОДНО (404) → занять немедленно, не forced-rename. Output-poisoning ПОДТВЕРЖДЁН в коде (tools.ts:84 TXT дословно, tools.ts:209 hop-hostnames дословно) → реальная незакрытая дыра.
- Stop-criteria выполнены. Перехожу к синтезу.

## 16. Update changelog

(initial — не заполняется)

---

## Slug
netops-mcp-improvements
