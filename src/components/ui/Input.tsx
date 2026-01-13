"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ErrorMessage } from "./form/ErrorMessage";
import { FormDescription } from "./form/FormDescription";
import { FormLabel } from "./label/FormLabel";

export const inputVariants = cva(
  "!p-0 flex h-full w-full !border-transparent !bg-transparent text-base focus-visible:bg-transparent focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      status: {
        default: "placeholder:text-[#C4C4C4] dark:placeholder:text-[#9299A2]",
        error: "placeholder:text-red-500 text-red-500",
        loading: "placeholder:text-[#C4C4C4] dark:placeholder:text-[#9299A2]",
        prefilled: "",
        neutral: "",
      },
    },
    defaultVariants: {
      status: "default",
    },
  }
);

export interface BaseInnerInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
  VariantProps<typeof inputVariants> { }

const BaseInnerInput = React.forwardRef<HTMLInputElement, BaseInnerInputProps>(
  ({ className, status, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ status }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
BaseInnerInput.displayName = "BaseInnerInput";

export const inputContainerVariants = cva(
  "flex relative h-10 w-full rounded-[4px] dark:!bg-transparent border transition px-3 py-2 text-base placeholder:text-[#79818C] focus-within:outline-0 focus-within:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:disabled:!border-[#9299A2]",
  {
    variants: {
      status: {
        default:
          "border-[#DEDEDE] bg-white text-[#191919] dark:!bg-transparent caret-text-primary focus-within:bg-white dark:focus-within:!bg-transparent dark:text-white focus-within:border-primary-main dark:focus-within:border-[#9299A2] dark:disabled:!border-[#9299A2]",
        error:
          "placeholder:text-red-500 bg-red-50 border-red-500 dark:!bg-status-error-bg-dark text-red-500 focus-within:bg-red-50 focus-within:border-red-500",
        loading: "",
        prefilled:
          "bg-[#F6F6F6] border-[#DEDEDE] dark:!bg-transparent caret-[#DEDEDE] focus-within:bg-[#F6F6F6] focus-within:border-[#DEDEDE] dark:!border-[#9299A2] dark:focus-within:border-[#9299A2]",
        neutral:
          "bg-[#F6F6F6] border-[#DEDEDE] dark:!bg-transparent caret-[#DEDEDE] focus-within:bg-[#F6F6F6] focus-within:border-[#DEDEDE] dark:!border-[#9299A2] dark:focus-within:border-[#9299A2]",
      },
    },
    defaultVariants: {
      status: "default",
    },
  }
);

export const sideVariants = cva(
  "top-0 flex justify-center items-center h-full min-w-[50px] max-w-[100px] dark:!bg-transparent transition px-3 py-2 text-base placeholder:text-[#79818C] focus-within:outline-0 focus-within:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 dark:disabled:!border-[#9299A2]",
  {
    variants: {
      side: {
        left: "left-0 rounded-l-[8px] border-r",
        right: "right-0 rounded-r-[8px] border-l",
      },
      status: {
        default:
          "border-[#DEDEDE] bg-white  text-[#191919] dark:!bg-transparent caret-primary-main focus-within:bg-white dark:focus-within:!bg-transparent dark:text-white focus-within:border-primary-main dark:focus-within:border-[#9299A2] dark:disabled:!border-[#9299A2]",
        error:
          "placeholder:text-red-500 bg-red-50 border-red-500 dark:!bg-red-50 text-red-500 focus-within:bg-red-50 focus-within:border-red-500",
        loading: "",
        prefilled:
          "bg-[#F6F6F6] border-[#DEDEDE] dark:!bg-transparent caret-[#DEDEDE] focus-within:bg-[#F6F6F6] focus-within:border-[#DEDEDE] dark:!border-[#9299A2] dark:focus-within:border-[#9299A2]",
        neutral: "bg-transparent border-0 caret-[#DEDEDE] !px-0",
      },
    },
    defaultVariants: {
      status: "default",
      side: "left",
    },
  }
);

export interface InputProps
  extends BaseInnerInputProps,
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
      ...props
    },
    ref
  ) => {
    let containerStatus: VariantProps<typeof inputContainerVariants>["status"] =
      status;

    if (error) containerStatus = "error";
    if (isLoading) containerStatus = "loading";
    if (disabled) containerStatus = "prefilled";

    return (
      <div className="relative space-y-1 w-full">
        {label && (
          <FormLabel showAsterisk={showAsterisk} error={error}>
            {label}
          </FormLabel>
        )}
        <div
          className={cn(
            inputContainerVariants({ status: containerStatus }),
            props.leftNode ? "pl-0" : "",
            props.rightNode ? "pr-0" : "",
            className
          )}
        >
          {props.leftNode ? (
            <div
              className={cn(
                sideVariants({
                  status: containerStatus,
                  side: "left",
                }),
                sideNodeClassName
              )}
            >
              {props.leftNode}
            </div>
          ) : null}

          {Icon && !props.leftNode && (
            <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 items-center text-muted-foreground">
              <Icon className="h-4 w-4" />
            </div>
          )}

          <BaseInnerInput
            ref={ref}
            disabled={isLoading || disabled}
            className={cn({
              "!pl-3": props.leftNode && status !== "neutral",
              "!pl-9": !!Icon && !props.leftNode,
              "!pr-3": props.rightNode && status !== "neutral",
              "sentry-mask": !!props?.isContentSensitive,
            })}
            {...props}
          />
          {props.rightNode ? (
            <div
              className={cn(
                sideVariants({
                  status: containerStatus,
                  side: "right",
                }),
                sideNodeClassName
              )}
            >
              {props.rightNode}
            </div>
          ) : null}
        </div>
        {description && (
          <FormDescription className="text-muted-foreground text-sm !font-normal">
            {description}
          </FormDescription>
        )}
        <ErrorMessage error={error} />
      </div>
    );
  }
);

