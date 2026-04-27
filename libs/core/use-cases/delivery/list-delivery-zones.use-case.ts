import { DeliveryZone } from '../../domain/entities/delivery-zone.entity';
import { DeliveryZoneRepository } from '../../domain-services/repositories/delivery-zone.repository';

export interface ListDeliveryZonesInput {
  traceId: string;
}

export class ListDeliveryZonesUseCase {
  constructor(
    private readonly deliveryZoneRepository: DeliveryZoneRepository,
  ) {}

  async execute(_input: ListDeliveryZonesInput): Promise<DeliveryZone[]> {
    const zones = await this.deliveryZoneRepository.findAll();
    return zones.filter((z) => z.isActive);
  }
}
