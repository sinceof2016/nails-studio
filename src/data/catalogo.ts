import {
  Service,
  Specialist,
  NailShape,
  AddOnOption,
  ServiceCategory
} from '../types';

/**
 * Catálogo Oficial de Servicios, Categorías y Especialistas de La Pelu SPA.
 * Tarifas oficiales actualizadas según la lista vigente.
 */

export const INITIAL_SERVICE_CATEGORIES: ServiceCategory[] = [
  { id: 'manicura', label: 'Manicure', icon: 'palette', description: 'Cuidado profesional, esmaltado y embellecimiento de manos' },
  { id: 'pedicura', label: 'Pedicure', icon: 'spa', description: 'Higiene, exfoliación y esmaltado especializado de pies' },
  { id: 'rubber', label: 'Base Rubber', icon: 'health_and_safety', description: 'Nivelación, refuerzo con volumen y esmaltado de alta resistencia' },
  { id: 'extensiones', label: 'Acrílico & Polygel', icon: 'diamond', description: 'Estructuras, pres on, jelly tips y baños de alta duración' },
  { id: 'adicionales', label: 'Retiros & Extras', icon: 'brush', description: 'Retiros seguros, extensiones por uña, arreglos y secado rápido' }
];

export const SERVICES: Service[] = [
  // --- PEDICURE ---
  {
    id: 'pedicure-nina',
    name: 'Pedicure niña',
    category: 'pedicura',
    categoryLabel: 'Pedicure',
    price: 17000,
    durationMinutes: 30,
    rating: 4.9,
    reviewsCount: 38,
    tag: 'Infantil',
    tagType: 'care',
    description: 'Pedicure suave y seguro para niñas, incluye limpieza ligera, corte adecuado y esmaltado colorido.',
    image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&q=80&w=800',
    steps: ['Desinfección suave', 'Corte y limado infantil', 'Hidratación ligera', 'Esmaltado']
  },
  {
    id: 'pedicure-tradicional',
    name: 'Pedicure Tradicional',
    category: 'pedicura',
    categoryLabel: 'Pedicure',
    price: 24000,
    durationMinutes: 45,
    rating: 4.95,
    reviewsCount: 142,
    tag: 'Clásico',
    tagType: 'relax',
    description: 'Limpieza completa de pies, remoción de cutícula, exfoliación suave, limado estético y esmalte tradicional.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
    steps: ['Baño tibio con sales', 'Remoción de cutícula y asperezas', 'Exfoliación e hidratación', 'Esmaltado tradicional']
  },
  {
    id: 'pedicure-semipermanente',
    name: 'Pedicure semipermanente',
    category: 'pedicura',
    categoryLabel: 'Pedicure',
    price: 47000,
    durationMinutes: 60,
    rating: 4.98,
    reviewsCount: 165,
    tag: 'Larga Duración',
    tagType: 'top',
    description: 'Pedicure completo con esmaltado semipermanente de máxima duración, curado en lámpara LED con brillo intacto.',
    image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&q=80&w=800',
    steps: ['Limpieza podal profunda', 'Preparación de la lámina', 'Aplicación de base y color semipermanente', 'Top coat sellador y aceite']
  },
  {
    id: 'limpieza-pies',
    name: 'Limpieza de pies',
    category: 'pedicura',
    categoryLabel: 'Pedicure',
    price: 17000,
    durationMinutes: 30,
    rating: 4.88,
    reviewsCount: 54,
    description: 'Higiene y perfilado podal, arreglo de cutículas y limado anatómico sin esmaltado.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
    steps: ['Higiene y asepsia', 'Arreglo de cutículas', 'Limado y pulido de uñas', 'Crema humectante']
  },
  {
    id: 'cambio-esmalte-pies',
    name: 'Cambio de esmalte pies',
    category: 'pedicura',
    categoryLabel: 'Pedicure',
    price: 18000,
    durationMinutes: 20,
    rating: 4.85,
    reviewsCount: 47,
    description: 'Retiro de esmalte tradicional anterior, pulido suave y aplicación de nuevo tono en uñas de los pies.',
    image: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&q=80&w=800',
    steps: ['Retiro de esmalte previo', 'Limado de borde libre', 'Aplicación de nuevo esmalte y brillo']
  },

  // --- MANICURE ---
  {
    id: 'manicure-nina',
    name: 'Manicure niña',
    category: 'manicura',
    categoryLabel: 'Manicure',
    price: 15000,
    durationMinutes: 30,
    rating: 4.9,
    reviewsCount: 42,
    tag: 'Infantil',
    tagType: 'care',
    description: 'Cuidado delicado de manos para niñas, limado suave, masajito nutritivo y esmaltado divertido.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800',
    steps: ['Limpieza suave', 'Limado cuidadoso', 'Esmaltado infantil', 'Nutrición']
  },
  {
    id: 'manicure-tradicional',
    name: 'Manicure Tradicional',
    category: 'manicura',
    categoryLabel: 'Manicure',
    price: 20000,
    durationMinutes: 45,
    rating: 4.94,
    reviewsCount: 198,
    tag: 'Esencial',
    tagType: 'relax',
    description: 'Manicure clásica con limpieza y perfilado de cutícula, limado a forma elegida, masaje hidratante y esmalte tradicional.',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800',
    steps: ['Desinfección', 'Perfilado y corte', 'Tratamiento de cutículas', 'Esmaltado tradicional y brillo']
  },
  {
    id: 'manicure-semipermanente',
    name: 'Manicure semipermanente',
    category: 'manicura',
    categoryLabel: 'Manicure',
    price: 42000,
    durationMinutes: 60,
    rating: 4.99,
    reviewsCount: 280,
    tag: 'Top Ventas',
    tagType: 'top',
    description: 'Esmaltado semipermanente de máxima durabilidad con secado instantáneo en lámpara LED, brillo espejo y resistencia superior.',
    image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&q=80&w=800',
    steps: ['Preparación de cutícula', 'Nivelación suave', 'Aplicación de base, 2 capas de color semipermanente', 'Top coat ultra brillante y aceite']
  },
  {
    id: 'manicure-hombre-semipermanente',
    name: 'Manicure hombre semipermanente',
    category: 'manicura',
    categoryLabel: 'Manicure',
    price: 37000,
    durationMinutes: 45,
    rating: 4.92,
    reviewsCount: 65,
    tag: 'Caballeros',
    tagType: 'care',
    description: 'Protocolo de manos masculino: limpieza minuciosa de cutículas, limado anatómico y sellador semipermanente mate o natural.',
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800',
    steps: ['Asepsia completa', 'Limpieza profunda de cutículas y padrastros', 'Limado anatómico', 'Sellador protector mate o brillo natural']
  },
  {
    id: 'limpieza-manos',
    name: 'Limpieza de manos',
    category: 'manicura',
    categoryLabel: 'Manicure',
    price: 14000,
    durationMinutes: 25,
    rating: 4.87,
    reviewsCount: 52,
    description: 'Cuidado higiénico de uñas y cutículas de las manos, limado y pulido de brillo natural sin aplicación de esmalte.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
    steps: ['Asepsia', 'Perfilado y pulido', 'Acondicionamiento de cutículas', 'Hidratación']
  },
  {
    id: 'cambio-esmalte-manos',
    name: 'Cambio de esmalte manos',
    category: 'manicura',
    categoryLabel: 'Manicure',
    price: 15000,
    durationMinutes: 20,
    rating: 4.86,
    reviewsCount: 49,
    description: 'Retiro del esmalte tradicional anterior, limado rápido de puntas y aplicación de nuevo color.',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800',
    steps: ['Retiro de esmalte', 'Limado ligero', 'Base y nuevo color tradicional']
  },

  // --- BASE RUBBER ---
  {
    id: 'base-rubber',
    name: 'Base Rubber',
    category: 'rubber',
    categoryLabel: 'Base Rubber',
    price: 25000,
    durationMinutes: 45,
    rating: 4.96,
    reviewsCount: 130,
    tag: 'Nivelación',
    tagType: 'trend',
    description: 'Base flexible y autonivelante de alta viscosidad que da grosor, corrige estrías y aporta resistencia a la uña natural.',
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=800',
    steps: ['Preparación y deshidratación', 'Aplicación de primer', 'Estructuración y nivelación con Base Rubber', 'Curado en lámpara y sellado']
  },
  {
    id: 'mantenimiento-base-rubber',
    name: 'Mantenimiento base de Rubber',
    category: 'rubber',
    categoryLabel: 'Base Rubber',
    price: 18000,
    durationMinutes: 40,
    rating: 4.92,
    reviewsCount: 88,
    description: 'Relleno del crecimiento en zona de cutícula para conservar la estructura y resistencia de la base rubber.',
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=800',
    steps: ['Revisión de adherencia', 'Nivelación del nuevo crecimiento', 'Curado en cabina', 'Sellador final']
  },
  {
    id: 'base-rubber-tradicional',
    name: 'Base Rubber + tradicional',
    category: 'rubber',
    categoryLabel: 'Base Rubber',
    price: 45000,
    durationMinutes: 60,
    rating: 4.95,
    reviewsCount: 97,
    tag: 'Fortalecimiento',
    tagType: 'care',
    description: 'Nivelación estructurada con base rubber fortalecedora y acabado final con esmalte tradicional en tu tono favorito.',
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=800',
    steps: ['Manicura y nivelación con Base Rubber', 'Curado y desengrasado', 'Esmaltado tradicional a elección', 'Brillo sellador']
  },
  {
    id: 'mantenimiento-base-rubber-tradicional',
    name: 'Mantenimiento de Base Rubber + tradicional',
    category: 'rubber',
    categoryLabel: 'Base Rubber',
    price: 38000,
    durationMinutes: 50,
    rating: 4.91,
    reviewsCount: 68,
    description: 'Retoque de crecimiento de base rubber con renovación completa de esmaltado tradicional.',
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=800',
    steps: ['Retiro de esmalte tradicional', 'Relleno de base rubber', 'Curado y nuevo esmaltado tradicional']
  },

  // --- ACRÍLICO, POLYGEL & ESTRUCTURAS ---
  {
    id: 'pres-on-jelly-tips',
    name: 'Pres on / Jelly Tips',
    category: 'extensiones',
    categoryLabel: 'Acrílico & Polygel',
    price: 100000,
    durationMinutes: 90,
    rating: 4.98,
    reviewsCount: 154,
    tag: 'Tendencia',
    tagType: 'trend',
    description: 'Tips de gel de cobertura completa preformados, súper livianos, resistentes y de adherencia perfecta.',
    image: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&q=80&w=800',
    steps: ['Preparación de la uña natural', 'Ajuste de tips jelly a medida', 'Adherencia con base gel constructora', 'Esmaltado y sellado final']
  },
  {
    id: 'mantenimiento-pres-on-semipermanente',
    name: 'Mantenimiento de pres on + semipermanente',
    category: 'extensiones',
    categoryLabel: 'Acrílico & Polygel',
    price: 70000,
    durationMinutes: 75,
    rating: 4.93,
    reviewsCount: 78,
    description: 'Relleno y rebalance de estructura en Jelly Tips con nueva aplicación de esmalte semipermanente.',
    image: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&q=80&w=800',
    steps: ['Limpieza de crecimiento', 'Relleno y nivelación', 'Curado y esmaltado semipermanente']
  },
  {
    id: 'acrilico-2-semipermanente',
    name: 'Acrílico #2 + semipermanente',
    category: 'extensiones',
    categoryLabel: 'Acrílico & Polygel',
    price: 125000,
    durationMinutes: 120,
    rating: 4.99,
    reviewsCount: 215,
    tag: 'Top Estructura',
    tagType: 'top',
    description: 'Extensiones esculpidas en acrílico premium longitud número 2 con acabado en esmalte semipermanente a elección.',
    image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&q=80&w=800',
    steps: ['Colocación de moldes / tips', 'Esculpido en acrílico largo #2', 'Limado y pulido de alta precisión', 'Esmaltado semipermanente y top coat']
  },
  {
    id: 'mantenimiento-acrilico',
    name: 'Mantenimiento de acrílico',
    category: 'extensiones',
    categoryLabel: 'Acrílico & Polygel',
    price: 80000,
    durationMinutes: 90,
    rating: 4.94,
    reviewsCount: 140,
    description: 'Relleno de acrílico en el área de crecimiento, rebalance del ápice y pulido para prolongar tu set.',
    image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&q=80&w=800',
    steps: ['Retiro de color anterior', 'Relleno de acrílico', 'Limado estructural', 'Sellador y esmaltado']
  },
  {
    id: 'polygel-2-semipermanente',
    name: 'Polygel #2 + semipermanente',
    category: 'extensiones',
    categoryLabel: 'Acrílico & Polygel',
    price: 125000,
    durationMinutes: 120,
    rating: 4.98,
    reviewsCount: 160,
    tag: 'Híbrido Premium',
    tagType: 'top',
    description: 'Extensiones esculpidas con polygel longitud #2: combina la fuerza del acrílico con la ligereza y flexibilidad del gel.',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800',
    steps: ['Preparación de la uña', 'Moldeado con polygel longitud #2', 'Polimerización LED', 'Esmaltado semipermanente de larga duración']
  },
  {
    id: 'retoque-polygel',
    name: 'Retoque Polygel',
    category: 'extensiones',
    categoryLabel: 'Acrílico & Polygel',
    price: 80000,
    durationMinutes: 90,
    rating: 4.93,
    reviewsCount: 94,
    description: 'Mantenimiento y relleno de crecimiento en uñas de polygel, nivelación y esmaltado renovado.',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800',
    steps: ['Limado de rebaje', 'Relleno de polygel', 'Curado en cabina', 'Esmaltado y brillo']
  },
  {
    id: 'bano-acrilico-semipermanente',
    name: 'Baño de acrílico + semipermanente',
    category: 'extensiones',
    categoryLabel: 'Acrílico & Polygel',
    price: 80000,
    durationMinutes: 90,
    rating: 4.95,
    reviewsCount: 118,
    tag: 'Blindaje',
    tagType: 'care',
    description: 'Capa protectora de acrílico sobre el largo de tu uña natural para evitar roturas, finalizada con esmaltado semipermanente.',
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=800',
    steps: ['Manicura combinada', 'Aplicación de capa fina de acrílico', 'Pulido de superficie', 'Esmaltado semipermanente']
  },
  {
    id: 'mantenimiento-bano-acrilico',
    name: 'Mantenimiento Baño Acrílico',
    category: 'extensiones',
    categoryLabel: 'Acrílico & Polygel',
    price: 70000,
    durationMinutes: 75,
    rating: 4.91,
    reviewsCount: 62,
    description: 'Retoque y nivelación del baño de acrílico en el crecimiento para mantener tus uñas fuertes e impecables.',
    image: 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=800',
    steps: ['Revisión y nivelación', 'Relleno de acrílico en zona de cutícula', 'Sellado y acabado']
  },
  {
    id: 'bano-polygel-semipermanente',
    name: 'Baño de Polygel + semipermanente',
    category: 'extensiones',
    categoryLabel: 'Acrílico & Polygel',
    price: 80000,
    durationMinutes: 90,
    rating: 4.94,
    reviewsCount: 89,
    tag: 'Blindaje Flexible',
    tagType: 'care',
    description: 'Recubrimiento de polygel sobre la uña natural para aportarle máxima protección contra golpes y quiebres con esmalte semipermanente.',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800',
    steps: ['Preparación dérmica y ungueal', 'Capa de polygel autonivelada', 'Curado en lámpara', 'Color semipermanente y sellado']
  },
  {
    id: 'mantenimiento-bano-polygel',
    name: 'Mantenimiento de Baño de Polygel',
    category: 'extensiones',
    categoryLabel: 'Acrílico & Polygel',
    price: 70000,
    durationMinutes: 75,
    rating: 4.9,
    reviewsCount: 55,
    description: 'Relleno de crecimiento para baño de polygel conservando la armonía y salud de tu uña natural.',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800',
    steps: ['Nivelado del reborde', 'Aplicación de polygel', 'Polimerización y nuevo esmaltado']
  },

  // --- RETIROS & ADICIONALES ---
  {
    id: 'largo-adicional',
    name: 'Largo adicional',
    category: 'adicionales',
    categoryLabel: 'Retiros & Extras',
    price: 10000,
    durationMinutes: 15,
    rating: 4.9,
    reviewsCount: 60,
    tag: 'Extra',
    tagType: 'trend',
    description: 'Suplemento para extensiones con longitud superior al estándar #2 (ejemplo #3, #4 o superior).',
    image: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&q=80&w=800',
    steps: ['Medición y estructuración de longitud extra']
  },
  {
    id: 'arreglo-una-una',
    name: 'Arreglo de una uña',
    category: 'adicionales',
    categoryLabel: 'Retiros & Extras',
    price: 4000,
    durationMinutes: 20,
    rating: 4.92,
    reviewsCount: 75,
    description: 'Reparación puntual de una uña tradicional fisurada, rota o desprendida.',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800',
    steps: ['Retiro de residuo dañado', 'Reconstrucción con fibra o gel', 'Esmaltado nivelador']
  },
  {
    id: 'arreglo-permanente',
    name: 'Arreglo permanente',
    category: 'adicionales',
    categoryLabel: 'Retiros & Extras',
    price: 7000,
    durationMinutes: 20,
    rating: 4.95,
    reviewsCount: 94,
    tag: 'Reparación Semipermanente',
    tagType: 'care',
    description: 'Reparación puntual y esmaltado de una uña con técnica semipermanente o permanente para devolverle firmeza y brillo duradero.',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800',
    steps: ['Asepsia y diagnóstico', 'Nivelación o reconstrucción con gel', 'Esmaltado semipermanente', 'Curado LED y brillo final']
  },
  {
    id: 'extension-de-una',
    name: 'Extensión de uña',
    category: 'adicionales',
    categoryLabel: 'Retiros & Extras',
    price: 6000,
    durationMinutes: 25,
    rating: 4.93,
    reviewsCount: 82,
    description: 'Esculpido individual de una sola uña para igualar la longitud del resto de la mano.',
    image: 'https://images.unsplash.com/photo-1607779097040-26e80aa78e66?auto=format&fit=crop&q=80&w=800',
    steps: ['Colocación de molde o tip unitario', 'Esculpido a medida', 'Limado e integración']
  },
  {
    id: 'retiro-acrilico-polygel-pres-on',
    name: 'Retiro de Acrílico / Polygel / Pres on',
    category: 'adicionales',
    categoryLabel: 'Retiros & Extras',
    price: 18000,
    durationMinutes: 35,
    rating: 4.96,
    reviewsCount: 110,
    tag: 'Cuidado',
    tagType: 'care',
    description: 'Remoción segura y no traumática de sistemas artificiales, protegiendo la queratina natural de la uña.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
    steps: ['Rebaje cuidadoso', 'Disolución o desprendimiento seguro', 'Nutrición con queratina y aceite']
  },
  {
    id: 'retiro-semipermanente',
    name: 'Retiro Semipermanente',
    category: 'adicionales',
    categoryLabel: 'Retiros & Extras',
    price: 7000,
    durationMinutes: 20,
    rating: 4.95,
    reviewsCount: 135,
    tag: 'Cuidado',
    tagType: 'care',
    description: 'Retiro profesional de esmalte semipermanente con torno suave o envolturas sin debilitar la uña.',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
    steps: ['Desgaste de top coat', 'Retiro suave del color', 'Pulido de brillo natural e hidratación']
  },
  {
    id: 'adicional-secado-rapido',
    name: 'Adicional secado rápido',
    category: 'adicionales',
    categoryLabel: 'Retiros & Extras',
    price: 2000,
    durationMinutes: 10,
    rating: 4.9,
    reviewsCount: 45,
    description: 'Aplicación de gotas o spray acelerador de secado para esmaltes tradicionales, evitando marcas accidentales.',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=800',
    steps: ['Aplicación de fórmula de secado instantáneo sobre esmalte tradicional fresco']
  }
];

