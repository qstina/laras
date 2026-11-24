import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronDown, Search, Check, X, Edit3 } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  hasError?: boolean;
  allowCustom?: boolean;
  customOptionLabel?: string;
  customInputPlaceholder?: string;
}

export default function SearchableSelect({
  id,
  value,
  onChange,
  options,
  placeholder = 'Pilih pilihan...',
  searchPlaceholder = 'Cari...',
  emptyMessage = 'Tiada rekod ditemui.',
  icon,
  disabled = false,
  hasError = false,
  allowCustom = false,
  customOptionLabel = 'Lain-lain (Masukkan secara manual)',
  customInputPlaceholder = 'Masukkan nilai secara manual...',
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isCustomMode, setIsCustomMode] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Sync custom mode if an existing non-empty value isn't in predefined options
  useEffect(() => {
    if (!allowCustom) {
      setIsCustomMode(false);
      return;
    }
    if (value && options.length > 0 && !options.some((opt) => opt.value === value)) {
      setIsCustomMode(true);
    } else if (!value && options.length > 0) {
      setIsCustomMode(false);
    }
  }, [value, options, allowCustom]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [options, query]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
      return () => window.clearTimeout(timer);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectOption = (optionValue: string) => {
    setIsCustomMode(false);
    onChange(optionValue);
    setIsOpen(false);
    setQuery('');
  };

  const handleEnableCustomMode = () => {
    setIsCustomMode(true);
    setIsOpen(false);
    setQuery('');
    if (selectedOption) {
      onChange('');
    }
    window.setTimeout(() => {
      customInputRef.current?.focus();
    }, 20);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    const totalItems = filteredOptions.length + (allowCustom ? 1 : 0);

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (totalItems > 0 ? (prev + 1) % totalItems : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        totalItems > 0 ? (prev - 1 + totalItems) % totalItems : 0
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex < filteredOptions.length) {
        handleSelectOption(filteredOptions[highlightedIndex].value);
      } else if (allowCustom && highlightedIndex === filteredOptions.length) {
        handleEnableCustomMode();
      }
    }
  };

  if (isCustomMode && allowCustom) {
    return (
      <div ref={containerRef} className="relative">
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={customInputRef}
            id={id}
            type="text"
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={customInputPlaceholder}
            className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-16 py-2.5 bg-white border ${
              hasError ? 'border-rose/50 focus:border-rose focus:ring-rose/10' : 'border-slate-200 focus:border-ink/40 focus:ring-ink/5'
            } rounded-lg text-sm outline-none focus:ring-4 transition-all text-ink disabled:bg-slate-50 disabled:text-slate-400`}
          />
          {options.length > 0 && !disabled && (
            <button
              type="button"
              onClick={() => {
                setIsCustomMode(false);
                onChange('');
                setIsOpen(true);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-500 hover:text-ink bg-slate-100 hover:bg-slate-200/70 px-2 py-1 rounded transition-colors"
              title="Kembali ke senarai pilihan"
            >
              Senarai
            </button>
          )}
        </div>
      </div>
    );
  }

  const displayLabel = selectedOption ? selectedOption.label : value;

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full ${icon ? 'pl-9' : 'pl-3'} pr-8 py-2.5 bg-white border ${
          hasError
            ? 'border-rose/50 focus:border-rose focus:ring-rose/10'
            : isOpen
            ? 'border-ink/40 ring-4 ring-ink/5'
            : 'border-slate-200 hover:border-slate-300 focus:border-ink/40 focus:ring-4 focus:ring-ink/5'
        } rounded-lg text-sm text-left outline-none transition-all flex items-center justify-between disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer`}
      >
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </span>
        )}
        <span className={`truncate ${displayLabel ? 'text-ink' : 'text-slate-400'}`}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown
          size={15}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 transition-transform duration-150 ${
            isOpen ? 'rotate-180 text-ink' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-2 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-ink outline-none focus:border-ink/40 transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink"
                  aria-label="Padam carian"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          <ul
            ref={listRef}
            role="listbox"
            className="max-h-52 overflow-y-auto py-1 divide-y divide-slate-50"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-3 text-xs text-slate-400 text-center">{emptyMessage}</li>
            ) : (
              filteredOptions.map((option, idx) => {
                const isSelected = option.value === value;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectOption(option.value)}
                    className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                      isSelected
                        ? 'bg-ink/5 text-ink font-semibold'
                        : isHighlighted
                        ? 'bg-slate-50 text-ink'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{option.label}</p>
                      {option.sublabel && (
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">{option.sublabel}</p>
                      )}
                    </div>
                    {isSelected && <Check size={14} className="text-ink shrink-0" />}
                  </li>
                );
              })
            )}

            {allowCustom && (
              <li
                role="option"
                aria-selected={false}
                onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                onClick={handleEnableCustomMode}
                className={`px-3 py-2 text-xs cursor-pointer flex items-center gap-2 border-t border-slate-100 transition-colors ${
                  highlightedIndex === filteredOptions.length
                    ? 'bg-slate-100 text-ink font-medium'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-ink'
                }`}
              >
                <Edit3 size={12} className="shrink-0" />
                <span>{customOptionLabel}</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}