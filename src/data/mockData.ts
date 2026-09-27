import { Service, Specialist, PolishSwatch, NailShape, AddOnOption, Appointment, AppNotification, SavedDesign, AdminUser, SystemUser } from '../types';

export const LOGO_URL = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYfnyPriEZp5_fqH6CZLgoZH0wyCsIu1K-mIRHWO1j6v0JIUjK8Kq48jjZB4p97vYnpNOxKM9oKMgE75s-MKqvk7Ub0ejGk5vonLxYBY6yh8jHKF14UuNfXqTS35pUY26pzcs51BKkpRXj2Zz7URJCYzHPlZ99jqNRzEhRwVdK4-vE2QaqER1NHAW8CDjIdPAIxmopk8abbho8QU7Ftb-FUC5lAcDTKy9Wuv4Z29dAzrsKFy-1YNcUow';
export const USER_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUrZkdIRr4pUE-9QkKlA4YJH4tk8ug4t8ss19lF-xaHuFXDZMHSMNsT9k9zTg0PDXjyE1XBLqv7-3TJMIW1ZrMHrdyvA7EONm345vpZM9IpVzKV952FeAoCg5uRj8ASWjkLrJBn8hl9dZ4nYWpvmFHjrZnDCGuwztm7sv__1kQfaJmUHLZDjmyxmWSv0wSvmVqEKDlZRTrx921qdt6d1vfQiI8yKxjqllB1oBt-7Gy_etZi5Dt7p8vVQ';

export const DAVID_USER: SystemUser = {
  id: 'USR-DAVID-01',
  nombre: 'David Orjuela',
  email: 'orjueladavid32@gmail.com',
  rol: 'SuperAdmin',
  sucursalAsignada: 'todas',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  creadoEn: '2026-09-01T07:00:00.000Z',
  puedeVerApi: true,
  puedeVerUsuarios: true
};

export const SYSTEM_USERS: SystemUser[] = [
  DAVID_USER,
  {
    id: 'USR-ADMIN-01',
    nombre: 'Lucía Santamaría',
    email: 'administracion@auranails.com',
    rol: 'Administrador',
    sucursalAsignada: 'chico',
    avatar: USER_AVATAR,
    creadoEn: '2026-09-05T08:00:00.000Z',
    puedeVerApi: false, // Administrador CANNOT see API section
    puedeVerUsuarios: false // Administrador CANNOT see Users section
  },
  {
    id: 'USR-CAJA-01',
    nombre: 'Caja & Recepción Chicó',
    email: 'caja@auranails.com',
    rol: 'Caja',
    sucursalAsignada: 'chico',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200',
    creadoEn: '2026-09-10T09:00:00.000Z',
    puedeVerApi: false,
    puedeVerUsuarios: false
  }
];

export const ADMIN_USER: AdminUser = {
  id: 'admin-01',
  name: 'David Orjuela',
  role: 'SuperAdmin',
  title: 'Director de Operaciones & Santuario',
  email: 'orjueladavid32@gmail.com',
  phone: '+57 310 442 8890',
  branch: 'Santuario Central Chicó · Bogotá',
  branchId: 'chico',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  permissions: [
    'Control total de usuarios y sedes',
    'Consola REST API y pruebas de integración',
    'Gestión integral de citas y agenda en tiempo real',
    'Caja rápida y libro maestro de liquidación a especialistas',
    'Arqueo de caja y gaveta física diaria',
    'Sincronización con Google Calendar',
    'Base y reporte de clientes con historial de visitas'
  ]
};

