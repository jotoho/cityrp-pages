// SPDX-License-Identifier: CC0-1.0
// SPDX-FileCopyrightText: 2025 Jonas Tobias Hopusch <git@jotoho.de>

import { defineConfig } from 'vite';
import injectHTML from 'vite-plugin-html-inject';
import { stripHTMLComments } from "@zade/vite-plugin-strip-html-comments";
import { execSync } from "node:child_process";

export default defineConfig({
	plugins: [injectHTML(), stripHTMLComments()],
	build: {
		target: 'es2024',
		sourcemap: true,
	},
	define: {
		VERSION: JSON.stringify(execSync("git describe --dirty --broken --tags --always").toString("utf8").trim() ?? "unknown-version"),
	},
});
