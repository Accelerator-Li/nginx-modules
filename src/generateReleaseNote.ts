import {pcre, zlib, openssl, moduleList} from "./nginxCompatibility.ts";
import {toString} from "./util.ts";
import type {Component} from "./types.ts";
import fs from "fs";

(function main() {

    const result: string[] = [];

    const assetsStr = fs.readFileSync("assets.txt", {encoding: "utf-8"});
    const assetNameList = procAssetNameList(assetsStr.split("\n"));
    result.push(`## Assets`);
    if (assetNameList.length === 0) {
        result.push(`- empty`);
    } else {
        assetNameList.forEach((assetName) => {
            result.push(`- \`${assetName}\``);
        });
    }
    result.push(``);

    result.push(`## Library compatibility`);
    result.push(...generateNginxCompatibility(pcre));
    result.push(...generateNginxCompatibility(zlib));
    result.push(...generateNginxCompatibility(openssl));

    result.push(`## Third-party module compatibility`);
    moduleList.forEach(module => {
        result.push(...generateNginxCompatibility(module));
    });

    fs.writeFileSync("releaseNote.md", toString(result), {encoding: "utf-8"});

})();

function procAssetNameList(assetNameList: string[]) {
    const set = new Set<string>();
    assetNameList.forEach(assetName => {
        if (assetName)
            set.add(assetName);
    });
    return [...set].sort((a, b) => a.localeCompare(b, undefined, {numeric: true, sensitivity: "base"}));
}

function generateNginxCompatibility(component: Component) {
    const componentName = component.componentName;
    const componentHomePage = component.componentHomePage || component.componentGitUrl;
    const list: string[] = [
        componentHomePage ? `- [${componentName}](${componentHomePage})` : `- ${componentName}`,
        ``,
        `    | Nginx version | Version |`,
        `    |---------------|---------|`,
    ];
    const nginxCompatibilityMap = component.nginxCompatibilityMap;
    for (let nginxVersionRange in nginxCompatibilityMap) {
        if (!Object.prototype.hasOwnProperty.call(nginxCompatibilityMap, nginxVersionRange))
            continue;
        const componentVersionInfo = nginxCompatibilityMap[nginxVersionRange];
        list.push(`    | ${nginxVersionRange.replaceAll(">", "\\>")} | ${componentVersionInfo.componentVersion} |`);
    }
    list.push(``);
    return list;
}
