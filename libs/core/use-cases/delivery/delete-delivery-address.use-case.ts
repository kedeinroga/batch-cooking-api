import {
  DataNotFoundException,
  UnauthorizedAccessException,
} from '../../domain/exceptions/batch-cooking.exceptions';
import { DeliveryAddressRepository } from '../../domain-services/repositories/delivery-address.repository';

export interface DeleteDeliveryAddressInput {
  userId: string;
  addressId: string;
  traceId: string;
}

export class DeleteDeliveryAddressUseCase {
  constructor(
    private readonly deliveryAddressRepository: DeliveryAddressRepository,
  ) {}

  async execute(input: DeleteDeliveryAddressInput): Promise<void> {
    const existing = await this.deliveryAddressRepository.findById(
      input.addressId,
    );
    if (!existing)
      throw new DataNotFoundException('Delivery address not found');
    if (existing.userId !== input.userId)
      throw new UnauthorizedAccessException(
        'Address does not belong to this user',
      );

    await this.deliveryAddressRepository.delete(input.addressId);
  }
}
