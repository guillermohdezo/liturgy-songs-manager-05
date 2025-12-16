import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ApiClient } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Misa, MisaCanto } from '@/types/database';
import { SONG_TYPE_LABELS } from '@/types/database';
import { ArrowLeft, ChevronLeft, ChevronRight, Music, Image, X, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import AudioPlayer from '@/components/AudioPlayer';

export default function MisaViewer() {
  const { id } = useParams<{ id: string }>();
  const [misa, setMisa] = useState<Misa | null>(null);
  const [misaCantos, setMisaCantos] = useState<MisaCanto[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [playerExpanded, setPlayerExpanded] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const footerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchMisaData();
    }
  }, [id]);

  const fetchMisaData = async () => {
    if (!id || !token) return;

    try {
      const misaData = await ApiClient.getMisa(id, token);
      
      setMisa(misaData);

      // Sort cantos by tipo order
      const tipoOrder = ['entrada', 'senor_ten_piedad', 'gloria', 'aleluya', 'padre_nuestro', 'ofertorio', 'santo', 'cordero', 'salida', 'extra'];
      const sorted = (misaData.cantos || []).sort((a: any, b: any) => {
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
      if (e.key === 'Escape') {
        if (playerExpanded) {
          setPlayerExpanded(false);
        } else {
          window.history.back();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, transitioning, playerExpanded]);

  // Auto-hide footer when player is expanded
  const handleMouseMove = () => {
    if (playerExpanded) {
      setShowFooter(true);
      
      if (footerTimeoutRef.current) {
        clearTimeout(footerTimeoutRef.current);
      }

      footerTimeoutRef.current = setTimeout(() => {
        setShowFooter(false);
      }, 3000);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (footerTimeoutRef.current) {
        clearTimeout(footerTimeoutRef.current);
      }
    };
  }, []);

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
      <header className="absolute top-0 left-0 right-0 z-20 p-4">
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

      {/* Main Content - Full Screen Image */}
      <main className="flex-1 flex items-center justify-center p-0 relative" onMouseMove={handleMouseMove}>
        <div
          className={cn(
            'w-full h-full relative transition-all duration-300',
            transitioning ? 'opacity-0' : 'opacity-100'
          )}
        >
          {currentCanto.canto?.foto_url ? (
            <img
              src={currentCanto.canto.foto_url}
              alt={currentCanto.canto.nombre}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted/20 flex flex-col items-center justify-center">
              <Image className="w-20 h-20 text-primary-foreground/20 mb-4" />
              <p className="text-primary-foreground/40 font-serif text-xl">
                {currentCanto.canto?.nombre}
              </p>
            </div>
          )}


        </div>
      </main>

      {/* Navigation Footer */}
      <footer className={cn(
        "fixed bottom-0 left-0 right-0 z-20 transition-all duration-300 overflow-hidden",
        "bg-gradient-to-t from-black/90 via-black/60 to-transparent",
        playerExpanded ? "pb-4 pt-4 max-h-96 opacity-100" : "pb-3 pt-2 max-h-20 opacity-100"
      )}>
        {/* Collapsible Audio Player */}
        {currentCanto?.canto?.audio_url && (
          <div className={cn(
            "overflow-hidden transition-all duration-300 flex flex-col items-center justify-center",
            playerExpanded ? "max-h-96 mb-0 px-4" : "max-h-0"
          )}>
            <div className="bg-black/60 backdrop-blur-md rounded-lg p-3 w-full border border-primary-foreground/30">
              <AudioPlayer
                audioUrl={currentCanto.canto.audio_url}
                songName={currentCanto.canto.nombre}
                variant="default"
              />
            </div>
          </div>
        )}

        {/* Expanded Footer Content */}
        {playerExpanded && (
          <>
            {/* Header with Counter and Toggle */}
            <div className="flex items-center justify-between px-4 gap-2 mt-4 mb-3 pt-3 border-t border-primary-foreground/20">
              {/* Counter */}
              <p className="text-primary-foreground/70 text-sm font-medium whitespace-nowrap">
                {currentIndex + 1} / {misaCantos.length}
              </p>

              {/* Progress Indicator */}
              <div className="flex items-center gap-1.5 flex-1 justify-center">
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
                      'w-1.5 h-1.5 rounded-full transition-all duration-200',
                      index === currentIndex
                        ? 'bg-primary-foreground w-3'
                        : 'bg-primary-foreground/30 hover:bg-primary-foreground/50'
                    )}
                  />
                ))}
              </div>

              {/* Player Toggle Button */}
              {currentCanto?.canto?.audio_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPlayerExpanded(false)}
                  className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 flex-shrink-0 h-8 w-8 p-0"
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between px-4 gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 disabled:opacity-30 h-8"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === misaCantos.length - 1}
                className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 disabled:opacity-30 h-8"
              >
                Siguiente
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </>
        )}

        {/* Compact Footer - Only show when NOT expanded */}
        {!playerExpanded && (
          <>
            {/* Header with Toggle Only */}
            <div className="flex items-center justify-center px-4 gap-2">
              {/* Player Toggle Button */}
              {currentCanto?.canto?.audio_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPlayerExpanded(true)}
                  className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 flex-shrink-0 h-8 w-8 p-0"
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </footer>
    </div>
  );
}
