import { queryParams, type RouteQueryOptions, type RouteDefinition, type RouteFormDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Games\GameController::lobbies
* @see app/Http/Controllers/Games/GameController.php:28
* @route '/lobbies'
*/
export const lobbies = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: lobbies.url(options),
    method: 'get',
})

lobbies.definition = {
    methods: ["get","head"],
    url: '/lobbies',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Games\GameController::lobbies
* @see app/Http/Controllers/Games/GameController.php:28
* @route '/lobbies'
*/
lobbies.url = (options?: RouteQueryOptions) => {
    return lobbies.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::lobbies
* @see app/Http/Controllers/Games/GameController.php:28
* @route '/lobbies'
*/
lobbies.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: lobbies.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::lobbies
* @see app/Http/Controllers/Games/GameController.php:28
* @route '/lobbies'
*/
lobbies.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: lobbies.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Games\GameController::lobbies
* @see app/Http/Controllers/Games/GameController.php:28
* @route '/lobbies'
*/
const lobbiesForm = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: lobbies.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::lobbies
* @see app/Http/Controllers/Games/GameController.php:28
* @route '/lobbies'
*/
lobbiesForm.get = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: lobbies.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::lobbies
* @see app/Http/Controllers/Games/GameController.php:28
* @route '/lobbies'
*/
lobbiesForm.head = (options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: lobbies.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'HEAD',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'get',
})

lobbies.form = lobbiesForm

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
* @see \App\Http\Controllers\Games\GameController::joinByCode
* @see app/Http/Controllers/Games/GameController.php:201
* @route '/games/join'
*/
export const joinByCode = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: joinByCode.url(options),
    method: 'post',
})

joinByCode.definition = {
    methods: ["post"],
    url: '/games/join',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::joinByCode
* @see app/Http/Controllers/Games/GameController.php:201
* @route '/games/join'
*/
joinByCode.url = (options?: RouteQueryOptions) => {
    return joinByCode.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::joinByCode
* @see app/Http/Controllers/Games/GameController.php:201
* @route '/games/join'
*/
joinByCode.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: joinByCode.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::joinByCode
* @see app/Http/Controllers/Games/GameController.php:201
* @route '/games/join'
*/
const joinByCodeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: joinByCode.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::joinByCode
* @see app/Http/Controllers/Games/GameController.php:201
* @route '/games/join'
*/
joinByCodeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: joinByCode.url(options),
    method: 'post',
})

joinByCode.form = joinByCodeForm

/**
* @see \App\Http\Controllers\Games\GameController::show
* @see app/Http/Controllers/Games/GameController.php:155
* @route '/games/{game}'
*/
export const show = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/games/{game}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Games\GameController::show
* @see app/Http/Controllers/Games/GameController.php:155
* @route '/games/{game}'
*/
show.url = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/Games/GameController.php:155
* @route '/games/{game}'
*/
show.get = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::show
* @see app/Http/Controllers/Games/GameController.php:155
* @route '/games/{game}'
*/
show.head = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Games\GameController::show
* @see app/Http/Controllers/Games/GameController.php:155
* @route '/games/{game}'
*/
const showForm = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::show
* @see app/Http/Controllers/Games/GameController.php:155
* @route '/games/{game}'
*/
showForm.get = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::show
* @see app/Http/Controllers/Games/GameController.php:155
* @route '/games/{game}'
*/
showForm.head = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see app/Http/Controllers/Games/GameController.php:183
* @route '/games/{game}/join'
*/
export const join = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: join.url(args, options),
    method: 'post',
})

join.definition = {
    methods: ["post"],
    url: '/games/{game}/join',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::join
* @see app/Http/Controllers/Games/GameController.php:183
* @route '/games/{game}/join'
*/
join.url = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/Games/GameController.php:183
* @route '/games/{game}/join'
*/
join.post = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: join.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::join
* @see app/Http/Controllers/Games/GameController.php:183
* @route '/games/{game}/join'
*/
const joinForm = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: join.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::join
* @see app/Http/Controllers/Games/GameController.php:183
* @route '/games/{game}/join'
*/
joinForm.post = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: join.url(args, options),
    method: 'post',
})

join.form = joinForm

