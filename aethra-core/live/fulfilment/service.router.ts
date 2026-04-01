export function routeService(orders: Array<{ id: string }>) {
  return orders.map((order) => ({ id: order.id, route: "default-service" }));
}
