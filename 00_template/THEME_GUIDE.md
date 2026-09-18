# Полное руководство по настройке тем и кастомизации элементов презентаций

> **Quarto Reveal.js Design System & UI Customization Manual**  
> Курс «Современный ИИ» • Архитектура стилей, пресеты, компоненты и пошаговые инструкции по кастомизации.

---

## 1. Архитектура системы стилей

Все стили презентаций выстроены по двухслойной модульной архитектуре в директории `00_template/theme/`:

```
00_template/theme/
├── theme.scss                  # Главная точка входа (Master Entry Point)
├── theme-swiss.scss            # Автономная тема: Swiss Minimal
├── theme-dark-tech.scss        # Автономная тема: Precision Dark Tech
├── theme-academic.scss         # Автономная тема: Academic Monograph
├── theme-monochrome.scss       # Автономная тема: Kinetic Monochrome
├── _variables.scss             # Базовые SASS defaults и резервные CSS-токены
├── _typography.scss            # Шрифты, шкала размеров, надписи (кикеры), бейджи
├── _layout.scss                # Сетки (.grid-2..5), колонки, Hero и Section-слайды
├── _components.scss            # Карточки, коллауты, метрики, квизы, таблицы
├── _reveal-overrides.scss      # Окно терминала macOS, KaTeX, прогресс-бар, номера слайдов
├── _animations.scss            # Анимации и фрагменты Reveal.js
└── presets/                    # Пресеты цветовых палитр и токенов
    ├── _preset-swiss-minimal.scss   # Светлая швейцарская тема (оранжевый/синий акцент)
    ├── _preset-dark-tech.scss       # Темная тема (обсидиан + неоновый циан)
    ├── _preset-academic.scss        # Академическая тема (кремовая бумага + античное золото)
    └── _preset-monochrome.scss      # Монохромная тема (черно-белая + кислотный лайм)
```

### Двухслойный принцип: SASS Defaults vs CSS Custom Properties

Каждый файл темы строго разделен на две секции:
1. `/*-- scss:defaults --*/` — переменные компилятора Quarto/Sass (`$body-bg`, `$body-color`, `$presentation-heading-font`).
2. `/*-- scss:rules --*/` — CSS custom properties в блоке `:root` (`--lecture-bg`, `--lecture-accent`, `--lecture-surface`).

> [!TIP]
> Все компоненты (карточки, кнопки, формулы, таблицы) используют **только CSS-переменные** `var(--lecture-*)`. Поэтому изменение одной переменной в `:root` мгновенно преображает всю презентацию без необходимости править отдельные классы.

---

## 2. Управление глобальными темами

### Быстрое переключение темы для всего курса

Откройте `00_template/theme/theme.scss` и раскомментируйте нужный пресет:

```scss
/*-- scss:defaults --*/
// @import "presets/preset-swiss-minimal"; // Швейцарский минимализм (светлая)
// @import "presets/preset-dark-tech";     // Dark Tech (темный кибернетический обсидиан)
// @import "presets/preset-academic";      // Академическая монография (кремовая)
@import "presets/preset-monochrome";       // Kinetic Monochrome (черно-белая)

/*-- scss:rules --*/
@import "_typography";
@import "_layout";
@import "_components";
@import "_reveal-overrides";
@import "_animations";
```

Либо переключите через скрипт компилятора:
```bash
python render_lectures.py --theme dark-tech
# или
python render_lectures.py --theme monochrome --all
```

---

### Создание собственного пресета (например, `_preset-custom.scss`)

1. Создайте файл `00_template/theme/presets/_preset-custom.scss`:

