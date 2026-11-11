# Tally — Planificación de la app de gastos por voz

## 1. Visión

**Tally** es una app para registrar gastos hablando. El usuario dice algo como
*"Gasté 3500 pesos en el súper"* y la app:

1. Transcribe la voz a texto.
2. Extrae el **monto**, la **descripción** y la **fecha**.
3. Asigna **automáticamente una categoría** (Supermercado, Transporte, Salud…).
4. Guarda el gasto y muestra un **gráfico circular** con los gastos del mes por categoría.

**Restricción principal:** todo el stack debe ser **gratuito** (sin costos de licencias, APIs pagas ni hosting pago).

### Resumen visual

Resumen del plan con bocetos de las seis pantallas (Inicio, Confirmación, Gastos, Detalle del gasto, Resumen mensual y Ajustes), decisiones, stack y fases:

**[public/plan.html](public/plan.html)**

- Es una página HTML pública dentro del repo. GitHub muestra su código; para verla renderizada, descargarla y abrirla en el navegador, o correr `npm run dev` y abrir http://localhost:5173/plan.html.
- Se publica junto con la app en https://gabi-einz.github.io/tally/plan.html.
- Los montos de las pantallas son datos de ejemplo.
- Versión original, privada: [artifact en claude.ai](https://claude.ai/artifact/UDsGEYWcyzsToGjriCN84Q) (solo la puede abrir su dueño).

---

## 2. Alcance

### MVP (versión 1)
- Grabar un gasto por voz con un botón (mantener presionado o tocar para empezar/terminar).
- Transcripción a texto en español.
- Extracción de monto (números en cifras y en palabras: "mil quinientos").
- Categorización automática.
- Pantalla de confirmación para corregir monto/categoría antes de guardar.
- Lista de gastos del mes (editar/eliminar).
- Gráfico circular de gastos mensuales por categoría, con selector de mes.
- Gastos en pesos argentinos con su **equivalente en dólar blue y en dólar cripto** según las cotizaciones de la fecha del gasto.
- **Respaldo automático en Google Drive** del usuario.
- Funciona offline y se instala en el celular (PWA).

### Fuera del MVP (versiones futuras)
- Sincronización en tiempo real entre dispositivos (Firebase u otra alternativa).
- Presupuestos por categoría y alertas.
- Exportar a CSV.
- Registrar gastos en monedas distintas de pesos y dólares (euros, reales, etc.).
- Gráficos adicionales (evolución mensual, comparación entre meses).

---

## 3. Stack tecnológico (100 % gratuito)

| Capa | Tecnología | Por qué | Costo |
|---|---|---|---|
| Tipo de app | **PWA** (Progressive Web App) | Se instala en Android/iOS/escritorio desde el navegador; sin tiendas ni cuentas de desarrollador pagas | Gratis |
| Frontend | **React + TypeScript + Vite** | Ecosistema maduro, build rápido, tipado | Open source |
| Estilos | **Tailwind CSS** | Rápido para UI mobile-first | Open source |
| Idiomas de la interfaz | **i18next + react-i18next** | Textos de la app en español e inglés, cambio de idioma sin recargar | Open source |
| Reconocimiento de voz (principal) | **Web Speech API** (`SpeechRecognition`) | Nativo del navegador, sin claves ni costo, soporta `es-AR`/`es-ES` | Gratis |
| Reconocimiento de voz (respaldo) | **Whisper vía Transformers.js** (`whisper-tiny`/`whisper-base`) | Corre 100 % en el navegador (WebGPU/WASM) para navegadores sin Web Speech API (ej. Firefox) y offline | Open source |
| Parseo de monto/fecha | Parser propio en TS (regex + conversor de números en palabras) | Control total, sin dependencias pagas | Gratis |
| Categorización | **Motor híbrido local**: reglas aprendidas + diccionario de palabras clave + embeddings con **Transformers.js** (`multilingual-e5-small`) | Funciona offline, sin API pagas, mejora con las correcciones del usuario | Open source |
| Base de datos local | **IndexedDB con Dexie.js** | Persistencia en el dispositivo, consultas por fecha, funciona offline | Open source |
| Gráficos | **Chart.js + react-chartjs-2** | Gráfico circular (pie/doughnut) listo, liviano | Open source |
| PWA / offline | **vite-plugin-pwa** (Workbox) | Service worker, caché de modelos y assets, instalación | Open source |
| Tests | **Vitest + Testing Library**, **Playwright** (E2E) | Integrados con Vite | Open source |
| Hosting | **GitHub Pages** (deploy desde GitHub Actions, ruta base `/tally/`) | HTTPS gratis (requisito para usar el micrófono), sin cuentas ni secrets extra | Gratis en repos públicos |
| CI/CD | **GitHub Actions** | Build, tests y deploy automático | Gratis en repos públicos (2000 min/mes en privados) |
| Respaldo en la nube | **Google Drive API** (carpeta oculta `appDataFolder`) + **Google Identity Services** (login OAuth en el navegador) | Respaldo automático en el Drive del propio usuario, sin servidor propio | Gratis (usa los 15 GB del usuario) |
| Tipo de cambio | **ArgentinaDatos API** (blue y cripto, histórico por fecha); opcional **DolarAPI** (día en curso) | Cotizaciones del dólar en Argentina por fecha, sin clave | Gratis |
| Sync en tiempo real (futuro) | **Firebase** (plan Spark) | Solo si más adelante se usa en varios dispositivos a la vez | Plan gratuito |

> **Nota sobre Web Speech API:** en Chrome/Edge el audio se procesa en servidores de Google/Microsoft (gratis para el usuario, pero requiere conexión). Por eso se incluye Whisper local como respaldo y como opción "modo privado/offline" en Ajustes.

### 3.1 Compatibilidad móvil

La app se ejecuta en el celular como PWA: un solo código para Android e iPhone, sin tiendas ni cuentas de desarrollador pagas.

**Plataforma objetivo actual: Android (Chrome).** Todas las pruebas del MVP se hacen en Android. iPhone queda como objetivo posterior: el diseño no lo impide, pero no se prueba por ahora.

#### Android (prioridad)
| Aspecto | Comportamiento | Decisión |
|---|---|---|
| Instalación | Chrome muestra el aviso de instalación (`beforeinstallprompt`) | Botón "Instalar app" en Inicio que dispara el aviso |
| Reconocimiento de voz | Web Speech API funciona bien en `es-AR` (procesa en servidores de Google) | Motor principal; Whisper local como respaldo offline |
| Micrófono | Permiso persistente por sitio una vez concedido | Pedirlo al primer uso con una explicación previa |
| Modelos locales | Whisper y embeddings corren en equipos de gama media en adelante | Usar modelos cuantizados; descarga automática en segundo plano en el primer uso, sin pedir confirmación |
| Almacenamiento | IndexedDB persistente con la app instalada | Llamar a `navigator.storage.persist()` al instalar |

**Equipos de prueba mínimos:**
- Un Android de gama media (4 GB de RAM, Android 12+) con Chrome actualizado.
- Un Android de gama baja (2–3 GB de RAM) para medir rendimiento de los modelos.
- Emulador de Android Studio (gratis) para pruebas rápidas; el micrófono se valida siempre en un equipo real.

**Cómo probar en el celular durante el desarrollo:**
- `vite --host` + acceso por la IP local. El micrófono exige HTTPS fuera de `localhost`, así que se usa **depuración remota de Chrome** (`chrome://inspect` con el celular por USB y *port forwarding* del puerto de Vite), o la app publicada en GitHub Pages.

#### iPhone (posterior, no se prueba en el MVP)
Limitaciones conocidas a resolver cuando se incorpore:
- Sin aviso de instalación: hay que agregarla a mano desde Compartir → "Agregar a inicio".
- Web Speech API históricamente menos confiable con la app instalada en la pantalla de inicio; puede requerir Whisper como motor principal en iOS.
- Safari puede borrar los datos de webs no usadas por ~7 días (las apps instaladas en inicio en general están exentas).
- Límite de memoria más estricto: usar solo los modelos más chicos.
- Plan B si la voz no funciona bien: envolver la app con **Capacitor** y usar el reconocimiento nativo (implica cuenta de Apple de USD 99/año, fuera del requisito de gratuidad).

---

## 4. Arquitectura

```
┌───────────────────────────── Navegador (PWA) ─────────────────────────────┐
│                                                                           │
│  [Botón micrófono]                                                        │
│        │ audio                                                            │
│        ▼                                                                  │
│  ┌──────────────────┐   texto   ┌─────────────────┐  {monto, desc, fecha} │
│  │ VoiceService     │ ────────► │ ExpenseParser   │ ─────────┐            │
│  │ - WebSpeech      │           │ - montos        │          │            │
│  │ - Whisper (WASM) │           │ - fechas        │          ▼            │
│  └──────────────────┘           └─────────────────┘  ┌──────────────────┐ │
│                                                      │ Categorizer      │ │
│                                                      │ 1. reglas user   │ │
│                                                      │ 2. keywords      │ │
│                                                      │ 3. embeddings    │ │
│                                                      └────────┬─────────┘ │
│                                                               ▼           │
│                                               [Pantalla de confirmación]  │
│                                                               │           │
│                                                               ▼           │
│  ┌──────────────────┐   consultas por mes   ┌──────────────────────────┐  │
│  │ Gráfico circular │ ◄──────────────────── │ IndexedDB (Dexie)        │  │
│  │ (Chart.js)       │                       │ expenses, categories,    │  │
│  └──────────────────┘                       │ rules, exchangeRates     │  │
│                                             └──────┬────────────▲──────┘  │
│                                                    │ backup     │ USD     │
└────────────────────────────────────────────────────┼────────────┼─────────┘
                                                     ▼            │
                                       Google Drive (appDataFolder)   API de cotizaciones
                                       del usuario                    (ArgentinaDatos)
```

Toda la lógica corre en el cliente: **no hay backend propio** en el MVP, lo que elimina costos de servidor. Los únicos servicios externos son el Drive del usuario y la API pública de cotizaciones, ambos gratuitos y consumidos directamente desde el celular.

---

## 5. Modelo de datos

```ts
interface Expense {
  id: string;            // uuid
  amount: number | null; // en centavos de ARS para evitar errores de punto flotante; null si se dictó en USD y falta la cotización
  currency: 'ARS';
  originalAmount: number;          // monto tal como se dictó, en centavos de su moneda
  originalCurrency: 'ARS' | 'USD'; // 'USD' si la frase mencionaba dólares (ver 6.4)
  dictationLang: 'es-AR' | 'en-US';// idioma en que se dictó
  usdBlue: UsdConversion | null;   // dólar blue: cotización (1 USD = X ARS) y equivalente; null mientras no se obtuvo
  usdCripto: UsdConversion | null; // dólar cripto (USDT): cotización (1 USDT = X ARS) y equivalente; null si está pendiente o no hay cotización
  description: string;   // "súper", "nafta", "farmacia"
  categoryId: string;
  date: string;          // ISO "2026-11-01"
  rawTranscript: string; // texto original dictado (para depurar/re-entrenar)
  categorySource: 'rule' | 'keyword' | 'embedding' | 'manual';
  confidence: number;    // 0..1
  createdAt: number;
  updatedAt: number;     // para resolver conflictos al restaurar el respaldo de Drive
}

interface Category {
  id: string;
  name: string;          // "Supermercado"
  color: string;         // color en el gráfico
  icon: string;
  keywords: string[];    // ["super", "supermercado", "coto", "carrefour", "verdulería"]
  description: string;   // texto usado para el embedding de la categoría
}

interface LearnedRule {
  id: string;
  pattern: string;       // término normalizado: "carrefour"
  categoryId: string;
  hits: number;          // veces confirmada por el usuario
  updatedAt: number;     // para resolver conflictos al restaurar el respaldo de Drive
}

interface UsdConversion {
  rate: number;          // cuántos ARS vale 1 USD blue o 1 USDT (venta), ej. 1565 o 1643.99
  amount: number;        // equivalente del gasto en centavos de USD/USDT = round(amount ARS / rate)
  rateDate: string;      // fecha de la cotización usada (normalmente la del gasto)
  rateSource: 'dolarapi' | 'argentinadatos';
  capturedAt: number;    // momento en que se obtuvo la cotización (timestamp)
}

type DollarType = 'blue' | 'cripto';

interface ExchangeRate {
  id: string;            // "2026-11-02:blue"
  date: string;          // fecha de la cotización
  type: DollarType;
  sell: number;          // valor de venta en pesos
  fetchedAt: number;
}
```

Índices Dexie: `expenses: 'id, date, categoryId'`, `rules: 'id, &pattern'`, `exchangeRates: 'id, date'`.

### Categorías iniciales
Supermercado · Comida y restaurantes · Transporte · Servicios (luz, gas, internet) · Vivienda/Alquiler · Salud · Entretenimiento · Ropa · Educación · Suscripciones · Mascotas · Regalos · **Otros** (fallback).

---

## 6. Flujo de registro por voz

1. Usuario toca el botón de micrófono.
2. `VoiceService` elige el motor según la preferencia configurada en Ajustes (ver 6.1) y reconoce en el **idioma del dictado** elegido (ver 6.3).
3. Texto obtenido, ej.: *"ayer gasté dos mil trescientos en la farmacia"*.
4. `ExpenseParser` (con reglas específicas para cada idioma del dictado):
   - Normaliza (minúsculas, sin tildes para matching).
   - Monto: detecta `2300`, `2.300`, `2300,50`, `$2300` y números en palabras (`dos mil trescientos` → 2300). Palabras como "lucas"/"mil" se contemplan.
   - Moneda: si la frase menciona dólares ("dólares", "dólar", "usd", "verdes" / "dollars", "bucks", "US$"), el gasto se toma como **gasto en dólares** (ver 6.4). Sin mención, es en pesos.
   - Fecha: "hoy", "ayer", "anteayer", "el lunes", "el 15" → fecha ISO. Por defecto: hoy.
   - Descripción: el texto restante sin verbos de relleno ("gasté", "pagué", "en", "de").
5. `Categorizer` asigna categoría + confianza.
6. Pantalla de confirmación con los campos precargados. Si la confianza es baja (< 0.5), se resalta la categoría para que el usuario la revise.
7. Al guardar, si el usuario **cambió la categoría**, se crea/actualiza una `LearnedRule` → la próxima vez acierta.
   - Se crea **una regla por cada palabra importante** de la descripción, normalizada (minúsculas, sin tildes) y sin palabras de relleno: "Nafta en YPF" → `nafta` y `ypf`, ambas → Transporte.
   - `pattern` es único: si la palabra ya tenía regla, se actualiza su categoría, `hits` y `updatedAt`.
   - Al categorizar, si varias palabras tienen reglas con categorías distintas, gana la de más `hits`.
8. Se calculan los **equivalentes en dólar blue y dólar cripto** con las cotizaciones de la fecha del gasto (ver 6.2).
9. Se programa un **respaldo en Google Drive** (ver 6.5).

### 6.1 Selector de motor de voz

En Ajustes hay un control (botones segmentados) para elegir qué motor de voz usar:

| Opción | Comportamiento | Cuándo conviene |
|---|---|---|
| **Automático** (por defecto) | Usa Chrome (Web Speech API) si hay internet; si no hay conexión, cambia a Whisper base | Uso diario: rápido con conexión y sigue funcionando sin ella |
| **Solo Chrome** | Usa siempre Web Speech API. Sin internet, muestra un aviso y ofrece la carga manual | Equipos de gama baja, donde Whisper es lento |
| **Solo Whisper** | Usa siempre Whisper base en el celular, aun con conexión | Privacidad: el audio nunca sale del dispositivo |

Detalles de implementación:
- La preferencia se guarda en IndexedDB (`settings.voiceEngine: 'auto' | 'chrome' | 'whisper'`).
- La conexión se detecta con `navigator.onLine` y los eventos `online`/`offline`; si Web Speech API falla con error de red, en modo Automático se reintenta con Whisper.
- El modelo de Whisper base (~75 MB) se descarga **siempre y sin pedir confirmación**, en segundo plano al abrir la app por primera vez, sea cual sea la opción elegida. Así cambiar de motor nunca requiere esperar una descarga.
- Si se elige "Solo Whisper" antes de que termine la descarga, se muestra el progreso y la grabación se habilita al completarse.
- Si el navegador no soporta Web Speech API, la opción "Solo Chrome" aparece deshabilitada con una explicación.
- En la pantalla de grabación se muestra un indicador pequeño del motor en uso (ej. "Chrome" / "Local").

### 6.2 Región y equivalente en dólares

**Región por defecto: Argentina** — idioma `es-AR` para el reconocimiento de voz, moneda **ARS**, palabras clave con comercios y modismos locales ("lucas", "mangos", Coto, SUBE, Rappi, Mercado Pago).

Cada gasto se guarda en pesos y, además, en **dos campos aparte** con su valor en **dólar blue** y en **dólar cripto**, según las cotizaciones de la **fecha del gasto** (no de la fecha en que se cargó). No hay selector de tipo de dólar: siempre se guardan ambos.

- **Fuentes** (gratuitas, sin clave y con CORS abierto; verificadas el 2026-11-02):

  | Uso | API | Endpoint |
  |---|---|---|
  | **Principal:** cotización de una fecha | **ArgentinaDatos** | `GET https://api.argentinadatos.com/v1/cotizaciones/dolares/{blue\|cripto}/2026/10/30` → `{ casa, compra, venta, fecha }` |
  | Carga inicial del histórico | **ArgentinaDatos** | `GET https://api.argentinadatos.com/v1/cotizaciones/dolares/{blue\|cripto}` → lista diaria (blue desde 2011, cripto desde 2023-02-07) |
  | Cotización del día en curso, actualizada durante la jornada (opcional) | **DolarAPI** | `GET https://dolarapi.com/v1/dolares/{blue\|cripto}` → `{ compra, venta, fechaActualizacion }` |

  No se usa una fuente de respaldo: si ArgentinaDatos no responde, el valor queda pendiente y se reintenta.
- **Cotizaciones guardadas en cada gasto:** además de los equivalentes, cada gasto guarda **a cuántos pesos equivalía 1 USD blue y 1 USDT** (`usdBlue.rate` y `usdCripto.rate`), junto con la fuente y el momento en que se obtuvieron. Así cada gasto conserva su propio tipo de cambio aunque las cotizaciones cambien después.
  - **Gasto con fecha de hoy:** se toma la cotización **del momento en que se registra**, desde DolarAPI (se actualiza durante el día).
  - **Gasto con fecha pasada** ("ayer", "el lunes"): se usa la cotización de ese día, desde ArgentinaDatos.
  - El dólar cripto de estas APIs es el precio promedio de las stablecoins en dólares (USDT/USDC) en exchanges argentinos, que se toma como el valor de 1 USDT.
- **Cálculo:** `usdBlue.amount = round(amount / usdBlue.rate)` y `usdCripto.amount = round(amount / usdCripto.rate)`, usando el valor de **venta**.
- **Fines de semana y feriados:** ArgentinaDatos devuelve valores también esos días (repite el último hábil); si faltara, se usa el último día anterior con dato y se guarda en `rateDate`.
- **Caché:** las cotizaciones se guardan en IndexedDB (`exchangeRates`); al iniciar se descargan las de ambos tipos del mes en curso y del anterior para cubrir gastos cargados sin conexión.
- **Sin conexión:** el gasto se guarda igual con `usdBlue`/`usdCripto = null` y queda marcado "USD pendiente". Cada campo se completa por separado.
  - **Cuándo se completan** (solo con la app abierta):
    1. **Al volver la conexión** mientras la app está abierta: se escucha el evento `online` y se procesan los pendientes en segundo plano, sin bloquear la UI.
    2. **Al abrir la app:** si hay pendientes y hay conexión, se procesan al iniciar.
    - No se usa Background Sync (completar con la app cerrada); los pendientes esperan hasta la próxima apertura.
    - Si la API falla, se reintenta con espera creciente (1 min, 5 min, 15 min, 1 h) mientras la app siga abierta.
  - **Qué cotización se usa al completarlo:**
    - Gasto de un **día anterior**: la de esa fecha, desde ArgentinaDatos (mismo resultado que con conexión).
    - Gasto de **hoy** y la conexión vuelve **el mismo día**: la cotización del momento en que se completa, desde DolarAPI (la del instante exacto del registro no se puede obtener sin conexión).
    - Gasto de **hoy** pero se completa **otro día**: la del día del gasto, desde ArgentinaDatos.
    - En todos los casos se guardan la fuente y `capturedAt`, visibles en el Detalle del gasto.
  - Mientras está pendiente, el Resumen en USD no lo suma y muestra un aviso con la cantidad de gastos pendientes.
- **Gastos anteriores al 2023-02-07:** no existe cotización cripto; `usdCripto` queda en `null` marcado "sin cotización" (no se reintenta).
- **Edición:** si se cambia el monto, se recalculan los equivalentes con las cotizaciones ya guardadas; si se cambia la fecha, se obtienen las cotizaciones de la nueva fecha.
- **En la UI:** la lista muestra el monto en pesos y debajo los dos equivalentes (ej. "$ 23.000 · US$ 14,70 blue · US$ 13,99 cripto"); el Resumen mensual tiene un conmutador **ARS / USD blue / USD cripto** para ver el gráfico circular y los totales en la moneda elegida.

### 6.3 Idioma del dictado

Ajuste separado del idioma de la app: **Español (`es-AR`)**, por defecto, o **English (`en-US`)**.

| Pieza | Cambio al dictar en inglés |
|---|---|
| Chrome (Web Speech API) | `recognition.lang = 'en-US'` |
| Whisper base | Mismo modelo (multilingüe), con `language: 'en'`; no hay descarga extra |
| Parser de montos | Números en palabras en inglés ("twenty-three thousand", "2.5k"), coma de miles y punto decimal (`$23,000.50`) |
| Parser de fechas | "today", "yesterday", "last Monday", "on the 15th" |
| Descripción | Palabras de relleno en inglés ("I spent", "I paid", "on", "at", "for") |
| Categorización | Diccionario de palabras clave en inglés ("groceries", "gas", "rent", "pharmacy"); los comercios locales (Coto, SUBE, Rappi) se comparten. Reglas aprendidas y modelo e5 (multilingüe) sin cambios |
| Pruebas | Set de ~100 frases en inglés, mismo objetivo de ≥ 85 % de aciertos |

- Implementación: `ExpenseParser` y el diccionario de palabras clave se organizan por idioma (`parser/es`, `parser/en`, `data/keywords.es.json`, `data/keywords.en.json`) para poder sumar idiomas después.
- Costo: $0; solo tiempo de desarrollo (Fase 10).

### 6.4 Gastos dictados en dólares

Si la frase menciona dólares (en cualquiera de los dos idiomas del dictado), el gasto se registra como **gasto en dólares** y se convierte a pesos con la **cotización del dólar blue del día del gasto**.

- Ejemplos: *"gasté 20 dólares en Steam"*, *"I spent 20 dollars on Spotify"* → US$ 20.
- Se guarda el monto original (`originalAmount` y `originalCurrency: 'USD'`) y se calcula `amount` en pesos = monto en dólares × cotización blue (venta). Ej.: US$ 20 × $ 1.565 = $ 31.300.
- `usdBlue.amount` queda igual al monto original; `usdCripto` se calcula desde los pesos como en cualquier otro gasto.
- La cotización sigue las mismas reglas que el resto: la del momento si el gasto es de hoy (DolarAPI) o la de la fecha si es de un día anterior (ArgentinaDatos).
- **Sin conexión:** no se puede calcular el monto en pesos. El gasto se guarda con el monto en dólares y queda "Pesos pendiente"; se completa igual que los USD pendientes (al volver la conexión o al abrir la app). Mientras tanto no suma en los totales en pesos.
- **Confirmación:** el campo Monto muestra "US$ 20" y debajo el equivalente en pesos ("≈ $ 31.300"), y se puede cambiar la moneda con un selector ARS / USD por si el parser se equivocó.
- **Detalle:** muestra el monto original en dólares, el monto en pesos y la cotización usada para convertirlo.
- **Edición:** si se cambia el monto en dólares, se recalcula el monto en pesos con la cotización guardada; si se cambia la fecha, se usa la cotización de la nueva fecha.

### 6.5 Respaldo automático en Google Drive

Los datos viven en el celular (IndexedDB) y se respaldan **automáticamente** en el Google Drive del usuario.

- **Dónde:** carpeta oculta de la app en Drive (`appDataFolder`). El usuario no la ve entre sus archivos y la app no tiene acceso al resto de su Drive (scope `drive.appdata`).
- **Login:** botón "Conectar Google Drive" en Ajustes, con **Google Identity Services** (OAuth en el navegador). Requiere crear un proyecto gratuito en Google Cloud Console con un OAuth Client ID; en modo "prueba" admite hasta 100 usuarios sin verificación de Google, suficiente para uso personal.
- **Qué se sube:** un archivo `tally-backup.json` con gastos, categorías, reglas aprendidas y ajustes (no se suben los modelos ni las cotizaciones, que se pueden volver a descargar).
- **Cuándo:** unos segundos después de cada cambio (con *debounce* para agrupar varios cambios) y al volver a tener conexión si había cambios pendientes. Sin internet, los cambios quedan en cola.
- **Restaurar:** en un celular nuevo o tras reinstalar, al conectar Drive se ofrece "Restaurar respaldo" si existe uno.
- **Conflictos:** gana el más reciente por gasto (`updatedAt`), suficiente para un solo usuario con un dispositivo principal.
- **Estado visible:** en Ajustes se muestra "Último respaldo: hoy 14:32" o el error correspondiente (sin conexión, sesión vencida → botón para reconectar).
- La exportación/importación manual de JSON se mantiene como alternativa.

---

## 7. Categorización automática (detalle)

Estrategia en cascada; se usa el primer nivel que dé un resultado confiable:

| Nivel | Método | Ejemplo | Confianza |
|---|---|---|---|
| 1 | **Reglas aprendidas** del usuario (match exacto de término) | "Rappi" → Comida (porque el usuario lo corrigió antes) | 0.95 |
| 2 | **Diccionario de palabras clave** por categoría (con stemming simple y tolerancia a errores de transcripción con distancia de Levenshtein ≤ 1) | "nafta" → Transporte | 0.8 |
| 3 | **Similitud semántica con embeddings** (`multilingual-e5-small` en Transformers.js): se compara el embedding de la descripción contra el de cada categoría; se elige la de mayor similitud coseno | "cargué la SUBE" → Transporte, "vacuna del perro" → Mascotas | similitud normalizada |
| 4 | **Fallback** | sin match | Categoría "Otros", 0 |

- El modelo de embeddings (~30–120 MB según cuantización) se descarga **una sola vez en segundo plano** y queda en caché (Cache Storage) para uso offline. Mientras no esté listo, funcionan los niveles 1, 2 y 4.
- Embeddings de categorías se precalculan y guardan en IndexedDB.
- Métrica objetivo: **≥ 85 % de aciertos** sobre un set de 200 frases de prueba en español rioplatense.

> **Decisión confirmada: categorización 100 % local.** No se usa ningún LLM (Gemini, Groq u otros). Toda la categorización corre en el celular con la cascada de arriba: funciona sin internet, ningún dato del gasto sale del dispositivo y el costo es $0 garantizado. La precisión se mejora ampliando el diccionario de palabras clave y con las reglas aprendidas de las correcciones del usuario.

---

## 8. Pantallas

1. **Inicio**
   - Total gastado en el mes actual.
   - Botón grande de micrófono (acción principal).
   - Últimos 5 gastos, solo con el monto en pesos (sin valores en USD).
2. **Confirmación de gasto** (modal tras dictar)
   - Transcripción, monto (con selector de moneda ARS / USD; si es en dólares, muestra debajo el equivalente en pesos), descripción, categoría (selector), fecha. Las cotizaciones y los equivalentes en dólares no se muestran en esta pantalla (se ven en el Detalle del gasto). Botones Guardar / Reintentar / Cancelar.
3. **Gastos**
   - Lista del mes agrupada por día, con filtros por categoría; editar y eliminar. Cada gasto muestra solo el monto en pesos (sin valores en USD); al tocar un gasto se abre su Detalle, donde están las cotizaciones y los equivalentes.
   - Opción de alta manual (por si no se puede hablar).
4. **Detalle del gasto** (al tocar un gasto en Gastos o en Inicio)
   - Pantalla de **solo lectura**: monto en pesos destacado, fecha, descripción y categoría (sin campos editables). Si el gasto se dictó en dólares, muestra también el monto original ("US$ 20") y la cotización usada para pasarlo a pesos.
   - **Cotizaciones guardadas**, una debajo de la otra: 1 USD = $ X y 1 USDT = $ Y, con la fuente (DolarAPI o ArgentinaDatos) y el momento en que se obtuvieron.
   - **Equivalentes** del gasto en USD blue y en USDT, o "USD pendiente" si se cargó sin conexión.
   - **Origen:** transcripción dictada, motor de voz usado y cómo se eligió la categoría (regla aprendida, palabra clave, embeddings o manual) con su confianza.
   - Acciones **Editar** y **Eliminar**; eliminar pide confirmación dentro de la misma pantalla.
   - **Editar** abre la **pantalla de confirmación** con los datos del gasto precargados (monto, fecha, descripción y categoría) y el botón "Guardar cambios". Al guardar:
     - Si cambió la categoría, se crea o actualiza una **regla aprendida**.
     - Si cambió el monto, se recalculan los equivalentes con las cotizaciones guardadas.
     - Si cambió la fecha, se obtienen las cotizaciones de la nueva fecha.
5. **Resumen mensual**
   - Selector de mes (‹ Noviembre 2026 ›) y conmutador de moneda **ARS / USD blue / USD cripto**.
   - **Gráfico circular (doughnut)** con el total por categoría en la moneda elegida; tooltip con monto y %.
   - Leyenda/tabla debajo: categoría, monto, porcentaje. Tocar una porción filtra la lista de gastos.
6. **Ajustes**
   - **Selector de motor de voz** con tres opciones (ver sección 6.1). Valor por defecto: Automático.
   - **Idioma de la app:** Español (por defecto) o English.
     - Cambia todos los textos de la interfaz al instante, sin recargar; la preferencia se guarda en IndexedDB y se incluye en el respaldo de Drive.
     - Los nombres de las categorías por defecto se traducen; las categorías creadas por el usuario quedan como las escribió.
     - El formato de fechas y números sigue el idioma elegido (ej. "$ 23.000" / "$23,000"); la moneda sigue siendo ARS.
     - No cambia el idioma en que se dictan los gastos: eso es un ajuste aparte.
   - **Idioma del dictado:** Español (`es-AR`, por defecto) o English (`en-US`). **Independiente del idioma de la app** (ej. app en inglés y dictado en español). Ver sección 6.3.
   - Región: Argentina (`es-AR`, ARS) por defecto.
   - **Google Drive:** conectar/desconectar cuenta, estado del último respaldo, "Respaldar ahora" y "Restaurar respaldo".
   - Administrar categorías (nombre, color, palabras clave) y reglas aprendidas.
   - Exportar/importar respaldo JSON manual.

### Consulta para el gráfico
```ts
const start = '2026-11-01', end = '2026-11-30';
const expenses = await db.expenses.where('date').between(start, end, true, true).toArray();
const value = (e: Expense) =>
  currency === 'ARS' ? e.amount
  : currency === 'USD_BLUE' ? e.usdBlue?.amount
  : e.usdCripto?.amount;
const byCategory = sumBy(expenses.filter(e => value(e) != null), e => e.categoryId, value);
// → { categoryId: totalCentavos }. En modo USD se avisa si hay gastos con "USD pendiente" sin incluir.
```

---

## 9. Estructura del proyecto

```
tally/
├─ public/            # íconos PWA, manifest
├─ src/
│  ├─ app/            # rutas y layout
│  ├─ features/
│  │  ├─ voice/       # VoiceService, WebSpeechEngine, WhisperEngine
│  │  ├─ parser/      # parseAmount, parseDate, spanishNumbers
│  │  ├─ categorizer/ # rules, keywords, embeddings, index
│  │  ├─ expenses/    # lista, formulario, confirmación
│  │  ├─ currency/    # cliente ArgentinaDatos/DolarAPI (blue y cripto), caché de cotizaciones, conversión y pendientes
│  │  ├─ backup/      # Google Identity Services, Drive appDataFolder, cola y restauración
│  │  └─ summary/     # gráfico circular y tabla mensual (ARS / USD blue / USD cripto)
│  ├─ db/             # esquema Dexie y repositorios
│  ├─ workers/        # Web Workers para Whisper y embeddings (no bloquear UI)
│  ├─ locales/        # es.ts y en.ts con los textos de la interfaz (en.ts tipado igual que es.ts)
│  └─ data/           # categorías y keywords por defecto
├─ tests/
│  ├─ unit/           # parser y categorizer
│  ├─ fixtures/       # frases de prueba etiquetadas
│  └─ e2e/            # Playwright
└─ .github/workflows/ # CI + deploy
```

---

## 10. Plan de trabajo por fases

| Fase | Duración estimada | Entregables |
|---|---|---|
| **0. Setup** | 1–2 días | Repo (con identidad de git local, ver abajo), Vite + React + TS + Tailwind, oxlint/Prettier, Vitest, Node 24, GitHub Actions, deploy a GitHub Pages. **Android:** abrir el deploy en Chrome Android y configurar depuración remota (`chrome://inspect`) |
| **1. Datos y CRUD manual** | 3–4 días | Esquema Dexie, categorías por defecto, alta/edición/borrado manual, lista mensual, i18next configurado desde el inicio (todos los textos salen de `locales/`). **Android:** UI mobile-first verificada en pantalla de 360 px; datos persisten tras cerrar Chrome |
| **2. Gráfico mensual** | 2 días | Pantalla Resumen con doughnut Chart.js, selector de mes, tabla de porcentajes. **Android:** gráfico legible y tooltips con toque |
| **3. Voz (Web Speech API)** | 3 días | Botón de micrófono, permisos, transcripción en vivo, manejo de errores (sin permiso, sin soporte, silencio). **Android:** probar en equipo real con ruido ambiente, permiso denegado y sin conexión |
| **4. Parser** | 3–4 días | Montos en cifras y palabras, fechas relativas, descripción; tests unitarios con ≥ 100 frases. **Android:** las frases de prueba se graban dictando en el celular para capturar errores reales de transcripción |
| **5. Categorizador v1** | 3 días | Reglas aprendidas + palabras clave + fallback, pantalla de confirmación, aprendizaje por corrección. **Android:** flujo completo dictar → confirmar → guardar en < 10 s |
| **6. Categorizador v2 (embeddings)** | 4 días | Transformers.js en Web Worker, descarga/caché del modelo, evaluación con set de prueba ≥ 85 %. **Android:** medir tiempo de inferencia y uso de memoria en gama media y baja |
| **7. Whisper local + PWA offline** | 4–5 días | Motor de respaldo, selector de motor de voz en Ajustes (Automático / Solo Chrome / Solo Whisper), service worker, instalación, modo offline completo. **Android:** probar las tres opciones del selector con y sin conexión; instalar desde el aviso de Chrome, usar en modo avión, verificar que la UI no se congele durante la transcripción |
| **8. Dólares y respaldo en Drive** | 4–5 días | Cliente de cotizaciones blue y cripto con caché, campos `usdBlue` y `usdCripto`, pendientes sin conexión, conmutador ARS / USD blue / USD cripto en el Resumen; proyecto en Google Cloud, OAuth, respaldo automático en `appDataFolder` y restauración. **Android:** cargar gastos en modo avión y verificar que se completen los USD al volver la conexión; restaurar el respaldo en un segundo Android o tras borrar los datos de la app |
| **10. Dictado en inglés y gastos en dólares** | 5–7 días | Ajuste "Idioma del dictado" (es-AR / en-US); parser de montos, fechas y descripción en inglés; palabras clave en inglés; set de ~100 frases en inglés con ≥ 85 % de aciertos; detección de dólares en ambos idiomas, conversión a pesos con el blue del día, "Pesos pendiente" sin conexión y selector ARS / USD en la confirmación. **Android:** dictar en inglés con Chrome y con Whisper; dictar "20 dólares" con y sin conexión |
| **9. Pulido y release** | 3 días | Accesibilidad, modo oscuro, traducción completa al inglés y selector de idioma en Ajustes, export/import JSON, E2E con Playwright (incluye emulación de dispositivo Android, ej. Pixel 7), README. **Android:** pasada final con la checklist de la sección 3.1 en ambos equipos de prueba |

**Total estimado:** ~7–8 semanas para una persona a tiempo parcial. La Fase 10 se hace antes de la 9 (pulido y release) porque depende de las cotizaciones de la Fase 8.

**Identidad de git del proyecto:** se configura solo para este repo (sin tocar la configuración global), al crearlo en la Fase 0:

```bash
git config user.name "Gabriel Vargas"
git config user.email "gabilol.soad@gmail.com"
```

**Commits por fase:** a partir de la Fase 1, **cada fase queda en `main` como un único commit**.

- Durante la fase se trabaja en una rama propia (`fase-1-datos`, `fase-2-grafico`, …), con los commits intermedios que hagan falta.
- Al terminar, se abre un PR contra `main`; el CI tiene que pasar; al mergear se publica en GitHub Pages y se revisa en Android.
- El PR se mergea con **squash merge**, que junta todos los commits de la rama en uno solo.
- Mensaje del commit en `main`, con [Conventional Commits](https://www.conventionalcommits.org/): `feat(fase-N): <nombre de la fase>`, seguido de un resumen de lo que incluye. Ej.: `feat(fase-1): datos y carga manual`.
- Autor: la identidad de git del proyecto (Gabriel Vargas <gabilol.soad@gmail.com>).
- Correcciones posteriores a una fase ya mergeada van en commits aparte (`fix: …`), no reescriben el commit de la fase.
- La Fase 0 ya está en `main` con sus propios commits y no se reescribe.

**Comentarios en el código:** no se agregan comentarios con `//` ni con `/** … */` en el código. El código tiene que explicarse solo con nombres claros de funciones, variables y tipos; lo que haga falta documentar va en este plan, en el README o en el mensaje del commit.

Las pruebas en iPhone no forman parte de estas fases; se planificarán como una fase aparte cuando se incorpore iOS (ver sección 3.1).

Las fases 1–5 constituyen un MVP usable (~3 semanas); 6 y 7 mejoran precisión y soporte offline.

---

## 11. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Web Speech API no disponible en Firefox / limitada en iOS | Sin voz en esos navegadores | Respaldo Whisper local; alta manual siempre disponible |
| Errores de transcripción en montos ("mil quinientos" vs "1500") | Monto incorrecto | Parser robusto + pantalla de confirmación obligatoria |
| Categorización errónea | Gráfico poco confiable | Cascada de métodos + aprendizaje por corrección + indicador de confianza |
| Peso de los modelos (Whisper/embeddings) | Primera carga lenta, consumo de datos | Descarga automática en segundo plano (Web Worker) sin bloquear la UI, modelos cuantizados, caché permanente para descargarlos una sola vez |
| Pérdida de datos (todo local) | Usuario pierde historial | Respaldo automático en Google Drive + export/import JSON manual |
| API de cotizaciones caída, sin histórico o que cambie | Gastos sin valor en USD | Caché local, gastos quedan "USD pendiente" y se reintentan; DolarAPI cubre el día en curso; nunca bloquea el registro. Si ArgentinaDatos desaparece, Bluelytics puede reemplazarla solo para el blue |
| Sesión de Google vencida o permisos revocados | El respaldo deja de ejecutarse | Estado visible en Ajustes y aviso en Inicio si el último respaldo tiene más de 3 días |
| Micrófono requiere HTTPS | No funciona en hosting sin TLS | GitHub Pages provee HTTPS gratis |
| Cambios en planes gratuitos de terceros | Costos inesperados o funciones que dejan de andar | Solo se depende de servicios gratuitos sin tarjeta (Drive del usuario, APIs públicas de cotizaciones); voz y categorización no dependen de ellos y el registro de gastos funciona siempre |

---

## 12. Criterios de aceptación del MVP

- [ ] Dictar *"gasté 1500 en el colectivo"* crea un gasto de $1500 en **Transporte** con fecha de hoy.
- [ ] Dictar *"ayer pagué dos mil trescientos en la farmacia"* crea $2300 en **Salud** con fecha de ayer.
- [ ] Si corrijo una categoría, el mismo comercio/término se categoriza bien la próxima vez.
- [ ] El gráfico circular muestra el total por categoría del mes seleccionado y los porcentajes suman 100 %, en ARS, USD blue y USD cripto.
- [ ] Cada gasto guarda su valor en dólar blue y en dólar cripto con las cotizaciones de **su fecha**.
- [ ] Cada gasto guarda a cuántos pesos equivalía 1 USD blue y 1 USDT; para gastos de hoy, la cotización del momento del registro.
- [ ] Un gasto cargado sin conexión obtiene su valor en USD automáticamente al volver internet.
- [ ] Tras borrar los datos de la app y conectar Google Drive, se restauran todos los gastos.
- [ ] Con el idioma del dictado en English, *"I spent 1500 on the bus yesterday"* crea $1500 en **Transporte** con fecha de ayer, aunque la app esté en español.
- [ ] Dictar *"gasté 20 dólares en Spotify"* registra US$ 20 y lo convierte a pesos con la cotización blue del día.
- [ ] La app se instala como PWA desde Chrome en Android y permite ver y cargar gastos sin conexión.
- [ ] El flujo por voz funciona en un Android de gama media y uno de gama baja.
- [ ] Costo mensual de operación: **$0**.

---

## 13. Próximos pasos

1. Crear el repositorio e inicializar el proyecto (Fase 0).
2. Armar el set de frases de prueba etiquetadas (sirve para el parser y el categorizador).
3. Definir el diccionario de palabras clave por categoría adaptado a Argentina (comercios locales, modismos).
4. Crear el proyecto gratuito en Google Cloud Console y el OAuth Client ID para Drive.
