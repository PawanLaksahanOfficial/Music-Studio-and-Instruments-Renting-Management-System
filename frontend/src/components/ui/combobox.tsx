import { useState, type ReactNode } from 'react';
import { Command } from 'cmdk';
import { Check, ChevronsUpDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './menus';

export interface ComboboxOption {
    value: string;
    label: string;
    description?: string;
    /** Extra text matched by the search (e.g. phone, NIC, serial number). */
    keywords?: string[];
    disabled?: boolean;
    badge?: ReactNode;
}

interface BaseProps {
    options: ComboboxOption[];
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    id?: string;
    disabled?: boolean;
    loading?: boolean;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
}

const triggerClass =
    'flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-card px-3 py-2 text-left text-sm shadow-xs transition-[border-color,box-shadow] hover:border-muted-foreground/40 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-destructive';

const OptionList = ({ options, selected, onSelect, searchPlaceholder, emptyText, loading }: {
    options: ComboboxOption[];
    selected: (value: string) => boolean;
    onSelect: (value: string) => void;
    searchPlaceholder: string;
    emptyText: string;
    loading?: boolean;
}) => (
    <Command className="flex flex-col" loop>
        <div className="flex items-center gap-2 border-b px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <Command.Input placeholder={searchPlaceholder} className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
        </div>
        <Command.List className="max-h-72 overflow-y-auto overscroll-contain p-1">
            {loading ? (
                <Command.Loading><div className="p-3 text-sm text-muted-foreground">Loading…</div></Command.Loading>
            ) : (
                <Command.Empty className="p-4 text-center text-sm text-muted-foreground">{emptyText}</Command.Empty>
            )}
            {options.map(option => (
                <Command.Item
                    key={option.value}
                    value={option.value}
                    keywords={[option.label, ...(option.keywords ?? [])]}
                    disabled={option.disabled}
                    onSelect={onSelect}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent"
                >
                    <Check className={cn('size-4 shrink-0 text-primary', selected(option.value) ? 'opacity-100' : 'opacity-0')} aria-hidden />
                    <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{option.label}</div>
                        {option.description && <div className="truncate text-xs text-muted-foreground">{option.description}</div>}
                    </div>
                    {option.badge}
                </Command.Item>
            ))}
        </Command.List>
    </Command>
);

interface ComboboxProps extends BaseProps {
    value: string;
    onChange: (value: string) => void;
}

/** Searchable single select. */
export const Combobox = ({ options, value, onChange, placeholder = 'Select…', searchPlaceholder = 'Search…', emptyText = 'No results', disabled, loading, ...aria }: ComboboxProps) => {
    const [open, setOpen] = useState(false);
    const current = options.find(o => o.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen} modal>
            <PopoverTrigger asChild>
                <button type="button" role="combobox" aria-expanded={open} disabled={disabled} className={triggerClass} {...aria}>
                    {current ? (
                        <span className="min-w-0 truncate">
                            <span className="font-medium">{current.label}</span>
                            {current.description && <span className="ml-2 text-muted-foreground">{current.description}</span>}
                        </span>
                    ) : (
                        <span className="text-muted-foreground/80">{placeholder}</span>
                    )}
                    <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64">
                <OptionList
                    options={options}
                    selected={v => v === value}
                    onSelect={v => { onChange(v); setOpen(false); }}
                    searchPlaceholder={searchPlaceholder}
                    emptyText={emptyText}
                    loading={loading}
                />
            </PopoverContent>
        </Popover>
    );
};

interface MultiComboboxProps extends BaseProps {
    values: string[];
    onChange: (values: string[]) => void;
}

/** Searchable multi select with removable chips. */
export const MultiCombobox = ({ options, values, onChange, placeholder = 'Select…', searchPlaceholder = 'Search…', emptyText = 'No results', disabled, loading, ...aria }: MultiComboboxProps) => {
    const [open, setOpen] = useState(false);
    const selected = values.map(v => options.find(o => o.value === v)).filter((o): o is ComboboxOption => Boolean(o));
    const toggle = (value: string) => onChange(values.includes(value) ? values.filter(v => v !== value) : [...values, value]);

    return (
        <div className="flex flex-col gap-2">
            <Popover open={open} onOpenChange={setOpen} modal>
                <PopoverTrigger asChild>
                    <button type="button" role="combobox" aria-expanded={open} disabled={disabled} className={triggerClass} {...aria}>
                        <span className={cn('truncate', !selected.length && 'text-muted-foreground/80')}>
                            {selected.length ? `${selected.length} selected` : placeholder}
                        </span>
                        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64">
                    <OptionList
                        options={options}
                        selected={v => values.includes(v)}
                        onSelect={toggle}
                        searchPlaceholder={searchPlaceholder}
                        emptyText={emptyText}
                        loading={loading}
                    />
                </PopoverContent>
            </Popover>
            {selected.length > 0 && (
                <ul className="flex flex-wrap gap-1.5" aria-label="Selected">
                    {selected.map(option => (
                        <li key={option.value} className="inline-flex max-w-full items-center gap-1 rounded-lg border bg-secondary py-1 pl-2.5 pr-1 text-xs font-medium text-secondary-foreground">
                            <span className="truncate">{option.label}</span>
                            <button
                                type="button"
                                onClick={() => toggle(option.value)}
                                className="rounded-md p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
                                aria-label={`Remove ${option.label}`}
                            >
                                <X className="size-3.5" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