```scss
/*-- scss:defaults --*/
// 1. Подключение Google Fonts
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500;700&display=swap");

// 2. Базовые переменные для движка Reveal.js
$body-bg: #0d1117 !default;
$body-color: #c9d1d9 !default;
$theme-color: #58a6ff !default;
$heading-color: #ffffff !default;
$font-family-sans-serif: 'Inter', sans-serif !default;
$font-family-monospace: 'JetBrains Mono', monospace !default;
$presentation-heading-font: 'Inter', sans-serif !default;
$presentation-font-size-root: 28px !default;

/*-- scss:rules --*/
:root {
  --lecture-preset: 'custom-dark';
  
  /* Фоновые поверхности */
  --lecture-bg: #0d1117;
  --lecture-surface: #161b22;
  --lecture-surface-glass: rgba(22, 27, 34, 0.85);
  
  /* Текст */
  --lecture-fg: #ffffff;
  --lecture-fg-soft: #c9d1d9;
  --lecture-muted: #8b949e;
  
  /* Акцентный цвет (фирменный цвет курса) */
  --lecture-accent: #58a6ff;
  --lecture-accent-hover: #1f6feb;
  --lecture-accent-soft: rgba(56, 139, 253, 0.15);
  --lecture-accent-border: rgba(56, 139, 253, 0.4);
  --lecture-accent-gradient: linear-gradient(135deg, #58a6ff 0%, #bc8cff 100%);
  
  /* Рамки и тени */
  --lecture-border: rgba(240, 246, 252, 0.1);
  --lecture-radius-md: 8px;
  --lecture-shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.5);
}
```

2. Подключите пресет в `00_template/theme/theme.scss`:
```scss
/*-- scss:defaults --*/
@import "presets/preset-custom";
```

---

## 3. Настройка конкретных элементов и компонентов

Все стили компонентов расположены в `00_template/theme/_components.scss` и `_typography.scss`. Ниже приведено руководство по каждому элементу.

### 3.1. Карточки (Cards)

| Класс в QMD | Где настраивать | Описание |
|:---|:---|:---|
| `.card` | `_components.scss` (раздел 2) | Базовая карточка со стеклянным фоном |
| `.card-accent` | `_components.scss` | Карточка с акцентной верхней или левой рамкой |
| `.card-glow` | `_components.scss` | Карточка с неоновым свечением |
| `.card-muted` | `_components.scss` | Второстепенная карточка с приглушенным фоном |

**Пример использования в `.qmd`:**
```markdown
::: {.card .card-accent}
### Заголовок карточки
Содержимое карточки с поддержкой формул $E = mc^2$ и **жирного текста**.
:::
```

**Как изменить внешний вид карточек в `_components.scss`:**
```scss
.reveal .card {
  background: var(--lecture-surface-glass);
  border: 1px solid var(--lecture-border);
  border-radius: var(--lecture-radius-lg); // Изменить радиус скругления
  padding: 1.2em 1.5em;                   // Изменить внутренние отступы
  box-shadow: var(--lecture-shadow-sm);   // Изменить тень
  backdrop-filter: blur(16px);            // Интенсивность размытия стекла
}
```

---

### 3.2. Коллауты и врезки (Callouts)

| Класс в QMD | Назначение | Основные CSS-свойства |
|:---|:---|:---|
| `.key-idea` | Главный вывод / Инсайт | `border-left: 5px solid var(--lecture-accent)` |
| `.definition` | Математическое/техническое определение | `border-left: 5px solid var(--lecture-border-dark)` |
| `.takeaway` | Итоговая плашка внизу слайда | `background: var(--lecture-surface-glass)` |
| `.warning` / `.info-box` | Предупреждения и подсказки | `var(--lecture-warning)`, `var(--lecture-info)` |

**Пример в `.qmd`:**
```markdown
::: {.key-idea}
<div class="key-idea-title">Ключевая идея</div>
Авторегрессионный декодинг токенов упирается в пропускную способность HBM-памяти.
:::

::: {.takeaway}
**Вывод:** Используйте Grouped-Query Attention (GQA) для снижения объема KV-кэша.
:::
```

---

### 3.3. Математические формулы KaTeX (`.formula-card`)

Формулы центрируются и изолируются от наложения слоев.

**В `_components.scss`:**
```scss
.reveal .formula-card {
  background: var(--lecture-surface);
  border: 1px solid var(--lecture-accent-border);
  border-radius: var(--lecture-radius-md);
  padding: 1.2em;
  
  .katex-display {
    font-size: 1.15em; // Размер математических символов
    margin: 0.6em 0;
  }
}
```

