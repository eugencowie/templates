import { defineConfig, includeIgnoreFile } from "eslint/config";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import ts from "typescript-eslint";
import astro from "eslint-plugin-astro";

export default defineConfig([
  includeIgnoreFile(fileURLToPath(new URL(".gitignore", import.meta.url))),
  js.configs.recommended,
  ts.configs.recommended,
  astro.configs.recommended,
]);
