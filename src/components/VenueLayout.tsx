import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// Interfaces para el nuevo layout
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

interface VenueArea {
  id: string;
  name: string;
  type: 'dance_floor' | 'stage' | 'bar' | 'service' | 'stairs' | 'screen';
  coordinates: { x: number; y: number; width: number; height: number };
  rotation?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
  textPosition?: { x: number; y: number };
}

interface TablePosition {
  numero: number;
  coordinates: { x: number; y: number };
  isVIP?: boolean;
  isHighlighted?: boolean;
}

interface VenueLayoutProps {
  mesas: Mesa[];
  asientos: Asiento[];
  reservas: Reserva[];
  selectedSeat: Asiento | null;
  onSeatSelect: (asiento: Asiento) => void;
}

// Dimensiones del venue ampliadas para mejor espaciado
const VENUE_DIMENSIONS = { width: 1800, height: 1200 };

// Áreas especiales del venue reposicionadas
const VENUE_AREAS: VenueArea[] = [
  // Pista de baile (centro)
  {
    id: 'dance_floor',
    name: 'PISTA DE BAILE',
    type: 'dance_floor',
    coordinates: { x: 650, y: 550, width: 400, height: 200 },
    style: 'solid',
    color: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600',
    textPosition: { x: 850, y: 650 }
  },
  // Escenario de orquesta (izquierda)
  {
    id: 'stage',
    name: 'ESCENARIO DE\nORQUESTA',
    type: 'stage',
    coordinates: { x: 200, y: 450, width: 120, height: 350 },
    style: 'dashed',
    color: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    textPosition: { x: 260, y: 625 }
  },
  // Barra de cocteles (superior derecha)
  {
    id: 'bar',
    name: 'BARRA DE COCTELES',
    type: 'bar',
    coordinates: { x: 1150, y: 80, width: 250, height: 100 },
    rotation: 15,
    style: 'solid',
    color: 'bg-green-100 dark:bg-green-900/30 border-green-400',
    textPosition: { x: 1275, y: 130 }
  },
  // Baños (izquierda)
  {
    id: 'stairs',
    name: 'BAÑOS',
    type: 'stairs',
    coordinates: { x: 80, y: 250, width: 100, height: 150 },
    style: 'solid',
    color: 'bg-gray-200 dark:bg-gray-700 border-gray-400',
    textPosition: { x: 130, y: 210 }
  },
  // Pantalla (derecha)
  {
    id: 'screen',
    name: 'PANTALLA',
    type: 'screen',
    coordinates: { x: 1650, y: 500, width: 60, height: 250 },
    style: 'solid',
    color: 'bg-red-500 dark:bg-red-600 border-red-600',
    textPosition: { x: 1680, y: 470 }
  }
];

// Posiciones reajustadas de las 28 mesas con mayor espaciado
const TABLE_POSITIONS: TablePosition[] = [
  // Fila superior (18-20) - más separadas
  { numero: 18, coordinates: { x: 600, y: 150 } },
  { numero: 19, coordinates: { x: 800, y: 150 } },
  { numero: 20, coordinates: { x: 1000, y: 150 } },
  
  // Segunda fila (21-23) - más separadas
  { numero: 21, coordinates: { x: 600, y: 300 } },
  { numero: 22, coordinates: { x: 800, y: 300 } },
  { numero: 23, coordinates: { x: 1000, y: 300 } },
  
  // Tercera fila (24-26) - más separadas
  { numero: 24, coordinates: { x: 600, y: 450 } },
  { numero: 25, coordinates: { x: 800, y: 450 } },
  { numero: 26, coordinates: { x: 1000, y: 450 } },
  
  // Lado derecho superior (27-28) - más separadas
  { numero: 27, coordinates: { x: 1200, y: 300 } },
  { numero: 28, coordinates: { x: 1400, y: 300 } },
  
  // Área central derecha primera fila (1-4) - Área VIP con más espacio
  { numero: 1, coordinates: { x: 1200, y: 450 }, isVIP: true },
  { numero: 2, coordinates: { x: 1400, y: 450 }, isVIP: true },
  { numero: 3, coordinates: { x: 1600, y: 450 }, isVIP: true },
  { numero: 4, coordinates: { x: 1600, y: 600 }, isVIP: true },
  
  // Mesa destacada (5) - bien separada
  { numero: 5, coordinates: { x: 1200, y: 600 }, isHighlighted: true },
  
  // Segunda fila derecha (6-8) - más espaciadas
  { numero: 6, coordinates: { x: 1400, y: 600 } },
  { numero: 7, coordinates: { x: 1200, y: 750 } },
  { numero: 8, coordinates: { x: 1400, y: 750 } },
  
  // Tercera fila derecha (9-12) - mejor distribución
  { numero: 9, coordinates: { x: 1600, y: 750 } },
  { numero: 10, coordinates: { x: 1600, y: 900 } },
  { numero: 11, coordinates: { x: 1400, y: 900 } },
  { numero: 12, coordinates: { x: 1200, y: 900 } },
  
  // Fila inferior (13-17) - más espaciadas
  { numero: 13, coordinates: { x: 450, y: 900 } },
  { numero: 14, coordinates: { x: 600, y: 900 } },
  { numero: 15, coordinates: { x: 750, y: 900 } },
  { numero: 16, coordinates: { x: 900, y: 900 } },
  { numero: 17, coordinates: { x: 1050, y: 900 } },
];

