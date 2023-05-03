// localCache.ts
import { promises as fs } from 'fs'
import path from 'path'

interface CacheData {
  [key: string]: any
}

const CACHE_BASE = 'cache'

class LocalCache {
  private readonly cacheDir: string

  constructor(cacheDir: string) {
    this.cacheDir = path.join(CACHE_BASE, cacheDir)
    this.createDir(this.cacheDir)
  }

  private async createDir(dir: string): Promise<void> {
    try {
      await fs.access(dir)
    } catch (err) {
      // If the directory doesn't exist, create it
      await fs.mkdir(dir, { recursive: true })
    }
  }

  async get<T>(key: string): Promise<T | undefined> {
    const cacheFile = path.join(this.cacheDir, `${key}.json`)

    try {
      const cacheContent = await fs.readFile(cacheFile, 'utf-8')
      return JSON.parse(cacheContent) as T
    } catch (err) {
      // If cache file doesn't exist or there's an error reading it, return undefined
      return undefined
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const cacheFile = path.join(this.cacheDir, `${key}.json`)
    await fs.writeFile(cacheFile, JSON.stringify(value), 'utf-8')
  }

  async getValue<T>(key: string, cacheName: string): Promise<T | undefined> {
    const cacheFile = path.join(this.cacheDir, `${cacheName}.json`)

    try {
      return this.getValueUnchecked<T>(key, cacheName)
    } catch (err) {
      // If cache file doesn't exist or there's an error reading it, return undefined
      return undefined
    }
  }

  async getValueUnchecked<T>(key: string, cacheName: string): Promise<T> {
    const cacheFile = path.join(this.cacheDir, `${cacheName}.json`)
    const cacheContent = await fs.readFile(cacheFile, 'utf-8')
    const cacheData: CacheData = JSON.parse(cacheContent)
    return cacheData[key] as T
  }

  async hasValue(key: string, cacheName: string): Promise<boolean> {
    try {
      const value = await this.getValue(key, cacheName)
      return value !== undefined
    } catch (err) {
      return false
    }
  }

  async setValue<T>(key: string, value: T, cacheName: string): Promise<void> {
    const cacheFile = path.join(this.cacheDir, `${cacheName}.json`)
    let cacheData: CacheData = {}

    try {
      const cacheContent = await fs.readFile(cacheFile, 'utf-8')
      cacheData = JSON.parse(cacheContent)
    } catch (err) {
      // If cache file doesn't exist or there's an error reading it, initialize an empty cacheData object
    }

    cacheData[key] = value
    await fs.writeFile(cacheFile, JSON.stringify(cacheData), 'utf-8')
  }
}

export default LocalCache
