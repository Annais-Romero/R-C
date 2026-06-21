'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { Car } from '../types/car';

export default function AdminPage() {
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();

    // Estado para el formulario de añadir nuevo
    const [formData, setFormData] = useState({
        brand: '', model: '', year: new Date().getFullYear(),
        transmission: 'Manual', fuel: 'Gasolina', capacity: '5 Personas',
        motor: '', price: '', image: '',gallery: [], type: 'citycar'
    });

    // Estados para archivos binarios de la galería
    const [galeriaFiles, setGaleriaFiles] = useState<File[]>([]);
    const [editGaleriaFiles, setEditGaleriaFiles] = useState<File[]>([]);

    // Foto principal seleccionada localmente para añadir (evita subir antes de enviar)
    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [editMainImageFile, setEditMainImageFile] = useState<File | null>(null);

    // Estado para el auto que se está editando en el modal
    const [editingCar, setEditingCar] = useState<Car | null>(null);

    // ─── ESTADOS PARA FILTROS ────────────────────────────────────────
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('todos');
    const [filterTransmission, setFilterTransmission] = useState('todos');
    const [filterFuel, setFilterFuel] = useState('todos');

    // ─── ESTADOS PARA PAGINACIÓN ─────────────────────────────────────
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        async function checkUser() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
            } else {
                setCheckingAuth(false);
                fetchCars();
            }
        }
        checkUser();
    }, [router]);

    async function fetchCars() {
        setLoading(true);
        const { data, error } = await supabase
            .from('cars')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            alert('Error cargando vehículos: ' + error.message);
        } else {
            setCars(data || []);
        }
        setLoading(false);
    }

    const handleLogout = async () => {
        if (confirm('¿Seguro que deseas cerrar sesión en el panel?')) {
            await supabase.auth.signOut();
            router.push('/login');
        }
    };

    // Helper síncrono para renderizar las previews de las imágenes del Storage
    const obtenerUrlVisible = (ruta: string): string => {
        if (ruta.startsWith('http://') || ruta.startsWith('https://')) return ruta;
        const { data } = supabase.storage.from('car-images').getPublicUrl(ruta);
        return data.publicUrl;
    };

    // Manejadores de cambios de inputs de archivos de galería
    const handleGaleriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setGaleriaFiles(Array.from(e.target.files));
    };

    const handleEditGaleriaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setEditGaleriaFiles(Array.from(e.target.files));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (editingCar) {
            setEditingCar({ ...editingCar, [e.target.name]: e.target.value });
        }
    };

    // Remover fotos de la galería localmente del estado de edición antes de guardar
    const handleRemoveExistingEditGalleryImg = (rutaAEliminar: string) => {
        if (editingCar) {
            const nuevaGaleria = (editingCar.gallery || []).filter(r => r !== rutaAEliminar);
            setEditingCar({ ...editingCar, gallery: nuevaGaleria });
        }
    };

    // ─── AGREGAR NUEVO VEHÍCULO ──────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mainImageFile) {
            alert('Por favor, selecciona una foto principal para el vehículo.');
            return;
        }

        try {
            setUploading(true);

            // 1. Subir la imagen de portada principal
            const mainExt = mainImageFile.name.split('.').pop();
            const mainFileName = `main/${Date.now()}_${Math.random().toString(36).substring(7)}.${mainExt}`;
            const { error: mainUploadError } = await supabase.storage
                .from('car-images')
                .upload(mainFileName, mainImageFile);

            if (mainUploadError) throw mainUploadError;

            // 2. Subir las imágenes secundarias de la galería
            const uploadedGalleryPaths: string[] = [];
            for (const file of galeriaFiles) {
                const ext = file.name.split('.').pop();
                const fileName = `gallery/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                const { error: galleryUploadError } = await supabase.storage
                    .from('car-images')
                    .upload(fileName, file);

                if (galleryUploadError) throw galleryUploadError;
                uploadedGalleryPaths.push(fileName);
            }

            // 3. Guardar todo el registro unificado en la base de datos
            const { error } = await supabase
                .from('cars')
                .insert([{
                    ...formData,
                    price: Number(formData.price),
                    year: Number(formData.year),
                    image: mainFileName,
                    gallery: uploadedGalleryPaths
                }]);

            if (error) throw error;

            alert('¡Vehículo añadido con éxito!');
            
            // Resetear estados de formulario
            setFormData({
                brand: '', model: '', year: new Date().getFullYear(),
                transmission: 'Manual', fuel: 'Gasolina', capacity: '5 Personas',
                motor: '', price: '', image: '', gallery: [], type: 'citycar'
            });
            setMainImageFile(null);
            setGaleriaFiles([]);
            
            const fileInputMain = document.getElementById('car-image-input') as HTMLInputElement;
            const fileInputGal = document.getElementById('car-gallery-input') as HTMLInputElement;
            if (fileInputMain) fileInputMain.value = '';
            if (fileInputGal) fileInputGal.value = '';
            
            fetchCars();
        } catch (error: any) {
            alert('Error al guardar vehículo: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    // ─── ACTUALIZAR VEHÍCULO EXISTENTE ────────────────────────────────
    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingCar) return;

        try {
            setUploading(true);
            let finalMainImagePath = editingCar.image;

            // 1. Validar si se seleccionó una nueva foto principal para cambiarla
            if (editMainImageFile) {
                const mainExt = editMainImageFile.name.split('.').pop();
                const mainFileName = `main/${Date.now()}_${Math.random().toString(36).substring(7)}.${mainExt}`;
                const { error: mainUploadError } = await supabase.storage
                    .from('car-images')
                    .upload(mainFileName, editMainImageFile);

                if (mainUploadError) throw mainUploadError;
                finalMainImagePath = mainFileName;
            }

            // 2. Subir las NUEVAS fotos añadidas a la galería de edición
            const nuevasRutasGaleria: string[] = [];
            for (const file of editGaleriaFiles) {
                const ext = file.name.split('.').pop();
                const fileName = `gallery/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                const { error: galleryUploadError } = await supabase.storage
                    .from('car-images')
                    .upload(fileName, file);

                if (galleryUploadError) throw galleryUploadError;
                nuevasRutasGaleria.push(fileName);
            }

            // 3. Fusionar las fotos de la galería que se mantuvieron con las nuevas
            const galeriaFinal = [...(editingCar.gallery || []), ...nuevasRutasGaleria];

            const { error } = await supabase
                .from('cars')
                .update({
                    brand: editingCar.brand,
                    model: editingCar.model,
                    year: Number(editingCar.year),
                    price: Number(editingCar.price),
                    transmission: editingCar.transmission,
                    motor: editingCar.motor,
                    type: editingCar.type,
                    fuel: editingCar.fuel,
                    capacity: editingCar.capacity,
                    image: finalMainImagePath,
                    gallery: galeriaFinal
                })
                .eq('id', editingCar.id);

            if (error) throw error;

            alert('¡Vehículo actualizado con éxito!');
            setEditingCar(null);
            setEditMainImageFile(null);
            setEditGaleriaFiles([]);
            fetchCars();
        } catch (error: any) {
            alert('Error al actualizar: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (confirm('¿Seguro que deseas eliminar este vehículo de la flota?')) {
            const { error } = await supabase.from('cars').delete().eq('id', id);
            if (error) alert('Error al eliminar: ' + error.message);
            else fetchCars();
        }
    };

    // ─── LÓGICA DE FILTRADO DINÁMICO ────────────────────────────────────────
    const filteredCars = cars.filter((car) => {
        const matchesSearch =
            car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
            car.model.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'todos' || car.type === filterType;
        const matchesTrans = filterTransmission === 'todos' || car.transmission === filterTransmission;
        const matchesFuel = filterFuel === 'todos' || car.fuel === filterFuel;

        return matchesSearch && matchesType && matchesTrans && matchesFuel;
    });

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterType, filterTransmission, filterFuel]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCars = filteredCars.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCars.length / itemsPerPage);

    if (checkingAuth) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-400 flex items-center justify-center text-sm">
                Verificando credenciales de seguridad...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 sm:p-10 relative">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* Encabezado */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center border-b border-zinc-800 pb-5">
                    <div className="flex items-center gap-4">
                        <img
                            src="/logo-rc.png"
                            alt="Logo RentCar"
                            className="h-12 w-auto object-contain"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = document.getElementById('logo-fallback');
                                if (fallback) fallback.style.display = 'flex';
                            }}
                        />
                        <div id="logo-fallback" style={{ display: 'none' }} className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center font-black text-zinc-950 text-xl shadow-lg shadow-amber-500/10">
                            R
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                                R&C <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">Admin</span>
                            </h1>
                            <p className="text-xs text-zinc-400 mt-0.5">Gestión interna de flota y catálogo comercial</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <a href="/" className="text-xs bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 px-4 py-2 rounded-xl transition-colors font-medium">
                            Ver Sitio Web →
                        </a>
                        <button onClick={handleLogout} className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2 rounded-xl transition-colors font-bold">
                            Cerrar Sesión
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Formulario de Adición */}
                    <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-fit space-y-4">
                        <h2 className="text-xl font-bold text-white mb-2">Añadir Vehículo</h2>
                        <form onSubmit={handleSubmit} className="space-y-3.5 text-sm">
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Marca</label>
                                <input required type="text" name="brand" value={formData.brand} onChange={handleChange} placeholder="Ej: Suzuki" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Modelo</label>
                                <input required type="text" name="model" value={formData.model} onChange={handleChange} placeholder="Ej: Swift" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Año</label>
                                    <input required type="number" name="year" value={formData.year} onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Precio x Día ($)</label>
                                    <input required type="number" name="price" value={formData.price} onChange={handleChange} placeholder="28000" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Caja</label>
                                    <select name="transmission" value={formData.transmission} onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500">
                                        <option>Manual</option>
                                        <option>Automático</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Motor</label>
                                    <input required type="text" name="motor" value={formData.motor} onChange={handleChange} placeholder="Ej: 1.2 L" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Capacidad</label>
                                <select name="capacity" value={formData.capacity} onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" required>
                                    <option value="2 Personas">2 Personas</option>
                                    <option value="4 Personas">4 Personas</option>
                                    <option value="5 Personas">5 Personas</option>
                                    <option value="7 Personas">7 Personas</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Tipo de Vehículo</label>
                                <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500">
                                    <option value="citycar">Citycar / Hatchback</option>
                                    <option value="sedan">Sedán</option>
                                    <option value="suv">SUV / Todoterreno</option>
                                    <option value="camioneta">Camioneta / Pick-up</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Combustible</label>
                                <select name="fuel" value={formData.fuel} onChange={handleChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500">
                                    <option value="Gasolina">Bencina (Gasolina)</option>
                                    <option value="Diesel">Diésel (Petróleo)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Foto Principal del Vehículo</label>
                                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
                                    <input id="car-image-input" required type="file" accept="image/*" onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) setMainImageFile(e.target.files[0]);
                                    }} className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 file:cursor-pointer w-full" />
                                    {mainImageFile && <p className="text-[11px] text-amber-500 mt-1">✓ Cargada localmente</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Fotos de la Galería (Opcionales)</label>
                                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
                                    <input id="car-gallery-input" type="file" multiple accept="image/*" onChange={handleGaleriaChange} className="text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 file:cursor-pointer w-full" />
                                    {galeriaFiles.length > 0 && (
                                        <p className="text-xs text-emerald-400 mt-1">✓ {galeriaFiles.length} imágenes secundarias seleccionadas</p>
                                    )}
                                </div>
                            </div>
                            <button type="submit" disabled={uploading} className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold py-2.5 rounded-xl transition-colors mt-2">
                                {uploading ? 'Guardando e Imágenes...' : 'Guardar en Base de Datos'}
                            </button>
                        </form>
                    </div>

                    {/* Lista de Vehículos */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex flex-col gap-3">
                            <h2 className="text-xl font-bold text-white">Flota en Base de Datos ({filteredCars.length})</h2>
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
                                <input
                                    type="text"
                                    placeholder="🔍 Buscar por marca o modelo..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                                />
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-zinc-300 focus:outline-none">
                                        <option value="todos">Todos los Tipos</option>
                                        <option value="citycar">Citycar</option>
                                        <option value="sedan">Sedán</option>
                                        <option value="suv">SUV</option>
                                        <option value="camioneta">Camioneta</option>
                                    </select>
                                    <select value={filterTransmission} onChange={(e) => setFilterTransmission(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-zinc-300 focus:outline-none">
                                        <option value="todos">Transmisión</option>
                                        <option value="Manual">Manual</option>
                                        <option value="Automático">Automático</option>
                                    </select>
                                    <select value={filterFuel} onChange={(e) => setFilterFuel(e.target.value)} className="bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 text-zinc-300 focus:outline-none">
                                        <option value="todos">Combustible</option>
                                        <option value="Gasolina">Bencina</option>
                                        <option value="Diesel">Diésel</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <p className="text-zinc-500 text-sm">Conectando con Supabase...</p>
                        ) : currentCars.length === 0 ? (
                            <p className="text-zinc-500 text-xs bg-zinc-900/40 p-4 rounded-xl border border-dashed border-zinc-800 text-center">
                                No se encontraron vehículos con los filtros activos.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {currentCars.map((car: any) => (
                                        <div key={car.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex gap-4 items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <img src={obtenerUrlVisible(car.image)} alt={car.brand} className="w-16 h-12 object-cover rounded-lg bg-zinc-950" />
                                                <div>
                                                    <h3 className="font-bold text-white text-sm">{car.brand} {car.model}</h3>
                                                    <p className="text-xs text-zinc-400">{car.year} • {car.transmission} • {car.fuel} • ${car.price?.toLocaleString('es-CL')}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setEditingCar(car)} className="text-xs text-amber-400 hover:bg-amber-950/30 px-2 py-1 rounded-lg transition-colors">
                                                    Editar
                                                </button>
                                                <button onClick={() => handleDelete(car.id)} className="text-xs text-red-400 hover:bg-red-950/30 px-2 py-1 rounded-lg transition-colors">
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-2 pt-4">
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 text-white transition-colors"
                                        >
                                            ◀ Anterior
                                        </button>
                                        <span className="text-xs text-zinc-400 font-medium px-2">
                                            Página {currentPage} de {totalPages}
                                        </span>
                                        <button
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-800 text-white transition-colors"
                                        >
                                            Siguiente ▶
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de edición */}
            {editingCar && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
                            <h3 className="text-lg font-black text-white">Editar {editingCar.brand} {editingCar.model}</h3>
                            <button onClick={() => { setEditingCar(null); setEditMainImageFile(null); setEditGaleriaFiles([]); }} className="text-zinc-400 hover:text-white text-sm font-bold">✕</button>
                        </div>
                        <form onSubmit={handleUpdateSubmit} className="space-y-3.5 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Marca</label>
                                    <input required type="text" name="brand" value={editingCar.brand} onChange={handleEditChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Modelo</label>
                                    <input required type="text" name="model" value={editingCar.model} onChange={handleEditChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Año</label>
                                    <input required type="number" name="year" value={editingCar.year} onChange={handleEditChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Precio x Día ($)</label>
                                    <input required type="number" name="price" value={editingCar.price} onChange={handleEditChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Caja</label>
                                    <select name="transmission" value={editingCar.transmission} onChange={handleEditChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500">
                                        <option>Manual</option>
                                        <option>Automático</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1">Motor</label>
                                    <input required type="text" name="motor" value={editingCar.motor} onChange={handleEditChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Capacidad</label>
                                <select name="capacity" value={editingCar.capacity || '5 Personas'} onChange={handleEditChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500" required>
                                    <option value="2 Personas">2 Personas</option>
                                    <option value="4 Personas">4 Personas</option>
                                    <option value="5 Personas">5 Personas</option>
                                    <option value="7 Personas">7 Personas</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Tipo de Vehículo</label>
                                <select name="type" value={editingCar.type} onChange={handleEditChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500">
                                    <option value="citycar">Citycar / Hatchback</option>
                                    <option value="sedan">Sedán</option>
                                    <option value="suv">SUV / Todoterreno</option>
                                    <option value="camioneta">Camioneta / Pick-up</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-zinc-400 mb-1">Combustible</label>
                                <select name="fuel" value={editingCar.fuel} onChange={handleEditChange} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500">
                                    <option value="Gasolina">Bencina (Gasolina)</option>
                                    <option value="Diesel">Diésel (Petróleo)</option>
                                </select>
                            </div>

                            {/* Gestión de Fotos en la Edición */}
                            <div className="border-t border-zinc-800 pt-3 space-y-3">
                                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">Imágenes del Vehículo</h4>
                                
                                {/* Foto de portada actual */}
                                <div>
                                    <label className="block text-[11px] text-zinc-400 mb-1">Foto Principal Actual</label>
                                    <div className="flex items-center gap-3 bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                                        <img src={obtenerUrlVisible(editingCar.image)} className="w-14 h-10 object-cover rounded bg-zinc-900" alt="Portada" />
                                        <input type="file" accept="image/*" onChange={(e) => {
                                            if (e.target.files && e.target.files[0]) setEditMainImageFile(e.target.files[0]);
                                        }} className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-zinc-800 file:text-zinc-300 w-full" />
                                    </div>
                                    {editMainImageFile && <p className="text-[10px] text-amber-500 mt-1">✓ Reemplazo cargado listo para guardar</p>}
                                </div>

                                {/* Galería actual guardada */}
                                <div>
                                    <label className="block text-[11px] text-zinc-400 mb-1">Galería Almacenada (Presiona ✕ para remover)</label>
                                    {editingCar.gallery && editingCar.gallery.length > 0 ? (
                                        <div className="flex gap-2 flex-wrap bg-zinc-950 p-2 rounded-xl border border-zinc-800">
                                            {editingCar.gallery.map((imgRuta, idx) => (
                                                <div key={idx} className="relative w-14 h-11 bg-zinc-900 rounded overflow-hidden group border border-zinc-800">
                                                    <img src={obtenerUrlVisible(imgRuta)} className="w-full h-full object-cover" alt="Miniatura" />
                                                    <button type="button" onClick={() => handleRemoveExistingEditGalleryImg(imgRuta)} className="absolute top-0 right-0 bg-red-600 hover:bg-red-500 text-white font-black text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-bl shadow">
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-[11px] text-zinc-500 italic">Este auto no posee imágenes secundarias aún.</p>
                                    )}
                                </div>

                                {/* Añadir más imágenes secundarias */}
                                <div>
                                    <label className="block text-[11px] text-zinc-400 mb-1">Añadir Nuevas Fotos a Galería</label>
                                    <input type="file" multiple accept="image/*" onChange={handleEditGaleriaChange} className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 w-full" />
                                    {editGaleriaFiles.length > 0 && (
                                        <p className="text-xs text-emerald-400 mt-1">✓ +{editGaleriaFiles.length} nuevas fotos listas para integrarse</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => { setEditingCar(null); setEditMainImageFile(null); setEditGaleriaFiles([]); }} className="w-1/3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-2 rounded-xl transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={uploading} className="w-2/3 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold py-2 rounded-xl transition-colors">
                                    {uploading ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}