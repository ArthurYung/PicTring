# PicTring.js
一个轻量的移动端图片上传插件

# API:
```js
var pictring = new PicTring({
        up:(必须)dom,  //dom ;
        imgType: 'base', //上传图片的方式，默认为base , 可选base/file   (file为上传图片文件);
        max: 9,    //最大上传张数,默认为9;
        drag: false,  //是否禁止图片拖拽排序，默认为false;
        boxSize: 80 , //容器尺寸，默认为80，可传入数字， 或固定PX值;
        compress: 0.8 , //图片质量，0-1 ，'no'为原图 ，默认为0.92
        maxSize: 600    //超过多大时进行图片质量压缩，默认为600kb;
});
```


通过对象的实例可以返回队列中的图片:

``` js
pictring.upfiles(number)
```
* `number`是非必须，空值时返回所有队列中的图片，可传数组或数字


清空当前队列，可用于图片上传服务器成功之后的操作：
``` js
pictring.empty()
```


# DEMO(Mobile)
- 朋友圈: [http://www.toofook.com/upfiles-js/index.html]
