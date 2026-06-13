# Честная demo-гифка (honesty-by-form, вариант B) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Сделать demo-гифку netops-mcp честной — пролог `net_diagnose`/`net_triangulate` подаётся как план диагностики агента (намерение), а не сфабрикованный вывод; единственный реально живой вызов `config_correlate` показывается целиком, без обрезки.

**Architecture:** Правится только то, что ПЕЧАТАЕТ `demo/cli.mjs` в money-shot (строки 45–70), и геометрия/тайминг `demo/demo.tape`. Механика MCP-клиента и реальный RPC `config_correlate` не меняются. Артефакт `cli.gif` рендерит CI (`demo.yml`, workflow_dispatch) — это вне коммита A. Коммит B (удаление offline-дублей, переключение README на `cli.gif`) заблокирован до ручного CI-рендера пользователем.

**Tech Stack:** Node.js (ESM, `demo/cli.mjs` — обычный Node, НЕ через tsc), VHS (`.tape`), MCP stdio (`dist/index.js`).

**Spec:** `docs/superpowers/specs/2026-06-13-demo-gif-honesty-design.md`

---

## File Structure

| Файл | Действие | Ответственность |
|---|---|---|
| `demo/cli.mjs` | Modify (строки 45–70) | money-shot: пролог-план + live `config_correlate` + wrap живого finding |
| `demo/demo.tape` | Modify (строки 12, 25) | `Height` ~720, `Sleep` ~12s |
| `README.md` | Modify (строки 214–218) | честный текст секции Demo; `<img>:16` НЕ трогать |
| `assets/make_gif.py` | Delete (коммит B) | offline-дубль |
| `assets/demo.gif` | Delete (коммит B) | offline-дубль |
| `assets/demo.svg` | Delete (коммит B) | offline-дубль |
| `research/.../demand-validation-posts.md` | Modify (коммит B, строки 15/22/24) | синхронизация черновика |

---

## ФАЗА 1 — КОММИТ A (делается полностью в этой сессии)

### Task 1: Переписать money-shot в `demo/cli.mjs` (вариант B)

**Files:**
- Modify: `demo/cli.mjs` (строки 45–70 — блок `// --- the money shot ---` до `process.exit(0)`)

**Контекст — ТЕКУЩИЙ код строк 45–70 (что заменяем):**
```js
// --- the money shot ---
out("\n");
out(`${c.green}❯${c.r} `);
await type(`${c.white}why can't I reach api.acme.dev?${c.r}`);
out("\n\n");
await sleep(500);

out(`${c.cyan}net_diagnose${c.r}     ${c.gray}DNS ${c.green}✓${c.gray}  TCP ${c.red}✗ timeout @10.0.0.5${c.r}\n`);
await sleep(650);
out(`${c.cyan}net_triangulate${c.r}  ${c.gray}you ${c.red}✗${c.gray}   US ${c.green}✓${c.gray}  EU ${c.green}✓${c.gray}  Asia ${c.green}✓${c.r}\n`);
await sleep(650);

const cc = await rpc("tools/call", { name: "config_correlate", arguments: { domain: "api.acme.dev" } });
const finding = (cc.result?.structuredContent?.findings?.[0]) || cc.result?.content?.[0]?.text || "";
out(`${c.cyan}config_correlate${c.r} ${c.gray}/etc/hosts:2  api.acme.dev → ${c.amber}10.0.0.5${c.r}\n`);
await sleep(800);

out("\n");
out(`${c.amber}┃ ❯ It's your side.${c.r}\n`);
out(`${c.amber}┃${c.r} ${c.white}${finding.replace(/\s+/g, " ").slice(0, 78)}${c.r}\n`);
out(`${c.amber}┃${c.r} ${c.white}It's live from US, EU & Asia — remove that line.${c.r}\n`);
out(`${c.amber}┃${c.r} ${c.gray}— one diagnosis · local-first · zero telemetry${c.r}\n\n`);

await sleep(400);
srv.kill();
process.exit(0);
```

- [ ] **Step 1: Добавить хелпер `wrapWords` рядом с другими хелперами**

В начало файла, после строки `const out = (s) => process.stdout.write(s);` (строка 19), добавить:

```js
// word-wrap a string on word boundaries to <= width chars per line
const wrapWords = (s, width) => {
  const words = s.replace(/\s+/g, " ").trim().split(" ");
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (cur && cur.length + 1 + w.length > width) { lines.push(cur); cur = w; }
    else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  return lines;
};
```

> Проверено на реальном `finding` (157 симв): `wrapWords(finding, 78)` → 3 строки
> `["/etc/hosts:2 pins api.acme.dev -> 10.0.0.5; this OVERRIDES DNS (DNS itself", "returns nothing). If api.acme.dev seems stuck on an old address, this line", "is why."]`.

- [ ] **Step 2: Заменить блок money-shot (строки 45–70) на вариант B**

```js
// --- the money shot ---
out("\n");
out(`${c.green}❯${c.r} `);
await type(`${c.white}why can't I reach api.acme.dev?${c.r}`);
out("\n\n");
await sleep(500);

