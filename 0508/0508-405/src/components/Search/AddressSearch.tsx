import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { Address } from '../../types';

interface AddressSearchProps {
  addresses: Address[];
  onSearch: (address: Address | null) => void;
  currentAddress: Address | null;
}

export const AddressSearch: React.FC<AddressSearchProps> = ({
  addresses,
  onSearch,
  currentAddress,
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filteredAddresses = addresses.filter((addr) =>
    addr.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (address: Address) => {
    setQuery(address.name);
    setShowSuggestions(false);
    onSearch(address);
  };

  const handleClear = () => {
    setQuery('');
    onSearch(null);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filteredAddresses.length > 0) {
              handleSelect(filteredAddresses[0]);
            }
          }}
          placeholder="输入地址，如：文化路与建设路交叉口"
          className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
        />
        {currentAddress && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {showSuggestions && query && filteredAddresses.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto z-20"
        >
          {filteredAddresses.map((address, index) => (
            <button
              key={index}
              onClick={() => handleSelect(address)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
            >
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700">{address.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
