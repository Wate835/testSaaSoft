import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Tag {
  text: string
}

export interface Account {
  tags: Tag[]
  type: 'Локальная' | 'LDAP'
  login: string
  password: string | null
}

export const useAccountsStore = defineStore('accounts', () => {
  const accounts = ref<Account[]>([])

  // Загрузка сохраненных аккаунтов при инициализации
  const savedAccounts = localStorage.getItem('accounts')
  if (savedAccounts) {
    accounts.value = JSON.parse(savedAccounts)
  }

  function stringToTags(tagsString: string): Tag[] {
    return tagsString
      .split(';')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .map(tag => ({ text: tag }))
  }

  // Строгая валидация для сохранения в localStorage
  function validateAccountForSave(account: Account): boolean {
    // Проверка логина
    if (!account.login || account.login.length > 100) return false

    // Проверка пароля для локальной учетной записи
    if (account.type === 'Локальная' && (!account.password || account.password.length > 100)) {
      return false
    }

    return true
  }

  function addAccount(account: Account) {
    const newAccount = {
      ...account,
      password: account.type === 'LDAP' ? null : account.password
    }
    accounts.value.push(newAccount)
  }

  function removeAccount(index: number) {
    accounts.value.splice(index, 1)
    saveToLocalStorage()
  }

  function updateAccount(index: number, account: Account) {
    const updatedAccount = {
      ...account,
      password: account.type === 'LDAP' ? null : account.password
    }
    accounts.value[index] = updatedAccount
  }

  function updateAccountTags(index: number, tagsString: string) {
    const currentAccount = accounts.value[index]
    const updatedAccount = {
      ...currentAccount,
      tags: stringToTags(tagsString)
    }
    accounts.value[index] = updatedAccount
  }

  function saveToLocalStorage() {
    // Сохраняем только валидные аккаунты
    const validAccounts = accounts.value.filter(validateAccountForSave)
    if (validAccounts.length > 0) {
      localStorage.setItem('accounts', JSON.stringify(validAccounts))
    }
  }

  // Функция для ручного сохранения
  function saveAccounts() {
    saveToLocalStorage()
  }

  return {
    accounts,
    addAccount,
    removeAccount,
    updateAccount,
    updateAccountTags,
    stringToTags,
    validateAccountForSave,
    saveAccounts
  }
}) 