import React from 'react';
interface DateTimePickerProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    min?: string;
    max?: string;
    className?: string;
    error?: string;
}
declare const DateTimePicker: React.FC<DateTimePickerProps>;
export default DateTimePicker;
//# sourceMappingURL=DateTimePicker.d.ts.map