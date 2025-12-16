import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ApiClient } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Misa } from '@/types/database';
import { Plus, Calendar, Search, ChevronRight, Music, Trash2, Edit } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import MisaFormDialog from '@/components/misas/MisaFormDialog';
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

export default function Index() {
  const [misas, setMisas] = useState<Misa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingMisa, setEditingMisa] = useState<Misa | null>(null);
  const [deletingMisa, setDeletingMisa] = useState<Misa | null>(null);
  const { user, token } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMisas();
  }, []);

  const fetchMisas = async () => {
    try {
      if (!token) {
        toast({
          title: 'Error',
          description: 'No hay sesión activa',
          variant: 'destructive',
        });
        return;
      }

      const data = await ApiClient.getMisas(token);
      setMisas(data || []);
    } catch (error) {
      console.error('Error fetching misas:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las misas',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMisa || !token) return;

    try {
      await ApiClient.deleteMisa(deletingMisa.id, token);

      toast({
        title: 'Misa eliminada',
        description: 'La misa ha sido eliminada correctamente',
      });
      fetchMisas();
    } catch (error) {
      console.error('Error deleting misa:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la misa',
        variant: 'destructive',
      });
    } finally {
      setDeletingMisa(null);
    }
  };

  const filteredMisas = misas.filter((misa) => {
    const searchLower = searchTerm.toLowerCase();
    const fechaFormatted = format(parseISO(misa.fecha), "d 'de' MMMM, yyyy", { locale: es });
    return (
      fechaFormatted.toLowerCase().includes(searchLower) ||
      (misa.descripcion?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-1">
                Misas
              </h1>
              <p className="text-muted-foreground">
                Administra los cantos de cada celebración
              </p>
            </div>
            <Button
              variant="sacred"
              size="lg"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-5 h-5" />
              Nueva Misa
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por fecha o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Misas List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Cargando misas...</p>
            </div>
          </div>
        ) : filteredMisas.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-serif font-semibold mb-2">
              {searchTerm ? 'Sin resultados' : 'No hay misas programadas'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm
                ? 'Intenta con otro término de búsqueda'
                : 'Crea tu primera misa para comenzar a organizar los cantos'}
            </p>
            {!searchTerm && (
              <Button variant="sacred" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4" />
                Crear Primera Misa
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMisas.map((misa, index) => (
              <div
                key={misa.id}
                className="liturgical-card p-5 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif font-semibold text-lg truncate">
                        {format(parseISO(misa.fecha), "EEEE d 'de' MMMM", { locale: es })}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {misa.descripcion || 'Sin descripción'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto flex-wrap md:flex-nowrap justify-end">
                    <Link to={`/misa/${misa.id}`} className="flex-1 md:flex-none">
                      <Button variant="outline" size="sm" className="w-full md:w-auto">
                        <Music className="w-4 h-4 mr-2" />
                        Cantos
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingMisa(misa)}
                      className="flex-shrink-0"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingMisa(misa)}
                      className="flex-shrink-0"
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
      <MisaFormDialog
        open={showForm || !!editingMisa}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingMisa(null);
        }}
        misa={editingMisa}
        onSuccess={() => {
          setShowForm(false);
          setEditingMisa(null);
          fetchMisas();
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingMisa} onOpenChange={() => setDeletingMisa(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">¿Eliminar esta misa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán también todos los cantos asignados a esta misa.
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
