import react from '@vitejs/plugin-react'
import packageJson from "./package.json";
import {replaceCodePlugin} from "vite-plugin-replace";
import {VitePWA} from 'vite-plugin-pwa'

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
        }),
        VitePWA({
            mode: 'development',
            base: '/pacer-editor/',
            registerType: 'autoUpdate',
            includeAssets: [
                'img/*',
                'patches/*'
            ],
            manifest: {
                name: 'Vite PWA Lab',
                short_name: 'Vite PWA Lab',
                theme_color: '#ffffff',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable',
                    }
                ]
            }
        })
    ]
}
