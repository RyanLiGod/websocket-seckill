var app = angular.module("seckill", []);

app.controller("seckillCtrl", function ($scope) {
  var socket = io.connect();    //连接websocket
  var start = new Date();     //秒杀开始时间
  var deltaTime = 0;         //与服务器的时间差，用于精准计算
  var countdownTimer;       //倒计时定时器
  //初始化秒杀内容，
  //获得开始事件、服务器期间、余量、已有的秒杀列表（未开始时为空数组）
  socket.once('initSeckill', function (startTime, nowTime, remain, resultList) {
    var now = new Date(nowTime);
    deltaTime = new Date().getTime() - now.getTime();
    start = new Date(startTime);
    //判断当前状态，即将开始、正在进行或已经结束
    if (now.getTime() < start.getTime()) {
      $scope.status = '即将开始';
      countdown();
      countdownTimer = setInterval(countdown, 1000)
    }
    else {
      $scope.countdownTime = 0;
      if (remain > 0)
        $scope.status = '正在进行';
      else
        $scope.status = '已经结束';
    }
    //设定页面上的显示
    $scope.startTime = startTime;
    $scope.remain = remain;
    $scope.resultList = resultList;
    $scope.$apply();
  });
  //当秒杀结果列表有更新时，触发该事件，传入的是新增的项目
  socket.on('updateList', function (listItem) {
    $scope.remain--;
    $scope.resultList.push(listItem);
    if ($scope.remain <= 0)
      $scope.status = '已经结束';
    $scope.$apply();
  });
  //秒杀时间到，服务器发出广播，触发该事件
  socket.on('startSeckill', function () {
    clearInterval(countdownTimer);
    $scope.countdownTime = 0;
    $scope.status = '正在进行';
    $scope.$apply();
  });
  socket.on('killSuccess', function () {
    alert('秒杀成功');
  });
  socket.on('killFail', function (error) {
    alert(error);
  });

  //按下秒杀按钮，把学号发送到服务器
  $scope.goKill = function () {
    var exp = new RegExp("^((0[8-9])|(1[0-4]))(\\d{6}|\\d{7})$");
    if (!exp.test($scope.studentId) ) {
      alert("亲，您的学号输错啦！");
      return;
    }
    socket.emit('addKiller', $scope.studentId);
  };

  //倒计时的timer，由服务器发出秒杀开始事件来关闭，更加精准
  function countdown() {
    var countdownTime = start.getTime() - new Date().getTime() + deltaTime;
    $scope.countdownTime = Math.floor(countdownTime / 1000);
    $scope.$apply();
  }
});