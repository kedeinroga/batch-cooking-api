import { DeliveryZone } from '../../domain/entities/delivery-zone.entity';

export abstract class DeliveryZoneRepository {
  abstract findAll(): Promise<DeliveryZone[]>;
  abstract findById(id: string): Promise<DeliveryZone | null>;
  abstract toggleActive(id: string, isActive: boolean): Promise<DeliveryZone>;
}
