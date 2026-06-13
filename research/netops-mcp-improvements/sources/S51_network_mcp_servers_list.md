---
id: S51
url: https://github.com/hecisaza/network-mcp-servers
title: Curated list: Network Infrastructure MCP Servers
channel: github-code
access: open
subquestion_ids: [ST3]
credibility: 4
recency: 5
bias: 1
date: 2026-06-01
---
# Curated: Network Infrastructure MCP Servers (hecisaza)

- 2 звезды, README с каталогом вендорных MCP-серверов
- Категории: Vendor-Specific, Multi-Vendor, Network Management Platforms, Orchestration, Topology

## Содержимое каталога

### Vendor-Specific
- **Juniper Junos MCP** — официальный, PyEZ, SSH, конфиг+операционные команды
- **Cisco Catalyst Center MCP** — 70 инструментов, enterprise (OIDC, Duo MFA, HashiCorp Vault, OPA)
- **Cisco Meraki MCP** — Dashboard API, firmware compliance, role-based access
- **Cisco pyATS MCP** — Cisco pyATS/Genie, контейнеризированный, SSH (IOS/NX-OS/XR)
- **Arista CloudVision MCP** — CloudVision API, inventory, events, connectivity

### Multi-Vendor
- **Scrapli MCP** — CLI через SSH/Telnet/NETCONF (Cisco+Juniper+Arista+EOS)
- **Netmiko MCP** — Netmiko library, multi-vendor CLI

## Вывод по каталогу
ВСЕ перечисленные серверы — управление сетевым ОБОРУДОВАНИЕМ, не диагностика с клиентской машины. Ни один не делает: local-first ping/traceroute с клиентской точки, WireGuard-диагностику туннелей, mtu_blackhole detection, dns_leak_check.

## Значимость для netops-mcp
Подтверждает: enterprise-networking MCP = управление железом через SSH/API. Ниша local-first диагностики не занята.
