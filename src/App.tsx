import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Managers from "./pages/Managers";
import ManagerProfile from "./pages/ManagerProfile";
import Deals from "./pages/Deals";
import Funnel from "./pages/Funnel";
import Receivables from "./pages/Receivables";
import Clients from "./pages/Clients";
import PlanFact from "./pages/PlanFact";
import Actions from "./pages/Actions";
import Variance from "./pages/Variance";
import Import1C from "./pages/Import1C";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/managers" element={<Managers />} />
              <Route path="/managers/:id" element={<ManagerProfile />} />
              <Route path="/deals" element={<Deals />} />
              <Route path="/funnel" element={<Funnel />} />
              <Route path="/receivables" element={<Receivables />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/plan-fact" element={<PlanFact />} />
              <Route path="/actions" element={<Actions />} />
              <Route path="/variance" element={<Variance />} />
              <Route path="/import-1c" element={<Import1C />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
