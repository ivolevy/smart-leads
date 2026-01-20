import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation } from 'lucide-react';

const RUBROS = [
  { id: 'metalurgicas', label: 'Metalúrgicas' },
  { id: 'restaurantes', label: 'Restaurantes' },
  { id: 'hoteles', label: 'Hoteles' },
  { id: 'abogados', label: 'Abogados' },
  { id: 'contadores', label: 'Contadores' },
  { id: 'inmobiliarias', label: 'Inmobiliarias' },
  { id: 'concesionarios', label: 'Concesionarios' },
];

const FiltersB2B = ({ onSearch }) => {
  const [rubro, setRubro] = useState('metalurgicas');
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(5);
  const autoCompleteRef = useRef();
  const inputRef = useRef();

  useEffect(() => {
    // Load Google Maps Script if not already present
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => initAutocomplete();
      document.body.appendChild(script);
    } else {
      initAutocomplete();
    }
  }, []);

  const initAutocomplete = () => {
    autoCompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['(cities)'],
    });
    autoCompleteRef.current.addListener('place_changed', () => {
      const place = autoCompleteRef.current.getPlace();
      setLocation(place.formatted_address || place.name);
    });
  };

  const handleSearch = () => {
    onSearch({ rubro, location, radius });
  };

  const useMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        onSearch({ rubro, lat: latitude, lng: longitude, radius });
      });
    }
  };

  return (
    <div className="glass p-6 w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-end">
      <div className="flex-1 w-full">
        <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Rubro</label>
        <select 
          value={rubro} 
          onChange={(e) => setRubro(e.target.value)}
          className="w-full"
        >
          {RUBROS.map(r => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 w-full">
        <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Ubicación</label>
        <div className="relative">
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Ej: Buenos Aires, AR" 
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full pl-10"
          />
          <MapPin className="absolute left-3 top-2.5 text-text-secondary" size={18} />
        </div>
      </div>

      <div className="w-full md:w-32">
        <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">Radio (km)</label>
        <input 
          type="number" 
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
          className="w-full"
          min="1"
          max="50"
        />
      </div>

      <div className="flex gap-2">
        <button 
          onClick={useMyLocation}
          className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
          title="Usar mi ubicación"
        >
          <Navigation size={20} />
        </button>
        <button 
          onClick={handleSearch}
          className="btn-primary flex items-center gap-2 whitespace-nowrap"
        >
          <Search size={18} />
          Buscar Empresas
        </button>
      </div>
    </div>
  );
};

export default FiltersB2B;