/**
* @see \App\Http\Controllers\Games\GameController::leave
* @see app/Http/Controllers/Games/GameController.php:220
* @route '/games/{game}/leave'
*/
export const leave = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: leave.url(args, options),
    method: 'delete',
})

leave.definition = {
    methods: ["delete"],
    url: '/games/{game}/leave',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Games\GameController::leave
* @see app/Http/Controllers/Games/GameController.php:220
* @route '/games/{game}/leave'
*/
leave.url = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/Games/GameController.php:220
* @route '/games/{game}/leave'
*/
leave.delete = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: leave.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Games\GameController::leave
* @see app/Http/Controllers/Games/GameController.php:220
* @route '/games/{game}/leave'
*/
const leaveForm = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see app/Http/Controllers/Games/GameController.php:220
* @route '/games/{game}/leave'
*/
leaveForm.delete = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
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
* @see app/Http/Controllers/Games/GameController.php:289
* @route '/games/{game}/spectate'
*/
export const spectate = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: spectate.url(args, options),
    method: 'get',
})

spectate.definition = {
    methods: ["get","head"],
    url: '/games/{game}/spectate',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Games\GameController::spectate
* @see app/Http/Controllers/Games/GameController.php:289
* @route '/games/{game}/spectate'
*/
spectate.url = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/Games/GameController.php:289
* @route '/games/{game}/spectate'
*/
spectate.get = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: spectate.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectate
* @see app/Http/Controllers/Games/GameController.php:289
* @route '/games/{game}/spectate'
*/
spectate.head = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: spectate.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectate
* @see app/Http/Controllers/Games/GameController.php:289
* @route '/games/{game}/spectate'
*/
const spectateForm = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: spectate.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectate
* @see app/Http/Controllers/Games/GameController.php:289
* @route '/games/{game}/spectate'
*/
spectateForm.get = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: spectate.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectate
* @see app/Http/Controllers/Games/GameController.php:289
* @route '/games/{game}/spectate'
*/
spectateForm.head = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see app/Http/Controllers/Games/GameController.php:303
* @route '/games/{game}/spectate-snapshot'
*/
export const spectateSnapshot = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: spectateSnapshot.url(args, options),
    method: 'get',
})

spectateSnapshot.definition = {
    methods: ["get","head"],
    url: '/games/{game}/spectate-snapshot',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Games\GameController::spectateSnapshot
* @see app/Http/Controllers/Games/GameController.php:303
* @route '/games/{game}/spectate-snapshot'
*/
spectateSnapshot.url = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/Games/GameController.php:303
* @route '/games/{game}/spectate-snapshot'
*/
spectateSnapshot.get = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: spectateSnapshot.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectateSnapshot
* @see app/Http/Controllers/Games/GameController.php:303
* @route '/games/{game}/spectate-snapshot'
*/
spectateSnapshot.head = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: spectateSnapshot.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectateSnapshot
* @see app/Http/Controllers/Games/GameController.php:303
* @route '/games/{game}/spectate-snapshot'
*/
const spectateSnapshotForm = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: spectateSnapshot.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectateSnapshot
* @see app/Http/Controllers/Games/GameController.php:303
* @route '/games/{game}/spectate-snapshot'
*/
spectateSnapshotForm.get = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: spectateSnapshot.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::spectateSnapshot
* @see app/Http/Controllers/Games/GameController.php:303
* @route '/games/{game}/spectate-snapshot'
*/
spectateSnapshotForm.head = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see app/Http/Controllers/Games/GameController.php:269
* @route '/games/{game}/play'
*/
export const play = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: play.url(args, options),
    method: 'get',
})

play.definition = {
    methods: ["get","head"],
    url: '/games/{game}/play',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Games\GameController::play
* @see app/Http/Controllers/Games/GameController.php:269
* @route '/games/{game}/play'
*/
play.url = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/Games/GameController.php:269
* @route '/games/{game}/play'
*/
play.get = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: play.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::play
* @see app/Http/Controllers/Games/GameController.php:269
* @route '/games/{game}/play'
*/
play.head = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: play.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Games\GameController::play
* @see app/Http/Controllers/Games/GameController.php:269
* @route '/games/{game}/play'
*/
const playForm = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: play.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::play
* @see app/Http/Controllers/Games/GameController.php:269
* @route '/games/{game}/play'
*/
playForm.get = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: play.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::play
* @see app/Http/Controllers/Games/GameController.php:269
* @route '/games/{game}/play'
*/
playForm.head = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see app/Http/Controllers/Games/GameController.php:314
* @route '/games/{game}/snapshot'
*/
export const snapshot = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: snapshot.url(args, options),
    method: 'get',
})

