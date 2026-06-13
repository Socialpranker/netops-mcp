---
id: S47
url: https://github.com/vespo92/OPNSenseMCP
title: OPNSense MCP Server (vespo92)
channel: github-code
access: open
subquestion_ids: [ST3]
credibility: 4
recency: 5
bias: 1
date: 2026-06-13
---
# OPNSense MCP Server (vespo92)

- Автор: vespo92, 57 звёзд, TypeScript (активно обновляется 2026-06-13)
- Смежный: Pixelworlds/opnsense-mcp-server — 51 звезда (88 инструментов, доступ к 2000+ методам)
- Смежный: lucamarien/opnsense-mcp-server — 6 звёзд (62 инструмента, 10 доменов, read-only по умолчанию)
- Транспорт: stdio

## Что умеет (vespo92: IaC proxy)
- OPNsense API через MCP как Infrastructure-as-Code прокси
- Firewall rules, DHCP, DNS overrides, gateway monitoring, ARP table
- Service management, VPN (OpenVPN/WireGuard через OPNsense)
- Two-step confirmation для деструктивных операций

## Чем отличается от netops-mcp
- УПРАВЛЕНИЕ OPNsense firewall — не диагностика клиентской машины
- VPN через OPNsense API (управление, не local tunnel diagnostics)
- Нет: net_diagnose, net_triangulate, mtu_blackhole, dns_leak_check, cert_sweep авто-discovery
- Нет traceroute/ping с клиентской точки зрения

## Слабые места
- Vendor lock-in на OPNsense
- Не решает «что сломалось в моём соединении до интернета»
