import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, Check } from "lucide-react";

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Opções fixas exibidas no topo, fora da ordenação alfabética (ex: "Todos", "Selecione..."). */
  topOptions?: SearchableSelectOption[];
  /** Ordena as opções alfabeticamente (padrão: true). */
  sort?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  /** Classes do container (útil para definir largura). */
  className?: string;
  /** Classes do botão de exibição; substitui o estilo padrão. */
  triggerClassName?: string;
}

const DEFAULT_TRIGGER_CLASS =
  "w-full bg-slate-50 border border-slate-200 rounded-lg h-10 px-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white";

/** Remove acentos e converte para minúsculas, para busca insensível a acentuação. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  topOptions,
  sort = true,
  placeholder = "Selecione...",
  searchPlaceholder = "Digite para pesquisar...",
  className = "",
  triggerClassName = DEFAULT_TRIGGER_CLASS,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const sortedOptions = useMemo(() => {
    if (!sort) return options;
    return [...options].sort((a, b) =>
      a.label.localeCompare(b.label, "pt-BR", { sensitivity: "base" })
    );
  }, [options, sort]);

  const allOptions = useMemo(
    () => [...(topOptions ?? []), ...sortedOptions],
    [topOptions, sortedOptions]
  );

  const filteredOptions = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return allOptions;
    return allOptions.filter((opt) => normalize(opt.label).includes(q));
  }, [allOptions, query]);

  const selected = allOptions.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlight(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  const selectOption = (opt: SearchableSelectOption) => {
    onChange(opt.value);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filteredOptions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filteredOptions[highlight];
      if (opt) selectOption(opt);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${triggerClassName} text-left flex items-center justify-between gap-2`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`truncate ${selected ? "" : "text-slate-400"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute z-30 mt-1 w-full min-w-[220px] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="relative border-b border-slate-100">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-3 py-2 text-sm focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <ul ref={listRef} role="listbox" className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2.5 text-xs text-slate-400 text-center">
                Nenhum resultado encontrado.
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = opt.value === value;
                const isHighlighted = idx === highlight;
                return (
                  <li
                    key={`${opt.value}-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectOption(opt);
                    }}
                    onMouseEnter={() => setHighlight(idx)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 text-sm cursor-pointer ${
                      isHighlighted ? "bg-blue-50 text-blue-800" : "text-slate-700"
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
