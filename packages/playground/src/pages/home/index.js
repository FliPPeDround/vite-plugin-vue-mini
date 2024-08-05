import { defineComponent, ref } from '@vue-mini/core'
import { PAGE_NAME } from './constant'

defineComponent(() => {
  const greeting = ref('欢迎使用 Vue Mini bundle update')
  // eslint-disable-next-line no-console
  console.log(PAGE_NAME)
  return {
    greeting,
  }
})
