# Arquitectura Backend API

## Estructura del Proyecto

```
liturgy-songs-manager-05/
├── api/                          # Backend Express API
│   ├── src/
│   │   └── index.ts             # Servidor principal con todos los endpoints
│   ├── dist/                    # Build compilado
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example             # Plantilla de variables de entorno
│   └── README.md
│
├── src/                         # Frontend React
│   ├── integrations/
│   │   ├── supabase/            # Cliente Supabase (ya no se usa directamente)
│   │   └── api/                 # Nuevo: Cliente API REST
│   └── ...
│
├── supabase/                    # Configuración de Supabase
│   └── migrations/              # Migraciones SQL
│
├── .env                         # Variables del frontend
└── vercel.json                  # Configuración de Vercel
```

## Flujo de Datos

### Web
```
React App (localhost:5173)
    ↓
Express API (localhost:3000)
    ↓
Supabase PostgreSQL
```

### Mobile (Capacitor Android)
```
React App (Capacitor WebView)
    ↓
Express API (https://your-api.vercel.app)
    ↓
Supabase PostgreSQL
```

## Variables de Entorno

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000              # Local
VITE_API_URL=https://your-api.vercel.app        # Producción
```

### Backend (api/.env)
```
VITE_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJh... (SECRETO)
JWT_SECRET=your-secret-key       (SECRETO)
NODE_ENV=development
API_PORT=3000
```

## Seguridad

✅ **Credenciales de Supabase protegidas en servidor**
✅ **Validación de pertenencia en cada operación**
✅ **JWT para sesiones seguras**
✅ **CORS configurado solo para dominios autorizados**
✅ **No commitear .env con secretos**

## Pasos Siguientes

1. **Crear cliente API para el frontend** → `src/integrations/api/client.ts`
2. **Actualizar todos los endpoints** para usar el API en lugar de Supabase directo
3. **Instalar env en Vercel** y obtener URL del API
4. **Actualizar VITE_API_URL** en el frontend

¿Empiezo con el cliente API para el frontend?
