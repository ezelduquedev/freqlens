export type Theme = 'light';

export const getCurrentTheme = (): Theme => {
  return 'light';
};

export const setTheme = (): void => {
  document.documentElement.setAttribute('data-theme', 'light');
  document.documentElement.dataset.theme = 'light';
  localStorage.setItem('freqlens_theme', 'light');
};

export const initTheme = (): void => {
  setTheme();
};
