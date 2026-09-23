export interface RecipeImageProps {
  id: string;
  recipeId: string;
  originalUrl: string;
  mediumUrl?: string;
  thumbnailUrl?: string;
  altText?: string;
  isPrimary: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  version: number;
}

export class RecipeImage {
  private readonly props: RecipeImageProps;

  private constructor(props: RecipeImageProps) {
    this.props = props;
  }

  static create(props: Omit<RecipeImageProps, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version'>): RecipeImage {
    const now = new Date();
    return new RecipeImage({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      version: 1,
    });
  }

  static reconstruct(props: RecipeImageProps): RecipeImage {
    return new RecipeImage(props);
  }

  get id(): string { return this.props.id; }
  get recipeId(): string { return this.props.recipeId; }
  get originalUrl(): string { return this.props.originalUrl; }
  get mediumUrl(): string | undefined { return this.props.mediumUrl; }
  get thumbnailUrl(): string | undefined { return this.props.thumbnailUrl; }
  get altText(): string | undefined { return this.props.altText; }
  get isPrimary(): boolean { return this.props.isPrimary; }
  get orderIndex(): number { return this.props.orderIndex; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get isDeleted(): boolean { return this.props.isDeleted; }
  get version(): number { return this.props.version; }

  setAsPrimary(): void {
    this.props.isPrimary = true;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  unsetPrimary(): void {
    this.props.isPrimary = false;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  update(data: Partial<Omit<RecipeImageProps, 'id' | 'recipeId' | 'createdAt' | 'isDeleted' | 'version'>>): void {
    Object.assign(this.props, data);
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  softDelete(): void {
    this.props.isDeleted = true;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  toPersistence(): RecipeImageProps {
    return { ...this.props };
  }
}