import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Games\GameController::joinCode
* @see app/Http/Controllers/Games/GameController.php:227
* @route '/games/join'
*/
export const joinCode = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: joinCode.url(options),
    method: 'post',
})

joinCode.definition = {
    methods: ["post"],
    url: '/games/join',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::joinCode
* @see app/Http/Controllers/Games/GameController.php:227
* @route '/games/join'
*/
joinCode.url = (options?: RouteQueryOptions) => {
    return joinCode.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::joinCode
* @see app/Http/Controllers/Games/GameController.php:227
* @route '/games/join'
*/
joinCode.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: joinCode.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::joinCode
* @see app/Http/Controllers/Games/GameController.php:227
* @route '/games/join'
*/
const joinCodeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: joinCode.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::joinCode
* @see app/Http/Controllers/Games/GameController.php:227
* @route '/games/join'
*/
joinCodeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: joinCode.url(options),
    method: 'post',
})

joinCode.form = joinCodeForm

/**
* @see \App\Http\Controllers\Games\GameController::show
* @see app/Http/Controllers/Games/GameController.php:178
* @route '/games/{game}'
*/
export const show = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/games/{game}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Games\GameController::show
* @see app/Http/Controllers/Games/GameController.php:178
* @route '/games/{game}'
*/
show.url = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { game: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { game: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            game: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        game: typeof args.game === 'object'
        ? args.game.uuid
        : args.game,
    }

    return show.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::show
* @see app/Http/Controllers/Games/GameController.php:178
* @route '/games/{game}'
*/
show.get = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::show
* @see app/Http/Controllers/Games/GameController.php:178
* @route '/games/{game}'
*/
show.head = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Games\GameController::show
* @see app/Http/Controllers/Games/GameController.php:178
* @route '/games/{game}'
*/
const showForm = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::show
* @see app/Http/Controllers/Games/GameController.php:178
* @route '/games/{game}'
*/
showForm.get = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::show
* @see app/Http/Controllers/Games/GameController.php:178
* @route '/games/{game}'
*/
showForm.head = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Games\GameController::join
* @see app/Http/Controllers/Games/GameController.php:209
* @route '/games/{game}/join'
*/
export const join = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: join.url(args, options),
    method: 'post',
})

join.definition = {
    methods: ["post"],
    url: '/games/{game}/join',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::join
* @see app/Http/Controllers/Games/GameController.php:209
* @route '/games/{game}/join'
*/
join.url = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { game: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { game: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            game: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        game: typeof args.game === 'object'
        ? args.game.uuid
        : args.game,
    }

    return join.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::join
* @see app/Http/Controllers/Games/GameController.php:209
* @route '/games/{game}/join'
*/
join.post = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: join.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::join
* @see app/Http/Controllers/Games/GameController.php:209
* @route '/games/{game}/join'
*/
const joinForm = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: join.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::join
* @see app/Http/Controllers/Games/GameController.php:209
* @route '/games/{game}/join'
*/
joinForm.post = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: join.url(args, options),
    method: 'post',
})

join.form = joinForm

/**
* @see \App\Http\Controllers\Games\GameController::leave
* @see app/Http/Controllers/Games/GameController.php:246
* @route '/games/{game}/leave'
*/
export const leave = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: leave.url(args, options),
    method: 'delete',
})

leave.definition = {
    methods: ["delete"],
    url: '/games/{game}/leave',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Games\GameController::leave
* @see app/Http/Controllers/Games/GameController.php:246
* @route '/games/{game}/leave'
*/
leave.url = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { game: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { game: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            game: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        game: typeof args.game === 'object'
        ? args.game.uuid
        : args.game,
    }

    return leave.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::leave
* @see app/Http/Controllers/Games/GameController.php:246
* @route '/games/{game}/leave'
*/
leave.delete = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: leave.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Games\GameController::leave
* @see app/Http/Controllers/Games/GameController.php:246
* @route '/games/{game}/leave'
*/
const leaveForm = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: leave.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::leave
* @see app/Http/Controllers/Games/GameController.php:246
* @route '/games/{game}/leave'
*/
leaveForm.delete = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: leave.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'DELETE',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

leave.form = leaveForm

/**
* @see \App\Http\Controllers\Games\GameController::spectate
* @see app/Http/Controllers/Games/GameController.php:315
* @route '/games/{game}/spectate'
*/
export const spectate = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: spectate.url(args, options),
    method: 'get',
})

