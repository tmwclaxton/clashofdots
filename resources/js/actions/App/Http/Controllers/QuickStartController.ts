import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\QuickStartController::join
* @see app/Http/Controllers/QuickStartController.php:14
* @route '/quick-start'
*/
export const join = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: join.url(options),
    method: 'post',
})

join.definition = {
    methods: ["post"],
    url: '/quick-start',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\QuickStartController::join
* @see app/Http/Controllers/QuickStartController.php:14
* @route '/quick-start'
*/
join.url = (options?: RouteQueryOptions) => {
    return join.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuickStartController::join
* @see app/Http/Controllers/QuickStartController.php:14
* @route '/quick-start'
*/
join.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: join.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\QuickStartController::join
* @see app/Http/Controllers/QuickStartController.php:14
* @route '/quick-start'
*/
const joinForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: join.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\QuickStartController::join
* @see app/Http/Controllers/QuickStartController.php:14
* @route '/quick-start'
*/
joinForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: join.url(options),
    method: 'post',
})

join.form = joinForm

/**
* @see \App\Http\Controllers\QuickStartController::leave
* @see app/Http/Controllers/QuickStartController.php:41
* @route '/quick-start'
*/
export const leave = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: leave.url(options),
    method: 'delete',
})

leave.definition = {
    methods: ["delete"],
    url: '/quick-start',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\QuickStartController::leave
* @see app/Http/Controllers/QuickStartController.php:41
* @route '/quick-start'
*/
leave.url = (options?: RouteQueryOptions) => {
    return leave.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuickStartController::leave
* @see app/Http/Controllers/QuickStartController.php:41
* @route '/quick-start'
*/
leave.delete = (options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: leave.url(options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\QuickStartController::leave
* @see app/Http/Controllers/QuickStartController.php:41
* @route '/quick-start'
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
* @see \App\Http\Controllers\QuickStartController::leave
* @see app/Http/Controllers/QuickStartController.php:41
* @route '/quick-start'
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
* @see \App\Http\Controllers\QuickStartController::status
* @see app/Http/Controllers/QuickStartController.php:55
* @route '/quick-start/status'
*/
export const status = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

status.definition = {
    methods: ["get","head"],
    url: '/quick-start/status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\QuickStartController::status
* @see app/Http/Controllers/QuickStartController.php:55
* @route '/quick-start/status'
*/
status.url = (options?: RouteQueryOptions) => {
    return status.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\QuickStartController::status
* @see app/Http/Controllers/QuickStartController.php:55
* @route '/quick-start/status'
*/
status.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\QuickStartController::status
* @see app/Http/Controllers/QuickStartController.php:55
* @route '/quick-start/status'
*/
status.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\QuickStartController::status
* @see app/Http/Controllers/QuickStartController.php:55
* @route '/quick-start/status'
*/
const statusForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\QuickStartController::status
* @see app/Http/Controllers/QuickStartController.php:55
* @route '/quick-start/status'
*/
statusForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\QuickStartController::status
* @see app/Http/Controllers/QuickStartController.php:55
* @route '/quick-start/status'
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

const QuickStartController = { join, leave, status }

export default QuickStartController