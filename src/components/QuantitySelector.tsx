"use client";

type QuantitySelectorProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  id?: string;
};

export function QuantitySelector({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  id,
}: QuantitySelectorProps) {
  function clamp(n: number) {
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, Math.floor(n)));
  }

  function decrement() {
    onChange(clamp(value - 1));
  }

  function increment() {
    onChange(clamp(value + 1));
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "") {
      onChange(min);
      return;
    }
    onChange(clamp(Number.parseInt(raw, 10)));
  }

  const btnClass =
    size === "sm"
      ? "flex h-9 w-9 items-center justify-center text-lg font-medium text-gray-700 transition hover:bg-gray-100"
      : "flex h-11 w-11 items-center justify-center text-xl font-medium text-gray-700 transition hover:bg-gray-100";

  const inputClass =
    size === "sm"
      ? "h-9 w-12 border-0 bg-transparent text-center text-sm font-semibold text-gray-900 focus:outline-none focus:ring-0"
      : "h-11 w-14 border-0 bg-transparent text-center text-base font-semibold text-gray-900 focus:outline-none focus:ring-0";

  const boxClass =
    size === "sm"
      ? "inline-flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white"
      : "inline-flex items-center overflow-hidden rounded-lg border-2 border-gray-300 bg-white shadow-sm";

  return (
    <div className={boxClass} role="group" aria-label="Quantity">
      <button
        type="button"
        onClick={decrement}
        disabled={value <= min}
        className={`${btnClass} border-r border-gray-300 disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={handleInputChange}
        className={`${inputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={increment}
        disabled={value >= max}
        className={`${btnClass} border-l border-gray-300 disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}
