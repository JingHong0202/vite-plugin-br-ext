declare function get(target: any, attr: string | number): any;
declare function set(target: any, attr: string | number, value: any): any;
declare function getType<T>(target: T): string;
declare function createUUID(): string;
declare function parsePreCSS(dependciesName: string, filePath: string): Promise<any>;
declare function deleteDirectoryStack(directory: string): void;
export { get, set, getType, createUUID, parsePreCSS, deleteDirectoryStack };
