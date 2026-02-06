import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initStore } from './services/secureStore'
import { applyUiSettings } from './services/ui'
import { getSession } from './services/auth'
import { syncFromBackend } from './services/sync'

import './style.css' // jeśli używasz ogólnego CSS

const mount = async () => {
	await initStore()
	applyUiSettings()
	window.addEventListener('ui-updated', applyUiSettings)
	if (getSession()?.token) {
		await syncFromBackend()
	}
	const app = createApp(App)
	app.use(router)
	app.mount('#app')
}

mount()
