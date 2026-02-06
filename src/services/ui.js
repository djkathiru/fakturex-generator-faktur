import { getSettings } from '@/services/settings'

const applyTheme = (theme) => {
  const root = document.documentElement
  if (theme === 'dark') {
    root.style.setProperty('--app-bg', '#0f172a')
    root.style.setProperty('--app-surface', '#111827')
    root.style.setProperty('--app-text', '#e2e8f0')
    root.style.setProperty('--app-muted', '#94a3b8')
  } else {
    root.style.setProperty('--app-bg', '#f1f5f9')
    root.style.setProperty('--app-surface', '#ffffff')
    root.style.setProperty('--app-text', '#0f172a')
    root.style.setProperty('--app-muted', '#64748b')
  }
}

const applyDensity = (density) => {
  const body = document.body
  body.classList.toggle('density-compact', density === 'compact')
}

const applyContrast = (highContrast) => {
  document.body.classList.toggle('high-contrast', !!highContrast)
}

const applyMobileMode = (mobileUx) => {
  const body = document.body
  body.classList.toggle('mobile-mode', !!mobileUx?.enableMobileMode)
  body.classList.toggle('mobile-large-touch', !!mobileUx?.largeTouchTargets)
  body.classList.toggle('mobile-sticky-actions', !!mobileUx?.stickyActions)
}

const applyPerformance = (performance) => {
  document.body.classList.toggle('reduce-animations', !!performance?.reduceAnimations)
  document.body.classList.toggle('low-data-mode', !!performance?.lowDataMode)
}

export const applyUiSettings = () => {
  const settings = getSettings()
  applyTheme(settings.ui?.theme)
  applyDensity(settings.ui?.density)
  applyContrast(settings.ui?.highContrast)
  applyMobileMode(settings.mobileUx)
  applyPerformance(settings.performance)
}
