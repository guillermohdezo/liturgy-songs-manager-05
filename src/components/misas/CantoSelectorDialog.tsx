import { useState, useEffect } from 'react';
import { ApiClient } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Music, Plus, Image, Filter } from 'lucide-react';
import type { Canto, SongType, LiturgicalSeason } from '@/types/database';
import { SONG_TYPE_LABELS, LITURGICAL_SEASON_LABELS } from '@/types/database';
import CantoFormDialog from '@/components/cantos/CantoFormDialog';

interface CantoSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (canto: Canto) => void;
  tipoSugerido?: SongType | null;
}

export default function CantoSelectorDialog({
  open,
  onOpenChange,
  onSelect,
  tipoSugerido,
}: CantoSelectorDialogProps) {
  const [cantos, setCantos] = useState<Canto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterTiempo, setFilterTiempo] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCantos();
      // Set suggested filter
      if (tipoSugerido && tipoSugerido !== 'extra') {
        setFilterTipo(tipoSugerido);
      } else {
        setFilterTipo('all');
      }
    }
  }, [open, tipoSugerido]);

  const fetchCantos = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const data = await ApiClient.getCantos(token);
      setCantos(data || []);
    } catch (error) {
      console.error('Error fetching cantos:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los cantos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCantos = cantos.filter((canto) => {
    const matchesSearch = canto.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'all' || canto.tipo === filterTipo;
    const matchesTiempo = filterTiempo === 'all' || 
      (canto.tiempos_liturgicos && canto.tiempos_liturgicos.includes(filterTiempo as LiturgicalSeason));
    return matchesSearch && matchesTipo && matchesTiempo;
  });

  return (
    <>
      <Dialog open={open && !showCreateForm} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              Seleccionar Canto
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar canto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(SONG_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterTiempo} onValueChange={setFilterTiempo}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Tiempo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(LITURGICAL_SEASON_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cantos List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Cargando...</p>
                </div>
              ) : filteredCantos.length === 0 ? (
                <div className="text-center py-8">
                  <Music className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No se encontraron cantos</p>
                </div>
              ) : (
                filteredCantos.map((canto) => (
                  <button
                    key={canto.id}
                    onClick={() => onSelect(canto)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left group"
                  >
                    {canto.foto_url ? (
                      <img
                        src={canto.foto_url}
                        alt={canto.nombre}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center">
                        <Image className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate group-hover:text-primary transition-colors">
                        {canto.nombre}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                          {SONG_TYPE_LABELS[canto.tipo]}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Create New Button */}
            <div className="pt-4 border-t border-border">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowCreateForm(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Nuevo Canto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Form */}
      <CantoFormDialog
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        onSuccess={() => {
          setShowCreateForm(false);
          fetchCantos();
        }}
      />
    </>
  );
}
