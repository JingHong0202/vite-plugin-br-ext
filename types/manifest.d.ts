import { InputOptions, OutputAsset, PluginContext, OutputBundle } from 'rollup';
interface Resource {
    isEntry: boolean;
    relativePath: string;
    absolutePath: string;
    attrPath: string;
    ext: string;
    keyMap: string;
    output?: {
        path: string;
    };
}
type PreWork = {
    [key: string]: (...args: any[]) => {};
};
type MatchDynamic = {
    start: number;
    end: number;
    filesFieldStartIndex?: number;
    filesFieldEndIndex?: number;
    files?: {
        val: string;
        type: string;
    }[];
};
export declare class ManiFest {
    readonly origin: any;
    result: any;
    maniFestPath: string;
    hashTable: {
        [key: string | number]: Resource;
    };
    dynamicImports: Map<any, any>;
    permission: never[];
    inputs: {};
    preWork: PreWork;
    constructor(options: InputOptions);
    handerPermission(code: string): Promise<void>;
    handlerDynamicInput(plugin: PluginContext, code: string, id: string): Promise<string>;
    handlerDynamicJS(plugin: PluginContext, code: string, id: string): Promise<string>;
    handlerDynamicCSS(plugin: PluginContext, code: string, id: string): Promise<string>;
    matchDynamicFilePaths(reg: RegExp, code: string): Required<MatchDynamic[]>;
    handlerMatchedPaths({ type, matchAll, code, plugin, id, }: {
        type: 'chunk' | 'asset';
        matchAll: Required<MatchDynamic>[];
        code: string;
        plugin: PluginContext;
        id: string;
    }): Promise<string>;
    handlerCSS(plugin: PluginContext, chunk: OutputAsset, bundle: OutputBundle): Promise<string>;
    handlerResources(plugin: PluginContext): void;
    buildManifest(plugin: PluginContext): void;
    traverseDeep(target: any, parent?: string): void;
    matchFileByRules(rules: string, parent?: string): void;
    resolveInputs(): {
        [key: string]: string;
        [key: number]: string;
    };
}
export {};
