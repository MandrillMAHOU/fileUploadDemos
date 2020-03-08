/**
 * 服务入口
 */
var http = require('http');
var koaStatic = require('koa-static');
var path = require('path');
var koaBody = require('koa-body');
var fs = require('fs');
var Koa = require('koa2');


var app = new Koa();
var port = process.env.PORT || '8100';

var uploadHost = `http://localhost:${port}/`;

app.use(async (ctx, next)=> {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  ctx.set('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
  if (ctx.method == 'OPTIONS') {
    ctx.body = 200; 
  } else {
    await next();
  }
});

const filePath = path.resolve(__dirname, './uploads');
app.use(koaBody({
  formidable: {
    //设置文件的默认保存目录，不设置则保存在系统临时目录下  
    uploadDir: filePath
  },
  multipart: true // 支持文件上传
}));

// 访问静态文件的时候就不需要uploads路径了，直接：地址/filename
app.use(koaStatic(
  filePath
));

app.use((ctx) => {
  var files = ctx.request.files.f1; // 得到上传文件的数组
  var result = [];

  if (!Array.isArray(files)) { // 单文件上传容错
    files = [files];
  }

  files && files.forEach(file => {
    let { path } = file;
    let fileName = file.name; //原文件名称
    let newPath = `${filePath}/${fileName}`;
    if (file.size > 0 && path) {
      //重命名文件
      fs.renameSync(path, newPath);
      result.push(newPath);
    }
  });


  ctx.body = `{
        "fileUrl":${JSON.stringify(result)}
    }`;
})

/**
 * Create HTTP server.
 */
var server = http.createServer(app.callback());
server.listen(port);
console.log('demo5 server start ......');