// The two probe lines are the PLAN an agent would run — shown as intent,
// not as captured output (offline they can't produce a real verdict:
// net_diagnose hits DNS-fail on a fake domain, net_triangulate needs Globalping).
out(`${c.gray}# an agent probes top-down — DNS, TCP, then worldwide:${c.r}\n`);
await sleep(500);
out(`${c.cyan}net_diagnose${c.r}     ${c.gray}→ DNS · ping · TCP · TLS · HTTP${c.r}\n`);
await sleep(550);
out(`${c.cyan}net_triangulate${c.r}  ${c.gray}→ here vs US / EU / Asia${c.r}\n`);
await sleep(700);

// config_correlate is the ONE genuine call — the catch no remote probe can make.
out(`${c.gray}# but the catch no remote probe can make:${c.r}\n`);
await sleep(400);
const cc = await rpc("tools/call", { name: "config_correlate", arguments: { domain: "api.acme.dev" } });
const finding = (cc.result?.structuredContent?.findings?.[0]) || cc.result?.content?.[0]?.text || "";
out(`${c.cyan}config_correlate${c.r} ${c.gray}/etc/hosts:2  api.acme.dev → ${c.amber}10.0.0.5${c.r}  ${c.green}● live${c.r}\n`);
await sleep(800);

out("\n");
out(`${c.amber}┃ ❯ It's your side.${c.r}\n`);
// Print the LIVE finding in full, wrapped on word boundaries — never slice mid-word.
for (const line of wrapWords(finding, 78)) {
  out(`${c.amber}┃${c.r} ${c.white}${line}${c.r}\n`);
}
out(`${c.amber}┃${c.r} ${c.white}It's live from US, EU & Asia — remove that line.${c.r}\n`);
out(`${c.amber}┃${c.r} ${c.gray}— config_correlate is a real call · local-first · zero telemetry${c.r}\n\n`);

await sleep(400);
srv.kill();
process.exit(0);
```

**Изменения построчно:**
1. Добавлен комментарий-ремарка `# an agent probes top-down…` (gray).
2. `net_diagnose`/`net_triangulate` печатают ПЛАН (`→ DNS · ping…` / `→ here vs US / EU / Asia`), а не фейк-результат `DNS ✓ TCP ✗`.
3. Добавлен второй комментарий `# but the catch no remote probe can make:`.
4. `config_correlate` получил маркер `${c.green}● live${c.r}`.
5. Вердикт: `finding` печатается **целиком через `wrapWords(finding, 78)`** (3 строки), `slice(0, 78)` УДАЛЁН.
6. Подпись: `config_correlate is a real call` вместо `one diagnosis`.
7. Реальный RPC `config_correlate` (строка `const cc = await rpc(...)`) — НЕ тронут, исполняется как было.

- [ ] **Step 3: Собрать сервер (нужен `dist/index.js` для прогона)**

Run: `npm run build`
Expected: завершается без ошибок (`tsc`), `dist/index.js` на месте.

- [ ] **Step 4: Прогнать `cli.mjs` вживую и проверить вывод**

Run: `node demo/cli.mjs`
(НЕ оборачивать в `timeout` — его нет в macOS BSD; `cli.mjs` сам делает `srv.kill()` + `process.exit(0)`.)

Expected — в выводе (exit 0):
- строки `# an agent probes top-down…` и `# but the catch no remote probe can make:` присутствуют;
- `net_diagnose → DNS · ping · TCP · TLS · HTTP` и `net_triangulate → here vs US / EU / Asia` (план, не `✓`/`✗`);
- `config_correlate /etc/hosts:2 … 10.0.0.5  ● live`;
- вердикт-строки содержат ПОЛНЫЙ текст, заканчиваются на `this line is why.` — **НЕТ хвоста `…ret`**, нет обрыва слова;
- подпись `— config_correlate is a real call · local-first · zero telemetry`.

- [ ] **Step 5: Проверить smoke (handshake не сломан)**

Run: `npm run smoke`
Expected: PASS (MCP-handshake проходит; `tools.ts` не трогали, число инструментов прежнее).

