import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { getReadingsFromVatican } from './lecturas';
import { upload } from './multer';

// Load environment variables from .env.local first, then fall back to .env
const envPath = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), '.env')
  : path.join(process.cwd(), '.env.local');

dotenv.config({ path: envPath });

// Debug: Log env vars (remove in production)
if (process.env.NODE_ENV !== 'production') {
  console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Missing');
}

const app = express();
const PORT = process.env.API_PORT || 3000;

// Supabase client (server-side with service role key for full access)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGINS?.split(',') || ['https://your-frontend-domain.vercel.app']
    : process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://localhost:8080', 'http://localhost:8100', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// JWT Types
interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

interface AuthRequest extends Request {
  user?: JWTPayload;
}

// Middleware: Verify JWT
const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// ==================== AUTH ENDPOINTS ====================

// Signup
app.post('/api/auth/signup', async (req: Request, res: Response) => {
  try {
    const { email, password, nombre } = req.body;

    if (!email || !password || !nombre) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { nombre },
      email_confirm: true, // Auto-confirm for testing
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: data.user.id, email: data.user.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.json({
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
        nombre,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    // Authenticate with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: data.user.id, email: data.user.email },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.json({
      token,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout (client-side, just validate token)
app.post('/api/auth/logout', verifyToken, (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

// ==================== MISAS ENDPOINTS ====================

// Get all misas for user
app.get('/api/misas', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('misas')
      .select('*')
      .eq('usuario_id', req.user!.userId)
      .order('fecha', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch misas' });
  }
});

// Get single misa
app.get('/api/misas/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { data: misa, error } = await supabase
      .from('misas')
      .select('*')
      .eq('id', req.params.id)
      .eq('usuario_id', req.user!.userId)
      .single();

    if (error) throw error;
    if (!misa) return res.status(404).json({ error: 'Misa not found' });

    // Get cantos for this misa
    const { data: cantos, error: cantosError } = await supabase
      .from('misa_cantos')
      .select('*, canto:cantos(*)')
      .eq('misa_id', req.params.id)
      .order('orden');

    if (cantosError) throw cantosError;

    res.json({ ...misa, cantos });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch misa' });
  }
});

// Create misa
app.post('/api/misas', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { fecha, descripcion } = req.body;

    if (!fecha) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('misas')
      .insert({
        fecha,
        descripcion,
        usuario_id: req.user!.userId,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create misa' });
  }
});

// Update misa
app.put('/api/misas/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { fecha, descripcion } = req.body;

    // Verify ownership
    const { data: misa, error: fetchError } = await supabase
      .from('misas')
      .select('usuario_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || misa?.usuario_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('misas')
      .update({ fecha, descripcion })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update misa' });
  }
});

// Delete misa
app.delete('/api/misas/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    // Verify ownership
    const { data: misa, error: fetchError } = await supabase
      .from('misas')
      .select('usuario_id')
      .eq('id', req.params.id)
      .single();

    if (fetchError || misa?.usuario_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { error } = await supabase
      .from('misas')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Misa deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete misa' });
  }
});

// ==================== FILE UPLOAD ENDPOINT ====================

// Upload file (foto or audio)
app.post('/api/upload', verifyToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { folder } = req.body;
    if (!folder || !['fotos', 'audios'].includes(folder)) {
      return res.status(400).json({ error: 'Invalid folder' });
    }

    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('cantos')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('cantos')
      .getPublicUrl(fileName);

    res.json({ url: publicUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// ==================== CANTOS ENDPOINTS ====================

// Get all cantos
app.get('/api/cantos', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('cantos')
      .select('*')
      .order('nombre');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cantos' });
  }
});

// Create canto
app.post('/api/cantos', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, tipo, tiempos_liturgicos, foto_url, audio_url } = req.body;

    if (!nombre || !tipo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('cantos')
      .insert({
        nombre,
        tipo,
        tiempos_liturgicos: tiempos_liturgicos || [],
        foto_url,
        audio_url,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create canto' });
  }
});

// Update canto
app.put('/api/cantos/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, tipo, tiempos_liturgicos, foto_url, audio_url } = req.body;

    const { data, error } = await supabase
      .from('cantos')
      .update({
        nombre,
        tipo,
        tiempos_liturgicos,
        foto_url,
        audio_url,
      })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update canto' });
  }
});

// Delete canto
app.delete('/api/cantos/:id', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { error } = await supabase
      .from('cantos')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Canto deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete canto' });
  }
});

// ==================== MISA_CANTOS ENDPOINTS ====================

// Add canto to misa
app.post('/api/misas/:misaId/cantos', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { cantoId, tipo } = req.body;
    const misaId = req.params.misaId;

    if (!cantoId || !tipo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify misa ownership
    const { data: misa, error: fetchError } = await supabase
      .from('misas')
      .select('usuario_id')
      .eq('id', misaId)
      .single();

    if (fetchError || misa?.usuario_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Get current order
    const { data: existingCantos } = await supabase
      .from('misa_cantos')
      .select('orden')
      .eq('misa_id', misaId)
      .eq('tipo', tipo)
      .order('orden', { ascending: false })
      .limit(1);

    const orden = (existingCantos?.[0]?.orden ?? -1) + 1;

    const { data, error } = await supabase
      .from('misa_cantos')
      .insert({
        misa_id: misaId,
        canto_id: cantoId,
        tipo,
        orden,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add canto to misa' });
  }
});

// Remove canto from misa
app.delete('/api/misas/:misaId/cantos/:misaCantoId', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const { misaId, misaCantoId } = req.params;

    // Verify misa ownership
    const { data: misa, error: fetchError } = await supabase
      .from('misas')
      .select('usuario_id')
      .eq('id', misaId)
      .single();

    if (fetchError || misa?.usuario_id !== req.user!.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { error } = await supabase
      .from('misa_cantos')
      .delete()
      .eq('id', misaCantoId);

    if (error) throw error;
    res.json({ message: 'Canto removed from misa' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove canto' });
  }
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK' });
});

// Get readings from Vatican News for a specific date
app.get('/api/lecturas/:fecha', async (req: Request, res: Response) => {
  try {
    const { fecha } = req.params;
    const result = await getReadingsFromVatican(fecha);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching lecturas:', error);
    res.status(500).json({ error: 'Failed to fetch lecturas' });
  }
});

// Start server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

export default app;
