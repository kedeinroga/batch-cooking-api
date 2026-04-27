import { DomainException } from './domain.exception';

export class DataSourceException extends DomainException {
  static staticCode = 'data-source-exception';
  instanceCode = DataSourceException.staticCode;
}

export class DataNotFoundException extends DomainException {
  static staticCode = 'data-not-found-exception';
  instanceCode = DataNotFoundException.staticCode;
}

export class DataInputException extends DomainException {
  static staticCode = 'data-input-exception';
  instanceCode = DataInputException.staticCode;
}

export class OrderCapacityExceededException extends DomainException {
  static staticCode = 'order-capacity-exceeded';
  instanceCode = OrderCapacityExceededException.staticCode;
}

export class OrderWindowClosedException extends DomainException {
  static staticCode = 'order-window-closed';
  instanceCode = OrderWindowClosedException.staticCode;
}

export class OrderNotEditableException extends DomainException {
  static staticCode = 'order-not-editable';
  instanceCode = OrderNotEditableException.staticCode;
}

export class UnauthorizedAccessException extends DomainException {
  static staticCode = 'unauthorized-access';
  instanceCode = UnauthorizedAccessException.staticCode;
}
