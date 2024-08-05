import { defineComponent, ref } from '@vue-mini/core'

defineComponent(() => {
  const greeting = ref('button')
  return {
    greeting,
  }
})
