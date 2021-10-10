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
            // mode: 'development',
            mode: 'production',
            base: '/pacer-editor/',
            registerType: 'autoUpdate',
            includeAssets: [
                'img/*',
                'patches/*'
            ],
            manifest: {
                name: 'Pacer Editor by StudioCode.dev',
                short_name: 'Pacer Editor',
                description: 'Configure your Nektar Pacer MIDI controller with your web browser.',
                theme_color: '#000000',
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
