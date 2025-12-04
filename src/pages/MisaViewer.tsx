import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Misa, MisaCanto } from '@/types/database';
import { SONG_TYPE_LABELS } from '@/types/database';
import { ArrowLeft, ChevronLeft, ChevronRight, Music, Image, X, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function MisaViewer() {
  const { id } = useParams<{ id: string }>();
  const [misa, setMisa] = useState<Misa | null>(null);
  const [misaCantos, setMisaCantos] = useState<MisaCanto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchMisaData();
    }
  }, [id]);

  const fetchMisaData = async () => {
    if (!id) return;

    try {
      const { data: misaData, error: misaError } = await supabase
        .from('misas')
        .select('*')
        .eq('id', id)
        .single();

      if (misaError) throw misaError;
      setMisa(misaData);

      const { data: cantosData, error: cantosError } = await supabase
        .from('misa_cantos')
        .select(`
          *,
          canto:cantos(*)
        `)
        .eq('misa_id', id)
        .order('orden');

      if (cantosError) throw cantosError;
      
      // Sort by tipo order
      const tipoOrder = ['entrada', 'senor_ten_piedad', 'gloria', 'aleluya', 'padre_nuestro', 'ofertorio', 'santo', 'cordero', 'salida', 'extra'];
      const sorted = (cantosData || []).sort((a, b) => {
        const aIndex = tipoOrder.indexOf(a.tipo);
        const bIndex = tipoOrder.indexOf(b.tipo);
        if (aIndex !== bIndex) return aIndex - bIndex;
        return a.orden - b.orden;
      });
      
      setMisaCantos(sorted);
    } catch (error) {
      console.error('Error fetching misa:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la misa',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0 && !transitioning) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setTransitioning(false);
      }, 150);
    }
  };

  const handleNext = () => {
    if (currentIndex < misaCantos.length - 1 && !transitioning) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setTransitioning(false);
      }, 150);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') window.history.back();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, transitioning]);

  if (loading) {
    return (
      <div className="min-h-screen bg-foreground flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-foreground mx-auto mb-4" />
          <p className="text-primary-foreground/60">Cargando cantos...</p>
        </div>
      </div>
    );
  }

  if (!misa || misaCantos.length === 0) {
    return (
      <div className="min-h-screen bg-foreground flex items-center justify-center p-4">
        <div className="text-center">
          <Music className="w-16 h-16 text-primary-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-serif text-primary-foreground mb-4">
            {!misa ? 'Misa no encontrada' : 'No hay cantos asignados'}
          </h2>
          <Link to={misa ? `/misa/${misa.id}` : '/'}>
            <Button variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentCanto = misaCantos[currentIndex];

  return (
    <div className="min-h-screen bg-foreground flex flex-col">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between">
          <Link to={`/misa/${misa.id}`}>
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            >
              <X className="w-6 h-6" />
            </Button>
          </Link>

          <div className="text-center">
            <p className="text-primary-foreground/60 text-sm">
              {format(parseISO(misa.fecha), "d 'de' MMMM", { locale: es })}
            </p>
            <p className="text-primary-foreground font-serif font-medium">
              {SONG_TYPE_LABELS[currentCanto.tipo]}
            </p>
          </div>

          <div className="w-10" /> {/* Spacer for alignment */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 pt-20 pb-24">
        <div
          className={cn(
            'w-full max-w-3xl aspect-[4/3] relative rounded-2xl overflow-hidden shadow-2xl transition-all duration-300',
            transitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
          )}
        >
          {currentCanto.canto?.foto_url ? (
            <img
              src={currentCanto.canto.foto_url}
              alt={currentCanto.canto.nombre}
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            <div className="w-full h-full bg-muted/20 flex flex-col items-center justify-center">
              <Image className="w-20 h-20 text-primary-foreground/20 mb-4" />
              <p className="text-primary-foreground/40 font-serif text-xl">
                {currentCanto.canto?.nombre}
              </p>
            </div>
          )}

          {/* Song name overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <p className="text-primary-foreground font-serif text-xl font-semibold text-center">
              {currentCanto.canto?.nombre}
            </p>
          </div>
        </div>
      </main>

      {/* Navigation Footer */}
      <footer className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <Button
            variant="ghost"
            size="lg"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 disabled:opacity-30"
          >
            <ChevronLeft className="w-6 h-6 mr-1" />
            Anterior
          </Button>

          {/* Progress Indicator */}
          <div className="flex items-center gap-1.5">
            {misaCantos.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!transitioning) {
                    setTransitioning(true);
                    setTimeout(() => {
                      setCurrentIndex(index);
                      setTransitioning(false);
                    }, 150);
                  }
                }}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-200',
                  index === currentIndex
                    ? 'bg-primary-foreground w-4'
                    : 'bg-primary-foreground/30 hover:bg-primary-foreground/50'
                )}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="lg"
            onClick={handleNext}
            disabled={currentIndex === misaCantos.length - 1}
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 disabled:opacity-30"
          >
            Siguiente
            <ChevronRight className="w-6 h-6 ml-1" />
          </Button>
        </div>

        {/* Counter */}
        <p className="text-center text-primary-foreground/40 text-sm mt-2">
          {currentIndex + 1} de {misaCantos.length}
        </p>
      </footer>
    </div>
  );
}
