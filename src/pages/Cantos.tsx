import { useState, useEffect } from 'react';
import { ApiClient } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Canto, SongType, LiturgicalSeason } from '@/types/database';
import { SONG_TYPE_LABELS, LITURGICAL_SEASON_LABELS } from '@/types/database';
import { Plus, Search, Music, Filter, Image, Volume2, Edit, Trash2 } from 'lucide-react';
import CantoFormDialog from '@/components/cantos/CantoFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Cantos() {
  const [cantos, setCantos] = useState<Canto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterTiempo, setFilterTiempo] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingCanto, setEditingCanto] = useState<Canto | null>(null);
  const [deletingCanto, setDeletingCanto] = useState<Canto | null>(null);
  const { token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchCantos();
  }, []);

  const fetchCantos = async () => {
    try {
      if (!token) {
        toast({
          title: 'Error',
          description: 'No hay sesión activa',
          variant: 'destructive',
        });
        return;
      }

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

  const handleDelete = async () => {
    if (!deletingCanto || !token) return;

    try {
      await ApiClient.deleteCanto(deletingCanto.id, token);

      // Update local state immediately
      setCantos(cantos.filter(c => c.id !== deletingCanto.id));

      toast({
        title: 'Canto eliminado',
        description: 'El canto ha sido eliminado correctamente',
      });
      
      setDeletingCanto(null);
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' && error !== null && 'message' in error
        ? (error as any).message
        : 'No se pudo eliminar el canto';
      
      console.error('Error deleting canto:', error);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setDeletingCanto(null);
    }
  };

  const filteredCantos = cantos.filter((canto) => {
    const matchesSearch = canto.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'all' || canto.tipo === filterTipo;
    const matchesTiempo = filterTiempo === 'all' || 
      (canto.tiempos_liturgicos && canto.tiempos_liturgicos.includes(filterTiempo as LiturgicalSeason));
    return matchesSearch && matchesTipo && matchesTiempo;
  });

  console.log(filteredCantos);
  

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-1">
                Cantos
              </h1>
              <p className="text-muted-foreground">
                Catálogo completo de cantos litúrgicos
              </p>
            </div>
            <Button
              variant="sacred"
              size="lg"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-5 h-5" />
              Nuevo Canto
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(SONG_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterTiempo} onValueChange={setFilterTiempo}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Tiempo litúrgico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tiempos</SelectItem>
                {Object.entries(LITURGICAL_SEASON_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cantos Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando cantos...</p>
            </div>
          </div>
        ) : filteredCantos.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Music className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-serif font-semibold mb-2">
              {searchTerm || filterTipo !== 'all' || filterTiempo !== 'all'
                ? 'Sin resultados'
                : 'No hay cantos registrados'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm || filterTipo !== 'all' || filterTiempo !== 'all'
                ? 'Intenta con otros filtros'
                : 'Agrega tu primer canto al catálogo'}
            </p>
            {!searchTerm && filterTipo === 'all' && filterTiempo === 'all' && (
              <Button variant="sacred" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" />
                Agregar Primer Canto
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCantos.map((canto, index) => (
              <div
                key={canto.id}
                className="liturgical-card overflow-hidden animate-slide-up group"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {/* Image */}
                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                  {canto.foto_url ? (
                    <img
                      src={canto.foto_url}
                      alt={canto.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}
                  {/* Audio indicator */}
                  {canto.audio_url && (
                    <div className="absolute top-2 right-2 p-2 rounded-full bg-primary/90 text-primary-foreground">
                      <Volume2 className="w-4 h-4" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-serif font-semibold text-lg mb-2 line-clamp-1">
                    {canto.nombre}
                  </h3>
                  
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                      {SONG_TYPE_LABELS[canto.tipo]}
                    </span>
                    {canto.tiempos_liturgicos?.slice(0, 2).map((tiempo) => (
                      <span
                        key={tiempo}
                        className="px-2 py-0.5 text-xs font-medium rounded-full bg-secondary/20 text-secondary-foreground"
                      >
                        {LITURGICAL_SEASON_LABELS[tiempo]}
                      </span>
                    ))}
                    {(canto.tiempos_liturgicos?.length || 0) > 2 && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                        +{canto.tiempos_liturgicos!.length - 2}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditingCanto(canto)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingCanto(canto)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <CantoFormDialog
        open={showForm || !!editingCanto}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingCanto(null);
        }}
        canto={editingCanto}
        onSuccess={() => {
          setShowForm(false);
          setEditingCanto(null);
          fetchCantos();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCanto} onOpenChange={() => setDeletingCanto(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">¿Eliminar este canto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El canto será eliminado del catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
