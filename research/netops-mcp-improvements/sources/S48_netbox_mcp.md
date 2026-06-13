---
id: S48
url: https://github.com/netboxlabs/netbox-mcp-server
title: NetBox MCP Server (netboxlabs)
channel: github-code
access: open
subquestion_ids: [ST3]
credibility: 5
recency: 5
bias: 1
date: 2026-06-12
---
# NetBox MCP Server (netboxlabs)

- Автор: netboxlabs (официальный), 185 звёзд, Python
- Транспорт: stdio
- Описание: Read-only взаимодействие с NetBox IPAM/DCIM

## Что умеет
- Query NetBox data (devices, IPs, prefixes, VLANs, circuits, etc.)
- Read-only IPAM и DCIM данные
- Поиск по инфраструктуре через естественный язык

## Чем отличается от netops-mcp
- IPAM/DCIM база данных — не живая диагностика сети
- Нет активных проверок (ping/traceroute/DNS/TLS)
- Нет WireGuard, нет вердиктов
- Нет диагностики «что сейчас происходит в сети»
- Смежный, не конкурент: хранит документацию сети, не диагностирует её

## Слабые места
- Только read-only (нет write-операций в официальной версии)
- Требует инстанс NetBox
- Не диагностика, а CMDB/документация
