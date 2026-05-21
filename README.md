# Nginx 动态模块

[中文](README.md) | [English](README_en.md)

GitHub Actions 自动编译 [Nginx](https://github.com/nginx/nginx) (>=1.20.0) 动态模块的简易实现。

> 本项目仅提供自动化编译脚本，不包含 Nginx 源码或第三方模块源码，所有依赖均在构建时拉取。

> 未对低于 `1.20.0` 的 `Nginx` 版本进行编译测试。

## 下载

- 前往本仓库的 [Releases](https://github.com/Accelerator-Li/nginx-modules/releases) 页面，查找对应 Nginx 版本的预编译动态模块。
- 如需自定义 Nginx 版本或增减模块，见[自定义](#自定义)。

## 库兼容性

- [pcre](https://sourceforge.net/projects/pcre/)

    | Nginx 版本 | 版本   |
    |----------|------|
    | *        | 8.45 |

- [zlib](https://github.com/madler/zlib)

    | Nginx 版本 | 版本    |
    |----------|-------|
    | *        | 1.3.2 |

- [openssl](https://github.com/openssl/openssl)

    | Nginx 版本 | 版本     |
    |----------|--------|
    | \>1.27.1 | 3.6.2  |
    | <=1.27.1 | 1.1.1w |

## 第三方模块兼容性

- [headers-more-nginx-module](https://github.com/openresty/headers-more-nginx-module)

    | Nginx 版本 | 版本   |
    |----------|------|
    | *        | 0.39 |

- [echo-nginx-module](https://github.com/openresty/echo-nginx-module)

    | Nginx 版本 | 版本   |
    |----------|------|
    | *        | 0.64 |

## 支持限制

### Linux

- ✅ 支持动态模块

### Windows

| 工具链   | 动态模块支持                     |
|-------|----------------------------|
| MSVC  | ❌ 不支持动态模块，需要将模块静态编译进 Nginx |
| MinGW | ✅ 支持动态模块                   |

## 自定义

若需自定义 Nginx 版本、增减模块或修改编译选项，请参照以下步骤:

1. Fork 本仓库。
2. 调整工作流 [.github/workflows/build.yaml](.github/workflows/build.yaml): 其中包含部分编译选项等。
3. 调整兼容性配置 [src/nginxCompatibility.ts](src/nginxCompatibility.ts): 其中包含部分编译选项、库版本、各模块版本等，可参照已有模块写法添加其它模块。

    ```ts
    export const moduleList: Component[] = [
        {
            // 必填，模块名称
            componentName: "headers-more-nginx-module",
            // 可选, Git 仓库地址
            componentGitUrl: "https://github.com/openresty/headers-more-nginx-module.git",
            // 必填，Nginx 版本映射 (nginxVersion -> componentVersion), 星号表示匹配所有
            // 注意: Nginx 版本范围不能相互重叠，否则可能导致歧义
            // 如果 Nginx 版本没有匹配项，则跳过该模块
            nginxCompatibilityMap: {
                // ">=1.24.0": {
                //     // 例如: 当 Nginx 版本 ≥ 1.24.0 时, 模块版本使用 2.0
                //     componentVersion: "2.0",
                // },
                // "<1.24.0": {
                //     // 例如: 当 Nginx 版本 < 1.24.0 时, 模块版本使用 1.0
                //     componentVersion: "1.0",
                // },
                "*": {
                    // 必填，模块版本
                    componentVersion: "0.39",
                    // 必填，生成动态脚本的回调
                    // 回调参数 componentBaseFolder: "libs/" 或 "modules/"
                    // 回调参数 componentFolder: "libs/${componentName}-${componentVersion}" 或 "modules/${componentName}-${componentVersion}"
                    generateDynamicResult: (component, componentVersion, componentBaseFolder, componentFolder) => {
                        return {
                            // 下载脚本: 使用 Git 的示例
                            downloadBash: gitClone(component.componentGitUrl, `v${componentVersion}` /* git branch/tag */, componentFolder),
                            // 下载脚本: 也可以完全自定义.
                            // 注意: 源码文件夹必须是 componentFolder
                            // 注意: 不要使用 cd 改变当前工作目录，除非最后改回来
                            // downloadBash: [
                            //     `curl -L "https://sourceforge.net/projects/pcre/files/pcre/${componentVersion}/pcre-${componentVersion}.tar.gz" -o "${componentFolder}.tar.gz"`,
                            //     `tar -xzf "${componentFolder}.tar.gz" -C "${componentBaseFolder}"`,
                            // ],
                            // 可选, 在 MSVC 工具链下的补丁脚本 (使用 MSVC 编译部分第三方模块时可能报错)
                            msvcPatchBash: [
                                `# see https://github.com/openresty/headers-more-nginx-module/issues/24`,
                                `sed -i '1i\\#ifndef DDEBUG\\n#define DDEBUG 0\\n#endif' "${componentFolder}/src/ddebug.h"`,
                                `find "${componentFolder}/src" -maxdepth 1 -type f -name "*.c" -exec sed -i '1i\\#include <ngx_config.h>' {} \\;`,
                            ],
                            // 可选, configure 的附加参数: 如 --with-compat, --with-debug 等
                            configureArgs: null,
                            // 可选, 静态模块的参数: --add-module=xxx
                            configureArgsAddModule: configureArgsAddModule(componentFolder),
                            // 可选, 动态模块的参数: --add-dynamic-module=xxx
                            configureArgsAddDynamicModule: configureArgsAddDynamicModule(componentFolder),
                        };
                    },
                },
            },
        }
    ];
    ```

4. 前往 `Actions` 页面运行 `Build Nginx` 工作流。
5. 工作流将通过运行 [src/generateDynamicBash.ts](src/generateDynamicBash.ts) 动态生成以下文件:
    - `githubOutput.txt`: 工作流参数
    - `download.sh`: 下载脚本
    - `msvcPatch.sh`: 使用 MSVC 工具链时的补丁脚本
    - `configureArgs.txt`: configure 的附加参数
    - `configureArgsAddModule.txt`: 静态模块的参数
    - `configureArgsAddDynamicModule.txt`: 动态模块的参数
6. 工作流进行编译，最后上传产物到 `Releases`。
