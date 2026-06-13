---
id: S66
url: https://manufact.com/blog/mcp-testing
title: Show HN: How We Made MCP Development Feel Good — Manufact
channel: industry-media
access: open
subquestion_ids: [ST4]
credibility: 4
recency: 5
bias: 3
date: 2026-05-12
---
# Manufact: What Makes MCP Development Painful

## Основные болезненные точки MCP DX

1. **Установка и конфигурация** — "Configuring MCPs in normal clients isn't easy. People complain installing them is hard."
2. **Тестирование** — нужно проверять не только отдельные инструменты, но и как агент использует последовательности вызовов
3. **Remote deployment** — деплой в production-клиентов (claude.ai, chatgpt.com) значительно сложнее локального тестирования
4. **Вариативность модели** — одна модель ведёт себя по-разному в разных клиентах при одинаковом промпте

## Что помогает

- **Inspector с HMR** (Hot Module Replacement) — live обновление tool definitions без перезапуска сессии
- **Tunnel фича** — тестирование на реальных клиентах через публичный URL без переустановки коннектора
- **Automated cross-client testing** — screenshot + session recording для кросс-платформенной верификации
- **CI/CD gate** — тесты MCP сервера могут блокировать деплой

## Вывод для netops

- Отсутствие HMR/hot-reload в netops — боль при разработке. Добавить логирование через stderr для дебага.
- Tunnel для тестирования на удалённых хостах — именно тот use case, где HTTP transport был бы полезен для netops.
- Автотесты инструментов (не только unit-тесты, но и "правильно ли LLM их вызывает") — нишевая, но реальная потребность.
