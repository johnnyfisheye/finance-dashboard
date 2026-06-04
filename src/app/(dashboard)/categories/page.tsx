"use client";

import { useEffect, useState, useTransition } from "react";
import { getCategories, createCategory, deleteCategory } from "@/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Lock } from "lucide-react";

type Category = {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
  isIncome: boolean;
  isSystem: boolean;
};

const PRESET_COLORS = [
  "#22c55e", "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b",
  "#ef4444", "#ec4899", "#f97316", "#06b6d4", "#84cc16",
  "#6366f1", "#14b8a6", "#d946ef", "#f43f5e", "#94a3b8",
];

function CategorySection({
  title,
  categories,
  isIncome,
  onDelete,
  onCreated,
}: {
  title: string;
  categories: Category[];
  isIncome: boolean;
  onDelete: (id: string, name: string) => void;
  onCreated: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#94a3b8");
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

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
      onCreated();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-4 h-4 mr-1" />
          Add
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
            />
            {formError && <p className="text-xs text-destructive">{formError}</p>}
          </div>
          <div className="space-y-1">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="w-7 h-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    borderColor: color === c ? "hsl(var(--foreground))" : "transparent",
                  }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
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
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-1 border rounded-full px-3 py-1 bg-background">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: cat.color ?? "#94a3b8" }}
            />
            <span className="text-sm font-medium">{cat.name}</span>
            {cat.isSystem ? (
              <Lock className="w-3 h-3 text-muted-foreground ml-1" />
            ) : (
              <button
                className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => onDelete(cat.id, cat.name)}
                title="Delete category"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-sm text-muted-foreground">No categories yet.</p>
        )}
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      const data = await getCategories();
      setCategories(data);
    });
  }

  useEffect(() => { load(); }, []);

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete category "${name}"?`)) return;
    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteCategory(id);
      if ("error" in res && res.error) {
        setDeleteError(typeof res.error === "string" ? res.error : "Could not delete category.");
        return;
      }
      load();
    });
  }

  const income = categories.filter((c) => c.isIncome);
  const expense = categories.filter((c) => !c.isIncome);

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your income and expense categories. System categories{" "}
          <Lock className="w-3 h-3 inline" /> cannot be deleted.
        </p>
      </div>

      {deleteError && (
        <div className="border border-destructive/50 bg-destructive/10 text-destructive text-sm rounded-lg px-4 py-3">
          {deleteError}
        </div>
      )}

      <CategorySection
        title="Income Categories"
        categories={income}
        isIncome={true}
        onDelete={handleDelete}
        onCreated={load}
      />

      <div className="border-t" />

      <CategorySection
        title="Expense Categories"
        categories={expense}
        isIncome={false}
        onDelete={handleDelete}
        onCreated={load}
      />
    </div>
  );
}
