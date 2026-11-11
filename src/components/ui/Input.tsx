"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { ErrorMessage } from "./form/ErrorMessage";
import { FormDescription } from "./form/FormDescription";
import { FormLabel } from "./label/FormLabel";

export const inputVariants = cva(
  [
    "h-full w-full min-w-0 border-0 bg-transparent p-0 text-base text-[var(--vms-ink)] caret-[var(--vms-ink)]",
    "placeholder:text-[var(--vms-ink-muted)] focus-visible:bg-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
    "disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
  ],
  {
    variants: {
      status: {
        default: "",
        error: "text-[var(--vms-danger)] placeholder:text-[var(--vms-danger)]",
        loading: "",
        prefilled: "",
        neutral: "",
      },
    },
    defaultVariants: {
      status: "default",
    },
  },
);

export interface BaseInnerInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const BaseInnerInput = React.forwardRef<HTMLInputElement, BaseInnerInputProps>(
  ({ className, status, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(inputVariants({ status }), className)}
      {...props}
    />
  ),
);
BaseInnerInput.displayName = "BaseInnerInput";

export const inputContainerVariants = cva(
  [
    "relative flex min-h-[var(--vms-control-height)] w-full items-center rounded-[var(--vms-radius-control)] border px-3 py-2",
    "text-base transition-[border-color,box-shadow,background-color] duration-[var(--vms-motion)]",
    "focus-within:border-[var(--vms-ink-muted)] focus-within:ring-2 focus-within:ring-[var(--vms-focus)] focus-within:ring-offset-1",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ],
  {
    variants: {
      status: {
        default:
          "border-[var(--vms-line-strong)] bg-[var(--vms-surface)] text-[var(--vms-ink)]",
        error:
          "border-[var(--vms-danger)] bg-[var(--vms-danger-subtle)] text-[var(--vms-danger)] focus-within:ring-[var(--vms-danger)]",
        loading:
          "border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink-muted)]",
        prefilled:
          "border-[var(--vms-line)] bg-[var(--vms-surface-subtle)] text-[var(--vms-ink)]",
        neutral:
          "border-transparent bg-transparent px-0 text-[var(--vms-ink)] focus-within:ring-0 focus-within:ring-offset-0",
      },
    },
    defaultVariants: {
      status: "default",
    },
  },
);

export const sideVariants = cva(
  "flex h-full min-w-10 items-center justify-center px-2 text-[var(--vms-ink-muted)]",
  {
    variants: {
      status: {
        default: "",
        error: "text-[var(--vms-danger)]",
        loading: "",
        prefilled: "",
        neutral: "min-w-0 px-0",
      },
    },
    defaultVariants: {
      status: "default",
    },
  },
);

export interface InputProps
  extends Omit<BaseInnerInputProps, "size">,
    VariantProps<typeof inputContainerVariants> {
  isLoading?: boolean;
  error?: string;
  leftNode?: React.ReactNode;
  rightNode?: React.ReactNode;
  sideNodeClassName?: string;
  label?: string;
  showAsterisk?: boolean;
  icon?: React.ElementType;
  description?: React.ReactNode;
  isContentSensitive?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      status = "default",
      disabled,
      error,
      isLoading,
      sideNodeClassName,
      showAsterisk,
      label,
      description,
      icon: Icon,
      leftNode,
      rightNode,
      isContentSensitive,
      id,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const generatedId = React.useId();
    const inputId = id || `input-${generatedId.replace(/:/g, "")}`;
    const descriptionId = description ? `${inputId}-description` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const describedBy = [ariaDescribedBy, descriptionId, errorId]
      .filter(Boolean)
      .join(" ") || undefined;

    let containerStatus: VariantProps<typeof inputContainerVariants>["status"] =
      status;
    if (error) containerStatus = "error";
    if (isLoading) containerStatus = "loading";
    if (disabled && !error) containerStatus = "prefilled";

    return (
      <div className="relative w-full space-y-1.5">
        {label && (
          <FormLabel
            htmlFor={inputId}
            showAsterisk={showAsterisk}
            error={error}
          >
            {label}
          </FormLabel>
        )}
        <div
          className={cn(
            inputContainerVariants({ status: containerStatus }),
            leftNode && status !== "neutral" ? "pl-0" : "",
            rightNode && status !== "neutral" ? "pr-0" : "",
            className,
          )}
        >
          {leftNode ? (
            <div
              className={cn(
                sideVariants({ status: containerStatus }),
                sideNodeClassName,
              )}
            >
              {leftNode}
            </div>
          ) : null}

          {Icon && !leftNode ? (
            <Icon
              aria-hidden="true"
              className="pointer-events-none absolute left-3 h-4 w-4 text-[var(--vms-ink-muted)]"
            />
          ) : null}

          <BaseInnerInput
            {...props}
            id={inputId}
            ref={ref}
            status={containerStatus}
            disabled={isLoading || disabled}
            aria-invalid={error ? true : ariaInvalid}
            aria-describedby={describedBy}
            aria-busy={isLoading || undefined}
            className={cn(
              Icon && !leftNode ? "pl-7" : "",
            )}
          />

          {rightNode ? (
            <div
              className={cn(
                sideVariants({ status: containerStatus }),
                sideNodeClassName,
              )}
            >
              {rightNode}
            </div>
          ) : null}
        </div>
        {description && (
          <FormDescription
            id={descriptionId}
            className="!font-normal text-xs leading-[18px] text-[var(--vms-ink-muted)]"
          >
            {description}
          </FormDescription>
        )}
        <ErrorMessage
          id={errorId}
          role="alert"
          className="text-xs font-medium text-[var(--vms-danger)]"
          error={error}
        />
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