spectate.definition = {
    methods: ["get","head"],
    url: '/games/{game}/spectate',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Games\GameController::spectate
* @see app/Http/Controllers/Games/GameController.php:315
* @route '/games/{game}/spectate'
*/
spectate.url = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { game: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { game: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            game: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        game: typeof args.game === 'object'
        ? args.game.uuid
        : args.game,
    }

    return spectate.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::spectate
* @see app/Http/Controllers/Games/GameController.php:315
* @route '/games/{game}/spectate'
*/
spectate.get = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: spectate.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectate
* @see app/Http/Controllers/Games/GameController.php:315
* @route '/games/{game}/spectate'
*/
spectate.head = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: spectate.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectate
* @see app/Http/Controllers/Games/GameController.php:315
* @route '/games/{game}/spectate'
*/
const spectateForm = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: spectate.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectate
* @see app/Http/Controllers/Games/GameController.php:315
* @route '/games/{game}/spectate'
*/
spectateForm.get = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: spectate.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectate
* @see app/Http/Controllers/Games/GameController.php:315
* @route '/games/{game}/spectate'
*/
spectateForm.head = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: spectate.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

spectate.form = spectateForm

/**
* @see \App\Http\Controllers\Games\GameController::spectateSnapshot
* @see app/Http/Controllers/Games/GameController.php:329
* @route '/games/{game}/spectate-snapshot'
*/
export const spectateSnapshot = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: spectateSnapshot.url(args, options),
    method: 'get',
})

spectateSnapshot.definition = {
    methods: ["get","head"],
    url: '/games/{game}/spectate-snapshot',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Games\GameController::spectateSnapshot
* @see app/Http/Controllers/Games/GameController.php:329
* @route '/games/{game}/spectate-snapshot'
*/
spectateSnapshot.url = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { game: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { game: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            game: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        game: typeof args.game === 'object'
        ? args.game.uuid
        : args.game,
    }

    return spectateSnapshot.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::spectateSnapshot
* @see app/Http/Controllers/Games/GameController.php:329
* @route '/games/{game}/spectate-snapshot'
*/
spectateSnapshot.get = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: spectateSnapshot.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectateSnapshot
* @see app/Http/Controllers/Games/GameController.php:329
* @route '/games/{game}/spectate-snapshot'
*/
spectateSnapshot.head = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: spectateSnapshot.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectateSnapshot
* @see app/Http/Controllers/Games/GameController.php:329
* @route '/games/{game}/spectate-snapshot'
*/
const spectateSnapshotForm = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: spectateSnapshot.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectateSnapshot
* @see app/Http/Controllers/Games/GameController.php:329
* @route '/games/{game}/spectate-snapshot'
*/
spectateSnapshotForm.get = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: spectateSnapshot.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectateSnapshot
* @see app/Http/Controllers/Games/GameController.php:329
* @route '/games/{game}/spectate-snapshot'
*/
spectateSnapshotForm.head = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: spectateSnapshot.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

spectateSnapshot.form = spectateSnapshotForm

/**
* @see \App\Http\Controllers\Games\GameController::play
* @see app/Http/Controllers/Games/GameController.php:295
* @route '/games/{game}/play'
*/
export const play = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: play.url(args, options),
    method: 'get',
})

play.definition = {
    methods: ["get","head"],
    url: '/games/{game}/play',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Games\GameController::play
* @see app/Http/Controllers/Games/GameController.php:295
* @route '/games/{game}/play'
*/
play.url = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { game: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { game: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            game: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        game: typeof args.game === 'object'
        ? args.game.uuid
        : args.game,
    }

    return play.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::play
* @see app/Http/Controllers/Games/GameController.php:295
* @route '/games/{game}/play'
*/
play.get = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: play.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::play
* @see app/Http/Controllers/Games/GameController.php:295
* @route '/games/{game}/play'
*/
play.head = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: play.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Games\GameController::play
* @see app/Http/Controllers/Games/GameController.php:295
* @route '/games/{game}/play'
*/
const playForm = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: play.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::play
* @see app/Http/Controllers/Games/GameController.php:295
* @route '/games/{game}/play'
*/
playForm.get = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: play.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::play
* @see app/Http/Controllers/Games/GameController.php:295
* @route '/games/{game}/play'
*/
playForm.head = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: play.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

play.form = playForm

/**
* @see \App\Http\Controllers\Games\GameController::snapshot
* @see app/Http/Controllers/Games/GameController.php:340
* @route '/games/{game}/snapshot'
*/
export const snapshot = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: snapshot.url(args, options),
    method: 'get',
})

