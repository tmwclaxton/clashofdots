import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Admin\OverviewController::__invoke
* @see app/Http/Controllers/Admin/OverviewController.php:17
* @route '/admin'
*/
const OverviewController = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: OverviewController.url(options),
    method: 'get',
})

OverviewController.definition = {
    methods: ["get","head"],
    url: '/admin',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Admin\OverviewController::__invoke
* @see app/Http/Controllers/Admin/OverviewController.php:17
* @route '/admin'
*/
OverviewController.url = (options?: RouteQueryOptions) => {
    return OverviewController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Admin\OverviewController::__invoke
* @see app/Http/Controllers/Admin/OverviewController.php:17
* @route '/admin'
*/
OverviewController.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: OverviewController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\OverviewController::__invoke
* @see app/Http/Controllers/Admin/OverviewController.php:17
* @route '/admin'
*/
OverviewController.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: OverviewController.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Admin\OverviewController::__invoke
* @see app/Http/Controllers/Admin/OverviewController.php:17
* @route '/admin'
*/
const OverviewControllerForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: OverviewController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\OverviewController::__invoke
* @see app/Http/Controllers/Admin/OverviewController.php:17
* @route '/admin'
*/
OverviewControllerForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: OverviewController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Admin\OverviewController::__invoke
* @see app/Http/Controllers/Admin/OverviewController.php:17
* @route '/admin'
*/
OverviewControllerForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: OverviewController.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

OverviewController.form = OverviewControllerForm

export default OverviewController