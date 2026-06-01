import React, { useCallback, useMemo } from "react";
import { Filter, RotateCcw } from "lucide-react";
import { FilterConfig, TransferType } from "../types";

interface FilterPanelProps {
  filter: FilterConfig;
  onFilterChange: (filter: FilterConfig) => void;
  onApply: () => void;
  onReset: () => void;
}

const TRANSFER_TYPES: TransferType[] = ["Bulk", "Isochronous", "Interrupt", "UAS"];

const FilterPanel: React.FC<FilterPanelProps> = ({
  filter,
  onFilterChange,
  onApply,
  onReset,
}) => {
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.transferTypes.length < 4) count++;
    if (filter.epAddr) count++;
    if (filter.deviceAddr) count++;
    if (filter.payloadLengthMin) count++;
    if (filter.payloadLengthMax) count++;
    if (filter.crcStatus !== "all") count++;
    return count;
  }, [filter]);

  const toggleTransferType = useCallback(
    (type: TransferType) => {
      const current = filter.transferTypes;
      const next = current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type];
      onFilterChange({ ...filter, transferTypes: next });
    },
    [filter, onFilterChange]
  );

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-analyzer-accent" />
          <span className="text-xs font-semibold text-analyzer-text">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-analyzer-accent text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button
          className="text-analyzer-text-dim hover:text-analyzer-text text-xs flex items-center gap-1"
          onClick={onReset}
        >
          <RotateCcw size={10} />
          Reset
        </button>
      </div>

      <div>
        <span className="label-text">Transfer Type</span>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {TRANSFER_TYPES.map((type) => (
            <label
              key={type}
              className={`flex items-center gap-1 text-xs px-2 py-1 rounded cursor-pointer border ${
                filter.transferTypes.includes(type)
                  ? "bg-analyzer-accent/20 border-analyzer-accent/50 text-analyzer-accent"
                  : "bg-analyzer-bg border-analyzer-border text-analyzer-text-dim"
              }`}
            >
              <input
                type="checkbox"
                className="hidden"
                checked={filter.transferTypes.includes(type)}
                onChange={() => toggleTransferType(type)}
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="label-text">Endpoint Address (hex)</label>
        <input
          type="text"
          className="input-field w-full mt-1"
          placeholder="e.g. 81 or 02"
          value={filter.epAddr}
          onChange={(e) => onFilterChange({ ...filter, epAddr: e.target.value.replace(/[^0-9a-fA-F]/g, "") })}
        />
      </div>

      <div>
        <label className="label-text">Device Address</label>
        <input
          type="text"
          className="input-field w-full mt-1"
          placeholder="e.g. 1"
          value={filter.deviceAddr}
          onChange={(e) => onFilterChange({ ...filter, deviceAddr: e.target.value.replace(/[^0-9]/g, "") })}
        />
      </div>

      <div>
        <label className="label-text">Payload Length Range</label>
        <div className="flex items-center gap-2 mt-1">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Min"
            value={filter.payloadLengthMin}
            onChange={(e) =>
              onFilterChange({ ...filter, payloadLengthMin: e.target.value.replace(/[^0-9]/g, "") })
            }
          />
          <span className="text-analyzer-text-dim text-xs">-</span>
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Max"
            value={filter.payloadLengthMax}
            onChange={(e) =>
              onFilterChange({ ...filter, payloadLengthMax: e.target.value.replace(/[^0-9]/g, "") })
            }
          />
        </div>
      </div>

      <div>
        <label className="label-text">CRC Status</label>
        <div className="flex gap-1.5 mt-1">
          {(["all", "valid", "invalid"] as const).map((status) => (
            <button
              key={status}
              className={`text-xs px-2 py-1 rounded border ${
                filter.crcStatus === status
                  ? "bg-analyzer-accent/20 border-analyzer-accent/50 text-analyzer-accent"
                  : "bg-analyzer-bg border-analyzer-border text-analyzer-text-dim"
              }`}
              onClick={() => onFilterChange({ ...filter, crcStatus: status })}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <button className="btn-primary w-full text-xs" onClick={onApply}>
        Apply Filters
      </button>
    </div>
  );
};

export default FilterPanel;
