export interface Preset {
  id: string;
  name: string;
  description: string;
  values: { [key: string]: number };
  icon?: string;
}

const STORAGE_KEY = 'freqlens_presets';

export const PresetStorage = {
  getAll(): Preset[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Preset[];
    } catch {
      return [];
    }
  },
  save(preset: Preset): void {
    const list = this.getAll();
    const idx = list.findIndex(p => p.id === preset.id);
    if (idx >= 0) list[idx] = preset; // overwrite
    else list.unshift(preset);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },
  delete(id: string): void {
    const list = this.getAll().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  },
  updateDescription(id: string, description: string): void {
    const list = this.getAll();
    const idx = list.findIndex(p => p.id === id);
    if (idx >= 0) {
      list[idx].description = description;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    }
  }
};
