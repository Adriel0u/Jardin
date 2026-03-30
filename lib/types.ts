export type Product = {
  id: number;
  producto: string;
  costo: string;
  venta: string;
  tipo: string;
  imagen?: string;
};

export type ProductInput = {
  producto: string;
  costo: string;
  venta: string;
  tipo?: string;
  imagen?: string;
};
