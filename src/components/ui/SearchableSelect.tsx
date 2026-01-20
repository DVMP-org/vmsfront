"use client";

import React, { useMemo } from "react";
import Select, { Props as SelectProps, GroupBase, StylesConfig, SingleValue } from "react-select";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
    value: string;
    label: string;
}

export interface SearchableSelectProps<IsMulti extends boolean = false> extends Omit<SelectProps<SearchableSelectOption, IsMulti, GroupBase<SearchableSelectOption>>, 'onChange' | 'value'> {
    value?: IsMulti extends true ? string[] : string;
    onChange?: (value: IsMulti extends true ? string[] : string | undefined) => void;
    options: SearchableSelectOption[];
    placeholder?: string;
    className?: string;
    isClearable?: boolean;
    isDisabled?: boolean;
    isMulti?: IsMulti;
}

export function SearchableSelect<IsMulti extends boolean = false>({
    value,
    onChange,
    options,
    placeholder = "Select...",
    className,
    isClearable = true,
    isDisabled = false,
    isMulti,
    ...props
}: SearchableSelectProps<IsMulti>) {
    const selectedOption = useMemo(() => {
        if (isMulti && Array.isArray(value)) {
            return options.filter(opt => value.includes(opt.value));
        }
        return options.find(opt => opt.value === value) || null;
    }, [options, value, isMulti]);

    const customStyles: StylesConfig<SearchableSelectOption, IsMulti, GroupBase<SearchableSelectOption>> = {
        control: (base, state) => ({
            ...base,
            backgroundColor: 'transparent',
            borderColor: state.isFocused ? 'rgb(var(--brand-primary,#1e40af))' : 'bg-white/60',
            boxShadow: 'none',
            '&:hover': {
                borderColor: state.isFocused ? 'rgb(var(--brand-primary,#1e40af))' : 'bg-white/60',
            },
            minHeight: '36px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            '@media (min-width: 640px)': {
                fontSize: '14px',
            },
        }),
        valueContainer: (base) => ({
            ...base,
            padding: '2px 8px',
        }),
        input: (base) => ({
            ...base,
            margin: '0',
            padding: '0',
            color: 'inherit',
        }),
        indicatorSeparator: () => ({
            display: 'none',
        }),
        dropdownIndicator: (base) => ({
            ...base,
            padding: '8px',
            color: '#79818C',
            '&:hover': {
                color: '#475569',
            },
        }),
        clearIndicator: (base) => ({
            ...base,
            padding: '8px',
            color: '#79818C',
            '&:hover': {
                color: '#475569',
            },
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: '#fff dark:hsl(240 6% 10% / 1)',
            border: '1px solid bg-white/60',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            borderRadius: '4px',
            zIndex: 50,
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? 'rgb(var(--brand-primary,#1e40af))'
                : state.isFocused
                    ? 'rgba(var(--brand-primary,#1e40af), 0.1)'
                    : 'transparent',
            color: state.isSelected ? 'dark:#191919' : 'dark:#fff',
            cursor: 'pointer',
            fontSize: '12px',
            '@media (min-width: 640px)': {
                fontSize: '14px',
            },
            '&:active': {
                backgroundColor: 'rgb(var(--brand-primary,#1e40af))',
                color: '#fff',
            },
        }),
        placeholder: (base) => ({
            ...base,
            color: '#C4C4C4',
        }),
        singleValue: (base) => ({
            ...base,
            color: 'inherit',
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: 'rgba(var(--brand-primary,#1e40af), 0.1)',
            borderRadius: '2px',
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: 'rgb(var(--brand-primary,#1e40af))',
            fontSize: '12px',
            padding: '2px 6px',
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: 'rgb(var(--brand-primary,#1e40af))',
            '&:hover': {
                backgroundColor: 'rgba(var(--brand-primary,#1e40af), 0.2)',
                color: 'rgb(var(--brand-primary,#1e40af))',
            },
        }),
    };

    return (
        <div className={cn("w-full h-full", className)}>
            <Select
                instanceId={useMemo(() => Math.random().toString(36).substr(2, 9), [])}
                value={selectedOption as any}
                onChange={(newValue: any) => {
                    if (isMulti) {
                    if (isMulti) {
                        onChange?.((newValue ? (newValue as SearchableSelectOption[]).map(opt => opt.value) : []) as any);
                    } else {
                    }
                }}
                options={options}
                placeholder={placeholder}
                isClearable={isClearable}
                isDisabled={isDisabled}
                isMulti={isMulti}
                styles={customStyles}
                classNamePrefix="react-select"
                {...props}
            />
        </div>
    );
}

