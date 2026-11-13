import type {Next} from 'koa'
import type {RouterContext} from '@koa/router'
import {errorTypes} from '../constants/errorTypes'
import LabelService from '../service/label.service'
import type {AddLabelBody, LabelRef} from '../types/models'
import {emitError, getBody} from '../utils/request'

/** 标签预处理：校验、去重、缺失的标签先入库，结果挂到 ctx.state.labels */
export async function verifyLabelExist(ctx: RouterContext, next: Next): Promise<void> {
    const {labels} = getBody<AddLabelBody>(ctx)

    if (!Array.isArray(labels)) {
        emitError(ctx, errorTypes.INVALID_PARAMETERS)
        return
    }

    const names = [
        ...new Set(
            labels
                .filter((name): name is string => typeof name === 'string' && name.trim() !== '')
                .map(name => name.trim())
        )
    ]

    const newLabels: LabelRef[] = []
    for (const name of names) {
        const labelResult = await LabelService.getLabelName(name)
        if (labelResult) {
            newLabels.push({name, id: labelResult.id})
        } else {
            const result = await LabelService.create(name)
            newLabels.push({name, id: result.insertId})
        }
    }

    ctx.state.labels = newLabels
    await next()
}
