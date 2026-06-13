---
id: S06
url: https://hanzilla.co/blog/mcp-onboarding-ten-agents-one-command/
title: Nobody Reads Your Setup Docs — Hanzilla
channel: blog
access: open
subquestion_ids: [ST1]
credibility: 4
recency: 5
bias: 4
date: 2026
---

# MCP Onboarding Friction: Критический анализ

**Главный тезис:** "Each step feels small. Together, they're the reason your tool has ten users instead of a thousand." Множество мелких friction points в MCP setup компаундируются до отказа.

**Конкретные friction points:**
- Разные config file locations у разных клиентов (Cursor vs Windsurf vs Claude Desktop)
- Разные JSON форматы и поддержка комментариев
- Platform-specific paths (Mac/Windows/Linux)
- Некоторые клиенты используют CLI вместо config files

**Паттерны, которые работают:**
1. **Automated Configuration** — сканировать машину, обнаружить установленные клиенты, автоматически писать конфиги. Не говорить что делать — делать за пользователя.
2. **Single-command install** — Nia (YC S25): `npx nia-wizard@latest` открывает браузер для auth, детектирует агентов, пишет конфиги. No manual config required.
3. **Skill files** — markdown-файлы в сотни строк, учат агента когда и как использовать инструменты. Distributed with server.

**Для netops-mcp:** добавить `npx netops-mcp --setup` wizard который автоматически находит Claude Desktop / Claude Code / Cursor config files и добавляет конфигурацию. Это 10x снижение friction по сравнению с ручным редактированием JSON.