export const SPECIALISTS: Specialist[] = [
  {
    id: 'diana',
    name: 'Diana',
    role: 'Master Manicurista',
    rating: 4.99,
    reviewsCount: 198,
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400',
    bio: 'Especialista en acrílico esculpido, polygel y esmaltado semipermanente de alta precisión. Con más de 6 años brindando acabados perfectos y cuidado anatómico.',
    certifications: ['Master en Acrílico & Polygel', 'Esmaltado Semipermanente de Precisión', 'Bioseguridad y Esterilización'],
    availableDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    specialties: ['Acrílico #2 + semipermanente', 'Polygel #2', 'Base Rubber', 'Manicure semipermanente'],
    commissionRate: 50
  },
  {
    id: 'dayana',
    name: 'Dayana',
    role: 'Especialista en Estructuras & Pres On',
    rating: 4.97,
    reviewsCount: 175,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    bio: 'Experta en Jelly Tips, sistemas Pres On y baños protectores de acrílico y polygel. Diseños impecables y durabilidad garantizada.',
    certifications: ['Jelly Tips & Pres On Certified Master', 'Estructuras Híbridas de Gel', 'Desinfección de Grado Médico'],
    availableDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    specialties: ['Pres on / Jelly Tips', 'Baño de acrílico', 'Baño de Polygel', 'Mantenimiento'],
    commissionRate: 50
  },
  {
    id: 'natalia',
    name: 'Natalia',
    role: 'Especialista en Pedicure & Bienestar',
    rating: 4.98,
    reviewsCount: 182,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400',
    bio: 'Dedicada al cuidado integral de pies y manos. Especialista en pedicure tradicional, semipermanente y protocolos de higiene y descanso profundo.',
    certifications: ['Pedicure Clínico & Spa Especializado', 'Esmaltado Semipermanente', 'Protocolos Hospitalarios de Asepsia'],
    availableDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    specialties: ['Pedicure semipermanente', 'Pedicure Tradicional', 'Limpieza de pies', 'Pedicure niña'],
    commissionRate: 50
  },
  {
    id: 'geraldine',
    name: 'Geraldine',
    role: 'Especialista en Base Rubber & Cuidado',
    rating: 4.96,
    reviewsCount: 160,
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    bio: 'Maestra en nivelación con Base Rubber, fortalecimiento de uñas naturales y esmaltados masculinos y femeninos de alta definición.',
    certifications: ['Rubber Base Leveling Master', 'Manicure Clásico & Semipermanente', 'Técnicas de Retiro No Traumático'],
    availableDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    specialties: ['Base Rubber + tradicional', 'Manicure hombre semipermanente', 'Retiro de sistemas', 'Limpieza de manos'],
    commissionRate: 50
  }
];