snapshot.definition = {
    methods: ["get","head"],
    url: '/games/{game}/snapshot',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Games\GameController::snapshot
* @see app/Http/Controllers/Games/GameController.php:314
* @route '/games/{game}/snapshot'
*/
snapshot.url = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/Games/GameController.php:314
* @route '/games/{game}/snapshot'
*/
snapshot.get = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: snapshot.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::snapshot
* @see app/Http/Controllers/Games/GameController.php:314
* @route '/games/{game}/snapshot'
*/
snapshot.head = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: snapshot.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Games\GameController::snapshot
* @see app/Http/Controllers/Games/GameController.php:314
* @route '/games/{game}/snapshot'
*/
const snapshotForm = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: snapshot.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::snapshot
* @see app/Http/Controllers/Games/GameController.php:314
* @route '/games/{game}/snapshot'
*/
snapshotForm.get = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: snapshot.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::snapshot
* @see app/Http/Controllers/Games/GameController.php:314
* @route '/games/{game}/snapshot'
*/
snapshotForm.head = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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
* @see \App\Http\Controllers\Games\GameController::submitOrders
* @see app/Http/Controllers/Games/GameController.php:340
* @route '/games/{game}/orders'
*/
export const submitOrders = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submitOrders.url(args, options),
    method: 'post',
})

submitOrders.definition = {
    methods: ["post"],
    url: '/games/{game}/orders',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::submitOrders
* @see app/Http/Controllers/Games/GameController.php:340
* @route '/games/{game}/orders'
*/
submitOrders.url = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions) => {
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

    return submitOrders.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::submitOrders
* @see app/Http/Controllers/Games/GameController.php:340
* @route '/games/{game}/orders'
*/
submitOrders.post = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: submitOrders.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::submitOrders
* @see app/Http/Controllers/Games/GameController.php:340
* @route '/games/{game}/orders'
*/
const submitOrdersForm = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: submitOrders.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::submitOrders
* @see app/Http/Controllers/Games/GameController.php:340
* @route '/games/{game}/orders'
*/
submitOrdersForm.post = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: submitOrders.url(args, options),
    method: 'post',
})

submitOrders.form = submitOrdersForm

/**
* @see \App\Http\Controllers\Games\GameController::setCityRecruitment
* @see app/Http/Controllers/Games/GameController.php:355
* @route '/games/{game}/city-recruitment'
*/
export const setCityRecruitment = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: setCityRecruitment.url(args, options),
    method: 'post',
})

setCityRecruitment.definition = {
    methods: ["post"],
    url: '/games/{game}/city-recruitment',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::setCityRecruitment
* @see app/Http/Controllers/Games/GameController.php:355
* @route '/games/{game}/city-recruitment'
*/
setCityRecruitment.url = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions) => {
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

    return setCityRecruitment.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::setCityRecruitment
* @see app/Http/Controllers/Games/GameController.php:355
* @route '/games/{game}/city-recruitment'
*/
setCityRecruitment.post = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: setCityRecruitment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::setCityRecruitment
* @see app/Http/Controllers/Games/GameController.php:355
* @route '/games/{game}/city-recruitment'
*/
const setCityRecruitmentForm = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: setCityRecruitment.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::setCityRecruitment
* @see app/Http/Controllers/Games/GameController.php:355
* @route '/games/{game}/city-recruitment'
*/
setCityRecruitmentForm.post = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: setCityRecruitment.url(args, options),
    method: 'post',
})

setCityRecruitment.form = setCityRecruitmentForm

/**
* @see \App\Http\Controllers\Games\GameController::setPlayerProduction
* @see app/Http/Controllers/Games/GameController.php:416
* @route '/games/{game}/player-production'
*/
export const setPlayerProduction = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: setPlayerProduction.url(args, options),
    method: 'post',
})

