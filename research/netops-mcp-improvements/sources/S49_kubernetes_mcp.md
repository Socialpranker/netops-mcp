---
id: S49
url: https://github.com/containers/kubernetes-mcp-server
title: Kubernetes MCP Server (containers/redhat)
channel: github-code
access: open
subquestion_ids: [ST3]
credibility: 5
recency: 5
bias: 1
date: 2026-06-13
---
# Kubernetes MCP Server (containers/Red Hat)

- Автор: Red Hat (containers org), 1681 звёзд (лидер devops-MCP), Go
- Транспорт: stdio + SSE
- Описание: Управление Kubernetes и OpenShift через MCP

## Что умеет
- List/get/describe/apply/delete Kubernetes resources
- Pod logs, exec в контейнер
- Port-forwarding, resource watching
- Работа с OpenShift (расширение)
- Поддержка multi-cluster (через контексты kubeconfig)

## Чем перекрывает netops
- Port-forwarding может решать задачи connectivity
- Косвенно: network policy management, service discovery внутри кластера
- kubectl exec → можно запустить ping/dig внутри пода

## Чем отличается от netops-mcp
- Kubernetes-centric: нет физической/сетевой диагностики
- Нет: ping, traceroute, DNS probe, TLS/cert check, WireGuard, net_diagnose
- Нет диагностики пользовательской машины
- Нет mtu_blackhole, dns_leak_check, tunnel_diff

## Слабые места
- Требует kubectl + kubeconfig
- Нет сетевой диагностики вне кластера
- Не решает задачи «почему у меня не работает VPN»
