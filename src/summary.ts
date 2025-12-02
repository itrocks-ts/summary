import { Action }                from '@itrocks/action'
import { Need }                  from '@itrocks/action'
import { Request }               from '@itrocks/action-request'
import { representativeValueOf } from '@itrocks/class-view'
import { Route }                 from '@itrocks/route'
import { dataSource }            from '@itrocks/storage'
import { Identifier }            from '@itrocks/storage'
import { Sort }                  from '@itrocks/storage'

export type SummaryRecord = [Identifier, string]

@Need('Store')
@Route('/summary')
export class Summary<T extends object = object> extends Action<T>
{

	async json(request: Request<T>)
	{
		const summary = await Promise.all(
			(await dataSource().readAll(request.type, Sort))
				.map(async object => [
					object.id,
					await representativeValueOf(object)
				])
		)
		return this.jsonResponse(summary)
	}

}
