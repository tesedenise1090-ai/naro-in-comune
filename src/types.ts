export interface MunicipalInfo {
  name: string;
  province: string;
  region: string;
  mayor: string;
  population: number;
  areaSqKm: number;
  elevationMeters: number;
  postalCode: string;
  istatCode: string;
  cadastralCode: string;
  contacts: {
    phone: string;
    email: string;
    pec: string;
    address: string;
  };
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}
