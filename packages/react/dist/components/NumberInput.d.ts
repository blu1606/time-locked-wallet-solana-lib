import React from 'react';
interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    label?: string;
    error?: string;
    suffix?: string;
    prefix?: string;
    decimals?: number;
    min?: number;
    max?: number;
}
declare const NumberInput: React.ForwardRefExoticComponent<NumberInputProps & React.RefAttributes<HTMLInputElement>>;
export default NumberInput;
//# sourceMappingURL=NumberInput.d.ts.map