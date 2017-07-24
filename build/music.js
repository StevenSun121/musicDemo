//歌曲信息
var songInfo = JSON.parse(window.localStorage.getItem("songInfo"));
if(!songInfo){
    songInfo = {};
}else{
    songInfo.status = "pause";
}
window.localStorage.setItem("songInfo", JSON.stringify(songInfo));
/**
 * 获取歌单(全部信息)
 */
function getSongList(cmd){
    var listId = "public_tuijian_suibiantingting";//随便听听
    // listId = "lovesongs";//红心频道
    // listId = "public_tuijian_chengmingqu";//成名曲
    // listId = "public_shiguang_jingdianlaoge";//经典老歌
    // listId = "public_tuijian_yingshi";//影视
    // listId = "public_fengge_qingyinyue";//轻音乐
    // listId = "public_xinqing_qingge";//单身情歌
    // listId = "public_tuijian_chengmingqu";//成名曲
    //歌曲列表
    $.ajax({
        dataType : 'jsonp',
        url : "https://ss3.baidu.com/5LgHhXSm2Q5IlBGlnYG/dev/api/",
        data : {
            "tn" : "playlist",
            "id" : listId
        },
        type : 'POST',
        success : function(data) {
            songInfo.listName = data.channel_name;
            var songListTemp = [];
            for(var i=0;i<data.list.length;i++){
                songListTemp.push(data.list[i].id);
            }
            //songInfo.songList = songList;
            //歌曲信息
            $.ajax({
                dataType : 'jsonp',
                url : "https://ss3.baidu.com/5LgHhXSm2Q5IlBGlnYG/data/music/songinfo",
                data : {
                    "songIds" : songListTemp.join(","),
                },
                type : 'POST',
                success : function(data) {
                    songList = songInfo.songList || [];
                    for(var i=0;i<data.data.songList.length;i++){
                        var song = {};
                        song.songId = data.data.songList[i].songId;
                        song.songName = data.data.songList[i].songName;
                        song.songPic = data.data.songList[i].songPicSmall;
                        song.artistName = data.data.songList[i].artistName;
                        songList.push(song);
                    }
                    songInfo.songList = songList;
                    window.localStorage.setItem("songInfo", JSON.stringify(songInfo));
                    if(cmd == "play"){
                        getSongLink();
                    }
                    callBack("songList");
                }, 
                error : function(data) {
                }
            });
        }, 
        error : function(data) {
        }
    });
}
/**
 * 获取歌曲链接
 */
function getSongLink(){
    //歌曲链接
    $.ajax({
        dataType : 'jsonp',
        url : "https://ss3.baidu.com/5LgHhXSm2Q5IlBGlnYG/data/music/songlink",
        data : {
            "songIds" : songInfo.songList[songInfo.index].songId,
        },
        type : 'POST',
        success : function(data) {
            $("#music")[0].src = data.data.songList[0].songLink;
            $("#music")[0].volume = 0.4;
            $("#music")[0].play();
            var songTime = {};
            songTime.songId = songInfo.songList[songInfo.index].songId;
            songTime.duration = data.data.songList[0].time;
            localStorage.setItem("songTime", JSON.stringify(songTime));
            callBack("play");
            $.ajax({
                dataType : 'text',
                url : data.data.songList[0].lrcLink,
                type : 'GET',
                success : function(data) {
                    var songLrc = {};
                    songLrc.songId = songInfo.songList[songInfo.index].songId;
                    songLrc.songLrc = data;
                    localStorage.setItem("songLrc", JSON.stringify(songLrc));
                    callBack("songLrc");
                }
            });
        }
    });
    var c=document.getElementById("myCanvas");
    var cxt=c.getContext("2d");
    var img=new Image();
    img.onload =function(evt){
        if(typeof(img.readyState)=='undefined'){
            img.readyState = 'undefined';
        }
        //在IE8以及以下版本中需要判断readyState而不是complete
        if ((img.readyState=='complete'||img.readyState=="loaded")||img.complete){ 
            //console.log('width='+imgloader.width+',height='+imageloader.height);//读取原始图片大小
            cxt.drawImage(img,0,0,img.width,img.height);
            var songPic = {};
            songPic.songId = songInfo.songList[songInfo.index].songId;
            songPic.songPic = c.toDataURL("image/png");
            localStorage.setItem("songPic", JSON.stringify(songPic));
            callBack("songPic");
        }else{
            img.onreadystatechange(evt);
        }
    };
    img.crossOrigin = 'anonymous';
    img.src=songInfo.songList[songInfo.index].songPic;
}
//
chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.cmd == "play") {
        if(songInfo.index == undefined){
            songInfo.index = 0;
            getSongList(request.cmd);
        }else{
            if($("#music")[0].paused && $("#music")[0].src[0] == "h"){
                $("#music")[0].play();
            }else{
                getSongLink();
            }
            if(songInfo.index + 10 >= songInfo.songList.length){
                getSongList();
            }
        }
        songInfo.status = "play";
    }else if(request.cmd == "pause"){
        $("#music")[0].pause();
        songInfo.status = "pause";
    }else if(request.cmd == "pre"){
        $("#music")[0].pause();
        if(songInfo.index > 0){
            songInfo.index = songInfo.index - 1;
            getSongLink();
            songInfo.status = "play";
        }
    }else if(request.cmd == "next"){
        $("#music")[0].pause();
        nextSong();
        songInfo.status = "play";
    }else if(request.cmd == "volume"){
        $("#music")[0].volume = ((request.str-0)/100).toFixed(2);
    }else if(request.cmd == "changeMusic"){
        $("#music")[0].pause();
        songInfo.index = request.str - 0;
        getSongLink();
        if(songInfo.index + 10 >= songInfo.songList.length){
            getSongList();
        }
    }else if(request.cmd == "changeCurrentTime"){
        $("#music")[0].pause();
        $("#music")[0].currentTime = request.str;
        $("#music")[0].play();
    }
    window.localStorage.setItem("songInfo", JSON.stringify(songInfo));
});
//下一首
function nextSong(){
    if(songInfo.index != undefined){
        songInfo.index = songInfo.index + 1;
        if(songInfo.songList[songInfo.index] != undefined){
            getSongLink();
        }
        if(songInfo.index + 10 >= songInfo.songList.length){
            getSongList();
        }
    }
} 
function callBack(cmd,str){
    if(str){
        chrome.extension.sendMessage({
            cmd: cmd,
            str: str},
            function(response) {
        });
    }else{
        chrome.extension.sendMessage({
            cmd: cmd},
            function(response) {
        });
    }
}
//继续播放下一首
$("#music")[0].addEventListener('ended', function () {
    nextSong();
    window.localStorage.setItem("songInfo", JSON.stringify(songInfo));
}, false);
$("#music")[0].addEventListener('timeupdate', function () {
    var currentTime = this.currentTime;
    callBack("currentTime", currentTime);
},false);