declare module 'bcryptjs' {
  export function hashSync(value: string, saltOrRounds: string | number): string;
  export function compareSync(value: string, hash: string): boolean;
}