snapshot.definition = {
    methods: ["get","head"],
    url: '/games/{game}/snapshot',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Games\GameController::snapshot
* @see app/Http/Controllers/Games/GameController.php:340
* @route '/games/{game}/snapshot'
*/
snapshot.url = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { game: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { game: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            game: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        game: typeof args.game === 'object'
        ? args.game.uuid
        : args.game,
    }

    return snapshot.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::snapshot
* @see app/Http/Controllers/Games/GameController.php:340
* @route '/games/{game}/snapshot'
*/
snapshot.get = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: snapshot.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::snapshot
* @see app/Http/Controllers/Games/GameController.php:340
* @route '/games/{game}/snapshot'
*/
snapshot.head = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: snapshot.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Games\GameController::snapshot
* @see app/Http/Controllers/Games/GameController.php:340
* @route '/games/{game}/snapshot'
*/
const snapshotForm = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: snapshot.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::snapshot
* @see app/Http/Controllers/Games/GameController.php:340
* @route '/games/{game}/snapshot'
*/
snapshotForm.get = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: snapshot.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::snapshot
* @see app/Http/Controllers/Games/GameController.php:340
* @route '/games/{game}/snapshot'
*/
snapshotForm.head = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: snapshot.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

snapshot.form = snapshotForm

/**
* @see \App\Http\Controllers\Games\GameController::orders
* @see app/Http/Controllers/Games/GameController.php:370
* @route '/games/{game}/orders'
*/
export const orders = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: orders.url(args, options),
    method: 'post',
})

orders.definition = {
    methods: ["post"],
    url: '/games/{game}/orders',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::orders
* @see app/Http/Controllers/Games/GameController.php:370
* @route '/games/{game}/orders'
*/
orders.url = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { game: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { game: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            game: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        game: typeof args.game === 'object'
        ? args.game.uuid
        : args.game,
    }

    return orders.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::orders
* @see app/Http/Controllers/Games/GameController.php:370
* @route '/games/{game}/orders'
*/
orders.post = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: orders.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::orders
* @see app/Http/Controllers/Games/GameController.php:370
* @route '/games/{game}/orders'
*/
const ordersForm = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: orders.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::orders
* @see app/Http/Controllers/Games/GameController.php:370
* @route '/games/{game}/orders'
*/
ordersForm.post = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: orders.url(args, options),
    method: 'post',
})

orders.form = ordersForm

/**
* @see \App\Http\Controllers\Games\GameController::cityRecruitment
* @see app/Http/Controllers/Games/GameController.php:385
* @route '/games/{game}/city-recruitment'
*/
export const cityRecruitment = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cityRecruitment.url(args, options),
    method: 'post',
})

cityRecruitment.definition = {
    methods: ["post"],
    url: '/games/{game}/city-recruitment',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::cityRecruitment
* @see app/Http/Controllers/Games/GameController.php:385
* @route '/games/{game}/city-recruitment'
*/
cityRecruitment.url = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { game: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { game: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            game: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        game: typeof args.game === 'object'
        ? args.game.uuid
        : args.game,
    }

    return cityRecruitment.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::cityRecruitment
* @see app/Http/Controllers/Games/GameController.php:385
* @route '/games/{game}/city-recruitment'
*/
cityRecruitment.post = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cityRecruitment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::cityRecruitment
* @see app/Http/Controllers/Games/GameController.php:385
* @route '/games/{game}/city-recruitment'
*/
const cityRecruitmentForm = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cityRecruitment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::cityRecruitment
* @see app/Http/Controllers/Games/GameController.php:385
* @route '/games/{game}/city-recruitment'
*/
cityRecruitmentForm.post = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: cityRecruitment.url(args, options),
    method: 'post',
})

cityRecruitment.form = cityRecruitmentForm

/**
* @see \App\Http\Controllers\Games\GameController::playerProduction
* @see app/Http/Controllers/Games/GameController.php:446
* @route '/games/{game}/player-production'
*/
export const playerProduction = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: playerProduction.url(args, options),
    method: 'post',
})

