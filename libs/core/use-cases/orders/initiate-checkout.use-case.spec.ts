import { InitiateCheckoutUseCase } from './initiate-checkout.use-case';
import { OrderRepository } from '../../domain-services/repositories/order.repository';
import { WeeklyConfigRepository } from '../../domain-services/repositories/weekly-config.repository';
import { WeeklyPackageRepository } from '../../domain-services/repositories/weekly-package.repository';
import {
  OrderCapacityExceededException,
  OrderWindowClosedException,
  OrderNotEditableException,
  DataNotFoundException,
  DataInputException,
  UnauthorizedAccessException,
} from '../../domain/exceptions/batch-cooking.exceptions';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import * as weekUtils from '../../../shared/week-identifier.utils';

// ─── helpers ────────────────────────────────────────────────────────────────

const makeOrder = (overrides = {}) => ({
  id: 'order-1',
  userId: 'user-1',
  weekIdentifier: '2026-W16',
  deliveryAddressId: 'addr-1',
  sourcePackageId: undefined,
  status: OrderStatus.DRAFT,
  subtotal: 0,
  discountApplied: 0,
  total: 0,
  items: [
    {
      id: 'item-1',
      orderId: 'order-1',
      dayOfWeek: 1,
      mealType: 'LUNCH',
      dishId: 'dish-1',
      dishPrice: 20,
      sidePrice: 0,
    },
    {
      id: 'item-2',
      orderId: 'order-1',
      dayOfWeek: 1,
      mealType: 'DINNER',
      dishId: 'dish-2',
      dishPrice: 15,
      sidePrice: 5,
    },
  ],
  ...overrides,
});

const makeConfig = (overrides = {}) => ({
  id: 'cfg-1',
  weekIdentifier: '2026-W16',
  startDate: new Date('2026-04-13'),
  maxOrders: 50,
  discountPercentage: 10,
  isActive: true,
  ...overrides,
});

// ─── mocks ──────────────────────────────────────────────────────────────────

const orderRepoMock = {
  findById: jest.fn(),
  findByIdWithItems: jest.fn(),
  countConfirmedByWeek: jest.fn(),
  updateWithTransaction: jest.fn(),
  nextTicketSequential: jest.fn(),
} as unknown as OrderRepository;

const weeklyConfigRepoMock = {
  findByWeekIdentifier: jest.fn(),
} as unknown as WeeklyConfigRepository;

const weeklyPackageRepoMock = {
  findById: jest.fn(),
} as unknown as WeeklyPackageRepository;

// ─── suite ──────────────────────────────────────────────────────────────────

