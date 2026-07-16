interface FieldRowProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

export default function FieldRow({ label, required, children }: FieldRowProps) {
  return (
    <div>
      <label className="block text-[0.85rem] font-semibold text-gray-600 dark:text-slate-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
