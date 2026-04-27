import { DeliveryAddress } from '../../domain/entities/delivery-address.entity';
import { DataNotFoundException } from '../../domain/exceptions/batch-cooking.exceptions';
import { DeliveryAddressRepository } from '../../domain-services/repositories/delivery-address.repository';
import { DeliveryZoneRepository } from '../../domain-services/repositories/delivery-zone.repository';

export interface CreateDeliveryAddressInput {
  userId: string;
  label: string;
  addressLine: string;
  districtId: string;
  reference?: string;
  traceId: string;
}

export class CreateDeliveryAddressUseCase {
  constructor(
    private readonly deliveryAddressRepository: DeliveryAddressRepository,
    private readonly deliveryZoneRepository: DeliveryZoneRepository,
  ) {}

  async execute(input: CreateDeliveryAddressInput): Promise<DeliveryAddress> {
    const zone = await this.deliveryZoneRepository.findById(input.districtId);
    if (!zone || !zone.isActive) {
      throw new DataNotFoundException(
        `Delivery zone "${input.districtId}" not found or inactive`,
      );
    }

    return this.deliveryAddressRepository.create({
      userId: input.userId,
      label: input.label,
      addressLine: input.addressLine,
      districtId: input.districtId,
      reference: input.reference,
    });
  }
}
