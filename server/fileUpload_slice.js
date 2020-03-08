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
const port = process.env.PORT || '8100';

const uploadHost = `http://localhost:${port}/`;

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
  let file = ctx.request.files.file; //得到上传文件的数组
  // console.log(file);
  let flag = ctx.request.body.flag; // 文件标识
  let chunkIndex = ctx.request.body.index; //文件顺序
  let type = ctx.request.body.type; // merge
  // 根据flag和index重命名chunk
  if (file) {
    let { path } = file;
    let newPath = `${filePath}/${chunkIndex}-${flag}`;
    fs.renameSync(path, newPath);
  }
  // 全部上传完成后的合并文件指令
  if (type && type === 'merge') {
    let { filename, chunkCount } = ctx.request.body;
    let writeStream = fs.createWriteStream(`${filePath}/${filename}`); // 创建写入流，真实文件名
    // 因为stream操作是异步的，所以使用递归回调的形式
    let curIndex = 0;
    mergeChunk();
    function mergeChunk() {
      let curFile = `${filePath}/${curIndex}-${flag}`;
      let readStream = fs.createReadStream(curFile);
      // readable.pipe(destination, options), 将可读流的所有数据通过管道推送到destination文件
      // options: end - 当读取器read结束时终止写入器
      readStream.pipe(writeStream, { end: false });
      readStream.on('end', () => {
        console.log(curFile, 'end');
        // 每推送完一个chunk之后，进行下一个
        if (curIndex < chunkCount - 1) {
          curIndex++;
          mergeChunk();
        } else {
          // 全部合并完成后，删除全部chunk
          for (let i = 0; i < chunkCount; i++) {
            fs.unlink(`${filePath}/${i}-${flag}`, (e) => {
              if (e) {
                console.log(e);
              }
            });
          }
        }
      });
    }
    ctx.body = 'merge finish';
  } else {
    ctx.body = 'chunk upload finish';
  }
})

/**
 * Create HTTP server.
 */
var server = http.createServer(app.callback());
server.listen(port);
console.log('demo5 server start ......');