**Пример в `.qmd`:**
```markdown
::: {.formula-card}
### Каноническая формула памяти KV-кэша
$$M_{\text{KV}} = 4 \times L \times H_{\text{KV}} \times D_{\text{head}} \times B \times S \quad [\text{Bytes}]$$
:::
```

---

### 3.4. Блоки кода и окно терминала macOS

Стилизация окна терминала macOS настроена в `00_template/theme/_reveal-overrides.scss`.

**Как это работает:**
Любой блок кода автоматически получает шапку с тремя цветными кнопками окна macOS (красная, желтая, зеленая):

```scss
.reveal pre::before {
  content: '';
  display: block;
  height: 28px;
  background: var(--lecture-surface-dark);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  /* Рисует 3 точки окна через box-shadow: */
  box-shadow: 16px 14px 0 5px #ff5f56, 36px 14px 0 5px #ffbd2e, 56px 14px 0 5px #27c93f;
}
```

---

### 3.5. Блоки метрик и KPI (`.metric-card`)

Для демонстрации числовых показателей (Latency, Accuracy, Speedup).

**Пример в `.qmd`:**
```markdown
::: {.metric-row}
::: {.metric-card}
<div class="metric-num">3.8 ms</div>
<div class="metric-lbl">Inter-Token Latency</div>
<div class="metric-delta positive">+2.4x Speedup</div>
:::

::: {.metric-card}
<div class="metric-num">1.75 GB</div>
<div class="metric-lbl">KV-Cache (32k Seq)</div>
<div class="metric-delta positive">-78% VRAM</div>
:::
:::
```

**Где настраивать:** `_components.scss` (поиск по `.metric-num`).
- Градиент цифр: `background: var(--lecture-accent-gradient)`.
- Размер шрифта: `font-size: 2.2em`, `font-weight: 800`.

---

### 3.6. Сравнительные карточки (Pros vs Cons)

**Пример в `.qmd`:**
```markdown
::: {.compare-container}
::: {.compare-card .compare-pro}
<div class="compare-title">✅ Преимущества FlashAttention-3</div>
<ul>
  <li>Асинхронный TMA-трансфер в SRAM на H100</li>
  <li>FP8 поддержка с точностью GEMM</li>
</ul>
:::

::: {.compare-card .compare-con}
<div class="compare-title">⚠️ Ограничения</div>
<ul>
  <li>Требует архитектуры Hopper (SM90+)</li>
</ul>
:::
:::
```

**Где настраивать:** `_components.scss` (`.compare-pro` использует `--lecture-success`, `.compare-con` использует `--lecture-danger`).

---

### 3.7. Таблицы и таксономические матрицы (`.matrix-table`)

Для больших сравнительных таблиц моделей.

**Пример в `.qmd`:**
```markdown
::: {.matrix-container}
| Модель | Модальность | Контекст | VRAM | Latency |
|:---|:---|:---|:---|:---|
| **Qwen2.5-7B** | Text | 128k | 14.8 GB | 11 ms/tok |
| **MiniCPM-V** | Vision+Text | 32k | 16.2 GB | 14 ms/tok |
:::
```

**Где настраивать:** `_components.scss` (`.reveal table.matrix-table`).
- Фон заголовка таблицы: `background: var(--lecture-surface-dark)`.
- Чередование строк: `tbody tr:nth-child(even)`.

---

### 3.8. Пошаговые процессы и пайплайны (`.step-flow`)

**Пример в `.qmd`:**
```markdown
::: {.step-flow}
::: {.step-flow-item}
<div class="step-number">Step 01</div>
<div class="step-title">Выбор и Среда</div>
<div class="step-desc">Клонировать baseline репозиторий, зафиксировать requirements.txt.</div>
:::

::: {.step-flow-item}
<div class="step-number">Step 02</div>
<div class="step-title">Baseline Inference</div>
<div class="step-desc">Запустить эталонный инференс на 100 тестовых примерах.</div>
:::
:::
```

---

### 3.9. Титульные слайды (Hero) и Разделители (Section)

