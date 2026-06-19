import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\MatchmakingController::show
* @see app/Http/Controllers/MatchmakingController.php:15
* @route '/matchmaking'
*/
export const show = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/matchmaking',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MatchmakingController::show
* @see app/Http/Controllers/MatchmakingController.php:15
* @route '/matchmaking'
*/
show.url = (options?: RouteQueryOptions) => {
    return show.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MatchmakingController::show
* @see app/Http/Controllers/MatchmakingController.php:15
* @route '/matchmaking'
*/
show.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MatchmakingController::show
* @see app/Http/Controllers/MatchmakingController.php:15
* @route '/matchmaking'
*/
show.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\MatchmakingController::show
* @see app/Http/Controllers/MatchmakingController.php:15
* @route '/matchmaking'
*/
const showForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MatchmakingController::show
* @see app/Http/Controllers/MatchmakingController.php:15
* @route '/matchmaking'
*/
showForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MatchmakingController::show
* @see app/Http/Controllers/MatchmakingController.php:15
* @route '/matchmaking'
*/
showForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\MatchmakingController::join
* @see app/Http/Controllers/MatchmakingController.php:31
* @route '/matchmaking/queue'
*/
export const join = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: join.url(options),
    method: 'post',
})

join.definition = {
    methods: ["post"],
    url: '/matchmaking/queue',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\MatchmakingController::join
* @see app/Http/Controllers/MatchmakingController.php:31
* @route '/matchmaking/queue'
*/
join.url = (options?: RouteQueryOptions) => {
    return join.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MatchmakingController::join
* @see app/Http/Controllers/MatchmakingController.php:31
* @route '/matchmaking/queue'
*/
join.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: join.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\MatchmakingController::join
* @see app/Http/Controllers/MatchmakingController.php:31
* @route '/matchmaking/queue'
*/
const joinForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: join.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\MatchmakingController::join
* @see app/Http/Controllers/MatchmakingController.php:31
* @route '/matchmaking/queue'
*/
joinForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: join.url(options),
    method: 'post',
})

join.form = joinForm

/**
* @see \App\Http\Controllers\MatchmakingController::leave
* @see app/Http/Controllers/MatchmakingController.php:48
* @route '/matchmaking/queue'
*/
export const leave = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: leave.url(options),
    method: 'delete',
})

leave.definition = {
    methods: ["delete"],
    url: '/matchmaking/queue',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\MatchmakingController::leave
* @see app/Http/Controllers/MatchmakingController.php:48
* @route '/matchmaking/queue'
*/
leave.url = (options?: RouteQueryOptions) => {
    return leave.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MatchmakingController::leave
* @see app/Http/Controllers/MatchmakingController.php:48
* @route '/matchmaking/queue'
*/
leave.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: leave.url(options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\MatchmakingController::leave
* @see app/Http/Controllers/MatchmakingController.php:48
* @route '/matchmaking/queue'
*/
const leaveForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: leave.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\MatchmakingController::leave
* @see app/Http/Controllers/MatchmakingController.php:48
* @route '/matchmaking/queue'
*/
leaveForm.delete = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: leave.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

leave.form = leaveForm

/**
* @see \App\Http\Controllers\MatchmakingController::status
* @see app/Http/Controllers/MatchmakingController.php:63
* @route '/matchmaking/status'
*/
export const status = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

status.definition = {
    methods: ["get","head"],
    url: '/matchmaking/status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\MatchmakingController::status
* @see app/Http/Controllers/MatchmakingController.php:63
* @route '/matchmaking/status'
*/
status.url = (options?: RouteQueryOptions) => {
    return status.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\MatchmakingController::status
* @see app/Http/Controllers/MatchmakingController.php:63
* @route '/matchmaking/status'
*/
status.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MatchmakingController::status
* @see app/Http/Controllers/MatchmakingController.php:63
* @route '/matchmaking/status'
*/
status.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\MatchmakingController::status
* @see app/Http/Controllers/MatchmakingController.php:63
* @route '/matchmaking/status'
*/
const statusForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MatchmakingController::status
* @see app/Http/Controllers/MatchmakingController.php:63
* @route '/matchmaking/status'
*/
statusForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\MatchmakingController::status
* @see app/Http/Controllers/MatchmakingController.php:63
* @route '/matchmaking/status'
*/
statusForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

status.form = statusForm

const matchmaking = {
    show: Object.assign(show, show),
    join: Object.assign(join, join),
    leave: Object.assign(leave, leave),
    status: Object.assign(status, status),
}

export default matchmaking