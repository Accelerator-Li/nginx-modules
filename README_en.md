# Nginx Dynamic Modules

[中文](README.md) | [English](README_en.md)

A simple implementation for compiling [Nginx](https://github.com/nginx/nginx) (>=1.20.0) dynamic modules using GitHub Actions.

> This repository only provides automated compilation scripts. It does not include Nginx source code or third-party module source code. All dependencies are fetched at build time.

> Compilation testing has not been performed for Nginx versions lower than `1.20.0`.

## Download

- Go to the [Releases](https://github.com/Accelerator-Li/nginx-modules/releases) page of this repository to find precompiled dynamic modules for the corresponding Nginx version.
- To customize the Nginx version or add/remove modules, see [Customization](#customization).

## Library compatibility

- [pcre](https://sourceforge.net/projects/pcre/)

    | Nginx version | Version |
    |---------------|---------|
    | *             | 8.45    |

- [zlib](https://github.com/madler/zlib)

    | Nginx version | Version |
    |---------------|---------|
    | *             | 1.3.2   |

- [openssl](https://github.com/openssl/openssl)

    | Nginx version | Version |
    |---------------|---------|
    | \>1.27.1      | 3.6.2   |
    | <=1.27.1      | 1.1.1w  |

## Third-party module compatibility

- [headers-more-nginx-module](https://github.com/openresty/headers-more-nginx-module)

    | Nginx version | Version |
    |---------------|---------|
    | *             | 0.39    |

- [echo-nginx-module](https://github.com/openresty/echo-nginx-module)

    | Nginx version | Version |
    |---------------|---------|
    | *             | 0.64    |

## Platform support

### Linux

- ✅ Supports dynamic modules

### Windows

| Toolchain | Dynamic module support                                                             |
|-----------|------------------------------------------------------------------------------------|
| MSVC      | ❌ Does not support dynamic modules; modules must be statically compiled into Nginx |
| MinGW     | ✅ Supports dynamic modules                                                         |

## Customization

To customize the Nginx version, add/remove modules, or modify compilation options, follow the steps below:

1. Fork this repository.
2. Adjust the workflow [.github/workflows/build.yaml](.github/workflows/build.yaml): it contains some compilation options, etc.
3. Adjust the compatibility configuration [src/nginxCompatibility.ts](src/nginxCompatibility.ts): it contains compilation options, library versions, module versions, etc. You can add other modules by referencing the existing module definitions.

    ```ts
    export const moduleList: Component[] = [
        {
            // Required, module name
            componentName: "headers-more-nginx-module",
            // Optional, Git repository URL
            componentGitUrl: "https://github.com/openresty/headers-more-nginx-module.git",
            // Required, Nginx version mapping (nginxVersion -> componentVersion). Asterisk means matching all versions.
            // Note: Nginx version ranges must not overlap each other, otherwise ambiguity may occur.
            // If no match is found for the Nginx version, the module is skipped.
            nginxCompatibilityMap: {
                // ">=1.24.0": {
                //     // Example: when Nginx version is ≥ 1.24.0, use module version 2.0
                //     componentVersion: "2.0",
                // },
                // "<1.24.0": {
                //     // Example: when Nginx version is < 1.24.0, use module version 1.0
                //     componentVersion: "1.0",
                // },
                "*": {
                    // Required, module version
                    componentVersion: "0.39",
                    // Required, callback to generate dynamic build scripts
                    // Callback parameter componentBaseFolder: "libs/" or "modules/"
                    // Callback parameter componentFolder: "libs/${componentName}-${componentVersion}" or "modules/${componentName}-${componentVersion}"
                    generateDynamicResult: (component, componentVersion, componentBaseFolder, componentFolder) => {
                        return {
                            // Download script: example using Git
                            downloadBash: gitClone(component.componentGitUrl, `v${componentVersion}` /* git branch/tag */, componentFolder),
                            // Download script: you can also fully customize it
                            // Notice: The folder of source code must be `componentFolder`
                            // Notice: Do not use `cd` to change the current working directory unless you change it back at the end.
                            // downloadBash: [
                            //     `curl -L "https://sourceforge.net/projects/pcre/files/pcre/${componentVersion}/pcre-${componentVersion}.tar.gz" -o "${componentFolder}.tar.gz"`,
                            //     `tar -xzf "${componentFolder}.tar.gz" -C "${componentBaseFolder}"`,
                            // ],
                            // Optional, patch script for the MSVC toolchain (some third-party modules may fail to compile with MSVC)
                            msvcPatchBash: [
                                `# see https://github.com/openresty/headers-more-nginx-module/issues/24`,
                                `sed -i '1i\\#ifndef DDEBUG\\n#define DDEBUG 0\\n#endif' "${componentFolder}/src/ddebug.h"`,
                                `find "${componentFolder}/src" -maxdepth 1 -type f -name "*.c" -exec sed -i '1i\\#include <ngx_config.h>' {} \\;`,
                            ],
                            // Optional, additional arguments for configure, e.g., --with-compat, --with-debug
                            configureArgs: null,
                            // Optional, arguments for static module: --add-module=${componentFolder}
                            configureArgsAddModule: configureArgsAddModule(componentFolder),
                            // Optional, arguments for dynamic module: --add-dynamic-module=${componentFolder}
                            configureArgsAddDynamicModule: configureArgsAddDynamicModule(componentFolder),
                        };
                    },
                },
            },
        }
    ];
    ```

4. Go to the `Actions` page and run the `Build Nginx` workflow.
5. The workflow will dynamically generate the following files by running [src/generateDynamicBash.ts](src/generateDynamicBash.ts):
    - `githubOutput.txt`: workflow parameters
    - `download.sh`: download script
    - `msvcPatch.sh`: patch script for the MSVC toolchain
    - `configureArgs.txt`: additional arguments for configure
    - `configureArgsAddModule.txt`: arguments for static module
    - `configureArgsAddDynamicModule.txt`: arguments for dynamic module
6. The workflow compiles the modules and finally uploads the artifacts to `Releases`.
