<script setup lang="ts">
import { onHide, onLaunch, onShow } from '@dcloudio/uni-app'

import pages from 'virtual:uni-pages'

definePage({})

onLaunch(() => {
  console.log(pages)
})
onShow(() => {
  console.log('App Show')
})
onHide(() => {
  console.log('App Hide')
})
</script>

<style></style>
