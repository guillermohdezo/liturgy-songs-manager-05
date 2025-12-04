export type SongType = 
  | 'entrada' 
  | 'senor_ten_piedad' 
  | 'gloria' 
  | 'aleluya' 
  | 'padre_nuestro' 
  | 'ofertorio' 
  | 'santo' 
  | 'cordero' 
  | 'salida' 
  | 'extra';

export type LiturgicalSeason = 
  | 'adviento' 
  | 'navidad' 
  | 'cuaresma' 
  | 'pascua' 
  | 'tiempo_ordinario';

export type AppRole = 'admin' | 'usuario';

export interface Profile {
  id: string;
  user_id: string;
  nombre: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Canto {
  id: string;
  nombre: string;
  foto_url: string | null;
  audio_url: string | null;
  tipo: SongType;
  tiempos_liturgicos: LiturgicalSeason[];
  created_at: string;
  updated_at: string;
}

export interface Misa {
  id: string;
  fecha: string;
  descripcion: string | null;
  usuario_id: string;
  created_at: string;
  updated_at: string;
}

export interface MisaCanto {
  id: string;
  misa_id: string;
  canto_id: string;
  tipo: SongType;
  orden: number;
  created_at: string;
  canto?: Canto;
}

export const SONG_TYPE_LABELS: Record<SongType, string> = {
  entrada: 'Entrada',
  senor_ten_piedad: 'Señor Ten Piedad',
  gloria: 'Gloria',
  aleluya: 'Aleluya',
  padre_nuestro: 'Padre Nuestro',
  ofertorio: 'Ofertorio',
  santo: 'Santo',
  cordero: 'Cordero',
  salida: 'Salida',
  extra: 'Extra',
};

export const LITURGICAL_SEASON_LABELS: Record<LiturgicalSeason, string> = {
  adviento: 'Adviento',
  navidad: 'Navidad',
  cuaresma: 'Cuaresma',
  pascua: 'Pascua',
  tiempo_ordinario: 'Tiempo Ordinario',
};

export const SONG_TYPES_ORDER: SongType[] = [
  'entrada',
  'senor_ten_piedad',
  'gloria',
  'aleluya',
  'padre_nuestro',
  'ofertorio',
  'santo',
  'cordero',
  'salida',
];

export interface LecturasResponse {
  indicacionLiturgica: string;
  primeraLectura: {
    cita: string;
    lectura: string;
  };
  evangelio: {
    cita: string;
    lectura: string;
  };
}
