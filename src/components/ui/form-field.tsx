import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function FormField({
  id,
  label,
  type = "text",
  name,
  placeholder,
  required = false,
  disabled = false,
  className = ""
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </Label>
      <Input 
        id={id}
        name={name || id}
        type={type}
        required={required}
        disabled={disabled}
        className={`h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 ${className}`}
        placeholder={placeholder}
      />
    </div>
  );
}