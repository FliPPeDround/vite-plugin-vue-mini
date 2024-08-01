import { createFilter } from 'vite'

export const htmlFilter = createFilter(['**/*.html'])
export const cssFilter = createFilter(['**/*.{css,less,sass,scss,styl}'])
export const jsonFilter = createFilter(['**/*.json'])
export const jsOrtsFilter = createFilter(['**/*.{js,ts}'])
