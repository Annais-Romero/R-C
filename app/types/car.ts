export interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  transmission: string;
  fuel: string;
  capacity: string;
  motor: string;
  price: number;
  image: string;
  type: string;
  created_at?: string;
  gallery: string[]; // 👈 ASEGÚRATE DE QUE ESTA LÍNEA ESTÉ EXACTAMENTE ASÍ
}