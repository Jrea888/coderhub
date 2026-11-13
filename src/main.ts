import app from './app/index'
import {APP_PORT} from './app/config'

app.listen(APP_PORT, () => {
    console.log(`Koa服务器在${APP_PORT}端口启动成功...`)
})
