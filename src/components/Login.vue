<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <div class="brand-mark">F</div>
        <div>
          <h1>Fakturex</h1>
          <p>System sprzedaży i magazynu</p>
        </div>
      </div>

      <form class="login-form" @submit.prevent="onSubmit">
        <label>
          Adres e-mail
          <input v-model.trim="email" type="email" autocomplete="username" required />
        </label>

        <label>
          Hasło
          <input v-model.trim="password" type="password" autocomplete="current-password" required />
        </label>

        <button class="primary" type="submit" :disabled="loading">
          {{ loading ? 'Logowanie...' : 'Zaloguj się' }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </form>

      <div class="demo-box">
        <h3>Dane testowe</h3>
        <ul>
          <li v-for="user in demoUsers" :key="user.email">
            <span>{{ user.email }}</span>
            <span class="role">{{ roleLabels[user.role] }}</span>
          </li>
        </ul>
        <p class="hint">Hasło: <strong>demo123</strong> (admin: <strong>admin123</strong>)</p>
      </div>
    </div>

    <div class="login-side">
      <h2>Pełna kontrola dokumentów sprzedaży</h2>
      <p>
        Twórz faktury VAT, zaliczkowe i końcowe, zarządzaj magazynem
        oraz konfiguruj proces sprzedaży w jednym miejscu.
      </p>
      <div class="feature-grid">
        <div class="feature">
          <span>✓</span>
          Automatyczna numeracja dokumentów
        </div>
        <div class="feature">
          <span>✓</span>
          Rozbudowane role i uprawnienia
        </div>
        <div class="feature">
          <span>✓</span>
          Panel raportów i podgląd PDF
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { login, getDemoUsers } from '@/services/auth'

const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const demoUsers = getDemoUsers()

const roleLabels = {
  OWNER: 'Właściciel',
  ACCOUNTANT: 'Księgowość',
  VIEWER: 'Podgląd'
}

const onSubmit = async () => {
  error.value = ''
  loading.value = true

  try {
    await login(email.value, password.value)
    const redirect = route.query.redirect
    router.push(redirect ? String(redirect) : { name: 'home' })
  } catch (err) {
    error.value = err.message ?? 'Nie udało się zalogować.'
  } finally {
    loading.value = false
  }
}
</script>

<style src="./Login.css"></style>
