---
id: S53
url: https://github.com/QuantGeekDev/docker-mcp
title: Docker MCP Server (QuantGeekDev)
channel: github-code
access: open
subquestion_ids: [ST3]
credibility: 4
recency: 4
bias: 1
date: 2026-06-06
---
# Docker MCP Server (QuantGeekDev) — смежный

- Автор: QuantGeekDev, 482 звезды, Python
- Транспорт: stdio
- Смежный: управление Docker, частично перекрывает через docker network inspect

## Что умеет
- Container lifecycle (run, stop, logs, exec)
- Image management (pull, build)
- Volume management
- Работа с Docker Compose

## Как перекрывает netops
- `docker network inspect` — можно посмотреть сетевые bridge'и
- `docker exec` → запустить ping/dig внутри контейнера
- Через compose: управлять сетями контейнеров

## Чем отличается от netops-mcp
- Docker-centric, нет физической сетевой диагностики
- Нет: traceroute, TLS cert sweep, WireGuard, dns_leak_check, mtu_blackhole
- Нет вердиктов/интерпретации сетевых проблем
- Нет диагностики хостовой сети

## Значимость
Потенциальный пользователь netops-mcp — разработчик с Docker — может комбинировать оба сервера.
