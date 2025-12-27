// SPDX-License-Identifier: CC0-1.0
// SPDX-FileCopyrightText: 2025 Jonas Tobias Hopusch <git@jotoho.de>

import { defineConfig } from 'vite';
import injectHTML from 'vite-plugin-html-inject';
import { stripHTMLComments } from "@zade/vite-plugin-strip-html-comments";
import { execSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	plugins: [injectHTML(), stripHTMLComments()],
	build: {
	    rollupOptions: {
	        input: {
	            index: resolve(__dirname, "./index.html"),
	            rentalregistry: resolve(__dirname, "./rentalregistry.html"),
	        },
	    },
		target: 'es2024',
		sourcemap: true,
	},
	define: {
		VERSION: JSON.stringify(execSync("git describe --dirty --broken --tags --always").toString("utf8").trim() ?? "unknown-version"),
	},
});
