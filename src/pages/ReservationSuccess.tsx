import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Sparkles, Home, User, MapPin, Calendar } from "lucide-react";

interface ReservationData {
  usuario: {
    nombres: string;
    apellidos: string;
    dni: string;
    correo: string;
    telefono: string;
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

const ReservationSuccess = () => {
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
      
      // Obtener datos de la reserva más reciente del usuario
      const { data: reservaData, error: reservaError } = await supabase
        .from("reserva")
        .select(`
          *,
          usuario!reserva_usuario_id_fkey (
            nombres,
            apellidos,
            dni,
            correo,
            telefono
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

  const handleGoHome = () => {
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
          <Button onClick={handleGoHome} className="btn-primary">
            Volver al inicio
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 gradient-animated opacity-30" />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      {/* Success animation orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-event-success/20 rounded-full blur-xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-event-primary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-event-secondary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '3s' }} />
      
      <Card className="relative z-10 w-full max-w-2xl p-8 glass-primary animate-scale-in">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-event-success to-green-400 rounded-full mb-6 animate-glow-pulse">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-event-success to-green-400 bg-clip-text text-transparent mb-2">
            ¡Reserva Confirmada!
          </h1>
          <p className="text-muted-foreground text-lg">
            Tu asiento ha sido reservado exitosamente
          </p>
        </div>

        {/* Reservation Details */}
        <div className="space-y-6 mb-8">
          {/* User Info */}
          <Card className="glass-secondary p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-event-primary to-event-secondary rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Información Personal</h3>
                <p className="text-sm text-muted-foreground">Datos del titular</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">Nombre completo:</span>
                <span className="font-medium">
                  {reservationData.usuario.nombres} {reservationData.usuario.apellidos}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">DNI:</span>
                <span className="font-medium">{reservationData.usuario.dni}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Correo:</span>
                <span className="font-medium">{reservationData.usuario.correo}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Teléfono:</span>
                <span className="font-medium">{reservationData.usuario.telefono}</span>
              </div>
            </div>
          </Card>

          {/* Seat Info */}
          <Card className="glass-secondary p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-event-secondary to-blue-400 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Ubicación Asignada</h3>
                <p className="text-sm text-muted-foreground">Tu lugar en el evento</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">Mesa:</span>
                <span className="font-medium text-lg">
                  {reservationData.mesa.nombre}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Asiento:</span>
                <span className="font-medium text-lg">
                  #{reservationData.asiento.numero}
                </span>
              </div>
            </div>
          </Card>

          {/* Reservation Info */}
          <Card className="glass-secondary p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-event-accent to-purple-400 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Detalles de la Reserva</h3>
                <p className="text-sm text-muted-foreground">Información adicional</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground block">Fecha de reserva:</span>
                <span className="font-medium">
                  {formatDate(reservationData.reserva.created_at)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block">Estado:</span>
                <span className="font-medium text-event-success capitalize">
                  {reservationData.reserva.estado}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Important Notice */}
        <div className="glass-secondary p-4 rounded-lg mb-6 border border-event-warning/30">
          <p className="text-sm text-center text-muted-foreground">
            <span className="font-medium text-event-warning">Importante:</span> 
            {" "}Guarda este código de confirmación para acceder nuevamente a tus detalles de reserva
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleGoHome}
            className="flex-1 btn-primary group"
          >
            <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            Finalizar
          </Button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-8 h-8 bg-event-success/20 rounded-full blur-sm animate-float" />
        <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-event-primary/20 rounded-full blur-sm animate-float" style={{ animationDelay: '2s' }} />
      </Card>
    </div>
  );
};

export default ReservationSuccess;