export const SERVICES: Service[] = [
  {
    id: 'manicura-rusa-glazed',
    name: 'Manicura Rusa Glazed Donut',
    category: 'manicura',
    categoryLabel: 'Manicura Rusa',
    price: 95000,
    durationMinutes: 60,
    rating: 4.9,
    reviewsCount: 184,
    tag: 'Top Ventas',
    tagType: 'top',
    description: 'Limpieza ultra precisa de cutícula con torno diamantado y acabado cromado aperlado estilo nacarado.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOfsdpH3e7HqaUOQScax9N0X6CRAnPtA-lCzqugxKKHVPgZ98B7pxhj8n9gkHy7C8NLmXolhp2KC_Wsz7Hth3npWrcmmrHhGcey6QZWmEv1Cfut4cLpP8kvSUxzrOcLHWzVWOuV2Mat3bdkTPBjt96btPbJlUoCR7utNckLGq1h6HtkPRmTJwqO4E7ZyRhTQaDqLH00aZUkXUTWUOZlvlI8wggEeiJzkPmt4XgrFQex80j4vSTpf-pHQ',
    steps: [
      'Diagnóstico y desinfección dérmica',
      'Retiro y pulido de cutículas con fresas diamantadas de precisión',
      'Nivelación de uña con base rubber con colágeno',
      'Aplicación de esmalte base y polvo de cromo nacarado estilo Hailey',
      'Top coat ultra brillante de larga duración y aceite botánico de jojoba'
    ],
    recommendedFor: 'Quienes buscan un acabado impecable, durabilidad de 3 a 4 semanas y brillo perlado sofisticado.'
  },
  {
    id: 'spa-pedicure-lavanda',
    name: 'Spa Pedicure Lavanda Relax',
    category: 'pedicura',
    categoryLabel: 'Pedicura Spa',
    price: 120000,
    durationMinutes: 75,
    rating: 4.9,
    reviewsCount: 92,
    tag: 'Relax Total',
    tagType: 'relax',
    description: 'Inmersión botánica, exfoliación profunda con sales marinas del Himalaya y masaje relajante con aceites esenciales.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2zuNZ8nqFMjau6ovc9LF2omnV_L5K7yNHaUfsz1WHCTA9v0sfA4_9zmA-IsLwAEf5GywEEL2MBZBZY8wVduMV_QU-1ygsBPJyrYg62qyuBtOUH_zDLTvtTw6JKvO2IzuZDVNmapO7l0SE3ONkYRKIwI9PaT74k8g4Yi4kl2jSSPabocOk1dH7hcTvoIyH9kTUAGAfal2wICGOD4evXtbZLnbkz5nBm2PqWn9WiTHN1MzRx3hlOwA_1g',
    steps: [
      'Baño de inmersión en tina de cobre con infusión tibia de lavanda y pétalos',
      'Exfoliación exfoliante con sales rosas del Himalaya y cristales de cuarzo',
      'Perfilado de uñas y tratamiento de talones con lija estéril',
      'Masaje drenante y descontracturante de 20 min con aceite de lavanda orgánica',
      'Esmaltado en gel o tradicional a elección con sellado nutritivo'
    ],
    recommendedFor: 'Pies cansados, alivio del estrés y una experiencia multisensorial profundamente reparadora.'
  },
  {
    id: 'soft-gel-pastel-art',
    name: 'Soft Gel & Minimalist Pastel Art',
    category: 'nail-art',
    categoryLabel: 'Nail Art Pastel',
    price: 145000,
    durationMinutes: 90,
    rating: 5.0,
    reviewsCount: 147,
    tag: 'Tendencia',
    tagType: 'trend',
    description: 'Estructura ligera de soft gel duradero combinada con trazos botánicos a mano alzada y microfrancesa en tonos pastel.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhRtLtp4rWeqdO7ZBkei_aCDjMH2P4JGAIaYlW6TGLLnHGFtTjr-4bsNEd0IKVYSmtAZD2e_aZo3xdt_CiGFV5N5DQ18o-PhNpXysomNUMEWu16_XvFw6ivDhFgZ9WcM_sQz7K9CER4wbGbdWRbpS-_rygFkPZtyXOqSD2LPpvYGdwvLSXqS5hjMujha078zUQOR1jNq7s4F1hEZH2jUohPtGESe_1qOirG0weegA9NsI-YAiWkxrRZg',
    steps: [
      'Preparación anatómica de la placa ungueal sin daño',
      'Colocación y curado de tips de soft gel premium preformados',
      'Diseño personalizado de nail art minimalista pastel a mano alzada',
      'Sellado de alta resistencia con top coat diamante libre de capa pegajosa',
      'Hidratación de manos con sérum de ácido hialurónico'
    ],
    recommendedFor: 'Amantes del arte delicado, longitud natural estilizada y resistencia prolongada sin pesadez.'
  },
  {
    id: 'tratamiento-restaurador-cuticulas',
    name: 'Tratamiento Restaurador de Cutículas & Manos',
    category: 'tratamientos',
    categoryLabel: 'Tratamiento Keratina',
    price: 75000,
    durationMinutes: 40,
    rating: 4.8,
    reviewsCount: 63,
    tag: 'Cuidado Puro',
    tagType: 'care',
    description: 'Terapia intensiva con queratina hidrolizada, aceite de jojoba orgánico y máscara térmica de guantes calmantes.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVirC5e2eusL342BksKiLfZHKUkDmH2wLg29gmWIfYKwh46adSBF_-Bkc4OxTHFowER-kyaIng2xi8woPNZUaUAYl2-of4cxk2ySQ9xaGrqfV7PIWP0SZkNEP9kJm3v24ChPQKxk9yXQZ-ScAuPa57-gTtfpp3b9Soy272WWWpWsi5LuEgT6OT_hChPblLml0P6-cjOPyCAMTaDNWsEX0alWYjjMgylp8Y7LFlRFjnYGT04qih4Pd_9A',
    steps: [
      'Limpieza suave con limpiador micelar botánico',
      'Mascarilla de queratina vegetal y vitamina E pura',
      'Inserción en guantes térmicos infrarrojos de activación dérmica',
      'Sellado de hidratación con bálsamo de manteca de karité artesanal',
      'Pulido suave de uña natural con brillo saludable'
    ],
    recommendedFor: 'Uñas quebradizas, manos resecas por clima o desinfectantes y cutículas agrietadas.'
  },
  {
    id: 'kapping-gel-fortalecedor',
    name: 'Kapping Gel Fortalecedor con Calcio',
    category: 'gel',
    categoryLabel: 'Gel & Acrílico',
    price: 98000,
    durationMinutes: 65,
    rating: 4.9,
    reviewsCount: 112,
    tag: 'Fortalecedor',
    tagType: 'care',
    description: 'Fina capa protectora de gel con calcio que blinda tus uñas naturales sin dañarlas, permitiéndoles crecer sanas y fuertes.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOfsdpH3e7HqaUOQScax9N0X6CRAnPtA-lCzqugxKKHVPgZ98B7pxhj8n9gkHy7C8NLmXolhp2KC_Wsz7Hth3npWrcmmrHhGcey6QZWmEv1Cfut4cLpP8kvSUxzrOcLHWzVWOuV2Mat3bdkTPBjt96btPbJlUoCR7utNckLGq1h6HtkPRmTJwqO4E7ZyRhTQaDqLH00aZUkXUTWUOZlvlI8wggEeiJzkPmt4XgrFQex80j4vSTpf-pHQ',
    steps: [
      'Limpieza profunda y deshidratación no agresiva',
      'Aplicación de primer vitamínico libre de ácido',
      'Capa micronizada de kapping gel con queratina y calcio',
      'Polimerización LED de baja emisión térmica',
      'Esmaltado semipermanente en tono a elección y brillo sellador'
    ],
    recommendedFor: 'Uñas finas o quebradizas que necesitan soporte para crecer con longitud propia.'
  },
  {
    id: 'manicura-francesa-babyboomer',
    name: 'Baby Boomer Ombré Rose & Milky White',
    category: 'nail-art',
    categoryLabel: 'Nail Art Pastel',
    price: 130000,
    durationMinutes: 70,
    rating: 4.95,
    reviewsCount: 88,
    tag: 'Favorito Chic',
    tagType: 'trend',
    description: 'Elegante degradado difuminado con aerógrafo desde rosa rubor translúcido hacia un blanco lechoso de extrema delicadeza.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhRtLtp4rWeqdO7ZBkei_aCDjMH2P4JGAIaYlW6TGLLnHGFtTjr-4bsNEd0IKVYSmtAZD2e_aZo3xdt_CiGFV5N5DQ18o-PhNpXysomNUMEWu16_XvFw6ivDhFgZ9WcM_sQz7K9CER4wbGbdWRbpS-_rygFkPZtyXOqSD2LPpvYGdwvLSXqS5hjMujha078zUQOR1jNq7s4F1hEZH2jUohPtGESe_1qOirG0weegA9NsI-YAiWkxrRZg',
    steps: [
      'Manicura combinada de alta definición',
      'Base niveladora cover blush',
      'Degradado gradual con aerógrafo de micropartículas',
      'Aplicación de brillo con microdestellos de cuarzo opcional',
      'Hidratación de cutículas con aceite de argán marroquí'
    ],
    recommendedFor: 'Novias, eventos especiales o para un look diario impecable y atemporal.'
  }
];

