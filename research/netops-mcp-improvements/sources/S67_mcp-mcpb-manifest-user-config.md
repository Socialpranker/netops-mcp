---
id: S67
url: https://github.com/anthropics/dxt/blob/main/MANIFEST.md
title: MCPB manifest.json Specification v0.3 — user_config & install UX
channel: github-code
access: open
subquestion_ids: [ST4]
credibility: 5
recency: 5
bias: 2
date: 2025-12-02
---
# MCPB Manifest — User Config & Install UX

## user_config — декларативный UI для конфигурации

Вместо того чтобы просить пользователя вручную редактировать JSON, `user_config` описывает поля, которые хост-приложение рендерит как UI:

```json
"user_config": {
  "api_key": {
    "type": "string",
    "title": "API Key",
    "description": "Your API key",
    "sensitive": true,   // не показывать в UI
    "required": false
  },
  "allowed_directories": {
    "type": "directory",
    "multiple": true,
    "required": true,
    "default": ["${HOME}/Desktop"]
  },
  "max_file_size": {
    "type": "number",
    "min": 1,
    "max": 100,
    "default": 10
  }
}
```

Типы: `string`, `number`, `boolean`, `directory`, `file`, `enum`.

Поля из `user_config` доступны в `mcp_config` через `${user_config.field_name}`.

## Рекомендация Node.js

Anthropic явно рекомендует Node.js для MCPB: Node.js поставляется вместе с Claude Desktop, Python требует отдельной установки или uv.

## Структуры бандлов для разных runtime

- **Node.js**: `node_modules/` встроен в zip
- **Python (traditional)**: `lib/` или `venv/` встроен — НО нельзя портировать скомпилированные зависимости (pydantic и т.д.)
- **Python (uv)**: `pyproject.toml` — хост сам управляет deps, работает кросс-платформенно
- **Binary**: статически слинкованный бинарь для каждой платформы

## Compatibility

```json
"compatibility": {
  "claude_desktop": ">=1.0.0",
  "platforms": ["darwin", "win32", "linux"],
  "runtimes": {
    "node": ">=16.0.0"
  }
}
```

## Релевантность для netops

netops-mcp как Node.js проект — MCPB подходит хорошо:
- `node_modules/` встраивается в бандл
- Никаких дополнительных рантаймов
- `${HOME}` доступен в defaults
- Если есть конфиги (interface whitelist, timeout) — `user_config` заменяет ручной env
