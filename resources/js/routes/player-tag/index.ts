import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Games\GameController::update
* @see app/Http/Controllers/Games/GameController.php:605
* @route '/player-tag'
*/
export const update = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(options),
    method: 'patch',
})

update.definition = {
    methods: ["patch"],
    url: '/player-tag',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Games\GameController::update
* @see app/Http/Controllers/Games/GameController.php:605
* @route '/player-tag'
*/
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::update
* @see app/Http/Controllers/Games/GameController.php:605
* @route '/player-tag'
*/
update.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Games\GameController::update
* @see app/Http/Controllers/Games/GameController.php:605
* @route '/player-tag'
*/
const updateForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::update
* @see app/Http/Controllers/Games/GameController.php:605
* @route '/player-tag'
*/
updateForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

const playerTag = {
    update: Object.assign(update, update),
}

export default playerTag