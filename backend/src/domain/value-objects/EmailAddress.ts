const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class EmailAddress {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value.toLowerCase().trim();
  }

  static create(input: string): EmailAddress {
    if (!input || input.trim().length === 0) {
      throw new Error('Email address cannot be empty');
    }
    const normalized = input.toLowerCase().trim();
    if (!EMAIL_REGEX.test(normalized)) {
      throw new Error('Invalid email address format');
    }
    if (normalized.length > 256) {
      throw new Error('Email address exceeds maximum length of 256 characters');
    }
    return new EmailAddress(normalized);
  }

  static fromExisting(email: string): EmailAddress {
    return new EmailAddress(email);
  }

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    const parts = this.value.split('@');
    return parts[1] ?? '';
  }

  equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}