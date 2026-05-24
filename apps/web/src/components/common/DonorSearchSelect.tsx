import React, { useEffect, useRef, useState } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface DonorSearchOption {
  id: string;
  fullName: { en: string; ar: string };
}

interface DonorSearchSelectProps {
  donors: DonorSearchOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  dir: string;
  inputClass?: string;
  label?: string;
  placeholder: string;
  noResultsText: string;
  disabled?: boolean;
}

const DonorSearchSelect: React.FC<DonorSearchSelectProps> = ({
  donors,
  selectedId,
  onSelect,
  dir,
  inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-dark-foreground',
  label,
  placeholder,
  noResultsText,
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const langKey = dir === 'rtl' ? 'ar' : 'en';
  const getDonorName = (d: DonorSearchOption) => d.fullName[langKey] || d.fullName.en;

  const selectedDonor = donors.find((d) => d.id === selectedId);

  const filtered = query.trim()
    ? donors.filter((d) => getDonorName(d).toLowerCase().includes(query.toLowerCase()))
    : donors;

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex, open]);

  const handleSelect = (id: string) => {
    onSelect(id);
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[highlightIndex]) handleSelect(filtered[highlightIndex].id);
        break;
      case 'Escape':
        setOpen(false);
        setQuery('');
        break;
    }
  };

  const control = (
    <div ref={containerRef} className="relative">
      {selectedDonor && !open ? (
        <div
          className={`${inputClass} flex items-center justify-between gap-2 cursor-pointer ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
          onClick={() => {
            if (disabled) return;
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
        >
          <span className="truncate">{getDonorName(selectedDonor)}</span>
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect('');
              }}
              className="shrink-0 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-slate-600"
            >
              <X className="w-3.5 h-3.5 text-gray-400" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute start-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            disabled={disabled}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (!selectedId) setOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`${inputClass} ps-8 pe-8 disabled:opacity-60`}
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
          />
          <ChevronDown
            className={`absolute end-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      )}

      {open && !disabled && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-600 shadow-lg py-1"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-gray-400 text-center">{noResultsText}</li>
          ) : (
            filtered.map((donor, idx) => (
              <li
                key={donor.id}
                role="option"
                aria-selected={donor.id === selectedId}
                className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer text-start ${
                  idx === highlightIndex
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                    : 'text-foreground dark:text-dark-foreground hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
                onMouseEnter={() => setHighlightIndex(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(donor.id);
                }}
              >
                {donor.id === selectedId && <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" />}
                <span className={donor.id !== selectedId ? 'ps-[22px]' : ''}>{getDonorName(donor)}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );

  if (label) {
    return (
      <div className="block min-w-0">
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{label}</span>
        <div className="mt-1">{control}</div>
      </div>
    );
  }

  return control;
};

export default DonorSearchSelect;
