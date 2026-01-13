import * as React from "react";
import { useState } from "react";
import { Input, InputProps } from "../Input";
import { Eye } from "./icons/Eye";
import { EyeOff } from "./icons/EyeOff";

type PasswordInputProps = InputProps & {};

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ ...props }, ref) => {
    const [passwordVisible, setPasswordVisible] = useState(false);

    return (
      <Input
        ref={ref}
        sideNodeClassName="!border-l-0"
        rightNode={
          passwordVisible ? (
            <button
              type="button"
              onClick={() => setPasswordVisible((val) => !val)}
            >
              <Eye />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPasswordVisible((val) => !val)}
            >
              <EyeOff />
            </button>
          )
        }
        type={passwordVisible ? "text" : "password"}
        isContentSensitive
        {...props}
      />
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
