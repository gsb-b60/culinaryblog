export interface RecipeIngredientProps {
  id: string;
  recipeId: string;
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  version: number;
}

export class RecipeIngredient {
  private readonly props: RecipeIngredientProps;

  private constructor(props: RecipeIngredientProps) {
    this.props = props;
  }

  static create(props: Omit<RecipeIngredientProps, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version'>): RecipeIngredient {
    const now = new Date();
    return new RecipeIngredient({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      version: 1,
    });
  }

  static reconstruct(props: RecipeIngredientProps): RecipeIngredient {
    return new RecipeIngredient(props);
  }

  get id(): string { return this.props.id; }
  get recipeId(): string { return this.props.recipeId; }
  get name(): string { return this.props.name; }
  get quantity(): number | undefined { return this.props.quantity; }
  get unit(): string | undefined { return this.props.unit; }
  get notes(): string | undefined { return this.props.notes; }
  get orderIndex(): number { return this.props.orderIndex; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get isDeleted(): boolean { return this.props.isDeleted; }
  get version(): number { return this.props.version; }

  update(data: Partial<Omit<RecipeIngredientProps, 'id' | 'recipeId' | 'createdAt' | 'isDeleted' | 'version'>>): void {
    Object.assign(this.props, data);
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  softDelete(): void {
    this.props.isDeleted = true;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  toPersistence(): RecipeIngredientProps {
    return { ...this.props };
  }
}