/** Отображаемый номер заказа, напр. №00042 */
export function formatOrderNumber(n: number): string {
  return `№${String(n).padStart(5, "0")}`;
}
