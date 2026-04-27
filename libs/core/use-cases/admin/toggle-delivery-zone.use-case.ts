import { DeliveryZone } from '../../domain/entities/delivery-zone.entity';
import { DataNotFoundException } from '../../domain/exceptions/batch-cooking.exceptions';
import { DeliveryZoneRepository } from '../../domain-services/repositories/delivery-zone.repository';

export interface ToggleDeliveryZoneInput {
  zoneId: string;
  isActive: boolean;
  traceId: string;
}

export class ToggleDeliveryZoneUseCase {
  constructor(
    private readonly deliveryZoneRepository: DeliveryZoneRepository,
  ) {}

  async execute(input: ToggleDeliveryZoneInput): Promise<DeliveryZone> {
    const zone = await this.deliveryZoneRepository.findById(input.zoneId);
    if (!zone) throw new DataNotFoundException('Delivery zone not found');

    return this.deliveryZoneRepository.toggleActive(
      input.zoneId,
      input.isActive,
    );
  }
}
