import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { User, MapPin, Calendar, LogOut, CheckCircle } from "lucide-react";

interface ReservationData {
  usuario: {
    nombres: string;
    apellidos: string;
    dni: string;
    correo: string;
    telefono: string;
    codigo: string;
  };
  mesa: {
    nombre: string;
    numero: number;
  };
  asiento: {
    numero: number;
  };
  reserva: {
    created_at: string;
    estado: string;
  };
}

const ReservationDetails = () => {
  const [reservationData, setReservationData] = useState<ReservationData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const userId = location.state?.userId;

  useEffect(() => {
    if (!userId) {
      navigate("/");
      return;
    }
    
    loadReservationData();
  }, [userId, navigate]);

  const loadReservationData = async () => {
    try {
      setLoading(true);
      
      // Obtener datos completos de la reserva del usuario
      const { data: reservaData, error: reservaError } = await supabase
        .from("reserva")
        .select(`
          *,
          usuario!reserva_usuario_id_fkey (
            nombres,
            apellidos,
            dni,
            correo,
            telefono,
            codigo
          ),
          mesa!reserva_mesa_id_fkey (
            nombre,
            numero
          ),
          asiento!reserva_asiento_id_fkey (
            numero
          )
        `)
        .eq("usuario_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (reservaError) throw reservaError;

      setReservationData({
        usuario: reservaData.usuario,
        mesa: reservaData.mesa,
        asiento: reservaData.asiento,
        reserva: {
          created_at: reservaData.created_at,
          estado: reservaData.estado
        }
      });
    } catch (error) {
      console.error("Error cargando datos de la reserva:", error);
      // Si hay error, redirigir al inicio
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    navigate("/");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-primary p-8 rounded-xl animate-scale-in">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 border-2 border-event-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-lg">Cargando información...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!reservationData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-primary p-8 text-center">
          <p className="text-muted-foreground mb-4">No se encontró información de la reserva</p>
          <Button onClick={handleLogout} className="btn-primary">
            Volver al inicio
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 gradient-animated opacity-20" />
      <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
      
      {/* Header */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 pt-6">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-event-primary to-event-secondary bg-clip-text text-transparent">
              Mi Reserva
            </h1>
            <p className="text-muted-foreground">
              Código de acceso: <span className="font-mono font-medium">{reservationData.usuario.codigo}</span>
            </p>
          </div>
          
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="btn-ghost group"
          >
            <LogOut className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
            Salir
          </Button>
        </div>

        {/* Status Banner */}
        <Card className="glass-primary p-6 mb-8 animate-fade-in">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-event-success to-green-400 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-event-success">Reserva Confirmada</h2>
              <p className="text-muted-foreground text-sm">
                Tu lugar está garantizado para el evento
              </p>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card className="glass-secondary p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-event-primary to-event-secondary rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Información Personal</h3>
                <p className="text-sm text-muted-foreground">Datos del titular de la reserva</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="glass p-4 rounded-lg">
                  <span className="text-muted-foreground text-sm block mb-1">Nombres</span>
                  <span className="font-medium text-lg">{reservationData.usuario.nombres}</span>
                </div>
                <div className="glass p-4 rounded-lg">
                  <span className="text-muted-foreground text-sm block mb-1">Apellidos</span>
                  <span className="font-medium text-lg">{reservationData.usuario.apellidos}</span>
                </div>
              </div>
              
              <div className="glass p-4 rounded-lg">
                <span className="text-muted-foreground text-sm block mb-1">Documento de Identidad</span>
                <span className="font-medium text-lg">{reservationData.usuario.dni}</span>
              </div>
              
              <div className="glass p-4 rounded-lg">
                <span className="text-muted-foreground text-sm block mb-1">Correo Electrónico</span>
                <span className="font-medium text-lg">{reservationData.usuario.correo}</span>
              </div>
              
              <div className="glass p-4 rounded-lg">
                <span className="text-muted-foreground text-sm block mb-1">Teléfono</span>
                <span className="font-medium text-lg">{reservationData.usuario.telefono}</span>
              </div>
            </div>
          </Card>

          {/* Seat & Event Information */}
          <div className="space-y-6">
            {/* Seat Location */}
            <Card className="glass-secondary p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-event-secondary to-blue-400 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Ubicación Asignada</h3>
                  <p className="text-sm text-muted-foreground">Tu lugar en el evento</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-center py-6 glass rounded-lg">
                  <div className="text-3xl font-bold bg-gradient-to-r from-event-secondary to-blue-400 bg-clip-text text-transparent mb-2">
                    {reservationData.mesa.nombre}
                  </div>
                  <div className="text-muted-foreground">Mesa</div>
                </div>
                
                <div className="text-center py-6 glass rounded-lg">
                  <div className="text-3xl font-bold bg-gradient-to-r from-event-primary to-purple-400 bg-clip-text text-transparent mb-2">
                    #{reservationData.asiento.numero}
                  </div>
                  <div className="text-muted-foreground">Asiento</div>
                </div>
              </div>
            </Card>

            {/* Reservation Details */}
            <Card className="glass-secondary p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-event-accent to-purple-400 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Detalles de la Reserva</h3>
                  <p className="text-sm text-muted-foreground">Información del registro</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="glass p-4 rounded-lg">
                  <span className="text-muted-foreground text-sm block mb-1">Fecha de reserva</span>
                  <span className="font-medium">{formatDate(reservationData.reserva.created_at)}</span>
                </div>
                
                <div className="glass p-4 rounded-lg">
                  <span className="text-muted-foreground text-sm block mb-1">Estado</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-event-success rounded-full animate-pulse" />
                    <span className="font-medium text-event-success capitalize">
                      {reservationData.reserva.estado}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 text-center">
          <Card className="glass-primary p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p className="text-muted-foreground mb-4">
              ¿Necesitas hacer cambios en tu reserva?
            </p>
            <p className="text-sm text-muted-foreground">
              Contacta al organizador del evento para cualquier modificación
            </p>
          </Card>
        </div>
      </div>

      {/* Decorative floating elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-event-primary/10 rounded-full blur-2xl animate-float" />
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-event-secondary/10 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-event-success/10 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }} />
    </div>
  );
};

export default ReservationDetails;