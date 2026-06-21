"use client"; // Obligatorio para componentes interactivos táctiles en Next.js

import { Car } from '../types/car';
import { supabase } from '../lib/supabase';

// Importamos Swiper y sus componentes de React
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// Importamos los estilos base obligatorios de Swiper
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface CarModalProps {
  car: Car;
  onClose: () => void;
}

export default function CarModal({ car, onClose }: CarModalProps) {
  const displayPrice = car.price ?? car.price;
  const displayEngine = car.motor ?? (car as any).motor;

  // Función para resolver las URLs de las imágenes de Supabase
  const obtenerUrlVisible = (ruta: string): string => {
    if (!ruta) return '';
    if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;
    const { data } = supabase.storage.from('car-images').getPublicUrl(ruta);
    return data.publicUrl;
  };

  // Construcción del array de imágenes de la galería
  const images: string[] = [];
  if (car.image) {
    images.push(obtenerUrlVisible(car.image));
  }
  
  const rawGallery = car.gallery ?? (car as any).gallery;
  if (rawGallery && Array.isArray(rawGallery)) {
    rawGallery.filter(Boolean).forEach((imgRuta: string) => {
      images.push(obtenerUrlVisible(imgRuta));
    });
  }


  const phoneNumber = "56948425222"; 
  const message = `Hola! Quiero consultar disponibilidad para el vehículo: ${car.brand} ${car.model}`;
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      
      {/* 🌟 BLOQUE DE ESTILOS INYECTADOS: Esto obliga al Shadow DOM de Swiper a tomar el color amarillo corporativo */}
      <style>{`
        .custom-swiper-container {
          --swiper-navigation-color: #fbbf24 !important;
          --swiper-pagination-color: #fbbf24 !important;
        }
        .custom-swiper-container .swiper-button-next,
        .custom-swiper-container .swiper-button-prev {
          background-color: rgba(0, 0, 0, 0.45) !important;
          width: 36px !important;
          height: 36px !important;
          border-radius: 50% !important;
          transition: background-color 0.2s ease;
        }
        .custom-swiper-container .swiper-button-next:hover,
        .custom-swiper-container .swiper-button-prev:hover {
          background-color: rgba(0, 0, 0, 0.75) !important;
        }
        .custom-swiper-container .swiper-button-next::after,
        .custom-swiper-container .swiper-button-prev::after {
          font-size: 14px !important;
          font-weight: bold !important;
        }
      `}</style>

      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl p-6 text-zinc-100">
        
        {/* Botón Cerrar */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 p-1.5 rounded-full transition-colors shadow-md"
        >
          ✕
        </button>

        {/* CONTENEDOR DEL CAROUSEL TÁCTIL (Con clase personalizada para los estilos de arriba) */}
        <div className="relative h-56 w-full bg-zinc-950 rounded-xl overflow-hidden mb-5 custom-swiper-container">
          {images.length > 0 ? (
            <Swiper
              modules={[Navigation, Pagination]}
              spaceBetween={0}
              slidesPerView={1}
              navigation={images.length > 1}
              pagination={images.length > 1 ? { clickable: true } : false}
              grabCursor={true}
              className="w-full h-full"
              // Forzado extra mediante CSS Custom Properties directo en la etiqueta de React
              style={{
                type: "text/css",
                "--swiper-navigation-color": "#fbbf24",
                "--swiper-pagination-color": "#fbbf24",
              } as React.CSSProperties}
            >
              {images.map((imgUrl, idx) => (
                <SwiperSlide key={idx} className="w-full h-full">
                  <img 
                    src={imgUrl} 
                    alt={`${car.brand} - vista ${idx + 1}`} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
              Sin imágenes disponibles
            </div>
          )}
        </div>

        {/* Título del Vehículo */}
        <h2 className="text-2xl font-black text-white tracking-tight mb-4 text-center">
          {car.brand} {car.model}
        </h2>

        {/* Tabla de Especificaciones Técnicas */}
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

        {/* Sección de Precio y Botón de WhatsApp */}
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