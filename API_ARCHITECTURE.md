# ✅ Arquitectura Completa - Backend API + Frontend

## Estado Final

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                          │
│                   localhost:5173                              │
│  - useAuth Hook (JWT tokens)                                 │
│  - ApiClient (llamadas REST)                                 │
│  - Sin conexión directa a Supabase                          │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP/REST
                  ↓
┌─────────────────────────────────────────────────────────────┐
│                  Express API Backend                         │
│                   localhost:3000                              │
│  - Authentication (JWT)                                     │
│  - CRUD Endpoints (14 total)                               │
│  - Validación de permisos                                   │
│  - Service Role Key (seguro)                               │
└─────────────────┬───────────────────────────────────────────┘
                  │ Service Role Key
                  ↓
┌─────────────────────────────────────────────────────────────┐
│               Supabase PostgreSQL                             │
│          uozvpqnyleksdtcivzuf.supabase.co                     │
│  - Base de datos (misas, cantos, misa_cantos, profiles)     │
│  - Auth (usuarios y sesiones)                               │
│  - Storage (fotos y audios)                                 │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Cómo Empezar

### Terminal 1: Backend API
```bash
cd api
npm run dev
# Escucha en http://localhost:3000
```

### Terminal 2: Frontend
```bash
npm run dev
# Escucha en http://localhost:5173
```

### Acceso
- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/api/health

## 📁 Estructura de Archivos

```
liturgy-songs-manager-05/
├── api/                              # Backend Express
│   ├── src/index.ts                 # Servidor con 14 endpoints
│   ├── .env.local                   # Credenciales (NO COMMITEAR)
│   └── package.json
│
├── src/                             # Frontend React
│   ├── hooks/useAuth.tsx            # JWT + Token storage
│   ├── integrations/
│   │   ├── api/client.ts            # ApiClient REST
│   │   └── supabase/client.ts       # Mock/fallback
│   ├── pages/                       # Páginas (Index, Cantos, etc)
│   └── components/                  # Componentes reutilizables
│
├── supabase/                        # Configuración DB
│   └── migrations/                  # SQL migrations
│
├── .env                             # Frontend env vars
└── vercel.json                      # Config para deployment
```

## 🔐 Seguridad

✅ **Credenciales protegidas:**
- `SUPABASE_SERVICE_ROLE_KEY` solo en backend
- `JWT_SECRET` solo en backend
- Frontend no tiene acceso a Supabase directo

✅ **Validación:**
- JWT en cada request
- Verificación de pertenencia (ownership)
- RLS policies en Supabase como fallback

✅ **Git Security:**
- `.env` en `.gitignore`
- `.env.local` en `.gitignore`
- Repositorio público seguro

## 📋 Endpoints API

### Auth (3)
- `POST /api/auth/signup` - Registrar
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión

### Misas (5)
- `GET /api/misas` - Listar (usuario autenticado)
- `GET /api/misas/:id` - Obtener con cantos
- `POST /api/misas` - Crear
- `PUT /api/misas/:id` - Actualizar
- `DELETE /api/misas/:id` - Eliminar

### Cantos (4)
- `GET /api/cantos` - Listar (público)
- `POST /api/cantos` - Crear
- `PUT /api/cantos/:id` - Actualizar
- `DELETE /api/cantos/:id` - Eliminar

### Misa-Cantos (2)
- `POST /api/misas/:misaId/cantos` - Agregar
- `DELETE /api/misas/:misaId/cantos/:id` - Remover

## 🌐 Deployment (Vercel)

### Backend API
```bash
# Push al repositorio
git push origin main

# Vercel detecta /api/src/index.ts automáticamente
# Deploy en https://your-project.vercel.app/api
```

### Frontend
```bash
# Frontend deployment en Vercel también
# Deploy en https://your-project.vercel.app
```

### Variables de Entorno (Vercel)
**Backend:**
- `VITE_SUPABASE_URL` = Tu URL de Supabase
- `SUPABASE_SERVICE_ROLE_KEY` = Tu service role key
- `JWT_SECRET` = Tu secret JWT

**Frontend:**
- `VITE_API_URL` = https://your-project.vercel.app/api

## ✨ Flujo de Autenticación

### Signup/Login
```
1. Frontend → POST /api/auth/signup
2. Backend: Crea usuario en Supabase Auth
3. Backend: Genera JWT token
4. Backend: Retorna token + user data
5. Frontend: Guarda token en localStorage
6. Frontend: Usa token en Authorization header
```

### Request Autenticado
```
Frontend: GET /api/misas
  Header: Authorization: Bearer <JWT_TOKEN>
  ↓
Backend: Verifica JWT
Backend: Obtiene datos de Supabase
Backend: Retorna datos
```

## 🧪 Testing

### Probar signup
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456","nombre":"Test"}'
```

### Probar endpoint protegido
```bash
curl -X GET http://localhost:3000/api/misas \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

### Probar health check
```bash
curl http://localhost:3000/api/health
```

## ⚙️ Configuración Vercel

### vercel.json
```json
{
  "buildCommand": "npm run build && cd api && npm run build",
  "outputDirectory": "dist",
  "functions": {
    "api/**/*.ts": {
      "memory": 3008,
      "maxDuration": 30
    }
  }
}
```

## 📊 Status

- [x] Backend API creado
- [x] Frontend actualizado para usar API
- [x] Autenticación con JWT
- [x] CRUD endpoints
- [x] Validación de permisos
- [x] `.gitignore` configurado
- [ ] Deploy en Vercel
- [ ] Testing en móvil (Capacitor)
- [ ] Migración de uploads (fotos/audios)

## 🚨 Próximos Pasos

1. **Uploads de archivos**: Actualizar endpoints para manejar multipart/form-data
2. **Testing completo**: Verificar todos los endpoints
3. **Mobile**: Build para Android/iOS con Capacitor
4. **Deployment**: Deploy en Vercel
5. **Monitoreo**: Configurar logs y monitoring