playerProduction.definition = {
    methods: ["post"],
    url: '/games/{game}/player-production',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::playerProduction
* @see app/Http/Controllers/Games/GameController.php:446
* @route '/games/{game}/player-production'
*/
playerProduction.url = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { game: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { game: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            game: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        game: typeof args.game === 'object'
        ? args.game.uuid
        : args.game,
    }

    return playerProduction.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::playerProduction
* @see app/Http/Controllers/Games/GameController.php:446
* @route '/games/{game}/player-production'
*/
playerProduction.post = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: playerProduction.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::playerProduction
* @see app/Http/Controllers/Games/GameController.php:446
* @route '/games/{game}/player-production'
*/
const playerProductionForm = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: playerProduction.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::playerProduction
* @see app/Http/Controllers/Games/GameController.php:446
* @route '/games/{game}/player-production'
*/
playerProductionForm.post = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: playerProduction.url(args, options),
    method: 'post',
})

playerProduction.form = playerProductionForm

/**
* @see \App\Http\Controllers\Games\GameController::surrender
* @see app/Http/Controllers/Games/GameController.php:512
* @route '/games/{game}/surrender'
*/
export const surrender = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: surrender.url(args, options),
    method: 'post',
})

surrender.definition = {
    methods: ["post"],
    url: '/games/{game}/surrender',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::surrender
* @see app/Http/Controllers/Games/GameController.php:512
* @route '/games/{game}/surrender'
*/
surrender.url = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { game: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { game: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            game: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        game: typeof args.game === 'object'
        ? args.game.uuid
        : args.game,
    }

    return surrender.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::surrender
* @see app/Http/Controllers/Games/GameController.php:512
* @route '/games/{game}/surrender'
*/
surrender.post = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: surrender.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::surrender
* @see app/Http/Controllers/Games/GameController.php:512
* @route '/games/{game}/surrender'
*/
const surrenderForm = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: surrender.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::surrender
* @see app/Http/Controllers/Games/GameController.php:512
* @route '/games/{game}/surrender'
*/
surrenderForm.post = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: surrender.url(args, options),
    method: 'post',
})

surrender.form = surrenderForm

/**
* @see \App\Http\Controllers\Games\GameController::chat
* @see app/Http/Controllers/Games/GameController.php:421
* @route '/games/{game}/chat'
*/
export const chat = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: chat.url(args, options),
    method: 'post',
})

chat.definition = {
    methods: ["post"],
    url: '/games/{game}/chat',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::chat
* @see app/Http/Controllers/Games/GameController.php:421
* @route '/games/{game}/chat'
*/
chat.url = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { game: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { game: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            game: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        game: typeof args.game === 'object'
        ? args.game.uuid
        : args.game,
    }

    return chat.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::chat
* @see app/Http/Controllers/Games/GameController.php:421
* @route '/games/{game}/chat'
*/
chat.post = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: chat.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::chat
* @see app/Http/Controllers/Games/GameController.php:421
* @route '/games/{game}/chat'
*/
const chatForm = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: chat.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::chat
* @see app/Http/Controllers/Games/GameController.php:421
* @route '/games/{game}/chat'
*/
chatForm.post = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: chat.url(args, options),
    method: 'post',
})

chat.form = chatForm

/**
* @see \App\Http\Controllers\Games\GameController::replay
* @see app/Http/Controllers/Games/GameController.php:403
* @route '/games/{game}/replay'
*/
export const replay = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: replay.url(args, options),
    method: 'get',
})

