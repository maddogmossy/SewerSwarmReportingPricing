// types/sqljs.d.ts
declare module "sql.js" {
  export class Database {
    constructor(data?: Uint8Array);
    run(sql: string, params?: any[]): void;
    exec(sql: string): Array<{ columns: string[]; values: any[][] }>;
    prepare(sql: string): any;
    close(): void;
    export(): Uint8Array;
  }
}