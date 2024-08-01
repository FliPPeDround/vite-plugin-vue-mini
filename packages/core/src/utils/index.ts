import { createFilter } from 'vite'

export const htmlFilter = createFilter(['**/*.html'])
export const cssFilter = createFilter(['**/*.css'])
export const jsonFilter = createFilter(['**/*.json'])
export const jsOrtsFilter = createFilter(['**/*.{js,ts}'])
