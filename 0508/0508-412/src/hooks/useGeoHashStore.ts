import { create } from "zustand";
import type { GeoHashResult, BBox } from "@/utils/geohash";

interface GeoHashState {
  mode: "encode" | "decode" | "batch";
  lat: string;
  lng: string;
  precision: number;
  geoHashInput: string;
  batchInput: string;

  encodeResult: GeoHashResult | null;
  decodeResult: GeoHashResult | null;
  neighbors: Record<string, string>;
  batchResults: GeoHashResult[];

  setMode: (mode: "encode" | "decode" | "batch") => void;
  setLat: (lat: string) => void;
  setLng: (lng: string) => void;
  setPrecision: (precision: number) => void;
  setGeoHashInput: (hash: string) => void;
  setBatchInput: (input: string) => void;
  setEncodeResult: (result: GeoHashResult | null) => void;
  setDecodeResult: (result: GeoHashResult | null) => void;
  setNeighbors: (neighbors: Record<string, string>) => void;
  setBatchResults: (results: GeoHashResult[]) => void;
  applyPreset: (lat: number, lng: number) => void;
}

export const useGeoHashStore = create<GeoHashState>((set) => ({
  mode: "encode",
  lat: "39.9042",
  lng: "116.4074",
  precision: 6,
  geoHashInput: "",
  batchInput: "",
  encodeResult: null,
  decodeResult: null,
  neighbors: {},
  batchResults: [],

  setMode: (mode) => set({ mode }),
  setLat: (lat) => set({ lat }),
  setLng: (lng) => set({ lng }),
  setPrecision: (precision) => set({ precision }),
  setGeoHashInput: (geoHashInput) => set({ geoHashInput }),
  setBatchInput: (batchInput) => set({ batchInput }),
  setEncodeResult: (encodeResult) => set({ encodeResult }),
  setDecodeResult: (decodeResult) => set({ decodeResult }),
  setNeighbors: (neighbors) => set({ neighbors }),
  setBatchResults: (batchResults) => set({ batchResults }),
  applyPreset: (lat, lng) => set({ lat: String(lat), lng: String(lng), mode: "encode" }),
}));
