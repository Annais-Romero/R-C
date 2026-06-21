// components/Footer.jsx
const Footer = () => {
    return (
        // CAMBIO: Se eliminó 'mt-20' para quitar la separación gris y se puede subir 'py-8' a 'py-12' si quieres que el footer sea más alto por dentro
        <footer className="bg-zinc-950 border-t border-zinc-800/60 py-12 w-full">
            <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                <p className="text-xs text-zinc-500 order-2 sm:order-1 text-center sm:text-left">
                    © 2026 <span className="text-amber-500 font-medium">R&C Rent A Car</span>. Libertad para recorrer. Arica, Chile.
                </p>

                <div className="flex items-center gap-3 order-1 sm:order-2 opacity-85 hover:opacity-100 transition-opacity duration-200">
                    <span className="text-[10px] text-zinc-500 tracking-widest uppercase font-semibold">
                        Diseñado & Desarrollado por
                    </span>
                    <a href="https://github.com/Annais-Romero" target="_blank" rel="noopener noreferrer">
                        <img src="/logo_develop.png" alt="Logo" className="h-10 w-auto" />
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;