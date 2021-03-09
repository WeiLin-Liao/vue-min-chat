var mysql = require('mysql')
var Config = require('./config.js')

const Tools = {
  /**
   * 获取当前时间
   */
  dateTime() {
    return new Date().getTime()
  },
  /**
   * 获取在线人数
   */
  getLineCount(concats) {
    return concats.body.length - 2
  },
  /**
   * mysql
   */
  database(sql, values, fn) {
    const db = mysql.createConnection(Config.Mysql)

    db.connect(err => {
      if (err) throw err
    })

    if (values) {
      // 插入数据
      db.query(sql, values, function (err, result) {
        if (err) {
          console.log('插入数据库出错：', err)
        } else {
          fn(result)
        }
      })
    } else {
      // 查询数据
      db.query(sql, function (err, result) {
        if (err) {
          console.log('查询数据库出错：', err)
        } else {
          fn(result)
        }
      })
    }
    db.end()
  }
}

exports = module.exports = Tools
