import process from 'node:process'
import { dirname, isAbsolute, join, relative, resolve, sep } from 'pathe'
import { globSync } from 'fast-glob'
import { copySync, pathExistsSync, readJSONSync } from 'fs-extra'
import { getPackageInfoSync, isPackageExists } from 'local-pkg'
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
    const filePath = relative('src', file)

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

function getRootDirectory(pathStr: string) {
  return pathStr.split(sep)[0]
}

function readComponents(jsonFilePath: string): string[] {
  try {
    const jsonContent = readJSONSync(jsonFilePath)
    const usingComponents = Object.values(jsonContent?.usingComponents || {}) as string[]
    return usingComponents.map((component) => {
      const path = isAbsolute(component)
        ? resolve(process.cwd(), 'src', `./${component}`)
        : resolve(dirname(jsonFilePath), component)
      if (pathExistsSync(`${path}.json`)) {
        return path
      }
      else {
        const pkgName = getRootDirectory(component)
        // TODO 全量复制有点呆，但管用
        if (isPackageExists(pkgName)) {
          const { packageJson, rootPath } = getPackageInfoSync(pkgName)!
          const source = join(rootPath, packageJson.miniprogram || 'miniprogram_dist')
          const destination = resolve('dist', 'miniprogram_npm', pkgName)
          copySync(source, destination)
        }
        return component
      }
    })
  }
  catch (error) {
    console.error(`Error reading JSON file: ${jsonFilePath}`, error)
    return []
  }
}

function scanFilesRecursively(entry: string, visited: Set<string>): ScanResult {
  if (visited.has(entry))
    return { enterList: {}, copyList: [] }

  visited.add(entry)
  const files = globSync(`${entry}.**`, { absolute: true })

  const { compiler: enterFiles, copy: copyFiles } = categorizeFiles(files)
  const entryPath = copyFiles.find(file => file.endsWith(`${entry}.json`))!

  if (!entryPath)
    return { enterList: {}, copyList: [] }
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
  const cwd = process.cwd()
  const entries = [...pages, ...components].map((page) => {
    return join(cwd, 'src', page)
  })

  const inputList = entries.reduce<ScanResult>((acc, page) => {
    const pageResult = scanFilesRecursively(page, visited)
    acc.copyList.push(...pageResult.copyList)
    Object.assign(acc.enterList, pageResult.enterList)
    return acc
  }, {
    enterList: {},
    copyList: [],
  })

  const rootFiles = globSync('src/*.**', { absolute: true })
  const { compiler: rootFilesWithCompiler, copy: rootFilesWithCopy } = categorizeFiles(rootFiles)
  Object.assign(inputList.enterList, fromEntriesPath(rootFilesWithCompiler))
  const assetsFiles = globSync(`src/**/*.{${wxSupportFileTypes.join(',')}}`, { absolute: true })
  inputList.copyList.push(...rootFilesWithCopy, ...assetsFiles)

  return inputList
}
