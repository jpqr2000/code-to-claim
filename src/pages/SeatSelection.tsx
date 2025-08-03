import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Users, MapPin, Map } from "lucide-react";
import SeatMap from "@/components/SeatMap";
import ReservationForm from "@/components/ReservationForm";

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

const SeatSelection = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [asientos, setAsientos] = useState<Asiento[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<Asiento | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState<1 | 2>(1);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const userId = location.state?.userId;

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }

    loadData();
  }, [userId, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Cargar mesas
      const { data: mesasData, error: mesasError } = await supabase
        .from("mesa")
        .select("*")
        .order("numero");

      if (mesasError) throw mesasError;

      // Cargar asientos
      const { data: asientosData, error: asientosError } = await supabase
        .from("asiento")
        .select("*")
        .order("mesa_id, posicion");

      if (asientosError) throw asientosError;

      // Cargar reservas con información de usuarios
      const { data: reservasData, error: reservasError } = await supabase
        .from("reserva")
        .select(`
          id,
          usuario_id,
          mesa_id,
          asiento_id,
          estado,
          usuario!reserva_usuario_id_fkey (
            nombres,
            apellidos
          )
        `);

      if (reservasError) throw reservasError;

      setMesas(mesasData || []);
      setAsientos(asientosData || []);
      setReservas(reservasData || []);
    } catch (error) {
      console.error("Error cargando datos:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del evento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSeatSelect = (asiento: Asiento) => {
    if (asiento.ocupado) return;

    setSelectedSeat(asiento);
    setShowForm(true);
  };

  const handleReservationSuccess = () => {
    navigate("/success", { state: { userId } });
  };

  const handleBack = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-primary p-8 rounded-xl animate-scale-in">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-2 border-event-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-lg">Cargando evento...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Background */}
      <div className="absolute inset-0 gradient-animated opacity-15 dark:opacity-20" />
      <div className="absolute inset-0 bg-background/95 dark:bg-background/90 backdrop-blur-sm" />

      {/* Scrollable Title */}
      <div className="relative z-10 flex justify-center pt-8 pb-4">
        <div className="glass-primary border border-event-primary/20 rounded-2xl px-8 py-4 shadow-2xl animate-scale-in">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-event-primary via-event-accent to-event-secondary bg-clip-text text-transparent">
                Escenario principal
              </h1>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-glass-secondary border-event-primary/30 hover:bg-event-primary/10 transition-all duration-300"
                  >
                    <Map className="w-4 h-4 mr-2" />
                    Ver distribución
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold bg-gradient-to-r from-event-primary to-event-secondary bg-clip-text text-transparent">
                      Distribución del Venue - {selectedFloor === 1 ? 'Primer Piso' : 'Segundo Piso'}
                    </DialogTitle>
                    <div className="flex justify-center gap-2 mt-4">
                      <Button
                        variant={selectedFloor === 1 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedFloor(1)}
                        className={selectedFloor === 1 ? "bg-event-primary hover:bg-event-primary/90" : "border-event-primary/30 hover:bg-event-primary/10"}
                      >
                        Piso 1
                      </Button>
                      <Button
                        variant={selectedFloor === 2 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedFloor(2)}
                        className={selectedFloor === 2 ? "bg-event-primary hover:bg-event-primary/90" : "border-event-primary/30 hover:bg-event-primary/10"}
                      >
                        Piso 2
                      </Button>
                    </div>
                  </DialogHeader>
                  <div className="flex justify-center items-center p-4">
                    <img
                      src={selectedFloor === 1 ? "/venue.jpeg" : "/venue2.jpeg"}
                      alt={`Distribución del venue - ${selectedFloor === 1 ? 'Primer' : 'Segundo'} piso`}
                      className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg border border-event-primary/20"
                    />
                  </div>
                  <div className="text-center text-sm text-muted-foreground px-4 pb-2">
                    {selectedFloor === 1 
                      ? "Distribución oficial del evento - Las mesas están numeradas del 1 al 28"
                      : "Distribución oficial del evento - Las mesas están numeradas del 29 al 34"
                    }
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <p className="text-sm text-foreground/80 mt-1 font-medium">Haz clic en cualquier asiento disponible</p>
          </div>
        </div>
      </div>

      {/* Full Screen Seat Map */}
      <div className="relative z-10 flex-1 overflow-hidden">
        <SeatMap
          mesas={mesas}
          asientos={asientos}
          reservas={reservas}
          selectedSeat={selectedSeat}
          onSeatSelect={handleSeatSelect}
        />
      </div>

      {/* macOS Style Floating Dock */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30">
        <div className="glass-secondary border border-event-primary/10 rounded-2xl px-6 py-4 shadow-2xl animate-scale-in">
          <div className="flex items-center space-x-6">
            {/* Elegant Exit Button */}
            <Button
              variant="ghost"
              onClick={handleBack}
              className="w-14 h-14 rounded-2xl bg-secondary/50 hover:bg-secondary/70 border border-border hover:border-border/70 transition-all duration-300 p-0 hover:scale-110 shadow-lg hover:shadow-xl group"
              title="Salir del evento"
            >
              <ArrowLeft className="w-6 h-6 text-foreground/80 group-hover:text-foreground transition-colors" />
            </Button>

            {/* Separator */}
            <div className="w-px h-8 bg-border"></div>

            {/* Stats */}
            <div className="flex items-center space-x-4 text-foreground">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-white dark:bg-event-success rounded-full shadow-lg border-2 border-event-primary dark:border-event-success/50"></div>
                <span className="text-sm font-bold">{asientos.length - reservas.length}</span>
                <span className="text-xs text-foreground/80 font-medium">Libres</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-event-primary rounded-full shadow-lg border border-event-primary/50"></div>
                <span className="text-sm font-bold">{reservas.length}</span>
                <span className="text-xs text-foreground/80 font-medium">Ocupados</span>
              </div>
            </div>

            {/* Selected Seat Info */}
            {selectedSeat && (
              <>
                <div className="w-px h-8 bg-border"></div>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-event-primary to-event-accent rounded-xl flex items-center justify-center shadow-lg border border-white/20">
                    <span className="text-sm font-bold text-white">#{selectedSeat.numero}</span>
                  </div>
                  <div className="text-foreground">
                    <div className="text-sm font-bold">
                      {mesas.find(m => m.id === selectedSeat.mesa_id)?.nombre}
                    </div>
                    <div className="text-xs text-foreground/80 font-medium">Seleccionado</div>
                  </div>
                </div>
              </>
            )}

            {/* Legend */}
            <div className="w-px h-8 bg-border"></div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-white dark:bg-event-success rounded-full shadow-sm border border-event-primary dark:border-event-success/30"></div>
                <span className="text-xs text-foreground/90 font-medium">Libre</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-event-primary rounded-full shadow-sm border border-event-primary/30"></div>
                <span className="text-xs text-foreground/90 font-medium">Ocupado</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gradient-to-r from-event-primary to-event-accent rounded-full shadow-sm border border-white/20 dark:border-foreground/20"></div>
                <span className="text-xs text-foreground/90 font-medium">Seleccionado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reservation Form Modal */}
      {showForm && selectedSeat && (
        <ReservationForm
          userId={userId}
          selectedSeat={selectedSeat}
          mesa={mesas.find(m => m.id === selectedSeat.mesa_id)}
          onClose={() => {
            setShowForm(false);
            setSelectedSeat(null);
          }}
          onSuccess={handleReservationSuccess}
        />
      )}
    </div>
  );
};

export default SeatSelection;