import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Layout, Users, History, FileText, Settings, LogOut } from 'lucide-react';

import FiltersB2B from './components/FiltersB2B';
import ProgressBar from './components/ProgressBar';
import ResultsTable from './components/ResultsTable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const App_B2B = () => {
  const [empresas, setEmpresas] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [currentSearchId, setCurrentSearchId] = useState(null);
  
  // Mock User ID for development (in production get from Supabase Auth)
  const userId = 'dev-user-123';

  const handleSearch = async (searchParams) => {
    try {
      setIsSearching(true);
      setSearchProgress(0);
      setEmpresas([]);
      
      const response = await axios.post(`${API_URL}/search`, {
        ...searchParams,
        user_id: userId
      });
      
      setCurrentSearchId(response.data.search_id);
    } catch (error) {
      toast.error('Error al iniciar la búsqueda');
      setIsSearching(false);
    }
  };

  // Polling for search progress
  useEffect(() => {
    let interval;
    if (currentSearchId && isSearching) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_URL}/search/${currentSearchId}/progress`);
          const progress = res.data.progress;
          
          if (progress === -1) {
            toast.error('Error durante el procesamiento');
            setIsSearching(false);
            clearInterval(interval);
          } else {
            setSearchProgress(progress);
            if (progress === 100) {
              setIsSearching(false);
              setCurrentSearchId(null);
              fetchResults();
              toast.success('Búsqueda completada con éxito');
              clearInterval(interval);
            }
          }
        } catch (error) {
          console.error(error);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentSearchId, isSearching]);

  const fetchResults = async () => {
    try {
      const res = await axios.get(`${API_URL}/empresas`);
      setEmpresas(res.data);
    } catch (error) {
      toast.error('Error al cargar resultados');
    }
  };

  const handleSendEmail = async (empresa) => {
    // For now, just a toast. In a real app, this would open a template selector.
    toast.info(`Abriendo editor para ${empresa.nombre}`);
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 glass m-4 mr-0 hidden lg:flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 text-primary-color">
          <div className="w-10 h-10 bg-primary-color rounded-xl flex items-center justify-center text-white">
            <Users size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">SmartLeads</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 p-3 bg-primary-color/10 text-primary-color rounded-lg font-medium">
            <Layout size={20} /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-text-secondary hover:text-white transition-colors">
            <History size={20} /> Historial
          </a>
          <a href="#" className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-text-secondary hover:text-white transition-colors">
            <FileText size={20} /> Plantillas
          </a>
          <a href="#" className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg text-text-secondary hover:text-white transition-colors">
            <Settings size={20} /> Configuración
          </a>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/10">
          <button className="flex items-center gap-3 p-3 text-text-secondary hover:text-accent-color transition-colors w-full text-left">
            <LogOut size={20} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold mb-2">Búsqueda de Empresas</h1>
            <p className="text-text-secondary">Encuentra y valida clientes B2B en segundos.</p>
          </div>
          <div className="glass px-4 py-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-color flex items-center justify-center text-xs font-bold">IL</div>
            <span className="text-sm font-medium">Ivan Levy</span>
          </div>
        </header>

        <section>
          <FiltersB2B onSearch={handleSearch} />
          
          {isSearching && (
            <div className="max-w-4xl mx-auto">
              <ProgressBar 
                progress={searchProgress} 
                label={searchProgress < 15 ? "Consultando OSM..." : searchProgress < 85 ? "Scrapeando sitios web..." : "Validando datos..."} 
              />
            </div>
          )}

          <ResultsTable 
            empresas={empresas} 
            onSendEmail={handleSendEmail} 
          />
        </section>
      </main>

      <ToastContainer theme="dark" position="bottom-right" />
    </div>
  );
};

export default App_B2B;
