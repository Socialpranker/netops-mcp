---
id: S46
url: https://github.com/enuno/unifi-mcp-server
title: UniFi MCP Server (enuno)
channel: github-code
access: open
subquestion_ids: [ST3]
credibility: 5
recency: 5
bias: 1
date: 2026-06-12
---
# UniFi MCP Server (enuno)

- Автор: enuno, 165 звёзд, Python
- Транспорт: stdio + SSE/HTTP mode (`UNIFI_TRANSPORT_MODE=sse`)
- PyPI: `unifi-mcp-server`, 1236 тестов

## Что умеет (74+ инструмента)
- Device management, client control, network configuration
- Firewall rules, WiFi management, VLANs, ACL, QoS
- Backup & Restore, Multi-Site Aggregation
- Network Topology mapping
- RADIUS, Guest Portal, 802.1X auth
- Port Profile Management (PoE, VLAN, 802.1X, LLDP-MED)
- 3 режима API: Local Gateway, Cloud EA API, Site Manager API

## Чем отличается от netops-mcp
- УПРАВЛЕНИЕ UniFi-инфраструктурой — не диагностика с клиентской машины
- Нет: traceroute/ping с пользовательской точки, cert sweep, dns_leak_check, mtu_blackhole, net_diagnose/triangulate
- Нет WireGuard (UniFi использует собственный VPN)
- Требует UniFi Network Controller

## Слабые места
- UniFi-только (vendor lock-in)
- Не решает задачи «что не так с соединением от моего ноутбука»
- Нет диагностических вердиктов
