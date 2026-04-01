export function deliverValue(orders: Array<{ id: string }>) {
  return orders.map((order) => ({ id: order.id, delivered: true }));
}
