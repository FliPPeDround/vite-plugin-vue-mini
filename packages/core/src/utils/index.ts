import { createFilter } from 'vite'
import { wxSupportFileTypes } from './../constants/index'

export const htmlFilter = createFilter(['**/*.html'])
export const cssFilter = createFilter(['**/*.{css,less,sass,scss,styl}'])
export const jsonFilter = createFilter(['**/*.json'])
export const jsOrtsFilter = createFilter(['**/*.{js,ts}'])
export const assetFilter = createFilter([`**/*.{${wxSupportFileTypes.join(',')}}`])
