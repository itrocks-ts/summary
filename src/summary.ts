import { Action }     from '@itrocks/action'
import { Need }       from '@itrocks/action'
import { Request }    from '@itrocks/action-request'
import { Route }      from '@itrocks/route'
import { dataSource } from '@itrocks/storage'
import { Identifier } from '@itrocks/storage'

export type SummaryRecord = [Identifier, string]

@Need('Store')
@Route('/summary')
export class Summary<T extends object = object> extends Action<T>
{

	async json(request: Request<T>)
	{
		const summary = (await dataSource().search(request.type)).map(object => [object.id, object + ''])
		return this.jsonResponse(summary)
	}

}
