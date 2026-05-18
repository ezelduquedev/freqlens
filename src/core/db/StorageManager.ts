export interface CalibrationResult {
  id: string
  timestamp: number
  deviceName: string
  frequencyResponse: number[] // DB values
  impulseResponse?: number[]
}

export interface EQPreset {
  id: string
  name: string
  filters: {
    type: BiquadFilterType
    frequency: number
    gain: number
    Q: number
  }[]
}

export class StorageManager {
  private static DB_NAME = 'FreqLensDB'
  private static DB_VERSION = 1
  private db: IDBDatabase | null = null

  public async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(StorageManager.DB_NAME, StorageManager.DB_VERSION)

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('calibrations')) {
          db.createObjectStore('calibrations', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('presets')) {
          db.createObjectStore('presets', { keyPath: 'id' })
        }
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onerror = () => reject(request.error)
    })
  }

  public async saveCalibration(data: CalibrationResult): Promise<void> {
    return this.performTransaction('calibrations', 'readwrite', (store) => store.put(data))
  }

  public async getAllCalibrations(): Promise<CalibrationResult[]> {
    return this.performTransaction('calibrations', 'readonly', (store) => store.getAll())
  }

  private async performTransaction<T>(
    storeName: string, 
    mode: IDBTransactionMode, 
    action: (store: IDBObjectStore) => IDBRequest
  ): Promise<T> {
    if (!this.db) await this.init()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, mode)
      const store = transaction.objectStore(storeName)
      const request = action(store)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}
