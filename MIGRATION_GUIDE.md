# Migración del Frontend a API REST

## Estado Actual

El frontend ha sido actualizado para usar el API en lugar de conectarse directamente a Supabase.

### ✅ Completado

1. **Cliente API** (`src/integrations/api/client.ts`)
   - ApiClient con todos los endpoints
   - Gestión automática de tokens JWT
   - Manejo de errores

2. **Hook useAuth** (`src/hooks/useAuth.tsx`)
   - Usa ApiClient en lugar de Supabase Auth
   - Persiste token en localStorage
   - Compatible con Capacitor

3. **ProtectedRoute** (`src/components/ProtectedRoute.tsx`)
   - Verifica token en lugar de usuario de Supabase

### ⚠️ Pendiente

Los siguientes archivos aún necesitan ser actualizados para usar el API:

**Páginas:**
- `src/pages/Index.tsx` - CRUD Misas
- `src/pages/Cantos.tsx` - CRUD Cantos
- `src/pages/MisaDetail.tsx` - Agregar/remover cantos
- `src/pages/Auth.tsx` - Ya debería funcionar (solo necesita verificación)

**Componentes:**
- `src/components/misas/MisaFormDialog.tsx`
- `src/components/cantos/CantoFormDialog.tsx`
- `src/components/misas/CantoSelectorDialog.tsx`
- `src/components/misas/LecturasSection.tsx`

## Patrón de Actualización

**Antes (Supabase):**
```tsx
const { data, error } = await supabase
  .from('misas')
  .select('*')
  .order('fecha', { ascending: false });
```

**Después (API):**
```tsx
const { token } = useAuth();
const data = await ApiClient.getMisas(token!);
```

## Paso a Paso

### 1. Importar ApiClient y useAuth
```tsx
import { ApiClient } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
```

### 2. Reemplazar llamadas Supabase

**Reemplazar todas las llamadas a:**
- `supabase.from('misas').select()` → `ApiClient.getMisas(token)`
- `supabase.from('misas').insert()` → `ApiClient.createMisa(fecha, desc, token)`
- `supabase.from('cantos').select()` → `ApiClient.getCantos()`
- etc.

### 3. Manejar tokens
```tsx
const { token } = useAuth();

// Pasar token a cada llamada
await ApiClient.getMisas(token!);
```

### 4. Eliminar importes de Supabase
Remove imports like:
```tsx
import { supabase } from '@/integrations/supabase/client';
```

## Testing Local

1. Asegúrate de que el API está corriendo:
```bash
cd api
npm run dev
```

2. El frontend debe conectarse a `http://localhost:3000`

3. Verifica `.env`:
```
VITE_API_URL=http://localhost:3000
```

## Producción (Vercel)

Una vez deployado el API en Vercel:

1. Actualiza `.env.production`:
```
VITE_API_URL=https://your-api.vercel.app
```

2. Deployment frontend automático detectará la URL

## Checklist Final

- [ ] Index.tsx usa ApiClient
- [ ] Cantos.tsx usa ApiClient
- [ ] MisaDetail.tsx usa ApiClient
- [ ] MisaFormDialog.tsx usa ApiClient
- [ ] CantoFormDialog.tsx usa ApiClient
- [ ] Compilación sin errores
- [ ] Login/Signup funciona
- [ ] CRUD Misas funciona
- [ ] CRUD Cantos funciona
- [ ] Agregar/remover cantos funciona
