# San Andrés Vibes · Encuestas de satisfacción (PWA)

App web instalable (PWA) en React + Vite + Supabase para medir la satisfacción de los clientes de
**San Andrés Vibes Experiences**, el servicio de alquiler de buggies, mulas y botes pontón en San Andrés Islas.

- **App pública:** https://cashlessmot2026.github.io/vibes/
- **Panel admin:** link oculto definido por la variable `ADMIN_PATH` del repositorio (no se publica aquí)

## Funciones

**Cliente**
- Escanea el QR del trabajador (con la cámara del teléfono o con el botón *Escanear QR*, que usa la cámara trasera).
- Encuesta paso a paso con barra de progreso, estrellas, opción única o múltiple, Sí/No y texto.
- Banner automático con fotos de los vehículos en todas las preguntas.
- Al terminar ve los botones para dejar reseña en **Google** (Place ID `ChIJSTFP4YUpRAkRQNgr1cRHY7Y`) y en **Tripadvisor**.
- Se puede instalar en iOS y Android. Funciona sin internet: las encuestas quedan en cola y se envían al volver la conexión.

**Admin** (usuario y contraseña propios, guardados cifrados con bcrypt)
- Resumen: total de encuestas, calificación promedio, % de satisfacción, % de recomendación, evolución en el tiempo,
  niveles de satisfacción, calificación por aspecto y resultados de las preguntas de opción.
- **Ranking de QR**: los trabajadores ordenados por calificación.
- Comentarios con filtros y exportación a CSV (Excel).
- Editor de preguntas: crear, editar, ordenar, ocultar y eliminar.
- Equipo y QR: alta de trabajadores con un **TAG único**, más el **QR genérico**. Descarga de cada QR como tarjeta PNG con el logo.
- Se actualiza solo cada minuto.

## Configurar Supabase (una sola vez)

1. Supabase → **SQL Editor** → pega todo [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   El script crea las tablas, la seguridad (RLS), las funciones y 7 preguntas iniciales.
2. Ejecuta también el archivo local `supabase/admin-user.sql`, que crea el usuario del panel.
   Ese archivo no se sube a GitHub para no publicar la contraseña.
   Después de 5 intentos fallidos el acceso se bloquea 15 minutos.
3. Para cambiar la contraseña, ejecuta en el SQL Editor:
   ```sql
   update public.admin_users
   set password_hash = extensions.crypt('NUEVA-CLAVE', extensions.gen_salt('bf'))
   where username = 'admin';
   ```

## Cómo funcionan los QR

| QR | URL | A quién se asignan las respuestas |
|---|---|---|
| Genérico | `https://cashlessmot2026.github.io/vibes/#/` | A nadie (aparece como "QR general") |
| Trabajador | `https://cashlessmot2026.github.io/vibes/#/t/CARLOS-7K2` | Al trabajador con ese TAG |

Los TAG se crean en el panel → **Equipo y QR**. Si desactivas a un trabajador, sus QR siguen funcionando
pero las encuestas nuevas ya no se le asignan.

## Desarrollo local

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Despliegue

Cada `push` a `main` publica la app en GitHub Pages (`.github/workflows/deploy.yml`).
Para cambiar la ruta secreta del panel, crea en GitHub la variable `ADMIN_PATH`
(*Settings → Secrets and variables → Actions → Variables*) y vuelve a ejecutar el workflow.

> La llave `sb_publishable_…` es pública por diseño. La seguridad de los datos la dan las políticas RLS del esquema:
> los clientes solo pueden **enviar** encuestas, y solo los administradores pueden leerlas.

## Estructura

```
src/
  pages/        Welcome (portada), Survey (preguntas), Thanks (reseñas)
  components/   VehicleSlider, Stars, Scanner (QR con cámara), InstallButton
  admin/        AdminApp (login + menú), Dashboard, Questions, Workers, useData
  lib/          supabase.js, survey.js (caché offline y cola de envíos)
public/
  vehicles/     fotos de los vehículos (WebP)
  icons/        íconos de la PWA
supabase/schema.sql
```
