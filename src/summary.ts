import { Action }                from '@itrocks/action'
import { Need }                  from '@itrocks/action'
import { Request }               from '@itrocks/action-request'
import { Type }                  from '@itrocks/class-type'
import { representativeOf }      from '@itrocks/class-view'
import { representativeValueOf } from '@itrocks/class-view'
import { Route }                 from '@itrocks/route'
import { like }                  from '@itrocks/sql-functions'
import { dataSource }            from '@itrocks/storage'
import { Identifier }            from '@itrocks/storage'
import { Limit }                 from '@itrocks/storage'
import { Option }                from '@itrocks/storage'
import { Sort }                  from '@itrocks/storage'

export type SummaryRecord = [Identifier, string]

export interface SummaryRequest
{
	limit?:      number | ''
	offset?:     number
	page?:       number
	startsWith?: string
}

const MAX_LENGTH = 1000

@Need('Store')
@Route('/summary')
export class Summary<T extends object = object> extends Action<T>
{

	async html(request: Request<T>)
	{
		return this.htmlResponse(
			'<ul>'
			+ (await this.summary(request))
				.map(entry => `<li data-id="${entry[0]}">${entry[1]}</li>`)
				.join('\n')
			+ '</ul>'
		)
	}

	async json(request: Request<T>)
	{
		// await new Promise(resolve => setTimeout(resolve, 500)) // SLOWED FOR TESTING
		return this.jsonResponse(await this.summary(request))
	}

	async summary(request: { data: SummaryRequest, type: Type<T> })
	{
		const limit      = (request.data.limit === '') ? MAX_LENGTH : request.data.limit
		const offset     = limit ? (request.data.offset ?? ((request.data.page ?? 0) * limit)) : 0
		const options:     Option[] = [Sort]
		let   search:      Partial<T> | undefined
		const startsWith = request.data.startsWith ?? ''
		if (limit) {
			options.push(new Limit(limit, offset ? offset : undefined))
		}
		if (startsWith.length) {
			const representative = representativeOf(request.type)
			search = { [representative[0]]: like(startsWith + '%') } as Partial<T>
		}
		const summary: SummaryRecord[] = await Promise.all(
			(await dataSource().search(request.type, search, options))
				.map(async object => [
					object.id,
					await representativeValueOf(object)
				])
		)
		if (limit) {
			const count = await dataSource().count(request.type, search)
			if (count > offset + limit) {
				summary.push([0, '...'])
			}
		}
		return summary
	}

}