const VenueLayout = ({ mesas, asientos, reservas, selectedSeat, onSeatSelect }: VenueLayoutProps) => {
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-fit del venue al contenedor
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        const scaleX = (containerWidth - 40) / VENUE_DIMENSIONS.width;
        const scaleY = (containerHeight - 40) / VENUE_DIMENSIONS.height;
        const autoScale = Math.min(scaleX, scaleY, 1);
        
        setScale(autoScale);
        
        // Centrar el venue
        const offsetX = (containerWidth - VENUE_DIMENSIONS.width * autoScale) / 2;
        const offsetY = (containerHeight - VENUE_DIMENSIONS.height * autoScale) / 2;
        setPanOffset({ x: offsetX / autoScale, y: offsetY / autoScale });
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Funciones de zoom y pan
  const handleZoom = (delta: number) => {
    const newScale = Math.max(0.3, Math.min(3, scale + delta));
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsPanning(true);
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    
    const deltaX = e.clientX - lastPanPoint.x;
    const deltaY = e.clientY - lastPanPoint.y;
    
    setPanOffset(prev => ({
      x: prev.x + deltaX / scale,
      y: prev.y + deltaY / scale
    }));
    
    setLastPanPoint({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Touch events para móvil
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsPanning(true);
      setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPanning || e.touches.length !== 1) return;
    
    const deltaX = e.touches[0].clientX - lastPanPoint.x;
    const deltaY = e.touches[0].clientY - lastPanPoint.y;
    
    setPanOffset(prev => ({
      x: prev.x + deltaX / scale,
      y: prev.y + deltaY / scale
    }));
    
    setLastPanPoint({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800" ref={containerRef}>
      {/* Controles de zoom */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-2">
        <button
          onClick={() => handleZoom(0.2)}
          className="w-10 h-10 bg-glass-primary border border-event-primary/20 rounded-lg flex items-center justify-center text-lg font-bold hover:bg-event-primary/10 transition-colors shadow-lg"
        >
          +
        </button>
        <button
          onClick={() => handleZoom(-0.2)}
          className="w-10 h-10 bg-glass-primary border border-event-primary/20 rounded-lg flex items-center justify-center text-lg font-bold hover:bg-event-primary/10 transition-colors shadow-lg"
        >
          −
        </button>
        <button
          onClick={() => {
            // Reset to auto-fit
            if (containerRef.current) {
              const container = containerRef.current;
              const containerWidth = container.clientWidth;
              const containerHeight = container.clientHeight;
              
              const scaleX = (containerWidth - 40) / VENUE_DIMENSIONS.width;
              const scaleY = (containerHeight - 40) / VENUE_DIMENSIONS.height;
              const autoScale = Math.min(scaleX, scaleY, 1);
              
              setScale(autoScale);
              
              const offsetX = (containerWidth - VENUE_DIMENSIONS.width * autoScale) / 2;
              const offsetY = (containerHeight - VENUE_DIMENSIONS.height * autoScale) / 2;
              setPanOffset({ x: offsetX / autoScale, y: offsetY / autoScale });
            }
          }}
          className="w-10 h-10 bg-glass-primary border border-event-primary/20 rounded-lg flex items-center justify-center text-xs font-bold hover:bg-event-primary/10 transition-colors shadow-lg"
          title="Centrar vista"
        >
          ⌂
        </button>
      </div>

      {/* Vista del venue */}
      <div
        className="relative cursor-move select-none origin-top-left"
        style={{
          width: VENUE_DIMENSIONS.width,
          height: VENUE_DIMENSIONS.height,
          transform: `scale(${scale}) translate(${panOffset.x}px, ${panOffset.y}px)`
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Fondo del venue */}
        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900 rounded-lg border-2 border-slate-200 dark:border-slate-700" />
        
        {/* Etiqueta "PRIMER PISO" */}
        <div className="absolute top-4 right-4 px-3 py-1 border-2 border-foreground/30 text-sm font-bold text-foreground/70 bg-background/80 rounded">
          PRIMER PISO
        </div>

        {/* Renderizar áreas especiales */}
        {VENUE_AREAS.map(area => (
          <div key={area.id}>
            <div
              className={cn(
                "absolute border-2 flex items-center justify-center",
                area.style === 'dashed' ? 'border-dashed' : 
                area.style === 'dotted' ? 'border-dotted' : 'border-solid',
                area.color
              )}
              style={{
                left: area.coordinates.x,
                top: area.coordinates.y,
                width: area.coordinates.width,
                height: area.coordinates.height,
                transform: area.rotation ? `rotate(${area.rotation}deg)` : undefined
              }}
            />
            {area.textPosition && (
              <div
                className="absolute text-sm font-bold text-foreground/60 pointer-events-none text-center whitespace-pre-line"
                style={{
                  left: area.textPosition.x - 60,
                  top: area.textPosition.y,
                  width: 120,
                  transform: area.rotation ? `rotate(${area.rotation}deg)` : undefined
                }}
              >
                {area.name}
              </div>
            )}
          </div>
        ))}

        {/* Renderizar mesas principales (1-28) con sus asientos */}
        {TABLE_POSITIONS.map(tablePos => {
          // Buscar la mesa correspondiente en los datos
          const mesa = mesas.find(m => m.numero === tablePos.numero);
          if (!mesa) return null;

          return (
            <div key={mesa.id}>
              {/* Mesa con asientos alrededor (renderizado similar al SeatMap actual) */}
              <div 
                className="absolute"
                style={{
                  left: tablePos.coordinates.x - 60,
                  top: tablePos.coordinates.y - 60,
                  width: 120,
                  height: 120
                }}
              >
                {/* Centro de la mesa */}
                <div className={cn(
                  "absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-primary border-2 border-event-primary/40 flex items-center justify-center backdrop-blur-xl shadow-lg",
                  tablePos.isVIP ? 'ring-2 ring-yellow-400' : '',
                  tablePos.isHighlighted ? 'ring-4 ring-red-500' : ''
                )}>
                  <div className="text-center">
                    <div className="text-xs font-bold text-event-primary">{mesa.numero}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[40px]">{mesa.nombre}</div>
                  </div>
                </div>

                {/* Asientos alrededor de la mesa */}
                {asientos
                  .filter(asiento => asiento.mesa_id === mesa.id)
                  .map((asiento, index, mesaAsientos) => {
                    const reserva = reservas.find(r => r.asiento_id === asiento.id);
                    const isOccupied = asiento.ocupado || !!reserva;
                    const isSelected = selectedSeat?.id === asiento.id;
                    
                    // Calcular posición del asiento alrededor de la mesa
                    const angle = (index / mesaAsientos.length) * 2 * Math.PI;
                    const radius = 35; // Reducido para que coincida con el container más pequeño
                    const x = 60 + radius * Math.cos(angle - Math.PI / 2);
                    const y = 60 + radius * Math.sin(angle - Math.PI / 2);

                    return (
                      <div
                        key={asiento.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: x, top: y }}
                      >
                        {/* Asientos más pequeños para mejor distribución */}
                        {isSelected ? (
                          <div className="relative cursor-pointer transition-all duration-300 transform scale-110">
                            <div className="w-8 h-8 bg-gradient-to-br from-event-primary to-event-accent rounded-lg border border-white shadow-xl flex flex-col items-center justify-center text-white animate-glow-pulse">
                              <div className="text-xs font-bold">#{asiento.numero}</div>
                            </div>
                          </div>
                        ) : isOccupied && reserva ? (
                          <div className="relative cursor-not-allowed transition-all duration-300 group">
                            <div className="w-8 h-10 bg-event-primary dark:bg-event-primary/90 rounded-lg border border-event-primary/80 dark:border-event-primary/60 flex flex-col items-center justify-center shadow-md">
                              <div className="text-xs font-bold mb-0.5 text-white">#{asiento.numero}</div>
                              <div className="text-xs font-medium text-center leading-tight px-0.5 text-white/90">
                                <div className="truncate max-w-[28px] text-xs">{reserva.usuario.nombres?.split(' ')[0]}</div>
                                <div className="truncate max-w-[28px] text-xs">{reserva.usuario.apellidos?.split(' ')[0]}</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div 
                            className="relative cursor-pointer transition-all duration-300 hover:scale-105"
                            onClick={() => onSeatSelect(asiento)}
                          >
                            <div className="w-8 h-8 bg-white dark:bg-event-success/10 rounded-lg border border-event-primary/30 dark:border-event-success/30 flex flex-col items-center justify-center text-event-primary dark:text-event-success hover:bg-event-primary/10 dark:hover:bg-event-success/20 hover:border-event-primary/60 dark:hover:border-event-success/60 hover:shadow-lg shadow-sm">
                              <div className="text-xs font-bold text-event-primary dark:text-event-success">#{asiento.numero}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}

        {/* Renderizar mesas extra (>28) como emergencia */}
        {mesas
          .filter(mesa => mesa.numero > 28)
          .map((mesa, index) => {
            // Posicionar las mesas extra en una fila en la parte inferior
            const extraX = 100 + (index * 120);
            const extraY = 820;
            
            return (
              <div key={mesa.id}>
                <div 
                  className="absolute"
                  style={{
                    left: extraX - 60,
                    top: extraY - 60,
                    width: 120,
                    height: 120
                  }}
                >
                  {/* Centro de la mesa extra */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full glass-primary border-2 border-orange-500 flex items-center justify-center backdrop-blur-xl shadow-lg ring-2 ring-orange-400">
                    <div className="text-center">
                      <div className="text-xs font-bold text-orange-600">{mesa.numero}</div>
                      <div className="text-xs text-orange-500">EXTRA</div>
                    </div>
                  </div>

                  {/* Asientos de mesa extra */}
                  {asientos
                    .filter(asiento => asiento.mesa_id === mesa.id)
                    .map((asiento, index, mesaAsientos) => {
                      const reserva = reservas.find(r => r.asiento_id === asiento.id);
                      const isOccupied = asiento.ocupado || !!reserva;
                      const isSelected = selectedSeat?.id === asiento.id;
                      
                      const angle = (index / mesaAsientos.length) * 2 * Math.PI;
                      const radius = 35; // Reducido para mesas extra también
                      const x = 60 + radius * Math.cos(angle - Math.PI / 2);
                      const y = 60 + radius * Math.sin(angle - Math.PI / 2);

                      return (
                        <div
                          key={asiento.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2"
                          style={{ left: x, top: y }}
                        >
                          {isSelected ? (
                            <div className="relative cursor-pointer transition-all duration-300 transform scale-110">
                              <div className="w-7 h-7 bg-gradient-to-br from-event-primary to-event-accent rounded-lg border border-white shadow-xl flex flex-col items-center justify-center text-white animate-glow-pulse">
                                <div className="text-xs font-bold">#{asiento.numero}</div>
                              </div>
                            </div>
                          ) : isOccupied && reserva ? (
                            <div className="relative cursor-not-allowed transition-all duration-300 group">
                              <div className="w-7 h-9 bg-event-primary rounded-lg border border-event-primary/80 flex flex-col items-center justify-center shadow-md">
                                <div className="text-xs font-bold text-white">#{asiento.numero}</div>
                                <div className="text-xs font-medium text-center leading-tight px-0.5 text-white/90">
                                  <div className="truncate max-w-[24px] text-xs">{reserva.usuario.nombres?.split(' ')[0]}</div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className="relative cursor-pointer transition-all duration-300 hover:scale-105"
                              onClick={() => onSeatSelect(asiento)}
                            >
                              <div className="w-7 h-7 bg-white dark:bg-event-success/10 rounded-lg border border-event-primary/30 dark:border-event-success/30 flex flex-col items-center justify-center text-event-primary dark:text-event-success hover:bg-event-primary/10 dark:hover:bg-event-success/20 shadow-sm">
                                <div className="text-xs font-bold">#{asiento.numero}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}

        {/* Etiqueta para mesas extra */}
        {mesas.filter(mesa => mesa.numero > 28).length > 0 && (
          <div className="absolute bottom-4 left-4 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-400 text-sm font-bold text-orange-600 rounded">
            MESAS DE EMERGENCIA
          </div>
        )}

        {/* Líneas decorativas especiales (como en la imagen) */}
        <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
          {/* Línea punteada roja alrededor del área VIP (mesas 1-4) */}
          <rect
            x="870"
            y="320"
            width="360"
            height="70"
            fill="none"
            stroke="red"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
        </svg>
      </div>
    </div>
  );
};

export default VenueLayout;