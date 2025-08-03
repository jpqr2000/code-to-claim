import { cn } from "@/lib/utils";

interface Mesa {
  id: number;
  numero: number;
  nombre: string;
  capacidad: number;
}

interface Asiento {
  id: number;
  numero: number;
  mesa_id: number;
  posicion: number;
  ocupado: boolean;
}

interface Reserva {
  id: number;
  usuario_id: number;
  mesa_id: number;
  asiento_id: number;
  estado: string;
  usuario: {
    nombres: string;
    apellidos: string;
  };
}

interface SeatMapProps {
  mesas: Mesa[];
  asientos: Asiento[];
  reservas: Reserva[];
  selectedSeat: Asiento | null;
  onSeatSelect: (asiento: Asiento) => void;
}

const SeatMap = ({ mesas, asientos, reservas, selectedSeat, onSeatSelect }: SeatMapProps) => {
  // Crear un mapa de reservas por asiento_id para búsqueda rápida
  const reservasPorAsiento = reservas.reduce((acc, reserva) => {
    if (reserva.asiento_id) {
      acc[reserva.asiento_id] = reserva;
    }
    return acc;
  }, {} as Record<number, Reserva>);

  const getAsientosPorMesa = (mesaId: number) => {
    return asientos.filter(asiento => asiento.mesa_id === mesaId);
  };

  const renderSeat = (asiento: Asiento) => {
    const reserva = reservasPorAsiento[asiento.id];
    const isOccupied = asiento.ocupado || !!reserva;
    const isSelected = selectedSeat?.id === asiento.id;
    
    if (isSelected) {
      return (
        <div
          key={asiento.id}
          className="relative cursor-pointer transition-all duration-300 transform scale-110"
          onClick={() => onSeatSelect(asiento)}
        >
          {/* Selected seat - using brand gradient */}
          <div className="w-16 h-16 bg-gradient-to-br from-event-primary to-event-accent rounded-xl border-2 border-white shadow-2xl flex flex-col items-center justify-center text-white animate-glow-pulse">
            <div className="text-sm font-bold">#{asiento.numero}</div>
            <div className="text-xs opacity-90">Seleccionado</div>
          </div>
        </div>
      );
    } else if (isOccupied && reserva) {
      return (
        <div
          key={asiento.id}
          className="relative cursor-not-allowed transition-all duration-300 group"
        >
          {/* Occupied seat with name - GRANATE BACKGROUND, WHITE TEXT */}
          <div className="w-16 h-20 bg-event-primary dark:bg-event-primary/90 rounded-xl border-2 border-event-primary/80 dark:border-event-primary/60 flex flex-col items-center justify-center shadow-lg">
            <div className="text-xs font-bold mb-1 text-white">#{asiento.numero}</div>
            <div className="text-xs font-medium text-center leading-tight px-1 text-white/90">
              <div className="truncate max-w-[50px]">{reserva.usuario.nombres?.split(' ')[0]}</div>
              <div className="truncate max-w-[50px]">{reserva.usuario.apellidos?.split(' ')[0]}</div>
            </div>
          </div>
          
          {/* Tooltip completo al hover */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-black/90 backdrop-blur-xl text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 z-50 shadow-2xl border border-white/20">
            <div className="font-bold">{reserva.usuario.nombres} {reserva.usuario.apellidos}</div>
            <div className="text-white/80">Asiento #{asiento.numero} - Ocupado</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
          </div>
        </div>
      );
    } else {
      return (
        <div
          key={asiento.id}
          className="relative cursor-pointer transition-all duration-300 hover:scale-105"
          onClick={() => onSeatSelect(asiento)}
        >
          {/* Available seat - WHITE BACKGROUND, GRANATE TEXT (light theme) / SUBTLE BACKGROUND (dark theme) */}
          <div className="w-16 h-16 bg-white dark:bg-event-success/10 rounded-xl border-2 border-event-primary/30 dark:border-event-success/30 flex flex-col items-center justify-center text-event-primary dark:text-event-success hover:bg-event-primary/10 dark:hover:bg-event-success/20 hover:border-event-primary/60 dark:hover:border-event-success/60 hover:shadow-xl shadow-lg">
            <div className="text-sm font-bold text-event-primary dark:text-event-success">#{asiento.numero}</div>
            <div className="text-xs text-event-primary/80 dark:text-event-success/80 font-medium">Libre</div>
          </div>
        </div>
      );
    }
  };

  const renderMesa = (mesa: Mesa) => {
    const asientosMesa = getAsientosPorMesa(mesa.id);
    const radius = 100; // Radio más grande
    const centerX = 140;
    const centerY = 140;
    const disponibles = asientosMesa.filter(a => !a.ocupado && !reservasPorAsiento[a.id]).length;

    return (
      <div key={mesa.id} className="relative mb-8">
        {/* Mesa circular con efectos mejorados */}
        <div className="w-72 h-72 flex items-center justify-center relative">
          {/* Centro de la mesa con glassmorfismo */}
          <div className="w-40 h-40 rounded-full glass-primary border-2 border-event-primary/40 flex items-center justify-center backdrop-blur-xl shadow-2xl relative overflow-hidden">
            {/* Efecto de brillo interno */}
            <div className="absolute inset-0 bg-gradient-to-br from-event-primary/10 to-event-secondary/10 rounded-full"></div>
            <div className="relative z-10 text-center">
              <div className="text-lg font-bold bg-gradient-to-r from-event-primary to-event-secondary bg-clip-text text-transparent mb-1">
                {mesa.nombre}
              </div>
              <div className="text-xs text-muted-foreground mb-2">Mesa {mesa.numero}</div>
              <div className="flex items-center justify-center space-x-2 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-event-success rounded-full"></div>
                  <span className="text-event-success font-medium">{disponibles}</span>
                </div>
                <div className="text-muted-foreground">/</div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                  <span className="text-muted-foreground">{asientosMesa.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Asientos alrededor con mejor espaciado */}
          {asientosMesa.map((asiento, index) => {
            const angle = (index / asientosMesa.length) * 2 * Math.PI;
            const x = centerX + radius * Math.cos(angle - Math.PI / 2);
            const y = centerY + radius * Math.sin(angle - Math.PI / 2);

            return (
              <div
                key={asiento.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${x}px`,
                  top: `${y}px`,
                }}
              >
                {renderSeat(asiento)}
              </div>
            );
          })}

          {/* Líneas conectoras sutiles desde el centro */}
          {asientosMesa.map((asiento, index) => {
            const angle = (index / asientosMesa.length) * 2 * Math.PI;
            const x1 = centerX + 70 * Math.cos(angle - Math.PI / 2);
            const y1 = centerY + 70 * Math.sin(angle - Math.PI / 2);
            const x2 = centerX + radius * Math.cos(angle - Math.PI / 2);
            const y2 = centerY + radius * Math.sin(angle - Math.PI / 2);
            
            return (
              <svg
                key={`line-${asiento.id}`}
                className="absolute inset-0 pointer-events-none"
                width="280"
                height="280"
              >
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="url(#gradient)"
                  strokeWidth="1"
                  opacity="0.3"
                />
                <defs>
                  <linearGradient id="gradient" gradientUnits="userSpaceOnUse">
                    <stop stopColor="var(--event-primary)" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="var(--event-primary)" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
              </svg>
            );
          })}
        </div>
      </div>
    );
  };

  if (mesas.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <div className="text-center">
          <div className="text-lg mb-2">No hay mesas configuradas</div>
          <div className="text-sm">Contacta al administrador</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4 overflow-auto">
      {/* Grid de mesas optimizado para todo el espacio */}
      <div className="min-h-full flex items-center justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 lg:gap-8 xl:gap-12 justify-items-center items-center max-w-none">
          {mesas.map(renderMesa)}
        </div>
      </div>
    </div>
  );
};

export default SeatMap;