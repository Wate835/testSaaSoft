import type { Account } from '../stores/accounts'
import type { AccountErrors } from '../types/account'

export const validateAccount = (account: Account): { isValid: boolean; errors: Omit<AccountErrors, 'touched'> } => {
  const errors = {
    login: false,
    password: false,
    tags: false
  }
  let isValid = true

  // Проверка логина на пустоту и длину
  if (!account.login || account.login.length > 100) {
    errors.login = true
    isValid = false
  }

  // Проверка пароля для локальной учетной записи
  if (account.type === 'Локальная') {
    if (!account.password || account.password.length > 100) {
      errors.password = true
      isValid = false
    }
  }

  return { isValid, errors }
}

export const validateTags = (tagsString: string): boolean => {
  if (!tagsString) return true
  return tagsString.length <= 50
}

export const getErrorMessage = (field: 'login' | 'password' | 'tags', account?: Account): string => {
  switch (field) {
    case 'login':
      if (!account?.login) return 'Логин не может быть пустым'
      if (account.login.length > 100) return 'Логин не может быть длиннее 100 символов'
      return ''
    case 'password':
      if (account?.type === 'Локальная') {
        if (!account.password) return 'Пароль не может быть пустым'
        if (account.password.length > 100) return 'Пароль не может быть длиннее 100 символов'
      }
      return ''
    case 'tags':
      return 'Общая длина меток не может превышать 50 символов'
    default:
      return ''
  }
} 