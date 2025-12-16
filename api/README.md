# Liturgy Songs Manager - Backend API

Backend API para Liturgy Songs Manager construido con Express.js y Supabase.

## Estructura

```
api/
├── src/
│   └── index.ts          # Aplicación principal
├── package.json
├── tsconfig.json
└── .env.example
```

## Instalación Local

### 1. Variables de entorno

Copia `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

Completa con tus valores:
- `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key de Supabase (mantener secreto)
- `JWT_SECRET`: Clave para firmar JWTs (genera una aleatoria)

### 2. Instalar dependencias

```bash
npm install
```

### 3. Desarrollo local

```bash
npm run dev
```

La API estará en `http://localhost:3000`

### 4. Build para producción

```bash
npm run build
```

## Desplegar en Vercel

### 1. Conecta tu repositorio a Vercel

```bash
npm i -g vercel
vercel
```

### 2. Configura las variables de entorno en Vercel

En el dashboard de Vercel:
- Project Settings → Environment Variables
- Añade:
  - `VITE_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` 
  - `JWT_SECRET`

### 3. Deploy

```bash
vercel --prod
```

## Endpoints

### Autenticación

- `POST /api/auth/signup` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión

### Misas

- `GET /api/misas` - Obtener todas las misas del usuario
- `GET /api/misas/:id` - Obtener una misa con sus cantos
- `POST /api/misas` - Crear una misa
- `PUT /api/misas/:id` - Actualizar una misa
- `DELETE /api/misas/:id` - Eliminar una misa

### Cantos

- `GET /api/cantos` - Obtener todos los cantos
- `POST /api/cantos` - Crear un canto
- `PUT /api/cantos/:id` - Actualizar un canto
- `DELETE /api/cantos/:id` - Eliminar un canto

### Misas-Cantos

- `POST /api/misas/:misaId/cantos` - Agregar canto a una misa
- `DELETE /api/misas/:misaId/cantos/:misaCantoId` - Remover canto de una misa

## Autenticación

Todos los endpoints (excepto `GET /api/cantos` y auth) requieren un token JWT en el header:

```
Authorization: Bearer <TOKEN>
```

El token se obtiene en login o signup y debe incluirse en las siguientes requests.

## Seguridad

- ⚠️ **IMPORTANTE**: No commitear `.env` con secretos
- Las credenciales de Supabase quedan protegidas en el servidor
- JWT expira cada 7 días
- CORS configurado solo para dominios autorizados
- Validación de pertenencia (usuario solo ve sus propios datos)

## Estructura del Proyecto Frontend

El frontend está configurado para usar esta API:

1. Instala el cliente API (`src/integrations/api/client.ts`)
2. Usa `ApiClient.login()`, `ApiClient.getMisas()`, etc.
3. Pasa el token en cada request

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key | `eyJh...` |
| `JWT_SECRET` | Clave para firmar JWTs | `your-secret-key-here` |
| `JWT_EXPIRES_IN` | Expiración de JWT | `7d` |
| `API_PORT` | Puerto local | `3000` |
| `NODE_ENV` | Entorno | `development` / `production` |
