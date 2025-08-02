import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { X, User, Mail, Phone, IdCard, CheckCircle } from "lucide-react";

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

interface ReservationFormProps {
  userId: number;
  selectedSeat: Asiento;
  mesa?: Mesa;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string;
  correo: string;
}

const ReservationForm = ({ userId, selectedSeat, mesa, onClose, onSuccess }: ReservationFormProps) => {
  const [formData, setFormData] = useState<FormData>({
    nombres: "",
    apellidos: "",
    dni: "",
    telefono: "",
    correo: "",
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  const { toast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.nombres.trim()) {
      newErrors.nombres = "Los nombres son obligatorios";
    }

    if (!formData.apellidos.trim()) {
      newErrors.apellidos = "Los apellidos son obligatorios";
    }

    if (!formData.dni.trim()) {
      newErrors.dni = "El DNI es obligatorio";
    } else if (!/^\d{8}$/.test(formData.dni)) {
      newErrors.dni = "El DNI debe tener 8 dígitos";
    }

    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es obligatorio";
    } else if (!/^\d{9}$/.test(formData.telefono)) {
      newErrors.telefono = "El teléfono debe tener 9 dígitos";
    }

    if (!formData.correo.trim()) {
      newErrors.correo = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      newErrors.correo = "Ingresa un correo válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setShowConfirmation(true);
    }
  };

  const handleConfirmReservation = async () => {
    setLoading(true);

    try {
      // Actualizar datos del usuario
      const { error: userError } = await supabase
        .from("usuario")
        .update({
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          dni: formData.dni,
          telefono: formData.telefono,
          correo: formData.correo,
          reservado: true,
          fecha_reserva: new Date().toISOString(),
        })
        .eq("id", userId);

      if (userError) throw userError;

      // Crear la reserva
      const { error: reservaError } = await supabase
        .from("reserva")
        .insert({
          usuario_id: userId,
          mesa_id: selectedSeat.mesa_id,
          asiento_id: selectedSeat.id,
          estado: "confirmada",
        });

      if (reservaError) throw reservaError;

      // Marcar el asiento como ocupado
      const { error: asientoError } = await supabase
        .from("asiento")
        .update({ ocupado: true })
        .eq("id", selectedSeat.id);

      if (asientoError) throw asientoError;

      // Redirigir a pantalla de éxito (sin toast ya que la pantalla de éxito lo mostrará)
      onSuccess();
    } catch (error) {
      console.error("Error al crear la reserva:", error);
      toast({
        title: "Error",
        description: "No se pudo completar la reserva. Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      
      {/* Form Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 animate-slide-in-right">
        <Card className="h-full rounded-none glass-primary border-0">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Completar Reserva</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="w-8 h-8 p-0 rounded-full hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Selected seat info */}
            <div className="glass-secondary p-4 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-event-primary">
                  {mesa?.nombre}
                </div>
                <div className="text-sm text-muted-foreground">
                  Asiento #{selectedSeat.numero}
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombres */}
              <div className="space-y-2">
                <Label htmlFor="nombres" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Nombres *</span>
                </Label>
                <Input
                  id="nombres"
                  type="text"
                  value={formData.nombres}
                  onChange={(e) => handleInputChange("nombres", e.target.value)}
                  className={`bg-glass-secondary border-event-primary/30 ${errors.nombres ? 'border-event-error' : ''}`}
                  placeholder="Ingresa tus nombres"
                />
                {errors.nombres && (
                  <p className="text-sm text-event-error">{errors.nombres}</p>
                )}
              </div>

              {/* Apellidos */}
              <div className="space-y-2">
                <Label htmlFor="apellidos" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Apellidos *</span>
                </Label>
                <Input
                  id="apellidos"
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => handleInputChange("apellidos", e.target.value)}
                  className={`bg-glass-secondary border-event-primary/30 ${errors.apellidos ? 'border-event-error' : ''}`}
                  placeholder="Ingresa tus apellidos"
                />
                {errors.apellidos && (
                  <p className="text-sm text-event-error">{errors.apellidos}</p>
                )}
              </div>

              {/* DNI */}
              <div className="space-y-2">
                <Label htmlFor="dni" className="flex items-center space-x-2">
                  <IdCard className="w-4 h-4" />
                  <span>DNI *</span>
                </Label>
                <Input
                  id="dni"
                  type="text"
                  value={formData.dni}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 8);
                    handleInputChange("dni", value);
                  }}
                  className={`bg-glass-secondary border-event-primary/30 ${errors.dni ? 'border-event-error' : ''}`}
                  placeholder="12345678"
                  maxLength={8}
                />
                {errors.dni && (
                  <p className="text-sm text-event-error">{errors.dni}</p>
                )}
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="telefono" className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Teléfono *</span>
                </Label>
                <Input
                  id="telefono"
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 9);
                    handleInputChange("telefono", value);
                  }}
                  className={`bg-glass-secondary border-event-primary/30 ${errors.telefono ? 'border-event-error' : ''}`}
                  placeholder="987654321"
                  maxLength={9}
                />
                {errors.telefono && (
                  <p className="text-sm text-event-error">{errors.telefono}</p>
                )}
              </div>

              {/* Correo */}
              <div className="space-y-2">
                <Label htmlFor="correo" className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Correo Electrónico *</span>
                </Label>
                <Input
                  id="correo"
                  type="email"
                  value={formData.correo}
                  onChange={(e) => handleInputChange("correo", e.target.value)}
                  className={`bg-glass-secondary border-event-primary/30 ${errors.correo ? 'border-event-error' : ''}`}
                  placeholder="tu@correo.com"
                />
                {errors.correo && (
                  <p className="text-sm text-event-error">{errors.correo}</p>
                )}
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full btn-primary h-12"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Procesando...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>Reservar Asiento</span>
                  </div>
                )}
              </Button>
            </form>
          </div>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="glass-primary border-event-primary/30">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Confirmar Reserva
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Verifica que todos los datos sean correctos antes de confirmar
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center glass-secondary p-4 rounded-lg">
              <div className="text-lg font-semibold text-event-primary mb-2">
                {mesa?.nombre} - Asiento #{selectedSeat.numero}
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nombre:</span>
                <span className="font-medium">{formData.nombres} {formData.apellidos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">DNI:</span>
                <span className="font-medium">{formData.dni}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Teléfono:</span>
                <span className="font-medium">{formData.telefono}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Correo:</span>
                <span className="font-medium">{formData.correo}</span>
              </div>
            </div>
            
            <p className="text-center text-sm text-muted-foreground">
              ¿Confirmas que los datos son correctos?
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowConfirmation(false)}
              className="btn-ghost"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmReservation}
              className="btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Confirmando...</span>
                </div>
              ) : (
                "Confirmar Reserva"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReservationForm;