<template>
  <div class="wrapper">
    <el-container>
      <el-aside width="250px">
        <el-header height="40px">
          <i class="el-icon-user-solid icon-message"></i>
          <span class="title">联系人</span>
        </el-header>

        <message-group
          :concats="concats"
          @switchGroup="switchGroup" />
      </el-aside>

      <el-main>
        <el-header height="40px">
          <span class="title" v-if="concats[nowSwitch].id == 'group'">聊天室({{lineCount}})人</span>
          <span class="title" v-else>{{concats[nowSwitch].nickName}}</span>
        </el-header>

        <message-pabel
          :concats="concats"
          :nowSwitchId="nowSwitchId"
          :localInfo="localInfo"
          @message="message" />

        <message-input
          :concats="concats"
          :localInfo="localInfo"
          :nowSwitchId="nowSwitchId" />
      </el-main>
      <footer class="footer">
        <a href="https://xiaobaicai.fun/" target="_blank">WeiLin</a> &copy; 2020
      </footer>
      <audio id="notify-audio" src="./static/wav/tim.wav"></audio>
    </el-container>
  </div>
</template>

<script>
import MessageGroup from '@/components/message-group'
import MessagePabel from '@/components/message-pabel'
import MessageInput from '@/components/message-input'
export default {
  name: 'Chat',
  data () {
    return {
      lineCount: 0,
      concats: [{
        id: 0,
        active: false,
        nickName: '聊天室',
        avatar: './static/avatar/group.png',
        message: {
          time: 1580572800000,
          content: 'Welcome'
        }
      }],
      nowSwitch: 0,
      nowSwitchId: 'group',
      localInfo: {}
    }
  },
  mounted () {
    const params = this.$route.params

    /**
     * 判断是否通过路由跳转过来的
     */
    if (params.id) {
      // 保存当前用户信息
      this.localInfo = {
        id: params.id,
        avatar: params.avatar,
        nickName: params.nickName
      }
    } else {
      this.goBack()
    }

    // 历史返回重新登陆
    if (window.history && window.history.pushState) {
      history.pushState(null, null, document.URL)
      window.addEventListener('popstate', this.goBack, false)
    }

    /**
     * 获取联系人信息
     */
    this.sockets.subscribe('conCats', res => {
      let body = res.body

      // 默认选中第一个
      body.map(item => {
        item.active = false
      })
      body[0].active = true
      this.concats = body
      this.nowSwitchId = 'group'
    })

    /**
     * 获取在线人数及通知
     */
    this.sockets.subscribe('onLine', res => {
      let code = res.code
      let body = res.body
      let notify = code === 2 ? '欢迎:)' : ':)'
      this.$notify({
        title: '通知',
        dangerouslyUseHTMLString: true,
        message: `
          <img class="notify-image" src="${body.avatar}">
          <div class="notify-content">
            <strong class="notify-title">${notify}</strong>
            <span><strong> ${body.notify} </strong</span>
          </div>
        `
      })
      // 删除通知
      delete body.notify
      // 在线人数
      this.lineCount = res.lineCount
      // 添加联系人
      if (code === 2) {
        this.concats.push(body)
      } else {
        // 如果当前选择的人离开了就选中聊天室
        if (body.id === this.nowSwitchId) {
          this.concats[0].active = true
          this.nowSwitch = 0
          this.nowSwitchId = 'group'
          this.concats[0].message.newMessageCount = 0
          this.concats[0].message.isNewMessage = false
        }
        // 删除联系人
        for (let i = 0; i < this.concats.length; i++) {
          if (body.id === this.concats[i].id) {
            this.concats.splice(i, 1)
          }
        }
      }
    })
  },
  methods: {
    /**
     * 切换聊天对象
     */
    switchGroup (index, id) {
      this.nowSwitchId = id
      this.nowSwitch = index

      // 隐藏小红点
      if (this.concats[index].message.isNewMessage !== undefined) {
        this.concats[index].message.isNewMessage = false
        this.concats[index].message.newMessageCount = 0
      }
    },

    /**
     * 接收消息
     */
    message (respone) {
      let type = respone.type
      let body = respone.body
      let concats = this.concats
      let length = concats.length
      let id = body.gotoId
      let notifyAudio = document.getElementById('notify-audio')

      // 服务器返回的消息
      if (type === 'server-message') {
        if (respone.id === 'robots') {
          id = 'robots'
        }
      }

      // 更新小红点
      if (this.nowSwitchId !== id) {
        body.message.isNewMessage = true
        body.message.newMessageCount = (() => {
          for (var i = 0; i < length; i++) {
            if (id === this.concats[i].id) {
              notifyAudio.play()
              if (this.concats[i].message.newMessageCount !== undefined) {
                let count = this.concats[i].message.newMessageCount += 1
                return count
              } else {
                return 1
              }
            }
          }
        })()
      }

      // 更新联系人消息
      for (let i = 0; i < length; i++) {
        if (concats[i].id === id) {
          Object.assign(this.concats[i].message, body.message)
        }
      }
    },

    /**
     * 关闭
     */
    goBack () {
      let href = window.location.href
      window.location.href = href.split('#')[0]
    }
  },
  components: {
    MessageGroup,
    MessagePabel,
    MessageInput
  }
}
</script>

<style lang="scss" scoped>
.wrapper {
  height: 100vh;
  background-image: url('/static/images/bg.jpg');
  background-image: url('http://api.btstu.cn/sjbz/zsy.php');
  background-size: cover;
  background-repeat: no-repeat;
  .el-container {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 88%;
    margin: 30px auto;
    .el-aside,
    .el-main {
      display: flex;
      flex-direction: column;
      border-radius: 6px;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    }
    .el-aside {
      background: rgba(235, 233, 232, .8);
    }
    .el-main {
      padding: 0;
      margin-left: 20px;
    }
    .el-header {
      position: relative;
      line-height: 40px;
      background: rgb(55, 126, 200);
      overflow: hidden;
      .title,
      .icon-message {
        color: #ffffff;
      }
      .icon-message {
        font-size: 20px;
        vertical-align: middle;
      }
      .title {
        display: inline-block;
        margin-left: 5px;
        font-size: 16px;
        letter-spacing: 1px;
      }
    }
  }
  .footer {
    position: absolute;
    bottom: -23px;
    right: 0;
    left: 0;
    margin: auto;
    font-size: 13px;
    width: 150px;
    color: #ffffff;
    text-align: center;
    a {
      color: #ffffff;
      &:hover {
        color: #377ec8;
      }
    }
  }
}
</style>