export const NAIL_SHAPES: NailShape[] = [
  { id: 'almond', name: 'Almendra Suave', description: 'Estiliza y alarga los dedos con un contorno cónico natural.' },
  { id: 'square-soft', name: 'Cuadrada con Esquinas Suaves', description: 'Elegante, moderna y sumamente cómoda para el día a día.' },
  { id: 'coffin', name: 'Ballerina / Coffin', description: 'Sofisticada con punta recta y laterales estilizados.' },
  { id: 'oval', name: 'Ovalada Clásica', description: 'Armoniosa, favorecedora para todo tipo de lecho ungueal.' }
];

export const ADD_ON_OPTIONS: AddOnOption[] = [
  {
    id: 'adicional-secado-rapido',
    name: 'Adicional secado rápido',
    price: 2000,
    durationMinutes: 10,
    description: 'Gotas o spray acelerador de secado para esmaltes tradicionales.'
  },
  {
    id: 'arreglo-una-una',
    name: 'Arreglo de una uña',
    price: 4000,
    durationMinutes: 20,
    description: 'Reparación individual de uña tradicional rota, fisurada o desprendida.'
  },
  {
    id: 'arreglo-permanente',
    name: 'Arreglo permanente',
    price: 7000,
    durationMinutes: 20,
    description: 'Reparación puntual y esmaltado con técnica permanente o semipermanente de uña averiada.'
  },
  {
    id: 'extension-de-una',
    name: 'Extensión de uña',
    price: 6000,
    durationMinutes: 25,
    description: 'Esculpido individual de una sola uña para igualar la longitud del set.'
  },
  {
    id: 'largo-adicional',
    name: 'Largo adicional',
    price: 10000,
    durationMinutes: 15,
    description: 'Suplemento para longitud extendida superior al estándar #2.'
  },
  {
    id: 'retiro-semipermanente',
    name: 'Retiro Semipermanente',
    price: 7000,
    durationMinutes: 20,
    description: 'Retiro seguro de esmalte semipermanente preservando la uña natural.'
  },
  {
    id: 'retiro-acrilico-polygel-pres-on',
    name: 'Retiro de Acrílico / Polygel / Pres on',
    price: 18000,
    durationMinutes: 35,
    description: 'Remoción cuidadosa de sistemas artificiales preservando la salud de la lámina ungueal.'
  }
];
