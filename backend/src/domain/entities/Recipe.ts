import { RecipeStatus } from '../enums/RecipeStatus.js';
import { RecipeDifficulty } from '../enums/RecipeDifficulty.js';
import { Slug } from '../value-objects/Slug.js';

export interface RecipeNutrition {
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
}

export interface RecipeProps {
  id: string;
  title: string;
  slug: Slug;
  description: string;
  instructions?: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: RecipeDifficulty;
  status: RecipeStatus;
  categoryId: string;
  authorId: string;
  nutrition?: RecipeNutrition;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  version: number;
}

export class Recipe {
  private readonly props: RecipeProps;

  private constructor(props: RecipeProps) {
    this.props = props;
  }

  static create(props: Omit<RecipeProps, 'id' | 'slug' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'version' | 'status' | 'publishedAt'>): Recipe {
    const slug = Slug.create(props.title);
    const now = new Date();
    return new Recipe({
      ...props,
      id: crypto.randomUUID(),
      slug,
      status: RecipeStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      version: 1,
    });
  }

  static reconstruct(props: RecipeProps): Recipe {
    return new Recipe(props);
  }

  get id(): string { return this.props.id; }
  get title(): string { return this.props.title; }
  get slug(): Slug { return this.props.slug; }
  get description(): string { return this.props.description; }
  get instructions(): string | undefined { return this.props.instructions; }
  get prepTime(): number { return this.props.prepTime; }
  get cookTime(): number { return this.props.cookTime; }
  get servings(): number { return this.props.servings; }
  get difficulty(): RecipeDifficulty { return this.props.difficulty; }
  get status(): RecipeStatus { return this.props.status; }
  get categoryId(): string { return this.props.categoryId; }
  get authorId(): string { return this.props.authorId; }
  get nutrition(): RecipeNutrition | undefined { return this.props.nutrition; }
  get publishedAt(): Date | undefined { return this.props.publishedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get isDeleted(): boolean { return this.props.isDeleted; }
  get version(): number { return this.props.version; }

  get totalTime(): number {
    return this.props.prepTime + this.props.cookTime;
  }

  canPublish(): boolean {
    return this.props.status === RecipeStatus.DRAFT;
  }

  publish(): void {
    if (this.props.status === RecipeStatus.PUBLISHED) return;
    if (!this.canPublish()) {
      throw new Error('Recipe cannot be published in current state');
    }
    this.props.status = RecipeStatus.PUBLISHED;
    this.props.publishedAt = new Date();
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  unpublish(): void {
    if (this.props.status === RecipeStatus.DRAFT) return;
    this.props.status = RecipeStatus.DRAFT;
    this.props.publishedAt = undefined;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  archive(): void {
    this.props.status = RecipeStatus.ARCHIVED;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  update(data: Partial<Omit<RecipeProps, 'id' | 'slug' | 'createdAt' | 'isDeleted' | 'version'>>): void {
    Object.assign(this.props, data);
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  softDelete(): void {
    this.props.isDeleted = true;
    this.props.updatedAt = new Date();
    this.props.version += 1;
  }

  toPersistence(): RecipeProps {
    return { ...this.props };
  }
}