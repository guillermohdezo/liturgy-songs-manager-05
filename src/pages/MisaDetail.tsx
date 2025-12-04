import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Misa, MisaCanto, Canto, SongType, LecturasResponse } from '@/types/database';
import { SONG_TYPE_LABELS, SONG_TYPES_ORDER } from '@/types/database';
import { ArrowLeft, Plus, Music, Play, Book, Loader2, GripVertical, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import CantoSelectorDialog from '@/components/misas/CantoSelectorDialog';
import LecturasSection from '@/components/misas/LecturasSection';

export default function MisaDetail() {
  const { id } = useParams<{ id: string }>();
  const [misa, setMisa] = useState<Misa | null>(null);
  const [misaCantos, setMisaCantos] = useState<MisaCanto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedTipo, setSelectedTipo] = useState<SongType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchMisaData();
    }
  }, [id]);

  const fetchMisaData = async () => {
    if (!id) return;

    try {
      // Fetch misa
      const { data: misaData, error: misaError } = await supabase
        .from('misas')
        .select('*')
        .eq('id', id)
        .single();

      if (misaError) throw misaError;
      setMisa(misaData);

      // Fetch misa cantos with canto details
      const { data: cantosData, error: cantosError } = await supabase
        .from('misa_cantos')
        .select(`
          *,
          canto:cantos(*)
        `)
        .eq('misa_id', id)
        .order('orden');

      if (cantosError) throw cantosError;
      setMisaCantos(cantosData || []);
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

  const handleAddCanto = (tipo: SongType) => {
    setSelectedTipo(tipo);
    setSelectorOpen(true);
  };

  const handleCantoSelected = async (canto: Canto) => {
    if (!id || !selectedTipo) return;

    try {
      const orden = misaCantos.filter(mc => mc.tipo === selectedTipo).length;

      const { error } = await supabase
        .from('misa_cantos')
        .insert({
          misa_id: id,
          canto_id: canto.id,
          tipo: selectedTipo,
          orden,
        });

      if (error) throw error;

      toast({
        title: 'Canto agregado',
        description: `${canto.nombre} agregado como ${SONG_TYPE_LABELS[selectedTipo]}`,
      });

      fetchMisaData();
    } catch (error) {
      console.error('Error adding canto:', error);
      toast({
        title: 'Error',
        description: 'No se pudo agregar el canto',
        variant: 'destructive',
      });
    } finally {
      setSelectorOpen(false);
      setSelectedTipo(null);
    }
  };

  const handleRemoveCanto = async (misaCantoId: string) => {
    try {
      const { error } = await supabase
        .from('misa_cantos')
        .delete()
        .eq('id', misaCantoId);

      if (error) throw error;

      toast({
        title: 'Canto eliminado',
        description: 'El canto ha sido removido de la misa',
      });

      fetchMisaData();
    } catch (error) {
      console.error('Error removing canto:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el canto',
        variant: 'destructive',
      });
    }
  };

  const getCantosByTipo = (tipo: SongType) => {
    return misaCantos.filter(mc => mc.tipo === tipo);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando misa...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!misa) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-serif font-semibold mb-4">Misa no encontrada</h2>
          <Link to="/">
            <Button variant="outline">Volver a Misas</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Misas
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-1">
                {format(parseISO(misa.fecha), "EEEE d 'de' MMMM, yyyy", { locale: es })}
              </h1>
              <p className="text-muted-foreground">
                {misa.descripcion || 'Misa sin descripción'}
              </p>
            </div>

            <Link to={`/misa/${misa.id}/visualizar`}>
              <Button variant="sacred" size="lg">
                <Play className="w-5 h-5" />
                Ver Cantos
              </Button>
            </Link>
          </div>
        </div>

        {/* Lecturas */}
        <LecturasSection fecha={misa.fecha} />

        {/* Cantos por momento */}
        <div className="space-y-6 mt-8">
          <h2 className="text-xl font-serif font-semibold flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Cantos de la Misa
          </h2>

          {[...SONG_TYPES_ORDER, 'extra' as SongType].map((tipo) => {
            const cantos = getCantosByTipo(tipo);
            
            return (
              <div
                key={tipo}
                className="liturgical-card p-5 animate-slide-up"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-serif font-semibold text-lg">
                    {SONG_TYPE_LABELS[tipo]}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCanto(tipo)}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </div>

                {cantos.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">
                    No hay cantos asignados
                  </p>
                ) : (
                  <div className="space-y-2">
                    {cantos.map((mc) => (
                      <div
                        key={mc.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 group"
                      >
                        <GripVertical className="w-4 h-4 text-muted-foreground/50" />
                        
                        {mc.canto?.foto_url ? (
                          <img
                            src={mc.canto.foto_url}
                            alt={mc.canto.nombre}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <Music className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{mc.canto?.nombre}</p>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveCanto(mc.id)}
                        >
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Canto Selector Dialog */}
      <CantoSelectorDialog
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        onSelect={handleCantoSelected}
        tipoSugerido={selectedTipo}
      />
    </Layout>
  );
}