Разметка слайдов настроена в `00_template/theme/_layout.scss` и оптимизирована в пресетах (в частности, в `_preset-monochrome.scss`).

Доступные архетипы:
- **Hero:** `.hero-split` (двухколоночный), `.hero-glow` (неоновый), `.hero-swiss-pure` (минималистичный), `.hero-dark-minimal`.
- **Section:** `.section-split` (с карточкой тем), `.section-watermark` (с фоновым водяным знаком), `.section-minimal` (с акцентной линией), `.section-banner` (центрированный), `.section-hairline-agenda`, `.section-pure-numeral`, `.section-minimal-line`, `.section-centered-modern`.

#### Два формата слайдов секций в Kinetic Monochrome:

1. **Темный формат (светлые шрифты на черном фоне):**
   Задается фоном `## {background-color="#000000"}` (или `#0a0a0a` / `#0f172a` / `.dark-slide` / `.section-dark`):
   ```markdown
   ## {background-color="#000000"}

   ::: {.section-slide .section-split}
   ::: {.section-main}
   <div class="section-number">Раздел 01</div>
   <div class="section-title">Архитектурные Основы <span class="gradient-text">& Scaling</span></div>
   <div class="section-desc">От плотных вычислений к субквадратичному вниманию и MoE.</div>
   :::

   ::: {.section-agenda-card}
   <div class="agenda-header">📋 Темы раздела</div>
   <ul class="agenda-list">
     <li class="agenda-item"><span class="agenda-num">1</span><span class="agenda-tag">Принцип Single-Focus</span></li>
     <li class="agenda-item"><span class="agenda-num">2</span><span class="agenda-tag">Факторизация сверток</span></li>
   </ul>
   :::
   :::
   ```

2. **Светлый формат (темные шрифты на светлом фоне):**
   Используется по умолчанию в светлой теме либо с `## {background-color="#ffffff"}` / `.section-light`:
   ```markdown
   ##

   ::: {.section-slide .section-split}
   ::: {.section-main}
   <div class="section-number">Раздел 01</div>
   <div class="section-title">Архитектурные Основы <span class="gradient-text">& Scaling</span></div>
   <div class="section-desc">От плотных вычислений к субквадратичному вниманию и MoE.</div>
   :::

   ::: {.section-agenda-card}
   <div class="agenda-header">📋 Темы раздела</div>
   <ul class="agenda-list">
     <li class="agenda-item"><span class="agenda-num">1</span><span class="agenda-tag">Принцип Single-Focus</span></li>
     <li class="agenda-item"><span class="agenda-num">2</span><span class="agenda-tag">Факторизация сверток</span></li>
   </ul>
   :::
   :::
   ```

---

### 3.10. Логотипы партнеров в правом верхнем углу (`.slide-header-logos`)

В правом верхнем углу каждого слайда автоматически отображаются векторные логотипы партнеров и курса (**Huawei** и **Байкал Электроникс**).

**Как это работает:**
1. Файл `00_template/theme/header-logos.html` подключается через `include-after-body` в `_quarto.yaml`.
2. Логотипы отрисованы в виде встроенных inline SVG с `fill="currentColor"`.
3. Стилизация в `_reveal-overrides.scss` автоматически адаптирует цвет:
   - На светлых слайдах/темах логотипы темные с легкой прозрачностью (`color: rgba(15, 23, 42, 0.75)`).
   - На темных слайдах/темах (`has-dark-background` / dark presets) логотипы становятся светлыми (`color: rgba(248, 250, 252, 0.88)`).
4. Логотипы масштабируются вместе с холстом 16:9 (`.reveal .slides`) и всегда идеально позиционируются в верхнем правом углу (`top: 26px; right: 36px;`).

**Как скрыть логотипы на отдельном слайде:**
Если на конкретном слайде (например, титульном или специальном) логотипы не нужны, добавьте слайду класс `.no-logo` или `.no-header-logos`:

```markdown
## {class="no-logo"}

::: {.hero-container}
...
:::
```

### 3.11. Номера слайдов (`.slide-number`) и адаптивная контрастность

