import { Slug } from '../value-objects/Slug.js';

export interface CategoryProps {
  id: string;
  name: string;
  slug: Slug;
  description?: string;
  imageUrl?: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  version: number;
}

export class Category {
  private readonly props: CategoryProps;

  private constructor(props: CategoryProps) {
    this.props = props;
  }

  static create(props: Omit<CategoryProps, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version'>): Category {
    const slug = Slug.create(props.name);
    const now = new Date();
    return new Category({
      ...props,
      id: crypto.randomUUID(),
      slug,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      version: 1,
    });
  }

  static reconstruct(props: CategoryProps): Category {
    return new Category(props);
  }

  get id(): string { return this.props.id; }

  get name(): string { return this.props.name; }

  get slug(): Slug { return this.props.slug; }

  get description(): string | undefined { return this.props.description; }

  get imageUrl(): string | undefined { return this.props.imageUrl; }

  get orderIndex(): number { return this.props.orderIndex; }

  get createdAt(): Date { return this.props.createdAt; }

  get updatedAt(): Date { return this.props.updatedAt; }

  get isDeleted(): boolean { return this.props.isDeleted; }

  get version(): number { return this.props.version; }

  update(data: Partial<Omit<CategoryProps, 'id' | 'slug' | 'createdAt' | 'isDeleted' | 'version'>>): void {
    Object.assign(this.props, data);
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  softDelete(): void {
    this.props.isDeleted = true;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  toPersistence(): CategoryProps {
    return { ...this.props };
  }
}