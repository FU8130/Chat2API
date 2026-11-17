// src/main/portable.ts
import { app } from 'electron'
import { join, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'

export function setupPortableMode(): void {
  // 1. electron-builder portable target 注入的环境变量（仅 Windows portable target）
  const portableEnv = process.env.PORTABLE_EXECUTABLE_DIR
  // 2. 手动便携模式：exe 同级放一个 .portable 空文件
  const exeDir = dirname(app.getPath('exe'))
  const marker = join(exeDir, '.portable')

  if (!portableEnv && !existsSync(marker)) return   // 非便携环境，走默认路径

  const base = portableEnv || exeDir
  const dataDir = join(base, 'Chat2API-Data')
  if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })

  // 必须在 ready 之前、requestSingleInstanceLock 之前
  app.setPath('userData', dataDir)
  app.setPath('logs', join(dataDir, 'logs'))
  app.setPath('crashDumps', join(dataDir, 'crashDumps'))

  // 标记运行时便携模式，给 updater 和 IPC 用
  process.env.CHAT2API_PORTABLE = '1'
}
