---
id: S43
url: https://github.com/Juniper/junos-mcp-server
title: Juniper Junos MCP Server
channel: github-code
access: open
subquestion_ids: [ST3]
credibility: 5
recency: 5
bias: 1
date: 2026-06-09
---
# Juniper Junos MCP Server

- Автор: Juniper Networks (официальный), 95 звёзд, Python (PyEZ)
- Транспорт: stdio + HTTP с bearer-token аутентификацией
- Установка: uv/pip + конфиг устройств через YAML

## Что умеет
- Получение конфигурации Junos-устройств (SSH)
- Проверка health и статуса
- Выполнение operational commands (show, ping, traceroute с роутера)
- Push конфигурационных изменений (с guardrails: commit-check, rollback)
- Dynamic device management через elicitation (add_device)
- Поддержка VSCode GitHub Copilot
- Guardrails для config commit и operational commands

## Чем отличается от netops-mcp
- УПРАВЛЕНИЕ УСТРОЙСТВАМИ Juniper (не диагностика пользовательской сети)
- SSH к сетевому оборудованию — enterprise NetOps, не end-user диагностика
- Нет: local-first пробинга, WireGuard, cert sweep, dns_leak_check, net_diagnose/triangulate
- Нет MTU blackhole detection, traceroute с пользовательской машины
- Требует доступ к Juniper-оборудованию по SSH

## Слабые места
- Только Juniper Junos (vendor lock-in)
- Enterprise use case — не для домашних/разработчиков
- Требует конфигурации устройств + SSH-доступа
- Нет диагностики с точки зрения клиентской машины
