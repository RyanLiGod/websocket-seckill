module.exports = WebSocket;

function WebSocket(server) {
  //配置秒杀
  var seckillConfig = {
    startTime: '2015-05-02 23:23:00',
    total: 5
  };
//开始时间
  var startTime = new Date(seckillConfig.startTime);
//秒杀余量
  var remain = seckillConfig.total;
//结果列表
  var resultList = [];

  var sio = require('socket.io');
  var io = sio.listen(server);
//计划任务，用于广播秒杀开始
  var schedule = require("node-schedule");
  var job = schedule.scheduleJob(startTime, function () {
    //广播秒杀开始
    io.sockets.emit('startSeckill');
  });
  io.sockets.on('connect', function (socket) {
    //初始化秒杀内容，传递开始时间、服务器时间、余量、列表
    socket.emit('initSeckill', seckillConfig.startTime, new Date().getTime(), remain,
      resultList);
    //用户按下秒杀按钮触发
    socket.on('addKiller', function (studentId) {
      //判断是否到时间
      if (new Date().getTime() < startTime.getTime()) {
        socket.emit('killFail', '还没开始呢！');
        return;
      }
      //判断是否已经抢过
      if (resultList.indexOf(studentId) >= 0) {
        socket.emit('killFail', '您已经抢过了');
        return;
      }
      //判断是否还有余量
      if (remain <= 0) {
        socket.emit('killFail', '已经抢完了');
      }
      else {
        //成功秒杀，添加到结果列表
        resultList.push(studentId);
        remain--;
        //广播秒杀列表更新
        io.sockets.emit('updateList', studentId);
        socket.emit('killSuccess');
      }
    })
  });
}
