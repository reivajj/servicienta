import type { UsersPageSize } from '../users/contracts.js';
import type {
  Order,
  OrderFlowType,
  OrderStatus,
  AdminOrder,
} from './domain.js';

export interface CreateOrderInput {
  flow_type: OrderFlowType;
  description: string;
  service_address_text: string;
  service_lat: number | null;
  service_lng: number | null;
  address_notes: string | null;
}

export interface CreateOrderResponse {
  data: Order;
}

export interface UpdateAdminOrderInput {
  status: OrderStatus;
  flow_type: OrderFlowType;
  description: string;
  service_address_text: string;
  service_lat: number | null;
  service_lng: number | null;
  address_notes: string | null;
}

export interface UpdateAdminOrderResponse {
  data: AdminOrder;
}

export interface ListMyOrdersInput {
  page: number;
  pageSize: UsersPageSize;
  status?: OrderStatus;
  search?: string;
}

export interface PaginatedOrdersSummary {
  totalOrders: number;
  openOrders: number;
  inProgressOrders: number;
  enGarantiaOrders: number;
  closedOrders: number;
}

export interface PaginatedOrdersPagination {
  page: number;
  pageSize: UsersPageSize;
  total: number;
  totalPages: number;
}

export interface PaginatedOrders {
  items: Order[];
  pagination: PaginatedOrdersPagination;
  summary: PaginatedOrdersSummary;
}

export interface ListMyOrdersResponse {
  data: PaginatedOrders;
}

export interface GetOrderResponse {
  data: Order;
}

export interface ListAdminOrdersInput {
  page: number;
  pageSize: UsersPageSize;
  status?: OrderStatus;
  flow_type?: OrderFlowType;
  search?: string;
}

export interface PaginatedAdminOrders {
  items: AdminOrder[];
  pagination: PaginatedOrdersPagination;
  summary: PaginatedOrdersSummary;
}

export interface ListAdminOrdersResponse {
  data: PaginatedAdminOrders;
}

export interface GetAdminOrderResponse {
  data: AdminOrder;
}
