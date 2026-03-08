"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { type VariantProps } from "class-variance-authority";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import Select, {
    GroupBase,
    OnChangeValue,
    Props as SelectProps,
    StylesConfig,
    components,
} from "react-select";
import { cn } from "@/lib/utils";
import { inputContainerVariants } from "./Input";
import { ErrorMessage } from "./form/ErrorMessage";
import { FormDescription } from "./form/FormDescription";
import { FormLabel } from "./label/FormLabel";

export interface SearchableSelectOption {
    value: string;
    label: string;
}

export interface SearchableSelectProps<IsMulti extends boolean = false> extends Omit<SelectProps<SearchableSelectOption, IsMulti, GroupBase<SearchableSelectOption>>, 'onChange' | 'value' | 'inputId' | 'instanceId'> {
    value?: IsMulti extends true ? string[] : string;
    onChange?: (value: IsMulti extends true ? string[] : string | undefined) => void;
    options: SearchableSelectOption[];
    placeholder?: string;
    className?: string;
    label?: string;
    error?: string;
    description?: React.ReactNode;
    showAsterisk?: boolean;
    id?: string;
    status?: VariantProps<typeof inputContainerVariants>["status"];
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
    label,
    error,
    description,
    showAsterisk,
    id,
    status = "default",
    isClearable = true,
    isDisabled = false,
    isMulti,
    styles,
    menuPortalTarget,
    isLoading,
    ...props
}: SearchableSelectProps<IsMulti>) {
    const generatedId = useId().replace(/:/g, "");
    const inputId = id ?? `searchable-select-${generatedId}`;
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setPortalTarget(document.body);
    }, []);

    const selectedOption = useMemo(() => {
        if (isMulti && Array.isArray(value)) {
            return options.filter(opt => value.includes(opt.value));
        }
        return options.find(opt => opt.value === value) || null;
    }, [options, value, isMulti]);

    let containerStatus: VariantProps<typeof inputContainerVariants>["status"] = status;

    if (error) containerStatus = "error";
    if (isLoading) containerStatus = "loading";
    if (isDisabled) containerStatus = "prefilled";

    const mergedStyles: StylesConfig<SearchableSelectOption, IsMulti, GroupBase<SearchableSelectOption>> = {
        ...styles,
        menuPortal: (base, state) => {
            const userStyles = styles?.menuPortal?.(base, state) ?? base;

            return {
                ...userStyles,
                zIndex: Math.max(Number(userStyles.zIndex ?? 0), 90),
            };
        },
    };

    const handleChange = (newValue: OnChangeValue<SearchableSelectOption, IsMulti>) => {
        if (isMulti) {
            onChange?.((((newValue as SearchableSelectOption[] | null) ?? []).map((option) => option.value)) as IsMulti extends true ? string[] : never);
            return;
        }

        onChange?.(((newValue as SearchableSelectOption | null)?.value) as IsMulti extends true ? never : string | undefined);
    };

    return (
        <div className={cn("relative w-full", label || description || error ? "space-y-1" : "h-full", className)}>
            {label ? (
                <FormLabel formItemId={inputId} showAsterisk={showAsterisk} error={error}>
                    {label}
                </FormLabel>
            ) : null}

            <Select
                unstyled
                inputId={inputId}
                instanceId={inputId}
                aria-invalid={!!error}
                value={selectedOption as never}
                onChange={handleChange}
                options={options}
                placeholder={placeholder}
                isClearable={isClearable}
                isDisabled={isDisabled}
                isLoading={isLoading}
                isMulti={isMulti}
                closeMenuOnSelect={props.closeMenuOnSelect ?? !isMulti}
                hideSelectedOptions={props.hideSelectedOptions ?? false}
                menuPortalTarget={menuPortalTarget ?? portalTarget}
                menuPosition={props.menuPosition ?? ((menuPortalTarget ?? portalTarget) ? "fixed" : "absolute")}
                styles={mergedStyles}
                components={{
                    DropdownIndicator: (indicatorProps) => (
                        <components.DropdownIndicator {...indicatorProps}>
                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", indicatorProps.selectProps.menuIsOpen && "rotate-180")} />
                        </components.DropdownIndicator>
                    ),
                    ClearIndicator: (indicatorProps) => (
                        <components.ClearIndicator {...indicatorProps}>
                            <X className="h-3.5 w-3.5" />
                        </components.ClearIndicator>
                    ),
                    LoadingIndicator: (indicatorProps) => (
                        <components.LoadingIndicator {...indicatorProps}>
                            <Loader2 className="h-4 w-4 animate-spin" />
                        </components.LoadingIndicator>
                    ),
                    Option: (optionProps) => (
                        <components.Option {...optionProps}>
                            <div className="flex items-center justify-between gap-3">
                                <span className="truncate">{optionProps.label}</span>
                                {optionProps.isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                            </div>
                        </components.Option>
                    ),
                    ...props.components,
                }}
                classNames={{
                    container: () => "h-full w-full",
                    control: (state) =>
                        cn(
                            inputContainerVariants({ status: containerStatus }),
                            "min-h-10 h-full cursor-text gap-2 px-3 py-2",
                            state.isDisabled && "cursor-not-allowed opacity-70",
                            state.menuIsOpen && "border-primary-main dark:border-[#9299A2]"
                        ),
                    valueContainer: () => "flex h-full flex-1 flex-wrap items-center gap-1 overflow-hidden p-0",
                    input: () => "m-0 p-0 text-sm text-[#191919] dark:text-white ",
                    placeholder: () => "m-0 truncate text-sm text-[#C4C4C4] dark:text-[#9299A2]",
                    singleValue: () => "m-0 truncate text-sm text-[#191919] dark:text-white",
                    indicatorsContainer: () => "flex h-full items-center gap-1 self-stretch",
                    indicatorSeparator: () => "hidden",
                    clearIndicator: () => "flex h-8 w-8 items-center justify-center rounded-sm text-[#79818C] transition-colors hover:bg-black/5 hover:text-[#475569] dark:hover:bg-white/10 dark:hover:text-white/80",
                    dropdownIndicator: (state) =>
                        cn(
                            "flex h-8 w-8 items-center justify-center rounded-sm text-[#79818C] transition-colors hover:bg-black/5 hover:text-[#475569] dark:hover:bg-white/10 dark:hover:text-white/80",
                            state.isFocused && "text-primary-main dark:text-white"
                        ),
                    loadingIndicator: () => "flex h-8 w-8 items-center justify-center text-[#79818C]",
                    menu: () => "mt-1 overflow-hidden rounded-[10px] border border-[#DEDEDE] bg-white p-1 shadow-[0_20px_60px_rgba(15,23,42,0.18)] dark:border-white/15 dark:bg-[#101828]",
                    menuList: () => "max-h-64 space-y-1 overflow-y-auto ",
                    option: (state) =>
                        cn(
                            "cursor-pointer rounded-[5px] px-3 py-2 text-sm font-medium transition-colors",
                            state.isSelected
                                ? "bg-[rgb(var(--brand-primary))] text-white"
                                : state.isFocused
                                    ? "bg-[#F6F8FB] text-[#191919] dark:bg-white/10 dark:text-white"
                                    : "text-[#191919] dark:text-white/90"
                        ),
                    noOptionsMessage: () => "px-3 py-2 text-sm text-[#79818C] dark:text-[#9299A2]",
                    loadingMessage: () => "px-3 py-2 text-sm text-[#79818C] dark:text-[#9299A2]",
                    multiValue: () => "m-0.5 inline-flex items-center gap-1 rounded-md bg-[rgb(var(--brand-primary)/0.10)] px-1.5 py-1 text-[13px] dark:bg-white/10",
                    multiValueLabel: () => "px-0 py-0 text-[13px] font-medium text-[rgb(var(--brand-primary))] dark:text-white",
                    multiValueRemove: () => "ml-0.5 flex h-4 w-4 items-center justify-center rounded-sm text-[rgb(var(--brand-primary))] transition-colors hover:bg-[rgb(var(--brand-primary)/0.10)] hover:text-[rgb(var(--brand-primary))] dark:text-white dark:hover:bg-white/10",
                }}
                {...props}
            />

            {description ? (
                <FormDescription className="text-muted-foreground text-sm !font-normal">
                    {description}
                </FormDescription>
            ) : null}

            <ErrorMessage error={error} />
        </div>
    );
}

