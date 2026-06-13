---
id: S41
url: https://github.com/labeveryday/network-mcp
title: Network MCP (labeveryday / Du'An Lightfoot)
channel: github-code
access: open
subquestion_ids: [ST3]
credibility: 4
recency: 4
bias: 1
date: 2026-04-17
---
# Network MCP Server (labeveryday)

- Автор: Du'An Lightfoot (Cisco DevNet), 4 звезды, Python
- Транспорт: stdio (локальный), PyPI пакет `network-mcp`
- Установка: `pip install network-mcp` / `network-mcp`

## Что умеет
**Диагностика (connectivity):**
- ping, traceroute, dns_lookup, port_check, mtr
- batch_ping, batch_port_check, batch_dns_lookup (параллельно)

**Локальная сеть:**
- get_interfaces, get_routes, get_dns_config, get_arp_table, get_connections, get_public_ip

**PCAP-анализ (scapy):**
- pcap_summary, get_conversations, analyze_throughput, find_tcp_issues, analyze_dns_traffic, filter_packets, get_protocol_hierarchy, custom_scapy_filter

**IP/CIDR math (NOC-утилиты):**
- cidr_info, subnet_split, check_overlaps, plan_subnets, validate_vlan_map, find_vlan_for_ip

**Внешний intel:**
- rdap_lookup, asn_lookup

## Чем отличается от netops-mcp
- PCAP-анализ через scapy — уникальная фича (netops-mcp этого нет)
- CIDR/VLAN math для NOC-workflows
- НЕТ: TLS/cert проверки, WireGuard управления, dns_leak_check, mtu_blackhole, tunnel_diff, net_diagnose/net_triangulate вердиктов, cert_sweep
- Allowlist/blocklist для target validation (похожий security подход)
- Нет verdicts — только сырые данные

## Слабые места
- Нет высокоуровневых вердиктов («проблема в DNS или маршруте?»)
- Нет TLS/cert функционала
- Нет WireGuard / tunnel-management
- Слабый фокус на privacy (нет явного zero-telemetry заявления)
- 4 звезды — низкая популярность
