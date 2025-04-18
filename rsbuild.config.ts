import { pluginPreact } from '@rsbuild/plugin-preact';
import { pluginTypedCSSModules } from "@rsbuild/plugin-typed-css-modules";

export default {
    plugins: [
        pluginPreact(),
        pluginTypedCSSModules(),
    ],
    html: {
        template: './index.html',
    },
    source: {
        entry: {
            index: './src/index.tsx',
        },
    },
    output: {
        copy: [
            {
                from: "node_modules/foxomoji/dist/**/*",
                to: "foxomoji"
            }
        ]
    },
    resolve: {
        alias: {
            "@components": "./src/components",
            "@icons": "./src/assets/svg",
            "@hooks": "./src/hooks/",
            "@services": "./src/services/",
            "@utils": "./src/utils/",
            "@store/chat": "store/chat/index.ts",
            "@store": "./src/store/",
            "@interfaces": "./src/interfaces/",
        },
    },
};
