import { useState } from 'react';
import { Car } from '../types/car';
import { supabase } from '../lib/supabase'; // Asegúrate de que esta ruta apunte a tu cliente de Supabase

interface CarModalProps {
  car: Car;
  onClose: () => void;
}

export default function CarModal({ car, onClose }: CarModalProps) {
  // Normalización segura para mapear variables de la Base de Datos
  const displayPrice = car.price ?? car.price;
  const displayEngine = car.motor ?? (car as any).motor;

  // Helper interno para resolver las rutas del Storage de Supabase en URLs públicas visibles
  const obtenerUrlVisible = (ruta: string): string => {
    if (!ruta) return '';
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;
    const { data } = supabase.storage.from('car-images').getPublicUrl(ruta);
    return data.publicUrl;
  };

  // Unificar la imagen principal con el array de la galería transformándolas en URLs válidas
  const images: string[] = [];
  
  if (car.image) {
    images.push(obtenerUrlVisible(car.image));
  }
  
  // Forzamos lectura segura por si hay inconsistencias con los tipos de la propiedad gallery
  const rawGallery = car.gallery ?? (car as any).gallery;
  if (rawGallery && Array.isArray(rawGallery)) {
    rawGallery.filter(Boolean).forEach((imgRuta: string) => {
      images.push(obtenerUrlVisible(imgRuta));
    });
  }

  // Estado para controlar qué imagen se está visualizando
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const phoneNumber = "56912345678"; 
  const message = `Hola! Quiero consultar disponibilidad para el vehículo: ${car.brand} ${car.model}`;
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl p-6 text-zinc-100">
        
        {/* Botón Cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-full transition-colors"
        >
          ✕
        </button>

        {/* CONTENEDOR DEL SLIDER DE IMÁGENES */}
        <div className="relative h-48 w-full bg-zinc-950 rounded-xl overflow-hidden mb-5 group">
          {images.length > 0 ? (
            <>
              <img 
                src={images[currentIndex]} 
                alt={`${car.brand} - vista ${currentIndex + 1}`} 
                className="w-full h-full object-cover transition-all duration-300"
              />
              
              {/* Controles de navegación (solo se muestran si hay más de 1 imagen) */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1 rounded-full text-xs transition-all opacity-0 group-hover:opacity-100"
                  >
                    ❮
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-1 rounded-full text-xs transition-all opacity-0 group-hover:opacity-100"
                  >
                    ❯
                  </button>

                  {/* Indicador de posición (Puntitos abajo) */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/40 px-2 py-1 rounded-full">
                    {images.map((_, idx) => (
                      <span
                        key={idx}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          idx === currentIndex ? 'bg-amber-400 scale-110' : 'bg-zinc-500'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
              Sin imágenes disponibles
            </div>
          )}
        </div>

        {/* Título */}
        <h2 className="text-2xl font-black text-white tracking-tight mb-4 text-center">
          {car.brand} {car.model}
        </h2>

        {/* CONTENEDOR DE ESPECIFICACIONES */}
        <div className="bg-zinc-800/50 border border-zinc-800 rounded-xl p-4 mb-6 space-y-2.5 text-sm">
          <div className="flex justify-between border-b border-zinc-700/30 pb-1.5">
            <span className="text-zinc-400">Marca:</span>
            <span className="font-semibold text-zinc-200">{car.brand}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-700/30 pb-1.5">
            <span className="text-zinc-400">Año:</span>
            <span className="font-semibold text-zinc-200">{car.year}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-700/30 pb-1.5">
            <span className="text-zinc-400">Capacidad:</span>
            <span className="font-semibold text-zinc-200">{car.capacity || '5'}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-700/30 pb-1.5">
            <span className="text-zinc-400">Tipo de Caja:</span>
            <span className="font-semibold text-zinc-200">{car.transmission}</span>
          </div>
          <div className="flex justify-between border-b border-zinc-700/30 pb-1.5">
            <span className="text-zinc-400">Combustible:</span>
            <span className="font-semibold text-zinc-200">{car.fuel || 'Gasolina'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Motor / Cilindrada:</span>
            <span className="font-semibold text-zinc-200">{displayEngine || 'N/A'}</span>
          </div>
        </div>

        {/* Sección de Precio Ambar y Acción de WhatsApp */}
        <div className="text-center space-y-4">
          <div>
            <span className="text-3xl font-black text-amber-400">
              {displayPrice ? `$${Number(displayPrice).toLocaleString('es-CL')}` : 'Consulte'}
            </span>
            <span className="text-xs text-zinc-400 ml-1">por día</span>
          </div>

          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/30 text-sm"
          >
            Consultar disponibilidad
          </a>
        </div>
      </div>
    </div>
  );
}