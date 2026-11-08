# Tally

App para registrar gastos hablando. Detecta la categoría automáticamente y muestra los gastos del mes en un gráfico circular. El plan completo está en [PLANIFICACION.md](PLANIFICACION.md).

## Requisitos

- Node.js 24 (ver `.nvmrc`). Con nvm-windows: `nvm use 24.0.1`.

## Comandos

| Comando              | Qué hace                                                 |
| -------------------- | -------------------------------------------------------- |
| `npm install`        | Instala las dependencias                                 |
| `npm run dev`        | Servidor de desarrollo en http://localhost:5173          |
| `npm run dev:host`   | Igual, pero accesible desde otros dispositivos de la red |
| `npm test`           | Corre los tests (Vitest)                                 |
| `npm run test:watch` | Tests en modo observación                                |
| `npm run lint`       | Linter (oxlint)                                          |
| `npm run typecheck`  | Chequeo de tipos de TypeScript                           |
| `npm run format`     | Formatea el código con Prettier                          |
| `npm run build`      | Build de producción en `dist/`                           |
| `npm run preview`    | Sirve el build de producción localmente                  |

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

### Preview de Cloudflare Pages

Cada PR publica un preview con HTTPS (ver abajo). Se abre la URL del preview en Chrome del celular.

## Deploy en Cloudflare Pages

El workflow [`.github/workflows/ci.yml`](.github/workflows/ci.yml) corre formato, lint, tipos, tests y build en cada push y PR. Si están configurados los secrets de Cloudflare, además publica:

- en `main`: producción (`https://tally.pages.dev` o el nombre que asigne Cloudflare),
- en cada PR: un preview con su propia URL.

Configuración (una sola vez, gratis):

1. Crear una cuenta en [Cloudflare](https://dash.cloudflare.com/sign-up).
2. **Workers & Pages → Create → Pages → Direct Upload**, con el nombre de proyecto `tally`.
3. Crear un API token en **My Profile → API Tokens → Create Token**, con el permiso **Account → Cloudflare Pages → Edit**.
4. En el repo de GitHub, **Settings → Secrets and variables → Actions**, crear:
   - `CLOUDFLARE_API_TOKEN`: el token del paso 3.
   - `CLOUDFLARE_ACCOUNT_ID`: el Account ID (se ve en el panel de Cloudflare, en Workers & Pages).

Sin estos secrets, el CI igual corre y el deploy se omite con un aviso.
