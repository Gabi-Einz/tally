# Tally

App para registrar gastos hablando. Detecta la categoría automáticamente y muestra los gastos del mes en un gráfico circular. El plan completo está en [PLANIFICACION.md](PLANIFICACION.md).

## Qué hace

- **Dictado por voz** con el reconocimiento de Chrome o con Whisper en el celular (sin internet), en español o inglés.
- **Parser** de montos ("dos mil trescientos", "14 lucas", "$2.300"), fechas ("ayer", "el lunes") y descripción.
- **Categorización automática** en el celular: reglas aprendidas de tus correcciones, palabras clave y el modelo e5 por significado.
- **Gráfico circular** mensual por categoría, en pesos, USD blue o USD cripto.
- **Dólar blue y USDT** guardados en cada gasto con la cotización de su fecha; los gastos dictados en dólares se pasan a pesos.
- **Respaldo automático** en Google Drive y exportación/importación en JSON.
- **PWA instalable** que funciona sin conexión, con modo oscuro e interfaz en español o inglés.

## Requisitos

- Node.js 24 (ver `.nvmrc`). Con nvm-windows: `nvm use 24.0.1`.

## Comandos

| Comando                    | Qué hace                                                          |
| -------------------------- | ----------------------------------------------------------------- |
| `npm install`              | Instala las dependencias                                          |
| `npm run dev`              | Servidor de desarrollo en http://localhost:5173                   |
| `npm run dev:host`         | Igual, pero accesible desde otros dispositivos de la red          |
| `npm test`                 | Corre los tests (Vitest)                                          |
| `npm run test:watch`       | Tests en modo observación                                         |
| `npm run test:e2e`         | Pruebas de punta a punta con Playwright (Pixel 7)                 |
| `npm run eval:categorizer` | Evalúa la categorización con el modelo e5 real (descarga ~120 MB) |
| `npm run lint`             | Linter (oxlint)                                                   |
| `npm run typecheck`        | Chequeo de tipos de TypeScript                                    |
| `npm run format`           | Formatea el código con Prettier                                   |
| `npm run build`            | Build de producción en `dist/`                                    |
| `npm run preview`          | Sirve el build de producción localmente                           |

## Probar en un Android

El micrófono solo funciona en `localhost` o con HTTPS, así que para probar en el celular hay dos caminos:

### Depuración remota de Chrome (recomendado durante el desarrollo)

1. En el celular: **Ajustes → Acerca del teléfono** y tocar 7 veces **Número de compilación** para activar las opciones de desarrollador.
2. En **Opciones de desarrollador**, activar **Depuración por USB**.
3. Conectar el celular a la PC por USB y aceptar el aviso de depuración en el celular.
4. Correr `npm run dev` en la PC.
5. En Chrome de la PC, abrir `chrome://inspect/#devices`.
6. Tocar **Port forwarding**, agregar `5173` → `localhost:5173` y activar **Enable port forwarding**.
7. En Chrome del celular, abrir `http://localhost:5173`. Como es `localhost`, el micrófono funciona.
8. Desde `chrome://inspect` en la PC se puede inspeccionar la página del celular (consola, red, elementos).

### App publicada

Abrir https://gabi-einz.github.io/tally/ en Chrome del celular. Ahí se puede instalar con **Instalar app** (o menú de Chrome → **Agregar a la pantalla principal**). La primera vez se descargan los modelos de voz y categorización (~200 MB): conviene estar con Wi‑Fi.

## Deploy en GitHub Pages

El workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) corre formato, lint, tipos, tests, build y pruebas de punta a punta en cada push y PR. En cada push a `main`, si todo pasa, publica la app en https://gabi-einz.github.io/tally/.

El build de producción usa la ruta base `/tally/` (variable `BASE_PATH`). Para probarlo localmente:

```bash
BASE_PATH=/tally/ npm run build && npx vite preview --base /tally/
```

En Git Bash de Windows, anteponer `MSYS_NO_PATHCONV=1` para que no convierta `/tally/` en una ruta de Windows.

## Respaldo en Google Drive

El respaldo usa la carpeta oculta de la app en el Drive del usuario (permiso `drive.appdata`). Para habilitarlo hace falta un OAuth Client ID gratuito:

1. En [Google Cloud Console](https://console.cloud.google.com/) crear un proyecto.
2. **APIs y servicios → Biblioteca**: habilitar **Google Drive API**.
3. **Pantalla de consentimiento de OAuth**: tipo _Externo_, en modo _Prueba_, y agregar tu cuenta como usuario de prueba (hasta 100 usuarios sin verificación).
4. **Credenciales → Crear credenciales → ID de cliente de OAuth**, tipo _Aplicación web_, con estos **orígenes de JavaScript autorizados**:
   - `http://localhost:5173`
   - `https://gabi-einz.github.io` (GitHub Pages)
5. Copiar el Client ID:
   - en local, a un archivo `.env.local` (ver `.env.example`): `VITE_GOOGLE_CLIENT_ID=...`
   - en GitHub, como variable del repo: **Settings → Secrets and variables → Actions → Variables → VITE_GOOGLE_CLIENT_ID**

Sin el Client ID la app funciona igual; Ajustes avisa que el respaldo no está configurado.

## Cotizaciones del dólar

Cada gasto guarda su valor en dólar blue y en dólar cripto (USDT) con la cotización de su fecha:

- gastos de hoy: [DolarAPI](https://dolarapi.com) (cotización del momento),
- gastos de días anteriores: [ArgentinaDatos](https://argentinadatos.com) (histórico diario).

Sin conexión el gasto queda "USD pendiente" y se completa al volver internet o al abrir la app.