setPlayerProduction.definition = {
    methods: ["post"],
    url: '/games/{game}/player-production',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::setPlayerProduction
* @see app/Http/Controllers/Games/GameController.php:416
* @route '/games/{game}/player-production'
*/
setPlayerProduction.url = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions) => {
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

    return setPlayerProduction.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::setPlayerProduction
* @see app/Http/Controllers/Games/GameController.php:416
* @route '/games/{game}/player-production'
*/
setPlayerProduction.post = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: setPlayerProduction.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::setPlayerProduction
* @see app/Http/Controllers/Games/GameController.php:416
* @route '/games/{game}/player-production'
*/
const setPlayerProductionForm = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: setPlayerProduction.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::setPlayerProduction
* @see app/Http/Controllers/Games/GameController.php:416
* @route '/games/{game}/player-production'
*/
setPlayerProductionForm.post = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: setPlayerProduction.url(args, options),
    method: 'post',
})

setPlayerProduction.form = setPlayerProductionForm

/**
* @see \App\Http\Controllers\Games\GameController::sendChat
* @see app/Http/Controllers/Games/GameController.php:391
* @route '/games/{game}/chat'
*/
export const sendChat = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendChat.url(args, options),
    method: 'post',
})

sendChat.definition = {
    methods: ["post"],
    url: '/games/{game}/chat',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::sendChat
* @see app/Http/Controllers/Games/GameController.php:391
* @route '/games/{game}/chat'
*/
sendChat.url = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions) => {
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

    return sendChat.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::sendChat
* @see app/Http/Controllers/Games/GameController.php:391
* @route '/games/{game}/chat'
*/
sendChat.post = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendChat.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::sendChat
* @see app/Http/Controllers/Games/GameController.php:391
* @route '/games/{game}/chat'
*/
const sendChatForm = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: sendChat.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::sendChat
* @see app/Http/Controllers/Games/GameController.php:391
* @route '/games/{game}/chat'
*/
sendChatForm.post = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: sendChat.url(args, options),
    method: 'post',
})

sendChat.form = sendChatForm

/**
* @see \App\Http\Controllers\Games\GameController::replay
* @see app/Http/Controllers/Games/GameController.php:373
* @route '/games/{game}/replay'
*/
export const replay = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: replay.url(args, options),
    method: 'get',
})

replay.definition = {
    methods: ["get","head"],
    url: '/games/{game}/replay',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Games\GameController::replay
* @see app/Http/Controllers/Games/GameController.php:373
* @route '/games/{game}/replay'
*/
replay.url = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/Games/GameController.php:373
* @route '/games/{game}/replay'
*/
replay.get = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: replay.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::replay
* @see app/Http/Controllers/Games/GameController.php:373
* @route '/games/{game}/replay'
*/
replay.head = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: replay.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Games\GameController::replay
* @see app/Http/Controllers/Games/GameController.php:373
* @route '/games/{game}/replay'
*/
const replayForm = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: replay.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::replay
* @see app/Http/Controllers/Games/GameController.php:373
* @route '/games/{game}/replay'
*/
replayForm.get = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
    action: replay.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Games\GameController::replay
* @see app/Http/Controllers/Games/GameController.php:373
* @route '/games/{game}/replay'
*/
replayForm.head = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'get'> => ({
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

/**
* @see \App\Http\Controllers\Games\GameController::store
* @see app/Http/Controllers/Games/GameController.php:138
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
* @see app/Http/Controllers/Games/GameController.php:138
* @route '/games'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::store
* @see app/Http/Controllers/Games/GameController.php:138
* @route '/games'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::store
* @see app/Http/Controllers/Games/GameController.php:138
* @route '/games'
*/
const storeForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::store
* @see app/Http/Controllers/Games/GameController.php:138
* @route '/games'
*/
storeForm.post = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: store.url(options),
    method: 'post',
})

store.form = storeForm

/**
* @see \App\Http\Controllers\Games\GameController::start
* @see app/Http/Controllers/Games/GameController.php:230
* @route '/games/{game}/start'
*/
export const start = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: start.url(args, options),
    method: 'post',
})

