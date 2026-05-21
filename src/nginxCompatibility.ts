import type {Component, ComponentVersionInfo} from "./types.ts";
import * as semver from "semver";
import {gitClone, configureArgsAddDynamicModule, configureArgsAddModule, configureArgsWith} from "./util.ts";

export const pcre: Component = {
    componentName: "pcre",
    componentHomePage: "https://sourceforge.net/projects/pcre/",
    nginxCompatibilityMap: {
        "*": {
            componentVersion: "8.45",
            generateDynamicResult: (component, componentVersion, componentBaseFolder, componentFolder) => {
                return {
                    downloadBash: [
                        `curl -L "https://sourceforge.net/projects/pcre/files/pcre/${componentVersion}/pcre-${componentVersion}.tar.gz" -o "${componentFolder}.tar.gz"`,
                        `tar -xzf "${componentFolder}.tar.gz" -C "${componentBaseFolder}"`,
                    ],
                    configureArgs: configureArgsWith(component.componentName, componentFolder),
                };
            },
        },
    },
};
export const zlib: Component = {
    componentName: "zlib",
    componentGitUrl: "https://github.com/madler/zlib.git",
    nginxCompatibilityMap: {
        "*": {
            componentVersion: "1.3.2",
            generateDynamicResult: (component, componentVersion, _componentBaseFolder, componentFolder) => {
                return {
                    downloadBash: gitClone(component.componentGitUrl, `v${componentVersion}`, componentFolder),
                    configureArgs: configureArgsWith(component.componentName, componentFolder),
                };
            },
        },
    },
};
export const openssl: Component = {
    componentName: "openssl",
    componentGitUrl: "https://github.com/openssl/openssl.git",
    nginxCompatibilityMap: {
        "<=1.27.1": {
            componentVersion: "1.1.1w",
            generateDynamicResult: (component, componentVersion, _componentBaseFolder, componentFolder) => {
                return {
                    downloadBash: gitClone(component.componentGitUrl, `OpenSSL_${componentVersion.replaceAll(".", "_")}`, componentFolder),
                    configureArgs: configureArgsWith(component.componentName, componentFolder),
                };
            },
        },
        ">1.27.1": {
            componentVersion: "3.6.2",
            generateDynamicResult: (component, componentVersion, _componentBaseFolder, componentFolder) => {
                return {
                    downloadBash: gitClone(component.componentGitUrl, `openssl-${componentVersion}`, componentFolder),
                    configureArgs: configureArgsWith(component.componentName, componentFolder),
                };
            },
        },
    },
};
export const moduleList: Component[] = [
    {
        componentName: "headers-more-nginx-module",
        componentGitUrl: "https://github.com/openresty/headers-more-nginx-module.git",
        nginxCompatibilityMap: {
            "*": {
                componentVersion: "0.39",
                generateDynamicResult: (component, componentVersion, _componentBaseFolder, componentFolder) => {
                    return {
                        downloadBash: gitClone(component.componentGitUrl, `v${componentVersion}`, componentFolder),
                        msvcPatchBash: [
                            `# see https://github.com/openresty/headers-more-nginx-module/issues/24`,
                            `sed -i '1i\\#ifndef DDEBUG\\n#define DDEBUG 0\\n#endif' "${componentFolder}/src/ddebug.h"`,
                            `find "${componentFolder}/src" -maxdepth 1 -type f -name "*.c" -exec sed -i '1i\\#include <ngx_config.h>' {} \\;`,
                        ],
                        configureArgsAddModule: configureArgsAddModule(componentFolder),
                        configureArgsAddDynamicModule: configureArgsAddDynamicModule(componentFolder),
                    };
                },
            },
        },
    },
    {
        componentName: "echo-nginx-module",
        componentGitUrl: "https://github.com/openresty/echo-nginx-module.git",
        nginxCompatibilityMap: {
            "*": {
                componentVersion: "0.64",
                generateDynamicResult: (component, componentVersion, _componentBaseFolder, componentFolder) => {
                    return {
                        downloadBash: gitClone(component.componentGitUrl, `v${componentVersion}`, componentFolder),
                        msvcPatchBash: [
                            `# similar to https://github.com/openresty/headers-more-nginx-module/issues/24`,
                            `sed -i '1i\\#ifndef DDEBUG\\n#define DDEBUG 0\\n#endif' "${componentFolder}/src/ddebug.h"`,
                            `find "${componentFolder}/src" -maxdepth 1 -type f -name "*.c" -exec sed -i '1i\\#include <ngx_config.h>' {} \\;`,
                        ],
                        configureArgsAddModule: configureArgsAddModule(componentFolder),
                        configureArgsAddDynamicModule: configureArgsAddDynamicModule(componentFolder),
                    };
                },
            },
        },
    },
];

export function findComponentVersionInfo(nginxVersion: string, component: Component): ComponentVersionInfo | null {
    const componentVersionInfoAvailableList: ComponentVersionInfo[] = [];
    const nginxCompatibilityMap = component.nginxCompatibilityMap;
    for (let nginxVersionRange in nginxCompatibilityMap) {
        if (!Object.prototype.hasOwnProperty.call(nginxCompatibilityMap, nginxVersionRange))
            continue;
        const componentVersionInfo = nginxCompatibilityMap[nginxVersionRange];
        if (semver.satisfies(nginxVersion, nginxVersionRange))
            componentVersionInfoAvailableList.push(componentVersionInfo);
    }
    const componentName = component.componentName;
    if (componentVersionInfoAvailableList.length === 0) {
        console.log(`component[${componentName}]: ignored`);
        return null;
    } else if (componentVersionInfoAvailableList.length > 1) {
        console.log(`component[${componentName}]: matched multiple versions, only one version can be accepted.`);
        throw new Error(`component[${componentName}]: matched multiple versions, only one version can be accepted.`);
    }
    const componentVersionInfo = componentVersionInfoAvailableList[0];
    console.log(`component[${componentName}]: ${componentVersionInfo.componentVersion}`);
    return componentVersionInfo
}
