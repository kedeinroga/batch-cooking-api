import { DeliveryAddress } from '../../domain/entities/delivery-address.entity';

export interface CreateDeliveryAddressInput {
  userId: string;
  label: string;
  addressLine: string;
  districtId: string;
  reference?: string;
}

export interface UpdateDeliveryAddressInput {
  label: string;
  addressLine: string;
  districtId: string;
  reference?: string;
}

export abstract class DeliveryAddressRepository {
  abstract findById(id: string): Promise<DeliveryAddress | null>;
  abstract findByUser(userId: string): Promise<DeliveryAddress[]>;
  abstract create(data: CreateDeliveryAddressInput): Promise<DeliveryAddress>;
  abstract update(
    id: string,
    data: UpdateDeliveryAddressInput,
  ): Promise<DeliveryAddress>;
  abstract delete(id: string): Promise<void>;
}
