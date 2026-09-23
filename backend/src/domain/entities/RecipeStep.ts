export interface RecipeStepProps {
  id: string;
  recipeId: string;
  stepNumber: number;
  title: string;
  description: string;
  timerMinutes?: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  version: number;
}

export class RecipeStep {
  private readonly props: RecipeStepProps;

  private constructor(props: RecipeStepProps) {
    this.props = props;
  }

  static create(props: Omit<RecipeStepProps, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version'>): RecipeStep {
    const now = new Date();
    return new RecipeStep({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      version: 1,
    });
  }

  static reconstruct(props: RecipeStepProps): RecipeStep {
    return new RecipeStep(props);
  }

  get id(): string { return this.props.id; }

  get recipeId(): string { return this.props.recipeId; }

  get stepNumber(): number { return this.props.stepNumber; }

  get title(): string { return this.props.title; }

  get description(): string { return this.props.description; }

  get timerMinutes(): number | undefined { return this.props.timerMinutes; }

  get imageUrl(): string | undefined { return this.props.imageUrl; }

  get createdAt(): Date { return this.props.createdAt; }

  get updatedAt(): Date { return this.props.updatedAt; }

  get isDeleted(): boolean { return this.props.isDeleted; }

  get version(): number { return this.props.version; }

  update(data: Partial<Omit<RecipeStepProps, 'id' | 'recipeId' | 'createdAt' | 'isDeleted' | 'version'>>): void {
    Object.assign(this.props, data);
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  softDelete(): void {
    this.props.isDeleted = true;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  toPersistence(): RecipeStepProps {
    return { ...this.props };
  }
}