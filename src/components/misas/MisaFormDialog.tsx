import { useState, useEffect } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Misa } from '@/types/database';

const misaSchema = z.object({
  fecha: z.date({ required_error: 'La fecha es requerida' }),
  descripcion: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
});

interface MisaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  misa?: Misa | null;
  onSuccess: () => void;
}

export default function MisaFormDialog({ open, onOpenChange, misa, onSuccess }: MisaFormDialogProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [descripcion, setDescripcion] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ fecha?: string; descripcion?: string }>({});
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (misa) {
      setDate(new Date(misa.fecha));
      setDescripcion(misa.descripcion || '');
    } else {
      setDate(undefined);
      setDescripcion('');
    }
    setErrors({});
  }, [misa, open]);

  const validateForm = () => {
    try {
      misaSchema.parse({ fecha: date, descripcion: descripcion || undefined });
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: { fecha?: string; descripcion?: string } = {};
        err.errors.forEach((error) => {
          if (error.path[0] === 'fecha') fieldErrors.fecha = error.message;
          if (error.path[0] === 'descripcion') fieldErrors.descripcion = error.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user || !date) return;
    
    setLoading(true);

    try {
      const misaData = {
        fecha: format(date, 'yyyy-MM-dd'),
        descripcion: descripcion || null,
        usuario_id: user.id,
      };

      if (misa) {
        const { error } = await supabase
          .from('misas')
          .update(misaData)
          .eq('id', misa.id);

        if (error) throw error;
        toast({
          title: 'Misa actualizada',
          description: 'La misa ha sido actualizada correctamente',
        });
      } else {
        const { error } = await supabase.from('misas').insert(misaData);

        if (error) throw error;
        toast({
          title: 'Misa creada',
          description: 'La misa ha sido creada correctamente',
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving misa:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la misa',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {misa ? 'Editar Misa' : 'Nueva Misa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label>Fecha de la Misa</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : 'Seleccionar fecha'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  locale={es}
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {errors.fecha && (
              <p className="text-sm text-destructive">{errors.fecha}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              placeholder="Ej: Misa dominical, Primera Comunión, etc."
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className={errors.descripcion ? 'border-destructive' : ''}
              rows={3}
            />
            {errors.descripcion && (
              <p className="text-sm text-destructive">{errors.descripcion}</p>
            )}
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
              {loading ? 'Guardando...' : misa ? 'Actualizar' : 'Crear Misa'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
