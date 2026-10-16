<p align="center">
  <img src="public/finpal-cover.svg" alt="FinPal — control claro de préstamos y finanzas personales" width="100%" style="max-width: 1600px; height: auto;">
</p>

<p align="center">
  Todo tu control financiero personal en un solo lugar.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/next"><img src="https://img.shields.io/npm/v/next?label=Next.js&logo=next.js&logoColor=white&color=111827" alt="Versión de Next.js"></a>
  <a href="https://www.npmjs.com/package/react"><img src="https://img.shields.io/npm/v/react?label=React&logo=react&logoColor=white&color=149ECA" alt="Versión de React"></a>
  <a href="https://www.npmjs.com/package/typescript"><img src="https://img.shields.io/npm/v/typescript?label=TypeScript&logo=typescript&logoColor=white&color=3178C6" alt="Versión de TypeScript"></a>
  <a href="https://www.npmjs.com/package/@supabase/supabase-js"><img src="https://img.shields.io/npm/v/%40supabase%2Fsupabase-js?label=Supabase&logo=supabase&logoColor=111827&color=3ECF8E" alt="Versión de Supabase JS"></a>
  <a href="https://www.npmjs.com/package/tailwindcss"><img src="https://img.shields.io/npm/v/tailwindcss?label=Tailwind%20CSS&logo=tailwindcss&logoColor=white&color=06B6D4" alt="Versión de Tailwind CSS"></a>
</p>

FinPal nació de un problema personal: mantener las cuentas y los registros
repartidos entre distintas herramientas para consultar reportes. Es una
aplicación web en español que busca reunir cuentas
de dinero, movimientos, cobros y préstamos en un solo lugar, accesible desde
el celular u otros dispositivos con conexión a internet.

El proyecto todavía está en desarrollo. No pretende resolver las finanzas de
todo el mundo ni reemplazar un sistema contable; es una herramienta personal
que puede resultar útil para quienes tienen una situación parecida.

## Qué permite hacer

- Registrar préstamos con interés mensual, fecha de inicio y día esperado de cobro.
- Registrar cobros completos, atrasados o parciales sin perder el historial.
- Distinguir el período al que corresponde un cobro de la fecha en que se recibió.
- Llevar saldos de efectivo, bancos y billeteras mediante movimientos.
- Registrar gastos, ingresos y ajustes con una justificación.
- Consultar préstamos activos, atrasados, pagados y cancelados desde el dashboard.
- Elegir el color de acento y el modo claro u oscuro de la interfaz.

## Estado

El producto está en desarrollo activo. Ya cuenta con un flujo funcional para
cuentas de dinero, movimientos, préstamos nuevos, cobros parciales,
autenticación y preferencias visuales. Todavía faltan funciones y mejoras que
se irán incorporando conforme avance el proyecto.

## Tecnologías

- Next.js 16 con App Router y Server Actions.
- React 19 y TypeScript.
- Supabase para PostgreSQL, autenticación y Row Level Security.
- Tailwind CSS 4 y Motion para la interfaz.
- Vercel para el despliegue.

## Puesta en marcha local

1. Instala Node.js 20 o una versión posterior compatible con Next.js 16.
2. Instala dependencias:

   ```bash
   npm install
   ```

3. Copia `.env.example` a `.env.local` y añade la URL y la clave pública de
   tu proyecto de Supabase.
4. Para una instalación nueva, ejecuta en el SQL Editor de Supabase los
   scripts de `supabase/setup` en este orden:
   `1-creacion-tablas.sql`, `2-funciones-y-triggers.sql`,
   `3-indices-y-seguridad.sql` y `4-endurecimiento-seguridad.sql`.
5. En Supabase Auth, habilita el proveedor **Email** y configura las URL de
   confirmación local y de producción.
6. Inicia el servidor:

   ```bash
   npm run dev
   ```

   La aplicación estará disponible en `http://localhost:3000`.

Para validar una compilación de producción:

```bash
npm run build
npm start
```

## Configuración de despliegue

En Vercel configura las siguientes variables de entorno:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-clave-publica
NEXT_PUBLIC_SITE_URL=https://tu-proyecto.vercel.app
```

La moneda predeterminada es BOB (Bs) y la zona inicial es `America/La_Paz`;
ambas se guardan por espacio de trabajo.

## Principio de diseño

Los pagos y movimientos son eventos históricos. Los totales, saldos y estados
deben calcularse a partir de esos registros o mantenerse como valores
derivados claramente identificados; no se deben sobrescribir manualmente si
pueden reconstruirse desde el historial.
