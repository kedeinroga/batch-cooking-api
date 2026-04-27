export abstract class DomainException extends Error {
  abstract instanceCode: string;

  constructor(message?: string) {
    super(message);
    this.message = message ?? '';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
