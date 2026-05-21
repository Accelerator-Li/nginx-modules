/**
 * nginxVersionRange -> componentVersionInfo
 */
export type NginxCompatibilityMap = Record<string, ComponentVersionInfo>;

export interface ComponentVersionInfo {
    componentVersion: string;
    generateDynamicResult: (component: Component, componentVersion: string, componentBaseFolder: string, componentFolder: string) => DynamicResult;
}

export interface Component {
    componentName: string;
    componentGitUrl?: string;
    componentHomePage?: string;
    nginxCompatibilityMap: NginxCompatibilityMap;
}

export interface DynamicResult {
    downloadBash?: string | string[];
    msvcPatchBash?: string | string[];
    configureArgs?: string | string[];
    configureArgsAddModule?: string | string[];
    configureArgsAddDynamicModule?: string | string[];
}
