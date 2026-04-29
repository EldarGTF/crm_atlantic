"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

type Item = {
  productType: string;
  profile: string;
  width: number;
  height: number;
  config: string;
  quantity: number;
  unitPrice: number;
  notes: string;
};

type Extra = { name: string; price: number; notes: string };

const PRODUCT_TYPES = [
  "Окно ПВХ", "Окно алюминий", "Дверь входная", "Дверь балконная",
  "Балконный блок", "Витраж", "Перегородка", "Другое",
];

function newItem(): Item {
  return { productType: "Окно ПВХ", profile: "", width: 0, height: 0, config: "", quantity: 1, unitPrice: 0, notes: "" };
}
function newExtra(): Extra {
  return { name: "", price: 0, notes: "" };
}

type Props = { onChange: (items: Item[], extras: Extra[]) => void };

export function OrderItemsEditor({ onChange }: Props) {
  const [items, setItems] = useState<Item[]>([newItem()]);
  const [extras, setExtras] = useState<Extra[]>([]);

  function updateItem(idx: number, field: keyof Item, value: string | number) {
    const next = items.map((it, i) => i === idx ? { ...it, [field]: value } : it);
    setItems(next);
    onChange(next, extras);
  }
  function addItem() { const next = [...items, newItem()]; setItems(next); onChange(next, extras); }
  function removeItem(idx: number) { const next = items.filter((_, i) => i !== idx); setItems(next); onChange(next, extras); }

  function updateExtra(idx: number, field: keyof Extra, value: string | number) {
    const next = extras.map((e, i) => i === idx ? { ...e, [field]: value } : e);
    setExtras(next);
    onChange(items, next);
  }
  function addExtra() { const next = [...extras, newExtra()]; setExtras(next); onChange(items, next); }
  function removeExtra(idx: number) { const next = extras.filter((_, i) => i !== idx); setExtras(next); onChange(items, next); }

  const itemsTotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const extrasTotal = extras.reduce((s, e) => s + e.price, 0);

  return (
    <div className="space-y-6">
      {/* Позиции */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Изделия</h3>
          <Button type="button" size="sm" variant="outline" onClick={addItem}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Добавить
          </Button>
        </div>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="border rounded-lg p-3 space-y-2 bg-gray-50">
              <div className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="col-span-2 sm:col-span-3">
                    <label className="text-xs text-gray-500">Тип изделия</label>
                    <select
                      className="w-full border rounded-md px-2 py-1.5 text-sm bg-white"
                      value={item.productType}
                      onChange={(e) => updateItem(idx, "productType", e.target.value)}
                    >
                      {PRODUCT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Ширина (мм) *</label>
                    <Input type="number" value={item.width || ""} placeholder="1200" min="1" required
                      className={!item.width ? "border-red-300" : ""}
                      onChange={(e) => updateItem(idx, "width", Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Высота (мм) *</label>
                    <Input type="number" value={item.height || ""} placeholder="1400" min="1" required
                      className={!item.height ? "border-red-300" : ""}
                      onChange={(e) => updateItem(idx, "height", Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Кол-во</label>
                    <Input type="number" min="1" value={item.quantity}
                      onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Профиль</label>
                    <Input placeholder="Rehau, KBE..." value={item.profile}
                      onChange={(e) => updateItem(idx, "profile", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Цена за ед. (₽) *</label>
                    <Input type="number" value={item.unitPrice || ""} placeholder="15000"
                      className={!item.unitPrice ? "border-red-300" : ""}
                      onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))} />
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <label className="text-xs text-gray-500">Конфигурация / Примечания</label>
                    <Input placeholder="2-камерный, поворотно-откидной..." value={item.config}
                      onChange={(e) => updateItem(idx, "config", e.target.value)} />
                  </div>
                </div>
                <button type="button" onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-500 mt-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="text-right text-sm font-medium text-blue-600">
                {(item.unitPrice * item.quantity).toLocaleString("ru-RU")} ₽
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Доп. работы */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Дополнительные работы</h3>
          <Button type="button" size="sm" variant="outline" onClick={addExtra}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Добавить
          </Button>
        </div>
        {extras.length === 0 && (
          <p className="text-sm text-gray-400">Демонтаж, откосы, подоконники...</p>
        )}
        <div className="space-y-2">
          {extras.map((extra, idx) => (
            <div key={idx} className="border rounded-lg p-2 bg-gray-50 space-y-2 sm:space-y-0 sm:flex sm:gap-2 sm:items-center">
              <Input placeholder="Откосы, подоконник..." className="w-full sm:flex-1" value={extra.name}
                onChange={(e) => updateExtra(idx, "name", e.target.value)} />
              <div className="flex gap-2 items-center">
                <Input type="number" placeholder="Цена ₽" className="flex-1 sm:w-28 sm:flex-none" value={extra.price || ""}
                  onChange={(e) => updateExtra(idx, "price", Number(e.target.value))} />
                <button type="button" onClick={() => removeExtra(idx)} className="text-gray-300 hover:text-red-500 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Итог */}
      <div className="border-t pt-3 space-y-1 text-sm">
        {extrasTotal > 0 && (
          <>
            <div className="flex justify-between text-gray-500">
              <span>Изделия</span><span>{itemsTotal.toLocaleString("ru-RU")} ₽</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Доп. работы</span><span>{extrasTotal.toLocaleString("ru-RU")} ₽</span>
            </div>
          </>
        )}
        <div className="flex justify-between font-semibold text-base">
          <span>Итого (без монтажа)</span>
          <span className="text-blue-600">{(itemsTotal + extrasTotal).toLocaleString("ru-RU")} ₽</span>
        </div>
      </div>
    </div>
  );
}
