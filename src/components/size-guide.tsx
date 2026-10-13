"use client";
import { useState } from "react";
import type { Product } from "@/lib/catalog";
export function SizeGuide({
  category = "shoes",
  audience = "men",
}: {
  category?: Product["category"];
  audience?: Product["audience"];
}) {
  const [unit, setUnit] = useState<"cm" | "in">("cm");
  const rows =
    category === "clothing"
      ? ([
          ["XS", 84],
          ["S", 92],
          ["M", 100],
          ["L", 108],
          ["XL", 116],
          ["XXL", 124],
        ] as const)
      : audience === "kids"
        ? ([
            ["1Y", 20],
            ["2Y", 21],
            ["3Y", 22],
            ["4Y", 23],
            ["5Y", 23.5],
            ["6Y", 24],
          ] as const)
        : ([
            ["6", 24],
            ["7", 25],
            ["8", 26],
            ["9", 27],
            ["10", 28],
            ["11", 29],
            ["12", 30],
          ] as const);
  if (category === "accessories")
    return (
      <p className="product-description">
        One size. Daypack dimensions are an illustrative 44 × 30 × 15 cm.
        Product concepts are for demonstration; confirm actual measurements
        before purchasing from a real store.
      </p>
    );
  return (
    <div>
      <p className="product-description">
        {category === "shoes"
          ? "Measure from your heel to your longest toe while standing. Measure both feet and use the longer measurement."
          : "Measure around the fullest part of your chest, keeping the tape level."}{" "}
        These measurements are illustrative demo sizing, rather than a fit
        guarantee.{" "}
        {category === "clothing" && audience === "kids"
          ? "Adult sizing below does not apply to kids' products; age-specific charts will be added with final product specifications."
          : ""}
      </p>
      <div className="unit-switch">
        <button aria-pressed={unit === "cm"} onClick={() => setUnit("cm")}>
          Centimeters
        </button>
        <button aria-pressed={unit === "in"} onClick={() => setUnit("in")}>
          Inches
        </button>
      </div>
      <table className="size-table">
        <caption className="sr-only">
          Illustrative {category} measurements
        </caption>
        <thead>
          <tr>
            <th scope="col">
              {category === "shoes"
                ? audience === "kids"
                  ? "US youth size"
                  : `US ${audience} size`
                : "Size"}
            </th>
            <th scope="col">
              {category === "shoes" ? "Foot length" : "Chest"} ({unit})
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([code, value]) => (
            <tr key={code}>
              <th scope="row">{code}</th>
              <td>{unit === "cm" ? value : (value / 2.54).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