replay.definition = {
    methods: ["get","head"],
    url: '/games/{game}/replay',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Games\GameController::replay
* @see app/Http/Controllers/Games/GameController.php:403
* @route '/games/{game}/replay'
*/
replay.url = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { game: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { game: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            game: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        game: typeof args.game === 'object'
        ? args.game.uuid
        : args.game,
    }

    return replay.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::replay
* @see app/Http/Controllers/Games/GameController.php:403
* @route '/games/{game}/replay'
*/
replay.get = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: replay.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::replay
* @see app/Http/Controllers/Games/GameController.php:403
* @route '/games/{game}/replay'
*/
replay.head = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: replay.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Games\GameController::replay
* @see app/Http/Controllers/Games/GameController.php:403
* @route '/games/{game}/replay'
*/
const replayForm = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: replay.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::replay
* @see app/Http/Controllers/Games/GameController.php:403
* @route '/games/{game}/replay'
*/
replayForm.get = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: replay.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::replay
* @see app/Http/Controllers/Games/GameController.php:403
* @route '/games/{game}/replay'
*/
replayForm.head = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: replay.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

replay.form = replayForm

/**
* @see \App\Http\Controllers\Games\GameController::store
* @see app/Http/Controllers/Games/GameController.php:161
* @route '/games'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/games',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::store
* @see app/Http/Controllers/Games/GameController.php:161
* @route '/games'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::store
* @see app/Http/Controllers/Games/GameController.php:161
* @route '/games'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::store
* @see app/Http/Controllers/Games/GameController.php:161
* @route '/games'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::store
* @see app/Http/Controllers/Games/GameController.php:161
* @route '/games'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\Games\GameController::start
* @see app/Http/Controllers/Games/GameController.php:256
* @route '/games/{game}/start'
*/
export const start = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: start.url(args, options),
    method: 'post',
})

start.definition = {
    methods: ["post"],
    url: '/games/{game}/start',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::start
* @see app/Http/Controllers/Games/GameController.php:256
* @route '/games/{game}/start'
*/
start.url = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { game: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { game: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            game: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        game: typeof args.game === 'object'
        ? args.game.uuid
        : args.game,
    }

    return start.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::start
* @see app/Http/Controllers/Games/GameController.php:256
* @route '/games/{game}/start'
*/
start.post = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: start.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::start
* @see app/Http/Controllers/Games/GameController.php:256
* @route '/games/{game}/start'
*/
const startForm = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: start.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::start
* @see app/Http/Controllers/Games/GameController.php:256
* @route '/games/{game}/start'
*/
startForm.post = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: start.url(args, options),
    method: 'post',
})

start.form = startForm

/**
* @see \App\Http\Controllers\Games\GameController::playerProfile
* @see app/Http/Controllers/Games/GameController.php:263
* @route '/games/{game}/player-profile'
*/
export const playerProfile = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: playerProfile.url(args, options),
    method: 'patch',
})

playerProfile.definition = {
    methods: ["patch"],
    url: '/games/{game}/player-profile',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Games\GameController::playerProfile
* @see app/Http/Controllers/Games/GameController.php:263
* @route '/games/{game}/player-profile'
*/
playerProfile.url = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { game: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'uuid' in args) {
        args = { game: args.uuid }
    }

    if (Array.isArray(args)) {
        args = {
            game: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        game: typeof args.game === 'object'
        ? args.game.uuid
        : args.game,
    }

    return playerProfile.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::playerProfile
* @see app/Http/Controllers/Games/GameController.php:263
* @route '/games/{game}/player-profile'
*/
playerProfile.patch = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: playerProfile.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Games\GameController::playerProfile
* @see app/Http/Controllers/Games/GameController.php:263
* @route '/games/{game}/player-profile'
*/
const playerProfileForm = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: playerProfile.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::playerProfile
* @see app/Http/Controllers/Games/GameController.php:263
* @route '/games/{game}/player-profile'
*/
playerProfileForm.patch = (args: { game: string | number | { uuid: string | number } } | [game: string | number | { uuid: string | number } ] | string | number | { uuid: string | number }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: playerProfile.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

playerProfile.form = playerProfileForm

const games = {
    joinCode: Object.assign(joinCode, joinCode),
    show: Object.assign(show, show),
    join: Object.assign(join, join),
    leave: Object.assign(leave, leave),
    spectate: Object.assign(spectate, spectate),
    spectateSnapshot: Object.assign(spectateSnapshot, spectateSnapshot),
    play: Object.assign(play, play),
    snapshot: Object.assign(snapshot, snapshot),
    orders: Object.assign(orders, orders),
    cityRecruitment: Object.assign(cityRecruitment, cityRecruitment),
    playerProduction: Object.assign(playerProduction, playerProduction),
    surrender: Object.assign(surrender, surrender),
    chat: Object.assign(chat, chat),
    replay: Object.assign(replay, replay),
    store: Object.assign(store, store),
    start: Object.assign(start, start),
    playerProfile: Object.assign(playerProfile, playerProfile),
}

export default games