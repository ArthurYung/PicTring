 /* PicTring v1.0.3
 * By Arthur Yang http://www.vanoc.top/
 * Github: https://github.com/ChuckOu/PicTring
 * MIT Licensed.
 */           
; (function () {
    'use strict';
    var ow = document.documentElement.clientWidth;
    var oh = document.documentElement.clientHeight;
    var ease = 'cubic-bezier(0.1, 0.57, 0.1, 1)';
    var prefix = '', vendors = { Webkit: 'webkit', Moz: '', O: 'o' },
        transform, transitionProperty, transitionDuration, transitionTiming, wrapper, transitionEnd;
    var testEl = document.createElement('div'),
    supportedTransforms = /^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,
    upfilesTestNumber= /^[0-9]+$/ ;
    if (testEl.style.transform === undefined) {
        for (var i in vendors) {
            if (testEl.style[vendors[i] + 'TransitionProperty'] !== undefined) {
                prefix = '-' + vendors[i].toLowerCase() + '-';
                wrapper = vendors;
                break;
            }
        }
    }
    var cssReset = {};
        transform = prefix + 'transform';
        transitionEnd = wrapper? wrapper+'TransitionEnd':'transitionend';
        cssReset[transitionProperty = prefix + 'transition-property'] =
        cssReset[transitionDuration = prefix + 'transition-duration'] =
        cssReset[transitionTiming = prefix + 'transition-timing-function'] = '';
    



    function addEvt(element, type, callback) {
        element.addEventListener(type, callback, false);
    }

    function reEvt(element, type, callback) {
        element.removeEventListener(type, callback);
    }
    function empty(element) {
        //清空子元素
        if (element.hasChildNodes()) {
            if(element.childNodes[0].nodeName=='figure'||element.childNodes[0].nodeName=='FIGURE'){
                element.removeChild(element.childNodes[0]);
                empty(element);
            }
          
        }
    }
    function removeArray(obj, val) {
        for (var i = 0; i < obj.length; i++) {
            if (obj[i] == val) {
                obj.splice(i, 1);
                return;
            }
        }
    }
    function toFormData(base) {
        // 此方法来自某知乎大神
        var arr = base.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
        }
        var obj = new Blob([u8arr], { type: mime });
        var fd = new FormData();
        fd.append('upfile', obj, 'image.png');
        return fd;
    }
    function domCenter(pic) {
        var x, y;
        if (pic.offsetWidth < pic.offsetHeight) {
            pic.className = 'pic-add-h';
            pic.style.marginTop = -pic.offsetHeight / 2 + 'px';
        } else {
            pic.className = 'pic-add-w'
            pic.style.marginLeft = -pic.offsetWidth / 2 + 'px';
        }
    }
    
    function figPostion(fig){
        fig.$left = fig.getBoundingClientRect().left ;
        fig.$top = fig.getBoundingClientRect().top ;
    }

    function touchCenter(fig,x,y){
        if(!x&&!y) return;
        fig.centerx = fig.getBoundingClientRect().left + fig.offsetWidth/2 - x;
        fig.centery = fig.getBoundingClientRect().top + fig.offsetHeight/2 - y;
    }

    var PicTring = function (options) {
        this.element = typeof options.up === "string" ? document.querySelector(options.up)[0] : options.up;
        this.imgType = options.imgType || 'base';   //url,base
        this.type = options.type || 'file';         //file,wx
        this.max = options.max || 9;                //图片最大值
        this.boxSize = options.boxSize || 80;       //盒子尺寸
        this.compress = options.compress || 0.93;   // 0-1, no为原图
        this.empty = this._empty.bind(this);        //清空图片，用于图片提交给后台之后
        this.maxSize = options.maxSize || 500;      //图片超过多大时压缩
        this.drag = options.drag || false;                           //是否允许pic拖拽排序
        this.$picUp = this.create("span", 'add-pictures');
        this.$scroller = this.create("div", 'pic-view-scroll'); 
        this.$nav = this.create("div", 'pic-view-revise');
        this.canvas = document.createElement("canvas");
        this.upfiles = this._upfiles.bind(this);    //
        this.index = 0;
        this.tree = { length: 0 };
        this.slide = { range: 0, _range: 0, isMove: false }
        this.addwx = this._add.bind(this);
        this.init = this._init.bind(this);
        this.tap = this._tap.bind(this);
        this.retap = this._reTap.bind(this);
        this.compressImg = this._compressImg.bind(this);
        this.positions = {};
        this.longPre = void 0;
        this.flex = this.flexPositions.bind(this);
        this.pushPic=this._pushPic.bind(this);
        this.showPic = this._showPic.bind(this);
        this.$flexBg = this.create("i", "pic-animate-bg");
        this.reviseUp=this._reviseUp.bind(this);
        this.reviseDown=this._reviseDown.bind(this);
        this.longPress = this._longPress.bind(this);
        this.operArry();
        this.init();
    };

    PicTring.prototype = {
        _init: function () {
            var that = this;
            var div = this.create("div", 'pic-view-load'),
                back = this.create("span", 'pic-view-back'),
                delet = this.create("span", 'pic-view-delet');
            back.$append(document.createTextNode("返回"))
            this.element.className += ' pic-this';
            this.empty();
            isNaN(this.boxSize) ? this.element.style.width = this.element.style.fontSize = this.boxSize : this.element.style.width = this.element.style.fontSize = (ow / 100) * this.boxSize + 'px';

            Object.defineProperty(  //监听 range属性的变化
                this.slide, 'range', {
                    get: function () {
                        return this['_range'];
                    },
                    set: function (x) {
                        this["_range"] = x;
                        that.$scroller.style[transform] = prefix + 'translate3d(' + x + 'px,0,0)';
                    }
                }
            );

            if (this.type == 'file') {
                var input = document.createElement("input");
                input.type = 'file';
                input.setAttribute('multiple', 'multiple');
                this.$picUp.appendChild(input);
                this.tap(this.$picUp, function (obj, e) { this.firstChild.click(); e.stopPropagation() })
                this.chosePic();
                input = null;  //回收内存
            } else {
                this.tap(this.$picUp, this.addwx);
            }
            this.$nav.$append(back, delet);
            div.$append(this.$nav, this.$scroller);
            div.style.height = oh + 'px';
            document.body.appendChild(div);
            this.element.appendChild(this.$picUp);
            this.element.appendChild(this.$flexBg);
            this.scrollMove.call(this.$scroller, this);
            this.$nav.$showIn = true;
            this.tap(back, this.close);
            this.tap(delet,this.delet); 
            this.tap(this.$scroller,this.reviseUp);
            div = back = delet = null;   //回收内存 
            this.resize();

        },
        _add: function () {
            //微信接口方式上传
        },
        resize:function(){
            var that = this;
            window.onresize = function() {
                ow = document.documentElement.clientWidth;
                oh = document.documentElement.clientHeight;
                if(!isNaN(that.boxSize))that.element.style.width = that.element.style.fontSize = (ow / 100) * that.boxSize + 'px';
                document.querySelector('.pic-view-load').style.height = oh +'px';
                [].forEach.call(that.tree,function(o,i){
                    domCenter(o.litte.firstChild);
                    figPostion(o.litte);
                })
            };
        },
        chosePic: function () {
            //选择上传图片
            var _this = this;
            addEvt(this.$picUp.firstChild, 'change', function () {
                var files = [].slice.call(this.files);
                files.forEach(function (file, i) {
                    //如果图片大于200kb，则压缩
                    var rander = new FileReader();
                    rander.onload = function () {
                        if( (file.size > (1024 * _this.maxSize))&&this.compress!='no') {
                            _this.compressImg(this.result)
                        } else {
                            var upUrl = _this.imgType == 'img' ? toFormData(this.result) : this.result;
                            _this.tree.push(upUrl, this.result);
                        }
                    };
                    rander.readAsDataURL(file);
                });
                this.value = '';
            })
        },
        /**
         * 
         * @param {Array} data 
         * 返回需要上传的图片,
         */
        _upfiles: function (o) {
            var i = [],
                _this = this;
            if (o) {
                if(upfilesTestNumber.test(o))return _this.tree[o-1].upUrl;
                o.forEach(function (a, f) {
                    i.push(_this.tree[a-1].upUrl);
                })
            } else {
                for (var j = 0; j < _this.tree.length; j++) {
                    i.push(_this.tree[j].upUrl);
                }
            }
            return i;
        },
        create: function (n, c) {
            //创见对象元素
            var i = document.createElement(n);
            c && (i.className = c);
            i.$append = function () {
                if (arguments.length > 0) {
                    for (var n = 0; n < arguments.length; n++) {
                        i.appendChild(arguments[n]);
                    }
                } else {
                    i.appendChild(arguments[0]);
                }
            }
            return i;
        },
        //获取图片距离中心的差值，赋予图片元素上
        _empty: function () { //清空对象所有添加的属性
            empty(this.element);
            empty(this.$scroller);
            this.tree.empty();
            this.index = 0;
        },
        _pushPic:function(e){
            var img= new Image();
            var that = this;
            var figure = this.create("figure");
            var views;
                img.onload=function(){
                    views = figure.cloneNode(true);
                    views.className=(ow / img.width) * img.height > oh ? "pic-view-h" : "pic-view-w";
                    that.element.appendChild(figure);
                    that.$scroller.appendChild(views);
                    that.tap(figure,that.preview);
                    that.tree[e].litte=figure;
                    that.tree[e].view=views;
                    (e===that.max-1)?that.element.removeChild(that.$picUp):that.element.appendChild(that.$picUp);
                    that.element.appendChild(that.$flexBg);
                    domCenter(img);
                    if(!that.drag)figPostion(figure),that.longPress(figure);  
                };
                figure.appendChild(img);
                figure.$picNum = e;
                img.src=this.tree[e].url;
        },
        operArry: function () {
            var _this = this;
            this.tree.push = function (upUrl, url) {
                if(this.length==_this.max)return;
                var value = {};
                var index=this.length;
                value.index=index;
                value.url=url;
                value.upUrl = upUrl;
                [].push.call(this, value);
                _this.$scroller.style.width = this.length*(ow+16) + 'px';
                _this.pushPic.call(_this,index);
            };
            this.tree.drop = function (index) {
                _this.$scroller.removeChild(this[index].view);
                _this.element.removeChild(this[index].litte);
                [].splice.call(this, index, 1);
            };
            this.tree.empty = function () {
                [].splice.call(this, 0, this.length);
            };
            this.tree.move = function(index,tindex){
                    if(index>tindex){
                    [].splice.call(_this.tree,tindex,0,_this.tree[index]);
                    [].splice.call(_this.tree,index+1,1)
                    }else{
                    [].splice.call(_this.tree,tindex+1,0,_this.tree[index]);
                    [].splice.call(_this.tree,index,1)
                    }
            }
        },
        _reviseUp:function(){
            var that=this;
            if(this.$nav.$showIn||!this.slide.isMove)return;
            this.$tr(this.$nav).css({transform:prefix+'translate3d(0,-100%,0',opacity:0}).to({
                translate3d:'0,0,0',
                opacity:1
            },300,ease,function(){
                that.$nav.$showIn = true;
            });
            
        },
        _reviseDown:function(){
            if(!this.$nav.$showIn)return;
            var _this = this;
            this.$nav.style[transform] = prefix+'translate3d(0,0,0)';
            this.$nav.style.opacity = 1;
            setTimeout(function(){
                _this.$tr(_this.$nav).to({
                    translate3d:'0,-100%,0',
                    opacity:0
                },300,'ease-in');
            },140);
            this.$nav.$showIn=false;
            
        },
        flexPositions: function (ele) {
            var  offsX = ow / 2 - ele.firstChild.offsetWidth / 2 - ele.firstChild.getBoundingClientRect().left;
            var  offsY = oh / 2 - ele.firstChild.offsetHeight / 2 - ele.firstChild.getBoundingClientRect().top;
            var positions ={
                x:offsX,
                y:offsY,
                w:ele.firstChild.offsetWidth,
                h:ele.firstChild.offsetHeight,
                n:((ow / ele.firstChild.offsetWidth) * ele.firstChild.offsetHeight) > oh ? oh / ele.firstChild.offsetHeight : ow / ele.firstChild.offsetWidth
            }
            offsX = offsY =null;
            return positions;
        },
        _showPic:function(){
            var conn = this.tree[this.index].litte;
            var img = conn.firstChild;
            var that = this;
            var positions=this.flex(conn);
                this.timeOut=true;
                this.slide.range = -this.index*(ow + 16);
                this.$tr(conn).css({'z-index':'720',overflow:'visible'}).to(
                         { translate3d: positions.x + "px," + positions.y + "px,0" }, 300, ease
                     )
                this.$tr(img).to(
                         { scale: positions.n }, 300, ease, function () {
                            document.querySelector('.pic-view-load').style.display = 'block';
                             that.reviseDown();
                             conn.style='';
                             that.$flexBg.style.opacity = 0;
                             img.style[transform] = '';
                             img = that = positions=that.timeOut = null;                   
                         }
                     );
                this.$tr(that.$flexBg).css({display:'block',opacity:0}).to(
                    { opacity: 1 }, 300, ease
                );
                    
        },
        preview: function (obj, e) {
                if(obj.timeOut) return;
                obj.index = this.$picNum;
                obj.showPic();
                e.stopPropagation();
        },
        close: function (obj, e) {
            if(obj.timeOut) return;  //如果正在执行预览或返回动画则取消接下来的动作;
            var eq = obj.index,
                that = obj.tree[eq].litte;
            var positions = obj.flex(that);
                document.querySelector('.pic-view-load').style.display = 'none';
                obj.$tr(that).css({transform:prefix + 'translate3d(' + positions.x + 'px,' + positions.y + 'px,0)','z-index':'720','overflow':'visible'});
                obj.$tr(that.firstChild).css(transform,prefix + 'scale(' + positions.n + ')');
                obj.$tr(obj.$flexBg).css({opacity:1,display:'block'});
                obj.timeOut=setTimeout(function(){
                 that.firstChild.to(
                      { scale: 1 }, 300, ease, function () {
                            that.style='';
                            obj.$flexBg.style='';
                            eq = that = positions  = obj.timeOut = null; 
                     }
                 );
                 that.to( { translate3d: "0,0,0" }, 300, ease);
                 obj.$flexBg.to({opacity:0},300,ease);
                },34)
                e.stopPropagation();
        },
        delet:function(obj, e){
                if(obj.tree.length==1){
                    document.querySelector('.pic-view-load').style.display='none';
                }else if(obj.index==obj.tree.length-1){
                    obj.slide.range=-(ow+16)*(obj.index-1);
                }
                    obj.tree.drop(obj.index);
                    [].forEach.call(obj.tree,function(i,o){
                        i.litte.$picNum=o;
                        figPostion(i.litte);
                    });
                    (obj.index==obj.tree.length)&&obj.index--;
                    obj.element.appendChild(obj.$picUp);
                    obj.element.appendChild(obj.$flexBg)
        },
        _tap: function (element, fn) {
            if (element.$tap_objs) {
                element.$tap_objs.push(fn)
            } else {
                element.$tap_objs = [fn];
                this.onTap(element, this);
            }
        },
        addClass: function(){
            var that = this;
            [].forEach.call(this.tree,function(o,i){
                if(that.onTouch!=i){
                    o.litte.className='pic-onTouch'
                }
            })
        },
        removeClass:function(){
            [].forEach.call(this.tree,function(o,i){
                    o.litte.className=''
            })
        },
        onTap: function (element, obj) {
            var starTime, endTime, startX, startY, endX, endY;
            function bindTap(evet) {
                event.preventDefault();
                if (event.type == "touchstart") {
                    var touch = evet.touches[0];
                    starTime = new Date().getTime();
                    startX = touch.pageX;
                    startY = touch.pageY;
                }
                if (event.type == "touchend") {
                    endTime = new Date().getTime();
                    if (endTime - starTime < 300) {
                        var touch = evet.changedTouches[0];
                        endX = touch.pageX;
                        endY = touch.pageY;
                        if (Math.abs(endX - startX) < 30 && Math.abs(endY - startY) < 30) {
                            element.$tap_objs.forEach(
                                function (t, i) {
                                    t.call(element, obj, evet);
                                }
                            )
                        }
                    }
                }
            }
            element.addEventListener("touchstart", bindTap);
            element.addEventListener("touchend", bindTap);
        },
        _reTap: function (element, fn) {
            arguments.length == 1 ? element.$tap_objs = [] : removeArray(element.$tap_objs, fn);
        },
        $tr:function(ele){
            if(!ele.to){ele.to=this.animate.bind(ele);}
            if(!ele.css){ele.css = this.css.bind(ele);}
            return ele;
        },
        animate:function(type,time,ease,callback){
                    var cssValues = {}, transforms = '', cssProperties = [];
                    for (var key in type) {
                        if (supportedTransforms.test(key)) transforms += prefix + key + '(' + type[key] + ') '
                        else cssValues[key] = type[key], cssProperties.push(key)
                    }
                    if (transforms) {
                        cssValues[transform] = transforms;
                        cssProperties.push(transform);
                    }
                    cssValues[transitionDuration] = time + 'ms'
                    cssValues[transitionTiming] = (ease || 'linear')
                    cssValues[transitionProperty] = cssProperties.join(', ');

                    for (var n in cssValues) {
                        this.style[n] = cssValues[n];
                    }
                    this.$endFn = callback ||function(){};
                    if(!this.$trans){
                    
                    addEvt(this,transitionEnd,function(){
                        for(var i in cssReset){
                            this.style[i] = '';
                        }
                        this.$endFn.call(this);
                        this.$trans = true;
                        this.$endFn = function(){};
                    })
                };
                return this;        
        },
        css:function(){
            if(arguments.length==1)for(var i in arguments[0]){ this.style[i]=arguments[0][i]}
            else{this.style[arguments[0]]=arguments[1]}
            return this;
        },
        scrollMove: function (obj) {
            var startx, _startx, move, movex, time, endx, startTime, endTime;
            //开始触摸函数，event为触摸对象
            function touchs(event) {
                event.preventDefault();
                event.stopPropagation();
                if (event.type == "touchstart") {
                    startTime = new Date().getTime();
                    startx = Math.floor(event.touches[0].pageX)
                    _startx = Math.floor(event.touches[0].pageX) - obj.slide.range;
                    obj.slide.max = -(obj.tree.length - 1) * (ow + 16);
                    obj.slide.isMove = true;
                } else if (event.type == "touchmove") {
                    move = Math.floor(event.touches[0].pageX);
                    if(move!=startx)obj.slide.isMove = false,obj.reviseDown();
                    movex = move - _startx;
                    obj.$scroller.style[transitionDuration] = '0ms';
                    if (obj.slide.range >= 0) {
                        obj.slide.range = (movex + 1) * 0.3
                    } else if (movex <= obj.slide.max) {
                        obj.slide.range = obj.slide.max - (Math.abs(move - startx)) * 0.3;
                    } else {
                        obj.slide.range = movex
                    }
                } else if (event.type == "touchend" || event.type == "touchcancel") {
                    endx = Math.floor(event.changedTouches[0].pageX);
                    move = endx - startx;
                    endTime = new Date().getTime();
                    if (((endTime - startTime) < 300&&Math.abs(move) > 30)|| Math.abs(move) > ow * 0.6) {
                        if (move < 0) {
                            obj.index == obj.tree.length - 1 ? obj.index : obj.index++;
                        } else if (move > 0) {
                            obj.index == 0 ? obj.index : obj.index--;
                        }
                    }
                    obj.$scroller.style[transitionDuration] = '300ms'
                    obj.slide.range = -obj.index * (ow + 16);
                }
            }

            //添加触摸事件的监听，并直行自定义触摸函数
            this.addEventListener('touchstart', touchs, false);
            this.addEventListener('touchmove', touchs, false);
            this.addEventListener('touchend', touchs, false);
        },
        //压缩图片
        _compressImg: function (rander) {
            var img = new Image();
            var _this = this;
            var context = this.canvas.getContext('2d');
            img.onload = function () {
                var imgWidth = 1080,
                    imgHeight = (this.height / this.width) * 1080,
                    upUrl;
                _this.canvas.width = 1080;
                _this.canvas.height = imgHeight;
                context.clearRect(0, 0, imgWidth, imgHeight);
                // 图片压缩
                context.drawImage(img, 0, 0, imgWidth, imgHeight);
                /*第一个参数是创建的img对象；第二个参数是左上角坐标，后面两个是画布区域宽高*/
                upUrl = _this.canvas.toDataURL('image/jpeg', _this.compress);
                //压缩后的base64编码
                if (_this.imgType == 'img') upUrl = toFormData(upUrl);
                _this.tree.push(upUrl, rander);
                img = _this = context = null;
            };
            img.src = rander;
        },
        _longPress:function(dom){
            var that = this;
            var press = false;
            var ready = false;
            var startx,starty,porx,pory,movex,movey,changeTransl;
            function onPress(event) {
                event.preventDefault();
                if (event.type == "touchstart") {
                    var _this =this;
                    startx = Math.floor(event.touches[0].pageX);
                    starty = Math.floor(event.touches[0].pageY);
                    that.longPre = setTimeout(function(){
                        ready = true;
                        press = true;
                        that.$tr(_this).css({'z-index':'720'}).to({scale:1.15,opacity:'0.7'},200,ease,function(){
                            that.onTouch = _this.$picNum;
                            that.addClass();
                            touchCenter(_this,startx,starty);
                            press = false;
                        });
                    },301);
                    that.changePic = void 0;
                } else if (event.type == "touchmove") {
                    if(!ready)return;
                    movex = Math.floor(event.touches[0].pageX);
                    movey = Math.floor(event.touches[0].pageY);
                    if(press){
                        if(movex-this.$left<0||movex-this.$left>this.offsetWidth||movey-this.$top<0||movey-this.$top>this.offsetHeight){
                            clearTimeout(that.longPre);
                            ready=false;
                            press=false;
                            this.style = '';
                            return;
                        }
                    }else{
                        porx = movex - startx;
                        pory = movey - starty;
                        that.restFix(movex+this.centerx,movey+this.centery);
                        this.style[transform]= prefix + 'translate3d('+porx+ 'px,'+pory+'px,0) '+ prefix + 'scale(1.15)';
                        event.stopPropagation();
                    }
                } else if (event.type == "touchend" || event.type == "touchcancel") {
                    clearTimeout(that.longPre);
                    changeTransl =  that.changePic>-1? (that.tree[that.changePic].litte.$left - this.$left)+'px,'+(that.tree[that.changePic].litte.$top - this.$top)+'px,0':'0,0,0';
                    ready&&that.$tr(this).to({scale:1,opacity:1,translate3d:changeTransl},300,ease,function(){
                        if(!press&&(that.changePic>-1))that.restLitte(this)
                        ready = false;
                        }).css({'z-index':'700'});
                }
            }
                addEvt(dom,'touchstart',onPress);
                addEvt(dom,'touchmove',onPress)
                addEvt(dom,'touchend',onPress) 
        },
        isZoon:function(x,y){
            return (x-this.$left)>0&&(x-this.$left)<this.offsetWidth&&(y-this.$top)>0&&(y-this.$top)<this.offsetHeight
        },
        restLitte:function(fig){
                    for(var i = 0 ;i<this.tree.length;i++){
                         this.tree[i].litte.style='';
                    }
                var that = this;
                var index = this.changePic>this.onTouch? this.changePic+1:this.changePic
                this.element.insertBefore(this.tree[this.onTouch].litte,this.element.childNodes[index]);
                this.$scroller.insertBefore(this.tree[this.onTouch].view,this.$scroller.childNodes[index]);
                this.tree.move(this.onTouch,this.changePic);
                this.removeClass();
                this.figPostion();
        },
        figPostion:function(){
            for(var i = 0;i<this.tree.length;i++){
                this.tree[i].litte.$picNum = i;
                figPostion(this.tree[i].litte);
            }
        },
        restPicRight:function(i){
            for(var n = 0;n<this.tree.length;n++){
                    if(n!=this.onTouch){
                           if(n>this.onTouch&&n<=i){
                                 this.tree[n].litte.style[transform] = 'translate3d(' + 
                                 (this.tree[n-1].litte.$left - this.tree[n].litte.$left) +'px,'+ 
                                 (this.tree[n-1].litte.$top - this.tree[n].litte.$top) +'px,0)';
                                 }else{
                           this.tree[n].litte.style = '';
                        }
                  }
             };
        },
        restPicLeft:function(i){
               for(var n = 0;n<this.tree.length;n++){
                                    if(n!=this.onTouch){
                                        if(n<this.onTouch&&n>=i){
                                            this.tree[n].litte.style[transform] = 'translate3d(' + 
                                            (this.tree[n+1].litte.$left - this.tree[n].litte.$left) +'px,'+ 
                                            (this.tree[n+1].litte.$top - this.tree[n].litte.$top) +'px,0)';
                                        }else{
                                  this.tree[n].litte.style = '';
                                }
                        }
              };
        },
        restFix:function(x,y){
            var that = this;
            [].forEach.call(this.tree,function(o,i){
                if(that.isZoon.call(o.litte,x,y)&&that.changePic!=i){
                    if(that.onTouch!=i){
                            if(i>that.onTouch){
                                that.restPicRight(i);
                                return that.changePic = i;
                            };
                            if(i<that.onTouch){
                                that.restPicLeft(i);
                                return that.changePic = i;
                            }
                        
                }else{  
                    for(var n = 0;n<that.tree.length;n++){
                        if(n!=that.onTouch)that.tree[n].litte.style = '';
                    }
                    return that.changePic = i;  
                    }
                } 
            })
                
        }
    }
    
    if (typeof module !== 'undefined' && typeof exports === 'object') {
        module.exports = PicTring;
        } else {
        window.PicTring = PicTring;
    }
})();
