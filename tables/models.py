"""Pydantic models mirroring the kt-portfolio-dash v2 database schema.

The models are the source of truth for the generated diagram: running

    python tables/models.py

emits kt-port/docs/schema-generated.html — a mermaid ER diagram built by
introspecting the models below, so it can never drift from them.

DB DDL lives in kt-port/sql/migrations/; keep these models in sync with it.
"""
from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


def col(db_type: str, *, pk: bool = False, fk: str | None = None, note: str = "", **kwargs):
    """Field() wrapper that records DB-level metadata for the diagram."""
    return Field(
        json_schema_extra={"db_type": db_type, "pk": pk, "fk": fk, "note": note},
        **kwargs,
    )


class Property(BaseModel):
    """public.properties — one row per property in the portfolio."""

    id: int = col("bigint", pk=True, note="identity", default=None)
    name: str = col("text", note="NOT NULL")
    address: Optional[str] = col("text", default=None)
    city: Optional[str] = col("text", default=None)
    state: Optional[str] = col("text", default=None)
    zip_code: Optional[str] = col("text", default=None)
    units: Optional[int] = col("integer", default=None)
    year_built: Optional[int] = col("integer", default=None)
    purchase_price: Decimal = col("numeric(14,2)", note="NOT NULL, default 0", default=Decimal("0"))
    user_id: Optional[UUID] = col("uuid", fk="auth.users(id)", note="NULL iff demo", default=None)
    is_demo: bool = col("boolean", note="NOT NULL, default false", default=False)
    created_at: Optional[datetime] = col("timestamptz", default=None)
    updated_at: Optional[datetime] = col("timestamptz", note="trigger-maintained", default=None)


class MonthlyFinancial(BaseModel):
    """public.monthly_financials — one row per property per reporting month."""

    id: int = col("bigint", pk=True, note="identity", default=None)
    property_id: int = col("bigint", fk="properties(id)", note="ON DELETE CASCADE")
    reporting_month: date = col("date", note="CHECK: 1st of month; UNIQUE with property_id")

    # income
    gross_rent: Decimal = col("numeric(14,2)", default=Decimal("0"))
    vacancy_loss: Decimal = col("numeric(14,2)", note="dollar loss", default=Decimal("0"))
    other_income: Decimal = col("numeric(14,2)", default=Decimal("0"))
    total_income: Decimal = col("numeric(14,2)", default=Decimal("0"))

    # expenses
    repairs_maintenance: Decimal = col("numeric(14,2)", default=Decimal("0"))
    utilities: Decimal = col("numeric(14,2)", default=Decimal("0"))
    property_management: Decimal = col("numeric(14,2)", default=Decimal("0"))
    property_taxes: Decimal = col("numeric(14,2)", default=Decimal("0"))
    insurance: Decimal = col("numeric(14,2)", default=Decimal("0"))
    marketing: Decimal = col("numeric(14,2)", default=Decimal("0"))
    administrative: Decimal = col("numeric(14,2)", default=Decimal("0"))
    total_expenses: Decimal = col("numeric(14,2)", default=Decimal("0"))

    # results
    noi: Decimal = col("numeric(14,2)", note="net operating income", default=Decimal("0"))
    debt_service: Decimal = col("numeric(14,2)", default=Decimal("0"))
    cash_flow: Decimal = col("numeric(14,2)", default=Decimal("0"))
    occupancy_pct: Decimal = col("numeric(5,2)", note="CHECK 0-100", default=Decimal("0"), ge=0, le=100)

    source_file: Optional[str] = col("text", note="import metadata", default=None)
    is_demo: bool = col("boolean", note="trigger-synced from property", default=False)
    created_at: Optional[datetime] = col("timestamptz", default=None)
    updated_at: Optional[datetime] = col("timestamptz", note="trigger-maintained", default=None)


# table name -> model, in diagram order
TABLES: dict[str, type[BaseModel]] = {
    "properties": Property,
    "monthly_financials": MonthlyFinancial,
}

# crow's-foot relationships: (left table, cardinality, right table, label)
RELATIONSHIPS = [
    ("properties", "||--o{", "monthly_financials", "has months"),
]


# ---------------------------------------------------------------- diagram ---

def mermaid_er() -> str:
    """Build mermaid erDiagram text from the models above."""
    lines = ["erDiagram"]
    for table, model in TABLES.items():
        lines.append(f"    {table} {{")
        for field_name, field in model.model_fields.items():
            meta = (field.json_schema_extra or {})
            db_type = meta.get("db_type", "?").replace("(", "_").replace(")", "").replace(",", "-")
            badge = "PK" if meta.get("pk") else ("FK" if meta.get("fk") else "")
            note_parts = [p for p in (meta.get("fk"), meta.get("note")) if p]
            note = f' "{", ".join(note_parts)}"' if note_parts else ""
            lines.append(f"        {db_type} {field_name} {badge}{note}".rstrip())
        lines.append("    }")
    for left, card, right, label in RELATIONSHIPS:
        lines.append(f'    {left} {card} {right} : "{label}"')
    return "\n".join(lines)


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>KT Portfolio Dash — Generated Schema</title>
  <style>
    body {{
      font-family: -apple-system, "Segoe UI", sans-serif;
      background: #0f1729; color: #e8e6e1;
      margin: 0; padding: 2rem;
    }}
    h1 {{ font-weight: 600; letter-spacing: 0.02em; }}
    h1 span {{ color: #c9a227; }}
    p.meta {{ color: #8a8f9e; font-size: 0.85rem; }}
    .diagram-card {{
      background: #f8f7f4; border-left: 4px solid #c9a227;
      border-radius: 8px; padding: 1.5rem; overflow-x: auto;
    }}
  </style>
</head>
<body>
  <h1>KT Portfolio Dash — <span>Generated Schema</span></h1>
  <p class="meta">Generated by <code>tables/models.py</code> — edit the models, not this file.</p>
  <div class="diagram-card">
    <pre class="mermaid">
{diagram}
    </pre>
  </div>
  <script type="module">
    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs";
    mermaid.initialize({{ startOnLoad: true, theme: "neutral" }});
  </script>
</body>
</html>
"""

OUTPUT = Path(__file__).resolve().parents[1] / "kt-port" / "docs" / "schema-generated.html"


def main() -> None:
    diagram = mermaid_er()
    OUTPUT.write_text(HTML_TEMPLATE.format(diagram=diagram))
    n_cols = sum(len(m.model_fields) for m in TABLES.values())
    print(f"Wrote {OUTPUT}")
    print(f"  {len(TABLES)} tables, {n_cols} columns, {len(RELATIONSHIPS)} relationship(s)")


if __name__ == "__main__":
    main()
