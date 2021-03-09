var http = require('http')
var express = require('express')
var server = http.Server(express())
var io = require('socket.io')(server, { cors: true })
var Tools = require('./tools')
var Config = require('./config')
const ChatBot = require('dingtalk-robot-sender')

const robot = new ChatBot(Config.Robot)
const at = {
   "atMobiles": [
    "15770705548"
  ], 
  "isAtAll": false
}

// 联系人列表
var concats = {
  body: [
    {
      id: 'group',
      nickName: '聊天室',
      avatar: './static/avatar/group.png',
      message: {
        content: '',
        time: Tools.dateTime()
      }
    },
    {
      id: 'robots',
      nickName: '沉默憨憨',
      avatar: './static/avatar/robots.png',
      message: {
        content: '',
        time: Tools.dateTime()
      }
    }
  ],
  onLine: {}
}
io.on('connection', function(socket) {
  // 登录
  socket.on('LOGIN', function(res) {
    let id = socket.id
    let body = res.body
    let nickName = body.nickName

    // socket ID
    body.id = id
    // 修改时间
    body.message.time = Tools.dateTime()
    // 名称是否重复
    for (var i = 0; i < concats.body.length; i ++) {
      if (nickName == concats.body[i].nickName) {
        socket.emit('LOGIN_SUCCESS', {
          code: 0,
          msg: '名称已被使用请重新填写！'
        })
        return false
      }
    }

    /**
     * 登录成功
     */
    concats.onLine[id] = socket
    // 发送登录成功通知
    socket.emit('LOGIN_SUCCESS', {
      code: 2,
      body: body,
      msg: '登陆成功！'
    })

    /**
     * 发送联系人列表给客户端
     */
    socket.emit('conCats', {
      code: 2,
      body: concats.body
    })
	
    /**
     * 告诉客户端有人跑进来了
     */
    body.notify = nickName + '进入聊天室'
    io.emit('onLine', {
      code: 2,
      body: body,
      lineCount: Tools.getLineCount(concats) + 1
    })

    // 删除通知字段
    delete body.notify
    // 插入联系人列表
    concats.body.push(body)

    console.log(`憨憨[${id}]进来了--->当前在线${Tools.getLineCount(concats)}人`)
	robot.text(`👉${nickName}👈 进入聊天室\n当前在线${Tools.getLineCount(concats)}人`, at)

    // 沉默憨憨给进来的憨憨发消息
    setTimeout(() => {
      concats.onLine[id].emit('MESSAGE', {
        id: "robots",
        type: 'server-message',
        body: {
          type: "server",
          gotoId: "robots",
          fromId: "robots",
          avatar: concats.body[1].avatar,
          nickName: concats.body[1].nickName,
          message: {
            time: Tools.dateTime(),
            content: `您好！我是沉默憨憨，我可以陪您聊天，我可以做很多事情！<br>
            列如：天气查询：天气赣州、ＩＰ查询：IP地址、智能聊天：Hello... 发送help了解更多！<br>
            <img src="https://qzonestyle.gtimg.cn/qzone/em/e110113.gif"><img src="https://qzonestyle.gtimg.cn/qzone/em/e110114.gif"><img src="https://qzonestyle.gtimg.cn/qzone/em/e110123.gif"><img src="https://qzonestyle.gtimg.cn/qzone/em/e110100.gif"><img src="https://qzonestyle.gtimg.cn/qzone/em/e110111.gif"><img src="https://qzonestyle.gtimg.cn/qzone/em/e110131.gif"><img src="https://qzonestyle.gtimg.cn/qzone/em/e110126.gif"><img src="https://qzonestyle.gtimg.cn/qzone/em/e110103.gif"><img src="https://qzonestyle.gtimg.cn/qzone/em/e110122.gif"><img src="https://qzonestyle.gtimg.cn/qzone/em/e110124.gif"><img src="https://qzonestyle.gtimg.cn/qzone/em/e110099.gif">
            <span class="face face66" title="爱心"></span> 要想得到你从未得到的东西 <span class="face face66" title="爱心"></span>
            <span class="face face66" title="爱心"></span> 就要付出你从未付出的代价 <span class="face face66" title="爱心"></span>
            <span class="face face66" title="爱心"></span> 别看我我只是一条小尾巴！ <span class="face face66" title="爱心"></span> <br>
             获取源代码请点击这里 <a href="https://github.com/WeiLin-Liao/vue-min-chat" target="_blank">vue-min-chat</a>`
          }
        }
      })
    }, 1000)
  })

  /**
   * 用户断开
   */
  socket.on('disconnect', function() {
    let id = socket.id

    // 删除断开用户
    concats.body.map((item, key) => {
      if(item.id == id) {
        let avatar = item.avatar
        let nickName = item.nickName
        // 删除在线人员
        delete concats.onLine[id]
        // 删除好友列表
        concats.body.splice(key, 1)

        // 告诉客户端有人跑了
        io.emit('onLine', {
          code: 1,
          body: {
            id: id,
            avatar: avatar,
            nickName: nickName,
            notify: nickName + '离开聊天室'
          },
          lineCount: Tools.getLineCount(concats)
        })
		robot.text(`👉${nickName}👈离开聊天室\n当前在线${Tools.getLineCount(concats)}人`, at)
        console.log(`憨憨[${id}]跑了--->当前在线${Tools.getLineCount(concats)}人`)
      }
    })
  })
  
  /**
   * 接收消息
   */
  socket.on('MESSAGE', function(message) {
    let type = message.type
    let body = message.body
    let gotoId = body.gotoId
    let fromId = body.fromId
    
    message.type = 'server-message'
    message.body.type = 'server'

    // 沉默憨憨
    if (type == 'robots-message') {
      let content = body.message.textContent
      robot.text(`${body.nickName}：${content}`)
      let url = encodeURI(`http://api.qingyunke.com/api.php?key=free&appid=0&msg=${content}`)
      console.log(message)
      message.id = gotoId
      message.body.gotoId = fromId
      message.body.fromId = gotoId
      message.body.avatar = concats.body[1].avatar
      message.body.nickName = concats.body[1].nickName

      // 请求青云客api接口
      http.get(url, res => {
        const { statusCode } = res

        if (statusCode == 200) {
          let rawData = ''

          res.on('data', chunk => {
            rawData += chunk
          })

          res.on('end', () => {
            try {
              const parsedData = JSON.parse(rawData)
              let content = parsedData.content
              
              // 表情替换
              if (content.indexOf('face') != -1) {
                let arr = content.split(/[{]|[}]/g)
                let index = arr[1].split(':')[1]
                // 接收的表情范围99, 超过的不显示
                if(index < 99) {
                  content = content.replace(content, `${arr[0]}<span class="face face${index}"></span>${arr[2]}`)
                } else {
                  content = content.replace(content, `${arr[0]}${arr[2]}`)
                }
              }
              message.body.message.content = content
            } catch (e) {
              console.error(e.message)
            }
          })
        } else {
          message.body.message.content = '接口出现问题了，等下再来找我！'
        }
        // 修改时间
        message.body.message.time = Tools.dateTime()

        setTimeout(() => {
          console.log('----------------沉默憨憨----------------')
          console.log(message)
          console.log('-----------------------------------------')
          // 发送消息给客户端
          concats.onLine[fromId].emit('MESSAGE', message)
          robot.text(`沉默憨憨：${message.body.message.content}`)
        }, 0)
      }).on('error', (e) => {
        console.error(`出现错误: ${e.message}`)
      })

    // 聊天室
    } else if (type == 'group-message'){
      const post = [
        'group-message',
        JSON.stringify(message.body)
      ]

      // 插入数据库
      Tools.database('INSERT INTO group_message(Id,type,body) VALUES(0,?,?)', post, result => {
        if (result) {
          console.log(`收到群聊消息【${message.body.message.textContent}】已插入数据库`)
        }
      })
      io.emit('MESSAGE', message)
    // 一对一聊天
    } else {
      message.id = fromId
      message.body.fromId = gotoId
      message.body.gotoId = fromId
	  console.log(message)
      concats.onLine[gotoId].emit('MESSAGE', message)
    }
  })

  /**
   * 查看更多消息
   */
  socket.on('QUERY_PAGE', response => {
    let id = response.id
    let limit = 10
    let page = response.page
    let length = response.length
    let sql = `SELECT * FROM group_message ORDER BY ID DESC LIMIT ${(page - 1) * limit},${limit}`

    // 查询数据
    Tools.database(sql, false, result => {
      if (id) {
        if (length && result != '') result = result.slice(length)
        concats.onLine[id].emit('GROUP_MESSAGE', result)
		/**
        console.log(`----------------第${page}页----------------`)
        console.log(result)
        console.log('------------------------------------')
		**/
      }
    })
  })
})

/**
 * 开启服务
 */
server.listen(4001, function() {
  console.log('goto href：', 'http://localhost:4001')
})
