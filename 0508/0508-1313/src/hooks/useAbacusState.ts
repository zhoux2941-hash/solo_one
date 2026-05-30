import { useState, useCallback } from 'react';
import type { AbacusState, AbacusType, BeadColumn } from '../types';
import { createInitialAbacusState, calculateTotalValue, toggleBead, clearAbacus, setNumberOnAbacus } from '../utils/abacusMath';

export const useAbacusState = (initialType: AbacusType = '2-5', initialColumns: number = 8) => {
  const [abacusState, setAbacusState] = useState<AbacusState>(() =>
    createInitialAbacusState(initialType, initialColumns)
  );

  const updateValue = useCallback((beads: BeadColumn[], type: AbacusType) => {
    const value = calculateTotalValue(beads, type);
    setAbacusState(prev => ({
      ...prev,
      beads,
      currentValue: value,
      displayValue: value.toLocaleString('zh-CN'),
    }));
  }, []);

  const handleToggleBead = useCallback((columnIndex: number, beadType: 'upper' | 'lower', beadIndex: number) => {
    const newBeads = toggleBead(abacusState.beads, abacusState.type, columnIndex, beadType, beadIndex);
    updateValue(newBeads, abacusState.type);
  }, [abacusState.beads, abacusState.type, updateValue]);

  const handleClear = useCallback(() => {
    const newBeads = clearAbacus(abacusState.beads, abacusState.type);
    updateValue(newBeads, abacusState.type);
  }, [abacusState.beads, abacusState.type, updateValue]);

  const handleSetNumber = useCallback((number: number) => {
    const newBeads = setNumberOnAbacus(abacusState.beads, abacusState.type, number);
    updateValue(newBeads, abacusState.type);
  }, [abacusState.beads, abacusState.type, updateValue]);

  const handleSetBeads = useCallback((beads: BeadColumn[]) => {
    updateValue(beads, abacusState.type);
  }, [abacusState.type, updateValue]);

  const handleSwitchType = useCallback((type: AbacusType) => {
    const newState = createInitialAbacusState(type, abacusState.columns);
    setAbacusState(newState);
  }, [abacusState.columns]);

  return {
    abacusState,
    toggleBead: handleToggleBead,
    clearAbacus: handleClear,
    setNumber: handleSetNumber,
    setBeads: handleSetBeads,
    switchType: handleSwitchType,
  };
};
