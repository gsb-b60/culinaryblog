import slugify from 'slugify';

export class Slug {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(input: string): Slug {
    if (!input || input.trim().length === 0) {
      throw new Error('Slug input cannot be empty');
    }
    const slug = slugify(input.trim(), { lower: true, strict: true });
    if (slug.length > 220) {
      throw new Error('Slug exceeds maximum length of 220 characters');
    }
    return new Slug(slug);
  }

  static fromExisting(slug: string): Slug {
    if (!slug || slug.trim().length === 0) {
      throw new Error('Slug cannot be empty');
    }
    return new Slug(slug.trim().toLowerCase());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Slug): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}