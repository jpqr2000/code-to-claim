import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CodeEntry from "./pages/CodeEntry";
import SeatSelection from "./pages/SeatSelection";
import ReservationSuccess from "./pages/ReservationSuccess";
import ReservationDetails from "./pages/ReservationDetails";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CodeEntry />} />
          <Route path="/select-seat" element={<SeatSelection />} />
          <Route path="/success" element={<ReservationSuccess />} />
          <Route path="/details" element={<ReservationDetails />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
