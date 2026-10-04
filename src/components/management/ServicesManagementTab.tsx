import React, { useState } from 'react';
import { Service, ServiceCategory } from '../../types';
import { formatCOP } from '../../utils/format';
import { compressImageFile } from '../../utils/imageCompressor';

interface ServicesManagementTabProps {
  services: Service[];
  categories: ServiceCategory[];
  onOpenCreateModal: () => void;
  onEditService: (service: Service) => void;
  onDeleteService: (service: Service) => void;
  onUpdateService?: (service: Service) => void;
}

export const ServicesManagementTab: React.FC<ServicesManagementTabProps> = ({
  services,
  categories,
  onOpenCreateModal,
  onEditService,
  onDeleteService,
  onUpdateService
}) => {
  const [selectedCat, setSelectedCat] = useState<string>('todos');
  const [search, setSearch] = useState<string>('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const handleUploadPhoto = async (service: Service, file?: File) => {
    if (!file || !onUpdateService) return;
    try {
      setUploadingId(service.id);
      const compressed = await compressImageFile(file, 800, 800);
      onUpdateService({ ...service, image: compressed });
    } catch (err) {
      console.warn('Error cambiando foto de servicio:', err);
    } finally {
      setUploadingId(null);
    }
  };

  const filteredServices = services.filter((s) => {
    const matchCat = selectedCat === 'todos' || s.category === selectedCat;
    const matchQuery =
      search.trim() === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQuery;
  });

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#C6BDAC]/70 shadow-2xs">
        <div>
          <h3 className="font-bold text-base text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
            Carta de Servicios del Santuario ({services.length})
          </h3>
          <p className="text-xs text-[#5A4A43]">
            Agrega, modifica precios, tiempos y descripciones de los tratamientos ofrecidos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o detalle..."
            className="h-9 px-3 rounded-xl bg-[#F4EFE9] border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none w-full sm:w-48"
          />

          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="h-9 px-2 rounded-xl bg-[#F4EFE9] border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none"
          >
            <option value="todos">Todas las Categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <button
            onClick={onOpenCreateModal}
            className="px-4 py-2 rounded-full bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">add_circle</span>
            <span>+ Nuevo Servicio</span>
          </button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map((service) => (
          <div
            key={service.id}
            className="bg-white rounded-2xl p-4 border border-[#C6BDAC]/70 shadow-2xs flex flex-col justify-between space-y-3 hover:border-[#BB9C87]/40 transition-all overflow-hidden"
          >
            <div>
              <div className="relative h-32 rounded-xl overflow-hidden mb-3 bg-[#F4EFE9]">
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-[#2B2420] text-[10px] font-bold shadow-2xs">
                  {service.categoryLabel}
                </span>
                {service.tag && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#BB9C87] text-[#2B2420] font-bold text-[10px] font-bold shadow-2xs">
                    {service.tag}
                  </span>
                )}

                {/* Subir foto local */}
                {onUpdateService && (
                  <label className="absolute bottom-2 right-2 px-2.5 py-1 rounded-xl bg-black/75 hover:bg-black text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur-xs cursor-pointer shadow-md transition-all select-none">
                    <span className="material-symbols-outlined text-[13px]">
                      {uploadingId === service.id ? 'sync' : 'photo_camera'}
                    </span>
                    <span>{uploadingId === service.id ? 'Cargando...' : 'Cambiar foto'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingId === service.id}
                      className="hidden"
                      onChange={(e) => handleUploadPhoto(service, e.target.files?.[0])}
                    />
                  </label>
                )}
              </div>

              <div>
                <h4 className="font-bold text-sm text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif] line-clamp-1">
                  {service.name}
                </h4>
                <p className="text-xs text-[#5A4A43] line-clamp-2 mt-1 leading-relaxed">
                  {service.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#C6BDAC] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#5A4A43] block">Precio Cliente:</span>
                  <span className="font-bold text-sm text-[#2B2420]">
                    {formatCOP(service.price)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#5A4A43] block">Duración:</span>
                  <span className="font-semibold text-xs text-[#2B2420]">
                    {service.durationMinutes} min
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-[#C6BDAC] flex items-center justify-end gap-1.5">
              <button
                onClick={() => onEditService(service)}
                className="p-1.5 rounded-lg bg-white hover:bg-[#C6BDAC]/40 text-[#2B2420] border border-[#C6BDAC] transition-colors cursor-pointer flex items-center gap-1"
                title="Modificar Servicio"
              >
                <span className="material-symbols-outlined text-[15px]">edit</span>
                <span className="text-[11px] font-semibold pr-0.5">Editar</span>
              </button>

              <button
                onClick={() => onDeleteService(service)}
                className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-[#ba1a1a] border border-rose-200 transition-colors cursor-pointer flex items-center gap-1"
                title="Eliminar Servicio"
              >
                <span className="material-symbols-outlined text-[15px]">delete</span>
                <span className="text-[11px] font-semibold pr-0.5">Eliminar</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
