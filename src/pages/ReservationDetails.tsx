import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, MapPin, Calendar, LogOut, CheckCircle, Share2, Home } from "lucide-react";

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
  const { toast } = useToast();
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
      
      // 1. Obtener la reserva más reciente del usuario
      const { data: reservaData, error: reservaError } = await supabase
        .from("reserva")
        .select("*")
        .eq("usuario_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (reservaError) {
        console.error("Error obteniendo reserva:", reservaError);
        throw reservaError;
      }

      // 2. Obtener datos del usuario
      const { data: usuarioData, error: usuarioError } = await supabase
        .from("usuario")
        .select("nombres, apellidos, dni, correo, telefono, codigo")
        .eq("id", userId)
        .single();

      if (usuarioError) {
        console.error("Error obteniendo usuario:", usuarioError);
        throw usuarioError;
      }

      // 3. Obtener datos de la mesa
      const { data: mesaData, error: mesaError } = await supabase
        .from("mesa")
        .select("nombre, numero")
        .eq("id", reservaData.mesa_id)
        .single();

      if (mesaError) {
        console.error("Error obteniendo mesa:", mesaError);
        throw mesaError;
      }

      // 4. Obtener datos del asiento
      const { data: asientoData, error: asientoError } = await supabase
        .from("asiento")
        .select("numero")
        .eq("id", reservaData.asiento_id)
        .single();

      if (asientoError) {
        console.error("Error obteniendo asiento:", asientoError);
        throw asientoError;
      }

      // 5. Construir el objeto de datos
      setReservationData({
        usuario: usuarioData,
        mesa: mesaData,
        asiento: asientoData,
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

  const handleShare = async () => {
    const shareData = {
      title: '🎫 Mi Reserva Confirmada',
      text: `Mi reserva está confirmada:\n\n🎫 ${reservationData?.mesa.nombre} - Asiento #${reservationData?.asiento.numero}\n👤 ${reservationData?.usuario.nombres} ${reservationData?.usuario.apellidos}\n🔑 Código: ${reservationData?.usuario.codigo}\n\n¡Nos vemos en el evento!`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copiar al clipboard
      navigator.clipboard.writeText(shareData.text);
      toast({
        title: "Información copiada",
        description: "Los detalles de tu reserva se copiaron al portapapeles",
      });
    }
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 gradient-animated opacity-30" />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      
      {/* Success animation orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-event-success/20 rounded-full blur-xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-event-primary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '1s' }} />
      
      {/* Ticket Design - Compact, no scroll */}
      <Card className="relative z-10 w-full max-w-md mx-auto glass-primary animate-scale-in border-2 border-dashed border-event-success/30 p-6">
        {/* Ticket Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-event-success to-emerald-500 rounded-full mb-4 animate-glow-pulse">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-event-success to-emerald-500 bg-clip-text text-transparent mb-2">
            Mi Reserva
          </h1>
          <div className="inline-flex items-center px-3 py-1 bg-event-success/10 border border-event-success/30 rounded-full">
            <div className="w-2 h-2 bg-event-success rounded-full animate-pulse mr-2"></div>
            <span className="text-xs font-medium text-event-success">Confirmado</span>
          </div>
        </div>

        {/* Ticket Body - Main Info */}
        <div className="space-y-4 mb-6">
          {/* Location Info - Most Important */}
          <div className="text-center glass-secondary p-4 rounded-lg border border-event-primary/20">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-2xl font-bold text-event-primary mb-1">
                  {reservationData.mesa.nombre}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Mesa</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-event-secondary mb-1">
                  #{reservationData.asiento.numero}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Asiento</div>
              </div>
            </div>
          </div>

          {/* Personal Info - Compact */}
          <div className="glass p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <User className="w-4 h-4 text-event-primary mr-2" />
              <span className="font-semibold text-sm">Titular</span>
            </div>
            <div className="text-center">
              <div className="font-medium">
                {reservationData.usuario.nombres} {reservationData.usuario.apellidos}
              </div>
              <div className="text-sm text-muted-foreground">
                DNI: {reservationData.usuario.dni}
              </div>
            </div>
          </div>

          {/* Access Code - Prominent */}
          <div className="text-center glass-secondary p-4 rounded-lg border border-event-warning/30">
            <div className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
              Código de Acceso
            </div>
            <div className="font-mono text-2xl font-bold text-event-primary tracking-wider mb-2">
              {reservationData.usuario.codigo}
            </div>
            <div className="text-xs text-muted-foreground">
              Usa este código para acceder al sistema
            </div>
          </div>

          {/* Reservation Date */}
          <div className="glass p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Reservado:</span>
              </div>
              <span className="font-medium">
                {formatDate(reservationData.reserva.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Ticket Footer - Actions */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleShare}
              variant="outline"
              className="btn-ghost h-10 text-sm"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Compartir
            </Button>
            <Button
              onClick={handleLogout}
              className="btn-primary h-10 text-sm"
            >
              <Home className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
          
          {/* Status */}
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 bg-event-success/5 border border-event-success/20 rounded-full">
              <CheckCircle className="w-3 h-3 text-event-success mr-2" />
              <span className="text-xs text-event-success font-medium">
                Reserva válida y activa
              </span>
            </div>
          </div>
        </div>

        {/* Ticket perforations effect */}
        <div className="absolute -left-3 top-1/2 w-6 h-6 bg-background rounded-full transform -translate-y-1/2"></div>
        <div className="absolute -right-3 top-1/2 w-6 h-6 bg-background rounded-full transform -translate-y-1/2"></div>
      </Card>
    </div>
  );
};

export default ReservationDetails;