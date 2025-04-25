<script setup lang="ts">
import { reactive } from 'vue'
import { useAccountsStore } from '../stores/accounts'
import type { Account } from '../stores/accounts'
import { ElInput, ElSelect, ElOption, ElButton, ElForm, ElFormItem, ElTooltip } from 'element-plus'
import 'element-plus/dist/index.css'
import type { AccountType, ValidationState, TagsInputState } from '../types/account'
import { validateAccount, validateTags, getErrorMessage } from '../utils/validation'

const store = useAccountsStore()

// Используем реактивные объекты для хранения состояний
const tagsInputs = reactive<TagsInputState>({})
const errors = reactive<ValidationState>({})

// Функция для обновления индексов в локальных состояниях
const updateLocalStates = () => {
  const newTagsInputs: TagsInputState = {}
  const newErrors: ValidationState = {}

  store.accounts.forEach((account, index) => {
    newTagsInputs[index] = account.tags.map(tag => tag.text).join('; ')
    
    newErrors[index] = {
      login: false,
      password: false,
      tags: false,
      touched: {
        login: false,
        password: false,
        tags: false
      }
    }
  })

  // Очищаем старые состояния
  Object.keys(tagsInputs).forEach(key => {
    delete tagsInputs[parseInt(key)]
  })
  Object.keys(errors).forEach(key => {
    delete errors[parseInt(key)]
  })

  // Устанавливаем новые состояния
  Object.assign(tagsInputs, newTagsInputs)
  Object.assign(errors, newErrors)
}

// Инициализация начальных состояний
updateLocalStates()

const validateAndUpdateAccount = (index: number) => {
  const account = store.accounts[index]
  const { isValid, errors: validationErrors } = validateAccount(account)
  
  Object.assign(errors[index], validationErrors)
  
  return isValid
}

const handleLoginChange = (index: number, value: string) => {
  const cleanValue = value.replace(/\s/g, '')
  const updatedAccount = {
    ...store.accounts[index],
    login: cleanValue
  }
  
  store.updateAccount(index, updatedAccount)
  validateAndUpdateAccount(index)
}

const handlePasswordChange = (index: number, value: string) => {
  const cleanValue = value.replace(/\s/g, '')
  const updatedAccount = {
    ...store.accounts[index],
    password: cleanValue
  }
  
  store.updateAccount(index, updatedAccount)
  validateAndUpdateAccount(index)
}

const handleTypeChange = (index: number, value: AccountType) => {
  const updatedAccount = {
    ...store.accounts[index],
    type: value,
    password: value === 'LDAP' ? null : ''
  }
  
  store.updateAccount(index, updatedAccount)
  errors[index].touched.password = false
  validateAndUpdateAccount(index)
  store.saveAccounts()
}

const handleTagsBlur = (index: number) => {
  const tagsValue = tagsInputs[index] || ''
  errors[index].touched.tags = true
  
  if (!validateTags(tagsValue)) {
    errors[index].tags = true
    return
  }
  
  errors[index].tags = false
  store.updateAccountTags(index, tagsValue)
  store.saveAccounts()
}

const handleInputBlur = (index: number, field: 'login' | 'password' | 'tags') => {
  errors[index].touched[field] = true
  validateAndUpdateAccount(index)
  store.saveAccounts()
}

const handleRemoveAccount = (index: number) => {
  store.removeAccount(index)
  updateLocalStates()
}

const addAccount = () => {
  const newIndex = store.accounts.length
  const newAccount: Account = {
    tags: [],
    type: 'Локальная' as const,
    login: '',
    password: ''
  }
  
  store.addAccount(newAccount)

  tagsInputs[newIndex] = ''
  errors[newIndex] = {
    login: false,
    password: false,
    tags: false,
    touched: {
      login: false,
      password: false,
      tags: false
    }
  }

  validateAndUpdateAccount(newIndex)
}
</script>

