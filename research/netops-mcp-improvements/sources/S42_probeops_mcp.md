---
id: S42
url: https://github.com/kumarprobeops/probeops-mcp-server
title: ProbeOps MCP Server
channel: github-code
access: open
subquestion_ids: [ST3]
credibility: 4
recency: 5
bias: 2
date: 2026-02-12
---
# ProbeOps MCP Server

- Автор: kumarprobeops (koммерческий), 0 звёзд GitHub, TypeScript/Node
- NPM: `@probeops/mcp-server`
- Транспорт: stdio + remote API (probeops.com)
- Модель: freemium (10 calls/day бесплатно без ключа, 100/day с ключом, 5000/day Professional)

## Что умеет (21 инструмент в full version)
**Диагностика из 6 регионов (US East/West, EU Central, Canada, India, Australia):**
- ssl_check, dns_lookup, is_it_down, latency_test, traceroute, port_check, ping, whois
- nmap_port_check, tcp_ping, keyword_check, websocket_check, banner_grab, api_health

**DNS shortcuts:** mx_lookup, txt_lookup, ns_lookup, cname_lookup, caa_lookup, reverse_dns_lookup

**Geo-proxy:**
- get_geo_proxy — прокси-credentials для конкретного региона
- geo_browse — открыть URL из региона (Playwright headless)

**Account:** account_status

## Чем отличается от netops-mcp
- Remote-first: все пробы из облачных нод ProbeOps (6 регионов), не с машины пользователя
- Есть SSL/cert check — перекрывает cert-функционал netops
- НЕТ: local-first диагностики, WireGuard, tunnel_diff, dns_leak_check, mtu_blackhole, net_triangulate, cert_sweep авто-discovery
- Платный SaaS (лимиты, rate limit)
- Отправляет данные на внешние серверы (не zero-telemetry)

## Слабые места
- Зависит от внешнего SaaS (probeops.com) — no offline
- Нет диагностики внутренней сети
- Нет вердиктов/интерпретации результатов
- Нет WireGuard/VPN управления
- 0 звёзд — очень новый/малоизвестный
