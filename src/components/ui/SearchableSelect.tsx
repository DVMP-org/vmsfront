"use client";

import React, { useMemo } from "react";
import Select, {
  Props as SelectProps,
  GroupBase,
  StylesConfig,
} from "react-select";
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
    const generatedId = React.useId();
    const selectedOption = useMemo(() => {
        if (isMulti && Array.isArray(value)) {
            return options.filter(opt => value.includes(opt.value));
        }
        return options.find(opt => opt.value === value) || null;
    }, [options, value, isMulti]);

    const customStyles: StylesConfig<
      SearchableSelectOption,
      IsMulti,
      GroupBase<SearchableSelectOption>
    > = {
        control: (base, state) => ({
            ...base,
            backgroundColor: "var(--vms-surface)",
            borderColor: state.isFocused
                ? "var(--vms-focus)"
                : "var(--vms-line-strong)",
            boxShadow: state.isFocused
                ? "0 0 0 2px color-mix(in srgb, var(--vms-focus) 20%, transparent)"
                : "none",
            '&:hover': {
                borderColor: state.isFocused
                    ? "var(--vms-focus)"
                    : "var(--vms-ink-muted)",
            },
            minHeight: "var(--vms-control-height)",
            borderRadius: "var(--vms-radius-control)",
            cursor: state.isDisabled ? "not-allowed" : "pointer",
            opacity: state.isDisabled ? 0.55 : 1,
            fontSize: "16px",
            transition: "border-color var(--vms-motion), box-shadow var(--vms-motion)",
            '@media (min-width: 768px)': {
                fontSize: "14px",
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
            color: 'var(--vms-ink-muted)',
            '&:hover': {
                color: 'var(--vms-ink)',
            },
        }),
        clearIndicator: (base) => ({
            ...base,
            padding: '8px',
            color: 'var(--vms-ink-muted)',
            '&:hover': {
                color: 'var(--vms-ink)',
            },
        }),
        menu: (base) => ({
            ...base,
            backgroundColor: 'var(--vms-surface)',
            border: '1px solid var(--vms-line)',
            boxShadow: 'var(--vms-shadow-overlay)',
            borderRadius: 'var(--vms-radius-surface)',
            zIndex: 50,
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected
                ? 'var(--vms-action)'
                : state.isFocused
                    ? 'var(--vms-surface-subtle)'
                    : 'transparent',
            color: state.isSelected ? 'var(--vms-on-action)' : 'var(--vms-ink)',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '10px 12px',
            '&:active': {
                backgroundColor: 'var(--vms-action)',
                color: 'var(--vms-on-action)',
            },
        }),
        placeholder: (base) => ({
            ...base,
            color: 'var(--vms-ink-muted)',
        }),
        singleValue: (base) => ({
            ...base,
            color: 'inherit',
        }),
        multiValue: (base) => ({
            ...base,
            backgroundColor: 'var(--vms-surface-subtle)',
            borderRadius: 'var(--vms-radius-control)',
        }),
        multiValueLabel: (base) => ({
            ...base,
            color: 'var(--vms-ink)',
            fontSize: '12px',
            padding: '2px 6px',
        }),
        multiValueRemove: (base) => ({
            ...base,
            color: 'var(--vms-ink-muted)',
            '&:hover': {
                backgroundColor: 'var(--vms-danger-subtle)',
                color: 'var(--vms-danger)',
            },
        }),
    };

    return (
        <div className={cn("w-full h-full", className)}>
            <Select
                instanceId={`searchable-select-${generatedId.replace(/:/g, "")}`}
                value={selectedOption as any}
                onChange={(newValue: any) => {
                    if (isMulti) {
                        onChange?.((newValue as SearchableSelectOption[]).map(opt => opt.value) as any);
                    } else {
                        onChange?.((newValue as SearchableSelectOption)?.value as any);
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

