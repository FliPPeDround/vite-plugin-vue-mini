import { posix } from 'node:path'
import { globSync } from 'fast-glob'
import { readJSONSync } from 'fs-extra'
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
    return Object.values(jsonContent?.usingComponents || {}) as string[]
  }
  catch (error) {
    console.error(`Error reading JSON file: ${jsonFilePath}`, error)
    return []
  }
}

function scanFilesRecursively(entry: string, visited: Set<string>): ScanResult {
  const entryPath = `src/${entry}.json`
  if (visited.has(entryPath))
    return { enterList: {}, copyList: [] }

  visited.add(entryPath)

  const files = globSync(`src/${entry}.**`)
  const { compiler: enterFiles, copy: copyFiles } = categorizeFiles(files)

  const components = readComponents(entryPath)
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
