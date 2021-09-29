import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import packageJson from "./package.json";
import { replaceCodePlugin } from "vite-plugin-replace";

// https://vitejs.dev/config/
// export default defineConfig({    // defineConfig will throw TS warning rel. to replace()
export default {
    build: {
        sourcemap: process.env.SOURCE_MAP === 'true',
    },
    base: '/pacer-editor/',
    plugins: [
        react(),
        replaceCodePlugin({
            replacements: [{
                    from: "__CLI_NAME__",
                    to: packageJson.name,
                }, {
                    from: /__CLI_VERSION__/g,
                    to: packageJson.version,
                }
            ]
        })
    ]
}
