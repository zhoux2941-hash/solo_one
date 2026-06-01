declare module 'better-sqlite3' {
  interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }
  
  interface Statement {
    run(...params: any[]): RunResult;
    get(...params: any[]): any;
    all(...params: any[]): any[];
    pluck(toggle?: boolean): Statement;
    bind(...params: any[]): Statement;
  }
  
  interface Database {
    prepare(sql: string): Statement;
    exec(sql: string): Database;
    pragma(sql: string, options?: any): any;
    close(): void;
    inTransaction: boolean;
    transaction(fn: (...args: any[]) => any): (...args: any[]) => any;
    open: boolean;
    filename: string;
  }
  
  const DatabaseConstructor: new (path: string, options?: { readonly?: boolean; fileMustExist?: boolean; timeout?: number; verbose?: () => void }) => Database;
  
  export = DatabaseConstructor;
}
