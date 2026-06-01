import { useMemo } from "react";
import { useSimulationStore } from "@/store/useSimulationStore";
import {
  computeIntensityCurve,
  principalMaxima,
  missingOrders,
  maxObservableOrder,
  type DiffractionParams,
} from "@/utils/diffraction";

export function useDiffraction() {
  const { d, a, N, lambda, showEnvelopeOnly } = useSimulationStore();

  const params: DiffractionParams = useMemo(
    () => ({ d, a, N, lambda }),
    [d, a, N, lambda]
  );

  const curveData = useMemo(() => computeIntensityCurve(params), [params]);

  const maxima = useMemo(() => principalMaxima(params), [params]);

  const missing = useMemo(() => missingOrders(params), [params]);

  const maxOrder = useMemo(() => maxObservableOrder(params), [params]);

  const displayData = useMemo(() => {
    if (showEnvelopeOnly) {
      return curveData.map((p) => ({
        ...p,
        intensity: p.envelope,
      }));
    }
    return curveData;
  }, [curveData, showEnvelopeOnly]);

  return {
    params,
    curveData: displayData,
    rawCurveData: curveData,
    maxima,
    missing,
    maxOrder,
  };
}
