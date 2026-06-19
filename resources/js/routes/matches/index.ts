import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Games\GameController::ongoing
* @see app/Http/Controllers/Games/GameController.php:48
* @route '/matches/ongoing'
*/
export const ongoing = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ongoing.url(options),
    method: 'get',
})

ongoing.definition = {
    methods: ["get","head"],
    url: '/matches/ongoing',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Games\GameController::ongoing
* @see app/Http/Controllers/Games/GameController.php:48
* @route '/matches/ongoing'
*/
ongoing.url = (options?: RouteQueryOptions) => {
    return ongoing.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::ongoing
* @see app/Http/Controllers/Games/GameController.php:48
* @route '/matches/ongoing'
*/
ongoing.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ongoing.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::ongoing
* @see app/Http/Controllers/Games/GameController.php:48
* @route '/matches/ongoing'
*/
ongoing.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ongoing.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Games\GameController::ongoing
* @see app/Http/Controllers/Games/GameController.php:48
* @route '/matches/ongoing'
*/
const ongoingForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ongoing.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::ongoing
* @see app/Http/Controllers/Games/GameController.php:48
* @route '/matches/ongoing'
*/
ongoingForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ongoing.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::ongoing
* @see app/Http/Controllers/Games/GameController.php:48
* @route '/matches/ongoing'
*/
ongoingForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: ongoing.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

ongoing.form = ongoingForm

/**
* @see \App\Http\Controllers\Games\GameController::past
* @see app/Http/Controllers/Games/GameController.php:102
* @route '/matches/past'
*/
export const past = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: past.url(options),
    method: 'get',
})

past.definition = {
    methods: ["get","head"],
    url: '/matches/past',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Games\GameController::past
* @see app/Http/Controllers/Games/GameController.php:102
* @route '/matches/past'
*/
past.url = (options?: RouteQueryOptions) => {
    return past.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::past
* @see app/Http/Controllers/Games/GameController.php:102
* @route '/matches/past'
*/
past.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: past.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::past
* @see app/Http/Controllers/Games/GameController.php:102
* @route '/matches/past'
*/
past.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: past.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Games\GameController::past
* @see app/Http/Controllers/Games/GameController.php:102
* @route '/matches/past'
*/
const pastForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: past.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::past
* @see app/Http/Controllers/Games/GameController.php:102
* @route '/matches/past'
*/
pastForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: past.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::past
* @see app/Http/Controllers/Games/GameController.php:102
* @route '/matches/past'
*/
pastForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: past.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

past.form = pastForm

const matches = {
    ongoing: Object.assign(ongoing, ongoing),
    past: Object.assign(past, past),
}

export default matches