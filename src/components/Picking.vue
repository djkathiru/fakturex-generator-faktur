<template>
  <div class="orders-page">
    <header class="page-header">
      <button class="ghost-btn" @click="goHome">Powrót</button>
      <div>
        <h1>Picking / Packing</h1>
        <p>Lista zleceń kompletacji i pakowania.</p>
      </div>
      <button class="primary-btn" @click="refresh">Odśwież</button>
    </header>

    <section class="card">
      <table v-if="tasks.length" class="orders-table">
        <thead>
          <tr>
            <th>Kontrahent</th>
            <th>Magazyn</th>
            <th>Pozycji</th>
            <th>Status</th>
            <th>Akcje</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task.id">
            <td>{{ contactName(task.contactId) }}</td>
            <td>{{ warehouseName(task.warehouseId) }}</td>
            <td>{{ task.items?.length || 0 }}</td>
            <td>{{ task.status === 'open' ? 'Otwarte' : 'Zamknięte' }}</td>
            <td class="actions">
              <button class="ghost-btn" @click="closeTask(task)">Zamknij</button>
              <button class="danger-btn" @click="deleteTask(task.id)">Usuń</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else class="empty-state">
        <h3>Brak zleceń</h3>
        <p>Utwórz picking z poziomu zamówień sprzedaży.</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPickingTasks, removePickingTask, updatePickingTask } from '@/services/picking'
import { getContacts } from '@/services/contacts'
import { getWarehouses } from '@/services/warehouses'

const router = useRouter()
const tasks = ref([])
const contacts = ref([])
const warehouses = ref([])

const refresh = () => {
  tasks.value = getPickingTasks()
  contacts.value = getContacts()
  warehouses.value = getWarehouses()
}

const closeTask = (task) => {
  tasks.value = updatePickingTask(task.id, { status: 'closed' })
}

const deleteTask = (id) => {
  tasks.value = removePickingTask(id)
}

const contactName = (id) => contacts.value.find((contact) => contact.id === id)?.name || '-'
const warehouseName = (id) => warehouses.value.find((warehouse) => warehouse.id === id)?.name || '-'

const goHome = () => {
  router.push({ name: 'home' })
}

onMounted(refresh)
</script>

<style src="./Orders.css"></style>
