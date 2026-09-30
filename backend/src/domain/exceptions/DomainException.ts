export abstract class DomainException extends Error {
  protected constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class EntityNotFoundException extends DomainException {
  constructor(entity: string, identifier: string) {
    super(`${entity} '${identifier}' was not found`, 'ENTITY_NOT_FOUND');
  }
}

export class BusinessRuleViolationException extends DomainException {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION');
  }
}

export class InvalidStateTransitionException extends DomainException {
  constructor(message: string) {
    super(message, 'INVALID_STATE_TRANSITION');
  }
}