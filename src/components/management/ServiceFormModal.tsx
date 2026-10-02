import React, { useState, useEffect } from 'react';
import { Service, ServiceCategory } from '../../types';
import { validateOnlyPlainText, sanitizeToPlainText } from '../../utils/security';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceToEdit?: Service | null;
  categories: ServiceCategory[];
  onSave: (service: Service) => void;
}

export const ServiceFormModal: React.FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  serviceToEdit,
  categories,
  onSave
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0]?.id || 'manicura');
  const [price, setPrice] = useState<number>(95000);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [tag, setTag] = useState('Top Ventas');
  const [tagType, setTagType] = useState<'top' | 'relax' | 'trend' | 'care'>('top');
  const [description, setDescription] = useState('');
  const [recommendedFor, setRecommendedFor] = useState('');
  const [image, setImage] = useState('');
  const [stepsText, setStepsText] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (serviceToEdit) {
      setName(serviceToEdit.name);
      setCategory(serviceToEdit.category);
      setPrice(serviceToEdit.price);
      setDurationMinutes(serviceToEdit.durationMinutes);
      setTag(serviceToEdit.tag || 'Top Ventas');
      setTagType(serviceToEdit.tagType || 'top');
      setDescription(serviceToEdit.description || '');
      setRecommendedFor(serviceToEdit.recommendedFor || '');
      setImage(serviceToEdit.image || '');
      setStepsText((serviceToEdit.steps || []).join('\n'));
      setFormError(null);
    } else {
      setName('');
      setCategory(categories[0]?.id || 'manicura');
      setPrice(95000);
      setDurationMinutes(60);
      setTag('Top Ventas');
      setTagType('top');
      setDescription('');
      setRecommendedFor('');
      setImage('https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800');
      setStepsText('Limpieza profunda con torno\nNivelación de estructura ungueal\nAplicación de esmalte y brillo sellador\nHidratación de cutículas');
      setFormError(null);
    }
  }, [serviceToEdit, categories, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const nameVal = validateOnlyPlainText(name, 'Nombre del Servicio', 100);
    if (!nameVal.isValid) {
      setFormError(nameVal.reason || 'Nombre de servicio inválido.');
      return;
    }

    if (price < 0) {
      setFormError('El precio debe ser un número positivo.');
      return;
    }

    if (durationMinutes <= 0) {
      setFormError('La duración debe ser mayor a 0 minutos.');
      return;
    }

    const cleanName = sanitizeToPlainText(name);
    const selectedCategoryObj = categories.find((c) => c.id === category);
    const categoryLabel = selectedCategoryObj ? selectedCategoryObj.label : 'Servicio Especial';

    const steps = stepsText
      .split('\n')
      .map((s) => sanitizeToPlainText(s))
      .filter((s) => s.length > 0);

    const service: Service = {
      id: serviceToEdit ? serviceToEdit.id : `srv-${Date.now().toString().slice(-6)}`,
      name: cleanName,
      category,
      categoryLabel,
      price: Math.max(0, Math.round(Number(price) || 0)),
      durationMinutes: Math.max(15, Math.round(Number(durationMinutes) || 60)),
      rating: serviceToEdit ? serviceToEdit.rating : 5.0,
      reviewsCount: serviceToEdit ? serviceToEdit.reviewsCount : 0,
      tag: sanitizeToPlainText(tag) || 'Exclusivo',
      tagType,
      description: sanitizeToPlainText(description),
      recommendedFor: sanitizeToPlainText(recommendedFor),
      image: sanitizeToPlainText(image) || 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800',
      steps: steps.length > 0 ? steps : ['Preparación integral', 'Aplicación profesional', 'Acabado y nutrición']
    };

    onSave(service);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-[#F4EFE9] rounded-3xl p-6 shadow-2xl border border-[#C6BDAC] space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#C6BDAC]/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#BB9C87]/10 text-[#2B2420] flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">spa</span>
            </div>
            <h3 className="font-bold text-sm sm:text-base text-[#2B2420] font-['Plus_Jakarta_Sans',sans-serif]">
              {serviceToEdit ? `Editar Servicio: ${serviceToEdit.name}` : 'Crear Nuevo Servicio'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#C6BDAC]/40 flex items-center justify-center text-[#5A4A43] cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {formError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-start gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-rose-600 shrink-0">error</span>
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Nombre del Servicio *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Manicura Rusa Glazed Pearl"
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Tipo / Categoría *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 px-2 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Precio (COP) *</label>
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Duración (min) *</label>
              <input
                type="number"
                min="15"
                step="15"
                required
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Insignia / Tag</label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Ej. Top Ventas, Tendencia"
                className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5A4A43] mb-1">Estilo de Insignia</label>
              <select
                value={tagType}
                onChange={(e) => setTagType(e.target.value as any)}
                className="w-full h-9 px-2 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
              >
                <option value="top">Top (Dorado/Vanguardia)</option>
                <option value="trend">Trend (Tendencia)</option>
                <option value="relax">Relax (Bienestar)</option>
                <option value="care">Care (Cuidado Clínico)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Descripción del Servicio</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalla los beneficios, acabado, esmaltado y sensaciones del servicio..."
              className="w-full p-2.5 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Recomendado para</label>
            <input
              type="text"
              value={recommendedFor}
              onChange={(e) => setRecommendedFor(e.target.value)}
              placeholder="Ej. Novias, eventos especiales o look diario impecable"
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">Pasos del Tratamiento (uno por línea)</label>
            <textarea
              rows={3}
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              placeholder="Paso 1: Exfoliación...&#10;Paso 2: Nivelación..."
              className="w-full p-2.5 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20 font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#5A4A43] mb-1">URL de Imagen</label>
            <input
              type="url"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="w-full h-9 px-3 rounded-xl bg-white border border-[#C6BDAC] text-xs text-[#2B2420] focus:outline-none focus:ring-2 focus:ring-[#2B2420]/20"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#C6BDAC]/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-100 text-[#5A4A43] font-semibold text-xs border border-[#C6BDAC] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#BB9C87] hover:bg-[#AA8A74] text-[#2B2420] font-bold font-bold text-xs shadow-xs transition-all cursor-pointer"
            >
              {serviceToEdit ? 'Guardar Cambios' : 'Crear Servicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
