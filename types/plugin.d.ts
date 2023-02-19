import  type { FunctionPluginHooks,InputOptions } from 'rollup';
import  type { Plugin } from 'vite';

export type PluginOptions = Plugin 

export interface Resource  {
  isEntry: boolean;
  relativePath: string;
  absolutePath: string;
  attrPath: string;
  ext:string;
  keyMap: string;
  output?: {
    path: string
  }
}


export type PreWork = {
  [key:string] : (...args: any[]) => {}
}

export type MatchDynamic = {
  start: number;
  end: number;
  filesFieldStartIndex?: number;
  filesFieldEndIndex?: number;
  files?: {
    val: string;
    type: string;
  }[]
}