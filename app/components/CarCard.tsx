import { Car } from '../types/car';
import { supabase } from '../lib/supabase';

interface CarCardProps {
  car: Car;
  onSelect: (car: Car) => void;
}

export default function CarCard({ car, onSelect }: CarCardProps) {
  // Normalización segura para mapear variables de la Base de Datos
  const displayPrice = car.price ?? car.price;

  // En la base de datos, la foto puede estar almacenada como ruta de Storage.
  // Convertirla en URL pública, igual que en CarModal.tsx.
  const imageUrl = car.image?.startsWith('http://') || car.image?.startsWith('https://')
    ? car.image
    : car.image
      ? supabase.storage.from('car-images').getPublicUrl(car.image).data.publicUrl
      : '';

  const phoneNumber = "56912345678"; 
  const message = `Hola! Estoy interesado en arrendar el vehículo: ${car.brand} ${car.model}`;
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div 
      onClick={() => onSelect(car)}
      className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl p-5 min-w-[290px] md:min-w-[310px] max-w-[310px] snap-center transition-all duration-300 hover:-translate-y-2 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 cursor-pointer flex flex-col justify-between"
    >
      {/* Contenedor de la Imagen */}
      <div className="h-40 w-full relative bg-zinc-950 rounded-xl overflow-hidden mb-4">
        <img 
          src={imageUrl} 
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        />
      </div>

      {/* Detalles */}
      <div className="flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-base font-bold text-white tracking-tight">{car.brand} {car.model}</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-700/60 text-amber-400 px-2 py-0.5 rounded border border-zinc-600/40">
              {(car as any).type ?? (car as any).category ?? '—'}
            </span>
          </div>
          <p className="text-xs text-zinc-400 mb-4">Año {car.year} • {car.transmission}</p>
        </div>

        {/* Precio y Botón */}
        <div className="pt-3 border-t border-zinc-700/50 flex items-center justify-between gap-2">
          <div>
            <span className="text-lg font-extrabold text-white">
              {displayPrice ? `$${Number(displayPrice).toLocaleString('es-CL')}` : 'Consulte'}
            </span>
            <span className="text-[10px] text-zinc-400 block -mt-0.5">por día</span>
          </div>
          
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 px-3.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
          >
            Arrendar
          </a>
        </div>
      </div>
    </div>
  );
}
