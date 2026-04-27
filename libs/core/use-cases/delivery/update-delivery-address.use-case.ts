import { DeliveryAddress } from '../../domain/entities/delivery-address.entity';
import {
  DataNotFoundException,
  UnauthorizedAccessException,
} from '../../domain/exceptions/batch-cooking.exceptions';
import { DeliveryAddressRepository } from '../../domain-services/repositories/delivery-address.repository';
import { DeliveryZoneRepository } from '../../domain-services/repositories/delivery-zone.repository';

export interface UpdateDeliveryAddressInput {
  userId: string;
  addressId: string;
  label: string;
  addressLine: string;
  districtId: string;
  reference?: string;
  traceId: string;
}

export class UpdateDeliveryAddressUseCase {
  constructor(
    private readonly deliveryAddressRepository: DeliveryAddressRepository,
    private readonly deliveryZoneRepository: DeliveryZoneRepository,
  ) {}

  async execute(input: UpdateDeliveryAddressInput): Promise<DeliveryAddress> {
    const existing = await this.deliveryAddressRepository.findById(
      input.addressId,
    );
    if (!existing)
      throw new DataNotFoundException('Delivery address not found');
    if (existing.userId !== input.userId)
      throw new UnauthorizedAccessException(
        'Address does not belong to this user',
      );

    const zone = await this.deliveryZoneRepository.findById(input.districtId);
    if (!zone || !zone.isActive) {
      throw new DataNotFoundException(
        `Delivery zone "${input.districtId}" not found or inactive`,
      );
    }

    return this.deliveryAddressRepository.update(input.addressId, {
      label: input.label,
      addressLine: input.addressLine,
      districtId: input.districtId,
      reference: input.reference,
    });
  }
}
