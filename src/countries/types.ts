export interface CountryApiResponse {
  name: string;
  flag: string;
  capital?: string;
  region: string;
  population: number;
  languages?: { name: string }[];
  area?: number;
  borders?: string[];
  currencies?: { name: string }[];
}

export interface Country {
  name: string;
  flag: string;
  capital: string | null;
  region: string;
  population: number;
  languages: string[];
  area: number | null;
  borders: string[];
  currencies: string[];
}
