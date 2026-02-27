"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";

interface TransferFilterBarProps {
  fromValue: string;
  toValue: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onSwap: () => void;
  onClear: () => void;
  fromOptions: string[];
  toOptions: string[];
}

export default function TransferFilterBar({
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  onSwap,
  onClear,
  fromOptions,
  toOptions,
}: TransferFilterBarProps) {
  const [fromFocused, setFromFocused] = useState(false);
  const [toFocused, setToFocused] = useState(false);
  const [fromInputValue, setFromInputValue] = useState(fromValue);
  const [toInputValue, setToInputValue] = useState(toValue);

  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const fromDropdownRef = useRef<HTMLDivElement>(null);
  const toDropdownRef = useRef<HTMLDivElement>(null);

  // Debounce timer refs
  const fromTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync controlled values with local state
  useEffect(() => {
    setFromInputValue(fromValue);
  }, [fromValue]);

  useEffect(() => {
    setToInputValue(toValue);
  }, [toValue]);

  // Filtered suggestions
  const fromSuggestions = useMemo(() => {
    if (!fromInputValue) return fromOptions;
    const query = fromInputValue.toLowerCase();
    return fromOptions.filter((option) =>
      option.toLowerCase().includes(query)
    );
  }, [fromInputValue, fromOptions]);

  const toSuggestions = useMemo(() => {
    if (!toInputValue) return toOptions;
    const query = toInputValue.toLowerCase();
    return toOptions.filter((option) =>
      option.toLowerCase().includes(query)
    );
  }, [toInputValue, toOptions]);

  // Handle input change with debounce
  const handleFromInput = useCallback(
    (value: string) => {
      setFromInputValue(value);

      // Clear previous timer
      if (fromTimerRef.current) {
        clearTimeout(fromTimerRef.current);
      }

      // Debounce the actual filter update
      fromTimerRef.current = setTimeout(() => {
        onFromChange(value);
      }, 200);
    },
    [onFromChange]
  );

  const handleToInput = useCallback(
    (value: string) => {
      setToInputValue(value);

      // Clear previous timer
      if (toTimerRef.current) {
        clearTimeout(toTimerRef.current);
      }

      // Debounce the actual filter update
      toTimerRef.current = setTimeout(() => {
        onToChange(value);
      }, 200);
    },
    [onToChange]
  );

  // Handle suggestion click
  const handleFromSuggestionClick = useCallback(
    (suggestion: string) => {
      setFromInputValue(suggestion);
      onFromChange(suggestion);
      setFromFocused(false);
      fromInputRef.current?.blur();
    },
    [onFromChange]
  );

  const handleToSuggestionClick = useCallback(
    (suggestion: string) => {
      setToInputValue(suggestion);
      onToChange(suggestion);
      setToFocused(false);
      toInputRef.current?.blur();
    },
    [onToChange]
  );

  // Handle swap
  const handleSwapClick = useCallback(() => {
    setFromInputValue(toValue);
    setToInputValue(fromValue);
    onSwap();
  }, [fromValue, toValue, onSwap]);

  // Handle clear
  const handleClearClick = useCallback(() => {
    setFromInputValue("");
    setToInputValue("");
    onClear();
  }, [onClear]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fromDropdownRef.current &&
        !fromDropdownRef.current.contains(event.target as Node) &&
        !fromInputRef.current?.contains(event.target as Node)
      ) {
        setFromFocused(false);
      }
      if (
        toDropdownRef.current &&
        !toDropdownRef.current.contains(event.target as Node) &&
        !toInputRef.current?.contains(event.target as Node)
      ) {
        setToFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (fromTimerRef.current) clearTimeout(fromTimerRef.current);
      if (toTimerRef.current) clearTimeout(toTimerRef.current);
    };
  }, []);

  const hasActiveFilters = fromInputValue || toInputValue;
  const showFromDropdown = fromFocused && fromSuggestions.length > 0;
  const showToDropdown = toFocused && toSuggestions.length > 0;

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          {/* From Input */}
          <div className="flex-1 w-full sm:w-auto relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From
            </label>
            <div className="relative">
              <input
                ref={fromInputRef}
                type="text"
                value={fromInputValue}
                onChange={(e) => handleFromInput(e.target.value)}
                onFocus={() => setFromFocused(true)}
                placeholder="e.g., Narita Airport"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
              />
              {fromInputValue && (
                <button
                  onClick={() => handleFromInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear from"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            {/* From Dropdown */}
            {showFromDropdown && (
              <div
                ref={fromDropdownRef}
                className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {fromSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleFromSuggestionClick(suggestion)}
                    className="w-full px-4 py-2.5 text-left hover:bg-blue-50 focus:bg-blue-50 outline-none transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Swap Button */}
          <button
            onClick={handleSwapClick}
            className="flex-shrink-0 px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors self-stretch sm:self-auto"
            aria-label="Swap from and to"
            title="Swap From and To"
          >
            <svg
              className="w-5 h-5 mx-auto text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </button>

          {/* To Input */}
          <div className="flex-1 w-full sm:w-auto relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To
            </label>
            <div className="relative">
              <input
                ref={toInputRef}
                type="text"
                value={toInputValue}
                onChange={(e) => handleToInput(e.target.value)}
                onFocus={() => setToFocused(true)}
                placeholder="e.g., Tokyo"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
              />
              {toInputValue && (
                <button
                  onClick={() => handleToInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear to"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>

            {/* To Dropdown */}
            {showToDropdown && (
              <div
                ref={toDropdownRef}
                className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {toSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleToSuggestionClick(suggestion)}
                    className="w-full px-4 py-2.5 text-left hover:bg-blue-50 focus:bg-blue-50 outline-none transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearClick}
              className="flex-shrink-0 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition-colors self-stretch sm:self-auto"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
