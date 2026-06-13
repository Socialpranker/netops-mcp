---
id: S44
url: https://github.com/AliKarami/MikroMCP
title: MikroMCP — MikroTik RouterOS MCP
channel: github-code
access: open
subquestion_ids: [ST3]
credibility: 4
recency: 5
bias: 1
date: 2026-06-10
---
# MikroMCP (AliKarami)

- Автор: AliKarami, 29 звёзд, TypeScript
- Транспорт: stdio (локальный)
- Описание: "Production-grade MCP server for MikroTik RouterOS with secure AI-native network automation"

## Что умеет (77 инструментов)
- Управление интерфейсами, firewall rules, DHCP, DNS, routes
- **WireGuard** — управление через RouterOS API
- WiFi, BGP/OSPF, VLANs
- Dry-run previews перед применением
- Idempotency checks
- Circuit breakers для fault-tolerance
- RBAC (role-based access control)
- Rollback-aware change workflows

## Чем отличается от netops-mcp
- УПРАВЛЕНИЕ роутером MikroTik — не диагностика с клиентской машины
- WireGuard ЕСТЬ, но через RouterOS API (управление, не диагностика туннелей)
- Нет: local-first пробинга с машины пользователя, cert sweep, dns_leak_check, mtu_blackhole, net_diagnose/triangulate вердиктов
- Нет traceroute/ping с пользовательской перспективы
- Требует MikroTik-оборудование и API-доступ

## Слабые места
- Vendor lock-in на MikroTik RouterOS
- Enterprise/homelab use case (не для разработчиков без MikroTik)
- Нет диагностики «что происходит между моим ноутбуком и интернетом»