### Task 2: Поднять `Height` и `Sleep` в `demo/demo.tape`

**Files:**
- Modify: `demo/demo.tape` (строка 12 `Set Height 660`, строка 25 `Sleep 9s`)

**Контекст — текущие строки:**
```
12: Set Height 660
...
25: Sleep 9s
```

- [ ] **Step 1: Поднять Height**

Заменить строку 12:
```
Set Height 720
```
> Money-shot вырос: +2 строки комментариев `#` + вердикт стал 3 строки вместо 1 обрезанной. 720 — стартовая оценка с запасом; финальное значение подтверждается визуальной приёмкой пользователя после CI-рендера.

- [ ] **Step 2: Поднять Sleep**

Заменить строку 25:
```
Sleep 12s
```
> Внутренние `await sleep()` в cli.mjs суммарно выросли (добавлены паузы на 2 комментария). 12s даёт VHS дождаться кадра с полным вердиктом.

- [ ] **Step 3: Зафиксировать невозможность локального рендера**

Локальной проверки нет (`vhs` не установлен — `which vhs` → not found). Рендер `cli.gif` — на CI. Это ожидаемо, НЕ блокер коммита A. Геометрия проверяется пользователем на Уровне 2.

### Task 3: Честный текст секции Demo в `README.md`

**Files:**
- Modify: `README.md` (строки 214–218). **Строку 16 `<img src="assets/demo.gif">` НЕ трогать** — в коммите A `demo.gif` ещё на месте, README цел.

**Контекст — текущие строки 214–218:**
```
The animation above is rendered offline via `assets/make_gif.py`. For an authentic
recording from the **real** server, install [VHS](https://github.com/charmbracelet/vhs)
and run `vhs demo/demo.tape` — it drives `demo/cli.mjs`, where `config_correlate` is a
genuine tool call against `demo/hosts.fixture`. The `regenerate demo gif` GitHub Action
keeps the recorded `assets/cli.gif` up to date.
```

- [ ] **Step 1: Заменить строки 214–218 на:**

```
The animation is a real recording of the server: `vhs demo/demo.tape` drives
`demo/cli.mjs`, where `config_correlate` is a genuine call against `demo/hosts.fixture`.
The two probe lines above it (`net_diagnose`, `net_triangulate`) show **what an agent
would run**; the stale-pin catch is the live call. The `regenerate demo gif` GitHub
Action re-renders `assets/cli.gif` from the tape.
```

> Убрано «rendered offline via make_gif.py» (станет неправдой в коммите B). Добавлено прямое «probe lines show what an agent would run; the stale-pin catch is live» — та же честность, что в кадре.

- [ ] **Step 2: Проверить, что строка 16 не задета**

Run: `grep -n 'assets/demo.gif' README.md`
Expected: строка 16 (`<img src="assets/demo.gif"...`) на месте — в коммите A её НЕ меняем.

### Task 4: Коммит A

- [ ] **Step 1: Финальная верификация (всё зелёное)**

Run по очереди:
```bash
npm run build          # OK
node demo/cli.mjs       # money-shot корректен (см. Task 1 Step 4)
npm run smoke           # PASS
```

- [ ] **Step 2: Точечный `git add` и коммит**

```bash
git add demo/cli.mjs demo/demo.tape README.md
git commit -m "feat: честный money-shot demo (план агента + live config_correlate)

Пролог net_diagnose/net_triangulate подаётся как план диагностики (намерение,
→ DNS·ping·TCP / → here vs US/EU/Asia), а не сфабрикованный DNS✓TCP✗ вывод.
config_correlate помечен ● live и печатает живой finding ЦЕЛИКОМ (word-wrap,
slice(0,78) снят — он рвал текст на полуслове). Подпись исправлена на
config_correlate. demo.tape: Height 720, Sleep 12s под выросший money-shot.
README секция Demo переписана честно (img на demo.gif пока не трогаем — коммит B).

Reviewed: anti-slop ✓ (живой текст, не выдуманный) arch ✓ tests ✓ (node cli.mjs + smoke)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

> Push/PR НЕ делать. Коммитим автоматически (работа завершена + верификация зелёная).

---

## ФАЗА 2 — [BLOCKED] КОММИТ B (только ПОСЛЕ ручного CI-рендера пользователем)

> **Блокировка:** этот коммит требует, чтобы `assets/cli.gif` уже существовал в репо.
> Его создаёт CI: пользователь идёт в **GitHub → Actions → `regenerate demo gif` → Run
> workflow**. Бот рендерит `cli.gif`, коммитит и пушит его. Claude НЕ может запустить
> CI и НЕ делает этого. До этого момента Фаза 2 не начинается; README остаётся на
> рабочем `demo.gif` (не битый).
>
> **Перед Фазой 2:** `git pull` (CI запушил коммит с `cli.gif`).
> **Визуальная приёмка пользователя (Уровень 2)** по чек-листу из spec должна пройти —
> если кадр обрезан/уродлив, сперва правится `Height`/`Sleep`/ширина wrap и повторный CI.

### Task 5: Переключить README на `cli.gif` и удалить offline-дубли

**Files:**
- Modify: `README.md` (строка 16)
- Delete: `assets/make_gif.py`, `assets/demo.gif`, `assets/demo.svg`

- [ ] **Step 1: Переключить `<img>` на `cli.gif`**

В `README.md` строка 16: заменить `assets/demo.gif` на `assets/cli.gif`:
```html
  <img src="assets/cli.gif" alt="netops-mcp diagnoses an unreachable host and finds a stale /etc/hosts pin in one call" width="680">
