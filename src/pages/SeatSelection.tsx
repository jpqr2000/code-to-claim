import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, MapPin } from "lucide-react";
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
      {/* Background */}
      <div className="absolute inset-0 gradient-animated opacity-20" />
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      
      {/* Header */}
      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="btn-ghost group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:translate-x-[-2px] transition-transform" />
              Volver
            </Button>
            
            <Card className="glass-secondary px-6 py-3">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-event-success rounded-full" />
                  <span>Disponible</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-event-error rounded-full" />
                  <span>Ocupado</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-event-primary rounded-full" />
                  <span>Seleccionado</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-event-primary to-event-secondary bg-clip-text text-transparent mb-2">
              Selecciona tu Asiento
            </h1>
            <p className="text-muted-foreground flex items-center justify-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Haz clic en un asiento disponible para reservar</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1">
        <div className="max-w-7xl mx-auto px-6 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Seat Map */}
            <div className="lg:col-span-3">
              <Card className="glass-primary p-6 h-full">
                <SeatMap
                  mesas={mesas}
                  asientos={asientos}
                  reservas={reservas}
                  selectedSeat={selectedSeat}
                  onSeatSelect={handleSeatSelect}
                />
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="space-y-4">
                {/* Event info */}
                <Card className="glass-secondary p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-event-primary to-event-secondary rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Información del Evento</h3>
                      <p className="text-sm text-muted-foreground">Datos en tiempo real</p>
                    </div>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mesas totales:</span>
                      <span className="font-medium">{mesas.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Asientos totales:</span>
                      <span className="font-medium">{asientos.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ocupados:</span>
                      <span className="font-medium text-event-error">{reservas.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Disponibles:</span>
                      <span className="font-medium text-event-success">
                        {asientos.length - reservas.length}
                      </span>
                    </div>
                  </div>
                </Card>

                {/* Selected seat info */}
                {selectedSeat && (
                  <Card className="glass-primary p-6 animate-slide-in-right">
                    <h3 className="font-semibold mb-2">Asiento Seleccionado</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mesa:</span>
                        <span className="font-medium">
                          {mesas.find(m => m.id === selectedSeat.mesa_id)?.nombre}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Asiento:</span>
                        <span className="font-medium">#{selectedSeat.numero}</span>
                      </div>
                    </div>
                  </Card>
                )}
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