export const SPECIALISTS: Specialist[] = [
  {
    id: 'valentina',
    name: 'Valentina R.',
    role: 'Master Manicurista',
    rating: 4.99,
    reviewsCount: 210,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVrZXlC9XV7Jr5Ckz3Ejf4PnGseAb9_LjfKYMrbJoppy_LiDKhDwinR0vBsGhUvZvHGPbp5iUnHxfjSiI0q1x_ezt5EWE4msKhGYnuJ_bi2to_l-CAY9vsgwQCGTZuO9aGH29UKCzWusAaS4s7B4tkRYb32MZNdhVDHGKJcjFGCBXJNRmu77q3s_K2o3AfWZrhAQp1ovuHTFfpYunmehQGLKlfeXfbRZw_xe-Mjukl7Dszb37eqX5jMg',
    bio: 'Certificada internacionalmente en Manicura Rusa con torno por la Academia E.Mi de Praga. Con más de 7 años transformando manos con técnica impecable y acabado de porcelana.',
    certifications: ['E.Mi Certified Russian Manicure Master', 'Nail Structure & Anatomical Care', 'Hygiene & Hospital-Grade Sterilization'],
    availableDays: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    specialties: ['Manicura Rusa de precisión', 'Glazed Donut Nails', 'Kapping Gel'],
    commissionRate: 50
  },
  {
    id: 'camila',
    name: 'Camila M.',
    role: 'Nail Art Senior',
    rating: 4.95,
    reviewsCount: 164,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkqT1IeQltSW_ZvJ-An617C6LiKGTzhN8VCfm8CO4UEZm3OcP7gSI-hbDEVvBTQcwptD3sxDbsGxVlC3YB0Y9tYJaqTzmnax5rRcbkMY4_--89sRCQ78Fo4JiBy4As_MLIDh8OEo1qjQMn_IaivwTABi_F0SQwqsJTXl7y8PeGFWRrP7Qc5mPhgslXFh7a4p-8oArpN3SRdE0JXzrrnTbK7CiRJTHg2355DrZemur7U54hlrN-qzJ5Sw',
    bio: 'Especialista en Soft Gel y micro-ilustración botánica. Formada en diseño visual y colorimetría aplicada a la estética moderna de uñas.',
    certifications: ['Apres Gel-X Master Specialist', 'Minimalist Hand-painted Nail Art', 'Color Harmony & Skin Undertone'],
    availableDays: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    specialties: ['Micro-francés pastel', 'Soft Gel Structure', 'Diseños botánicos orgánicos'],
    commissionRate: 50
  },
  {
    id: 'sofia',
    name: 'Sofía D.',
    role: 'Spa & Bienestar',
    rating: 4.98,
    reviewsCount: 190,
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3fYrIJx5OrRGzRFcwXytAtYxoI17YqIIhzsz_7U02s7ufhrTTkUSHHrZtQxwsKWl8y4Gc8W5k-JAtowTFSsRr7MsTUFfiJA8YGIBPie2qtIg8b-58O9aEX79eX-r6DtzuA0v6wr75bHz38Ctm1rg3fh_LKTJEUIwhLIPeZmeqJv6EPEjBRw9k62k1A1Q8N9k6w3WVPUg66vTT_P5YIOH6kSMhcbet0sW6YAROBGzq1vCOKmvErdtjVw',
    bio: 'Terapeuta holística y experta en reflexología podal y tratamientos rejuvenecedores de manos. Crea experiencias que calman mente y renuevan el cuerpo.',
    certifications: ['Certified Podal Reflexology Therapist', 'Organic Herbal Aromatherapy Practitioner', 'Spa Rituals & Hot Stone Therapy'],
    availableDays: ['Lunes', 'Miércoles', 'Jueves', 'Viernes', 'Domingo'],
    specialties: ['Spa Pedicure Botánica', 'Exfoliación con sales de Epsom', 'Masaje drenante desfatigante'],
    commissionRate: 50
  }
];

