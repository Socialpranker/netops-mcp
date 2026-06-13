---
id: S40
url: https://github.com/jsdelivr/globalping-mcp-server
title: Globalping MCP Server (jsDelivr)
channel: github-code
access: open
subquestion_ids: [ST3]
credibility: 5
recency: 5
bias: 1
date: 2025-05-14
---
# Globalping MCP Server (jsDelivr/Globalping)

- Автор: jsDelivr (официальный), 58 звёзд, язык: TypeScript/Node
- Транспорт: Streamable HTTP + SSE (remote, `https://mcp.globalping.dev/mcp`)
- Инструменты: ping, traceroute, DNS, MTR, HTTP — из тысяч глобальных probe-нод по всему миру
- Установка: `npx mcp-remote https://mcp.globalping.dev/sse` (не нужен локальный бинарь)
- Аутентификация: OAuth или API-токен, есть rate-limit на free tier

## Что умеет
- Запускает сетевые тесты из тысяч точек мира (Globalping probe network: частные устройства+VPS)
- Поддерживает ping, traceroute, DNS-lookup, MTR, HTTP probe
- Сравнение результатов между регионами / провайдерами
- Фильтрация по стране, ASN, городу, cloud-провайдеру

## Чем отличается от netops-mcp
- REMOTE-first: всё выполняется с удалённых нод, не с машины пользователя
- Нет диагностики ЛОКАЛЬНОЙ сети (WireGuard, local interfaces, internal hosts)
- Нет вердиктов (net_diagnose, net_triangulate) — только сырые результаты
- Нет TLS/cert sweep, tunnel_diff, dns_leak_check, mtu_blackhole
- Нет управления VPN/WireGuard
- Требует интернет-соединения к API, нет zero-telemetry

## Слабые места
- Remote probe-only: не видит внутреннюю сеть пользователя, не диагностирует локальные туннели
- Сырой вывод без интерпретации ("latency 250ms" — хорошо или плохо для BGP?)
- Rate limits на free tier, платный SaaS для интенсивного использования
- Нет WireGuard/VPN управления вообще
- Зависимость от внешнего сервиса (Globalping API uptime)
