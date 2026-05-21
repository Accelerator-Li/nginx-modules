import * as semver from "semver";
import {pcre, zlib, openssl, moduleList, findComponentVersionInfo} from "./nginxCompatibility.ts";
import {gitClone, toString} from "./util.ts";
import type {Component, DynamicResult} from "./types.ts";
import fs from "fs";

(function main(args: string[]) {
    const nginxVersion = semver.valid(args[0]);
    if (!nginxVersion) {
        console.error("invalid nginx version");
        process.exit(1);
    }

    const nginxFolder = `nginx-${nginxVersion}`;

    const list_githubOutput: string[] = [
        `nginxFolder=${nginxFolder}`
    ];
    const list_downloadBash: string[] = [
        `#!/bin/bash`,
        `set -e`,
        gitClone("https://github.com/nginx/nginx.git", `release-${nginxVersion}`, nginxFolder),
        `cd "${nginxFolder}"`,
        `mkdir "libs"`,
        `mkdir "modules"`,
    ];
    const list_msvcPatchBash: string[] = [
        `#!/bin/bash`,
        `set -e`,
        `cd "${nginxFolder}"`
    ];
    const list_configureArgs: string[] = [];
    const list_configureArgsAddModule: string[] = [];
    const list_configureArgsAddDynamicModule: string[] = [];

    const list_dynamicResult: (DynamicResult | null)[] = [
        generateDynamicResult(nginxVersion, "libs/", pcre),
        generateDynamicResult(nginxVersion, "libs/", zlib),
        generateDynamicResult(nginxVersion, "libs/", openssl),
        ...moduleList.map(module => generateDynamicResult(nginxVersion, "modules/", module)),
    ];

    list_dynamicResult.forEach(dynamicBash => {
        if (!dynamicBash)
            return;
        appendTo(list_downloadBash, dynamicBash.downloadBash);
        appendTo(list_msvcPatchBash, dynamicBash.msvcPatchBash);
        appendTo(list_configureArgs, dynamicBash.configureArgs);
        appendTo(list_configureArgsAddModule, dynamicBash.configureArgsAddModule);
        appendTo(list_configureArgsAddDynamicModule, dynamicBash.configureArgsAddDynamicModule);
    });

    fs.writeFileSync("githubOutput.txt", toString(list_githubOutput), {encoding: "utf-8"});
    fs.writeFileSync("download.sh", toString(list_downloadBash), {encoding: "utf-8"});
    fs.writeFileSync("msvcPatch.sh", toString(list_msvcPatchBash), {encoding: "utf-8"});
    fs.writeFileSync("configureArgs.txt", toString(list_configureArgs), {encoding: "utf-8"});
    fs.writeFileSync("configureArgsAddModule.txt", toString(list_configureArgsAddModule), {encoding: "utf-8"});
    fs.writeFileSync("configureArgsAddDynamicModule.txt", toString(list_configureArgsAddDynamicModule), {encoding: "utf-8"});

})(process.argv.slice(2));

function generateDynamicResult(nginxVersion: string, componentBaseFolder: string, component: Component): DynamicResult | null {
    const componentVersionInfo = findComponentVersionInfo(nginxVersion, component);
    if (!componentVersionInfo)
        return null;
    const componentName = component.componentName;
    const componentVersion = componentVersionInfo.componentVersion;
    const componentFolder = `${componentBaseFolder}${componentName}-${componentVersion}`;
    return componentVersionInfo.generateDynamicResult(component, componentVersion, componentBaseFolder, componentFolder);
}

function appendTo(list: string[], value: string | string[] | undefined) {
    if (typeof value === "string")
        list.push(value);
    else if (value instanceof Array)
        list.push(...value);
}
