export type AccountType = 'Локальная' | 'LDAP'

export interface AccountErrors {
  login: boolean
  password: boolean
  tags: boolean
  touched: {
    login: boolean
    password: boolean
    tags: boolean
  }
}

export interface ValidationState {
  [key: number]: AccountErrors
}

export interface TagsInputState {
  [key: number]: string
} 