```
(alt-текст и width — без изменений.)

- [ ] **Step 2: Удалить три offline-дубля**

```bash
git rm assets/make_gif.py assets/demo.gif assets/demo.svg
```

- [ ] **Step 3: Проверить отсутствие висячих ссылок**

Run: `grep -rnE 'make_gif|demo\.gif|demo\.svg' --include='*.md' --include='*.yml' --include='*.ts' --include='*.mjs' . | grep -v node_modules | grep -v '\.superpowers/'`
Expected: НИ ОДНОГО совпадения в `README.md`/`demo.yml`/исходниках (допустимо только в `research/.../demand-validation-posts.md` — чинится в Task 6, и в spec/plan-файлах как описание).

### Task 6: Синхронизировать черновик постов

**Files:**
- Modify: `research/netops-mcp-improvements/demand-validation-posts.md` (строки 15, 22, 24)

> Это untracked личный черновик пользователя (`git status` = `??`). Низкий приоритет, на публику не влияет. Цель — чтобы он не противоречил репо.

- [ ] **Step 1: Прочитать текущие строки 15/22/24**

Run: `sed -n '13,26p' research/netops-mcp-improvements/demand-validation-posts.md`
(Точные формулировки зависят от текущего содержимого — обновить так, чтобы: гифка в репо = `cli.gif` (реальная запись), offline-дублей `demo.gif`/`make_gif.py` больше нет.)

- [ ] **Step 2: Обновить упоминания** `assets/demo.gif` → `assets/cli.gif`, убрать «offline-рендер», команду `vhs demo/demo.tape # пишет cli.gif` оставить (она верна).

### Task 7: Коммит B

- [ ] **Step 1: Проверка**

```bash
grep -n 'assets/cli.gif' README.md     # строка 16 теперь cli.gif
ls assets/                              # make_gif.py / demo.gif / demo.svg отсутствуют
```

- [ ] **Step 2: Коммит**

```bash
git add README.md research/netops-mcp-improvements/demand-validation-posts.md
git commit -m "chore: cli.gif как канон demo, удалить offline-дубли

README:16 img → assets/cli.gif (реальная VHS-запись, отрендерена CI).
Удалены assets/make_gif.py + demo.gif + demo.svg — три нарисованных дубля
одной сцены с расхождениями (:12 vs реальная :2, подпись хвалила net_diagnose).
Черновик demand-validation-posts.md синхронизирован.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
(`git rm` из Task 5 Step 2 уже застейджил удаления — они войдут в этот коммит.)

> Push/PR НЕ делать.

---

## Соответствие spec (self-review плана)

| Требование spec | Задача плана |
|---|---|
| Вариант B: пролог как план | Task 1 Step 2 (комментарии `#` + `→`-строки) |
| `config_correlate` live, помечен | Task 1 Step 2 (`● live`, RPC не тронут) |
| Снять slice, wrap живого finding (3 строки) | Task 1 Step 1 (`wrapWords`) + Step 2 |
| Подпись → config_correlate | Task 1 Step 2 |
| Height обязательно, Sleep | Task 2 |
| README текст Demo, img:16 не трогать (коммит A) | Task 3 |
| Верификация build+node+smoke | Task 1 Steps 3–5, Task 4 Step 1 |
| Коммит B: img→cli.gif, удалить 3 дубля | Task 5 |
| Коммит B заблокирован CI | Фаза 2 заголовок |
| Черновик постов | Task 6 |
| Push/PR по запросу, CI руками юзера | Task 4/7 (NOT push), Фаза 2 заголовок |
