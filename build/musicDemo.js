//播放暂停
$("#play-pause").click(function () {
    if ($(this).hasClass("stop")) {
        $(this).removeClass("stop").addClass("begin");
        sendMessage("play");
    } else if ($(this).hasClass("begin")) {
        $(this).removeClass("begin").addClass("stop");
        sendMessage("pause");
    }
});
//静音
$(".range i").click(function(){
    var volume = 40;
    if($(this).hasClass("novol") && window.localStorage.getItem("oldVolume") != "0"){
        $(this).removeClass("novol").addClass("vol");
        volume = window.localStorage.getItem("oldVolume") || "40";
    }else{
        $(this).removeClass("vol").addClass("novol");
        volume = "0";
    }
    $("#volume").val(volume);
    $("#volume").css( 'background-size', volume + '% 100%' );
    $(this).siblings("label").text(volume);
    sendMessage("volume", volume);
});
//上一曲
$(".lf").click(function () {
    sendMessage("pre");
});
//下一曲
$(".rt").click(function () {
    sendMessage("next");
});
//切换歌词与列表
$(".menu").click(function () {
    if($("#lt").is(":visible")==true){
        $("#lt").hide();
        $("#lrc").show();
        $(this).attr("title", "显示列表");
        window.localStorage.setItem("menu", "lrc");
    }else if($("#lrc").is(":visible")==true){
        $("#lt").show();
        $("#lrc").hide();
        $(this).attr("title", "显示歌词");
        window.localStorage.setItem("menu", "list");
    }else if(window.localStorage.getItem("menu") == "lrc"){
        $("#lt").hide();
        $("#lrc").show();
        $(this).attr("title", "显示列表");
        window.localStorage.setItem("menu", "lrc");
    }else{
        $("#lt").show();
        $("#lrc").hide();
        $(this).attr("title", "显示歌词");
        window.localStorage.setItem("menu", "list");
    }
});
//消息传递方法
function sendMessage(cmd,str){
    if(str){
        chrome.extension.sendMessage({
            cmd: cmd,
            str: str},
            function() {
        });
    }else{
        chrome.extension.sendMessage({
            cmd: cmd},
            function() {
        });
    }
}
//消息回调方法
chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.cmd == 'play') {
        setSongInfo();
        $("#lrc .lrc").animate({marginTop:"108px"},1500);
    }else if(request.cmd == "songPic"){
        setSongPic();
    }else if(request.cmd == "songList"){
        $("#lt").empty();
        setSongList();
    }else if(request.cmd == "songLrc"){
        $("#lrc .lrc").empty();
        setLrcList();
    }else if(request.cmd == "currentTime"){
        var currentTime = request.str;
        var duration = JSON.parse(window.localStorage.getItem("songTime"));
        if(duration && isMoving){
            var nowTime = parseInt(currentTime);
            var minutes = parseInt(nowTime/60);
            var seconds = nowTime - (minutes * 60);
            $(".currentTime").text(minutes + ":" + (seconds<10?"0"+seconds:seconds));
            $("#time").val(nowTime).css( 'background-size', (nowTime/(duration.duration-0))*100 + '% 100%' );
        }
        var $lrcP = $("#lrc .lrc p");
        if(result.length > 0){
            for (var i = 0, l = result.length; i < l; i++) {
                if (currentTime > result[i][0]) {
                    var lrc_id = "#lrc_"+(result[i][0]+"").replace(".", "_");
                    $(lrc_id).addClass("act").siblings().removeClass("act");
                }
            }
            var nowOffSet = parseInt($("#lrc .lrc .act").offset().top);
            // console.log("屏幕距离："+nowOffSet);
            if(nowOffSet != 326 && nowOffSet != 0 && isChangeMargin){
                isChangeMargin = 0;
                // console.log("上边距："+parseInt($("#lrc .lrc").css("marginTop").replace('px', '')));
                $("#lrc .lrc").animate({marginTop:parseInt($("#lrc .lrc").css("marginTop").replace('px', '')) - (nowOffSet - 326) + "px"},800,function(){
                    isChangeMargin = 1;
                });
            }
        }
    }else if(request.cmd == "volume"){
        $("#music")[0].volume = request.volume;
    }
});
var result = [];
var isMoving = 1;//0为正在移动进度
var isChangeMargin = 1;//0为正在滑动歌词
window.onload = function() {
    var songInfo = JSON.parse(window.localStorage.getItem("songInfo"));
    var volume = window.localStorage.getItem("volume") || "40";
    $("#volume").val(volume).css( 'background-size', volume + '% 100%' ).siblings("label").text(volume);
    if(songInfo.status == "play"){
        $("#play-pause").removeClass("stop").addClass("begin");
    }
    if(songInfo.songList){
        $(".menu").click();
        setSongList();
        setSongPic();
        setLrcList();
        setSongInfo();
    }else{
        $(".sml").text("thank you").siblings("p").text("Welcome SongDemo");
    }
}
//歌曲列表
function setSongList(){
    var songInfo = JSON.parse(window.localStorage.getItem("songInfo"));
    for(var i=0;i<songInfo.songList.length;i++){
        var html = "";
        html = html + '<div class="lt '+(i==songInfo.index?"act":"")+'" id="'+i+'" title="'+songInfo.songList[i].songName+'">';
        html = html + '		<p class="num">'+(i+1)+'</p>';
        html = html + '		<p class="name"><span class="big">'+(songInfo.songList[i].songName.length>12?songInfo.songList[i].songName.substring(0,12)+"··":songInfo.songList[i].songName)+'</span><span class="sm">'+(songInfo.songList[i].artistName.length>12?songInfo.songList[i].artistName.substring(0,12)+"··":songInfo.songList[i].artistName)+'</span></p>';
        //html = html + '		<p class="time">0:00</p>';
        html = html + '	</div>';
        $("#lt").append(html);
    }
}
//拆分歌词
function setLrcList(){
    var songInfo = JSON.parse(window.localStorage.getItem("songInfo"));
    var songLrc = JSON.parse(localStorage.getItem("songLrc")) || {};
    if(songLrc.songId != undefined && songLrc.songId == songInfo.songList[songInfo.index].songId){
        //将文本分隔成一行一行，存入数组
        var lines = songLrc.songLrc.split('\n'),
            //用于匹配时间的正则表达式，匹配的结果类似[xx:xx.xx]
            pattern = /\[\d{2}:\d{2}(.\d{1,2})?\]/g;
            //保存最终结果的数组
        result = [];
        //去掉不含时间的行
        while (!pattern.test(lines[0])) {
            lines = lines.slice(1);
        };
        while (!pattern.test(lines[lines.length - 1])) {
            lines.pop();
        };
        //上面用'\n'生成生成数组时，结果中最后一个为空元素，这里将去掉
        //lines[lines.length - 1].length === 0 && lines.pop();
        lines.forEach(function(v /*数组元素值*/ , i /*元素索引*/ , a /*数组本身*/ ) {
            //提取出时间[xx:xx.xx]
            var time = v.match(pattern),
                //提取歌词
                value = v.replace(pattern, '');
            //因为一行里面可能有多个时间，所以time有可能是[xx:xx.xx][xx:xx.xx][xx:xx.xx]的形式，需要进一步分隔
            time.forEach(function(v1, i1, a1) {
                //去掉时间里的中括号得到xx:xx.xx
                var t = v1.slice(1, -1).split(':');
                //将结果压入最终数组
                if(value != ""){
                    result.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]), value]);
                }
            });
        });
        //最后将结果数组中的元素按时间大小排序，以便保存之后正常显示歌词
        result.sort(function(a, b) {
            return a[0] - b[0];
        });
        for(var i=0;i<result.length;i++){
            $("#lrc .lrc").append("<p id='lrc_"+(result[i][0]+"").replace(".", "_")+"' class='"+(i==0?"act":"")+"'>"+result[i][1]+"</p>");
        }
        $("#lrc .lrc").append();
    }
}
//音量改变
$("#volume").bind("input", function(e){
    $(this).css( 'background-size', this.value + '% 100%' );
    window.localStorage.setItem("volume", this.value);
    window.localStorage.setItem("oldVolume", this.value);
    $(this).siblings("label").text(this.value);
    if(this.value == "0"){
        $(this).siblings("i").removeClass("vol").addClass("novol");
    }else{
        $(this).siblings("i").removeClass("novol").addClass("vol");
    }
    sendMessage("volume", this.value);
});
//播放进度改变
$("#time").bind("input", function(e){
    isMoving = 0;
    var duration = JSON.parse(window.localStorage.getItem("songTime"));
    if(duration){
        $(this).css( 'background-size', (this.value/(duration.duration-0))*100 + '% 100%' );
        var nowTime = parseInt(this.value);
        var minutes = parseInt(nowTime/60);
        var seconds = nowTime - (minutes * 60);
        $(".currentTime").text(minutes + ":" + (seconds<10?"0"+seconds:seconds));
    }

});
$("#time").bind("mouseup", function(e){
    var duration = JSON.parse(window.localStorage.getItem("songTime"));
    if(duration){
        sendMessage("changeCurrentTime", this.value);
        isMoving = 1;
    }
});
//歌曲图片
function setSongPic(){
    var songInfo = JSON.parse(window.localStorage.getItem("songInfo"));
    var songPic = JSON.parse(localStorage.getItem("songPic")) || {};
    if(songPic.songId != undefined && songPic.songId == songInfo.songList[songInfo.index].songId){
        $("#play img")[0].src = songPic.songPic;
    }
}
//歌曲信息
function setSongInfo(){
    var songInfo = JSON.parse(window.localStorage.getItem("songInfo"));
    $(".sml").text(songInfo.songList[songInfo.index].artistName).siblings("p").text(songInfo.songList[songInfo.index].songName);
    $("#"+songInfo.index).addClass("act").siblings("div").removeClass("act");
    var songTime = JSON.parse(window.localStorage.getItem("songTime")) || {};
    if(songTime.songId != undefined && songTime.songId == songInfo.songList[songInfo.index].songId){
        var minutes = parseInt(songTime.duration/60);
        var seconds = songTime.duration - (minutes * 60);
        $(".duration").text(minutes + ":" + (seconds<10?"0"+seconds:seconds));
        $("#time").attr("min", "0").attr("max", songTime.duration).attr("step", "1");
    }else{
        $(".duration").text("00:00");
    }
    location.href = "#"+songInfo.index;
    //点击歌曲
    $(".lt").on("click", function(){
        sendMessage("changeMusic", this.id);
    });
}
