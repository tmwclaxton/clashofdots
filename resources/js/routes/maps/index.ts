import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Maps\MapController::explore
* @see app/Http/Controllers/Maps/MapController.php:29
* @route '/maps/explore'
*/
export const explore = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: explore.url(options),
    method: 'get',
})

explore.definition = {
    methods: ["get","head"],
    url: '/maps/explore',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Maps\MapController::explore
* @see app/Http/Controllers/Maps/MapController.php:29
* @route '/maps/explore'
*/
explore.url = (options?: RouteQueryOptions) => {
    return explore.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Maps\MapController::explore
* @see app/Http/Controllers/Maps/MapController.php:29
* @route '/maps/explore'
*/
explore.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: explore.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Maps\MapController::explore
* @see app/Http/Controllers/Maps/MapController.php:29
* @route '/maps/explore'
*/
explore.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: explore.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Maps\MapController::explore
* @see app/Http/Controllers/Maps/MapController.php:29
* @route '/maps/explore'
*/
const exploreForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: explore.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Maps\MapController::explore
* @see app/Http/Controllers/Maps/MapController.php:29
* @route '/maps/explore'
*/
exploreForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: explore.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Maps\MapController::explore
* @see app/Http/Controllers/Maps/MapController.php:29
* @route '/maps/explore'
*/
exploreForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: explore.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

explore.form = exploreForm

/**
* @see \App\Http\Controllers\Maps\MapController::index
* @see app/Http/Controllers/Maps/MapController.php:189
* @route '/maps'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/maps',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Maps\MapController::index
* @see app/Http/Controllers/Maps/MapController.php:189
* @route '/maps'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Maps\MapController::index
* @see app/Http/Controllers/Maps/MapController.php:189
* @route '/maps'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Maps\MapController::index
* @see app/Http/Controllers/Maps/MapController.php:189
* @route '/maps'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Maps\MapController::index
* @see app/Http/Controllers/Maps/MapController.php:189
* @route '/maps'
*/
const indexForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Maps\MapController::index
* @see app/Http/Controllers/Maps/MapController.php:189
* @route '/maps'
*/
indexForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Maps\MapController::index
* @see app/Http/Controllers/Maps/MapController.php:189
* @route '/maps'
*/
indexForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: index.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

index.form = indexForm

/**
* @see \App\Http\Controllers\Maps\MapController::store
* @see app/Http/Controllers/Maps/MapController.php:199
* @route '/maps'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/maps',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Maps\MapController::store
* @see app/Http/Controllers/Maps/MapController.php:199
* @route '/maps'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Maps\MapController::store
* @see app/Http/Controllers/Maps/MapController.php:199
* @route '/maps'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Maps\MapController::store
* @see app/Http/Controllers/Maps/MapController.php:199
* @route '/maps'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Maps\MapController::store
* @see app/Http/Controllers/Maps/MapController.php:199
* @route '/maps'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\Maps\MapController::publish
* @see app/Http/Controllers/Maps/MapController.php:236
* @route '/maps/{map}/publish'
*/
export const publish = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: publish.url(args, options),
    method: 'post',
})

publish.definition = {
    methods: ["post"],
    url: '/maps/{map}/publish',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Maps\MapController::publish
* @see app/Http/Controllers/Maps/MapController.php:236
* @route '/maps/{map}/publish'
*/
publish.url = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
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

    const parsedArgs = {
        map: typeof args.map === 'object'
        ? args.map.uuid
        : args.map,
    }

    return publish.definition.url
            .replace('{map}', parsedArgs.map.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Maps\MapController::publish
* @see app/Http/Controllers/Maps/MapController.php:236
* @route '/maps/{map}/publish'
*/
publish.post = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: publish.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Maps\MapController::publish
* @see app/Http/Controllers/Maps/MapController.php:236
* @route '/maps/{map}/publish'
*/
const publishForm = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: publish.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Maps\MapController::publish
* @see app/Http/Controllers/Maps/MapController.php:236
* @route '/maps/{map}/publish'
*/
publishForm.post = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: publish.url(args, options),
    method: 'post',
})

publish.form = publishForm

/**
* @see \App\Http\Controllers\Maps\MapController::fork
* @see app/Http/Controllers/Maps/MapController.php:246
* @route '/maps/{map}/fork'
*/
export const fork = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: fork.url(args, options),
    method: 'post',
})

fork.definition = {
    methods: ["post"],
    url: '/maps/{map}/fork',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Maps\MapController::fork
* @see app/Http/Controllers/Maps/MapController.php:246
* @route '/maps/{map}/fork'
*/
fork.url = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
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

    const parsedArgs = {
        map: typeof args.map === 'object'
        ? args.map.uuid
        : args.map,
    }

    return fork.definition.url
            .replace('{map}', parsedArgs.map.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Maps\MapController::fork
* @see app/Http/Controllers/Maps/MapController.php:246
* @route '/maps/{map}/fork'
*/
fork.post = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: fork.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Maps\MapController::fork
* @see app/Http/Controllers/Maps/MapController.php:246
* @route '/maps/{map}/fork'
*/
const forkForm = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: fork.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Maps\MapController::fork
* @see app/Http/Controllers/Maps/MapController.php:246
* @route '/maps/{map}/fork'
*/
forkForm.post = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: fork.url(args, options),
    method: 'post',
})

