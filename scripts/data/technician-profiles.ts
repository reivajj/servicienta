export interface SeedApplianceType {
  name: string;
  slug: string;
}

export interface SeedBrand {
  name: string;
  slug: string;
}

export interface SeedZone {
  name: string;
  slug: string;
}

export interface SeedTechnicianFixture {
  baseAddressText: string;
  baseLat: number;
  baseLng: number;
  serviceRadiusKm: number;
  zoneSlugs: string[];
  applianceSlugs: string[];
  brandSpecialties: Array<{
    applianceSlug: string;
    brandSlugs: string[];
  }>;
  documents: Array<{
    documentType: string;
    title: string;
    description: string;
    isPublic: boolean;
  }>;
}

export const TECHNICIAN_SEARCH_APPLIANCE_TYPES: SeedApplianceType[] = [
  { name: 'Heladera', slug: 'heladera' },
  { name: 'Lavarropas', slug: 'lavarropas' },
  { name: 'Aire acondicionado', slug: 'aire-acondicionado' },
  { name: 'Microondas', slug: 'microondas' },
  { name: 'Lavavajillas', slug: 'lavavajillas' },
  { name: 'Cocina', slug: 'cocina' },
  { name: 'Horno eléctrico', slug: 'horno-electrico' },
  { name: 'Termotanque', slug: 'termotanque' },
  { name: 'Calefón', slug: 'calefon' },
  { name: 'Secarropas', slug: 'secarropas' },
];

export const TECHNICIAN_SEARCH_BRANDS: SeedBrand[] = [
  { name: 'Samsung', slug: 'samsung' },
  { name: 'LG', slug: 'lg' },
  { name: 'Whirlpool', slug: 'whirlpool' },
  { name: 'Drean', slug: 'drean' },
  { name: 'Electrolux', slug: 'electrolux' },
  { name: 'Patrick', slug: 'patrick' },
  { name: 'Philco', slug: 'philco' },
  { name: 'BGH', slug: 'bgh' },
  { name: 'Longvie', slug: 'longvie' },
  { name: 'Eskabe', slug: 'eskabe' },
];

export const TECHNICIAN_SEARCH_ZONES: SeedZone[] = [
  { name: 'Palermo', slug: 'palermo' },
  { name: 'Belgrano', slug: 'belgrano' },
  { name: 'Caballito', slug: 'caballito' },
  { name: 'Recoleta', slug: 'recoleta' },
  { name: 'Villa Crespo', slug: 'villa-crespo' },
  { name: 'Almagro', slug: 'almagro' },
  { name: 'Flores', slug: 'flores' },
  { name: 'Villa Urquiza', slug: 'villa-urquiza' },
  { name: 'Boedo', slug: 'boedo' },
  { name: 'San Telmo', slug: 'san-telmo' },
];

