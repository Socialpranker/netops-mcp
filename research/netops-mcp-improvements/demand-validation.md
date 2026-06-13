# Demand validation — netops-mcp

**Цель:** проверить, есть ли спрос на local-first AI-network-diagnosis ДО вложений
в реестры/MCPB/wizard. Несущая непроверенная посылка research (контр-аргумент D):
пустая ниша может значить «нет рынка», а не «возможность».

## Гипотеза
Если вердиктный клин (net_diagnose «где сломалось» + config_correlate «протухший
/etc/hosts» + net_triangulate «я или они») — реальная боль, демо соберёт pull
(звёзды, комментарии «надо мне», вопросы). Если тишина — роадмап под вопросом.

## Где постить (вердиктный клин, не голые пробы!)
- r/selfhosted, r/homelab — домашние сети, VPN, /etc/hosts — целевая боль
- Hacker News (Show HN) — но только с сильным демо
- r/ClaudeAI / r/mcp — MCP-аудитория

## Готовый текст поста (черновик — Иван редактирует перед публикацией)

> **Show: an MCP server that diagnoses network problems from YOUR machine and tells you which side the fault is on**
>
> I kept asking Claude "why can't I reach X" and getting raw `ping`/`dig` output I had
> to interpret myself. So I built netops-mcp — it runs the probes locally and returns a
> *verdict*, not a dump:
>
> - "YOUR SIDE: down for you but up from 4/4 global probes — it's your network/DNS/ISP"
> - "/etc/hosts:12 pins api.example.com → 10.0.0.5; this OVERRIDES DNS — that's why it's stuck on the old IP"
> - "Reaches the host but TLS cert expired 3 days ago — their side"
>
> Local-first (sees your homelab/VPN/resolvers, unlike remote probes), read-only by
> default, zero telemetry. Also does WireGuard tunnel diagnostics.
>
> [demo gif] · [repo]
>
> Honest question for the thread: is "AI that diagnoses my local network" something
> you'd actually use, or do you just run the commands yourself?

## Что мерить (за 1-2 недели)
- ⭐ звёзды на репо (baseline 0) — дельта
- 💬 комментарии вида «это мне нужно» / «давно хотел» vs «зачем, я сам запускаю dig»
- ❓ вопросы про установку/фичи = интерес
- 🔁 reshare / упоминания

## Решающее правило
- **Сильный pull** (>30 звёзд ИЛИ несколько «надо мне» с конкретикой) → запускать Tier-2 (реестры, MCPB, README-редизайн).
- **Слабый/смешанный** → сузить позиционирование под то, что зашло, перетестить.
- **Тишина / «зачем не bash»** доминирует → пересмотреть: возможно portfolio-проект, не роадмап.

## Связанный бенчмарк (open-question №2 research)
Параллельно: дать модели (а) netops net_diagnose и (б) raw dig/ping/curl на 10
сломанных сценариях, сравнить точность диагноза. Если вердикты не бьют baseline —
главный дифференциатор под вопросом. Это сильнейший ответ на «зачем не bash».
