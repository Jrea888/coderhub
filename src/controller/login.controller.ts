import type {RouterContext} from '@koa/router'
import {PRIVATE_KEY} from '../app/config'
import {errorTypes} from '../constants/errorTypes'
import {signToken} from '../utils/token'
import {emitError} from '../utils/request'

class LoginController {
    /** POST /login */
    async login(ctx: RouterContext): Promise<void> {
        const user = ctx.state.user
        if (!user) {
            emitError(ctx, errorTypes.UNAUTHORIZATION)
            return
        }

        // 私钥签发 token，后续用公钥验签（RS256）
        const token = signToken({id: user.id, name: user.name}, PRIVATE_KEY, {expiresIn: 60 * 60 * 24})

        ctx.body = {id: user.id, name: user.name, token}
    }

    /** GET /test */
    async success(ctx: RouterContext): Promise<void> {
        ctx.body = '授权成功~'
    }
}

export default new LoginController()
