# Design: приведение netops-mcp в красоту

**Дата:** 2026-06-13
**Статус:** на ревью пользователя
**Скоуп (выбран пользователем):** витрина GitHub-страницы + social preview (og-image) + зрелость OSS. Структуру файлов в репо НЕ трогаем (внутренние `docs/plans` оставляем). Подход — **B: всё в одном плане, линейно сверху вниз**.

## Цель

Репозиторий содержательно крепкий (отличный README, продуманный SECURITY, рабочий CI), но презентационно выглядит как ранняя бета: нет логотипа, нет og-image, нет CHANGELOG/author, длинный линейный README без навигации. Привести к виду зрелого OSS-проекта, не ломая удачное содержание.

## Визуальный язык (одобрено)

- **Концепция логотипа: «Verdict Stack»** — горизонтальные бары-слои (DNS / TCP / TLS / HTTP), один слой подсвечен акцентом, стрелка-вердикт указывает в него. Кодирует суть продукта: «вот на каком слое косяк».
- **Палитра:** база `#0D1117` (GitHub dark), акцент-градиент `#7C3AED → #22D3EE` (фиолетовый→циан). Согласуется с уже существующим бэйджем `MCP-stdio-7C3AED`. Яркий, но осмысленный брендинг — не радужный AI-слоп (forма следует за смыслом).
- **Формат:** SVG (масштабируется, крошечный файл, theme-friendly).

## Компоненты и файлы

### 1. Логотип — `assets/logo.svg`
- Verdict Stack mark + wordmark `netops-mcp` ИЛИ только mark (решим по месту — для шапки README mark+wordmark, для favicon только mark).
- Прозрачный фон, чтобы читался и в light, и в dark теме GitHub. Если контраст в light-теме слабый — обвести mark тонким нейтральным штрихом.
- Встраивается в шапку README, центрированный, ~80px высотой.

### 2. og-image — `assets/og-image.png`
- **Размер: 1280×640** (требование GitHub social preview).
- Содержание: логотип + название + tagline + строка слоёв `DNS · TCP · TLS · HTTP`. Тёмный фон, та же палитра.
- **Пайплайн генерации:** рисуем `assets/og-image.svg` → конвертируем в PNG через `magick` (ImageMagick, подтверждён в системе: `/opt/homebrew/bin/magick`). Команда вида `magick -background none -density 144 assets/og-image.svg -resize 1280x640 assets/og-image.png`, затем проверка размера.
- **Ограничение GitHub:** og-image ставится ТОЛЬКО вручную через Settings → Options → Social preview (API нет). Поэтому: кладём PNG в репо + пишем точную инструкцию (в `CHANGELOG` или короткий `assets/README.md`).

### 3. Редизайн структуры README

Текущие 14 секций — линейный список. Новый порядок группирует «витрину» наверх, справочник прячет в `<details>`:

```
1. Hero            — logo (новое) + tagline + badges + gif
2. Table of Contents (новое)
3. What is this?   ┐
   Why it's different  │ витрина — всегда открыто
   What you actually get back ┘
4. Install         — открыто (главное действие)
5. <details> Reference (свёрнуто):
     - Tools (v0.1)
     - Flags & env
     - Requirements & platform support
     - The shareable report
     - cert_sweep
6. Develop, Demo   — открыто
7. Roadmap, Contributing, License — хвост
```

**Риск:** `<details>` прячет таблицу инструментов — кто-то может не найти. Митигация: (а) TOC-ссылки ведут и внутрь свёрнутых блоков; (б) черновик новой структуры показываем пользователю ДО правки файла; (в) сохраняем весь текущий текст дословно — меняется только обёртка/порядок, не содержание.

### 4. OSS-зрелость

- **`CHANGELOG.md`** — формат [Keep a Changelog](https://keepachangelog.com/). Занести `0.1.0` (текущая версия из package.json) на основе git-истории. Заголовок `Unreleased` для будущего.
- **`package.json` → `author`** — `"Socialpranker (https://github.com/Socialpranker)"` (без email, по выбору пользователя).
- **`.github/FUNDING.yml`** — `github: [Socialpranker]`. ⚠️ Кнопка Sponsor появится только если у пользователя включён GitHub Sponsors; иначе файл валиден, но кнопки нет. Не блокер.
- **`CODE_OF_CONDUCT.md`** — Contributor Covenant 2.1 (стандарт, низкий риск). Контакт для репортов — тот же канал, что в SECURITY.md.

## Что НЕ делаем (YAGNI / вне скоупа)

- Структуру файлов в репо не реорганизуем (пользователь не выбрал).
- `docs/plans/*` и `docs/superpowers/*` остаются как есть (внутренние рабочие файлы).
- Architecture.md, examples/ — не в этом заходе (низкий приоритет в сводке, не выбрано).
- Автоматизацию обновления demo.gif не трогаем (уже работает).

## Тестирование и верификация

- **README:** баланс code-fence (чётный `grep -c '^\`\`\`'`), валидность `<details>`/`<summary>`, резолв TOC-якорей (каждая ссылка `#anchor` → существующий заголовок), markdown-рендер не сломан.
- **og-image:** `magick identify` → размер ровно 1280×640.
- **Логотип:** визуальная проверка на dark+light фоне (рендер в обе темы).
- **package.json:** валидный JSON после правки (`node -e "require('./package.json')"`).
- **FUNDING.yml:** валидный YAML.
- Перед коммитом — `superpowers:verification-before-completion`. Коммиты атомарные, conventional на русском.

## Порядок исполнения (подход B, линейно)

1. `assets/logo.svg` — финализировать Verdict Stack из выбранного концепта.
2. `assets/og-image.svg` → PNG через magick.
3. Редизайн README (черновик структуры → ревью → правка файла → встроить logo + TOC).
4. CHANGELOG.md.
5. package.json author.
6. .github/FUNDING.yml.
7. CODE_OF_CONDUCT.md.
8. Верификация → атомарные коммиты → push (push по разрешению пользователя).

## Открытые риски

- README-редизайн самый субъективный — изолируем через черновик-на-ревью, не правим вслепую.
- og-image нельзя поставить программно — остаётся ручной шаг пользователя (документируем).
- FUNDING зависит от внешнего состояния (Sponsors включён или нет).
