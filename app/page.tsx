"use client";
import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Car } from './types/car';
import CarCard from './components/CarCard';
import CarModal from './components/CarModal';


export default function Home() {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);

  const [brandFilter, setBrandFilter] = useState('');
  const [transFilter, setTransFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');

  // Cargar autos desde Supabase en tiempo real
  useEffect(() => {
    async function loadCars() {
      setLoading(true);
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error cargando catálogo:', error.message);
      } else {
        setCars(data || []);
      }
      setLoading(false);
    }
    loadCars();
  }, []);

  const uniqueBrands = Array.from(new Set(cars.map(car => car.brand)));
  const uniqueTransmissions = Array.from(new Set(cars.map(car => car.transmission)));
  const uniqueCapacities = Array.from(new Set(cars.map(car => car.capacity?.toString()).filter(Boolean)));
  const uniqueModels = Array.from(new Set(cars.map(car => car.model)));

  const filteredCars = cars.filter(car => {
    return (brandFilter === '' || car.brand === brandFilter) &&
      (transFilter === '' || car.transmission === transFilter) &&
      (capacityFilter === '' || car.capacity?.toString() === capacityFilter) &&
      (modelFilter === '' || car.model === modelFilter);
  });

  return (
    // Contenedor principal que asegura el comportamiento "Sticky Footer"
    <div className="w-full bg-zinc-900 text-zinc-100 flex flex-col">

      {/* MAIN: Ocupa todo el espacio disponible empujando al Footer hacia abajo */}
      <main className="flex-grow">

        {/* HEADER */}
        <header className="relative h-[380px] w-full flex flex-col items-center justify-center text-center px-4 overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center brightness-[0.2] scale-105"
            style={{ backgroundImage: "url('Morro.jpg')" }}
          />
          <div className="relative z-10 bg-white p-5 rounded-3xl shadow-2xl border border-zinc-700/10 max-w-[260px] md:max-w-[300px] transition-all hover:scale-105 duration-300">
            <img src="/logo-rc.png" alt="R&C Rent A Car" className="w-full h-auto object-contain rounded-xl" />
          </div>
        </header>

        {/* BARRA DE FILTROS GRIS OSCURO */}
        <section className="relative z-20 max-w-4xl w-full mx-auto -mt-10 px-4">
          <div className="bg-zinc-800 border border-zinc-700/60 backdrop-blur-md p-5 rounded-2xl shadow-2xl grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Marca</label>
              <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 hover:border-zinc-500 transition-colors cursor-pointer">
                <option value="">Todas</option>
                {uniqueBrands.map(brand => (<option key={brand} value={brand}>{brand}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Transmisión</label>
              <select value={transFilter} onChange={(e) => setTransFilter(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 hover:border-zinc-500 transition-colors cursor-pointer">
                <option value="">Todas</option>
                {uniqueTransmissions.map(trans => (<option key={trans} value={trans}>{trans}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Capacidad</label>
              <select value={capacityFilter} onChange={(e) => setCapacityFilter(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 hover:border-zinc-500 transition-colors cursor-pointer">
                <option value="">Cualquiera</option>
                {uniqueCapacities.map(capacity => (<option key={capacity} value={capacity}>{capacity} Pasajeros</option>))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 uppercase tracking-wider">Modelo</label>
              <select value={modelFilter} onChange={(e) => setModelFilter(e.target.value)} className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 hover:border-zinc-500 transition-colors cursor-pointer">
                <option value="">Todos</option>
                {uniqueModels.map(model => (<option key={model} value={model}>{model}</option>))}
              </select>
            </div>
          </div>
        </section>

        {/* CATÁLOGO */}
        <section className="max-w-6xl w-full mx-auto px-4 pt-16 pb-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Nuestra Flota Disponible</h2>
              <p className="text-sm text-zinc-400 mt-1">Usa los filtros de arriba para encontrar el vehículo perfecto.</p>
            </div>
            <span className="text-xs bg-zinc-800 border border-zinc-700 text-zinc-400 px-3 py-1 rounded-full mt-2 md:mt-0 inline-block w-fit">Desliza horizontalmente ↔</span>
          </div>

          {loading ? (
            <div className="text-center py-20 text-zinc-500 text-sm">
              Cargando flota en tiempo real...
            </div>
          ) : (
            <div className="flex overflow-x-auto pb-6 pt-2 snap-x scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent gap-4">
              {filteredCars.length > 0 ? (
                filteredCars.map((car) => (<CarCard key={car.id} car={car} onSelect={setSelectedCar} />))
              ) : (
                <div className="w-full text-center py-12 bg-zinc-800/30 rounded-2xl border border-zinc-800/50">
                  <p className="text-zinc-400 text-sm italic">No se encontraron vehículos.</p>
                  <button onClick={() => { setBrandFilter(''); setTransFilter(''); setCapacityFilter(''); setModelFilter(''); }} className="mt-3 text-xs text-amber-500 hover:underline font-semibold">Limpiar filtros</button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
      {/* MODAL DETALLADO */}
      {selectedCar && (<CarModal car={selectedCar} onClose={() => setSelectedCar(null)} />)}
    </div>
  );
}