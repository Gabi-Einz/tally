import type { Category } from '../db/types'

export const OTHER_CATEGORY_ID = 'otros'

type DefaultCategory = Pick<
  Category,
  'id' | 'color' | 'keywords' | 'description'
>

const DEFAULTS: DefaultCategory[] = [
  {
    id: 'supermercado',
    color: '#2f9e6b',
    keywords: [
      'super',
      'supermercado',
      'coto',
      'carrefour',
      'dia',
      'jumbo',
      'disco',
      'chino',
      'verduleria',
      'almacen',
      'carniceria',
    ],
    description:
      'supermercado, almacén, verdulería, carnicería, compras de comida para la casa',
  },
  {
    id: 'comida',
    color: '#e07a3a',
    keywords: [
      'restaurante',
      'resto',
      'bar',
      'cafe',
      'delivery',
      'rappi',
      'pedidosya',
      'pizza',
      'empanadas',
      'helado',
      'almuerzo',
      'cena',
    ],
    description:
      'restaurantes, bares, cafés, delivery de comida, almuerzos y cenas afuera',
  },
  {
    id: 'transporte',
    color: '#3b7dd8',
    keywords: [
      'sube',
      'colectivo',
      'bondi',
      'tren',
      'subte',
      'taxi',
      'uber',
      'cabify',
      'didi',
      'nafta',
      'ypf',
      'shell',
      'axion',
      'peaje',
      'estacionamiento',
    ],
    description:
      'colectivo, tren, subte, taxi, Uber, nafta, peajes y estacionamiento',
  },
  {
    id: 'servicios',
    color: '#8f5bd6',
    keywords: [
      'luz',
      'gas',
      'agua',
      'internet',
      'telefono',
      'celular',
      'edenor',
      'edesur',
      'metrogas',
      'aysa',
      'personal',
      'movistar',
      'claro',
      'fibertel',
    ],
    description: 'servicios de la casa: luz, gas, agua, internet y teléfono',
  },
  {
    id: 'vivienda',
    color: '#5b6a62',
    keywords: [
      'alquiler',
      'expensas',
      'abl',
      'mantenimiento',
      'plomero',
      'electricista',
      'ferreteria',
    ],
    description:
      'alquiler, expensas, impuestos de la vivienda y arreglos de la casa',
  },
  {
    id: 'salud',
    color: '#d64f6e',
    keywords: [
      'farmacia',
      'medico',
      'remedios',
      'prepaga',
      'osde',
      'swiss',
      'dentista',
      'odontologo',
      'analisis',
      'kinesiologo',
      'psicologo',
    ],
    description:
      'farmacia, remedios, médicos, dentista, prepaga y estudios médicos',
  },
  {
    id: 'entretenimiento',
    color: '#c9a227',
    keywords: [
      'cine',
      'teatro',
      'recital',
      'show',
      'juego',
      'steam',
      'playstation',
      'salida',
      'boliche',
      'museo',
    ],
    description: 'cine, teatro, recitales, videojuegos y salidas',
  },
  {
    id: 'ropa',
    color: '#d6784f',
    keywords: [
      'ropa',
      'zapatillas',
      'zapatos',
      'remera',
      'pantalon',
      'campera',
      'buzo',
      'zara',
      'nike',
      'adidas',
    ],
    description: 'ropa, calzado y accesorios',
  },
  {
    id: 'educacion',
    color: '#2b8a9e',
    keywords: [
      'curso',
      'facultad',
      'universidad',
      'colegio',
      'libros',
      'libreria',
      'udemy',
      'clases',
      'cuota',
    ],
    description: 'cursos, facultad, colegio, libros y materiales de estudio',
  },
  {
    id: 'suscripciones',
    color: '#6b5bd6',
    keywords: [
      'netflix',
      'spotify',
      'disney',
      'youtube',
      'hbo',
      'max',
      'prime',
      'icloud',
      'google one',
      'chatgpt',
    ],
    description:
      'suscripciones mensuales: streaming, música, almacenamiento en la nube',
  },
  {
    id: 'mascotas',
    color: '#9e7b2f',
    keywords: [
      'veterinaria',
      'veterinario',
      'balanceado',
      'perro',
      'gato',
      'mascota',
      'petshop',
    ],
    description:
      'veterinaria, vacunas, alimento para perros y gatos, peluquería canina',
  },
  {
    id: 'regalos',
    color: '#c2569b',
    keywords: ['regalo', 'cumpleaños', 'cumple', 'aniversario'],
    description: 'regalos para cumpleaños, aniversarios y fiestas',
  },
  {
    id: OTHER_CATEGORY_ID,
    color: '#8a978f',
    keywords: [],
    description: 'otros gastos que no entran en ninguna categoría',
  },
]

export function defaultCategories(now: number): Category[] {
  return DEFAULTS.map((c, order) => ({
    ...c,
    name: null,
    builtin: true,
    order,
    updatedAt: now,
  }))
}
