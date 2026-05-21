export function gitClone(gitUrl: string, gitTag: string, targetFolder: string) {
    return `git clone --depth 1 -b "${gitTag}" "${gitUrl}" "${targetFolder}"`;
}

export function configureArgsWith(componentName: string, value?: string) {
    if (value) {
        return `  --with-${componentName}="${value}" \\`;
    } else {
        return `  --with-${componentName} \\`;
    }
}

export function configureArgsAddModule(value: string) {
    return `  --add-module="${value}" \\`;
}

export function configureArgsAddDynamicModule(value: string) {
    return `  --add-dynamic-module="${value}" \\`;
}

export function toString(array: string[]) {
    return array.map(e => e + "\n").join("");
}
