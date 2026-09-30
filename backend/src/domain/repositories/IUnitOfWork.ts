export interface IUnitOfWork<TTransaction> {
  execute<T>(work: (transaction: TTransaction) => Promise<T>): Promise<T>;
}