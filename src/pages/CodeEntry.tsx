import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { Lock, Sparkles } from "lucide-react";

const CodeEntry = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast({
        title: "Código inválido",
        description: "Por favor ingresa un código de 6 dígitos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Buscar el usuario con el código
      const { data: usuario, error } = await supabase
        .from("usuario")
        .select("*")
        .eq("codigo", code)
        .single();

      if (error || !usuario) {
        toast({
          title: "Código no válido",
          description: "El código ingresado no existe o no es válido",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verificar si ya tiene una reserva (doble verificación por seguridad)
      const { data: reservaExistente } = await supabase
        .from("reserva")
        .select("id")
        .eq("usuario_id", usuario.id)
        .limit(1);

      const tieneReserva = usuario.reservado || (reservaExistente && reservaExistente.length > 0);

      if (tieneReserva) {
        console.log("Usuario con reserva existente, redirigiendo a detalles");
        // Redirigir a detalles de reserva
        navigate("/details", { state: { userId: usuario.id } });
      } else {
        console.log("Usuario sin reserva, redirigiendo a selección de asiento");
        // Redirigir a selección de asiento
        navigate("/select-seat", { state: { userId: usuario.id } });
      }
    } catch (error) {
      console.error("Error al validar código:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error al validar el código",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Animated background */}
      <div className="absolute inset-0 gradient-animated opacity-20 dark:opacity-30" />
      <div className="absolute inset-0 bg-background/90 dark:bg-background/80 backdrop-blur-sm" />

      {/* Floating orbs for ambiance */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-event-primary/15 dark:bg-event-primary/20 rounded-full blur-xl animate-float" />
      <div className="absolute bottom-20 right-20 w-24 h-24 bg-event-secondary/15 dark:bg-event-secondary/20 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />

      <Card className="relative z-10 w-full max-w-md p-8 glass-primary animate-scale-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center">
            <img src="/logo.jpeg" alt="Logo" className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-event-primary to-event-secondary bg-clip-text text-transparent mb-2">
            Reencuentro de egresados FIGMM 2025
          </h1>
          <p className="text-muted-foreground">
            Ingresa tu código de 6 dígitos para acceder
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="000000"
              value={code}
              onChange={handleInputChange}
              className="text-center text-2xl font-mono tracking-wider h-14 bg-glass-secondary border-event-primary/30 focus:border-event-primary text-foreground placeholder:text-muted-foreground"
              maxLength={6}
              autoComplete="off"
            />
            <div className="absolute inset-0 rounded-md bg-gradient-to-r from-event-primary/10 to-event-secondary/10 pointer-events-none opacity-0 transition-opacity duration-300 peer-focus-within:opacity-100" />
          </div>

          <Button
            type="submit"
            className="w-full h-12 btn-primary group"
            disabled={loading || code.length !== 6}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Validando...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Acceder al Evento</span>
              </div>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            ¿No tienes tu código? Contacta al organizador del evento
          </p>
        </div>
      </Card>
    </div>
  );
};

export default CodeEntry;