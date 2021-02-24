// express 官网:  http://expressjs.jser.us/3x_zh-cn/api.html
var express = require('express');
var app = express();

app.get('/', (req, res) => {
    res.send('hello world');
});
app.post('/', (req,res)=>{
    res.send('Got a post request');
})
app.listen(3000, () => {
    console.log("服务器启动成功...")
});