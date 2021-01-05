import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import { terser } from 'rollup-plugin-terser';
import sourceMaps from 'rollup-plugin-sourcemaps';

const pkg = require('./package.json'); // Allow json resolution

const libraryName = 'WoodpeckerLogger';

export default {
    input: `src/index.ts`,
    output: [
        { file: pkg.main, format: 'cjs', sourcemap: true },
        { file: pkg.module, format: 'esm', sourcemap: true },
        { file: 'dist/wp-log.umd.js', name: libraryName, format: 'umd', sourcemap: true },
        { file: 'dist/wp-log.js', name: libraryName, format: 'iife', sourcemap: true },
        { file: 'e2e/js/wp-log.js', name: libraryName, format: 'iife', sourcemap: true }
    ],
    // Indicate here external modules you don't wanna include in your bundle (i.e.: 'lodash')
    external: [],
    watch: {
        include: 'src/**'
    },
    plugins: [
        // Compile TypeScript files
        typescript(),
        // Allow json resolution
        json(),
        // Allow node_modules resolution, so you can use 'external' to control
        // which external modules to include in the bundle
        // https://github.com/rollup/rollup-plugin-node-resolve#usage
        nodeResolve(),
        // Allow bundling cjs modules (unlike webpack, rollup doesn't understand cjs)
        commonjs(),
        // minify js
        terser(),
        // // Resolve source maps to the original source
        sourceMaps()
    ]
};