describe(InitiateCheckoutUseCase.name, () => {
  let useCase: InitiateCheckoutUseCase;
  let isWindowOpenSpy: jest.SpyInstance;

  beforeEach(() => {
    useCase = new InitiateCheckoutUseCase(
      orderRepoMock,
      weeklyConfigRepoMock,
      weeklyPackageRepoMock,
    );
    jest.clearAllMocks();

    // Default: window is open
    isWindowOpenSpy = jest
      .spyOn(weekUtils, 'isOrderWindowOpen')
      .mockReturnValue(true);
  });

  afterEach(() => {
    isWindowOpenSpy.mockRestore();
  });

  // ── window closed ──────────────────────────────────────────────────────────

  it('throws OrderWindowClosedException when order window is closed', async () => {
    isWindowOpenSpy.mockReturnValue(false);

    await expect(
      useCase.execute({
        userId: 'user-1',
        orderId: 'order-1',
        traceId: 'trace-1',
      }),
    ).rejects.toThrow(OrderWindowClosedException);
  });

  // ── order validation ───────────────────────────────────────────────────────

  it('throws DataNotFoundException when order does not exist', async () => {
    (orderRepoMock.findByIdWithItems as jest.Mock).mockResolvedValue(null);

    await expect(
      useCase.execute({
        userId: 'user-1',
        orderId: 'order-1',
        traceId: 'trace-1',
      }),
    ).rejects.toThrow(DataNotFoundException);
  });

  it('throws UnauthorizedAccessException when order belongs to a different user', async () => {
    (orderRepoMock.findByIdWithItems as jest.Mock).mockResolvedValue(
      makeOrder({ userId: 'other-user' }),
    );

    await expect(
      useCase.execute({
        userId: 'user-1',
        orderId: 'order-1',
        traceId: 'trace-1',
      }),
    ).rejects.toThrow(UnauthorizedAccessException);
  });

  it('throws OrderNotEditableException when order is not in DRAFT status', async () => {
    (orderRepoMock.findByIdWithItems as jest.Mock).mockResolvedValue(
      makeOrder({ status: OrderStatus.PENDING_PAYMENT }),
    );

    await expect(
      useCase.execute({
        userId: 'user-1',
        orderId: 'order-1',
        traceId: 'trace-1',
      }),
    ).rejects.toThrow(OrderNotEditableException);
  });

  it('throws DataInputException when order has no items', async () => {
    (orderRepoMock.findByIdWithItems as jest.Mock).mockResolvedValue(
      makeOrder({ items: [] }),
    );

    await expect(
      useCase.execute({
        userId: 'user-1',
        orderId: 'order-1',
        traceId: 'trace-1',
      }),
    ).rejects.toThrow(DataInputException);
  });

  // ── weekly config validation ───────────────────────────────────────────────

  it('throws DataInputException when no weekly config exists for the week', async () => {
    (orderRepoMock.findByIdWithItems as jest.Mock).mockResolvedValue(
      makeOrder(),
    );
    (weeklyConfigRepoMock.findByWeekIdentifier as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      useCase.execute({
        userId: 'user-1',
        orderId: 'order-1',
        traceId: 'trace-1',
      }),
    ).rejects.toThrow(DataInputException);
  });

  it('throws DataInputException when weekly config is inactive', async () => {
    (orderRepoMock.findByIdWithItems as jest.Mock).mockResolvedValue(
      makeOrder(),
    );
    (weeklyConfigRepoMock.findByWeekIdentifier as jest.Mock).mockResolvedValue(
      makeConfig({ isActive: false }),
    );

    await expect(
      useCase.execute({
        userId: 'user-1',
        orderId: 'order-1',
        traceId: 'trace-1',
      }),
    ).rejects.toThrow(DataInputException);
  });

  // ── capacity capping ───────────────────────────────────────────────────────

  it('throws OrderCapacityExceededException when maxOrders is reached', async () => {
    (orderRepoMock.findByIdWithItems as jest.Mock).mockResolvedValue(
      makeOrder(),
    );
    (weeklyConfigRepoMock.findByWeekIdentifier as jest.Mock).mockResolvedValue(
      makeConfig({ maxOrders: 50 }),
    );

    // Simulate the transaction: callback is called with a tx arg
    (orderRepoMock.updateWithTransaction as jest.Mock).mockImplementation(
      async (_id, _data, callback) => callback('tx'),
    );
    (orderRepoMock.countConfirmedByWeek as jest.Mock).mockResolvedValue(50);

    await expect(
      useCase.execute({
        userId: 'user-1',
        orderId: 'order-1',
        traceId: 'trace-1',
      }),
    ).rejects.toThrow(OrderCapacityExceededException);
  });

  it('allows checkout when confirmed count is below maxOrders', async () => {
    (orderRepoMock.findByIdWithItems as jest.Mock).mockResolvedValue(
      makeOrder(),
    );
    (weeklyConfigRepoMock.findByWeekIdentifier as jest.Mock).mockResolvedValue(
      makeConfig(),
    );

    const expectedOrder = makeOrder({
      status: OrderStatus.PENDING_PAYMENT,
      subtotal: 40,
      discountApplied: 4,
      total: 36,
      ticketNumber: 'TK-2026W16-0001',
    });

    (orderRepoMock.updateWithTransaction as jest.Mock).mockImplementation(
      async (_id, _data, callback) => {
        if (typeof callback === 'function') return callback('tx');
        return expectedOrder;
      },
    );
    (orderRepoMock.countConfirmedByWeek as jest.Mock).mockResolvedValue(49);
    (orderRepoMock.nextTicketSequential as jest.Mock).mockResolvedValue(1);

    const result = await useCase.execute({
      userId: 'user-1',
      orderId: 'order-1',
      traceId: 'trace-1',
    });
    expect(result).toEqual(expectedOrder);
  });

  // ── discount logic ─────────────────────────────────────────────────────────

  it('applies package discount when sourcePackageId is set and package is unmodified', async () => {
    const order = makeOrder({ sourcePackageId: 'pkg-1' });
    (orderRepoMock.findByIdWithItems as jest.Mock).mockResolvedValue(order);
    (weeklyConfigRepoMock.findByWeekIdentifier as jest.Mock).mockResolvedValue(
      makeConfig({ discountPercentage: 10 }),
    );
    (weeklyPackageRepoMock.findById as jest.Mock).mockResolvedValue({
      id: 'pkg-1',
      discountPercentage: 25,
    });
    (orderRepoMock.countConfirmedByWeek as jest.Mock).mockResolvedValue(0);
    (orderRepoMock.nextTicketSequential as jest.Mock).mockResolvedValue(1);

    let capturedData: any;
    (orderRepoMock.updateWithTransaction as jest.Mock).mockImplementation(
      async (id, data, callback) => {
        if (typeof callback === 'function') return callback('tx');
        capturedData = data;
        return { ...order, ...data, status: OrderStatus.PENDING_PAYMENT };
      },
    );

    await useCase.execute({
      userId: 'user-1',
      orderId: 'order-1',
      traceId: 'trace-1',
    });

    // subtotal = 20 + 15 + 5 = 40, package discount 25% → discountAmount = 10
    expect(capturedData?.discountApplied).toBeCloseTo(10, 5);
    expect(capturedData?.total).toBeCloseTo(30, 5);
  });

  it('applies general discount when sourcePackageId is undefined (manual or modified)', async () => {
    const order = makeOrder({ sourcePackageId: undefined });
    (orderRepoMock.findByIdWithItems as jest.Mock).mockResolvedValue(order);
    (weeklyConfigRepoMock.findByWeekIdentifier as jest.Mock).mockResolvedValue(
      makeConfig({ discountPercentage: 10 }),
    );
    (orderRepoMock.countConfirmedByWeek as jest.Mock).mockResolvedValue(0);
    (orderRepoMock.nextTicketSequential as jest.Mock).mockResolvedValue(1);

    let capturedData: any;
    (orderRepoMock.updateWithTransaction as jest.Mock).mockImplementation(
      async (id, data, callback) => {
        if (typeof callback === 'function') return callback('tx');
        capturedData = data;
        return { ...order, ...data, status: OrderStatus.PENDING_PAYMENT };
      },
    );

    await useCase.execute({
      userId: 'user-1',
      orderId: 'order-1',
      traceId: 'trace-1',
    });

    // subtotal = 40, general discount 10% → discountAmount = 4
    expect(capturedData?.discountApplied).toBeCloseTo(4, 5);
    expect(capturedData?.total).toBeCloseTo(36, 5);
  });

  // ── ticket number ──────────────────────────────────────────────────────────

  it('generates ticket number in correct format TK-YYYYWnn-NNNN', async () => {
    (orderRepoMock.findByIdWithItems as jest.Mock).mockResolvedValue(
      makeOrder(),
    );
    (weeklyConfigRepoMock.findByWeekIdentifier as jest.Mock).mockResolvedValue(
      makeConfig(),
    );
    (orderRepoMock.countConfirmedByWeek as jest.Mock).mockResolvedValue(0);
    (orderRepoMock.nextTicketSequential as jest.Mock).mockResolvedValue(3);

    let capturedData: any;
    (orderRepoMock.updateWithTransaction as jest.Mock).mockImplementation(
      async (id, data, callback) => {
        if (typeof callback === 'function') return callback('tx');
        capturedData = data;
        return { ...makeOrder(), ...data };
      },
    );

    await useCase.execute({
      userId: 'user-1',
      orderId: 'order-1',
      traceId: 'trace-1',
    });

    expect(capturedData?.ticketNumber).toBe('TK-2026W16-0003');
  });
});
