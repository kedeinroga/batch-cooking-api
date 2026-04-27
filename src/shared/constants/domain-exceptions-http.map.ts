import {
  DataInputException,
  DataNotFoundException,
  DataSourceException,
  OrderCapacityExceededException,
  OrderNotEditableException,
  OrderWindowClosedException,
  UnauthorizedAccessException,
} from '@batch-cooking/domain';

export interface HttpExceptionMapping {
  statusCode: number;
  code: string;
  errorMessage: string;
}

export const DOMAIN_EXCEPTIONS_HTTP_MAP: Record<string, HttpExceptionMapping> =
  {
    [DataSourceException.staticCode]: {
      statusCode: 500,
      code: DataSourceException.staticCode,
      errorMessage: 'Database error',
    },
    [DataNotFoundException.staticCode]: {
      statusCode: 404,
      code: DataNotFoundException.staticCode,
      errorMessage: 'Resource not found',
    },
    [DataInputException.staticCode]: {
      statusCode: 400,
      code: DataInputException.staticCode,
      errorMessage: 'Invalid input',
    },
    [OrderCapacityExceededException.staticCode]: {
      statusCode: 409,
      code: OrderCapacityExceededException.staticCode,
      errorMessage: 'Weekly capacity reached',
    },
    [OrderWindowClosedException.staticCode]: {
      statusCode: 422,
      code: OrderWindowClosedException.staticCode,
      errorMessage: 'Order window is closed',
    },
    [OrderNotEditableException.staticCode]: {
      statusCode: 422,
      code: OrderNotEditableException.staticCode,
      errorMessage: 'Order cannot be edited in its current status',
    },
    [UnauthorizedAccessException.staticCode]: {
      statusCode: 403,
      code: UnauthorizedAccessException.staticCode,
      errorMessage: 'Access denied',
    },
  };
