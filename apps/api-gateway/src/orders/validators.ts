import type {
  CreateOrderInput,
  ListAdminOrdersInput,
  ListMyOrdersInput,
  OrderFlowType,
  OrderStatus,
  UpdateAdminOrderInput,
  UsersPageSize,
} from '@servicienta/types';
import { ValidationError } from '../core/errors.js';

const ALLOWED_PAGE_SIZES: UsersPageSize[] = [25, 50, 100];

export function validateCreateOrderInput(
  input: CreateOrderInput,
): CreateOrderInput {
  const technicianPublicSlug = input.technician_public_slug.trim();
  const zoneSlug = input.zone_slug.trim();
  const applianceTypeSlug = input.appliance_type_slug.trim();
  const description = input.description.trim();
  const serviceAddressText = input.service_address_text.trim();
  const addressNotes = input.address_notes?.trim() || null;

  if (!technicianPublicSlug) {
    throw new ValidationError('Technician public slug is required');
  }
  if (!zoneSlug) throw new ValidationError('Zone slug is required');
  if (!applianceTypeSlug) {
    throw new ValidationError('Appliance type slug is required');
  }
  if (!description) throw new ValidationError('Description is required');
  if (!serviceAddressText) {
    throw new ValidationError('Service address is required');
  }

  return {
    technician_public_slug: technicianPublicSlug,
    zone_slug: zoneSlug,
    appliance_type_slug: applianceTypeSlug,
    description,
    service_address_text: serviceAddressText,
    service_lat: normalizeNullableNumber(input.service_lat),
    service_lng: normalizeNullableNumber(input.service_lng),
    address_notes: addressNotes,
  };
}

export function validateUpdateAdminOrderInput(
  input: UpdateAdminOrderInput,
): UpdateAdminOrderInput {
  const description = input.description.trim();
  const serviceAddressText = input.service_address_text.trim();
  const addressNotes = input.address_notes?.trim() || null;

  if (!isOrderStatus(input.status)) {
    throw new ValidationError('Invalid order status');
  }

  if (!isOrderFlowType(input.flow_type)) {
    throw new ValidationError('Invalid order flow type');
  }

  if (!description) throw new ValidationError('Description is required');
  if (!serviceAddressText) {
    throw new ValidationError('Service address is required');
  }

  return {
    status: input.status,
    flow_type: input.flow_type,
    description,
    service_address_text: serviceAddressText,
    service_lat: normalizeNullableNumber(input.service_lat),
    service_lng: normalizeNullableNumber(input.service_lng),
    address_notes: addressNotes,
    technician_id: input.technician_id?.trim() || null,
    zone_slug: input.zone_slug?.trim() || null,
    appliance_type_slug: input.appliance_type_slug?.trim() || null,
  };
}

export function validateListMyOrdersInput(input: {
  page?: string;
  pageSize?: string;
  status?: string;
  search?: string;
  flowType?: string;
}): ListMyOrdersInput {
  if (input.flowType && !isOrderFlowType(input.flowType)) {
    throw new ValidationError('El filtro de flujo no es válido');
  }

  return {
    ...validatePaginatedOrdersInput(input),
    flow_type: input.flowType && isOrderFlowType(input.flowType) ? input.flowType : undefined,
  };
}

export function validateListAdminOrdersInput(input: {
  page?: string;
  pageSize?: string;
  status?: string;
  flowType?: string;
  search?: string;
  technicianId?: string;
  clientId?: string;
}): ListAdminOrdersInput {
  const base = validatePaginatedOrdersInput(input);

  if (input.flowType && !isOrderFlowType(input.flowType)) {
    throw new ValidationError('Invalid flow type filter');
  }

  return {
    ...base,
    flow_type:
      input.flowType && isOrderFlowType(input.flowType)
        ? input.flowType
        : undefined,
    technician_id: input.technicianId
      ? validateTechnicianId(input.technicianId)
      : undefined,
    client_id: input.clientId ? validateClientId(input.clientId) : undefined,
  };
}

export function validateOrderId(value: string | string[] | undefined): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Invalid order id');
  }

  return value.trim();
}

export function validateTechnicianId(
  value: string | string[] | undefined,
): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Invalid technician id');
  }

  return value.trim();
}

export function validateClientId(value: string | string[] | undefined): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ValidationError('Invalid client id');
  }

  return value.trim();
}

function validatePaginatedOrdersInput(input: {
  page?: string;
  pageSize?: string;
  status?: string;
  search?: string;
}): {
  page: number;
  pageSize: UsersPageSize;
  status?: OrderStatus;
  search?: string;
} {
  const page = input.page ? Number(input.page) : 1;
  const pageSize = input.pageSize ? Number(input.pageSize) : 25;
  const search = input.search?.trim() || undefined;

  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError('Invalid page');
  }

  if (!ALLOWED_PAGE_SIZES.includes(pageSize as UsersPageSize)) {
    throw new ValidationError('Invalid page size');
  }

  if (input.status && !isOrderStatus(input.status)) {
    throw new ValidationError('Invalid status filter');
  }

  return {
    page,
    pageSize: pageSize as UsersPageSize,
    status:
      input.status && isOrderStatus(input.status) ? input.status : undefined,
    search,
  };
}

function isOrderStatus(value: string): value is OrderStatus {
  return (
    value === 'pending' ||
    value === 'accepted' ||
    value === 'cancelled' ||
    value === 'in_progress' ||
    value === 'completed_tech' ||
    value === 'completion_rejected' ||
    value === 'completed'
  );
}

function isOrderFlowType(value: string): value is OrderFlowType {
  return value === 'client_selects' || value === 'tech_applies';
}

function normalizeNullableNumber(value: number | null): number | null {
  if (value === null) return null;
  if (Number.isFinite(value)) return value;

  throw new ValidationError('Invalid coordinates');
}
