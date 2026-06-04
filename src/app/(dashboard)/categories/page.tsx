"use client";

import { useEffect, useState, useTransition } from "react";
import { getCategories, createCategory, updateCategory, deleteCategory, toggleCategoryFixed, toggleCategoryInvestment } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Pencil, Check, X } from "lucide-react";

type Category = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  isIncome: boolean;
  isSystem: boolean;
  isFixed: boolean;
  isInvestment: boolean;
};

const PRESET_COLORS = [
  "#22c55e", "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#ef4444", "#ec4899", "#f97316", "#06b6d4", "#84cc16",
  "#6366f1", "#14b8a6", "#d946ef", "#f43f5e", "#94a3b8",
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
          style={{ backgroundColor: c, borderColor: value === c ? "hsl(var(--foreground))" : "transparent" }}
          onClick={() => onChange(c)}
        />
      ))}
    </div>
  );
}

function CategoryRow({
  cat,
  onSaved,
  onDeleted,
  onError,
}: {
  cat: Category;
  onSaved: () => void;
  onDeleted: (msg: string) => void;
  onError: (msg: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);
  const [color, setColor] = useState(cat.color ?? "#94a3b8");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function startEdit() {
    setName(cat.name);
    setColor(cat.color ?? "#94a3b8");
    setFieldError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setFieldError(null);
  }

  function handleSave() {
    if (!name.trim()) return;
    setFieldError(null);
    startTransition(async () => {
      const res = await updateCategory(cat.id, { name: name.trim(), color });
      if ("error" in res && res.error) {
        const err = res.error as Record<string, string[]> | string;
        setFieldError(typeof err === "string" ? err : Object.values(err).flat()[0] ?? "Error");
        return;
      }
      setEditing(false);
      onSaved();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    startTransition(async () => {
      const res = await deleteCategory(cat.id);
      if ("error" in res && res.error) {
        onError(typeof res.error === "string" ? res.error : "Could not delete.");
        return;
      }
      onDeleted(cat.id);
    });
  }

  if (editing) {
    return (
      <div className="border rounded-lg p-3 space-y-2 bg-muted/30 w-full">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") cancelEdit(); }}
          autoFocus
        />
        {fieldError && <p className="text-xs text-destructive">{fieldError}</p>}
        <ColorPicker value={color} onChange={setColor} />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} disabled={isPending || !name.trim()}>
            <Check className="w-3.5 h-3.5 mr-1" /> Save
          </Button>
          <Button size="sm" variant="ghost" onClick={cancelEdit}>
            <X className="w-3.5 h-3.5 mr-1" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  function handleToggleFixed() {
    startTransition(async () => { await toggleCategoryFixed(cat.id, !cat.isFixed); onSaved(); });
  }
  function handleToggleInvestment() {
    startTransition(async () => { await toggleCategoryInvestment(cat.id, !cat.isInvestment); onSaved(); });
  }

  return (
    <div className="flex items-center gap-1 border rounded-full px-3 py-1 bg-background group">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color ?? "#94a3b8" }} />
      <span className="text-sm font-medium">{cat.name}</span>
      {!cat.isIncome && (
        <span className="ml-1 flex items-center gap-1">
          <button onClick={handleToggleFixed} title={cat.isFixed ? "Marked as Fixed — click to set as Wants" : "Mark as Fixed expense"}>
            <Badge variant={cat.isFixed ? "default" : "outline"} className="text-[10px] px-1.5 py-0 h-4 cursor-pointer">Fixed</Badge>
          </button>
          <button onClick={handleToggleInvestment} title={cat.isInvestment ? "Investment bucket — click to unmark" : "Mark as Investment bucket"}>
            <Badge variant={cat.isInvestment ? "default" : "outline"} className="text-[10px] px-1.5 py-0 h-4 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white border-0">Invest</Badge>
          </button>
        </span>
      )}
      <span className="ml-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button className="text-muted-foreground hover:text-foreground transition-colors p-0.5" onClick={startEdit} title="Edit">
          <Pencil className="w-3 h-3" />
        </button>
        <button className="text-muted-foreground hover:text-destructive transition-colors p-0.5" onClick={handleDelete} title="Delete">
          <Trash2 className="w-3 h-3" />
        </button>
      </span>
    </div>
  );
}

function CategorySection({
  title,
  categories,
  isIncome,
  onReload,
  onError,
}: {
  title: string;
  categories: Category[];
  isIncome: boolean;
  onReload: () => void;
  onError: (msg: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#94a3b8");
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [localCategories, setLocalCategories] = useState(categories);

  useEffect(() => { setLocalCategories(categories); }, [categories]);

  function handleCreate() {
    if (!name.trim()) return;
    setFormError(null);
    startTransition(async () => {
      const res = await createCategory({ name: name.trim(), color, isIncome });
      if ("error" in res && res.error) {
        const err = res.error as Record<string, string[]> | string;
        setFormError(typeof err === "string" ? err : Object.values(err).flat()[0] ?? "Error");
        return;
      }
      setName("");
      setColor("#94a3b8");
      setShowForm(false);
      onReload();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              placeholder="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
            />
            {formError && <p className="text-xs text-destructive">{formError}</p>}
          </div>
          <div className="space-y-1">
            <Label>Color</Label>
            <ColorPicker value={color} onChange={setColor} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={isPending || !name.trim()}>
              {isPending ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setShowForm(false); setFormError(null); setName(""); }}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {localCategories.map((cat) => (
          <CategoryRow
            key={cat.id}
            cat={cat}
            onSaved={onReload}
            onDeleted={(id) => setLocalCategories((prev) => prev.filter((c) => c.id !== id))}
            onError={onError}
          />
        ))}
        {localCategories.length === 0 && (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        )}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const data = await getCategories();
      setCategories(data);
    });
  }

  useEffect(() => { load(); }, []);

  const income = categories.filter((c) => c.isIncome);
  const expense = categories.filter((c) => !c.isIncome);

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage income and expense categories. Hover a category to edit or delete it.
        </p>
      </div>

      {error && (
        <div className="border border-destructive/50 bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <CategorySection title="Income Categories" categories={income} isIncome={true} onReload={load} onError={setError} />
      <div className="border-t" />
      <CategorySection title="Expense Categories" categories={expense} isIncome={false} onReload={load} onError={setError} />
    </div>
  );
}
