import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults, validateParameters } from './../wayfinder'
/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
export const home = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: home.url(options),
    method: 'get',
})

home.definition = {
    methods: ["get","head"],
    url: '/',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
home.url = (options?: RouteQueryOptions) => {
    return home.definition.url + queryParams(options)
}

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
home.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: home.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
home.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: home.url(options),
    method: 'head',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
const homeForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: home.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
homeForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: home.url(options),
    method: 'get',
})

/**
* @see \Inertia\Controller::__invoke
* @see vendor/inertiajs/inertia-laravel/src/Controller.php:13
* @route '/'
*/
homeForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: home.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

home.form = homeForm

/**
* @see routes/web.php:16
* @route '/wiki'
*/
export const wiki = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: wiki.url(options),
    method: 'get',
})

wiki.definition = {
    methods: ["get","head"],
    url: '/wiki',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:16
* @route '/wiki'
*/
wiki.url = (options?: RouteQueryOptions) => {
    return wiki.definition.url + queryParams(options)
}

/**
* @see routes/web.php:16
* @route '/wiki'
*/
wiki.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: wiki.url(options),
    method: 'get',
})

/**
* @see routes/web.php:16
* @route '/wiki'
*/
wiki.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: wiki.url(options),
    method: 'head',
})

/**
* @see routes/web.php:16
* @route '/wiki'
*/
const wikiForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: wiki.url(options),
    method: 'get',
})

/**
* @see routes/web.php:16
* @route '/wiki'
*/
wikiForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: wiki.url(options),
    method: 'get',
})

/**
* @see routes/web.php:16
* @route '/wiki'
*/
wikiForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: wiki.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

wiki.form = wikiForm

/**
* @see \App\Http\Controllers\Maps\MapController::mapBuilder
* @see app/Http/Controllers/Maps/MapController.php:122
* @route '/map-builder/{map?}'
*/
export const mapBuilder = (args?: { map?: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mapBuilder.url(args, options),
    method: 'get',
})

mapBuilder.definition = {
    methods: ["get","head"],
    url: '/map-builder/{map?}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Maps\MapController::mapBuilder
* @see app/Http/Controllers/Maps/MapController.php:122
* @route '/map-builder/{map?}'
*/
mapBuilder.url = (args?: { map?: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { map: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { map: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            map: args[0],
        }
    }

    args = applyUrlDefaults(args)

    validateParameters(args, [
        "map",
    ])

    const parsedArgs = {
        map: typeof args?.map === 'object'
        ? args.map.uuid
        : args?.map,
    }

    return mapBuilder.definition.url
            .replace('{map?}', parsedArgs.map?.toString() ?? '')
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Maps\MapController::mapBuilder
* @see app/Http/Controllers/Maps/MapController.php:122
* @route '/map-builder/{map?}'
*/
mapBuilder.get = (args?: { map?: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: mapBuilder.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Maps\MapController::mapBuilder
* @see app/Http/Controllers/Maps/MapController.php:122
* @route '/map-builder/{map?}'
*/
mapBuilder.head = (args?: { map?: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: mapBuilder.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Maps\MapController::mapBuilder
* @see app/Http/Controllers/Maps/MapController.php:122
* @route '/map-builder/{map?}'
*/
const mapBuilderForm = (args?: { map?: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: mapBuilder.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Maps\MapController::mapBuilder
* @see app/Http/Controllers/Maps/MapController.php:122
* @route '/map-builder/{map?}'
*/
mapBuilderForm.get = (args?: { map?: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: mapBuilder.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Maps\MapController::mapBuilder
* @see app/Http/Controllers/Maps/MapController.php:122
* @route '/map-builder/{map?}'
*/
mapBuilderForm.head = (args?: { map?: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: mapBuilder.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

mapBuilder.form = mapBuilderForm

/**
* @see routes/auth.php:9
* @route '/login'
*/
export const login = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})

login.definition = {
    methods: ["get","head"],
    url: '/login',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/auth.php:9
* @route '/login'
*/
login.url = (options?: RouteQueryOptions) => {
    return login.definition.url + queryParams(options)
}

/**
* @see routes/auth.php:9
* @route '/login'
*/
login.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})

/**
* @see routes/auth.php:9
* @route '/login'
*/
login.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: login.url(options),
    method: 'head',
})

/**
* @see routes/auth.php:9
* @route '/login'
*/
const loginForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url(options),
    method: 'get',
})

/**
* @see routes/auth.php:9
* @route '/login'
*/
loginForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url(options),
    method: 'get',
})

/**
* @see routes/auth.php:9
* @route '/login'
*/
loginForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: login.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

login.form = loginForm

/**
* @see routes/auth.php:18
* @route '/logout'
*/
export const logout = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

logout.definition = {
    methods: ["post"],
    url: '/logout',
} satisfies RouteDefinition<["post"]>

/**
* @see routes/auth.php:18
* @route '/logout'
*/
logout.url = (options?: RouteQueryOptions) => {
    return logout.definition.url + queryParams(options)
}

/**
* @see routes/auth.php:18
* @route '/logout'
*/
logout.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: logout.url(options),
    method: 'post',
})

/**
* @see routes/auth.php:18
* @route '/logout'
*/
const logoutForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout.url(options),
    method: 'post',
})

/**
* @see routes/auth.php:18
* @route '/logout'
*/
logoutForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: logout.url(options),
    method: 'post',
})

logout.form = logoutForm
