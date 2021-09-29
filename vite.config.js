import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// export default defineConfig({    // defineConfig will throw TS warning rel. to replace()
export default {
    build: {
        sourcemap: process.env.SOURCE_MAP === 'true',
    },
    base: '/pacer-editor/',
    plugins: [
        react()
    ]
}
