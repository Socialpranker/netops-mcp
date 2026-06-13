---
id: S52
url: https://github.com/edutacara/network-mcp-server
title: Cisco/Juniper Network MCP Server (edutacara)
channel: github-code
access: open
subquestion_ids: [ST3]
credibility: 3
recency: 5
bias: 1
date: 2026-05-01
---
# Network MCP Server — Cisco/Juniper (edutacara)

- Автор: edutacara, 0 звёзд, Python (FastMCP)
- Транспорт: stdio
- Описание: "MCP server that lets AI assistants operate a Cisco/Juniper network through safe, approval-gated tools"

## Что умеет (5 инструментов)
- `list_devices` — из YAML inventory
- `list_backups` — сохранённые конфиги с timestamps
- `get_device_config` — содержимое резервной копии
- `run_compliance_audit` — аудит конфигов против YAML-правил
- `backup_device` — SSH pull конфига (единственный write)

## Чем отличается от netops-mcp
- УПРАВЛЕНИЕ СЕТЕВЫМ ЖЕЛЕЗОМ (Cisco/Juniper), не диагностика с клиентской машины
- Нет: ping, traceroute, DNS probe, TLS cert, WireGuard, net_diagnose
- 4 из 5 инструментов read-only и без сетевых вызовов
- Compliance auditing (есть у netops? нет)

## Слабые места
- Только Cisco/Juniper
- Минимальный набор инструментов (5)
- 0 звёзд