<template>
  <div class="account-manager">
    <div class="header">
      <h2>Учетные записи</h2>
      <el-button type="primary" class="add-button" @click="addAccount">+</el-button>
    </div>
    
    <div class="info-block">
      <i>Для указания нескольких меток для одной пары логин/пароль используйте разделитель ;</i>
    </div>

    <div class="form-header">
      <div class="header-item tags-field">Метки</div>
      <div class="header-item type-field">Тип записи</div>
      <div class="header-item login-field">Логин</div>
      <div class="header-item password-field">Пароль</div>
      <div class="header-item action-field"></div>
    </div>

    <el-form v-for="(account, index) in store.accounts" :key="index" class="account-form">
      <div class="form-row" :class="{ 'no-password': account.type === 'LDAP' }">
        <el-form-item class="tags-field">
          <el-tooltip
            :content="getErrorMessage('tags')"
            :disabled="!(errors[index]?.touched.tags && errors[index]?.tags)"
            placement="top"
            effect="dark"
          >
            <el-input
              v-model="tagsInputs[index]"
              @blur="handleTagsBlur(index)"
              placeholder="Метки"
              :class="{ 'is-error': errors[index]?.touched.tags && errors[index]?.tags }"
            />
          </el-tooltip>
        </el-form-item>
        
        <el-form-item class="type-field">
          <el-select 
            :model-value="account.type"
            @update:model-value="(value) => handleTypeChange(index, value as AccountType)"
            class="type-select"
          >
            <el-option value="Локальная" label="Локальная" />
            <el-option value="LDAP" label="LDAP" />
          </el-select>
        </el-form-item>
        
        <el-form-item class="login-field" :class="{ 'span-two': account.type === 'LDAP' }">
          <el-tooltip
            :content="getErrorMessage('login', account)"
            :disabled="!(errors[index]?.touched.login && errors[index]?.login)"
            placement="top"
            effect="dark"
          >
            <el-input
              :model-value="account.login"
              @update:model-value="(value) => handleLoginChange(index, value)"
              @blur="() => handleInputBlur(index, 'login')"
              placeholder="Логин"
              :maxlength="100"
              :class="{ 'is-error': errors[index]?.touched.login && errors[index]?.login }"
              @keydown.space.prevent
            />
          </el-tooltip>
        </el-form-item>
        
        <el-form-item v-if="account.type === 'Локальная'" class="password-field">
          <el-tooltip
            :content="getErrorMessage('password', account)"
            :disabled="!(errors[index]?.touched.password && errors[index]?.password)"
            placement="top"
            effect="dark"
          >
            <el-input
              :model-value="account.password"
              @update:model-value="(value) => handlePasswordChange(index, value)"
              @blur="() => handleInputBlur(index, 'password')"
              type="password"
              placeholder="Пароль"
              :maxlength="100"
              show-password
              :class="{ 'is-error': errors[index]?.touched.password && errors[index]?.password }"
              @keydown.space.prevent
            />
          </el-tooltip>
        </el-form-item>

        <el-button 
          class="remove-button" 
          @click="handleRemoveAccount(index)"
        >
          <span class="delete-icon">×</span>
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.account-manager {
  padding: 20px;
}

.header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 20px;
}

.info-block {
  padding: 10px;
  margin-bottom: 20px;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

.account-form {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 4px;
  width: 100%;
  max-width: 960px;
}

.form-header {
  display: grid;
  grid-template-columns: 250px 150px 250px 250px 40px;
  gap: 10px;
  align-items: center;
  width: 100%;
  max-width: 960px;
  margin-bottom: 10px;
  color: #606266;
  font-size: 14px;
}

.header-item {
  padding: 0 12px;
}

.form-row {
  display: grid;
  grid-template-columns: 250px 150px 250px 250px 40px;
  gap: 10px;
  align-items: center;
  width: 100%;
}

.form-row.no-password {
  grid-template-columns: 250px 150px 460px 40px;
}

.form-row :deep(.el-form-item) {
  margin-bottom: 0;
  width: 100%;
}

.form-row :deep(.el-input__wrapper),
.form-row :deep(.el-select) {
  width: 100%;
}

.tags-field {
  grid-column: 1;
}

.type-field {
  grid-column: 2;
}

.login-field {
  grid-column: 3;
}

.login-field.span-two {
  grid-column: 3 / span 2;
}

.password-field {
  grid-column: 4;
}

.remove-button {
  grid-column: 5;
  padding: 8px;
  color: #dc3545;
  border: none;
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.accounts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.accounts-header {
  display: flex;
  gap: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-weight: bold;
}

.accounts-header .header-item {
  flex: 1;
}

.account-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  align-items: center;
}

.account-item > div {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-icon {
  font-size: 16px;
}

.add-button {
  padding: 5px 15px;
  font-size: 20px;
}

:deep(.el-input__wrapper) {
  background-color: white;
}

:deep(.el-select__wrapper) {
  background-color: white;
}

:deep(.is-error) {
  border: 1px solid var(--el-color-danger);
  box-shadow: 0 0 0 1px var(--el-color-danger) inset;
}
</style> 