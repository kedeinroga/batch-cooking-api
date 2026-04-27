import { DeliveryAddress } from '../../domain/entities/delivery-address.entity';
import { DeliveryAddressRepository } from '../../domain-services/repositories/delivery-address.repository';

export interface ListDeliveryAddressesInput {
  userId: string;
  traceId: string;
}

export class ListDeliveryAddressesUseCase {
  constructor(
    private readonly deliveryAddressRepository: DeliveryAddressRepository,
  ) {}

  async execute(input: ListDeliveryAddressesInput): Promise<DeliveryAddress[]> {
    return this.deliveryAddressRepository.findByUser(input.userId);
  }
}
