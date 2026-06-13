---
id: S50
url: https://github.com/whisper-sec/whisper-graph-mcp
title: WhisperGraph MCP Server (whisper-sec)
channel: github-code
access: open
subquestion_ids: [ST3]
credibility: 4
recency: 5
bias: 1
date: 2026-05-17
---
# WhisperGraph MCP Server (whisper-sec)

- Автор: whisper-sec, 1 звезда GitHub (но на Glama в топе networking), Apache 2.0
- Транспорт: stdio + Streamable HTTP
- Описание: "Self-hostable MCP for WhisperGraph — 7.39B nodes / 39B edges mapping DNS, BGP, GeoIP, WHOIS, threat intelligence"
- На Glama: единственный сервер в категории "Networking & Infrastructure"

## Что умеет (6 инструментов read-only)
- Cypher-запросы к графу инфраструктуры интернета
- DNS, BGP, GeoIP, WHOIS, threat intelligence в связанном графе
- Schema introspection
- Threat assessment (ASN→ домены→IP→угрозы)
- 8 investigation prompts
- Self-hostable (нужна копия графа или облачный доступ)

## Чем отличается от netops-mcp
- Threat intelligence / OSINT, не live diagnostics
- Нет: ping, traceroute, TLS проверки, WireGuard, net_diagnose
- Пассивный анализ данных, а не активные пробы
- Интернет-масштаб (весь BGP+DNS), а не локальная сеть

## Слабые места
- Требует доступ к WhisperGraph (большой граф)
- Нет активных диагностических инструментов
- 1 звезда — очень низкая популярность несмотря на Glama-листинг
