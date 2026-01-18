"use client";

import React, { useMemo } from "react";
import Select, { Props as SelectProps, GroupBase, StylesConfig, SingleValue } from "react-select";
import { cn } from "@/lib/utils";

export interface SearchableSelectOption {
    value: string;
    label: string;
}

export interface SearchableSelectProps extends Omit<SelectProps<SearchableSelectOption, false, GroupBase<SearchableSelectOption>>, 'onChange' | 'value'> {
    value?: string;
    onChange?: (value: string | undefined) => void;
    options: SearchableSelectOption[];
    placeholder?: string;
    className?: string;
    isClearable?: boolean;
    isDisabled?: boolean;
}

export function SearchableSelect({
    value,
    onChange,
    options,
    placeholder = "Select...",
    className,
    isClearable = true,
    isDisabled = false,
    ...props
}: SearchableSelectProps) {
    const selectedOption = useMemo(() =>
        options.find(opt => opt.value === value) || null,
        [options, value]);

    const customStyles: StylesConfig<SearchableSelectOption, false, GroupBase<SearchableSelectOption>> = {
        control: (base, state) => ({
            ...base,
            backgroundColor: 'transparent',
            borderColor: state.isFocused ? 'rgb(var(--brand-primary,#1e40af))' : '#DEDEDE',
            boxShadow: 'none',
            '&:hover': {
                borderColor: state.isFocused ? 'rgb(var(--brand-primary,#1e40af))' : '#DEDEDE',
            },
            minHeight: '36px',
            height: '36px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            '@media (min-width: 640px)': {
                fontSize: '14px',
            },
        }),
        valueContainer: (base) => ({
            ...base,
            padding: '0 8px',
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
            backgroundColor: '#fff',
            border: '1px solid #DEDEDE',
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
            color: state.isSelected ? '#fff' : '#191919',
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
    };

    return (
        <div className={cn("w-full h-full", className)}>
            <Select
                instanceId={useMemo(() => Math.random().toString(36).substr(2, 9), [])}
                value={selectedOption}
                onChange={(option: SingleValue<SearchableSelectOption>) => {
                    onChange?.(option ? option.value : undefined);
                }}
                options={options}
                placeholder={placeholder}
                isClearable={isClearable}
                isDisabled={isDisabled}
                styles={customStyles}
                classNamePrefix="react-select"
                {...props}
            />
        </div>
    );
}