start.definition = {
    methods: ["post"],
    url: '/games/{game}/start',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Games\GameController::start
* @see app/Http/Controllers/Games/GameController.php:230
* @route '/games/{game}/start'
*/
start.url = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions) => {
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
* @see app/Http/Controllers/Games/GameController.php:230
* @route '/games/{game}/start'
*/
start.post = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: start.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::start
* @see app/Http/Controllers/Games/GameController.php:230
* @route '/games/{game}/start'
*/
const startForm = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: start.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::start
* @see app/Http/Controllers/Games/GameController.php:230
* @route '/games/{game}/start'
*/
startForm.post = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: start.url(args, options),
    method: 'post',
})

start.form = startForm

/**
* @see \App\Http\Controllers\Games\GameController::updatePlayerProfile
* @see app/Http/Controllers/Games/GameController.php:237
* @route '/games/{game}/player-profile'
*/
export const updatePlayerProfile = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatePlayerProfile.url(args, options),
    method: 'patch',
})

updatePlayerProfile.definition = {
    methods: ["patch"],
    url: '/games/{game}/player-profile',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Games\GameController::updatePlayerProfile
* @see app/Http/Controllers/Games/GameController.php:237
* @route '/games/{game}/player-profile'
*/
updatePlayerProfile.url = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions) => {
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

    return updatePlayerProfile.definition.url
            .replace('{game}', parsedArgs.game.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::updatePlayerProfile
* @see app/Http/Controllers/Games/GameController.php:237
* @route '/games/{game}/player-profile'
*/
updatePlayerProfile.patch = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatePlayerProfile.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Games\GameController::updatePlayerProfile
* @see app/Http/Controllers/Games/GameController.php:237
* @route '/games/{game}/player-profile'
*/
const updatePlayerProfileForm = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updatePlayerProfile.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::updatePlayerProfile
* @see app/Http/Controllers/Games/GameController.php:237
* @route '/games/{game}/player-profile'
*/
updatePlayerProfileForm.patch = (args: { game: string | { uuid: string } } | [game: string | { uuid: string } ] | string | { uuid: string }, options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updatePlayerProfile.url(args, {
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

updatePlayerProfile.form = updatePlayerProfileForm

/**
* @see \App\Http\Controllers\Games\GameController::updatePlayerTag
* @see app/Http/Controllers/Games/GameController.php:605
* @route '/player-tag'
*/
export const updatePlayerTag = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatePlayerTag.url(options),
    method: 'patch',
})

updatePlayerTag.definition = {
    methods: ["patch"],
    url: '/player-tag',
} satisfies RouteDefinition<["patch"]>

/**
* @see \App\Http\Controllers\Games\GameController::updatePlayerTag
* @see app/Http/Controllers/Games/GameController.php:605
* @route '/player-tag'
*/
updatePlayerTag.url = (options?: RouteQueryOptions) => {
    return updatePlayerTag.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Games\GameController::updatePlayerTag
* @see app/Http/Controllers/Games/GameController.php:605
* @route '/player-tag'
*/
updatePlayerTag.patch = (options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: updatePlayerTag.url(options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Games\GameController::updatePlayerTag
* @see app/Http/Controllers/Games/GameController.php:605
* @route '/player-tag'
*/
const updatePlayerTagForm = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updatePlayerTag.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Games\GameController::updatePlayerTag
* @see app/Http/Controllers/Games/GameController.php:605
* @route '/player-tag'
*/
updatePlayerTagForm.patch = (options?: RouteQueryOptions): RouteFormDefinition<'post'> => ({
    action: updatePlayerTag.url({
        [options?.mergeQuery ? 'mergeQuery' : 'query']: {
            _method: 'PATCH',
            ...(options?.query ?? options?.mergeQuery ?? {}),
        }
    }),
    method: 'post',
})

updatePlayerTag.form = updatePlayerTagForm

const GameController = { lobbies, ongoing, joinByCode, show, join, leave, spectate, spectateSnapshot, play, snapshot, submitOrders, setCityRecruitment, setPlayerProduction, sendChat, replay, past, store, start, updatePlayerProfile, updatePlayerTag }

export default GameController