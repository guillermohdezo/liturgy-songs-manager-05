import { useState, useEffect } from 'react';
import { Book, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Lectura {
  cita: string;
  lectura: string;
}

interface LecturasData {
  indicacionLiturgica: string;
  primeraLectura: Lectura;
  evangelio: Lectura;
}

interface LecturasSectionProps {
  fecha: string;
}

export default function LecturasSection({ fecha }: LecturasSectionProps) {
  const [lecturas, setLecturas] = useState<LecturasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchLecturas();
  }, [fecha]);

  const fetchLecturas = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api-evangelio.onrender.com/api/lecturas?fecha=${fecha}`
      );

      if (!response.ok) {
        throw new Error('No se pudieron obtener las lecturas');
      }

      const data = await response.json();
      setLecturas(data);
    } catch (err) {
      console.error('Error fetching lecturas:', err);
      setError('No se pudieron cargar las lecturas del día');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="liturgical-card p-5 animate-fade-in">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-muted-foreground">Cargando lecturas del día...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="liturgical-card p-5 animate-fade-in">
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!lecturas) return null;

  return (
    <div className="liturgical-card overflow-hidden animate-fade-in">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Book className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-serif font-semibold">Lecturas del Día</h3>
            <p className="text-sm text-muted-foreground">{lecturas.indicacionLiturgica}</p>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          expanded ? 'max-h-[2000px]' : 'max-h-0'
        )}
      >
        <div className="px-5 pb-5 space-y-6">
          {/* Primera Lectura */}
          <div className="space-y-2">
            <h4 className="font-serif font-semibold text-primary">Primera Lectura</h4>
            <p className="text-sm font-medium text-muted-foreground">
              {lecturas.primeraLectura.cita}
            </p>
            <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed">
              {lecturas.primeraLectura.lectura.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-2">{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Evangelio */}
          <div className="space-y-2 pt-4 border-t border-border">
            <h4 className="font-serif font-semibold text-primary">Evangelio</h4>
            <p className="text-sm font-medium text-muted-foreground">
              {lecturas.evangelio.cita}
            </p>
            <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed">
              {lecturas.evangelio.lectura.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-2">{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
