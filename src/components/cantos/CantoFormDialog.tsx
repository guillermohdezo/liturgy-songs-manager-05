import { useState, useEffect } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload, Image, Volume2 } from 'lucide-react';
import type { Canto, SongType, LiturgicalSeason } from '@/types/database';
import { SONG_TYPE_LABELS, LITURGICAL_SEASON_LABELS } from '@/types/database';

const cantoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').max(200),
  tipo: z.string().min(1, 'El tipo es requerido'),
  tiempos_liturgicos: z.array(z.string()).min(1, 'Selecciona al menos un tiempo litúrgico'),
});

interface CantoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canto?: Canto | null;
  onSuccess: () => void;
}

export default function CantoFormDialog({ open, onOpenChange, canto, onSuccess }: CantoFormDialogProps) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<SongType | ''>('');
  const [tiemposLiturgicos, setTiemposLiturgicos] = useState<LiturgicalSeason[]>([]);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ nombre?: string; tipo?: string; tiempos_liturgicos?: string }>({});
  
  const { toast } = useToast();

  useEffect(() => {
    if (canto) {
      setNombre(canto.nombre);
      setTipo(canto.tipo);
      setTiemposLiturgicos(canto.tiempos_liturgicos || []);
      setFotoPreview(canto.foto_url);
    } else {
      setNombre('');
      setTipo('');
      setTiemposLiturgicos([]);
      setFotoPreview(null);
    }
    setFotoFile(null);
    setAudioFile(null);
    setErrors({});
  }, [canto, open]);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const toggleTiempoLiturgico = (tiempo: LiturgicalSeason) => {
    setTiemposLiturgicos(prev =>
      prev.includes(tiempo)
        ? prev.filter(t => t !== tiempo)
        : [...prev, tiempo]
    );
  };

  const validateForm = () => {
    try {
      cantoSchema.parse({ nombre, tipo, tiempos_liturgicos: tiemposLiturgicos });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { nombre?: string; tipo?: string; tiempos_liturgicos?: string } = {};
        err.errors.forEach((error) => {
          if (error.path[0] === 'nombre') fieldErrors.nombre = error.message;
          if (error.path[0] === 'tipo') fieldErrors.tipo = error.message;
          if (error.path[0] === 'tiempos_liturgicos') fieldErrors.tiempos_liturgicos = error.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('cantos')
      .upload(fileName, file);

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('cantos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      let fotoUrl = canto?.foto_url || null;
      let audioUrl = canto?.audio_url || null;

      // Upload new files if selected
      if (fotoFile) {
        fotoUrl = await uploadFile(fotoFile, 'fotos');
      }
      if (audioFile) {
        audioUrl = await uploadFile(audioFile, 'audios');
      }

      const cantoData = {
        nombre,
        tipo: tipo as SongType,
        tiempos_liturgicos: tiemposLiturgicos,
        foto_url: fotoUrl,
        audio_url: audioUrl,
      };

      if (canto) {
        const { error } = await supabase
          .from('cantos')
          .update(cantoData)
          .eq('id', canto.id);

        if (error) throw error;
        toast({
          title: 'Canto actualizado',
          description: 'El canto ha sido actualizado correctamente',
        });
      } else {
        const { error } = await supabase.from('cantos').insert(cantoData);

        if (error) throw error;
        toast({
          title: 'Canto creado',
          description: 'El canto ha sido agregado al catálogo',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving canto:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el canto',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {canto ? 'Editar Canto' : 'Nuevo Canto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Canto</Label>
            <Input
              id="nombre"
              placeholder="Ej: Pescador de Hombres"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={errors.nombre ? 'border-destructive' : ''}
            />
            {errors.nombre && (
              <p className="text-sm text-destructive">{errors.nombre}</p>
            )}
          </div>

          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo de Canto</Label>
            <Select value={tipo} onValueChange={(value) => setTipo(value as SongType)}>
              <SelectTrigger className={errors.tipo ? 'border-destructive' : ''}>
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SONG_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipo && (
              <p className="text-sm text-destructive">{errors.tipo}</p>
            )}
          </div>

          {/* Tiempos Litúrgicos */}
          <div className="space-y-3">
            <Label>Tiempos Litúrgicos</Label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(LITURGICAL_SEASON_LABELS).map(([value, label]) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={value}
                    checked={tiemposLiturgicos.includes(value as LiturgicalSeason)}
                    onCheckedChange={() => toggleTiempoLiturgico(value as LiturgicalSeason)}
                  />
                  <label
                    htmlFor={value}
                    className="text-sm font-medium leading-none cursor-pointer"
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>
            {errors.tiempos_liturgicos && (
              <p className="text-sm text-destructive">{errors.tiempos_liturgicos}</p>
            )}
          </div>

          {/* Foto */}
          <div className="space-y-2">
            <Label>Imagen del Canto</Label>
            <div className="flex gap-4 items-start">
              <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center overflow-hidden border border-border">
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Image className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="hidden"
                  id="foto-upload"
                />
                <label htmlFor="foto-upload">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Imagen
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG o WebP. Máx 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Audio */}
          <div className="space-y-2">
            <Label>Audio del Canto (opcional)</Label>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                <Volume2 className={`w-5 h-5 ${audioFile || canto?.audio_url ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioChange}
                  className="hidden"
                  id="audio-upload"
                />
                <label htmlFor="audio-upload">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {audioFile ? audioFile.name : canto?.audio_url ? 'Cambiar Audio' : 'Subir Audio'}
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="sacred"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Guardando...' : canto ? 'Actualizar' : 'Crear Canto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
