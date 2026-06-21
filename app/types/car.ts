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
  gallery?: string[]; // 👈 AGREGA ESTA LÍNEA (El ? aquí sí es para indicar opcional en TS)
  created_at?: string;
}