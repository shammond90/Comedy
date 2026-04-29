"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const baseField =
  "flex h-10 w-full rounded-lg border border-border bg-surface pl-7 pr-3 py-2 text-sm text-foreground tabular-nums placeholder:text-subtle shadow-[inset_0_1px_0_0_rgb(31_27_22_/_0.02)] transition-colors focus-visible:outline-none focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20";

export type MoneyInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "defaultValue" | "onChange" | "type"
> & {
  /** Initial display value, e.g. "1234.56" or "1,234.56" */
  defaultValue?: string | number;
  /** Optional controlled display string */
  value?: string;
  /** Called with the cleaned numeric string (no commas) on each keystroke */
  onValueChange?: (rawNumeric: string) => void;
  /** Symbol shown inside the input prefix */
  symbol?: string;
  /** Name attribute — the form will receive the cleaned numeric string */
  name?: string;
};

function clean(input: string): string {
  // Allow digits and one decimal point only; strip everything else.
  let s = input.replace(/[^\d.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, "");
    // Limit to 2 decimal places.
    const [intPart, decPart = ""] = s.split(".");
    s = `${intPart}.${decPart.slice(0, 2)}`;
  }
  return s;
}

function format(numeric: string): string {
  if (numeric === "" || numeric === ".") return numeric;
  const [intPart, decPart] = numeric.split(".");
  const intFmt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart !== undefined ? `${intFmt}.${decPart}` : intFmt;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  function MoneyInput(
    { className, defaultValue, onValueChange, symbol = "£", name, onBlur, ...rest },
    ref,
  ) {
    const initial = React.useMemo(
      () => format(clean(String(defaultValue ?? ""))),
      [defaultValue],
    );
    const [display, setDisplay] = React.useState(initial);

    const numeric = React.useMemo(() => display.replace(/,/g, ""), [display]);

    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-subtle">
          {symbol}
        </span>
        <input
          {...rest}
          ref={ref}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={display}
          onChange={(e) => {
            const cleaned = clean(e.target.value);
            const next = format(cleaned);
            setDisplay(next);
            onValueChange?.(cleaned);
          }}
          onBlur={(e) => {
            // Normalise to two decimals on blur if user entered a value.
            const cleaned = clean(display);
            if (cleaned && !cleaned.endsWith(".")) {
              const num = Number(cleaned);
              if (Number.isFinite(num)) {
                const normalised = num.toFixed(2);
                const formatted = format(normalised);
                setDisplay(formatted);
                onValueChange?.(normalised);
              }
            }
            onBlur?.(e);
          }}
          className={cn(baseField, className)}
        />
        {/* Hidden mirror so plain FormData receives the cleaned numeric string */}
        {name && (
          <input type="hidden" name={name} value={numeric} readOnly />
        )}
      </div>
    );
  },
);
