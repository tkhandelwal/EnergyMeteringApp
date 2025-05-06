import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        port: 53992,
        hmr: {
            host: 'localhost',
            port: 53992
        },
        proxy: {
            '/api': {
                target: 'http://localhost:5255',
                changeOrigin: true,
                configure: (proxy) => {
                    proxy.on('error', (err) => {
                        console.log('proxy error', err);
                    });
                }
            }
        }
    }
});