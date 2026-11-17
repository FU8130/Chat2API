/**
 * 便携模式初始化模块
 * 通过副作用 import 引入：import './portable'
 * 必须是主进程入口的第一个 import —— 保证在任何模块读取路径之前执行
 */
import { app } from 'electron'
import { join, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'

/**
 * 解析"程序所在目录"
 * macOS 下 exe 在 .app 包内部，需要向上找到 .app 所在目录
 */
function resolveAppDir(exePath: string): string {
  const appMarker = '.app/Contents/MacOS'
  const idx = exePath.indexOf(appMarker)
  if (idx !== -1) return exePath.slice(0, idx)
  return dirname(exePath)
}

function detectPortableBase(): string | null {
  // 1. electron-builder portable target (Windows) 注入的环境变量
  const portableEnv = process.env.PORTABLE_EXECUTABLE_DIR
  if (portableEnv) return portableEnv

  // 2. Linux AppImage：APPIMAGE 指向 .AppImage 文件自身
  const appimagePath = process.env.APPIMAGE
  if (appimagePath && appimagePath.endsWith('.AppImage')) {
    return dirname(appimagePath)
  }

  // 3. 手动便携模式：程序同级目录存在 .portable 空文件
  try {
    const exeDir = resolveAppDir(app.getPath('exe'))
    if (existsSync(join(exeDir, '.portable'))) return exeDir
  } catch {
    // 极端早期 getPath 可能不可用，忽略
  }

  return null
}

const portableBase = detectPortableBase()

if (portableBase) {
  const dataDir = join(portableBase, 'Chat2API-Data')
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
  }

  // 必须在 app.ready 和 requestSingleInstanceLock 之前调用
  app.setPath('userData', dataDir)
  app.setPath('logs', join(dataDir, 'app-logs'))
  app.setPath('crashDumps', join(dataDir, 'crashDumps'))

  // 供 store.ts / updater.ts / 渲染进程读取
  process.env.CHAT2API_PORTABLE = '1'
  process.env.CHAT2API_PORTABLE_DATA_DIR = dataDir

  console.log('[Portable] Mode enabled. Data dir:', dataDir)
}

export const PORTABLE_ENABLED = process.env.CHAT2API_PORTABLE === '1'
export const PORTABLE_DATA_DIR = process.env.CHAT2API_PORTABLE_DATA_DIR || null
