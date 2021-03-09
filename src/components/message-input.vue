<template>
  <div class="message-input-box">
    <div class="input-tools">
      <i slot="reference" class="el-icon-s-opportunity" title="表情"></i>
    </div>

    <el-input
      type="textarea"
      resize="none"
      :autosize="{ minRows: 3, maxRows: 3}"
      v-model="textArea"
      v-on:keyup.native="keyUp">
    </el-input>

    <div class="footer-tools">
      <el-button
        size="mini"
        type="primary"
        @click="sendMessage"
        class="send-button">
        发送/Send
      </el-button>
    </div>
  </div>
</template>

<script>
import Bus from '@/assets/eventBus'
import { gotoBottom } from '@/assets/tools'

export default {
  data () {
    return {
      textArea: '',
      gotoBottom: gotoBottom
    }
  },
  props: {
    // 联系人列表
    concats: {
      type: Array
    },
    // 当前选择的ID
    nowSwitchId: {
      type: String
    },
    // 当前用户
    localInfo: {
      type: Object
    }
  },
  mounted () {
    // 表情
    this.obj = new window.Face({
      el: document.querySelector('.el-icon-s-opportunity'),
      callBack: face => {
        this.textArea += `〖${face.title}〗`
        document.querySelector('.face-warp').style.display = 'none'
      }
    })
  },
  methods: {
    /**
     * 消息类型
     */
    nowSwitchType () {
      if (this.nowSwitchId === 'group') {
        return 'group-message'
      } else if (this.nowSwitchId === 'robots') {
        return 'robots-message'
      } else {
        return 'user-message'
      }
    },

    /**
     * 消息过滤
     */
    textAreaTran () {
      return this.textArea.replace(/\n/g, '').replace(new RegExp('<', 'gm'), '&lt')
    },

    /**
     * 检测空白
     */
    blankTesting () {
      if (this.textArea.replace(/\s+/g, '') === '') {
        this.$alert('不能发送空白消息', '提示', {
          confirmButtonText: '确定'
        })
        return false
      }
      return true
    },

    /**
     * 按Enter发送消息
     */
    keyUp (event) {
      if (event.key === 'Enter') {
        this.sendMessage()
      }
    },

    /**
     * 发送消息
     */
    sendMessage () {
      let message = {
        // 类型
        type: this.nowSwitchType(),
        // 发送者ID
        id: this.localInfo.id,
        body: {
          // 消息类型
          type: 'user-message',
          // 收者ID
          gotoId: this.nowSwitchId,
          // 发送者ID
          fromId: this.localInfo.id,
          // 发送者头像
          avatar: this.localInfo.avatar,
          // 发送者昵称
          nickName: this.localInfo.nickName,
          message: {
            // 发送时间
            time: +new Date(),
            // 内容带标签
            content: this.obj.replaceFace(this.textAreaTran()),
            // 纯内容不带标签
            textContent: this.textAreaTran()
          }
        }
      }
      if (this.blankTesting()) {
        // 发送服务器
        this.$socket.emit('MESSAGE', message)
        // 传递至同级
        Bus.$emit('MESSAGE', message)
        // 消息清空
        this.textArea = ''
        // 消息置底
        this.gotoBottom()
      }
    }
  }
}
</script>

<style lang="scss">
.message-input-box {
  height: 150px;
  background-color: rgba(255, 255, 255, .85);
  border-top: 1px solid #dddddd;
  .input-tools {
    position: relative;
    padding-left: 10px;
    padding-top: 10px;
    .upload-demo {
      display: inline;
    }
    i {
      margin-left: 10px;
      color: rgb(94, 94, 94);
      font-size: 20px;
      cursor: pointer;
    }
  }
  .el-textarea {
    .el-textarea__inner {
      padding: 5px 20px;
      border-radius: 0;
      border: 0;
      background-color: transparent;
    }
  }
  .footer-tools {
    text-align: right;
    .send-button {
      padding: 7px 10px;
      margin-right: 20px;
      background: #377ec8;
    }
  }
}
.face-pabel {
  .face {
    display: inline-block;
    width: 20px;
    height: 20px;
  }
}
</style>