// const Input = ({
//   className,
//   status = "default",
//   disabled,
//   error,
//   isLoading,
//   sideNodeClassName,
//   showAsterisk,
//   label,
//   description,
//   ref,
//   ...props
// }: InputProps) => {
//   let containerStatus: VariantProps<typeof inputContainerVariants>["status"] =
//     status;

//   if (error) containerStatus = "error";
//   if (isLoading) containerStatus = "loading";
//   if (disabled) containerStatus = "prefilled";

//   return (
//     <div className="relative space-y-1 w-full">
//       {label && (
//         <FormLabel showAsterisk={showAsterisk} error={error}>
//           {label}
//         </FormLabel>
//       )}
//       <div
//         className={cn(
//           inputContainerVariants({ status: containerStatus }),
//           props.leftNode ? "pl-0" : "",
//           props.rightNode ? "pr-0" : "",
//           className,
//         )}
//       >
//         {props.leftNode ? (
//           <div
//             className={cn(
//               sideVariants({
//                 status: containerStatus,
//                 side: "left",
//               }),
//               sideNodeClassName,
//             )}
//           >
//             {props.leftNode}
//           </div>
//         ) : null}
//         <BaseInnerInput
//           ref={ref}
//           disabled={isLoading || disabled}
//           className={cn({
//             "!pl-3": props.leftNode && status !== "neutral",
//             "!pr-3": props.rightNode && status !== "neutral",
//           })}
//           {...props}
//         />
//         {props.rightNode ? (
//           <div
//             className={cn(
//               sideVariants({
//                 status: containerStatus,
//                 side: "right",
//               }),
//               sideNodeClassName,
//             )}
//           >
//             {props.rightNode}
//           </div>
//         ) : null}
//       </div>
//       {description && (
//         <FormDescription className="text-gray-400 text-sm !font-normal">
//           {description}
//         </FormDescription>
//       )}
//       <ErrorMessage error={error} />
//     </div>
//   );
// };

Input.displayName = "Input";

export { Input };
