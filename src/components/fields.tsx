import type { BodyItem, YesNo } from "@/lib/application";
import { cn } from "@/lib/utils";
import {
  cloneElement,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<{ id?: string }>, { id })
    : children;
  return (
    <div className="block">
      <label htmlFor={id} className="block text-sm text-ink">
        {label}
        {required ? <span className="text-clay"> *</span> : null}
      </label>
      {hint ? <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p> : null}
      <div className="mt-2">{control}</div>
    </div>
  );
}

const control =
  "w-full rounded-xl border border-line bg-paper px-3.5 py-3 text-[15px] text-ink outline-none transition placeholder:text-muted/70 focus:border-clay focus:ring-2 focus:ring-clay/20";

export function TextInput(
  props: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean },
) {
  const { className, invalid, ...rest } = props;
  return <input {...rest} className={cn(control, invalid && "border-hold", className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={cn(control, "min-h-28 resize-y leading-relaxed", className)}
    />
  );
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className, children, ...rest } = props;
  return (
    <select {...rest} className={cn(control, className)}>
      {children}
    </select>
  );
}

export function YesNo({
  value,
  onChange,
  name,
}: {
  value: YesNo;
  onChange: (v: YesNo) => void;
  name: string;
}) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label={name}>
      {(
        [
          ["si", "Sí"],
          ["no", "No"],
        ] as const
      ).map(([v, label]) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(v)}
            className={cn(
              "inline-flex h-11 min-w-20 items-center justify-center rounded-full border px-5 text-sm transition",
              active
                ? "border-ink bg-ink text-cream hover:bg-ink"
                : "border-line bg-paper text-ink-soft hover:border-ink/40",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function Choice({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex h-11 items-center rounded-full border px-4 text-sm transition",
              active
                ? "border-ink bg-ink text-cream hover:bg-ink"
                : "border-line bg-paper text-ink-soft hover:border-ink/40",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function YesNoDetail({
  question,
  detail,
  value,
  onChange,
}: {
  question: string;
  detail: string;
  value: BodyItem;
  onChange: (next: BodyItem) => void;
}) {
  return (
    <div className="rounded-2xl border border-line bg-paper p-4 sm:p-5">
      <p className="text-sm text-ink">{question}</p>
      <div className="mt-3">
        <YesNo
          name={question}
          value={value.respuesta}
          onChange={(respuesta) =>
            onChange({ ...value, respuesta, detalle: respuesta === "no" ? "" : value.detalle })
          }
        />
      </div>
      {value.respuesta === "si" ? (
        <div className="mt-3">
          <TextArea
            value={value.detalle}
            onChange={(e) => onChange({ ...value, detalle: e.target.value })}
            placeholder={detail}
          />
        </div>
      ) : null}
    </div>
  );
}
