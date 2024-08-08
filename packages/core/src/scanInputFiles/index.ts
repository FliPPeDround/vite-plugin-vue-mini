/* eslint-disable no-console */
import { basename, dirname, isAbsolute, join, posix, resolve, sep } from 'node:path'
import { globSync } from 'fast-glob'
import { copySync, pathExistsSync, readJSONSync } from 'fs-extra'
import {
  getPackageInfoSync,
  isPackageExists,
} from 'local-pkg'
import { cssFilter, jsOrtsFilter } from './../utils'
import { wxSupportFileTypes } from './../constants'

interface FileCategories {
  compiler: string[]
  copy: string[]
}

interface ScanResult {
  enterList: Record<string, string>
  copyList: string[]
}

function fromEntriesPath(paths: string[]): Record<string, string> {
  return Object.fromEntries(paths.map((file) => {
    const filePath = posix.relative('src', file)
    return [filePath, file]
  }))
}

function categorizeFiles(files: string[]): FileCategories {
  return files.reduce<FileCategories>((acc, file) => {
    if (cssFilter(file) || jsOrtsFilter(file))
      acc.compiler.push(file)
    else
      acc.copy.push(file)

    return acc
  }, { compiler: [], copy: [] })
}

function readComponents(jsonFilePath: string): string[] {
  try {
    const jsonContent = readJSONSync(jsonFilePath)
    return (Object.values(jsonContent?.usingComponents || {}) as string[]).map((component) => {
      return isAbsolute(component) ? component : posix.relative('src', resolve(dirname(jsonFilePath), component))
    })
  }
  catch (error) {
    console.error(`Error reading JSON file: ${jsonFilePath}`, error)
    return []
  }
}

function getRootDirectory(pathStr: string) {
  const parts = pathStr.split(sep)
  return parts[0]
}

// function getRelativePath(pathStr: string) {
//   const parts = pathStr.split(sep)
//   return parts.slice(1).join(sep)
// }

function scanFilesRecursively(entry: string, visited: Set<string>): ScanResult {
  const entryPath = join('src', `${entry}.json`)
  console.log('entryPath', entryPath)
  // TODO 全量复制，不是一个好办法
  // TODO 需解决usingComponents相对和绝对的转换
  if (!pathExistsSync(entryPath)) {
    const pkgName = getRootDirectory(entry)
    if (isPackageExists(pkgName)) {
      const { packageJson, rootPath } = getPackageInfoSync(pkgName)!
      const source = join(rootPath, packageJson.miniprogram || 'miniprogram_dist')
      const destination = resolve('dist', 'miniprogram_npm', pkgName)
      copySync(source, destination)
    }
    return { enterList: {}, copyList: [] }
  }

  if (visited.has(entryPath))
    return { enterList: {}, copyList: [] }

  visited.add(entryPath)

  const files = globSync(`src/${entry}.**`)
  console.log(files)
  const { compiler: enterFiles, copy: copyFiles } = categorizeFiles(files)

  const components = readComponents(entryPath)
  console.log('components', components)
  const result = components.reduce<ScanResult>((acc, component) => {
    const componentResult = scanFilesRecursively(component, visited)
    acc.copyList.push(...componentResult.copyList)
    Object.assign(acc.enterList, componentResult.enterList)
    return acc
  }, {
    enterList: fromEntriesPath(enterFiles),
    copyList: copyFiles,
  })

  return result
}

export function scanInputFiles(): ScanResult {
  const appJSON = readJSONSync('src/app.json')
  const pages = appJSON.pages as string[]
  const components = Object.values(appJSON?.usingComponents || {}) as string[]
  const visited = new Set<string>()

  const inputList = [...pages, ...components].reduce<ScanResult>((acc, page) => {
    const pageResult = scanFilesRecursively(page, visited)
    acc.copyList.push(...pageResult.copyList)
    Object.assign(acc.enterList, pageResult.enterList)
    return acc
  }, {
    enterList: {},
    copyList: [],
  })

  const rootFiles = globSync('src/*.**')
  const { compiler: rootFilesWithCompiler, copy: rootFilesWithCopy } = categorizeFiles(rootFiles)
  Object.assign(inputList.enterList, fromEntriesPath(rootFilesWithCompiler))
  const assetsFiles = globSync(`src/**/*.{${wxSupportFileTypes.join(',')}}`)
  inputList.copyList.push(...rootFilesWithCopy, ...assetsFiles)

  return inputList
}
