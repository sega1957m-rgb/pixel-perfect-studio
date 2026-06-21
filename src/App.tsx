import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import RequireAuth from "@/components/RequireAuth";
import Index from "./pages/Index.tsx";
import Photos from "./pages/Photos";
import AlbumView from "./pages/AlbumView";
import Videos from "./pages/Videos";
import Studios from "./pages/Studios";
import StudioView from "./pages/StudioView";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/photos" element={<RequireAuth><Photos /></RequireAuth>} />
              <Route path="/photos/:id" element={<RequireAuth><AlbumView /></RequireAuth>} />
              <Route path="/videos" element={<RequireAuth><Videos /></RequireAuth>} />
              <Route path="/studios" element={<RequireAuth><Studios /></RequireAuth>} />
              <Route path="/studios/:id" element={<RequireAuth><StudioView /></RequireAuth>} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