fork.form = forkForm

/**
* @see \App\Http\Controllers\Maps\MapController::vote
* @see app/Http/Controllers/Maps/MapController.php:265
* @route '/maps/{map}/vote'
*/
export const vote = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: vote.url(args, options),
    method: 'post',
})

vote.definition = {
    methods: ["post"],
    url: '/maps/{map}/vote',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Maps\MapController::vote
* @see app/Http/Controllers/Maps/MapController.php:265
* @route '/maps/{map}/vote'
*/
vote.url = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
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

    const parsedArgs = {
        map: typeof args.map === 'object'
        ? args.map.uuid
        : args.map,
    }

    return vote.definition.url
            .replace('{map}', parsedArgs.map.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Maps\MapController::vote
* @see app/Http/Controllers/Maps/MapController.php:265
* @route '/maps/{map}/vote'
*/
vote.post = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: vote.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Maps\MapController::vote
* @see app/Http/Controllers/Maps/MapController.php:265
* @route '/maps/{map}/vote'
*/
const voteForm = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: vote.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Maps\MapController::vote
* @see app/Http/Controllers/Maps/MapController.php:265
* @route '/maps/{map}/vote'
*/
voteForm.post = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: vote.url(args, options),
    method: 'post',
})

vote.form = voteForm

/**
* @see \App\Http\Controllers\Maps\MapController::show
* @see app/Http/Controllers/Maps/MapController.php:209
* @route '/maps/{map}'
*/
export const show = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/maps/{map}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Maps\MapController::show
* @see app/Http/Controllers/Maps/MapController.php:209
* @route '/maps/{map}'
*/
show.url = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
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

    const parsedArgs = {
        map: typeof args.map === 'object'
        ? args.map.uuid
        : args.map,
    }

    return show.definition.url
            .replace('{map}', parsedArgs.map.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Maps\MapController::show
* @see app/Http/Controllers/Maps/MapController.php:209
* @route '/maps/{map}'
*/
show.get = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Maps\MapController::show
* @see app/Http/Controllers/Maps/MapController.php:209
* @route '/maps/{map}'
*/
show.head = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Maps\MapController::show
* @see app/Http/Controllers/Maps/MapController.php:209
* @route '/maps/{map}'
*/
const showForm = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Maps\MapController::show
* @see app/Http/Controllers/Maps/MapController.php:209
* @route '/maps/{map}'
*/
showForm.get = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Maps\MapController::show
* @see app/Http/Controllers/Maps/MapController.php:209
* @route '/maps/{map}'
*/
showForm.head = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

show.form = showForm

/**
* @see \App\Http\Controllers\Maps\MapController::update
* @see app/Http/Controllers/Maps/MapController.php:216
* @route '/maps/{map}'
*/
export const update = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

update.definition = {
    methods: ["patch"],
    url: '/maps/{map}',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Maps\MapController::update
* @see app/Http/Controllers/Maps/MapController.php:216
* @route '/maps/{map}'
*/
update.url = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
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

    const parsedArgs = {
        map: typeof args.map === 'object'
        ? args.map.uuid
        : args.map,
    }

    return update.definition.url
            .replace('{map}', parsedArgs.map.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Maps\MapController::update
* @see app/Http/Controllers/Maps/MapController.php:216
* @route '/maps/{map}'
*/
update.patch = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Maps\MapController::update
* @see app/Http/Controllers/Maps/MapController.php:216
* @route '/maps/{map}'
*/
const updateForm = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Maps\MapController::update
* @see app/Http/Controllers/Maps/MapController.php:216
* @route '/maps/{map}'
*/
updateForm.patch = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: update.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

update.form = updateForm

/**
* @see \App\Http\Controllers\Maps\MapController::destroy
* @see app/Http/Controllers/Maps/MapController.php:228
* @route '/maps/{map}'
*/
export const destroy = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/maps/{map}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Maps\MapController::destroy
* @see app/Http/Controllers/Maps/MapController.php:228
* @route '/maps/{map}'
*/
destroy.url = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
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

    const parsedArgs = {
        map: typeof args.map === 'object'
        ? args.map.uuid
        : args.map,
    }

    return destroy.definition.url
            .replace('{map}', parsedArgs.map.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Maps\MapController::destroy
* @see app/Http/Controllers/Maps/MapController.php:228
* @route '/maps/{map}'
*/
destroy.delete = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Maps\MapController::destroy
* @see app/Http/Controllers/Maps/MapController.php:228
* @route '/maps/{map}'
*/
const destroyForm = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Maps\MapController::destroy
* @see app/Http/Controllers/Maps/MapController.php:228
* @route '/maps/{map}'
*/
destroyForm.delete = (args: { map: string | number | { uuid: string | number } } | [map: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: destroy.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

destroy.form = destroyForm

const maps = {
    explore: Object.assign(explore, explore),
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    publish: Object.assign(publish, publish),
    fork: Object.assign(fork, fork),
    vote: Object.assign(vote, vote),
    show: Object.assign(show, show),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
}

export default maps