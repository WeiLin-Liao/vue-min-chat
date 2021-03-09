<template>
  <div class="message-pabel-box">

    <el-button
      class="eye-more"
      @click="eyeMore"
      v-if="nowSwitchId == 'group' && isShowMore"
      type="text">加载更多消息</el-button>

    <ul class="message-styles-box">
      <li
        v-for="(item, index) in messageTemplate()"
        :key="index"
        :class="judgeClass(item.type)">

        <img class="message-avatar"
          :src="item.avatar ? item.avatar : './static/avatar/avatar_14.jpg'"
          :alt="item.nickName ? item.nickName : '我是憨批'">

        <p class="message-nickname" v-if="item.type == 'server'">{{item.nickName}} {{formatTime(item.message.time)}}</p>
        <p class="message-nickname" v-else>{{formatTime(item.message.time)}} {{item.nickName}}</p>
        <p class="message-classic" v-html="item.message.content"></p>
      </li>
    </ul>
  </div>
</template>

<script>
import Bus from '@/assets/eventBus'
import { gotoBottom } from '@/assets/tools'

export default {
  name: 'MessagePabel',
  props: {
    // 选择的联系人ID
    nowSwitchId: {
      type: String
    },
    // 当前用户
    localInfo: {
      type: Object
    },
    concats: {
      type: Array
    }
  },
  data () {
    return {
      message: {},
      page: 0,
      isShowMore: true,
      gotoBottom: gotoBottom
    }
  },
  mounted () {
    /**
     * 接收消息
     */
    this.sockets.subscribe('MESSAGE', message => {
      let id = message.id
      let gotoId = message.body.gotoId
      let fromId = message.body.fromId
      let content = message.body.message.content

      message.body.message.content = content.replace(/[{]/g, '<').replace(/[}]/g, '>')

      this.initMessageArray(gotoId, fromId)

      // 用户在群聊发消息
      if (gotoId === 'group' && fromId === this.localInfo.id) {
        message.body.type = 'user-message'
      }

      if (gotoId === 'group') {
        this.message['group'].push(message.body)
      } else {
        this.message[id].push(message.body)
      }
      this.$forceUpdate()
      this.gotoBottom()
      // 把消息传给父级
      this.$emit('message', message)
    })

    /**
     * 当前用户发的消息
     */
    Bus.$on('MESSAGE', response => {
      let body = response.body
      let gotoId = body.gotoId
      let fromId = body.fromId

      this.initMessageArray(gotoId, fromId)

      // 自己给自己发消息
      if (gotoId === fromId) {
        this.message[fromId].push(body)
      } else if (response.type === 'robots-message' || response.type === 'user-message') {
        this.message[gotoId].push(body)
      }
      this.$forceUpdate()
      // 把消息传给父级
      this.$emit('message', response)
    })

    /**
     * 接收更多消息
     */
    this.sockets.subscribe('GROUP_MESSAGE', result => {
      const box = document.getElementsByClassName('message-pabel-box')[0]
      const scroll = box.scrollHeight - box.scrollTop

      // 是否有更多数据
      if (result.length) {
        result.map((item, index) => {
          this.message['group'].unshift(JSON.parse(item.body))
        })
      } else {
        this.isShowMore = false
      }

      if (result.length < 9) this.isShowMore = false

      setTimeout(() => {
        box.scrollTop = box.scrollHeight - scroll
      }, 0)

      this.$forceUpdate()
    })
  },
  methods: {
    /**
     * 数组初始化
     */
    initMessageArray (gotoId, fromId) {
      let array = this.message

      if (!gotoId) return
      if (!array[gotoId]) {
        this.message[gotoId] = []
      }

      if (!fromId) return
      if (!array[fromId]) {
        this.message[fromId] = []
      }
    },

    /**
     * 判断Class
     */
    judgeClass (type) {
      if (type === 'server') {
        return 'message-layout-left'
      } else {
        return 'message-layout-right'
      }
    },

    /**
     * 返回聊天记录集合
     */
    messageTemplate () {
      return this.message[this.nowSwitchId]
    },

    /**
     * 查看更多
     */
    eyeMore () {
      let obj = {
        id: this.localInfo.id,
        page: this.page += 1
      }
      this.initMessageArray('group')
      if (this.message['group'] !== undefined && this.page === 1) {
        obj.length = this.message['group'].length
      }
      // 发送查询消息
      this.$socket.emit('QUERY_PAGE', obj)
    },
    /**
     * 获取年月日
     */
    formatFullYearMonthDay (date, isShowHourMinute, type) {
      date = new Date(date)
      const fullYear = date.getFullYear()
      const month = date.getMonth() + 1
      const dayDate = date.getDate()
      var hours = date.getHours()
      var minutes = date.getMinutes()

      if (isShowHourMinute) {
        return `${fullYear}${month}${dayDate}${hours}${minutes}`
      } else {
        if (type) {
          return `${fullYear}${type}${month}${type}${dayDate}`
        } else {
          return `${fullYear}${month}${dayDate}`
        }
      }
    },
    /**
     * 时间格式化
     */
    formatTime (time) {
      var date = new Date(time)
      var nowDate = new Date()
      var hours = date.getHours()
      var minutes = date.getMinutes()

      hours = hours < 10 ? `0${hours}` : hours
      minutes = minutes < 10 ? `0${minutes}` : minutes

      if (this.formatFullYearMonthDay(date) === this.formatFullYearMonthDay(nowDate)) {
        return `${hours}:${minutes}`
      } else {
        return `${this.formatFullYearMonthDay(date, false, '/')} ${hours}:${minutes}`
      }
    }
  }
}
</script>

<style lang="scss">
.message-pabel-box {
  padding: 0 20px;
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: rgba(255, 255, 255, .8);

  .eye-more {
    width: 100%;
    padding: 10px 0;
    font-size: 12px;
    text-align: center;
  }

  .message-styles-box {
    margin-bottom: 20px;
    .message-layout-left,
    .message-layout-right {
      margin-top: 20px;
      width: 100%;
      .message-classic::before {
        content: '';
        position: absolute;
        border-width: 8px;
        border-style: solid;
      }
    }

    .message-layout-left {
      .message-avatar {
        float: left;
        margin-right: 10px;
      }
      .message-classic {
        background-color: rgba(255, 255, 255, .8);
        &::before {
          left: -16px;
          border-color: transparent rgba(255, 255, 255, .8) transparent transparent;
        }
      }
    }

    .message-layout-right {
      text-align: right;
      .message-avatar {
        float: right;
        margin-left: 10px;
      }
      .message-classic {
        text-align: left;
        color: #ffffff;
        background-color: rgba(55, 126, 200, .8);
        &::before {
          right: -16px;
          border-color:  transparent transparent  transparent rgba(55, 126, 200, .8);
        }
      }
    }

    .message-avatar {
      width: 40px;
      height: 40px;
      border-radius: 2px;
      border: 1px solid #eeeeee;
    }
    .message-nickname {
      color: #777777;
      font-size: 12px;
    }

    .message-classic {
      position: relative;
      max-width: 45%;
      margin-top: 5px;
      display: inline-block;
      padding: 9px 12px;
      font-size: 14px;
      color: #333333;
      border-radius: 5px;
      white-space: pre-line;
      word-break: break-all;
    }
  }
}
</style>
