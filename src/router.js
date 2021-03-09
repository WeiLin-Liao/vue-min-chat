import Vue from 'vue'
import Router from 'vue-router'
import Index from '@/view/index'
import Chat from '@/view/chat'

Vue.use(Router)

export default new Router({
  routes: [
    {
      path: '/',
      name: 'Index',
      component: Index
    },
    {
      path: '/chat',
      name: 'Chat',
      component: Chat
    }
  ]
})
