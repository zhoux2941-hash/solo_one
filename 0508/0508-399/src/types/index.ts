export interface Period {
  id: string;
  name: string;
  yearRange: string;
  description: string;
  fontFeatures: string[];
}

export interface Plaque {
  id: string;
  periodId: string;
  name: string;
  shopName: string;
  dynasty: string;
  fontType: string;
  imageUrl: string;
  description: string;
  calligrapher?: string;
}
