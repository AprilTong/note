//定义整个页面为一个模块化，将所有代码放到他的基础上
var app = {
    util: {},
    store: {}
};
//工具方法模块
app.util = {
        //定义一个方法来获取元素节点
        $: function(selector, node) {
            return (node || document).querySelector(selector);
        },

        formatTime: function(ms) {
            var d = new Date(ms);
            var pad = function(s) {
                if (s.toString().length === 1) {
                    s = '0' + s;
                }
                return s;
            };
            //年月日
            var year = d.getFullYear();
            var month = d.getMonth() + 1;
            var day = d.getDate();
            //时分秒
            var hour = d.getHours();
            var minute = d.getMinutes();
            var second = d.getSeconds();
            return year + '-' + pad(month) + '-' + pad(day) + ' ' + hour + ':' + pad(minute) + ':' + pad(second);
        },
    },
    //store使用本地localStorgge保存模块
    app.store = {
        key: 'sticky_key',
        get: function(id) {
            var notes = this.getNotes();
            return notes[id] || {};
        },
        set: function(id, content) {
            var notes = this.getNotes();
            //Object.assign方法用于对象的合并，将源对象（ source ）的所有可枚举属性，复制到目标对象（ target ）
            if (notes[id]) {
                Object.assign(notes[id], content);
            } else {
                notes[id] = content;
            }
            localStorage[this.key] = JSON.stringify(notes);
            console.log('saved note : id' + id + 'content :' + JSON.stringify(notes));
        },
        remove: function(id) {
            var notes = this.getNotes();
            delete notes[id];
            localStorage[this.key] = JSON.stringify(notes);
        },
        getNotes: function() {
                return JSON.parse(localStorage[this.key] || '{}');
            }
            //parse和stringify的区别
            //JSON.stringify() 方法用于将 JavaScript 值转换为 JSON 字符串。
            //JSON.parse() 方法用于将一个 JSON 字符串转换为对象。
    };
//定义一个匿名函数来进行添加等应用代码
(function(util, store) {
    var $ = util.$;
    var movedNote = null;
    var startX;
    var startY;
    var maxZIndex = 0;
    //将html内容转换成模板字符串，方法1：+号拼接，方法2:es模板``;
    var noteTemplate = `<i class="close"></i>
		<div class="editor" contenteditable ="true"></div>
		<div class="timestamp">
		<span>更新：</span>
		<span class="time">2017-6-16</span></div>`;

    //定义构造函数来处理创建的node便签
    function Note(options) {
        var note = document.createElement("div");
        note.className = "m-note";
        note.id = options.id || 'm-note' + Date.now();
        note.innerHTML = noteTemplate;
        document.body.appendChild(note);
        $(".editor", note).innerHTML = options.content || '';
        note.style.left = options.left + 'px';
        note.style.top = options.top + 'px';
        note.style.zIndex = options.zIndex;
        note.style.backgroundColor = options.backgroundColor;
        this.note = note;
        this.updateTime(options.updateTime);
        this.addEvent();
    }
    //便签的关闭事件
    Note.prototype.close = function(e) {
        document.body.removeChild(this.note);
    };

    Note.prototype.addEvent = function() {
        var closeBtn = $(".close", this.note);
        //删除note时并且移除其上面绑定的事件
        var closeHandler = function(e) {
            store.remove(this.note.id);
            this.close(e);
            closeBtn.removeEventListener('click', closeHandler);
            this.note.removeEventListener('mousedown', mousedownHandler);
        }.bind(this);
        closeBtn.addEventListener("click", closeHandler);
        var mousedownHandler = function(e) {
            movedNote = this.note;
            startY = e.clientY - this.note.offsetTop;
            startX = e.clientX - this.note.offsetLeft;

            if (parseInt(this.note.style.zIndex) !== maxZIndex) {
                this.note.style.zIndex = maxZIndex++;
                store.set(this.note.id, {
                    zIndex: maxZIndex - 1,
                });
            }
        }.bind(this); //bind(this),将this绑定到bind中管理类实例，this指向类实例

        this.note.addEventListener('mousedown', mousedownHandler);

        //便签的输入事件
        var editor = $('.editor', this.note);
        var inputTimer;
        var inputHandler = function(e) {
            var content = editor.innerHTML;
            clearTimeout(inputTimer);
            inputTimer = setTimeout(function() {
                var time = Date.now();
                store.set(this.note.id, {
                    content: content,
                    updateTime: time,
                });
                this.updateTime(time);
            }.bind(this), 400);
        }.bind(this);

        editor.addEventListener('input', inputHandler);
    };
    //更新时间
    Note.prototype.updateTime = function(ms) {
        var time = $('.time', this.note);
        ms = ms || Date.now();
        time.innerHTML = util.formatTime(ms);
        this.updateTimeInMS = ms;
    };
    //保存功能的实现
    Note.prototype.save = function() {
        store.set(this.note.id, {
            left: this.note.offsetLeft,
            top: this.note.offsetTop,
            backgroundColor: this.note.style.backgroundColor,
            zIndex: parseInt(this.note.style.zIndex),
            content: $('.editor', this.note).innerHTML,
            updateTime: this.updateTimeInMS,
        });
    };
  //鼠标移动处理程序
    function mousemoveHandler(e) {
        if (!movedNote) {
            return;
        }
        movedNote.style.left = e.clientX - startX + "px";
        movedNote.style.top = e.clientY - startY + "px";
    }
//鼠标松开时的处理程序
    function mouseupHander(e) {
        if (!movedNote) {
            return;
        }
        movedNote = null;
    }
    document.addEventListener('mousemove', mousemoveHandler);
    document.addEventListener('mouseup', mouseupHander);
    //DOMContentLoaded事件，在DOM完全加载完之后，在css等资源加载完之前触发此事件；
    //区别load事件：在DOM和资源加载完之后触发，会导致延迟
    document.addEventListener("DOMContentLoaded", function(e) {
        $("#create").addEventListener("click", function(e) {
            //随机产生note
            var note = new Note({
                left: Math.round(Math.random() * (window.innerWidth - 220)),
                top: Math.round(Math.random() * (window.innerHeight - 320)),
                backgroundColor: 'rgb(' + Math.floor(Math.random() * 255) + ',' + Math.floor(Math.random() * 255) + ',' + Math.floor(Math.random() * 255) + ')',
                zIndex: maxZIndex++
            });
            note.save();
        });
        //清除所有note,清除note并清除所有localStorage缓存
        $("#clear").addEventListener("click", function() {
            while(document.body.childNodes.length > 7)
            { 
               localStorage.clear();       
               document.body.removeChild(document.body.childNodes[7]);
            }
        });
        //初始化notes
        var notes = store.getNotes();
        //Object.keys 方法仅返回可枚举属性和方法的名称
        Object.keys(notes).forEach(function(id) {
            var options = notes[id];
            if (maxZIndex < options.zIndex) {
                maxZIndex = options.zIndex;
            }
            new Note(Object.assign(options, {
                id: id,
            }));
        });
        maxZIndex += 1;
    });
})(app.util, app.store);