В правом нижнем углу каждого слайда отображается плавающий бейдж с номером текущего слайда и общего количества (`c/t`).

**Адаптивная контрастность и поддержка темного/светлого фона:**
1. **На обычных светлых слайдах:** четкий контрастный текст цвета заголовков (`--lecture-fg`), легкая подложка с блюром и аккуратная граница.
2. **На темных слайдах и разделителях секций:** автоматическое переключение на чистый белый текст (`#ffffff`), полупрозрачную обсидиановую подложку (`rgba(15, 23, 42, 0.88)`), светлую контурную границу и глубокую тень, исключающую любое сливание с фоном.
3. **На титульных слайдах (`.hero-container`):** специальный усиленный режим отображения (чуть увеличенный размер, премиальная рамка с мягким свечением и повышенная четкость разделителя).

---

## 4. Как применить стили только к одной презентации

Если вам нужно изменить тему конкретной презентации, не меняя глобальный `theme.scss` для остальных лекций:

### Вариант А: Использовать автономный файл темы в YAML
В шапке целевого `.qmd` укажите нужный автономный SCSS:

```yaml
---
format:
  revealjs:
    theme:
      - default
      - ../00_template/theme/theme-dark-tech.scss # Применит Dark Tech только к этому файлу
width: 1600
height: 900
---
```

### Вариант B: Локальные переопределения через блок `<style>`
Прямо в `.qmd` файле можно добавить блок локальных CSS-переменных:

```html
```{=html}
<style>
:root {
  --lecture-accent: #10b981; /* Зеленый изумрудный акцент только на этом слайде/файле */
  --lecture-radius-md: 16px; /* Более круглые углы карточек */
}
</style>
```
```

---

## 5. Live Preview (Горячая перезагрузка при редактировании)

Для удобной визуальной подгонки элементов запустите Quarto в режиме живого сервера:

```bash
# Для интерактивного превью лекции 1:
python render_lectures.py --preview 1

# Или напрямую через Quarto:
quarto preview 01_intro/lecture_01.qmd
```

При каждом сохранении `.scss` или `.qmd` файла браузер автоматически обновит слайды за доли секунды.

---

## 6. Система масштабирования и авто-подгона слайдов (Slide Scaler)

Для решения проблемы переполнения контента на плотных технических слайдах в систему встроен автономный движок **Slide Scaler**:

### 6.1. Возможности и режимы
1. **Режим умного авто-подгона (Smart Auto-Fit):**
   - Включен по умолчанию. При переходе на любой слайд система измеряет фактическую высоту контента.
   - Если контент превышает 900px, слайд автоматически масштабируется так, чтобы все элементы, карточки и формулы целиком поместились на экране.
   - Если контент укладывается в 900px, масштаб сохраняется на 100%.
2. **Интерактивный плавающий пульт (Floating Scaler Pill):**
   - Расположен в левом нижнем углу экрана (`bottom: 22px; left: 56px;`).
   - Кнопка `−`: уменьшение масштаба с шагом 5% (вплоть до 50%).
   - Индикатор процента (`100%`, `85%` и т.д.): клик сбрасывает к 100% или переключает популярный масштаб.
   - Кнопка `+`: увеличение масштаба с шагом 5% (вплоть до 150%).
   - Кнопка `Fit`: включение/выключение режима авто-подгона.
3. **Плавная вертикальная прокрутка (Scrollable Fallback):**
   - Для экстремально длинных слайдов (>1600px) контент снабжается аккуратным полупрозрачным скроллбаром (`overflow-y: auto`), исключая потерю информации.

### 6.2. Горячие клавиши (Keyboard Shortcuts)
| Клавиша | Действие |
|:---|:---|
| `-` или `_` или `[` | Уменьшить масштаб контента (−5%) |
| `+` или `=` или `]` | Увеличить масштаб контента (+5%) |
| `0` | Сбросить масштаб к 100% |
| `F` или `f` | Включить/выключить режим Auto-Fit |
| `Alt + Колесо мыши` | Плавное масштабирование контента слайда колесом |
\n