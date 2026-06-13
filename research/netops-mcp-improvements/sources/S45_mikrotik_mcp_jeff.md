---
id: S45
url: https://github.com/jeff-nasseri/mikrotik-mcp
title: MikroTik MCP (jeff-nasseri)
channel: github-code
access: open
subquestion_ids: [ST3]
credibility: 4
recency: 5
bias: 1
date: 2026-06-11
---
# MikroTik MCP Server (jeff-nasseri)

- Автор: jeff-nasseri, 208 звёзд (лидер в категории МикроТик), Python/TypeScript
- Транспорт: stdio
- Сайт: mikrotik-mcp.com
- Включён в awesome-mcp-servers (punkpeye), пульс-директория

## Что умеет
- Управление MikroTik RouterOS через SSH
- VLANs, firewall, NAT, routing, DHCP, DNS
- **WireGuard** — управление туннелями через RouterOS
- Популярность 3.2k weekly visitors по PulseMCP

## Чем отличается от netops-mcp
- Управление MikroTik RouterOS (не диагностика с клиентской машины)
- WireGuard есть, но это управление роутером, не local-first tunnel diagnostics
- Нет: net_diagnose, net_triangulate, mtu_blackhole, dns_leak_check, cert_sweep, traceroute с пользовательской точки

## Слабые места
- MikroTik-only (vendor lock-in)
- Нет диагностики пользовательской сети и туннелей
