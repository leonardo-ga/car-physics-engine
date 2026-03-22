import { defineConfig } from 'vite';

const isCodeSandbox = 'SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env;

export default defineConfig({
    root: 'src/',
    publicDir: false,
    base: './',
    server: {
        host: true,
        open: !isCodeSandbox
    },
    build: {
        outDir: '../docs',
        emptyOutDir: true,
        sourcemap: true,
        target: 'esnext'
    }
});