export const POLISH_SWATCHES: PolishSwatch[] = [
  { id: 'glazed-pearl', name: 'Hailey Glazed Pearl', hex: '#f6eff2', accentHex: '#eedbe1', finish: 'glazed' },
  { id: 'milk-bath', name: 'Milky Bath Nude', hex: '#faf4ef', accentHex: '#efe5db', finish: 'creamy' },
  { id: 'rose-blush', name: 'Dusty Rose Bloom', hex: '#e8b4b8', accentHex: '#cb9296', finish: 'creamy' },
  { id: 'lavender-mist', name: 'Lavanda Mist Pastel', hex: '#e1d0e8', accentHex: '#c7b0d0', finish: 'pastel' },
  { id: 'peach-sorbet', name: 'Melocotón Velouté', hex: '#fad4c0', accentHex: '#eab89e', finish: 'pastel' },
  { id: 'matcha-latte', name: 'Matcha Calm Cream', hex: '#dce8dc', accentHex: '#b8ccb8', finish: 'pastel' },
  { id: 'chrome-champagne', name: 'Champaña Cromo', hex: '#ede6db', accentHex: '#d8cdbe', finish: 'chrome' },
  { id: 'deep-plum', name: 'Aura Plum Velvet', hex: '#583c4b', accentHex: '#3e2733', finish: 'creamy' }
];

export const NAIL_SHAPES: NailShape[] = [
  { id: 'almond', name: 'Almendra Suave', description: 'Estiliza y alarga los dedos con un contorno cónico natural.' },
  { id: 'square-soft', name: 'Cuadrada con Esquinas Suaves', description: 'Elegante, moderna y sumamente cómoda para el día a día.' },
  { id: 'coffin', name: 'Ballerina / Coffin', description: 'Sofisticada con punta recta y laterales estilizados.' },
  { id: 'oval', name: 'Ovalada Clásica', description: 'Armoniosa, favorecedora para todo tipo de lecho ungueal.' }
];

export const ADD_ON_OPTIONS: AddOnOption[] = [
  {
    id: 'scrub-rose-quartz',
    name: 'Exfoliación de Cuarzo Rosa & Rosas Silvestres',
    price: 25000,
    durationMinutes: 10,
    description: 'Microcristales pulidores que eliminan células muertas y dejan la piel con textura de pétalo.'
  },
  {
    id: 'paraffin-lavender',
    name: 'Máscara Térmica de Parafina con Lavanda',
    price: 30000,
    durationMinutes: 15,
    description: 'Inmersión caliente calmante que hidrata en profundidad y alivia dolores articulares.'
  },
  {
    id: 'gel-removal',
    name: 'Retiro Cuidadoso de Gel / Acrílico Anterior',
    price: 20000,
    durationMinutes: 15,
    description: 'Retiro no traumático preservando la integridad de tu uña natural.'
  },
  {
    id: 'head-massage',
    name: 'Masaje Exprés Sien y Cuello Antiestrés',
    price: 35000,
    durationMinutes: 15,
    description: 'Mientras se polimerizan tus uñas, disfruta de un masaje liberador de tensiones con aromaterapia.'
  }
];

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-101',
    serviceId: 'manicura-rusa-glazed',
    serviceName: 'Manicura Rusa Glazed Donut',
    servicePrice: 95000,
    serviceDuration: 60,
    serviceImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOfsdpH3e7HqaUOQScax9N0X6CRAnPtA-lCzqugxKKHVPgZ98B7pxhj8n9gkHy7C8NLmXolhp2KC_Wsz7Hth3npWrcmmrHhGcey6QZWmEv1Cfut4cLpP8kvSUxzrOcLHWzVWOuV2Mat3bdkTPBjt96btPbJlUoCR7utNckLGq1h6HtkPRmTJwqO4E7ZyRhTQaDqLH00aZUkXUTWUOZlvlI8wggEeiJzkPmt4XgrFQex80j4vSTpf-pHQ',
    specialistId: 'valentina',
    specialistName: 'Valentina R.',
    specialistRole: 'Master Manicurista',
    specialistAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAVrZXlC9XV7Jr5Ckz3Ejf4PnGseAb9_LjfKYMrbJoppy_LiDKhDwinR0vBsGhUvZvHGPbp5iUnHxfjSiI0q1x_ezt5EWE4msKhGYnuJ_bi2to_l-CAY9vsgwQCGTZuO9aGH29UKCzWusAaS4s7B4tkRYb32MZNdhVDHGKJcjFGCBXJNRmu77q3s_K2o3AfWZrhAQp1ovuHTFfpYunmehQGLKlfeXfbRZw_xe-Mjukl7Dszb37eqX5jMg',
    date: 'Mañana, 28 Septiembre',
    time: '11:00 AM',
    clientName: 'Mariana Duque Valenzuela',
    clientPhone: '+57 312 849 2011',
    notes: 'Cutícula sensible, solicita torno a baja velocidad y aceite de almendras.',
    polishColor: 'Hailey Glazed Pearl',
    nailShape: 'Almendra Suave',
    selectedAddOns: ['Exfoliación de Cuarzo Rosa & Rosas Silvestres'],
    totalPrice: 120000,
    status: 'confirmada',
    bookingCode: 'AURA-7829',
    createdAt: '2026-09-27'
  },
  {
    id: 'apt-102',
    serviceId: 'soft-gel-pastel-art',
    serviceName: 'Soft Gel & Minimalist Pastel Art',
    servicePrice: 145000,
    serviceDuration: 90,
    serviceImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhRtLtp4rWeqdO7ZBkei_aCDjMH2P4JGAIaYlW6TGLLnHGFtTjr-4bsNEd0IKVYSmtAZD2e_aZo3xdt_CiGFV5N5DQ18o-PhNpXysomNUMEWu16_XvFw6ivDhFgZ9WcM_sQz7K9CER4wbGbdWRbpS-_rygFkPZtyXOqSD2LPpvYGdwvLSXqS5hjMujha078zUQOR1jNq7s4F1hEZH2jUohPtGESe_1qOirG0weegA9NsI-YAiWkxrRZg',
    specialistId: 'camila',
    specialistName: 'Camila M.',
    specialistRole: 'Nail Art Senior',
    specialistAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBkqT1IeQltSW_ZvJ-An617C6LiKGTzhN8VCfm8CO4UEZm3OcP7gSI-hbDEVvBTQcwptD3sxDbsGxVlC3YB0Y9tYJaqTzmnax5rRcbkMY4_--89sRCQ78Fo4JiBy4As_MLIDh8OEo1qjQMn_IaivwTABi_F0SQwqsJTXl7y8PeGFWRrP7Qc5mPhgslXFh7a4p-8oArpN3SRdE0JXzrrnTbK7CiRJTHg2355DrZemur7U54hlrN-qzJ5Sw',
    date: 'Hoy, 27 Septiembre',
    time: '05:00 PM',
    clientName: 'Dra. Carolina Restrepo',
    clientPhone: '+57 315 902 3341',
    notes: 'Diseño floral en tono lila y blanco lechoso para evento médico.',
    polishColor: 'Lavanda Mist Pastel',
    nailShape: 'Ovalada Clásica',
    selectedAddOns: ['Masaje Exprés Sien y Cuello Antiestrés'],
    totalPrice: 180000,
    status: 'en_preparacion',
    bookingCode: 'AURA-8902',
    createdAt: '2026-09-27'
  },
  {
    id: 'apt-103',
    serviceId: 'spa-pedicure-lavanda',
    serviceName: 'Spa Pedicure Lavanda Relax',
    servicePrice: 120000,
    serviceDuration: 75,
    serviceImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2zuNZ8nqFMjau6ovc9LF2omnV_L5K7yNHaUfsz1WHCTA9v0sfA4_9zmA-IsLwAEf5GywEEL2MBZBZY8wVduMV_QU-1ygsBPJyrYg62qyuBtOUH_zDLTvtTw6JKvO2IzuZDVNmapO7l0SE3ONkYRKIwI9PaT74k8g4Yi4kl2jSSPabocOk1dH7hcTvoIyH9kTUAGAfal2wICGOD4evXtbZLnbkz5nBm2PqWn9WiTHN1MzRx3hlOwA_1g',
    specialistId: 'sofia',
    specialistName: 'Sofía D.',
    specialistRole: 'Spa & Bienestar',
    specialistAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3fYrIJx5OrRGzRFcwXytAtYxoI17YqIIhzsz_7U02s7ufhrTTkUSHHrZtQxwsKWl8y4Gc8W5k-JAtowTFSsRr7MsTUFfiJA8YGIBPie2qtIg8b-58O9aEX79eX-r6DtzuA0v6wr75bHz38Ctm1rg3fh_LKTJEUIwhLIPeZmeqJv6EPEjBRw9k62k1A1Q8N9k6w3WVPUg66vTT_P5YIOH6kSMhcbet0sW6YAROBGzq1vCOKmvErdtjVw',
    date: 'Lunes, 30 Septiembre',
    time: '02:00 PM',
    clientName: 'Valeria Cárdenas P.',
    clientPhone: '+57 320 551 7789',
    notes: 'Piel con resequedad en talones, requiere hidratación intensiva.',
    polishColor: 'Dusty Rose Bloom',
    nailShape: 'Cuadrada con Esquinas Suaves',
    selectedAddOns: ['Máscara Térmica de Parafina con Lavanda'],
    totalPrice: 150000,
    status: 'confirmada',
    bookingCode: 'AURA-4419',
    createdAt: '2026-09-26'
  },
  {
    id: 'apt-098',
    serviceId: 'spa-pedicure-lavanda',
    serviceName: 'Spa Pedicure Lavanda Relax',
    servicePrice: 120000,
    serviceDuration: 75,
    serviceImage: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2zuNZ8nqFMjau6ovc9LF2omnV_L5K7yNHaUfsz1WHCTA9v0sfA4_9zmA-IsLwAEf5GywEEL2MBZBZY8wVduMV_QU-1ygsBPJyrYg62qyuBtOUH_zDLTvtTw6JKvO2IzuZDVNmapO7l0SE3ONkYRKIwI9PaT74k8g4Yi4kl2jSSPabocOk1dH7hcTvoIyH9kTUAGAfal2wICGOD4evXtbZLnbkz5nBm2PqWn9WiTHN1MzRx3hlOwA_1g',
    specialistId: 'sofia',
    specialistName: 'Sofía D.',
    specialistRole: 'Spa & Bienestar',
    specialistAvatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3fYrIJx5OrRGzRFcwXytAtYxoI17YqIIhzsz_7U02s7ufhrTTkUSHHrZtQxwsKWl8y4Gc8W5k-JAtowTFSsRr7MsTUFfiJA8YGIBPie2qtIg8b-58O9aEX79eX-r6DtzuA0v6wr75bHz38Ctm1rg3fh_LKTJEUIwhLIPeZmeqJv6EPEjBRw9k62k1A1Q8N9k6w3WVPUg66vTT_P5YIOH6kSMhcbet0sW6YAROBGzq1vCOKmvErdtjVw',
    date: '14 Septiembre',
    time: '04:30 PM',
    clientName: 'Andrea Beltrán Morales',
    clientPhone: '+57 318 672 1090',
    polishColor: 'Dusty Rose Bloom',
    nailShape: 'Cuadrada con Esquinas Suaves',
    selectedAddOns: ['Máscara Térmica de Parafina con Lavanda'],
    totalPrice: 150000,
    status: 'completada',
    bookingCode: 'AURA-6512',
    createdAt: '2026-09-14'
  }
];

export const NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: '¡Semana de Autocuidado Activa!',
    message: 'Disfruta de 15% de descuento en Manicura Rusa & Spa Deluxe en Bogotá.',
    timeAgo: 'Hace 2 horas',
    isUnread: true,
    type: 'promo'
  },
  {
    id: 'notif-2',
    title: 'Recordatorio de tu Cita de Mañana',
    message: 'Te esperamos con Valentina R. a las 11:00 AM en nuestra sede Chicó Calle 85.',
    timeAgo: 'Hace 5 horas',
    isUnread: true,
    type: 'reminder'
  },
  {
    id: 'notif-3',
    title: '+45 Puntos Aura Bloom acreditados',
    message: 'Has alcanzado el estatus VIP Platinum en nuestro programa de fidelidad.',
    timeAgo: 'Ayer',
    isUnread: false,
    type: 'reward'
  }
];

export const SAVED_DESIGNS: SavedDesign[] = [
  {
    id: 'des-1',
    title: 'Micro Frenchie Pastel Lilac',
    artist: 'Camila M.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhRtLtp4rWeqdO7ZBkei_aCDjMH2P4JGAIaYlW6TGLLnHGFtTjr-4bsNEd0IKVYSmtAZD2e_aZo3xdt_CiGFV5N5DQ18o-PhNpXysomNUMEWu16_XvFw6ivDhFgZ9WcM_sQz7K9CER4wbGbdWRbpS-_rygFkPZtyXOqSD2LPpvYGdwvLSXqS5hjMujha078zUQOR1jNq7s4F1hEZH2jUohPtGESe_1qOirG0weegA9NsI-YAiWkxrRZg',
    tag: 'Minimalista'
  },
  {
    id: 'des-2',
    title: 'Glazed Pearl Chrome Hailey',
    artist: 'Valentina R.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAOfsdpH3e7HqaUOQScax9N0X6CRAnPtA-lCzqugxKKHVPgZ98B7pxhj8n9gkHy7C8NLmXolhp2KC_Wsz7Hth3npWrcmmrHhGcey6QZWmEv1Cfut4cLpP8kvSUxzrOcLHWzVWOuV2Mat3bdkTPBjt96btPbJlUoCR7utNckLGq1h6HtkPRmTJwqO4E7ZyRhTQaDqLH00aZUkXUTWUOZlvlI8wggEeiJzkPmt4XgrFQex80j4vSTpf-pHQ',
    tag: 'Top Glow'
  },
  {
    id: 'des-3',
    title: 'Lavanda Floral Infusion',
    artist: 'Sofía D.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2zuNZ8nqFMjau6ovc9LF2omnV_L5K7yNHaUfsz1WHCTA9v0sfA4_9zmA-IsLwAEf5GywEEL2MBZBZY8wVduMV_QU-1ygsBPJyrYg62qyuBtOUH_zDLTvtTw6JKvO2IzuZDVNmapO7l0SE3ONkYRKIwI9PaT74k8g4Yi4kl2jSSPabocOk1dH7hcTvoIyH9kTUAGAfal2wICGOD4evXtbZLnbkz5nBm2PqWn9WiTHN1MzRx3hlOwA_1g',
    tag: 'Sensorial'
  }
];