export const TECHNICIAN_SEARCH_FIXTURES: SeedTechnicianFixture[] = [
  {
    baseAddressText: 'Humboldt 1800, Palermo, CABA',
    baseLat: -34.58752,
    baseLng: -58.43011,
    serviceRadiusKm: 9,
    zoneSlugs: ['palermo', 'villa-crespo', 'recoleta'],
    applianceSlugs: ['heladera', 'lavarropas', 'microondas'],
    brandSpecialties: [
      { applianceSlug: 'heladera', brandSlugs: ['samsung', 'lg', 'whirlpool'] },
      { applianceSlug: 'lavarropas', brandSlugs: ['drean', 'electrolux'] },
    ],
    documents: [
      {
        documentType: 'license',
        title: 'Matrícula de refrigeración',
        description:
          'Habilitación para reparación y mantenimiento de equipos de frío.',
        isPublic: true,
      },
      {
        documentType: 'cv',
        title: 'CV técnico línea blanca',
        description:
          'Experiencia en diagnóstico y reparación de heladeras y lavarropas.',
        isPublic: true,
      },
    ],
  },
  {
    baseAddressText: 'Mendoza 2400, Belgrano, CABA',
    baseLat: -34.56491,
    baseLng: -58.45783,
    serviceRadiusKm: 8,
    zoneSlugs: ['belgrano', 'villa-urquiza', 'palermo'],
    applianceSlugs: ['aire-acondicionado', 'microondas', 'horno-electrico'],
    brandSpecialties: [
      {
        applianceSlug: 'aire-acondicionado',
        brandSlugs: ['bgh', 'samsung', 'lg'],
      },
      { applianceSlug: 'microondas', brandSlugs: ['philco', 'whirlpool'] },
    ],
    documents: [
      {
        documentType: 'certificate',
        title: 'Certificado HVAC',
        description:
          'Capacitación en instalación y mantenimiento de aire acondicionado split.',
        isPublic: true,
      },
    ],
  },
  {
    baseAddressText: 'Rosario 600, Caballito, CABA',
    baseLat: -34.6197,
    baseLng: -58.44241,
    serviceRadiusKm: 7,
    zoneSlugs: ['caballito', 'almagro', 'flores'],
    applianceSlugs: ['lavarropas', 'secarropas', 'lavavajillas'],
    brandSpecialties: [
      {
        applianceSlug: 'lavarropas',
        brandSlugs: ['drean', 'electrolux', 'whirlpool'],
      },
      { applianceSlug: 'secarropas', brandSlugs: ['electrolux', 'lg'] },
    ],
    documents: [
      {
        documentType: 'insurance',
        title: 'Seguro de responsabilidad civil',
        description: 'Cobertura vigente para intervenciones en domicilios.',
        isPublic: false,
      },
    ],
  },
  {
    baseAddressText: 'Pueyrredón 1800, Recoleta, CABA',
    baseLat: -34.58891,
    baseLng: -58.39765,
    serviceRadiusKm: 6,
    zoneSlugs: ['recoleta', 'palermo', 'san-telmo'],
    applianceSlugs: ['heladera', 'aire-acondicionado'],
    brandSpecialties: [
      {
        applianceSlug: 'heladera',
        brandSlugs: ['samsung', 'whirlpool', 'electrolux'],
      },
      { applianceSlug: 'aire-acondicionado', brandSlugs: ['lg', 'bgh'] },
    ],
    documents: [
      {
        documentType: 'portfolio',
        title: 'Portfolio de trabajos premium',
        description:
          'Casos de mantenimiento en residencias y alquiler temporario.',
        isPublic: true,
      },
    ],
  },
  {
    baseAddressText: 'Corrientes 5200, Villa Crespo, CABA',
    baseLat: -34.60241,
    baseLng: -58.43587,
    serviceRadiusKm: 7,
    zoneSlugs: ['villa-crespo', 'palermo', 'almagro'],
    applianceSlugs: ['cocina', 'horno-electrico', 'microondas'],
    brandSpecialties: [
      { applianceSlug: 'cocina', brandSlugs: ['longvie', 'eskabe', 'patrick'] },
      { applianceSlug: 'horno-electrico', brandSlugs: ['philco', 'longvie'] },
    ],
    documents: [
      {
        documentType: 'gas-safety',
        title: 'Constancia de seguridad',
        description: 'Buenas prácticas y protocolos para cocinas y hornos.',
        isPublic: false,
      },
    ],
  },
  {
    baseAddressText: 'Rivadavia 4200, Almagro, CABA',
    baseLat: -34.6113,
    baseLng: -58.42235,
    serviceRadiusKm: 6,
    zoneSlugs: ['almagro', 'caballito', 'boedo'],
    applianceSlugs: ['termotanque', 'calefon', 'cocina'],
    brandSpecialties: [
      { applianceSlug: 'termotanque', brandSlugs: ['eskabe', 'longvie'] },
      { applianceSlug: 'calefon', brandSlugs: ['eskabe', 'patrick'] },
    ],
    documents: [
      {
        documentType: 'certificate',
        title: 'Curso de equipos a gas',
        description:
          'Mantenimiento preventivo y diagnóstico de termotanques y calefones.',
        isPublic: true,
      },
    ],
  },
  {
    baseAddressText: 'Nazca 200, Flores, CABA',
    baseLat: -34.6321,
    baseLng: -58.46372,
    serviceRadiusKm: 8,
    zoneSlugs: ['flores', 'caballito', 'villa-urquiza'],
    applianceSlugs: ['lavarropas', 'heladera', 'secarropas'],
    brandSpecialties: [
      { applianceSlug: 'heladera', brandSlugs: ['samsung', 'lg'] },
      { applianceSlug: 'lavarropas', brandSlugs: ['drean', 'patrick'] },
    ],
    documents: [
      {
        documentType: 'cv',
        title: 'CV técnico multimarca',
        description: 'Atención domiciliaria de línea blanca familiar.',
        isPublic: true,
      },
    ],
  },
  {
    baseAddressText: 'Triunvirato 4700, Villa Urquiza, CABA',
    baseLat: -34.57248,
    baseLng: -58.48675,
    serviceRadiusKm: 9,
    zoneSlugs: ['villa-urquiza', 'belgrano', 'palermo'],
    applianceSlugs: ['aire-acondicionado', 'heladera', 'termotanque'],
    brandSpecialties: [
      {
        applianceSlug: 'aire-acondicionado',
        brandSlugs: ['bgh', 'samsung', 'lg'],
      },
      { applianceSlug: 'termotanque', brandSlugs: ['eskabe'] },
    ],
    documents: [
      {
        documentType: 'license',
        title: 'Registro de instalador',
        description: 'Instalación, service y mantenimiento de climatización.',
        isPublic: true,
      },
    ],
  },
  {
    baseAddressText: 'Independencia 3500, Boedo, CABA',
    baseLat: -34.62624,
    baseLng: -58.41388,
    serviceRadiusKm: 6,
    zoneSlugs: ['boedo', 'almagro', 'san-telmo'],
    applianceSlugs: ['cocina', 'calefon', 'horno-electrico'],
    brandSpecialties: [
      { applianceSlug: 'cocina', brandSlugs: ['longvie', 'patrick'] },
      { applianceSlug: 'calefon', brandSlugs: ['eskabe', 'longvie'] },
    ],
    documents: [
      {
        documentType: 'certificate',
        title: 'Capacitación en hornos y cocinas',
        description:
          'Especialización en artefactos de cocción y agua caliente.',
        isPublic: true,
      },
    ],
  },
  {
    baseAddressText: 'Defensa 900, San Telmo, CABA',
    baseLat: -34.62141,
    baseLng: -58.37152,
    serviceRadiusKm: 7,
    zoneSlugs: ['san-telmo', 'recoleta', 'boedo'],
    applianceSlugs: ['microondas', 'lavavajillas', 'heladera'],
    brandSpecialties: [
      {
        applianceSlug: 'lavavajillas',
        brandSlugs: ['whirlpool', 'electrolux'],
      },
      { applianceSlug: 'microondas', brandSlugs: ['philco', 'samsung'] },
    ],
    documents: [
      {
        documentType: 'portfolio',
        title: 'Servicios para alquileres temporarios',
        description:
          'Resolución rápida para unidades amobladas y gastronomía pequeña.',
        isPublic: true,
      },
    ],
  },
];
