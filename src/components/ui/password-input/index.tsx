import { useState } from "react";
import { Input, InputProps } from "../Input";
import { Eye } from "./icons/Eye";
import { EyeOff } from "./icons/EyeOff";

type PasswordInputProps = InputProps & {};
const PasswordInput = ({ ...props }: PasswordInputProps) => {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <Input
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
};

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
