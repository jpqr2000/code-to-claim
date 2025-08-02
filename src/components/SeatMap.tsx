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
    
    let seatClass = "w-12 h-12 rounded-lg border-2 cursor-pointer transition-all duration-300 flex items-center justify-center text-sm font-medium relative group";
    
    if (isSelected) {
      seatClass += " bg-event-primary border-event-primary text-white shadow-lg scale-110 animate-glow-pulse";
    } else if (isOccupied) {
      seatClass += " bg-event-error/20 border-event-error text-event-error cursor-not-allowed";
    } else {
      seatClass += " bg-event-success/20 border-event-success text-event-success hover:bg-event-success/30 hover:scale-105";
    }

    return (
      <div
        key={asiento.id}
        className={seatClass}
        onClick={() => !isOccupied && onSeatSelect(asiento)}
        title={isOccupied ? `Ocupado por: ${reserva?.usuario?.nombres} ${reserva?.usuario?.apellidos}` : `Asiento ${asiento.numero} - Disponible`}
      >
        <span>{asiento.numero}</span>
        
        {/* Tooltip para asientos ocupados */}
        {isOccupied && reserva && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/90 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
            {reserva.usuario.nombres} {reserva.usuario.apellidos}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
          </div>
        )}
      </div>
    );
  };

  const renderMesa = (mesa: Mesa) => {
    const asientosMesa = getAsientosPorMesa(mesa.id);
    const radius = 80; // Radio del círculo en píxeles
    const centerX = 120;
    const centerY = 120;

    return (
      <div key={mesa.id} className="relative">
        {/* Mesa circular */}
        <div className="w-60 h-60 flex items-center justify-center relative">
          {/* Centro de la mesa */}
          <div className="w-32 h-32 rounded-full glass-secondary border-2 border-event-primary/30 flex items-center justify-center">
            <div className="text-center">
              <div className="font-bold text-event-primary">{mesa.nombre}</div>
              <div className="text-sm text-muted-foreground">Mesa {mesa.numero}</div>
            </div>
          </div>

          {/* Asientos alrededor de la mesa */}
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
        </div>

        {/* Información de la mesa */}
        <div className="text-center mt-4">
          <div className="text-sm text-muted-foreground">
            {asientosMesa.filter(a => !a.ocupado && !reservasPorAsiento[a.id]).length} / {asientosMesa.length} disponibles
          </div>
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
    <div className="p-6">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Distribución del Evento</h2>
        <p className="text-muted-foreground">Selecciona tu asiento preferido</p>
      </div>

      {/* Grid de mesas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
        {mesas.map(renderMesa)}
      </div>

      {/* Leyenda */}
      <div className="mt-8 flex justify-center">
        <div className="glass-secondary p-4 rounded-lg">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-event-success/20 border border-event-success rounded"></div>
              <span>Disponible</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-event-error/20 border border-event-error rounded"></div>
              <span>Ocupado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-event-primary border border-event-primary rounded"></div>
              <span>Seleccionado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatMap;